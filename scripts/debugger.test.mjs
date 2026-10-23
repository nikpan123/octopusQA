import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { GuidedApiRun } from "./guided-api.mjs";
import { DebuggerFrame } from "./debugger-frame.mjs";
import { buildRunArguments, parseListOutput } from "./test-ui-server.mjs";

let capturedFrame;

async function until(predicate, timeout = 20000) {
  const end = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > end) throw new Error("Nie doczekano oczekiwanego stanu debuggera.");
    await new Promise(resolve => globalThis.setTimeout(resolve, 40));
  }
}

test("debugger rozróżnia możliwości i nie włącza Inspektora dla kroków UI", () => {
  const ui = parseListOutput("[chromium] › school.spec.ts:10:1 › MED-BUG-37204-01: przykład @step-ui")[0];
  assert.equal(ui.debuggerMode, "ui");
  const api = parseListOutput("[chromium] › api.spec.ts:10:1 › ORD-SPEC-35980-08: przykład @step-api")[0];
  assert.equal(api.debuggerMode, "api");
  const args = buildRunArguments({ debug:true, debugger:true, guidedUi:true, selectedTestIds:[ui.id] }).args;
  assert.ok(args.includes("--timeout=0"));
  assert.ok(!args.includes("--debug"));
  assert.ok(args.includes("--workers=1"));
  assert.throws(() => buildRunArguments({debugger:true}));
});

test("kontynuacja zwalnia kroki, a pauza zatrzymuje przed następnym; obraz nie przechodzi do innej sesji", async () => {
  const run = new GuidedApiRun("one");
  run.event({kind:"start",stepId:"a",title:"Pierwszy"});
  const a = run.wait("a");
  run.setContinuous(true);
  assert.deepEqual(await a,{proceed:true});
  run.event({kind:"finish",stepId:"a",status:"passed"});
  run.setContinuous(false);
  run.event({kind:"start",stepId:"b",title:"Drugi"});
  const b = run.wait("b");
  assert.equal(run.snapshot().steps[1].status,"waiting");
  run.close();
  assert.deepEqual(await b,{proceed:false});
  const frame = new DebuggerFrame();
  assert.throws(()=>frame.update("one",Buffer.from("not an image").toString("base64")));
  assert.throws(()=>frame.update("one","a".repeat(900001)));
  frame.update("one",Buffer.from([255,216,0,255,217]).toString("base64"));
  assert.ok(frame.get("one"));
  assert.equal(frame.get("two"),null);
  frame.clear();
  assert.equal(frame.get("one"),null);
});

test("rzeczywisty Playwright UI: bramka przed kliknięciem, obraz JPEG i kontynuacja", {timeout:45000}, async () => {
  const run = new GuidedApiRun("offline-debugger");
  const frame = new DebuggerFrame();
  let probes=0;
  const relay=http.createServer(async(req,res)=>{
    try {
      const chunks=[];for await(const chunk of req) chunks.push(chunk);
      const body=JSON.parse(Buffer.concat(chunks).toString()||"{}");
      const reply=value=>{res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(value));};
      if(req.url==="/probe"){probes++;return reply({ok:true});}
      assert.equal(req.headers["x-guided-key"],run.key);
      assert.equal(body.runId,run.runId);
      if(req.url.endsWith("/wait")) return reply(await run.wait(body.stepId));
      if(req.url==="/api/debugger/frame"){frame.update(body.runId,body.image);return reply({accepted:true});}
      run.event(body);reply({accepted:true});
    }catch(error){res.writeHead(500);res.end(error.message);}
  });
  relay.listen(0,"127.0.0.1");await once(relay,"listening");
  const child=spawn(process.execPath,["node_modules/@playwright/test/cli.js","test","--config=playwright.debugger.config.ts"],{
    cwd:new URL("..",import.meta.url),windowsHide:true,
    env:{...process.env,QA_TEST_DEBUGGER:"1",QA_BROWSER_PREVIEW:"0",PWDEBUG:"0",OCTOPUS_GUIDED_API:"0",OCTOPUS_UI_RUN_ID:run.runId,OCTOPUS_GUIDED_KEY:run.key,OCTOPUS_GUIDED_URL:`http://127.0.0.1:${relay.address().port}`},
  });
  let output="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>output+=chunk);
  const ended=once(child,"close");
  try{
    await until(()=>run.snapshot().steps[0]?.ready);
    assert.equal(probes,0);run.next(run.steps[0].id);
    await until(()=>run.snapshot().steps[1]?.ready);
    await until(()=>frame.get(run.runId));
    assert.equal(probes,0,"Przycisk w aplikacji nie został kliknięty przed Następnym krokiem");
    capturedFrame = frame.get(run.runId);
    assert.ok(frame.get(run.runId).length>1000,"To rzeczywisty zrzut przeglądarki");
    run.next(run.steps[1].id);
    await until(()=>run.snapshot().steps[2]?.ready);
    assert.equal(probes,1);
    run.setContinuous(true);
    const [code]=await ended;
    assert.equal(code,0,output);
    assert.deepEqual(run.steps.map(step=>step.status),["passed","passed","passed"]);
  }catch(error){throw new Error(error.message+'\n'+output+'\n'+JSON.stringify(run.snapshot()),{cause:error});}
  finally{run.close();if(child.exitCode===null)child.kill();relay.closeAllConnections();await new Promise(resolve=>relay.close(resolve));}
});

