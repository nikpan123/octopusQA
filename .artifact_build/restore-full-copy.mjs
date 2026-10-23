import {readFile,writeFile} from "node:fs/promises";
const file="test-ui/scenarios.json";
let source=await readFile(file,"utf8");
const catalog=JSON.parse(source);
const feature=catalog.features.find(f=>f.issue==="37160");
feature.scope="Kopiowanie zamówienia między wszystkimi placówkami tej samej struktury, również pośrednio i między gałęziami. Ostateczne doprecyzowanie użytkownika 22.10.2026 wycofuje ograniczenie do relacji bezpośrednich. Dokument oznacza zamówienie, nie załącznik.";
if(feature.verification) feature.verification.scope="Archiwalny wynik. Kontrolne 8 PASS z 22.10.2026 sprawdzało przejściowe, wycofane oczekiwanie odmowy kopiowania pośredniego i nie potwierdza poprawności aplikacji według aktualnych wymagań.";
const pairs=[["ZS","SP"],["ZS","LO"],["ZS","TECH"],["LO","ZS"],["LO","SP"],["LO","TECH"],["TECH","LO"],["SP","ZS"],["SP","LO"],["SP","TECH"],["TECH","ZS"],["TECH","SP"]];
for(const [index,[from,to]] of pairs.entries()){
 const s=feature.scenarios.find(s=>s.id===`ORD-COPY-${String(index+1).padStart(2,"0")}`);
 s.title=`${from} → ${to}: kopiowanie w tej samej strukturze`;
 s.description="Wspólna struktura uprawnia do kopiowania również przez pośrednika i między gałęziami. Ostateczne doprecyzowanie 22.10.2026.";
 s.steps=[`Otwórz oryginalne zamówienie w ${from} i wybierz Kopiuj.`,"Sprawdź dostępność wszystkich trzech pozostałych placówek struktury ZS.",`Wybierz ${to} i zapisz kopię.`,"Porównaj kopię, oryginał i dokumenty pozostałych placówek przez API.",`Otwórz ${to} ponownie i potwierdź widoczność kopii.`];
 s.expected="Jedna nowa kopia wyłącznie w wybranym celu tej samej struktury, również bez bezpośredniej relacji. Produkty i ilości zgodne z oryginałem; oryginał i pozostałe dokumenty bez zmian.";
 s.blocker="Przywrócono oczekiwanie kopiowania w całej strukturze. Nie uruchamiano ponownie na DEV po ostatnim sprostowaniu. Dawne odmowy w raporcie 5afd052a-f7c5-42a4-a58a-b6bacca16afa pozostają niezgodnościami z tą regułą.";
 const titles=["UI: otwarcie kopiowania i pełny zbiór trzech pozostałych placówek struktury ZS","UI: lista celów zawiera wyłącznie trzy pozostałe placówki struktury ZS",`UI: wybór celów ${to} i zapis kopii`,"Porównanie API: nowe kopie tylko u wybranych odbiorców, identyczne produkty i ilości, oryginał bez zmian","UI: kopia jest widoczna w placówce docelowej po ponownym wejściu"];
 s.stepLinks=titles.map((title,step)=>({step,testId:s.id,titles:[title]}));
}
const multi=feature.scenarios.find(s=>s.id==="ORD-COPY-17");
multi.title="Kopiowanie z SP do trzech placówek struktury: ZS, LO i TECH";
multi.steps=["Z SP wybierz ZS, LO i TECH, również pomimo braku bezpośredniej relacji z TECH.","Zapisz raz i porównaj wszystkie placówki."];
multi.expected="Dokładnie jedna kopia w ZS, LO i TECH; brak duplikatów, oryginał bez zmian.";
multi.stepLinks=[{step:0,testId:multi.id,titles:["UI: wybór celów ZS, LO, TECH i zapis kopii"]},{step:1,testId:multi.id,titles:["Porównanie API: nowe kopie tylko u wybranych odbiorców, identyczne produkty i ilości, oryginał bez zmian"]}];
const overall=catalog.features.find(f=>f.issue==="35980");
overall.scope=overall.scope.replace("#37160 dopuszcza kopiowanie wyłącznie w relacjach bezpośrednich (doprecyzowanie 22.10.2026).","#37160 dopuszcza kopiowanie między wszystkimi placówkami tej samej struktury, także pośrednio i między gałęziami (ostateczne sprostowanie 22.10.2026).");
overall.scenarios.find(s=>s.id==="ORD-SC-35980-08").steps[0]="Utwórz kopie oryginału z SP w LO i TECH oraz kopię kontrolną innego źródła w LO.";
for(const f of [feature,overall]){
 const start=source.lastIndexOf("{",source.indexOf(`"id": "${f.id}"`));
 let depth=0,quoted=false,escaped=false,end=start;
 for(;end<source.length;end++){const ch=source[end];if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;continue;}if(ch==='"')quoted=true;else if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end++;break;}}
 source=source.slice(0,start)+JSON.stringify(f,null,2)+source.slice(end);
}
JSON.parse(source);await writeFile(file,source);
const docFile="docs/tests/kopiowanie-zamowien-struktura.md";
const doc=await readFile(docFile,"utf8");
const header=`# Kopiowanie zamówień w strukturze placówek

Ostateczne sprostowanie użytkownika z 22.10.2026: w tej strukturze można kopiować zamówienia między wszystkimi placówkami, również przez pośrednika oraz między gałęziami. Ograniczenie do relacji bezpośrednich zostało wycofane. Dokument oznacza zamówienie, nie plik załącznika.

## Interpretacja wyników

Raport 5afd052a-f7c5-42a4-a58a-b6bacca16afa: 6 PASS i 6 FAIL. Odmowy ORD-COPY-02, -04, -06, -07, -10 i -12 są niezgodne z ostatecznie potwierdzoną regułą kopiowania w całej strukturze.

Kontrolny przebieg ośmiu testów zakończył się 8 PASS przed otrzymaniem polecenia stop, ale sprawdzał przejściowe, wycofane oczekiwanie odmowy kopiowania pośredniego. Nie jest dowodem poprawności aplikacji według bieżących wymagań. Po ostatnim sprostowaniu nie uruchamiano ponownie testów na DEV. Zachowano diagnostykę błędu biznesowego zwracanego przy HTTP 200.

## Scenariusze i dane

Opisy znajdują się w panelu Scenariusze pod 37160 i ORD-COPY. ID testów pozostają bez zmian. ZS oznacza Zespół Szkół. Struktura testu to ZS → SP → LO oraz ZS → TECH; B z BSP jest osobną strukturą, a SOLO jest placówką samodzielną.

- ORD-COPY-01–12: kopie w każdym kierunku między ZS, SP, LO i TECH, niezależnie od liczby pośredników.
- ORD-COPY-13–14: wykluczenie źródła, innej struktury i placówki samodzielnej.
- ORD-COPY-15–16: zakaz ponownego kopiowania kopii, brak celu i anulowanie.
- ORD-COPY-17: jedna operacja z SP do ZS, LO i TECH; po jednej kopii u każdego odbiorcy.
- ORD-COPY-18–19: placówka bez struktury i konto bez School.EDIT.

Przygotowanie korzysta z własnych dedykowanych szkół i rzeczywistego API. Oryginał zawiera F7P w ilości 3 i 4P-2 w ilości 2. Kopiowanie odbywa się przez UI. Testy kontrolują zgodność produktów i ilości oraz brak zmian pozostałych dokumentów. Sprzątanie usuwa wyłącznie dokumenty i relacje utworzone przez bieżący test. Nie zmienia się ról kont i nie wysyła wiadomości.

`;
await writeFile(docFile,header+doc.slice(doc.indexOf("## Uruchomienie")));
console.log("Przywrócono regułę kopiowania w całej strukturze; bez wykonywania testów DEV.");
