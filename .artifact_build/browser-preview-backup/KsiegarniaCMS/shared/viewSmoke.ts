import {expect, test, type Locator, type Page, type TestInfo} from '@playwright/test';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {getBaseURL} from '../config/env';

type Field = {tag: string; type: string; selector: string; label: string};
type Snapshot = {
  headings: {tag: string; text?: string}[];
  tables: {headers: string[]}[];
  fields: Field[];
  buttons: string[];
  empty: string[];
  links: {text: string; path: string}[];
};
type Action = {kind: 'filters' | 'tab'; text: string; tab?: string; snapshot: Snapshot};
export type ViewDefinition = {
  id: string; title: string; path?: string;
  lookup?: {path: string; pattern: string; text: string; via?: {text:string;pattern:string}[]};
  layout?: 'fragment';
  base: Snapshot; actions: Action[]; observedStatus?: number;
};
type Baseline = {views: ViewDefinition[]; navigation: {text: string; path: string}[]};
export function loadViewBaseline(): Baseline {
  return JSON.parse(readFileSync(path.resolve(__dirname, '../config/view-baseline.json'), 'utf8'));
}
const normalized = (value: string) => value.trim().replace(/\s+/g, ' ');
const isProfiler = (url: URL) => /^\/(?:_wdt|_profiler)(?:\/|$)/.test(url.pathname);
const content = (page: Page) => page.locator('#content, main, [role="main"]').first();

/** Compare structure, never current row values, totals or record identifiers. */
export async function assertViewSnapshot(root: Locator, snapshot: Snapshot, testInfo?: TestInfo) {
  await expect(root, 'Główna zawartość widoku').toBeVisible();
  for(const heading of snapshot.headings) {
    const locator = heading.text ? root.locator(heading.tag+':visible').filter({hasText:heading.text}) : root.locator(heading.tag+':visible');
    await expect(locator.first(), `Nagłówek: ${heading.text || heading.tag}`).toBeVisible();
  }
  const visibleTables = root.locator('table:visible');
  const emptyMessage = root.locator('.message').filter({hasText:/nie znaleziono|brak wyników|brak elementów|brak danych/i}).first();
  if(snapshot.tables.length) {
    await expect.poll(async () => (await visibleTables.count()) >= snapshot.tables.length || await emptyMessage.isVisible(), {
      message:'Oczekiwanie na tabele lub jawny komunikat o braku danych',
    }).toBe(true);
    if(await emptyMessage.isVisible() && (await visibleTables.count()) < snapshot.tables.length) {
      testInfo?.annotations.push({type:'coverage', description:'Lista jest pusta: komunikat widoczny, kolumn nie można zweryfikować bez danych.'});
    } else {
      for(let index=0; index<snapshot.tables.length; index++) {
        const table=visibleTables.nth(index);
        await expect(table, `Tabela ${index+1}`).toBeVisible();
        const expected=snapshot.tables[index].headers;
        const actual=(await table.locator('thead th').allTextContents()).map(normalized);
        for(const name of new Set(expected)) {
          const expectedCount=expected.filter(h=>h===name).length;
          expect(actual.filter(h=>h===name).length, `Tabela ${index+1}: kolumna „${name || '(wybór/akcje)'}”`).toBeGreaterThanOrEqual(expectedCount);
        }
      }
    }
  } else if(snapshot.empty.length) {
    await expect.poll(async () => await visibleTables.count() > 0 || await emptyMessage.isVisible(), {
      message:'Lista musi pokazać tabelę albo komunikat o braku danych',
    }).toBe(true);
    testInfo?.annotations.push({type:'coverage',description:'Wzorzec listy zapisano bez rekordów; szczegółowe kolumny wymagają danych.'});
  }
  if(snapshot.fields.length) {
    await expect.poll(() => root.evaluate((container,fields) => {
      const problems: {field:string;issue:string}[]=[];
      for(const field of fields) {
        const element=container.querySelector(field.selector) as HTMLInputElement | null;
        const name=field.label || field.selector;
        if(!element){problems.push({field:name,issue:'Brak pola'});continue;}
        const visible=Array.from(element.getClientRects()).some(rect=>rect.width>0&&rect.height>0)&&getComputedStyle(element).visibility!=='hidden';
        if(!visible)problems.push({field:name,issue:'Pole niewidoczne'});
        if(element.tagName.toLowerCase()!==field.tag)problems.push({field:name,issue:'Zmieniono typ elementu'});
        if(field.type&&element.type!==field.type)problems.push({field:name,issue:'Zmieniono typ pola'});
      }
      return problems;
    },snapshot.fields), {message:'Pola formularza muszą pozostać widoczne i zachować typ'}).toEqual([]);
  }
  if(snapshot.buttons.length) {
    await expect.poll(async () => {
      const actual=(await root.locator('button:visible').allInnerTexts()).map(normalized);
      return snapshot.buttons.filter(button=>!actual.includes(button));
    }, {message:'Brakujące przyciski'}).toEqual([]);
  }
  for(const link of snapshot.links) {
    const locator=root.locator('a[href]').filter({hasText:link.text});
    const paths=await locator.evaluateAll(elements=>elements.map(a=>new URL((a as HTMLAnchorElement).href).pathname.replace(/\/+$/, '') || '/'));
    expect(paths, `Odnośnik: ${link.text}`).toContain(link.path);
  }
}

