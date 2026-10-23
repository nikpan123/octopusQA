import {cleanupPlan,retainedHistory} from './report-cleanup.mjs';
import {validateScenarioChanges} from './scenario-editor.mjs';
import http from 'node:http';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, mkdir, readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID, randomBytes, createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {issueRoutes} from './issues.mjs';
import {cmsCatalog,cmsHistory} from './cms-integration.mjs';
import {saveCollection} from './collections.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
export const roots={cms:process.env.TEST_CENTER_CMS||path.resolve(here,'..','KsiegarniaCMS'),octopus:process.env.TEST_CENTER_OCTOPUS||path.resolve(here,'..','Octopus'),hurtownia:process.env.TEST_CENTER_HURTOWNIA||path.join(homedir(),'Testy','Hurtownia')};
const projects=[{id:'cms',name:'Księgarnia CMS',description:'Sylius · panel administracyjny · Playwright',port:4181,script:'dashboard/server.mjs'},{id:'octopus',name:'Octopus',description:'Przeglądarka · Playwright · DEV / TEST',port:4173,script:'scripts/test-ui-server.mjs'}, {id:'hurtownia',name:'Hurtownia',description:'API · koszyk · katalog · zamówienia',port:18767,script:'dashboard/server.mjs'}];
const suites=[['cart','Koszyk'],['order','Pełne zamówienie'],['catalog','Katalog produktów'],['rounding','Zaokrąglenia cen'],['descriptions','Opisy produktów'],['regression','Regresja koszyka'],['regression-order','Regresja zamówienia'],['packages','Paczki GLS'],['packages-profile','Paczki GLS — konfiguracja CMS'],['product-create','Tworzenie produktu'],['wizard','Zamówienie krok po kroku'],['database','Porównanie zamówienia z bazą']];
export async function catalog(){
 const text=await readFile(path.join(roots.octopus,'docs/tests/scenario-index.md'),'utf8');
 const tests=text.split('\n').flatMap(line=>{
  const m=line.match(/^\| ([^|]+) \| (.*?) \| \[([^\]]+)\]\([^)]*#L(\d+)\) \| (.*?) \|/);
  return m?[{id:'octopus:'+m[1].trim(),code:m[1].trim(),title:m[2].trim(),project:'octopus',type:'automatic',module:m[3].replace('.spec.ts',''),file:'tests/'+m[3],line:Number(m[4]),tags:[...m[5].matchAll(/`([^`]+)`/g)].map(x=>x[1]),source:'Indeks scenariuszy — odświeżany w projekcie Octopus'}]:[];
 });
 const counts=new Map();for(const t of tests)counts.set(t.id,(counts.get(t.id)||0)+1);
 for(const t of tests)if(counts.get(t.id)>1)t.id+=':'+createHash('sha256').update(t.file+'|'+t.title).digest('hex').slice(0,12);
 const redmineTests=await optionalJson(path.join(roots.hurtownia,'config/redmine-tests.json'),[]);
 return [...await cmsCatalog(roots.cms),...tests,...redmineTests.map(t=>({id:'hurtownia:'+t.id,code:t.id,title:t.id+': '+t.title,project:'hurtownia',type:'automatic',module:'API — Redmine',file:'api-tests/'+t.suite+'.mjs',suite:t.suite,tags:['API',t.suite],source:'Scenariusz regresji — uruchom zestaw '+t.suite+' w panelu Hurtowni'})),...suites.map(([code,title])=>({id:'hurtownia:'+code,code,title,project:'hurtownia',type:'automatic',module:'API',tags:['API'],source:'Zestaw testów API — szczegółowe przypadki w raporcie'}))];
}
async function optionalJson(file,fallback){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
export async function importedHistory(){
 const oct=await optionalJson(path.join(roots.octopus,'runs/test-ui-history.json'),[]);
 const rows=oct.map(x=>{const testIds=Array.isArray(x.selectedTestIds)?x.selectedTestIds:[],grep=typeof x.grep==='string'?x.grep:'';const title=testIds.length?'Wybrane testy ('+testIds.length+'): '+testIds.slice(0,2).join(', ')+(testIds.length>2?'…':''):grep?'Filtr: '+grep:x.suiteLabel||x.suite||'Przebieg Octopus';return {id:'oct:'+x.id,title,project:'octopus',date:x.startedAt,status:x.status,environment:x.environment,counts:x.counts,selectedTestIds:testIds,grep,source:'Octopus',report:'http://127.0.0.1:4173/report/'+x.id+'/'};});
 let dirs=[];try{dirs=await readdir(path.join(roots.hurtownia,'raporty-api'),{withFileTypes:true});}catch(e){if(e.code!=='ENOENT')throw e;}
 for(const dir of dirs.filter(x=>x.isDirectory())){
  const x=await optionalJson(path.join(roots.hurtownia,'raporty-api',dir.name,'raport.json'),null);if(!x)continue;
  rows.push({id:'hurt:'+dir.name,title:x.scenario||x.kind||'Testy API',project:'hurtownia',date:x.generatedAt,status:x.status||'UNKNOWN',environment:'dev',source:'Hurtownia',report:'http://127.0.0.1:18767/reports/'+encodeURIComponent(dir.name)+'/raport.html'});
 }
 return [...rows,...await cmsHistory(roots.cms)];
}
export async function createCenter({dataDir=path.join(here,'data')}={}){
 await mkdir(dataDir,{recursive:true});
 const db=new DatabaseSync(path.join(dataDir,'center.sqlite'));
 db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY, name TEXT, bytes BLOB)');
 const token=randomBytes(24).toString('hex'), children=new Map();
 const list=kind=>db.prepare('SELECT payload FROM records WHERE kind=? ORDER BY rowid DESC').all(kind).map(x=>JSON.parse(x.payload));
 const put=(kind,value)=>db.prepare('INSERT INTO records VALUES (?,?,?)').run(value.id,kind,JSON.stringify(value));
 const fail=(message,status=400)=>Object.assign(new Error(message),{status});
 const required=(body,key)=>{if(typeof body[key]!=='string'||!body[key].trim()||body[key].length>20000)throw fail('Uzupełnij pole: '+key);return body[key].trim();};
 const projectOf=body=>{if(!projects.some(x=>x.id===body.project))throw fail('Wybierz projekt.');return body.project;};
 const decorate=tests=>{const docs=new Map(list('scenario-description').map(d=>[d.testId,d]));return tests.map(t=>{const doc=docs.get(t.id);return doc?{...t,title:doc.title,steps:doc.steps.join('\n'),expected:doc.expected,preconditions:doc.preconditions,description:doc.description,data:doc.data,blocker:doc.blocker,manualSteps:doc.steps,descriptionUpdatedAt:doc.descriptionUpdatedAt}:t;});};
 const allTests=async()=>decorate([...await catalog(),...list('test')]);
 async function scenarioCatalog(){const tests=await allTests();return {features:projects.map(p=>({id:p.id,scenarios:tests.filter(t=>t.project===p.id).map(t=>({id:t.id,title:t.title,description:t.description||'',preconditions:t.preconditions||['Dostęp do właściwego środowiska i wymaganych danych testowych.'],steps:t.manualSteps||(t.steps?[t.steps]:['Wybierz test '+t.code+' w panelu projektu, uruchom go i sprawdź raport.']),expected:t.expected||'Warunki kontrolowane przez wybrany test są spełnione.',data:t.data||'',blocker:t.blocker||'',testIds:[t.code]}))})),revision:createHash('sha256').update(JSON.stringify([tests,list('scenario-description')])).digest('hex'),editToken:token};}
 async function cleanupReferences(){
  const files=[path.join(roots.octopus,'test-ui/scenarios.json'),path.join(roots.hurtownia,'dashboard/scenario-catalog.mjs'),path.join(roots.hurtownia,'dashboard/package-scenarios.mjs'),path.join(roots.hurtownia,'config/scenarios.local.json'),path.join(roots.hurtownia,'config/redmine-tests.json'),path.join(roots.cms,'.cms/scenario-overrides.json')];
  return Promise.all(files.map(async file=>{try{return await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return '';throw e;}}));
 }
 const reportHistory=async()=>retainedHistory(await importedHistory(),list('report-archive'));
 async function reportPlan(project=''){
  const [history,referenceTexts]=await Promise.all([importedHistory(),cleanupReferences()]);
  const records=db.prepare('SELECT kind,payload FROM records').all().map(r=>({kind:r.kind,value:JSON.parse(r.payload)}));
  const archives=list('report-archive');
  return cleanupPlan({history:retainedHistory(history,archives,true),records,referenceTexts,archives,project});
 }
 const issueRoute=issueRoutes({list,put,db,fail,required,projectOf,catalog:async()=>decorate(await catalog()),importedHistory:reportHistory});
 async function readBody(req){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>15*1024*1024)throw fail('Maksymalny rozmiar żądania to 15 MB.',413);chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail('Niepoprawne dane.');}}
 async function ensureRunner(id){
  const p=projects.find(x=>x.id===id);if(!p)throw fail('Nieznany projekt.');
  const url='http://127.0.0.1:'+p.port;
  async function ready(){try{const r=await fetch(url,{signal:AbortSignal.timeout(700)});const html=await r.text();if(!r.ok||!(id==='cms'?/Księgarnia CMS/i:id==='octopus'?/Octopus/i:/Hurtownia|Hurtowni/i).test(html))throw fail('Port panelu zajmuje inna aplikacja.',409);return true;}catch(e){if(e.status)throw e;return false;}}
  if(await ready())return url;
  if(!children.has(id)){
   const child=spawn(process.execPath,[path.join(roots[id],p.script)],{cwd:roots[id],env:{...process.env,OCTOPUS_TEST_UI_NO_OPEN:'1'},windowsHide:true,stdio:'ignore'});
   children.set(id,child);child.on('error',()=>children.delete(id));child.on('exit',()=>children.delete(id));
  }
  for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,200));if(await ready())return url;}
  throw fail('Panel projektu nie wystartował. Sprawdź konfigurację projektu.',503);
 }
 const server=http.createServer(async(req,res)=>{
  const origin='http://127.0.0.1:'+server.address().port;
  const json=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
  try{
   if(req.headers.host!==new URL(origin).host)throw fail('Panel jest dostępny wyłącznie lokalnie.',403);
   const url=new URL(req.url,origin);
   if(req.method==='POST'){
    if(req.headers.origin!==origin||req.headers['x-center-token']!==token||!req.headers['content-type']?.includes('application/json'))throw fail('Odśwież panel przed zapisem.',403);
    const b=await readBody(req);
    if(['/api/reports/archive','/api/reports/restore'].includes(url.pathname)){
     const plan=await reportPlan(b.project||'');
     if(b.revision!==plan.revision)throw fail('Lista raportów lub ich powiązania zmieniły się. Otwórz podgląd ponownie.',409);
     if(b.confirm!==true)throw fail('Potwierdź operację na pokazanych raportach.');
     const restoring=url.pathname.endsWith('/restore'),rows=restoring?plan.archived:plan.candidates;
     db.exec('BEGIN');try{
      for(const row of rows){
       const old=list('report-archive').find(a=>a.runId===row.id);
       const value={id:old?.id||randomUUID(),runId:row.id,snapshot:row,archived:!restoring,date:new Date().toISOString()};
       if(old)db.prepare('UPDATE records SET payload=? WHERE id=? AND kind=?').run(JSON.stringify(value),old.id,'report-archive');else put('report-archive',value);
      }
      db.exec('COMMIT');
     }catch(e){db.exec('ROLLBACK');throw e;}
     return json(200,{count:rows.length,action:restoring?'restored':'archived'});
    }
    if(url.pathname==='/api/scenarios/update'){
     if(req.headers['x-scenario-token']!==token)throw fail('Odśwież panel przed zapisem.',403);
     const current=await scenarioCatalog();if(b.revision!==current.revision)throw fail('Scenariusze zmieniły się w innej karcie. Zachowaj tekst i otwórz edycję ponownie.',409);
     const scenario=current.features.find(f=>f.id===b.featureId)?.scenarios.find(t=>t.id===b.scenarioId);if(!scenario)throw fail('Nie znaleziono scenariusza.',404);
     const changes=validateScenarioChanges(b.changes);if(Object.entries(changes).every(([key,value])=>JSON.stringify(scenario[key]??'')===JSON.stringify(value)))return json(200,current);
     const old=list('scenario-description').find(d=>d.testId===b.scenarioId),doc={id:old?.id||randomUUID(),testId:b.scenarioId,project:b.featureId,...changes,descriptionUpdatedAt:new Date().toISOString()};
     db.exec('BEGIN');try{
      put('scenario-revision',{id:randomUUID(),testId:b.scenarioId,previous:old||scenario,date:doc.descriptionUpdatedAt});
      if(old)db.prepare('UPDATE records SET payload=? WHERE id=? AND kind=?').run(JSON.stringify(doc),old.id,'scenario-description');else put('scenario-description',doc);
      const manual=list('test').find(t=>t.id===b.scenarioId);if(manual){Object.assign(manual,{...changes,steps:changes.steps.join('\n'),manualSteps:changes.steps,descriptionUpdatedAt:doc.descriptionUpdatedAt});db.prepare('UPDATE records SET payload=? WHERE id=? AND kind=?').run(JSON.stringify(manual),manual.id,'test');}
      for(const issue of list('issue').filter(i=>i.testIds.includes(b.scenarioId))){issue.scopeUpdatedAt=doc.descriptionUpdatedAt;db.prepare('UPDATE records SET payload=? WHERE id=? AND kind=?').run(JSON.stringify(issue),issue.id,'issue');}
      db.exec('COMMIT');
     }catch(error){db.exec('ROLLBACK');throw error;}
     return json(200,await scenarioCatalog());
    }
    if(['/api/issues','/api/issue-tests','/api/issue-evidence','/api/issue-comments','/api/issue-status'].includes(url.pathname))return json(201,await issueRoute(url.pathname,b));
    if(url.pathname==='/api/collections')return json(201,saveCollection({db,list,put,fail,required,projectOf},b));
    if(url.pathname==='/api/runner')return json(200,{url:await ensureRunner(b.project)});
    if(url.pathname==='/api/tests'){
     const t={id:randomUUID(),code:'MAN-'+randomUUID().slice(0,6).toUpperCase(),type:'manual',title:required(b,'title'),project:projectOf(b),module:required(b,'module'),steps:required(b,'steps'),expected:required(b,'expected'),tags:typeof b.tags==='string'?b.tags.split(',').map(x=>x.trim()).filter(Boolean):[],date:new Date().toISOString()};put('test',t);return json(201,t);
    }
    if(url.pathname==='/api/suites'){
     const tests=[...await catalog(),...list('test')];if(!Array.isArray(b.testIds)||!b.testIds.length||b.testIds.some(id=>!tests.some(t=>t.id===id)))throw fail('Wybierz testy do zestawu.');
     const item={id:randomUUID(),title:required(b,'title'),testIds:[...new Set(b.testIds)],date:new Date().toISOString()};put('suite',item);return json(201,item);
    }
    if(url.pathname==='/api/checks'){
     if(!['PASS','FAIL','BLOCKED','SKIP'].includes(b.status))throw fail('Wybierz wynik.');
     const all=await allTests(),test=b.testId?all.find(t=>t.id===b.testId):null;if(b.testId&&!test)throw fail('Nie znaleziono testu.');
     if(test&&test.project!==b.project)throw fail('Test należy do innego projektu.');
     const issue=b.issueId?list('issue').find(x=>x.id===b.issueId):null;
     if(b.issueId&&(!issue||issue.project!==b.project))throw fail('Zgłoszenie należy do innego projektu lub nie istnieje.');
     const files=b.attachments||[];if(!Array.isArray(files)||files.length>5)throw fail('Dodaj maksymalnie 5 plików.');
     const buffers=files.map(f=>{if(typeof f.name!=='string'||f.name.length>255||typeof f.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(f.data))throw fail('Niepoprawny załącznik.');const bytes=Buffer.from(f.data,'base64');if(bytes.length>2*1024*1024)throw fail('Każdy załącznik może mieć maksymalnie 2 MB.');return {id:randomUUID(),name:f.name,bytes};});
     const item={id:randomUUID(),title:required(b,'title'),project:projectOf(b),bug:typeof b.bug==='string'?b.bug.slice(0,500):'',steps:required(b,'steps'),expected:required(b,'expected'),actual:required(b,'actual'),environment:required(b,'environment'),version:required(b,'version'),status:b.status,date:new Date().toISOString(),testId:test?.id||null,snapshot:test||null,attachments:buffers.map(({id,name})=>({id,name}))};
     item.issueId=issue?.id||null;if(issue)item.bug='#'+issue.number;
     db.exec('BEGIN');try{put('check',item);for(const f of buffers)db.prepare('INSERT INTO attachments VALUES (?,?,?)').run(f.id,f.name,f.bytes);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(201,item);
    }
    throw fail('Nie znaleziono.',404);
   }
   if(req.method!=='GET')throw fail('Nie znaleziono.',404);
   if(url.pathname==='/api/reports/cleanup-preview')return json(200,await reportPlan(url.searchParams.get('project')||''));
   if(url.pathname==='/api/scenarios')return json(200,await scenarioCatalog());
   if(url.pathname==='/api/state'){
    const warnings=[];let automatic=[],history=[];try{automatic=await catalog();}catch(e){warnings.push('Nie udało się odczytać katalogu: '+e.message);}try{history=await reportHistory();}catch(e){warnings.push('Nie udało się odczytać pełnej historii: '+e.message);}
    return json(200,{projects,tests:decorate([...automatic,...list('test')]),suites:list('suite'),checks:list('check'),issues:list('issue'),evidence:list('evidence'),collections:list('collection'),history,warnings});
   }
   if(url.pathname==='/api/export'){
    res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename="centrum-testow-eksport.json"'});return res.end(JSON.stringify({exportedAt:new Date().toISOString(),reportArchive:list('report-archive'),scenarioDescriptions:list('scenario-description'),scenarioRevisions:list('scenario-revision'),tests:list('test'),suites:list('suite'),checks:list('check'),issues:list('issue'),evidence:list('evidence'),collections:list('collection'),attachments:db.prepare('SELECT * FROM attachments').all().map(x=>({...x,bytes:Buffer.from(x.bytes).toString('base64')}))},null,2));
   }
   if(url.pathname.startsWith('/attachments/')){const f=db.prepare('SELECT * FROM attachments WHERE id=?').get(url.pathname.split('/').pop());if(!f)throw fail('Nie znaleziono pliku.',404);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(f.name),'X-Content-Type-Options':'nosniff'});return res.end(Buffer.from(f.bytes));}
   const asset={'/':'index.html','/app.js':'app.js','/issues.js':'issues.js','/issue-status.js':'issue-status.js','/collections.js':'collections.js','/style.css':'style.css','/scenario-editor.js':'scenario-editor.js','/scenario-editor.css':'scenario-editor.css'}[url.pathname];if(!asset)throw fail('Nie znaleziono.',404);
   let data=await readFile(path.join(here,'public',asset),'utf8');if(asset==='index.html')data=data.replace('__TOKEN__',token);
   res.writeHead(200,{'Content-Type':asset.endsWith('.css')?'text/css':asset.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src http://127.0.0.1:4173 http://127.0.0.1:18767 http://127.0.0.1:4181; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(data);
  }catch(e){json(e.status||500,{error:e.message});}
 });
 server.on('close',()=>{for(const child of children.values())child.kill();db.close();});
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await createCenter();server.listen(Number(process.env.TEST_CENTER_PORT||4180),'127.0.0.1',()=>console.log('Centrum testów: http://127.0.0.1:'+server.address().port));
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Centrum już działa: http://127.0.0.1:4180':e.message);process.exit(1);});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
