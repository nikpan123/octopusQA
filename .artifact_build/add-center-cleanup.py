from pathlib import Path
root=Path(r'C:\Users\npanek\Documents\ChatGPT\Centrum-testow')
stage=Path(__file__).parent/'center-cleanup-stage'
stage.mkdir(exist_ok=True)
s=(root/'server.mjs').read_text(encoding='utf-8')
s="import {cleanupPlan,retainedHistory} from './report-cleanup.mjs';\n"+s
needle=" const issueRoute=issueRoutes({list,put,db,fail,required,projectOf,catalog:async()=>decorate(await catalog()),importedHistory});"
replacement=''' async function cleanupReferences(){
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
 const issueRoute=issueRoutes({list,put,db,fail,required,projectOf,catalog:async()=>decorate(await catalog()),importedHistory:reportHistory});'''
assert needle in s
s=s.replace(needle,replacement,1)
needle="    if(url.pathname==='/api/scenarios/update'){"
replacement='''    if(['/api/reports/archive','/api/reports/restore'].includes(url.pathname)){
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
'''+needle
assert needle in s
s=s.replace(needle,replacement,1)
s=s.replace("   if(url.pathname==='/api/scenarios')", "   if(url.pathname==='/api/reports/cleanup-preview')return json(200,await reportPlan(url.searchParams.get('project')||''));\n   if(url.pathname==='/api/scenarios')",1)
s=s.replace('history=await importedHistory();','history=await reportHistory();',1)
s=s.replace("exportedAt:new Date().toISOString(),scenarioDescriptions", "exportedAt:new Date().toISOString(),reportArchive:list('report-archive'),scenarioDescriptions",1)
(stage/'server.mjs').write_text(s,encoding='utf-8')

s=(root/'public/app.js').read_text(encoding='utf-8')
needle='<div id="history-table">${historyTable(allHistory())}</div>`;'
replacement='<div class="toolbar"><button class="secondary" id="cleanup-reports">Wyczyść nieprzypięte raporty</button><button class="secondary" id="restore-reports">Archiwum raportów / przywróć</button><span class="count">Czyszczenie porządkuje historię Centrum; pliki raportów pozostają na dysku.</span></div><div id="history-table">${historyTable(allHistory())}</div>`;'
assert needle in s
s=s.replace(needle,replacement,1)
needle='function historyTable(rows)'
replacement='''async function previewReportCleanup(restoring=false){
 const project=$('#history-project')?.value||'';
 const plan=await api('/api/reports/cleanup-preview?project='+encodeURIComponent(project));
 const rows=restoring?plan.archived:plan.candidates;
 const title=restoring?'Przywróć raporty z archiwum':'Wyczyść nieprzypięte raporty';
 const summary=`<p>Projekt: <strong>${esc(project?name(project):'Wszystkie projekty')}</strong></p><p>${restoring?'Do przywrócenia':'Do przeniesienia do archiwum'}: <strong>${rows.length}</strong>. Chronione powiązaniami: <strong>${plan.protectedCount}</strong>. W trakcie lub bez końcowego wyniku: <strong>${plan.activeCount}</strong>.</p><div class="callout">Raporty przypięte do zgłoszeń, zapisanych sprawdzeń lub opisów scenariuszy pozostają w historii. Czyszczenie ukrywa wpisy tylko w Centrum testów. Pliki i historia w panelach projektów pozostają bez zmian; nie zwalnia to miejsca na dysku.</div>`;
 const table=rows.length?`<div class="cleanup-report-list"><table><thead><tr><th>Raport</th><th>Projekt</th><th>Wynik</th><th>Data</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(name(r.project))}</td><td>${badge(r.status)}</td><td>${esc(date(r.date))}</td></tr>`).join('')}</tbody></table></div>`:'<p>Nie ma raportów pasujących do tej operacji.</p>';
 openModal(title,summary+table+(rows.length?'<label class="cleanup-confirm"><input name="confirmReports" type="checkbox" required> Potwierdzam operację na raportach z powyższej listy.</label>':''),rows.length?async()=>{const result=await api(restoring?'/api/reports/restore':'/api/reports/archive',{project,revision:plan.revision,confirm:true});toast((restoring?'Przywrócono raporty: ':'Przeniesiono raporty do archiwum: ')+result.count);}:null);
 $('#save').textContent=restoring?'Przywróć raporty':'Przenieś do archiwum';
}
function historyTable(rows)'''
assert needle in s
s=s.replace(needle,replacement,1)
s=s.replace("function openModal(title,html,action){", "function openModal(title,html,action){$('#save').textContent='Zapisz';",1)
s=s.replace(" if(b.id==='refresh'){", " if(b.id==='cleanup-reports'){await previewReportCleanup();return;}\n if(b.id==='restore-reports'){await previewReportCleanup(true);return;}\n if(b.id==='refresh'){",1)
(stage/'app.js').write_text(s,encoding='utf-8')
s=(root/'public/style.css').read_text(encoding='utf-8')
s+='''\n/* Reviewable and reversible report cleanup. */
.cleanup-report-list{max-height:45vh;overflow:auto;margin:20px 0;border:1px solid var(--qa-line);border-radius:8px}
.cleanup-report-list table{width:100%;border-collapse:collapse;font-size:12px}
.cleanup-report-list :is(td,th){padding:10px 12px;text-align:left;border-bottom:1px solid var(--qa-line);overflow-wrap:anywhere}
.cleanup-report-list th{position:sticky;top:0;background:var(--qa-surface,#fff);z-index:1}
.cleanup-confirm{display:flex;gap:10px;align-items:center;font-size:13px;margin:16px 0;color:var(--qa-ink)}
.cleanup-confirm input{flex:0 0 18px;width:18px;min-height:18px;margin:0;accent-color:var(--qa-accent)}
@media(max-width:650px){.cleanup-report-list{max-height:40vh}.cleanup-report-list :is(td,th){padding:8px}.cleanup-report-list table{min-width:480px}}
'''
(stage/'style.css').write_text(s,encoding='utf-8')
