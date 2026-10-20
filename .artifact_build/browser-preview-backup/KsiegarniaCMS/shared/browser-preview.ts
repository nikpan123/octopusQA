import {test as base, type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export * from '@playwright/test';

type Preview = {title:string;step:string;number:number;action:string};
const installed = new WeakSet<object>();
// Zamknięty Shadow DOM nie dodaje nagłówków ani tekstów do selektorów testowanej aplikacji.
function installPreview() {
  if (window.top !== window || document.getElementById('qa-test-preview')) return;
  if (!document.documentElement) { document.addEventListener('DOMContentLoaded', installPreview, {once:true}); return; }
  const host=document.createElement('div');host.id='qa-test-preview';host.setAttribute('aria-hidden','true');
  host.style.cssText='position:fixed;top:74px;right:14px;z-index:2147483647;width:min(430px,calc(100vw - 28px));pointer-events:none';
  const root=host.attachShadow({mode:'closed'});
  root.innerHTML='<style>:host{font:14px/1.5 system-ui;color:#eef8ff}section{background:#102b3ff2;border:2px solid #5ee1b4;border-radius:12px;padding:14px;box-shadow:0 4px 24px #0005}small{color:#85efc7;letter-spacing:.08em}h3{font-size:14px;margin:5px 0 8px;overflow-wrap:anywhere}p{margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere}</style><section><small>PODGLĄD TESTU</small><h3>Przygotowanie testu</h3><p></p><p></p></section>';
  window.addEventListener('qa-browser-preview-update',event=>{
    const data=(event as CustomEvent<Preview>).detail;
    root.querySelector('h3')!.textContent=data.title;
    root.querySelectorAll('p')[0].textContent=(data.number?'Etap '+data.number+' · ':'')+data.step;
    root.querySelectorAll('p')[1].textContent=data.action;
    host.dataset.testTitle=data.title;host.dataset.step=data.step;host.dataset.action=data.action;
  });
  document.documentElement.append(host);
}

export const test = base.extend<{qaBrowserPreview:boolean|undefined}>({
  qaBrowserPreview:[undefined,{option:true}],
  page:async({page,headless,qaBrowserPreview},use,testInfo)=>{
    const enabled=qaBrowserPreview??(process.env.QA_BROWSER_PREVIEW==='1'||(!headless&&process.env.QA_BROWSER_PREVIEW!=='0'));
    const directory=testInfo.config.metadata.qaBrowserPreviewDirectory;
    if(!enabled||typeof directory!=='string'){await use(page);return;}
    const context=page.context();let stopped=false,busy=false;
    let latest:Preview={title:testInfo.title,step:'Przygotowanie testu',number:0,action:'Otwieranie przeglądarki'};
    const update=async(target:Page)=>{
      if(target.isClosed())return;
      try{await target.evaluate(installPreview);await target.evaluate(data=>window.dispatchEvent(new CustomEvent('qa-browser-preview-update',{detail:data})),latest);}catch{/* Nawigacja lub zamknięta karta. */}
    };
    const refresh=async()=>{
      if(stopped||busy)return;busy=true;
      try{const value=JSON.parse(await readFile(path.join(directory,'worker-'+testInfo.workerIndex+'.json'),'utf8'));if(value.title)latest=value;}catch{}
      try{await Promise.all(context.pages().map(update));}finally{busy=false;}
    };
    if(!installed.has(context)){await context.addInitScript(installPreview);installed.add(context);}
    const attach=(target:Page)=>{target.on('domcontentloaded',onNavigation);void update(target);};
    const onNavigation=()=>{void refresh();};
    context.on('page',attach);for(const target of context.pages())attach(target);
    await refresh();const timer=setInterval(()=>void refresh(),100);
    try{await use(page);}finally{
      stopped=true;clearInterval(timer);context.off('page',attach);
      for(const target of context.pages())target.off('domcontentloaded',onNavigation);
    }
  }
});
