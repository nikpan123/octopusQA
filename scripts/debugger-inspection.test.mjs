import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { request, expect } from "@playwright/test";
import { GuidedApiRun, safeInspection, safeGuidedValue } from "./guided-api.mjs";
import { guidedOperation, observeGuidedRequests } from "./guided-api-client.mjs";

const inspection = phase => ({
  phase, preview:true, message:"Szkoły testu; obejrzyj dokumenty przed kontynuacją.",
  schools:[{node:"SP",id:"101",name:"AUTO_SOURCE",role:"Źródło",url:"https://octopus.gwodev.pl/school/school-panel/101",orders:[{id:"401",symbol:"TEST/401",copied:false}]}],
  ...(phase === "before" ? {request:{method:"POST",path:"/api/SchoolOrder/MakeSchoolOrderCopy",body:{institutionOrderId:401,authorization:"sensitive"}}} : {}),
});

test("podgląd akceptuje wyłącznie linki szkół Octopusa i usuwa ANSI oraz sekrety", () => {
  const clean = safeInspection(inspection("before"));
  assert.equal(clean.schools[0].id,"101");
  assert.equal(clean.schools[0].orders[0].id,"401");
  assert.equal(JSON.stringify(clean).includes("sensitive"),false);
  assert.throws(()=>safeInspection({...inspection("before"),schools:[{id:"101",url:"javascript:alert(1)"}]}));
  assert.throws(()=>safeInspection({...inspection("before"),schools:[{id:"101",url:"https://octopus.gwodev.pl/school/school-panel/102"}]}));
  assert.equal(safeGuidedValue('\u001b[31mBłąd kontroli\u001b[0m'),"Błąd kontroli");
});

test("przed API i po API obowiązuje pauza, także auto; FAIL nie sprząta przed zgodą użytkownika", {timeout:20000}, async () => {
  const run = new GuidedApiRun("inspection-offline");
  let writes=0,removed=0;
  const server = http.createServer(async(req,res)=>{
    try {
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const body=JSON.parse(Buffer.concat(chunks).toString()||"{}");
      const reply=value=>{res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify(value));};
      if(req.url.startsWith("/api/guided/")){
        assert.equal(req.headers["x-guided-key"],run.key);
        if(req.url.endsWith("wait"))return reply(await run.wait(body.stepId));
        run.event(body);return reply({accepted:true});
      }
      if(req.method==="POST")writes++;
      if(req.method==="DELETE")removed++;
      reply({created:true});
    }catch(error){res.writeHead(500);res.end(error.message);}
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const env={QA_TEST_DEBUGGER:"1",OCTOPUS_GUIDED_API:"1",OCTOPUS_GUIDED_URL:origin,OCTOPUS_GUIDED_KEY:run.key,OCTOPUS_UI_RUN_ID:run.runId};
  const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));
  Object.assign(process.env,env);
  const api=await request.newContext({baseURL:origin});
  const restore=observeGuidedRequests(api);
  let execution;
  try {
    run.setContinuous(true);
    execution=(async()=>{
      await guidedOperation("Przygotuj dane",async()=>{},true);
      try{
        await guidedOperation("Obejrzyj szkoły przed API",async()=>{},false,{checkpoint:true,inspection:inspection("before")});
        const response=await guidedOperation("Wyślij żądanie",()=>api.post("/api/SchoolOrder/MakeSchoolOrderCopy",{data:{institutionOrderId:401}}));
        await guidedOperation("Obejrzyj stan po API",async()=>{},false,{checkpoint:true,inspection:inspection("after")});
        await guidedOperation("Oceń wynik",async()=>{assert.equal((await response.json()).created,false,"Niedozwolona kopia została utworzona");});
      }finally{
        await guidedOperation("Zatwierdź sprzątanie",async()=>{},false,{checkpoint:true,inspection:inspection("cleanup")});
        await api.delete("/api/SchoolOrder/Delete");
      }
    })();
    const rejected=assert.rejects(execution,/Niedozwolona kopia została utworzona/);
    const ready=()=>run.snapshot().steps.find(step=>step.ready);
    await expect.poll(()=>ready()?.inspection?.phase).toBe("before");
    assert.equal(run.continuous,false);assert.equal(writes,0);assert.equal(removed,0);
    assert.equal(ready().inspection.schools[0].orders[0].id,"401");
    run.setContinuous(true);
    await expect.poll(()=>ready()?.inspection?.phase).toBe("after");
    assert.equal(run.continuous,false);assert.equal(writes,1);assert.equal(removed,0);
    run.setContinuous(true);
    await expect.poll(()=>ready()?.inspection?.phase).toBe("cleanup");
    assert.equal(run.continuous,false);assert.equal(removed,0);
    assert.ok(run.steps.some(step=>step.status==="failed"));
    assert.equal(ready().inspection.schools[0].url,"https://octopus.gwodev.pl/school/school-panel/101");
    run.next(ready().id);
    await rejected;
    assert.equal(writes,1);assert.equal(removed,1);
  }finally{
    run.close();if(execution)await execution.catch(()=>{});
    restore();await api.dispose();
    for(const [key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
});
