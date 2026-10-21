import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, writeFile, mkdir, open, unlink, realpath, rename} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';
import dotenv from 'dotenv';
import {loadCatalog} from './catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browsers = ['chromium','firefox','webkit'];
const fail = (message,status=400) => Object.assign(new Error(message),{status});
const readJson = async (file,fallback) => {try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}};

export async function createDashboard({projectRoot=root, dataDir=path.join(projectRoot,'.cms')}={}) {
  await mkdir(dataDir,{recursive:true});
  const historyFile=path.join(dataDir,'history.json'), lockFile=path.join(dataDir,'run.lock');
  const envFile=dotenv.parse(await readFile(path.join(projectRoot,'.env'),'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;}));
  const environment={...envFile,...process.env};
  const secrets=Object.entries(environment).filter(([key,v])=>/password|token|secret|api_key/i.test(key)&&v?.length>=4).map(([,v])=>v);
  const sanitize=value=>{let result=String(value).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'');for(const secret of secrets)result=result.split(secret).join('[ukryto]');return result;};
  const token=randomBytes(24).toString('hex');
  let history=await readJson(historyFile,[]), active=null, child=null;
  // A previous abrupt shutdown must not leave a run labelled as still running.
  const existingLock=await readJson(lockFile,null);
  let lockAlive=false;if(existingLock?.pid){try{process.kill(existingLock.pid,0);lockAlive=true;}catch(e){if(e.code!=='ESRCH')throw e;}}
  if(!lockAlive)history=history.map(run=>run.status==='RUNNING'?{...run,status:'INTERRUPTED',finishedAt:new Date().toISOString()}:run);
  let saveQueue=Promise.resolve();
  const persist=()=>{const snapshot=JSON.stringify(history,null,2);saveQueue=saveQueue.then(async()=>{const temporary=historyFile+'.'+randomUUID()+'.tmp';await writeFile(temporary,snapshot);await rename(temporary,historyFile);});return saveQueue;};
  if(!lockAlive)await persist();
  async function acquireLock() {
    for(let attempt=0;attempt<2;attempt++){
      try{const handle=await open(lockFile,'wx');await handle.writeFile(JSON.stringify({pid:process.pid}));await handle.close();return;}
      catch(e){if(e.code!=='EEXIST')throw e;const lock=await readJson(lockFile,{});try{process.kill(lock.pid,0);}catch(error){if(error.code==='ESRCH'){await unlink(lockFile);continue;}throw fail('Nie można sprawdzić blokady uruchomienia.',409);}throw fail('Testy są już uruchomione w innym panelu.',409);}
    }
    throw fail('Nie udało się uzyskać blokady.',409);
  }
  async function launch(body) {
    if(active)throw fail('Poczekaj na zakończenie bieżącego uruchomienia.',409);
    const catalog=await loadCatalog(projectRoot);
    if(!browsers.includes(body.browser))throw fail('Wybierz obsługiwaną przeglądarkę.');
    if(!Array.isArray(body.testIds)||!body.testIds.length||body.testIds.length>catalog.length||body.testIds.some(id=>!catalog.some(t=>t.id===id)))throw fail('Wybierz scenariusze z katalogu.');
    if(typeof body.headed!=='boolean')throw fail('Niepoprawny tryb przeglądarki.');
    if(body.strictAssets!==undefined&&typeof body.strictAssets!=='boolean')throw fail('Niepoprawny tryb kontroli zasobów.');
    const missing=['BASE_URL','USER_NAME','PASSWORD'].filter(key=>!environment[key]?.trim());
    if(missing.length)throw fail('Uzupełnij lokalny plik .env: '+missing.join(', '));
    try{const url=new URL(environment.BASE_URL);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error();}catch{throw fail('BASE_URL musi być adresem HTTP lub HTTPS bez danych logowania.');}
    const chosen=catalog.filter(t=>body.testIds.includes(t.id));
    // Selection is by file; do not silently execute unselected cases after catalog changes.
    const files=[...new Set(chosen.map(t=>t.file))];
    if(catalog.some(t=>files.includes(t.file)&&!body.testIds.includes(t.id)))throw fail('Wybierz wszystkie scenariusze z danego pliku.');
    await acquireLock();
    try{
      const id=randomUUID(),reportDir=path.join(dataDir,'reports',id);
      active={id,title:chosen.length===catalog.length?'Pełny zestaw CMS':chosen.length===1?chosen[0].title:`Wybrane scenariusze (${chosen.length})`,
        project:'cms',startedAt:new Date().toISOString(),status:'RUNNING',browser:body.browser,headed:body.headed,strictAssets:!!body.strictAssets,
        environment:new URL(environment.BASE_URL).host,testIds:chosen.map(t=>t.id),total:chosen.length,results:[],logs:[],counts:{passed:0,failed:0,skipped:0}};
      const run=active;history.unshift(run);await persist();
      const args=[path.join(projectRoot,'node_modules/@playwright/test/cli.js'),'test',...files,'--project='+body.browser,'--workers='+(chosen.every(t=>t.tags.includes('upgrade'))?'2':'1'),
        '--output='+path.join(dataDir,'artifacts',id),'--reporter=list,html,json,./dashboard/reporter.cjs'];
      if(body.headed)args.push('--headed');
      child=spawn(process.execPath,args,{cwd:projectRoot,windowsHide:true,env:{...environment,VIEW_STRICT_ASSETS:body.strictAssets?'1':'0',FORCE_COLOR:'0',PLAYWRIGHT_HTML_OPEN:'never',
        PLAYWRIGHT_HTML_OUTPUT_DIR:reportDir,PLAYWRIGHT_JSON_OUTPUT_FILE:path.join(reportDir,'results.json')},stdio:['ignore','pipe','pipe']});
      let pending='',finished=false;
      const log=line=>{if(line.trim())run.logs.push(sanitize(line).slice(0,4000));if(run.logs.length>1200)run.logs.shift();};
      const consume=line=>{
        if(line.startsWith('CMS_EVENT:')){
          try{const event=JSON.parse(line.slice(10));if(event.type==='begin')run.total=event.total;
            if(event.type==='end')run.runnerStatus=event.status;
            if(event.type==='test'){
              const result={...event};delete result.type;result.title=sanitize(result.title);result.warnings=Array.isArray(result.warnings)?result.warnings.map(w=>({type:w.type,description:sanitize(w.description)})):[];
              const old=run.results.findIndex(r=>r.file===result.file&&r.title===result.title);
              if(old>=0)run.results.splice(old,1,result);else run.results.push(result);
              run.counts={passed:run.results.filter(r=>r.status==='passed').length,failed:run.results.filter(r=>['failed','timedOut','interrupted'].includes(r.status)).length,skipped:run.results.filter(r=>r.status==='skipped').length};
            }
          }catch{log(line);}return;
        }
        log(line);
      };
      child.stdout.on('data',buffer=>{pending+=buffer.toString();const lines=pending.split(/\r?\n/);pending=lines.pop();for(const line of lines)consume(line);});
      child.stderr.on('data',buffer=>buffer.toString().split(/\r?\n/).forEach(log));
      const finish=async(code,error)=>{
        if(finished)return;finished=true;if(pending)consume(pending);if(error)log(error.message);
        run.status=code===0&&run.runnerStatus==='passed'?'PASSED':'FAILED';run.finishedAt=new Date().toISOString();run.exitCode=code;
        run.report='/report/'+id+'/';active=null;child=null;
        try{await persist();}catch(e){console.error('Nie zapisano historii:',e.message);}finally{await unlink(lockFile).catch(()=>{});}
      };
      child.on('error',error=>void finish(null,error));child.on('close',code=>void finish(code));
      return run;
    }catch(e){active=null;child=null;await unlink(lockFile).catch(()=>{});throw e;}
  }
  const server=http.createServer(async(req,res)=>{
    const address=server.address(),origin='http://127.0.0.1:'+address.port;
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    try{
      if(req.headers.host!==new URL(origin).host)throw fail('Panel jest dostępny wyłącznie lokalnie.',403);
      const url=new URL(req.url,origin);
      if(req.method==='POST'){
        if(req.headers.origin!==origin||req.headers['x-cms-token']!==token||!req.headers['content-type']?.includes('application/json'))throw fail('Odśwież panel przed uruchomieniem testów.',403);
        let text='';for await(const chunk of req){text+=chunk;if(text.length>64000)throw fail('Zbyt duże żądanie.',413);}
        let body;try{body=JSON.parse(text);}catch{throw fail('Niepoprawny JSON.');}
        if(url.pathname==='/api/run')return json(202,await launch(body));
        throw fail('Nie znaleziono.',404);
      }
      if(req.method!=='GET')throw fail('Niedozwolona metoda.',405);
      if(url.pathname==='/api/state'){
        let target='';try{target=new URL(environment.BASE_URL).host;}catch{}
        return json(200,{catalog:await loadCatalog(projectRoot),history,active:active?.id||null,browsers,
          configuration:{target,missing:['BASE_URL','USER_NAME','PASSWORD'].filter(key=>!environment[key]?.trim())}});
      }
      if(url.pathname.startsWith('/report/')){
        const match=url.pathname.match(/^\/report\/([a-f0-9-]{36})\/(.*)$/);if(!match||!history.some(r=>r.id===match[1]))throw fail('Nie znaleziono raportu.',404);
        const base=await realpath(path.join(dataDir,'reports',match[1])).catch(()=>{throw fail('Raport nie został wygenerowany. Sprawdź log uruchomienia.',404);});
        const file=await realpath(path.resolve(base,decodeURIComponent(match[2]||'index.html'))).catch(()=>{throw fail('Nie znaleziono pliku raportu.',404);});
        if(!file.startsWith(base+path.sep))throw fail('Niedozwolona ścieżka.',403);
        const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.zip':'application/zip','.webm':'video/webm'}[path.extname(file)]||'application/octet-stream';
        const data=await readFile(file);res.writeHead(200,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});return res.end(data);
      }
      const asset={'/':'index.html','/app.js':'app.js','/style.css':'style.css'}[url.pathname];if(!asset)throw fail('Nie znaleziono.',404);
      let data=await readFile(path.join(root,'dashboard/public',asset),'utf8');if(asset==='index.html')data=data.replace('__TOKEN__',token);
      res.writeHead(200,{'Content-Type':asset.endsWith('.css')?'text/css':asset.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8',
        'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors http://127.0.0.1:4180; object-src 'none'; base-uri 'none'"});res.end(data);
    }catch(e){json(e.status||500,{error:sanitize(e.message)});}
  });
  server.on('close',()=>{if(child)child.kill();});
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=await createDashboard();
  server.listen(Number(process.env.CMS_UI_PORT||4181),'127.0.0.1',()=>console.log('Księgarnia CMS: http://127.0.0.1:'+server.address().port));
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Panel CMS już działa lub port jest zajęty.':e.message);process.exitCode=1;});
}
