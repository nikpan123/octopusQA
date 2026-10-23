import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {chromium,expect} from '@playwright/test';
const center=path.resolve(fileURLToPath(new URL('../..',import.meta.url)),'Centrum-testow');
const {cleanupPlan,retainedHistory}=await import(pathToFileURL(path.join(center,'report-cleanup.mjs')));
const {createCenter}=await import(pathToFileURL(path.join(center,'server.mjs')));
const row=(id,project='octopus',status='PASSED')=>({id,project,status,title:id,report:'http://127.0.0.1/report/'+id.split(':')[1]+'/',date:'2026-10-20T12:00:00Z'});

test('Czyszczenie chroni ID, migawki, linki, referencje scenariuszy i trwające testy we wszystkich projektach',()=>{
 const history=[row('oct:one'),row('hurt:two','hurtownia'),row('cms:three','cms'),row('oct:four'),row('oct:active','octopus','RUNNING'),row('oct:unknown','octopus','UNKNOWN')];
 const plan=cleanupPlan({history,records:[{kind:'evidence',value:{runId:'oct:one'}},{kind:'check',value:{actual:'Sprawdź '+history[1].report}}],referenceTexts:[JSON.stringify({historicalEvidence:{runId:'cms:three'}})]});
 assert.deepEqual(plan.candidates.map(r=>r.id),['oct:four']);assert.equal(plan.protectedCount,3);assert.equal(plan.activeCount,2);
 assert.throws(()=>cleanupPlan({history,records:[],project:'unknown'}));
 const archived=[{runId:'oct:four',archived:true,snapshot:history[3]}];
 assert(!retainedHistory(history,archived).some(r=>r.id==='oct:four'));
 assert(retainedHistory([],archived,true).some(r=>r.id==='oct:four'));
 assert(retainedHistory([],archived.map(a=>({...a,archived:false}))).some(r=>r.id==='oct:four'));
});

test('API i UI Centrum: podgląd, anulowanie, ochrona dowodów, konflikt, archiwum, trwałość i przywrócenie', {timeout:60000},async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'center-cleanup-'));let server,browser;
 const makeRecord=(kind,value)=>{const db=new DatabaseSync(path.join(directory,'center.sqlite'));try{db.prepare('INSERT INTO records VALUES (?,?,?)').run(value.id,kind,JSON.stringify(value));}finally{db.close();}};
 async function start(){server=await createCenter({dataDir:directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+server.address().port;}
 async function stop(){server.closeAllConnections();await new Promise(r=>server.close(r));}
 try{
  let base=await start();
  const html=await(await fetch(base)).text(),token=html.match(/name="center-token" content="([^"]+)"/)[1];
  const post=(route,body,auth=token)=>fetch(base+route,{method:'POST',headers:{Origin:base,'content-type':'application/json','x-center-token':auth},body:JSON.stringify(body)});
  let plan=await(await fetch(base+'/api/reports/cleanup-preview')).json();
  assert(plan.candidates.length>1,'W lokalnej historii są raporty do przetestowania archiwum w tymczasowej bazie');
  const pinned=plan.candidates[0];
  makeRecord('evidence',{id:'cleanup-evidence',issueId:'cleanup-issue',runId:pinned.id,runSnapshot:pinned});
  assert.equal((await post('/api/reports/archive',{revision:plan.revision,confirm:true})).status,409,'Nowy dowód blokuje stary podgląd');
  plan=await(await fetch(base+'/api/reports/cleanup-preview')).json();
  assert(!plan.candidates.some(r=>r.id===pinned.id));
  assert.equal((await post('/api/reports/archive',{revision:plan.revision,confirm:true},'bad-token')).status,403);
  assert.equal((await post('/api/reports/archive',{revision:plan.revision})).status,400);
  browser=await chromium.launch({channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/#history');
  await page.locator('#cleanup-reports').click();await expect(page.locator('#modal')).toBeVisible();await expect(page.locator('#fields')).toContainText('Pliki i historia w panelach projektów pozostają bez zmian');
  await page.locator('#cancel').click();
  assert.equal((await(await fetch(base+'/api/reports/cleanup-preview')).json()).archived.length,0);
  for(const theme of ['light','dark']){await page.locator('#qa-theme-mode').selectOption(theme);for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.locator('#cleanup-reports').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#cancel').click();}}
  plan=await(await fetch(base+'/api/reports/cleanup-preview')).json();
  const archived=await(await post('/api/reports/archive',{revision:plan.revision,confirm:true})).json();assert.equal(archived.count,plan.candidates.length);
  let state=await(await fetch(base+'/api/state')).json();assert(state.history.some(r=>r.id===pinned.id));assert(!state.history.some(r=>plan.candidates.some(c=>c.id===r.id)));assert.equal(state.evidence.length,1);
  const exported=await(await fetch(base+'/api/export')).json();assert.equal(exported.reportArchive.filter(a=>a.archived).length,archived.count);
  await stop();base=await start();
  let restore=await(await fetch(base+'/api/reports/cleanup-preview')).json();assert.equal(restore.archived.length,archived.count);
  await page.goto(base+'/#history');await page.locator('#restore-reports').click();await expect(page.locator('#modal')).toBeVisible();await page.locator('[name=confirmReports]').check();await page.locator('#save').click();await expect(page.locator('#modal')).not.toBeVisible();
  restore=await(await fetch(base+'/api/reports/cleanup-preview')).json();assert.equal(restore.archived.length,0);
  state=await(await fetch(base+'/api/state')).json();assert(plan.candidates.every(r=>state.history.some(c=>c.id===r.id)));assert.deepEqual(errors,[]);
 }finally{await browser?.close();if(server?.listening)await stop();if(path.dirname(directory)!==path.resolve(tmpdir())||!path.basename(directory).startsWith('center-cleanup-'))throw Error('Niepoprawny katalog testowy');await rm(directory,{recursive:true,force:true});}
});
