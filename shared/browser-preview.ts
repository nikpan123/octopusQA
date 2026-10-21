import {test as base, type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {enablePreviewDragging} from './preview-drag.cjs';
import {readPreviewPosition,savePreviewPosition,type PreviewPosition} from './preview-position.cjs';
import {startDebuggerPreview} from './debugger-browser';
export * from '@playwright/test';

type Preview = {title:string;step:string;number:number;action:string;testIndex?:number;totalTests?:number;attempt?:number};
const installed = new WeakSet<object>();
const positionStores=new WeakMap<object,{file:string|undefined;position:PreviewPosition|null}>();
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
    const counter=data.testIndex&&data.totalTests?' · TEST '+data.testIndex+' Z '+data.totalTests:'';
    root.querySelector('small')!.textContent='PODGLĄD TESTU'+counter+(data.attempt&&data.attempt>1?' · PRÓBA '+data.attempt:'')+' · ⠿ PRZECIĄGNIJ';
    host.dataset.testTitle=data.title;host.dataset.step=data.step;host.dataset.action=data.action;
    host.dataset.testIndex=String(data.testIndex||'');host.dataset.totalTests=String(data.totalTests||'');
  });
  document.documentElement.append(host);
}

export const test = base.extend<{qaBrowserPreview:boolean|undefined}>({
  qaBrowserPreview:[undefined,{option:true}],
  page:async({page,headless,qaBrowserPreview},use,testInfo)=>{
    // Inspector already shows the current action. Overlay polling uses evaluate(),
    // which would itself become an extra F10 stop every 100 ms in debug mode.
    const inspector=!!process.env.PWDEBUG&&!['0','false','console'].includes(process.env.PWDEBUG);
    const enabled=!inspector&&(qaBrowserPreview??(process.env.QA_BROWSER_PREVIEW==='1'||(!headless&&process.env.QA_BROWSER_PREVIEW!=='0')));
    const directory=testInfo.config.metadata.qaBrowserPreviewDirectory;
    if(!enabled||typeof directory!=='string'){
      const stopDebugger=await startDebuggerPreview(page,testInfo);
      try{await use(page);}finally{await stopDebugger();}
      return;
    }
    const context=page.context();let stopped=false,busy=false;
    const positionFile=typeof testInfo.config.metadata.qaBrowserPreviewPositionFile==='string'?testInfo.config.metadata.qaBrowserPreviewPositionFile:undefined;
    let positionStore=positionStores.get(context);
    if(!positionStore){
      positionStore={file:positionFile,position:await readPreviewPosition(positionFile)};
      const store=positionStore;
      await context.exposeBinding('__qaSavePreviewPosition',async(_source,value:PreviewPosition)=>{
        if(!value||!Number.isFinite(value.left)||!Number.isFinite(value.top))return false;
        store.position={left:value.left,top:value.top};
        return savePreviewPosition(store.position,store.file);
      });
      positionStores.set(context,store);
    }else positionStore.position=await readPreviewPosition(positionFile);
    const rendered=new WeakMap<Page,string>(),navigationHandlers=new Map<Page,()=>void>();
    let latest:Preview={title:testInfo.title,step:'Przygotowanie testu',number:0,action:'Otwieranie przeglądarki'};
    const update=async(target:Page)=>{
      if(target.isClosed())return;
      const signature=JSON.stringify(latest);if(rendered.get(target)===signature)return;
      try{await target.evaluate(installPreview);await target.evaluate(enablePreviewDragging,positionStore!.position);await target.evaluate(data=>window.dispatchEvent(new CustomEvent('qa-browser-preview-update',{detail:data})),latest);rendered.set(target,signature);}catch{/* Nawigacja lub zamknięta karta. */}
    };
    const refresh=async()=>{
      if(stopped||busy)return;busy=true;
      try{const value=JSON.parse(await readFile(path.join(directory,'worker-'+testInfo.workerIndex+'.json'),'utf8'));if(value.title)latest=value;}catch{/* Reporter może jeszcze nie opublikować pierwszego kroku. */}
      try{await Promise.all(context.pages().map(update));}finally{busy=false;}
    };
    if(!installed.has(context)){await context.addInitScript(installPreview);installed.add(context);}
    const attach=(target:Page)=>{const handler=()=>{rendered.delete(target);void refresh();};navigationHandlers.set(target,handler);target.on('domcontentloaded',handler);void update(target);};
    context.on('page',attach);for(const target of context.pages())attach(target);
    await refresh();const timer=setInterval(()=>void refresh(),100);
    try{await use(page);}finally{
      stopped=true;clearInterval(timer);context.off('page',attach);
      for(const [target,handler] of navigationHandlers)target.off('domcontentloaded',handler);
    }
  }
});
