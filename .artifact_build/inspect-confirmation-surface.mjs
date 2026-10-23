import {request} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const state=JSON.parse(await readFile('playwright/.auth/dev/user.json','utf8'));
const origin='https://octopus.gwodev.pl';
const values=state.origins.find(o=>o.origin===origin).localStorage;
const token=JSON.parse(values.find(x=>x.name==='token').value);
const context=await request.newContext({baseURL:origin,storageState:state,extraHTTPHeaders:{Authorization:`Bearer ${token}`},ignoreHTTPSErrors:true});
await mkdir('.artifact_build/confirmation-surface',{recursive:true});
const html=await (await context.get('/')).text();
const sources=[...html.matchAll(/src="([^"]+\.js)"/g)].map(x=>x[1]);
const seen = new Set();
for (const src of sources) {
 if(seen.has(src)) continue;
 seen.add(src);
 const text=await (await context.get('/'+src.replace(/^\//,''))).text();
 sources.push(...new Set(text.match(/chunk-[A-Z0-9]+\.js/g)));
 await writeFile('.artifact_build/confirmation-surface/'+src.split('/').at(-1),text);
 for (const pattern of ['UpdateSchoolOrder','AddSchoolOrder','Weryfikuj','PositiveVerification','VerifyForm']) {
  const index=text.indexOf(pattern);
  if(index>=0)console.log(pattern,text.slice(Math.max(0,index-250),index+700));
 }
}
const subjects=await (await context.get('/api/Dictionary/GetSubjects')).json();
console.log('subjects',subjects.map(s=>({id:s.id,description:s.description})));
await context.dispose();
