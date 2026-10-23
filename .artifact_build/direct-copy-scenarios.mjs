import { readFile, writeFile } from "node:fs/promises";
const file = "test-ui/scenarios.json";
let source = await readFile(file, "utf8");
const catalog = JSON.parse(source);
const feature = catalog.features.find(f => f.issue === "37160");
feature.scope = "Kopiowanie zamówienia wyłącznie w bezpośredniej relacji, w obu kierunkach. Przynależność do tej samej struktury, relacja pośrednia lub rodzeństwo nie uprawniają do kopiowania. Doprecyzowano 22.10.2026. Dokument oznacza zamówienie, nie załącznik. ORD-COPY-19 sprawdza osobne konto bez School.EDIT.";
if (feature.verification) feature.verification.scope = "Archiwalny wynik sprzed doprecyzowania reguły relacji bezpośrednich. Nie potwierdza bieżących oczekiwań testów.";
const pairs = [["ZS","SP",true],["ZS","LO",false],["ZS","TECH",true],["LO","ZS",false],["LO","SP",true],["LO","TECH",false],["TECH","LO",false],["SP","ZS",true],["SP","LO",true],["SP","TECH",false],["TECH","ZS",true],["TECH","SP",false]];
for (const [index,[from,to,direct]] of pairs.entries()) {
  const scenario = feature.scenarios.find(s=>s.id===`ORD-COPY-${String(index+1).padStart(2,"0")}`);
  scenario.title = `${from} → ${to}: ${direct ? "kopiowanie w relacji bezpośredniej" : "odmowa bez relacji bezpośredniej"}`;
  scenario.description = "Reguła potwierdzona przez użytkownika 22.10.2026: kopiowanie tylko w relacjach bezpośrednich. Dawne odmowy kopiowania pośredniego nie były błędami aplikacji.";
  scenario.steps = [
    `Otwórz oryginalne zamówienie w ${from} i wybierz Kopiuj.`,
    "Sprawdź wykluczenie źródła i dostępność prawidłowego celu bezpośredniego.",
    ...(direct ? [`Wybierz ${to} i zapisz kopię.`, "Porównaj kopię, oryginał i dokumenty pozostałych placówek przez API.", `Otwórz ${to} ponownie i potwierdź widoczność kopii.`]
      : [`Jeśli ${to} nie jest dostępne, anuluj. Jeśli można je wybrać, zapisz i oczekuj jawnej odmowy braku bezpośredniej relacji. Sprawdź brak zmian we wszystkich placówkach.`]),
  ];
  scenario.expected = direct ? "Jedna nowa kopia wyłącznie w wybranym bezpośrednio powiązanym celu. Produkty i ilości zgodne z oryginałem; oryginał i pozostałe dokumenty bez zmian."
    : "Brak kopii: cel niedostępny lub zapis odrzucony z powodu braku bezpośredniej relacji. Oryginał i wszystkie dotychczasowe zamówienia pozostają bez zmian.";
  scenario.blocker = "Oczekiwania poprawiono 22.10.2026. Dawny raport 5afd052a-f7c5-42a4-a58a-b6bacca16afa nie jest wynikiem bieżącej wersji.";
  const titles = ["UI: otwarcie kopiowania w strukturze ZS", "UI: źródło jest wykluczone, cel bezpośredni jest dostępny", ...(direct ? [`UI: wybór celów ${to} i zapis kopii`, "Porównanie API: nowe kopie tylko u wybranych odbiorców, identyczne produkty i ilości, oryginał bez zmian", "UI: kopia jest widoczna w placówce docelowej po ponownym wejściu"] : ["Odmowa: brak bezpośredniej relacji nie pozwala utworzyć kopii"])];
  scenario.stepLinks = titles.map((title,step)=>({step,testId:scenario.id,titles:[title]}));
}
const multi=feature.scenarios.find(s=>s.id==="ORD-COPY-17");
multi.title="Kopiowanie z SP do dwóch bezpośrednio powiązanych placówek: ZS i LO";
multi.steps=["Z SP wybierz ZS i LO — oba cele mają bezpośrednią relację z SP.","Zapisz raz i porównaj wszystkie placówki, w tym brak zmian w TECH."];
multi.expected="Dokładnie jedna kopia w ZS i LO; brak kopii w TECH, brak duplikatów, oryginał bez zmian.";
multi.stepLinks=[{step:0,testId:multi.id,titles:["UI: wybór celów ZS, LO i zapis kopii"]},{step:1,testId:multi.id,titles:["Porównanie API: nowe kopie tylko u wybranych odbiorców, identyczne produkty i ilości, oryginał bez zmian"]}];
const overall=catalog.features.find(f=>f.issue==="35980");
overall.scope=overall.scope.replace("#37160 dopuszcza dowolne poziomy tej samej struktury.","#37160 dopuszcza kopiowanie wyłącznie w relacjach bezpośrednich (doprecyzowanie 22.10.2026).");
const cascade=overall.scenarios.find(s=>s.id==="ORD-SC-35980-08");
cascade.steps[0]="Utwórz kopie oryginału z SP w dwóch bezpośrednich celach ZS i LO oraz kopię kontrolną innego źródła w LO.";
for(const f of [feature,overall]) {
  const idAt=source.indexOf(`"id": "${f.id}"`), start=source.lastIndexOf("{",idAt);
  let depth=0,quoted=false,escaped=false,end=start;
  for(;end<source.length;end++) {
    const ch=source[end];
    if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;continue;}
    if(ch==='"')quoted=true;else if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end++;break;}
  }
  source=source.slice(0,start)+JSON.stringify(f,null,2)+source.slice(end);
}
JSON.parse(source);
await writeFile(file,source);
console.log("19 scenariuszy kopiowania: poprawione oczekiwania relacji bezpośrednich.");