test("zakładka debuggera: wybór, F10, API, raport i układ mobilny bez startu regresji", async () => {
  const browser=await chromium.launch({channel:"msedge",headless:true});
  const tests=[{id:"MED-BUG-37204-01",title:"Filtrowanie medalu Brak @step-ui",file:"school.spec.ts",debuggerMode:"ui"},{id:"ORD-SPEC-35980-08",title:"Sprawdzenie API @step-api",file:"api.spec.ts",debuggerMode:"api"},{id:"CAT-23",title:"Sortowanie kategorii",file:"category.spec.ts",debuggerMode:"ui",debuggerSteps:"automatic",debuggerTestKey:"cat23-key"},{id:"ADD-20",title:"Dodaj A",file:"add.spec.ts",debuggerMode:"ui",debuggerTestKey:"add-a"},{id:"ADD-20",title:"Dodaj B",file:"add.spec.ts",debuggerMode:"ui",debuggerTestKey:"add-b"}];
  let submitted, nextCalls=0, controls=[], starts=0;
  const status={running:false,run:null};
  try{
    const context=await browser.newContext();
    await context.route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(["/","/app.js","/styles.css"].includes(url.pathname)){
        const file=url.pathname==="/"?"index.html":url.pathname.slice(1);
        return route.fulfill({contentType:file.endsWith("js")?"application/javascript":file.endsWith("css")?"text/css":"text/html",body:await readFile(new URL(`../test-ui/${file}`,import.meta.url),"utf8")});
      }
      let body={};
      if(url.pathname==="/api/tests")body={tests};
      if(url.pathname==="/api/history")body={history:[]};
      if(url.pathname==="/api/scenarios")body={features:[]};
      if(url.pathname==="/api/test-data")body={teachers:[],schools:[]};
      if(url.pathname==="/api/status")body=status;
      if(url.pathname==="/api/performance/latest")body={fileName:"performance-debug-test.json",data:{metrics:{"test.total":{count:1,p50Ms:25031},"fixture.auth":{count:1,p50Ms:8}}}};
      if(url.pathname==="/api/run"){
        submitted=route.request().postDataJSON();status.running=true;status.run={id:`debug-${++starts}`,debugger:true,debugMode:submitted.selectedTestIds[0].startsWith("MED")?"ui":"api",environment:"dev",status:"RUNNING",selectedTestIds:submitted.selectedTestIds,counts:{},guided:{continuous:false,closed:false,steps:[{id:"step-one",title:"Sprawdź formularz",status:"waiting",ready:true,requests:[]}]}};body=status;
      }
      if(url.pathname==="/api/guided/next"){nextCalls++;body={accepted:true};}
      if(url.pathname==="/api/guided/control"){controls.push(route.request().postDataJSON());body={accepted:true};}
      if(url.pathname==="/api/debugger/frame")return capturedFrame ? route.fulfill({contentType:"image/jpeg",body:capturedFrame}) : route.fulfill({status:404,body:""});
      return route.fulfill({contentType:url.pathname==="/api/events"?"text/event-stream":"application/json",body:url.pathname==="/api/events"?"":JSON.stringify(body)});
    });
    const page=await context.newPage();
    await page.addInitScript(()=>{window.EventSource=class {addEventListener(name,handler){if(name==='status')window.__debuggerStatus=handler;}};});
    await page.goto("http://runner.test/#debugger");
    await expect(page.locator("#debugTest option")).toHaveCount(6);
    await page.locator('#debugSearch').fill('CAT-23');
    await expect(page.locator('#debugTest option')).toHaveCount(2);
    await page.locator('#debugTest').selectOption('cat23-key');
    await expect(page.locator('#debugTestDescription')).toContainText('CAT-23');
    await page.locator('#debugSearch').fill('ADD-20');
    await expect(page.locator('#debugTest option')).toHaveCount(3);
    await page.locator('#debugTest').selectOption('add-b');
    await expect(page.locator('#debugTestDescription')).toContainText('Dodaj B');
    await page.locator('#debugSearch').fill('');
    await expect(page.locator(".debugger-setup")).toBeVisible();
    await expect(page.locator(".debugger-session")).toBeHidden();
    for (const theme of ['dark','light']) {
      await page.selectOption('#qa-theme-mode',theme);
      for (const width of [1600,390,320]) {
        await page.setViewportSize({width,height:1000});
        assert.equal(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth>globalThis.innerWidth),false,`setup ${theme} ${width}`);
        if(process.env.QA_DEBUGGER_SCREENSHOTS&&width!==320) await page.screenshot({path:process.env.QA_DEBUGGER_SCREENSHOTS+`/octopus-debugger-setup-${theme}-${width}.png`,fullPage:true});
      }
    }
    await page.setViewportSize({width:1600,height:1000});
    assert.equal(submitted,undefined);
    await page.selectOption("#debugTest","MED-BUG-37204-01");
    page.once("dialog",dialog=>dialog.accept());await page.locator("#debugStart").click();
    await expect.poll(()=>submitted).toMatchObject({debug:true,debugger:true,workers:1,selectedTestIds:["MED-BUG-37204-01"],singleTab:false});
    await expect(page).toHaveURL(/#debugger$/);
    await expect(page.locator(".debugger-setup")).toBeHidden();
    await expect(page.locator(".debugger-session")).toBeVisible();
    await page.locator('#debugHelp').click();
    await expect(page.locator('#debugHelpDialog')).toBeVisible();
    await page.locator('#debugHelpClose').click();
    await expect(page.locator("#debugReport")).toBeHidden();
    await expect(page.locator("#debugStepsFile")).toBeHidden();
    if (capturedFrame) await expect(page.locator("#debugFrame")).toBeVisible();
    if (process.env.QA_DEBUGGER_SCREENSHOTS) {
      await page.setViewportSize({width:1600,height:1100});
      await page.selectOption("#qa-theme-mode","dark");
      await page.screenshot({path:process.env.QA_DEBUGGER_SCREENSHOTS+"/octopus-debugger-ui.png",fullPage:true});
    }
    await page.keyboard.press("F10");await expect.poll(()=>nextCalls).toBe(1);
    await page.keyboard.press("F10");assert.equal(nextCalls,1,"Dwa naciśnięcia nie wyprzedzają tego samego kroku");
    await page.locator("#debugContinue").click();await expect.poll(()=>controls.length).toBe(1);assert.equal(controls[0].continuous,true);
    status.run.guided.continuous=true;
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await page.locator("#debugPause").click();await expect.poll(()=>controls.length).toBe(2);assert.equal(controls[1].continuous,false);
    status.running=false;status.run.status="PASSED";status.run.reportAvailable=true;status.run.reportUrl="/report/debug-one/";status.run.debuggerStepsUrl="/report/debug-one/debugger-steps.json";status.run.guided.closed=true;status.run.guided.steps[0].status="passed";
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator("#debugReport")).toBeVisible();await expect(page.locator("#debugStepsFile")).toBeVisible();
    status.run.performanceFile="performance-debug-test.json";
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator('#debugMetricSource')).toHaveText('performance-debug-test.json');
    await expect(page.locator('#debugMetrics')).toContainText('test.total');
    await page.locator("#debugConfigure").click();
    await page.selectOption("#debugTest","ORD-SPEC-35980-08");page.once("dialog",dialog=>dialog.accept());await page.locator("#debugStart").click();
    await expect(page.locator("#debugModeBadge")).toHaveText("API · W TOKU");
    status.run.guided.steps[0]={id:"api-one",title:"Sprawdź odpowiedź",status:"passed",requests:[{method:"GET",path:"/api/SchoolOrder/One",status:200,response:{quantity:3}}]};
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator("#debugPreviewTitle")).toHaveText("Żądania i odpowiedzi API");
    await page.locator("#debugSteps summary").click();await expect(page.locator("#debugSteps pre")).toContainText('"quantity": 3');
    status.run.guided.steps.push({id:"inspection",title:"Obejrzyj dane przed API",status:"waiting",ready:true,checkpoint:true,requests:[],inspection:{phase:"before",preview:true,message:"Sprawdź dokumenty przed wysłaniem żądania.",schools:[{id:"101",node:"SP",name:"AUTO_SOURCE",role:"Źródło",url:"https://octopus.gwodev.pl/school/school-panel/101",orders:[{id:"401",symbol:"TEST/401",copied:false}]},{id:"102",node:"LO",name:"AUTO_TARGET",role:"Cel",url:"https://octopus.gwodev.pl/school/school-panel/102",orders:[]}],request:{method:"POST",path:"/api/SchoolOrder/MakeSchoolOrderCopy",body:{institutionOrderId:401}}}});
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator('#debugInspection a').first()).toHaveAttribute("href","https://octopus.gwodev.pl/school/school-panel/101");
    await expect(page.locator('#debugInspection')).toContainText("ID 401");
    await expect(page.locator('#debugInspection')).toContainText("Planowane żądanie — jeszcze niewysłane");
    await expect(page.locator('#debugPreviewTitle')).toHaveText("Szkoły i zamówienia · test API");
    status.run.guided.steps.at(-1).inspection.phase="cleanup";
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator('#debugNext')).toContainText("Zatwierdź sprzątanie");
    // Newest first, with chronological numbering; keep an older step under
    // the reader's cursor when a new event prepends another card.
    await page.setViewportSize({width:1600,height:1000});
    await page.locator('.debugger-timeline').evaluate(el=>el.scrollTop=0);
    status.run.guided.steps=Array.from({length:40},(_,i)=>({id:'order-'+(i+1),title:'Etap '+(i+1),status:'passed',requests:[{method:'GET',path:'/api/Example',status:200}]}));
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator('#debugSteps .debugger-step-number').first()).toHaveText('40');
    await expect(page.locator('#debugSteps .debugger-step-number').last()).toHaveText('1');
    await page.locator('#debugSteps details').first().evaluate(el=>el.open=true);
    status.run.guided.steps.push({id:'order-41',title:'Najnowszy etap',status:'waiting',ready:true,requests:[]});
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    await expect(page.locator('#debugSteps .debugger-step-number').first()).toHaveText('41');
    assert.equal(await page.locator('.debugger-timeline').evaluate(el=>el.scrollTop),0);
    await expect(page.locator('#debugSteps details[data-step="order-40"]')).toHaveAttribute('open','');
    await page.locator('.debugger-timeline').evaluate(el=>el.scrollTop=700);
    const anchor=await page.locator('.debugger-timeline').evaluate(el=>{const top=el.getBoundingClientRect().top+el.querySelector('.debugger-timeline-head').offsetHeight;const item=[...el.querySelectorAll('[data-step-id]')].find(x=>x.getBoundingClientRect().bottom>top);return {id:item.dataset.stepId,top:item.getBoundingClientRect().top};});
    status.run.guided.steps.push({id:'order-42',title:'Kolejny etap',status:'waiting',ready:true,requests:[]});
    await page.evaluate(value=>window.__debuggerStatus({data:JSON.stringify(value)}),status);
    const after=await page.locator(`[data-step-id="${anchor.id}"]`).evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(Math.abs(after-anchor.top)<2,'Nowy etap nie przesuwa czytanego wcześniejszego kroku');
    for(const theme of ["dark","light"]){await page.selectOption("#qa-theme-mode",theme);for(const width of [1600,1075,650,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth>globalThis.innerWidth),false,`${theme} ${width}`);if(process.env.QA_DEBUGGER_SCREENSHOTS&&[1600,390].includes(width))await page.screenshot({path:process.env.QA_DEBUGGER_SCREENSHOTS+`/octopus-debugger-${theme}-${width}.png`,fullPage:true});}}
  }finally{await browser.close();}
});
