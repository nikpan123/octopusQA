const fs=require('node:fs'),path=require('node:path');
const octopus=path.resolve(__dirname,'..'),cms=path.resolve(octopus,'../KsiegarniaCMS');
const backup=path.join(octopus,'.artifact_build/browser-preview-backup');
function write(root,file,text){const target=path.join(root,file);if(fs.existsSync(target)){const saved=path.join(backup,path.basename(root),file);fs.mkdirSync(path.dirname(saved),{recursive:true});if(!fs.existsSync(saved))fs.copyFileSync(target,saved);}fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);}
for(const file of ['shared/browser-preview.ts','shared/browser-preview-reporter.cjs','shared/preview-drag.cjs','shared/preview-drag.d.cts','shared/preview-position.cjs','shared/preview-position.d.cts'])write(cms,file,fs.readFileSync(path.join(octopus,file),'utf8'));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.ts')?[path.join(dir,e.name)]:[]);}
for(const root of [octopus,cms]){
 let changed=0;
 const files=[...walk(path.join(root,'tests')),...(root===cms?[path.join(cms,'shared/viewSmoke.ts')]:[])];
 for(const file of files){
  const old=fs.readFileSync(file,'utf8');
  const next=old.replace(/import\s*\{([^}]+)\}\s*from\s*(['"])@playwright\/test\2/g,(full,names,quote)=>{
   if(!/\btest\b/.test(names))return full;
   let relative=path.relative(path.dirname(file),path.join(root,'shared/browser-preview')).split(path.sep).join('/');if(!relative.startsWith('.'))relative='./'+relative;
   return `import {${names}} from ${quote}${relative}${quote}`;
  });
  if(next!==old){write(root,path.relative(root,file),next);changed++;}
 }
 console.log(path.basename(root)+': importy testów '+changed);
}
let file='playwright.shared.ts',text=fs.readFileSync(path.join(octopus,file),'utf8');
if(!text.includes('qaBrowserPreviewDirectory')){
 text='import path from "node:path";\nimport {tmpdir} from "node:os";\n'+text;
 text=text.replace('["./scripts/failure-reporter.mjs"],','["./scripts/failure-reporter.mjs"],\n    ["./shared/browser-preview-reporter.cjs"],');
 text=text.replace('testDir: "./tests",','testDir: "./tests",\n    metadata: {qaBrowserPreviewDirectory:path.join(tmpdir(), "qa-browser-preview-"+runId)},');
 write(octopus,file,text);
}
file='playwright.config.ts';text=fs.readFileSync(path.join(cms,file),'utf8');
if(!text.includes('qaBrowserPreviewDirectory')){
 text='import path from "node:path";\nimport {tmpdir} from "node:os";\nimport {randomUUID} from "node:crypto";\n'+text;
 text=text.replace('testDir: "./tests",','testDir: "./tests",\n  metadata: {qaBrowserPreviewDirectory:path.join(tmpdir(), "qa-browser-preview-"+randomUUID())},');
 text=text.replace('["list"],','["list"],\n    ["./shared/browser-preview-reporter.cjs"],');
 write(cms,file,text);
}
file='dashboard/server.mjs';text=fs.readFileSync(path.join(cms,file),'utf8');
if(!text.includes('--reporter=list,html,json,./dashboard/reporter.cjs,./shared/browser-preview-reporter.cjs')){
 const next=text.replace('--reporter=list,html,json,./dashboard/reporter.cjs','--reporter=list,html,json,./dashboard/reporter.cjs,./shared/browser-preview-reporter.cjs');
 if(next===text)throw Error('Nie znaleziono listy reporterów CMS');write(cms,file,next);
}
