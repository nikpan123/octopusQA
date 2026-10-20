const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const Reporter=require('./browser-preview-reporter.cjs');
test('podgląd rozdziela workery i nie publikuje argumentów akcji',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qa-browser-preview-check-'));
 const a={id:'a',title:'Test A',parent:{project:()=>({use:{headless:false}})}},b={...a,id:'b',title:'Test B'};
 const reporter=new Reporter();reporter.onBegin({metadata:{qaBrowserPreviewDirectory:dir}},{allTests:()=>[a,b]});
 try{
  reporter.onTestBegin(a,{workerIndex:0});reporter.onTestBegin(b,{workerIndex:1});
  reporter.onStepBegin(a,{workerIndex:0},{title:'locator.fill("VERY_SECRET_PASSWORD")',category:'pw:api'});
  const first=fs.readFileSync(path.join(dir,'worker-0.json'),'utf8');
  assert.equal(JSON.parse(first).action,'Wpisywanie danych');assert(!first.includes('VERY_SECRET_PASSWORD'));
  assert.equal(JSON.parse(first).testIndex,1);assert.equal(JSON.parse(first).totalTests,2);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'worker-1.json'),'utf8')).title,'Test B');
  const step={title:'Etap biznesowy',category:'test.step'};
  reporter.onStepBegin(a,{workerIndex:0},step);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'worker-0.json'),'utf8')).step,'Etap biznesowy');
  reporter.onStepEnd(a,{workerIndex:0},step);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'worker-0.json'),'utf8')).step,'Wykonywanie scenariusza');
  reporter.onTestEnd(a,{workerIndex:0});reporter.onTestBegin(a,{workerIndex:2,retry:1});
  const retry=JSON.parse(fs.readFileSync(path.join(dir,'worker-2.json'),'utf8'));
  assert.equal(retry.testIndex,1);assert.equal(retry.totalTests,2);assert.equal(retry.attempt,2);
 }finally{reporter.onEnd();}
 assert.equal(fs.existsSync(dir),false);
});
