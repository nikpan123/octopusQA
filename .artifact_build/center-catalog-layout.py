from pathlib import Path
root=Path(r'C:\Users\npanek\Documents\ChatGPT\Centrum-testow')
stage=Path(__file__).parent/'center-catalog-stage'
stage.mkdir(exist_ok=True)
s=(root/'public/app.js').read_text(encoding='utf-8')
start=s.index('function renderTests(){')
end=s.index('\nasync function previewReportCleanup',start)
s=s[:start]+'''function catalogRow(t){
 const last=state.checks.find(x=>x.testId===t.id);
 return `<tr><td class="catalog-selection"><input type="checkbox" data-select="${esc(t.id)}" aria-label="Zaznacz ${esc(t.code)}" ${selected.has(t.id)?'checked':''}></td>
 <td class="catalog-description" data-label="Scenariusz"><button class="link catalog-title" data-test="${esc(t.id)}">${esc(t.title)}</button><div class="catalog-meta"><code>${esc(t.code)}</code><span>${esc(t.module)}</span></div>${t.tags.length?`<div class="catalog-tags">${t.tags.slice(0,4).map(tag=>`<span class="tag">#${esc(tag)}</span>`).join('')}</div>`:''}</td>
 <td class="catalog-project" data-label="Projekt i typ"><span class="catalog-project-name" data-project="${esc(t.project)}">${esc(name(t.project))}</span><span class="badge ${t.type==='manual'?'manual':'auto'}">${t.type==='manual'?'Ręczny':'Automat'}</span></td>
 <td class="catalog-last-check" data-label="Ostatnie sprawdzenie ręczne">${last?badge(last.status)+`<small>${esc(date(last.date))}</small>`:'<span class="catalog-no-check">Brak sprawdzenia</span>'}</td>
 <td class="catalog-actions" data-label="Działania"><div class="catalog-row-actions"><button class="secondary catalog-check-button" data-check-test="${esc(t.id)}">Zapisz wynik ręczny</button><button type="button" class="secondary" data-edit-scenario="${esc(t.id)}">Edytuj scenariusz</button></div></td></tr>`;
}
function renderTests(){
 const rows=filteredTests(),pages=Math.max(1,Math.ceil(rows.length/40));page=Math.min(page,pages-1);
 $('#content').innerHTML=`<div class="toolbar catalog-toolbar"><input id="search" aria-label="Szukaj testu" placeholder="Szukaj po nazwie, ID lub tagu…" value="${esc(search)}"><select id="project-filter" aria-label="Projekt"><option value="">Wszystkie projekty</option>${projectOptions()}</select><select id="type-filter" aria-label="Typ testu">${options([['','Wszystkie typy'],['automatic','Automatyczne'],['manual','Ręczne']],typeFilter)}</select><button class="secondary" data-new-test>+ Test ręczny</button></div><div class="toolbar catalog-selection-bar"><span class="count">${rows.length} pozycji · zaznaczono ${selected.size}${suiteFilter?' · widok zestawu':''}</span><button class="secondary" id="save-suite" ${selected.size?'':'disabled'}>Zapisz zestaw</button>${suiteFilter?'<button class="secondary" id="clear-suite">Wszystkie testy</button>':''}</div>
 <div class="table-wrap catalog-table-wrap"><table class="catalog-table" aria-label="Katalog testów"><colgroup><col class="catalog-col-select"><col><col class="catalog-col-project"><col class="catalog-col-check"><col class="catalog-col-actions"></colgroup><thead><tr><th><input id="select-page" type="checkbox" aria-label="Zaznacz stronę"></th><th scope="col">Scenariusz</th><th scope="col">Projekt / typ</th><th scope="col">Sprawdzenie ręczne</th><th scope="col">Działania</th></tr></thead><tbody>${rows.slice(page*40,page*40+40).map(catalogRow).join('')}</tbody></table>${rows.length?'':'<div class="empty">Brak testów pasujących do filtrów.</div>'}</div>
 <div class="pager"><button class="secondary" id="prev" ${page?'':'disabled'} aria-label="Poprzednia strona">←</button>Strona ${page+1} z ${pages}<button class="secondary" id="next" ${page+1<pages?'':'disabled'} aria-label="Następna strona">→</button></div>`;
}
''' + s[end:]
old="},link.closest('td'));"
assert old in s
s=s.replace(old,"},link.closest('tr').querySelector('.catalog-row-actions')||link.closest('td'));",1)
(stage/'app.js').write_text(s,encoding='utf-8')
s=(root/'public/style.css').read_text(encoding='utf-8')
s+='''
/* Test catalog: consistent hierarchy and aligned row actions. */
.qa-center .catalog-table{table-layout:fixed;width:100%}
.catalog-col-select{width:44px}.catalog-col-project{width:150px}.catalog-col-check{width:165px}.catalog-col-actions{width:270px}
.qa-center .catalog-table :is(th,td){padding:16px;vertical-align:top}
.qa-center .catalog-table th{font-size:10px;letter-spacing:.06em}
.qa-center .catalog-table th:first-child,.qa-center .catalog-selection{padding-left:18px;padding-right:8px}
.qa-center .catalog-selection input,.qa-center .catalog-table th input{width:16px;height:16px;margin:8px 0 0;accent-color:var(--qa-accent)}
.qa-center .catalog-table th input{margin-top:0}
.qa-center .catalog-description{min-width:0;overflow-wrap:anywhere}
.qa-center .catalog-table .catalog-title{justify-content:flex-start;text-align:left;max-width:100%;font-size:14px;line-height:1.5;font-weight:650;padding:5px 9px;min-height:32px;margin:0 0 6px;border-radius:6px}
.qa-center .catalog-meta{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;color:var(--qa-muted);font-size:12px;line-height:1.6}
.qa-center .catalog-meta code{font:11px/1.6 Consolas,monospace;background:none;padding:0;color:var(--qa-muted);overflow-wrap:anywhere}
.qa-center .catalog-meta>span{font-size:12px;color:var(--qa-muted)}
.qa-center .catalog-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.qa-center .catalog-tags .tag{display:inline-flex;font-size:11px;font-weight:400;line-height:1.4;margin:0;padding:3px 7px;border-radius:5px;border:1px solid var(--qa-line);background:var(--qa-bg);color:var(--qa-muted);overflow-wrap:anywhere}
.qa-center .catalog-project-name{display:block;font-size:12px;line-height:1.6;margin:4px 0 8px;color:var(--qa-ink);font-weight:550}
.qa-center .catalog-project-name:before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#b96c24;margin-right:7px;vertical-align:middle}
.qa-center .catalog-project-name[data-project=octopus]:before{background:#3b82c4}
.qa-center .catalog-project-name[data-project=hurtownia]:before{background:#2d9b7a}
.qa-center .catalog-project .badge{font-size:10px}
.qa-center .catalog-no-check{display:block;color:var(--qa-muted);font-size:12px;line-height:1.6;margin-top:5px}
.qa-center .catalog-last-check small{font-size:11px;color:var(--qa-muted);margin-top:7px}
.qa-center .catalog-row-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:start;justify-content:flex-start}
.qa-center .catalog-row-actions :is(button,.qa-guide-button){display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 9px;font-size:11px;line-height:1.5;white-space:normal;margin:0;max-width:100%;font-weight:550}
.qa-center .catalog-check-button{flex-basis:100%;justify-content:flex-start!important}
.qa-center .catalog-table tbody tr:hover{background:var(--qa-soft)}
.qa-center .catalog-table tbody tr:has(.catalog-selection input:checked){background:var(--qa-soft)}
.qa-center .catalog-toolbar input{min-width:min(260px,100%)}
@media(max-width:1200px){
 .qa-center .catalog-table colgroup,.qa-center .catalog-table thead{display:none}
 .qa-center .catalog-table,.qa-center .catalog-table tbody{display:block}
 .qa-center .catalog-table tbody>tr{display:grid;grid-template-columns:24px minmax(0,1fr) minmax(150px,220px);gap:12px 16px;padding:18px;border-bottom:1px solid var(--qa-line)}
 .qa-center .catalog-table tbody>tr:last-child{border-bottom:0}
 .qa-center .catalog-table tbody td{padding:0;border:0;min-width:0}
 .qa-center .catalog-selection{grid-column:1;grid-row:1/4}
 .qa-center .catalog-description{grid-column:2;grid-row:1}
 .qa-center .catalog-project{grid-column:2;grid-row:2;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
 .qa-center .catalog-project-name{margin:0}
 .qa-center .catalog-last-check{grid-column:2;grid-row:3}
 .qa-center .catalog-last-check:before{content:'Sprawdzenie ręczne';display:block;color:var(--qa-muted);font-size:10px;margin:0 0 4px}
 .qa-center .catalog-no-check{margin-top:0}
 .qa-center .catalog-actions{grid-column:3;grid-row:1/4}
 .qa-center .catalog-row-actions{flex-direction:column;align-items:stretch}
 .qa-center .catalog-row-actions button{width:100%;justify-content:center!important;flex-basis:auto}
}
@media(max-width:600px){
 .qa-center .catalog-table tbody>tr{grid-template-columns:20px minmax(0,1fr);padding:16px;gap:12px}
 .qa-center .catalog-selection{grid-row:1/5}
 .qa-center .catalog-actions{grid-column:2;grid-row:4}
 .qa-center .catalog-row-actions{flex-direction:row;align-items:center}
 .qa-center .catalog-row-actions button{width:auto;flex:1 1 110px}
 .qa-center .catalog-row-actions .catalog-check-button{flex-basis:100%}
 .qa-center .catalog-toolbar>:is(input,select){flex:1 1 100%;width:100%;min-width:0}
 .qa-center .catalog-selection-bar .count{flex-basis:100%}
 .qa-center .catalog-meta{gap:4px 8px}
}
'''
(stage/'style.css').write_text(s,encoding='utf-8')
