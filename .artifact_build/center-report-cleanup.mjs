import { createHash } from 'node:crypto';

const terminal = new Set(['PASS','PASSED','FAIL','FAILED','INCOMPLETE','CANCELLED','STOPPED','INTERRUPTED','SKIP','SKIPPED']);
export function cleanupPlan({history, records, referenceTexts=[], archives=[], project=''}) {
  if (!['','octopus','hurtownia','cms'].includes(project)) throw Object.assign(Error('Wybierz poprawny projekt.'), {status:400});
  const archived = new Set(archives.filter(a=>a.archived).map(a=>a.runId));
  const references = [...records.filter(r=>!['report-archive','report-cleanup-log'].includes(r.kind)).map(r=>JSON.stringify(r.value)), ...referenceTexts];
  const rows = [...new Map(history.map(row=>[row.id,row])).values()].filter(row=>!project||row.project===project);
  const candidates=[],protectedRows=[],active=[];
  for (const row of rows) {
    if (archived.has(row.id)) continue;
    if (!terminal.has(String(row.status).toUpperCase())) {active.push(row);continue;}
    const nativeId=row.id.slice(row.id.indexOf(':')+1);
    const tokens=[row.id,row.report,nativeId.length>=12?nativeId:null].filter(Boolean);
    if (references.some(text=>tokens.some(token=>text.includes(token)))) protectedRows.push(row);
    else candidates.push(row);
  }
  const revision=createHash('sha256').update(JSON.stringify({project,candidates,protectedRows,active,archives})).digest('hex');
  return {project,revision,candidates,protectedCount:protectedRows.length,activeCount:active.length,archived:archives.filter(a=>a.archived&&(!project||a.snapshot.project===project)).map(a=>a.snapshot)};
}

export function retainedHistory(history, archives, includeArchived=false) {
  const rows=new Map(archives.map(a=>[a.runId,a.snapshot]));
  for(const row of history)rows.set(row.id,row);
  const hidden=new Set(archives.filter(a=>a.archived).map(a=>a.runId));
  return [...rows.values()].filter(row=>includeArchived||!hidden.has(row.id));
}