async function navigate(page: Page, target: string, fragment=false) {
  const base=getBaseURL();
  const url=new URL(target.replace(/^\/+/, ''),base);
  const response=await page.goto(url.toString());
  expect(response, 'Odpowiedź serwera').not.toBeNull();
  expect(response!.status(), `HTTP dla ${url.pathname}`).toBeLessThan(400);
  expect(response!.status()).toBeGreaterThanOrEqual(200);
  await expect(fragment?page.locator('body'):content(page), 'Zawartość CMS po logowaniu').toBeVisible();
  await expect(page.getByRole('button',{name:'Login',exact:true})).not.toBeVisible();
}

export async function checkView(page: Page, viewId: string, testInfo: TestInfo) {
  test.setTimeout(60_000);
  const definition=loadViewBaseline().views.find(v=>v.id===viewId);
  if(!definition) throw new Error('Nieznany widok: '+viewId);
  const errors: string[]=[];
  const failures: {path:string;status:number;type:string}[]=[];
  const blocked: {method:string;path:string;external:boolean}[]=[];
  const origin=new URL(getBaseURL()).origin;
  // MonsieurBiz FormController::renderElementsAction renders editor previews, without saving the form.
  // https://github.com/monsieurbiz/SyliusRichEditorPlugin/blob/2.x/src/Controller/FormController.php
  const previewPath=new URL('monsieurbiz_richeditor/render_elements',getBaseURL()).pathname;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    const url=new URL(response.url());
    if(url.origin===origin && !isProfiler(url) && response.status()>=400) failures.push({path:url.pathname,status:response.status(),type:response.request().resourceType()});
  });
  await page.route('**/*',async route=>{
    const request=route.request();
    const requestedURL=new URL(request.url());
    const editorPreview=request.method()==='POST'&&requestedURL.origin===origin&&requestedURL.pathname===previewPath;
    if(!['GET','HEAD','OPTIONS'].includes(request.method())&&!editorPreview) {
      const requestURL=new URL(request.url());
      blocked.push({method:request.method(),path:requestURL.pathname,external:requestURL.origin!==origin});
      await route.abort('blockedbyclient');
    } else await route.continue();
  });
  try {
    let target=definition.path;
    if(definition.lookup) {
      await test.step('Odnalezienie istniejącego rekordu',async()=>{
        await navigate(page,definition.lookup!.path);
        const steps=[{text:definition.lookup!.text,pattern:definition.lookup!.pattern},...(definition.lookup!.via || [])];
        for(let index=0;index<steps.length;index++) {
          const step=steps[index];
          const candidates=await content(page).locator('a[href]').evaluateAll(elements=>elements.map(a=>({href:a.getAttribute('href') || '',text:(a.textContent || '').trim(),method:a.getAttribute('data-method'),confirmation:a.hasAttribute('data-requires-confirmation')})));
          const found=candidates.find(a=>!a.method&&!a.confirmation&&a.text===step.text&&new RegExp(step.pattern).test(a.href));
          test.skip(!found, 'Brak rekordu/odnośnika: '+step.text+'. Widok nie został zweryfikowany.');
          const url=new URL(found!.href,getBaseURL());
          expect(url.origin,'Odnośnik rekordu musi prowadzić do tego CMS').toBe(origin);
          target=url.pathname+url.search;
          if(index<steps.length-1)await navigate(page,target);
        }
      });
    }
    await test.step('HTTP i zawartość strony',async()=>{
      if(!target)throw new Error('Brak ścieżki widoku');
      await navigate(page,target,definition.layout==='fragment');
    });
    await test.step('Nagłówki, tabele i formularz',()=>assertViewSnapshot(definition.layout==='fragment'?page.locator('body'):content(page),definition.base,testInfo));
    for(const action of definition.actions) {
      await test.step(`${action.kind==='filters'?'Filtry':'Zakładka'}: ${action.text}`,async()=>{
        if(action.kind==='filters') {
          const title=content(page).locator('.ui.accordion > .title').filter({hasText:action.text}).first();
          await expect(title).toBeVisible();
          if(!(await title.getAttribute('class') || '').split(/\s+/).includes('active'))await title.click();
        } else {
          const tab=content(page).locator('a[data-tab],button[type=button][data-tab]').filter({hasText:action.text}).first();
          await expect(tab, `Zakładka: ${action.text}`).toBeVisible();
          await tab.click();
          await expect(content(page).locator(`[data-tab=${JSON.stringify(action.tab)}]:not(a):not(button)`).first(), `Zawartość zakładki: ${action.text}`).toBeVisible();
        }
        await assertViewSnapshot(content(page),action.snapshot,testInfo);
      });
    }
    await test.step('Błędy JavaScript i zasobów aplikacji',async()=>{
      expect(errors,'Nieobsłużone błędy JavaScript').toEqual([]);
      const critical=failures.filter(f=>['script','stylesheet','font','xhr','fetch'].includes(f.type));
      expect(critical,'Błędy skryptów, stylów, fontów lub żądań aplikacji').toEqual([]);
      expect(blocked.filter(request=>!request.external&&request.path!=='/cdn-cgi/rum'),'Widok próbował wysłać żądanie modyfikujące dane aplikacji').toEqual([]);
      if(process.env.VIEW_STRICT_ASSETS==='1') expect(failures,'Wszystkie zasoby, w tym miniatury i obrazy').toEqual([]);
      else if(failures.length)testInfo.annotations.push({type:'assets',description:`Błędy HTTP zasobów (np. obrazów): ${failures.length}. Zobacz diagnostykę; tryb „Struktura i zasoby” oznaczy je jako niezaliczone.`});
    });
  } finally {
    await testInfo.attach('diagnostyka-widoku',{body:JSON.stringify({view:viewId,structureBaselineStatus:definition.observedStatus,strictAssets:process.env.VIEW_STRICT_ASSETS==='1',errors,failures,blocked},null,2),contentType:'application/json'});
  }
}

export async function checkNavigation(page: Page) {
  await navigate(page,'/');
  const menu=page.locator('#sidebar,nav,[role="navigation"]').first();
  await expect(menu,'Menu CMS').toBeVisible();
  for(const item of loadViewBaseline().navigation) {
    await test.step(`Menu: ${item.text}`,async()=>{
      const link=menu.locator('a[href]').filter({hasText:item.text}).first();
      await expect(link).toBeVisible();
      const href=await link.getAttribute('href');
      expect(new URL(href!,getBaseURL()).pathname.replace(/\/+$/, '') || '/').toBe(item.path);
    });
  }
}
