import{readFileSync,writeFileSync}from'node:fs';
import{manualGiftScenario}from'../scripts/manual-scenario-text.mjs';
import{applyConfirmationOverrides}from'../scripts/confirmation-matrix.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const cases=read('tests/data/potwierdzenia-gratisy-2026-cases.json');
const matrix=applyConfirmationOverrides(read('tests/data/potwierdzenia-gratisy-2026.json'),read('tests/data/potwierdzenia-gratisy-2026-overrides.json'));
const catalog=read('test-ui/scenarios.json');
const feature=catalog.features.find(f=>f.id==='potwierdzenia-gratisy-2026');
for(const c of cases){
 const prior={...c.stepTitles};
 c.stepTitles.date+='; wykonaj RecalculateSchoolClassDigitalAccessesBasedOnSchoolId dla tej szkoły';
 c.stepTitles.confirm+='; wykonaj SendBookFromFormClubPSChangesStates dla zapisanego formularza';
 const s=feature.scenarios.find(s=>s.id===c.id);
 Object.assign(s,manualGiftScenario(matrix.rows.find(r=>r.key===c.rowKey),c,matrix));
 for(const link of s.stepLinks)link.titles=link.titles.map(t=>t===prior.date?c.stepTitles.date:t===prior.confirm?c.stepTitles.confirm:t);
}
const note='Dla gratisów POTW26: po zmianie daty własnego zamówienia QA wykonuje RecalculateSchoolClassDigitalAccessesBasedOnSchoolId z ID szkoły. Po zapisaniu formularza QA wykonuje SendBookFromFormClubPSChangesStates z ID tego formularza. Dopiero potem sprawdzamy Gratisy. Wariant bez zamówienia wykonuje tylko drugą procedurę. Wymagany dostęp EXECUTE w bazie DEV.';
for(const id of ['gratisy-szybki-test-2026','octopus-regresja-przed-releasem']){
 const f=catalog.features.find(f=>f.id===id);for(const s of f.scenarios)s.preconditions.push(note);
}
writeFileSync('tests/data/potwierdzenia-gratisy-2026-cases.json',JSON.stringify(cases,null,2)+'\n');
writeFileSync('test-ui/scenarios.json',JSON.stringify(catalog,null,2)+'\n');
