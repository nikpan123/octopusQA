// Odświeża instrukcje we wszystkich lokalnych panelach; nie uruchamia testów.
const fs = require('node:fs');
const path = require('node:path');
const octopus = path.resolve(__dirname, '..');
const center = path.resolve(octopus, '../Centrum-testow');
const cms = path.resolve(octopus, '../KsiegarniaCMS');
const warehouse = path.join(process.env.USERPROFILE, 'Testy/Hurtownia');
const common = fs.readFileSync(path.join(__dirname, 'guided-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'guided-ui.css'), 'utf8');
const intro = [
 'Wybierz przypadek według funkcji lub numeru zgłoszenia. Najpierw przeczytaj jego instrukcję.',
 'Sprawdź adres środowiska i dane potrzebne do testu. Nazwa DEV oznacza środowisko programistyczne, a TEST — testowe.',
 'Zaznaczenie testu lub otwarcie panelu tylko przygotowuje wybór. Dopiero przycisk uruchomienia rozpoczyna automat.',
 'Po zakończeniu otwórz raport tego przebiegu. Sprawdź ID testu, wynik oraz powód ewentualnego pominięcia.',
 'Jeśli sprawdzasz zgłoszenie, zapisz dowód w Centrum testów. Nie oznaczaj poprawki jako sprawdzonej, gdy właściwy test został pominięty.'
];
// Nazwy kroków pochodzą z test.step w pliku wskazanym przez indeks, a nie z domysłów.
const octGuides = {};
const index = fs.readFileSync(path.join(octopus, 'docs/tests/scenario-index.md'), 'utf8');
const entries = [...index.matchAll(/^\| ([^|]+) \| (.*?) \| \[([^\]]+)\]\([^)]*#L(\d+)\)/gm)];
for (const m of entries) {
 const file = path.join(octopus, 'tests', m[3]);
 if (!fs.existsSync(file)) continue;
 const lines = fs.readFileSync(file, 'utf8').split('\n');
 const from = Number(m[4]) - 1;
 const next = entries.filter(x => x[3] === m[3] && Number(x[4]) > Number(m[4])).sort((a,b)=>Number(a[4])-Number(b[4]))[0];
 const body = lines.slice(from, next ? Number(next[4])-1 : lines.length).join('\n');
 const steps = [...body.matchAll(/test\.step\(\s*['"]([^'"\n]+)['"]/g)].map(x=>x[1].replace(/\s*[—–]\s*[A-Za-z_$][\w.$]*\([^)]*\).*$/,'').trim());
 const title=m[2].replace(/\s*@\S+/g,'').replace(new RegExp('^'+m[1].trim()+':?\\s*'),'');
 octGuides[m[1].trim()] = {title:m[1].trim()+' — '+title,steps,expected:['Warunek opisany w scenariuszu jest spełniony: '+title+'.'],scope:'Zakres wynika z nazwy scenariusza i zapisanych kroków automatu. Szczegółowe pomiary i przerwane kroki znajdziesz w raporcie wykonania.'};
}
const cmsGuides = {};
const descriptions = {assertFiltersVisible:'Filtry wyszukiwania są widoczne.',assertTableVisible:'Wymagane kolumny tabeli są widoczne.',assertButtonsVisible:'Wymagane przyciski i licznik wyników są widoczne.',assertFormVisible:'Wymagane pola formularza są widoczne.',assertTabsVisible:'Wymagane zakładki są widoczne.'};
Object.assign(descriptions,{assertAssociationsTabVisible:'Zakładka powiązań jest widoczna.',assertAttributesTabVisible:'Zakładka atrybutów jest widoczna.',assertButtonsVisibleAfterAdd:'Po dodaniu pozycji formularza wymagane przyciski są widoczne.',assertCalloutTabVisible:'Zakładka wyróżnienia jest widoczna.',assertCustomerGroupsTableVisible:'Tabela grup klientów jest widoczna.',assertDetailsTabVisible:'Zakładka szczegółów jest widoczna.',assertFormButtonsVisible:'Przyciski formularza są widoczne.',assertMediaTabVisible:'Zakładka multimediów jest widoczna.',assertMenuOptionsVisible:'Wymagane opcje menu są widoczne.',assertMenuOptionVisible:'Sprawdzana opcja menu jest widoczna.',assertMenuVisible:'Menu jest widoczne.',assertRequiredFormFieldsVisible:'Wymagane pola formularza są widoczne.',assertTaxonomyTabVisible:'Zakładka kategoryzacji jest widoczna.',checkButtonPresence:'Sprawdzany przycisk jest dostępny.',checkCustomersTableVisibility:'Tabela klientów jest widoczna.'});
for (const file of fs.readdirSync(path.join(cms,'tests')).filter(x=>x.endsWith('.spec.ts'))) {
 const source=fs.readFileSync(path.join(cms,'tests',file),'utf8');
 const matches=[...source.matchAll(/\btest\(\s*["'`]([^"'`]+)["'`]/g)];
 matches.forEach((m,i)=>{
  const body=source.slice(m.index,matches[i+1]?.index);
  const expected=[...new Set([...body.matchAll(/assertions\.(\w+)\(/g)].map(x=>descriptions[x[1]]).filter(Boolean))];
  const views=file.startsWith('views-');
  cmsGuides['cms:'+file.replace('.spec.ts','')+(matches.length>1?':'+(i+1):'')]={
   purpose:views?'Sprawdzenie, czy widok „'+m[1].replace(/^Widoki:\s*/,'')+' ładuje się po aktualizacji i zachowuje elementy ze wzorca.':'Sprawdzenie widoczności elementów panelu: '+m[1]+'.',
   steps:views?['Automat loguje się do CMS i otwiera sprawdzany widok.', 'Porównuje widok z zapisanym wzorcem i zapisuje wykryte braki.']:['Automat loguje się do CMS i otwiera stronę lub formularz wskazany w nazwie.',...expected.map(x=>'Sprawdza: '+x)],
   expected:views?['Strona nie zwraca błędu serwera, a wymagane elementy wzorca są dostępne. Bez odpowiedniego rekordu niektóre widoki mogą zostać pominięte.']:expected,
   scope:'To kontrola interfejsu. Jej zaliczenie nie potwierdza zapisania nowego obiektu ani całego procesu biznesowego.'
  };
 });
}
const warehouseEffects = {
 cart:'Tworzy koszyk i zmienia jego pozycje. Nie finalizuje zamówienia.',
 order:'Tworzy i finalizuje zamówienie na środowisku DEV. Może uruchomić generowanie dokumentów i wiadomości.',
 regression:'Tworzy koszyki i sprawdza wiele przypadków. Bez finalizacji zamówienia.',
 'regression-order':'Tworzy zamówienia z zapisem. Sprawdź w raporcie ich numery i stan finalizacji.',
 catalog:'Odczytuje katalog produktów i porównuje dane z wzorcem.',
 descriptions:'Odczytuje dane produktów i tworzy koszyki. Bez finalizacji. Formularze CMS, dokumenty i e-maile są sprawdzane osobnymi zestawami.',
 'descriptions-cms':'Zapisuje pola kanałowe produktów QA w CMS i sprawdza walidacje. Zobacz w raporcie wynik przywracania danych.',
 'descriptions-web':'Odczytuje ofertę oraz widoki sklepu RETAIL i porównuje nazwy oraz adresy stron.',
 'descriptions-documents':'Tworzy nowe zamówienie WHOLESALE i sprawdza dokument PDF oraz wiadomość e-mail.',
 'packages-profile':'Tymczasowo zmienia konfigurację paczek w CMS. Wynik przywrócenia konfiguracji sprawdź w raporcie.',
 'product-create':'Tworzy nowy produkt przez API. Zapisany produkt jest skutkiem tego działania.',
 database:'Odczytuje zapisany raport i porównuje zamówienie z bazą.',
 login:'Otwiera przeglądarkę do logowania GitLab. Dokończ logowanie; samo otwarcie nie sprawdza funkcjonalności sklepu.'
};
const suiteGuides={};
for(const name of ['cart-api-scenarios.json','product-channel-scenarios.json']){
 const catalog=JSON.parse(fs.readFileSync(path.join(warehouse,'docs',name),'utf8'));
 for(const [key,action] of Object.entries(catalog.actions)){
  if(!action.suite)continue;
  const cases=catalog.cases.filter(s=>s.automation.actions?.includes(key));
  suiteGuides[action.suite]={effect:action.note,steps:cases.map(s=>s.id+' — '+s.title),expected:['Dla wykonanych przypadków są spełnione ich oczekiwane wyniki. Pełną listę warunków otworzysz w zakładce „Scenariusze testowe”.','Raport wskazuje rzeczywisty zakres wykonania. Pominięcia oznaczają brak potwierdzenia dla tych przypadków.'],scope:action.note};
 }
}
const adapters = {
 octopus: `installQaGuide({name:'Octopus',intro:${JSON.stringify(intro)},prepare:['Wybierz środowisko w ustawieniach uruchomienia.','Upewnij się, że konto i dostęp do aplikacji są skonfigurowane.','Na pierwszą próbę zaznacz jeden test zamiast całej regresji.'],actions:['Znajdź test na liście i zaznacz jego pole wyboru.','Wybierz środowisko. Opcja widocznej przeglądarki pozwala obserwować działanie automatu.','Kliknij „Uruchom testy”. Automat sam wykonuje czynności w aplikacji.','Poczekaj na zakończenie i otwórz raport HTML.'],effect:'Testy Octopusa mogą tworzyć, edytować i usuwać rekordy w wybranym środowisku. Wpływ zależy od konkretnego scenariusza; sprawdź zapisane kroki przed uruchomieniem.',result:'W sekcji Status i Historii znajdziesz wynik. „Otwórz raport HTML” pokazuje testy, błędy i dostępne dowody.',decorate(add){for(const input of document.querySelectorAll('[data-test-id]')){const t=state.tests.find(x=>x.id===input.dataset.testId);if(t)add({...t,...${JSON.stringify(octGuides)}[t.id]},input.closest('.test-row').querySelector('.test-title'));}},launchSelector:'#startBtn',launchNote(){return state.selected.size?'Uruchomisz '+state.selected.size+' zaznaczonych testów. Automat może zmieniać dane w wybranym środowisku. Wynik znajdziesz w raporcie po zakończeniu.':'Nie zaznaczono pojedynczych testów. Uruchomienie użyje wybranego pakietu i filtra. Aby wykonać jedną próbę, najpierw zaznacz jeden test.';}});`,
 cms: `installQaGuide({name:'Księgarnia CMS',intro:${JSON.stringify(intro)},prepare:['W Konfiguracji sprawdź adres CMS i stan danych logowania.','W katalogu wybierz scenariusz. Przeglądarka Chromium jest odpowiednia na początek.','Dla widoków konkretnych rekordów muszą istnieć dane wymagane przez dany test.'],actions:['Zaznacz pole obok scenariusza. „Zestaw po aktualizacji” tylko zaznacza grupę testów.','Opcjonalnie zaznacz „Pokaż okno przeglądarki”, aby obserwować automat.','Kliknij „Uruchom wybrane”. Panel zaloguje się do CMS i wykona kontrole.','Poczekaj na zakończenie i otwórz szczegóły przebiegu oraz raport.'],effect:'Ten katalog sprawdza widoczność stron, formularzy i ich elementów. Kontrola formularza tworzenia nie oznacza utworzenia rekordu.',result:'W Historii otwórz szczegóły właściwego przebiegu, następnie „Raport Playwright”. W raporcie znajdziesz przyczynę błędu lub pominięcia.',decorate(add){for(const input of document.querySelectorAll('[data-test]')){if(input.tagName!=='INPUT')continue;const t=state?.catalog.find(x=>x.id===input.dataset.test);if(t)add({...t,...${JSON.stringify(cmsGuides)}[t.id]},input.closest('tr').querySelector('.test-name'));}},launchSelector:'#run',launchNote(){return 'Po kliknięciu wykonasz '+selected.size+' wybranych scenariuszy na '+(state?.configuration.target||'nieskonfigurowanym środowisku')+'. Zaliczenie widoku potwierdza tylko zakres jego kontroli. Wynik pojawi się w Historii.';}});`,
 center: `installQaGuide({name:'Centrum testów',intro:['Centrum przechowuje opisy, powiązania ze zgłoszeniami i dowody. Automaty wykonują się w panelach poszczególnych projektów.',...${JSON.stringify(intro)}],prepare:['Otwórz zgłoszenie lub katalog i sprawdź projekt oraz numer testu.','Przeczytaj kroki i oczekiwany rezultat. Przy automacie sprawdź instrukcję w panelu projektu.'],actions:['Otwórz panel projektu z karty zgłoszenia lub zakładki Uruchomienia. Samo otwarcie nie wykonuje testów.','Sprawdź zaznaczone scenariusze i uruchom je w panelu projektu.','Wróć do zgłoszenia i wybierz „Przypnij raport wykonania”. Wskaż raport oraz faktycznie wykonane testy.','Dla ręcznego wykonania użyj „Sprawdź” i zapisz obserwację oraz dowody.'],effect:'Oglądanie karty i zaznaczanie testów nie zmienia danych testowanej aplikacji. Zapis sprawdzenia tworzy lokalny dowód. Wpływ automatu sprawdź w panelu projektu.',result:'Historia pokazuje raporty projektów, a karta zgłoszenia przechowuje przypięte dowody. „Sprawdź” służy do zapisania sprawdzenia ręcznego i nie uruchamia automatu.',decorate(add){for(const link of document.querySelectorAll('button[data-test]')){const t=state?.tests.find(x=>x.id===link.dataset.test);if(t)add({...t,...(t.project==='cms'?${JSON.stringify(cmsGuides)}[t.id]:t.project==='octopus'?${JSON.stringify(octGuides)}[t.code]:{})},link.closest('td'));}}});`,
 warehouse: `installQaGuide({name:'Hurtownia',intro:['Na początek wybierz „Scenariusze testowe”: tam znajdziesz warunki, dane, kroki i oczekiwany wynik. Przycisk może uruchamiać cały zestaw, a nie jeden przypadek.',...${JSON.stringify(intro)}],prepare:['Sprawdź aktywnego użytkownika u góry panelu. Koszyk i zamówienie korzystają z tego wyboru; inne zestawy mogą mieć własne konta.','W Konfiguracji sprawdź dostęp do API oraz sesję GitLab.','Przeczytaj warunki wybranego scenariusza i wpływ zestawu na dane.'],actions:['Otwórz „Scenariusze testowe” i wybierz przypadek z listy.','Przeczytaj sekcję „Uruchom powiązany test”, w tym zakres i ograniczenia zestawu.','Kliknij przycisk uruchomienia dopiero po sprawdzeniu wpływu na dane.','Wróć do „Uruchom testy”, obserwuj postęp, następnie otwórz raport tego przebiegu.'],effect:'Zależy od zestawu. Niektóre testy tylko odczytują dane, inne zapisują koszyki, zamówienia lub ustawienia CMS.',result:'Raporty są dostępne w zakładce Raporty. Wybierz konkretny przebieg; znajdziesz tam wykonane kontrole, faktyczne żądania i powody pominięć.',decorate(add){const effects=${JSON.stringify(warehouseEffects)};for(const run of document.querySelectorAll('button[data-suite]')){const suite=run.dataset.suite;const host=run.closest('.suite-card')||run.closest('.scenario-launch-option')||run.parentElement;if(host.closest('.qa-guide-dialog'))continue;const title=host.querySelector('h3,h2')?.textContent||run.textContent.trim();add({title,effect:effects[suite]||'Zakres i wpływ tego zestawu sprawdź w opisach powiązanych scenariuszy przed uruchomieniem. Nie zakładaj, że jest tylko do odczytu.',scope:'Przycisk uruchamia zestaw „'+title+'”. Może obejmować więcej niż jeden przypadek.'},host);}const detail=document.getElementById('scenario-detail');if(typeof scenarioCatalog!=='undefined'&&scenarioCatalog&&detail){const s=scenarioCatalog.cases.find(x=>x.id===selectedScenario);if(s)add({title:s.id+' — '+s.title,prepare:[...s.conditions,'Dane do tej próby: '+s.data],steps:s.steps,expected:s.expected,effect:scenarioCatalog.effectLabels[s.effect],scope:s.automation.limits||'',purpose:s.requirement||s.title},detail);}}});`
};
const projects=[['octopus',path.join(octopus,'test-ui'),'styles.css'],['center',path.join(center,'public'),'style.css'],['cms',path.join(cms,'dashboard/public'),'style.css'],['warehouse',path.join(warehouse,'dashboard/public'),'style.css']];
for(const [id,root,style] of projects){
 const jsPath=path.join(root,'app.js'),cssPath=path.join(root,style);
 const strip=(text,start,end)=>{const from=text.indexOf(start);if(from<0)return text;const to=text.indexOf(end,from);if(to<0)throw Error('Brak końca sekcji '+start);return text.slice(0,from)+text.slice(to+end.length);};
 let js=strip(fs.readFileSync(jsPath,'utf8'),'/* QA_GUIDE_START */','/* QA_GUIDE_END */').trimEnd();
 if(id==='center')js=js.replace('>Sprawdź →</button>', '>Zapisz wynik ręczny →</button>');
 let adapter=adapters[id];
 adapter=adapter.replaceAll('użyj „Sprawdź”','użyj „Zapisz wynik ręczny”').replaceAll('„Sprawdź” służy','„Zapisz wynik ręczny” służy');
 const data={octopus:octGuides,cms:cmsGuides,warehouse:suiteGuides};
 // Zbiory instrukcji są tworzone raz, a nie osobno dla każdego wiersza katalogu.
 for(const [key,value] of Object.entries(data)){adapter=adapter.replaceAll(JSON.stringify(value),'qaGuideData_'+key);}
 if(id==='warehouse')adapter=adapter.replace('add({title,effect:effects[suite]', 'add({title,...qaGuideData_warehouse[suite],effect:qaGuideData_warehouse[suite]?.effect||effects[suite]').replace("scope:'Przycisk uruchamia zestaw", "scope:qaGuideData_warehouse[suite]?.scope||'Przycisk uruchamia zestaw");
 if(id==='warehouse')adapter=adapter.replace("title:s.id+' — '+s.title,prepare:","title:s.id+' — '+s.title,type:s.coverage==='planned'?'manual':'automatic',prepare:");
 if(id==='warehouse')adapter=adapter.replace("const host=run.closest('.suite-card')||run.closest('.scenario-launch-option')||run.parentElement;", "let host=run.closest('.suite-card')||run.closest('.scenario-launch-option')||run.parentElement;if(host.querySelectorAll('button[data-suite]').length>1){if(!run.parentElement.classList.contains('qa-guide-action')){const wrapper=document.createElement('span');wrapper.className='qa-guide-action';run.before(wrapper);wrapper.append(run);}host=run.parentElement;}");
 if(id==='octopus')adapter=adapter.replace("}},launchSelector:'#startBtn'", "}for(const run of document.querySelectorAll('[data-annual]')){const t=state.tests.find(x=>x.id===run.dataset.annual);if(!t)continue;if(!run.parentElement.classList.contains('qa-guide-action')){const wrapper=document.createElement('span');wrapper.className='qa-guide-action';run.before(wrapper);wrapper.append(run);}add({...t,...qaGuideData_octopus[t.id],actions:['To oddzielny proces rocznej medalowości. Przeczytaj jego dokumentację i kolejność przygotowania przed wykonaniem.','Przycisk o identyfikatorze '+t.id+' uruchamia ten etap. Nie jest częścią zwykłej regresji.','Po zakończeniu otwórz raport i sprawdź, czy etap został wykonany.']},run.parentElement);}},launchSelector:'#startBtn'");
 if(id==='center')adapter=adapter.replace("qaGuideData_octopus[t.code]:{}", "qaGuideData_octopus[t.code]:t.project==='hurtownia'?qaGuideData_warehouse[t.suite||t.code]:{}");
 const needed=Object.entries(data).filter(([key])=>adapter.includes('qaGuideData_'+key)).map(([key,value])=>'const qaGuideData_'+key+'='+JSON.stringify(value)+';').join('\n');
 fs.writeFileSync(jsPath,js+'\n\n/* QA_GUIDE_START */\n'+common+'\n'+needed+'\n'+adapter+'\n/* QA_GUIDE_END */\n');
 const old=strip(fs.readFileSync(cssPath,'utf8'),'/* QA_GUIDE_START */','/* QA_GUIDE_END */').trimEnd();
 fs.writeFileSync(cssPath,old+'\n\n/* QA_GUIDE_START */\n'+css+'\n/* QA_GUIDE_END */\n');
 console.log('Instrukcje: '+id);
}
