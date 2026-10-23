import fs from "node:fs";

const file = "test-ui/scenarios.json";
const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
const login =
  "Zaloguj się do DEV na konto, które może edytować szkoły, nauczycieli i zamówienia. Zapisz ID przygotowanych szkół i nauczycieli, aby wracać do tych samych kart.";
const legend =
  "W opisach: ZS = zespół szkół, SP = szkoła podstawowa, LO = liceum, TECH = technikum. To role przygotowanych placówek; w aplikacji wyszukuj je po zapisanych ID lub ich własnych nazwach.";
const full =
  "Przygotuj cztery placówki i na ich kartach w „Struktura” → „Dodaj powiązanie” ustaw: zespół szkół nadrzędny dla SP; SP nadrzędna dla LO; zespół szkół nadrzędny dla TECH. Otrzymasz ZS → SP → LO oraz ZS → TECH.";
const pair =
  "Przygotuj dwie placówki: szkołę podstawową SP i liceum LO. W „Struktura” → „Dodaj powiązanie” połącz je w kierunku SP → LO.";
const baseOrder =
  "Na karcie placówki źródłowej wybierz „Zamówienia” → „Dodaj”. Dodaj F7P w ilości 3 szt. i 4P-2 w ilości 2 szt., zapisz i zanotuj symbol zamówienia. Dokument ma być oryginałem, a nie kopią.";
const compare =
  "Otwórz „Zamówienia” we wskazanej placówce, rozwiń zapisany dokument i sprawdź kody produktów oraz ilości. Wróć do źródła i sprawdź, czy oryginał pozostał bez zmian. Porównuj zapisane numery dokumentów, nie tylko liczbę wierszy.";
const copyFeature = catalog.features.find((f) => f.id === "redmine-37160");
for (const s of copyFeature.scenarios) {
  const n = Number(s.id.slice(-2));
  s.description =
    "Sprawdzamy, kto może skopiować zamówienie szkolne i co zapisuje się w wybranej placówce. Przeprowadź opisany przypadek na osobnych danych, aby rozpoznać nowe kopie.";
  s.preconditions = [
    login,
    legend,
    n === 18
      ? "Przygotuj jedną szkołę bez powiązań w zakładce „Struktura”."
      : n === 14
        ? full + " Dodatkowo przygotuj osobny zespół B → szkoła B oraz jedną szkołę bez struktury."
        : n <= 12 || n === 17
          ? full
          : pair,
    baseOrder,
  ];
  s.data =
    "Produkty źródła: F7P — 3 szt.; 4P-2 — 2 szt. Zanotuj ID placówek, symbol oryginału i stan ich list zamówień przed kopiowaniem.";
  if (n <= 12) {
    const [from, to] = s.title.split(":")[0].trim().split(" → ");
    s.steps = [
      `W „Szkoły” wyszukaj ${from} po przygotowanym ID. Otwórz „Zamówienia”, zaznacz oryginalny dokument i kliknij „Kopiuj”.`,
      "W oknie kopiowania sprawdź nazwy pozostałych trzech placówek tej samej struktury. Placówka źródłowa nie powinna być dostępna jako cel.",
      `Zaznacz wyłącznie ${to} i kliknij „Zapisz”. Okno powinno się zamknąć.`,
      compare +
        ` W ${to} powinien być jeden dokument z dopiskiem „- kopia”, zawierający F7P × 3 i 4P-2 × 2. W pozostałych placówkach nie może przybyć dokumentów.`,
      `Opuść kartę ${to}, wyszukaj ją ponownie i otwórz „Zamówienia”. Ta sama kopia nadal ma być widoczna, bez dodatkowego duplikatu.`,
    ];
  }
  const special = {
    13: [
      "Otwórz kartę SP → „Zamówienia”, zaznacz oryginał i kliknij „Kopiuj”.",
      "Na liście celów wyszukaj nazwę źródłowej SP. Nie powinna być dostępna do zaznaczenia; dostępne jest LO.",
      "Kliknij „Anuluj”. Otwórz listy zamówień SP i LO ponownie — żadna nowa kopia nie powinna powstać.",
    ],
    14: [
      "Otwórz kartę SP należącej do zespołu ZS → „Zamówienia”, zaznacz oryginał i kliknij „Kopiuj”.",
      "Sprawdź listę celów: nie może zawierać zespołu B, szkoły z zespołu B ani samodzielnej szkoły. Mogą być dostępne inne placówki wspólnej struktury ZS.",
      "Kliknij „Anuluj” i wróć do list zamówień. Ich stan powinien być taki sam jak przed otwarciem okna.",
    ],
    15: [
      "Na karcie SP, w „Zamówienia”, skopiuj oryginał do LO: „Kopiuj”, zaznacz LO, „Zapisz”.",
      "Otwórz kartę LO → „Zamówienia” i zaznacz nowy dokument oznaczony „- kopia”.",
      "Sprawdź przycisk „Kopiuj”. Dla kopii nie powinien pozwalać na kolejne kopiowanie. Oryginał w SP nadal pozostaje dostępny.",
    ],
    16: [
      "Na karcie SP otwórz kopiowanie oryginału. Nie zaznaczaj żadnej szkoły docelowej.",
      "Sprawdź „Zapisz” — przy pustym wyborze ma być nieaktywny.",
      "Zaznacz LO: „Zapisz” powinien się uaktywnić. Kliknij jednak „Anuluj” i sprawdź, że w LO nie przybyła kopia.",
    ],
    17: [
      "Na karcie SP, w „Zamówienia”, zaznacz oryginał i kliknij „Kopiuj”. W oknie zaznacz ZS, LO i TECH.",
      "Kliknij „Zapisz” jeden raz. Otwórz kolejno „Zamówienia” w ZS, LO i TECH: w każdej placówce ma powstać jedna kopia F7P × 3 oraz 4P-2 × 2. Oryginał SP pozostaje bez zmian.",
    ],
    18: [
      "Wyszukaj szkołę bez struktury. Na jej karcie wybierz „Zamówienia” i zaznacz przygotowany oryginał.",
      "Sprawdź pasek działań zamówienia: przycisk „Kopiuj” nie powinien się pojawić dla placówki bez struktury.",
    ],
    19: [
      "Otwórz osobną przeglądarkę lub profil i zaloguj się kontem, które może odczytać szkołę, ale nie ma prawa jej edycji. Nie zmieniaj uprawnień swojego konta na potrzeby testu.",
      "Na tym koncie wyszukaj SP, otwórz „Zamówienia” i zaznacz przygotowany oryginał. Dokument musi być widoczny, żeby sprawdzenie dotyczyło kopiowania, a nie braku dostępu do szkoły.",
      "Sprawdź, że konto nie może uruchomić „Kopiuj”. Dodatkowa kontrola techniczna wymaga pomocy QA: bezpośrednia próba kopiowania przez to samo konto ma zostać odrzucona kodem 403 i nie utworzyć dokumentu.",
    ],
  };
  if (special[n]) s.steps = special[n];
  if (n === 19)
    s.preconditions.push(
      "Potrzebne są dwa konta: główne z prawem edycji szkoły i oddzielne z samym odczytem. Dane logowania do konta ograniczonego przygotowuje administrator.",
    );
}

const promo = catalog.features.find((f) => f.id === "uprawnienia-promocje");
const form = (subject, cls, year, own = true) =>
  `Na karcie nauczyciela wybierz „Kluby” → „Dodaj formularz”: rok ${year}, przedmiot „${subject}”, przygotowana szkoła, klasa ${cls} po stronie „${own ? "nasze" : "obce"}”${own ? "" : ", wydawnictwo „NOWA ERA”"}. Wyłącz „Wysłać maila do nauczyciela” i kliknij „Zapisz”.`;
for (const s of promo.scenarios) {
  const debut = s.id.startsWith("DEB");
  const n = Number(s.id.slice(-2));
  const isPhysics = debut && [2, 3, 7].includes(n);
  const subject = isPhysics ? "Fizyka" : "Matematyka";
  s.description = debut
    ? "Sprawdzamy, czy pierwsze nasze potwierdzenie z danego przedmiotu przyznaje nauczycielowi rozszerzony dostęp w okresie promocji debiutu."
    : "Sprawdzamy, czy szkoła kwalifikuje się jako nowy klient i czy jej zakup przyznaje nauczycielowi właściwy zakres klas.";
  s.preconditions = [
    login,
    "Przygotuj jedną szkołę podstawową z 400 uczniami oraz nowego nauczyciela przypisanego do niej. U szkoły i nauczyciela odznacz „Testowy”. Nie ustawiaj ręcznych decyzji BOK.",
    "Na początku szkoła ma pustą zakładkę „Zamówienia”. Dla promocji nowego klienta nie może mieć kwalifikujących zakupów z dwóch poprzednich lat. Dwa zakupy historyczne poniżej progu w NCL-04 są przygotowywane dopiero w trakcie tego przypadku.",
    "Każdy przypadek wykonuj na osobnym nauczycielu i szkole. Przy zapisie formularzy klubowych wyłącz wysyłanie e-maila.",
  ];
  if (debut)
    s.preconditions.push(
      [6, 8].includes(n)
        ? "Sprawdzaj po 30 września: data serwera ma przypadać od 1 października do końca roku. W innym okresie ten automat jest pomijany."
        : "Sprawdzaj w rzeczywistym okresie od otwarcia formularzy klubowych do 30 września. Administrator powinien potwierdzić datę otwarcia; automat wymaga jej w konfiguracji. Poza sezonem przypadek jest pomijany.",
    );
  const check =
    "Na karcie tego samego nauczyciela otwórz „Uprawnienia”, wybierz wpis z roku 2026/2027 i rozwiń szczegóły. Sprawdź przyznane klasy oraz źródło „automat”. " +
    s.expected.replace(/Eksport[^.]*\./g, "").replace(/Każdy etap[^.]*\./g, "");
  if (!debut) {
    s.data =
      "Potwierdzenia: Matematyka, klasa 4 NASZA, lata 2025/2026 i 2026/2027. T oznacza wartość „Próg” odczytaną w szczegółach „Uprawnień” dla klasy 4; nie wyliczaj jej samodzielnie i nie mnoż przez 60%. ";
    const preparation =
      form("Matematyka", "4", "2025/2026") +
      " " +
      form("Matematyka", "4", "2026/2027") +
      " Następnie w „Uprawnienia” rozwiń szczegóły bieżącego wpisu i zapisz wartość „Próg” dla klasy 4 jako T.";
    let action;
    if ([1, 2, 3].includes(n))
      action = `Na karcie szkoły wybierz „Zamówienia” → „Dodaj”, wyszukaj 4P-2, wpisz ilość ${n === 1 ? "T" : n === 2 ? "T−1" : "T+1"} i zapisz. Wróć do „Uprawnień” nauczyciela.`;
    if (n === 5)
      action =
        "Na karcie szkoły wybierz „Zamówienia” → „Dodaj”. Wyszukaj 7Pv i zamów T sztuk. Potwierdzenie nauczyciela pozostaje dla Matematyki klasy 4 — nie zmieniaj go na klasę 7. Ten przypadek sprawdza zakres wynikający z zakupów szkoły.";
    if (n === 6)
      action =
        "Na karcie szkoły wybierz „Zamówienia” → „Dodaj”. Dodaj 4P-2 oraz 7Pv, każdy w ilości T, i zapisz. Potwierdzenie nauczyciela pozostaje dla Matematyki klasy 4.";
    if ([7, 8].includes(n))
      action = `Utwórz zamówienie 4P-2 × T na karcie szkoły. W „Uprawnienia” nauczyciela najpierw sprawdź dostęp do 4, 5 i 6. Wróć do „Zamówień” szkoły, zaznacz zapisany dokument i ${n === 7 ? "wejdź w edycję, zmniejsz ilość do T−1 i zapisz" : "usuń go, potwierdzając usunięcie"}. Ponownie otwórz „Uprawnienia” nauczyciela.`;
    if (n === 4) {
      s.preconditions.push(
        "Do zmiany daty własnych zamówień potrzebna jest osoba z dostępem do bazy DEV. Samo wpisanie historycznej daty w żądaniu tworzącym zamówienie nie zapisuje jej.",
      );
      s.steps = [
        s.steps[0].replace("Sprawdź dane", "Otwórz karty i sprawdź dane"),
        preparation,
        "Na karcie szkoły dodaj zamówienie 4P-2 × 1. Zapisz ID i poproś administratora o zmianę daty utworzenia w bazie na 01.05.2024 oraz potwierdzenie daty ponownym odczytem. Nie przechodź dalej przed potwierdzeniem.",
        "Dodaj drugie, oddzielne zamówienie 4P-2 × 1. Administrator ma ustawić jego datę na 01.05.2025 i potwierdzić zapis. Nie zmieniaj pierwszego zamówienia.",
        "W „Uprawnienia” sprawdź brak przyznanych klas na podstawie samych zakupów po 1 sztuce. Następnie na karcie szkoły dodaj trzecie, bieżące zamówienie 4P-2 × T i zapisz.",
        check +
          " Uzupełniające sprawdzenie eksportu wykonuje QA; nie ma do niego przycisku na tej karcie.",
      ];
      s.data =
        "Dla roku zakupowego 2026: 4P-2 × 1 z 01.05.2024, osobne 4P-2 × 1 z 01.05.2025, a następnie bieżące 4P-2 × T. W kolejnych latach stosuje się Y−2 i Y−1. T odczytaj ze szczegółów „Uprawnień”.";
      continue;
    }
    s.steps = [
      "Otwórz karty przygotowanej szkoły i nauczyciela. Sprawdź powiązanie, puste „Zamówienia” i odznaczone flagi „Testowy”.",
      preparation + " " + action,
      check,
      "Kontrola techniczna uzupełniająca: poproś QA o odczyt eksportowanych uprawnień tego nauczyciela na 2026/2027. Klasy i przedmiot mają odpowiadać sprawdzonemu wynikowi. Sam widok „Uprawnienia” nie potwierdza eksportu do drugiego systemu.",
    ];
  } else {
    let action = "";
    let cls = "4";
    if ([1, 2, 3].includes(n)) {
      cls = n === 1 ? "4" : n === 3 ? "7 TNŚ" : "7";
      action = form(subject, cls, "2026/2027");
      s.preconditions.push(
        `Nauczyciel nie ma wcześniejszego naszego potwierdzenia z przedmiotu „${subject}”. Nie dodawaj żadnego zamówienia.`,
      );
    }
    if (n === 4)
      action =
        form("Matematyka", "4", "2025/2026", false) + " " + form("Matematyka", "4", "2026/2027");
    if (n === 5)
      action = form("Matematyka", "4", "2025/2026") + " " + form("Matematyka", "4", "2026/2027");
    if (n === 6) action = form("Matematyka", "4", "2026/2027") + " Nie dodawaj zamówienia.";
    if (n === 7)
      action =
        form("Matematyka", "4", "2025/2026") +
        " " +
        form("Matematyka", "4", "2026/2027") +
        " W „Uprawnienia” sprawdź brak dostępu z Matematyki. " +
        form("Fizyka", "7", "2026/2027");
    if (n === 8)
      action =
        form("Matematyka", "4", "2026/2027") +
        " Najpierw sprawdź brak dostępu. W szczegółach „Uprawnień” odczytaj Próg dla klasy 4 jako T. Na karcie szkoły otwórz „Zamówienia” → „Dodaj”, zamów 4P-2 × T i zapisz.";
    s.steps = [
      "Otwórz karty przygotowanej szkoły i nauczyciela. Sprawdź odznaczone „Testowy”, właściwy przedmiot i pustą listę „Zamówień”.",
      action,
      check,
      "Kontrola techniczna uzupełniająca: poproś QA o odczyt eksportu uprawnień na 2026/2027. Ma zawierać ten sam przedmiot i przyznane klasy, we właściwej serii. Widok w przeglądarce nie potwierdza samodzielnie tej wymiany danych.",
    ];
    s.data = `Przedmiot: ${subject}; szkoła podstawowa; rok bieżący 2026/2027, poprzedni 2025/2026. ${[1, 2, 3].includes(n) ? "Pierwsza deklaracja: klasa " + cls + "." : ""} ${n === 8 ? "Zamówienie 4P-2 w ilości T po zapisaniu potwierdzenia." : "Bez zamówień."}`;
  }
}
const collection = catalog.features.find((f) => f.id === "redmine-35980");
const scenarios35980 = {
  "01": [
    full,
    "Wykonaj osobno 12 kierunków: ZS → SP, LO, TECH; LO → ZS, SP, TECH; TECH → ZS, LO, SP; SP → ZS, LO, TECH. Za każdym razem na karcie źródła otwórz „Zamówienia”, zaznacz oryginał, kliknij „Kopiuj”, zaznacz jeden cel i „Zapisz”. Używaj nowego oryginału do każdego kierunku.",
    compare + " Dla każdego kierunku ma powstać jedna kopia tylko w zaznaczonym celu.",
  ],
  "02": [
    "Na karcie SP należącej do zespołu ZS otwórz „Zamówienia”, zaznacz oryginał i kliknij „Kopiuj”.",
    "Sprawdź nazwy dostępnych celów. Nie może być wśród nich źródłowej SP, szkoły z innego zespołu ani placówki bez powiązań. Kliknij „Anuluj”.",
    "Otwórz osobną szkołę bez struktury → „Zamówienia” i zaznacz jej oryginał. Przycisk „Kopiuj” ma być niedostępny.",
    "Część techniczna: poproś QA o próbę skopiowania do źródła, do innego zespołu i do samodzielnej szkoły, z pominięciem okna wyboru. Każda próba ma zostać odrzucona bez nowych dokumentów. Tych niedostępnych celów nie da się wybrać przez poprawnie działający formularz.",
  ],
  "03": [
    "Najpierw skopiuj oryginał z SP do LO. Otwórz kartę LO → „Zamówienia”, zaznacz dokument z dopiskiem „- kopia” i sprawdź, że „Kopiuj” nie pozwala ponowić operacji.",
    "W osobnej przeglądarce zaloguj się kontem z odczytem, bez prawa edycji szkoły. Otwórz oryginał w SP: konto widzi dokument, ale nie może go kopiować. Dodatkową próbę bezpośredniego wywołania operacji wykonuje QA.",
    "Część techniczna: poproś QA o próbę kopiowania zapisanej kopii z LO do trzeciej placówki wspólnej struktury. Serwer ma odmówić; nie powinien powstać kolejny dokument.",
  ],
  "04": [
    "Z „Zamówień” SP skopiuj jeden oryginał jednocześnie do ZS, LO i TECH. Otwórz listę każdej placówki i zanotuj symbol/ID jej kopii.",
    "Przygotuj drugi oryginał z inną ilością lub innym produktem i skopiuj go również do LO. W LO mają być dwie odrębne kopie, każda powiązana ze swoim źródłem.",
    "Wejdź w edycję pierwszego oryginału, zmień ilość i zapisz. Otwórz obie kopie w LO: ma zmienić się tylko kopia tego oryginału. Drugi oryginał i jego kopia pozostają bez zmian.",
  ],
  "05": [
    "Na karcie odbiorcy otwórz „Zamówienia”, zaznacz zapisaną kopię i sprawdź brak możliwości niezależnej edycji jej pozycji.",
    "Na karcie źródła kolejno edytuj oryginał: zmień ilość, dodaj produkt, usuń produkt i zastąp go innym. Zapisuj każdą zmianę. Po każdym zapisie wróć do odbiorcy i rozwiń kopię — jej aktualne produkty i ilości mają odpowiadać źródłu.",
    "Część techniczna: QA próbuje zapisać zmianę bezpośrednio w kopii, z pominięciem formularza. Próba nie może zmienić ani kopii, ani oryginału. Brak przycisku edycji sprawdza tylko część widoczną na stronie.",
  ],
  "06": [
    "W osobnych próbach skopiuj dokument w kierunkach SP → LO, ZS → SP i SP → ZS. Otwórz „Zamówienia” źródła i odbiorcy. Na liście oraz w nagłówku szczegółów kopii sprawdź symbol oryginału z dopiskiem „- kopia”.",
    "Rozwiń oba dokumenty. Porównaj kody produktów, ilości i adres źródłowego dokumentu. Kopia ma zachowywać dane źródła; nie oceniaj jej wyłącznie po podobnej nazwie na liście.",
  ],
  "07": [
    "Na karcie odbiorcy otwórz „Zamówienia”, zaznacz własną kopię i użyj „Usuń”. Potwierdź komunikat. Kopia ma zniknąć, a oryginał w źródle pozostać.",
    "Wróć do źródła, zaznacz ten sam oryginał i ponownie wybierz „Kopiuj”. Zaznacz tę samą placówkę docelową i zapisz.",
    "Otwórz listę odbiorcy ponownie. Ma być jedna aktywna kopia o treści zgodnej z oryginałem. Zanotuj jej ID i ID źródła — muszą się różnić. Ponowna aktywacja wcześniej usuniętej kopii jest dopuszczona.",
  ],
  "08": [
    "W SP przygotuj oryginał F7P × 3 i 4P-2 × 2, skopiuj go do LO i TECH. Przygotuj drugi, niezależny oryginał o innej treści oraz jego kopię w LO. Zapisz symbole wszystkich dokumentów.",
    "W „Zamówieniach” źródła zaznacz pierwszy oryginał, kliknij „Usuń” i potwierdź. Otwórz LO i TECH: jego kopie mają zniknąć. Drugi oryginał i jego kopia w LO muszą pozostać.",
  ],
  "09": [
    "Przygotuj połączone placówki, oryginał w źródle, jego kopię u odbiorcy i niezależne zamówienie kontrolne u odbiorcy. Zapisz symbole i treści dokumentów.",
    "Na świeżych danych wykonaj osobno każdy wariant: na karcie szkoły w „Struktura” usuń powiązanie; odwróć relację nadrzędna/podrzędna; zmień rodzaj relacji; zawieś przygotowaną szkołę. Każdy wariant zaczyna się od istniejącej kopii.",
    "Po każdej zmianie otwórz „Zamówienia” obu placówek: wcześniejsza kopia ma zniknąć, a oryginał i niezależny dokument pozostać. Po zmianie na wielobudynkowość ponownie skopiuj oryginał ręcznie i sprawdź treść oraz brak duplikatu.",
    "Otwórz „Historia zmian” szkoły i znajdź zdarzenie usunięcia kopii. Sprawdź ID dokumentu, rodzaj operacji, autora i datę. Sam wpis o zmianie relacji nie wystarcza.",
    "Otwórz edycję istniejącej placówki i sprawdź brak możliwości zmiany jej typu i poziomu. Zamknij formularz przez „Anuluj”; relacje i dokumenty powinny pozostać bez zmian.",
  ],
  10: [
    "Przygotowanie techniczne: poproś QA o wskazanie ID istniejącego zamówienia z integracji oraz jego aktywnej kopii, które mają historię ilości tego samego produktu. QA odczytuje powiązanie w bazie; sam podobny symbol na liście nie wystarcza.",
    "Na karcie źródła wejdź w „Zamówienia”, rozwiń wskazany dokument i otwórz historię ilości produktu. Otwórz tę samą historię w kopii odbiorcy i porównaj wpisy. Nie edytuj tych dokumentów.",
    "Pełne sprawdzenie aktualizacji wymaga wywołania kolejnej zmiany w systemie źródłowym i synchronizacji. Na DEV to zdarzenie nie jest dostępne. Odtworzenie bieżącej historii na stronie nie potwierdza działania przyszłej synchronizacji.",
  ],
  11: [
    "Przygotowanie techniczne: poproś QA o wskazanie istniejącej faktury lub korekty z integracji, jej kopii oraz placówek. Odczyt powiązania jest potrzebny do wybrania właściwych dokumentów; nie twórz faktury tylko na potrzeby tego odczytu.",
    "Na kartach wskazanych szkół otwórz „Zamówienia” i rozwiń dokumenty. Porównaj obowiązujące produkty, ilości i symbol kopii. Dla usuniętego lub anulowanego źródła sprawdź brak aktywnej kopii i wpis historii; logiczne usunięcie w bazie potwierdza QA.",
    "Sprawdzenie nowego zdarzenia wymaga obsługi Softlabu: wystawienia zastępującej faktury, korekty, anulowania lub usunięcia i uruchomienia synchronizacji. Te operacje nie są dostępne w tym teście DEV.",
    "Po udostępnieniu takiego zdarzenia trzeba osobno porównać dokumenty kontrolne, gratisy i uprawnienia przed i po zmianie. Obecny odczyt istniejących danych nie zalicza tej części.",
  ],
  12: [
    "Przygotuj kopie zamówień ze znanymi symbolami i rokiem: jedną z Matematyki i jedną z Fizyki. Zapisz, który symbol odpowiada któremu przedmiotowi.",
    "Na karcie odbiorcy otwórz „Zamówienia”. Zmień filtr roku na inny — właściwa kopia ma zniknąć; wróć do jej roku — ma się pojawić. Ustaw osobno przedmiot Matematyka i Fizyka oraz sprawdź odpowiednie dokumenty.",
    "Wyczyść filtry i odśwież kartę. Obie kopie mają ponownie być widoczne bez duplikatów; filtrowanie nie zmienia ich produktów ani ilości.",
  ],
  13: [
    "Przygotuj nauczyciela Fizyki w SP oraz zamówienie F7P. W osobnych próbach użyj oryginału 30 sztuk albo kopii 29, 30 lub 31 sztuk. Na karcie nauczyciela i szkoły odznacz „Testowy”.",
    "Przed zapisaniem potwierdzenia otwórz „Zamówienia” szkoły nauczyciela i sprawdź, że F7P z właściwą ilością rzeczywiście jest na liście. Kopia musi znajdować się w szkole tego nauczyciela.",
    "Na karcie nauczyciela wybierz „Kluby” → „Dodaj formularz”: Fizyka, rok 2026/2027, klasa 7 po stronie „nasze”, właściwa szkoła. Wyłącz mail i zapisz. Otwórz „Gratisy”: ma powstać zlecenie FIZ dla tej szkoły, również jeśli pozycja ma blokadę.",
    "Przygotuj trzech kolejnych nauczycieli na osobnych danych. Ustaw osobno: „Testowy” tylko u nauczyciela, tylko w szkole oraz u obu. Zapisz, które pola zaznaczono.",
    "Dla każdego z tych wariantów najpierw przygotuj szkolne zamówienie F7P, a następnie zapisz NASZE potwierdzenie Fizyki klasy 7 na 2026/2027.",
    "Otwórz „Gratisy”: przy zaznaczonym „Testowy” nauczyciela lista zleceń ma pozostać pusta. Samo „Testowy” szkoły nie blokuje utworzenia zlecenia u nietestowego nauczyciela. Ten przypadek nie sprawdza powodów blokady wysyłki.",
    "Kontrola formularza zamówienia: na nowych danych odznacz obie flagi „Testowy”. Na karcie szkoły przez „Zamówienia” → „Dodaj” zapisz F7P × 30 i ponownie otwórz dokument, potwierdzając kod i ilość.",
    "Dopiero po zapisaniu tego zamówienia dodaj NASZE potwierdzenie Fizyki klasy 7 na 2026/2027. W „Gratisach” sprawdź obecność zlecenia dla przygotowanej szkoły. Nie nadaj przesyłki.",
  ],
  14: [
    "Przygotuj nauczyciela Matematyki przypisanego tylko do placówki docelowej. W „Kluby” zapisz NASZE potwierdzenie klasy 4 na 2026/2027. Nie dodawaj ręcznej decyzji BOK. W źródle przygotuj kwalifikujące zamówienie 4P-2.",
    "Zanim skopiujesz zamówienie, otwórz „Uprawnienia” nauczyciela odbiorcy. Ilości ze źródła nie mogą być liczone jak zamówienie jego szkoły. Zanotuj stan dostępu.",
    "Na karcie źródła w „Zamówienia” skopiuj kwalifikujący dokument do szkoły nauczyciela. Wróć do „Uprawnień” i sprawdź ilości oraz przyznane klasy. Uzupełniającą kontrolę eksportu wykonuje QA.",
    "W osobnych próbach usuń kopię u odbiorcy lub zmniejsz ilość w oryginale poniżej progu. Wróć do „Uprawnień” i sprawdź, że dostęp wynikający wyłącznie z tego zakupu zostaje odebrany. Eksport po zmianie porównuje QA.",
    "W osobnych próbach na karcie „Uprawnienia” ustaw decyzję BOK: przyznanie ma pozostać po usunięciu kopii; odmowa nie może zostać zastąpiona przyznaniem po dodaniu kwalifikującej kopii.",
    "Dodaj w szkole odbiorcy niezależne zamówienie 4P-2 × 31. Usuń źródło i jego kopię. W „Uprawnienia” sprawdź, że własny, kwalifikujący zakup nadal pozwala na dostęp.",
    "Sprawdź osobno inny przedmiot i poprzedni rok szkolny w „Uprawnieniach”. Zakup nie może zmienić ich ilości ani dostępu. Potwierdzenie eksportu do drugiego systemu wymaga pomocy QA.",
  ],
  15: [
    "Otwórz „Historia zmian” odbiorcy i zanotuj ostatni wpis. Następnie na karcie szkoły wejdź w „Struktura”, usuń powiązanie, które łączy źródło z odbiorcą, i potwierdź operację.",
    "Wróć do „Historii zmian” i odszukaj nowy wpis o usunięciu konkretnej kopii: porównaj ID dokumentu, autora, datę i rodzaj zmiany. Sam wpis „usunięcie relacji” nie potwierdza historii usunięcia dokumentu.",
  ],
  16: [
    "Na karcie źródła w „Zamówienia” zaznacz oryginał i kliknij „Kopiuj”. Przy braku zaznaczonych celów „Zapisz” ma być nieaktywny.",
    "Zaznacz placówkę docelową, sprawdź uaktywnienie „Zapisz”, ale kliknij „Anuluj”.",
    "Ponownie otwórz „Zamówienia” źródła i odbiorcy. Oryginał pozostaje bez zmian, a nowa kopia nie powstaje.",
  ],
};
for (const s of collection.scenarios) {
  const n = s.id.slice(-2);
  s.steps = scenarios35980[n];
  if (!s.steps) throw Error("Missing manual instructions: " + s.id);
  s.description =
    "Sprawdzamy: " +
    s.title.toLowerCase() +
    ". Poniżej opisano czynności na stronie oraz oddzielnie te kontrole, które wymagają osoby technicznej.";
  s.preconditions = [
    login,
    legend,
    ...(["10", "11"].includes(n)
      ? [
          "Przygotuj z QA istniejące dane integracyjne na DEV oraz numery źródła i kopii. Ten przypadek służy do odczytu; nie zmieniaj faktur ani statusów biznesowych.",
        ]
      : [
          "Przygotuj wydzielone placówki i dokumenty testowe. Na kartach szkół w „Struktura” → „Dodaj powiązanie” ustaw relacje wskazane w krokach. Zapisz ID źródła i odbiorcy.",
          baseOrder,
        ]),
  ];
  if (["01", "02", "04"].includes(n)) s.preconditions.push(full);
  if (n === "09")
    s.preconditions.push(
      "Typ i poziom istniejącej szkoły są nieedytowalne. Zmiany struktury sprawdzamy przez powiązania, a nie zmianę typu placówki.",
    );
  if (n === "02")
    s.preconditions.push(
      "Dodatkowo: osobny zespół B ze swoją szkołą i placówka bez jakichkolwiek powiązań. Nie łącz ich ze strukturą ZS.",
    );
  if (n === "03")
    s.preconditions.push(
      "Oddzielne konto ograniczone: odczyt szkoły bez prawa jej edycji. Loguj je w innej sesji, żeby nie zastąpić konta głównego.",
    );
  if (["13", "14"].includes(n))
    s.preconditions.push(
      "Przygotuj nowego nauczyciela w szkole docelowej; 400 uczniów w szkole. W obu kartach „Testowy” wyłączone, chyba że dany krok sprawdza właśnie tę flagę. E-mail przy zapisie formularza klubowego wyłączony.",
    );
  s.data = ["13", "14"].includes(n)
    ? "Do każdego wariantu użyj osobnego nauczyciela. " +
      (n === "13"
        ? "Fizyka, klasa 7, rok 2026/2027; F7P w ilości 29, 30 lub 31 zgodnie z krokami."
        : "Matematyka, klasa 4, rok 2026/2027; 4P-2, ilości względem progu z „Uprawnień”; niezależny zakup kontrolny 31 sztuk.")
    : "Zapisz ID szkół oraz symbole i ID oryginałów i kopii. Domyślny oryginał: F7P × 3 oraz 4P-2 × 2; dokument kontrolny musi mieć odmienną treść, żeby rozpoznać nieuprawnioną zmianę.";
  if (["10", "11"].includes(n))
    s.data =
      "ID dokumentów i powiązanie źródło–kopia dostarcza QA po odczycie bazy. Nie zastępuj rzeczywistych danych integracyjnych ręcznym zamówieniem.";
}

// Pozostałe scenariusze zbiorcze prowadzą do tych samych istniejących przypadków.
const byId = new Map(catalog.features.flatMap((f) => f.scenarios.map((s) => [s.id, s])));
const giftPack = catalog.features.find((f) => f.id === "gratisy-szybki-test-2026").scenarios[0];
giftPack.description =
  "Szybko sprawdzamy najważniejsze zasady gratisów. Każdy z 13 wariantów wykonaj na nowym nauczycielu i osobnej szkole; nie zmieniaj danych jednego wariantu w następny.";
giftPack.preconditions = [
  login,
  "Przygotuj osobne dane dla każdego wariantu. Dane i wynik są opisane w krokach oraz w pełnym przypadku o podanym numerze. Przed potwierdzeniem nauczyciela szkoła ma już mieć zamówienie z właściwą datą.",
  "Zmianę daty zamówienia w bazie DEV musi wykonać administrator. Poczekaj na potwierdzenie zapisu; samo ustawienie daty w formularzu żądania nie wystarcza.",
  "Na kartach nauczyciela i szkoły odznacz „Testowy”, poza wariantem POTW26-01-TEST-TEACHER. Zapis formularza klubowego zawsze bez maila.",
];
giftPack.steps = giftPack.testIds.map((id) => {
  const s = byId.get(id);
  if (!s) throw Error(id);
  return `${id}: ${s.title}. ${s.data} Następnie na karcie nauczyciela wybierz „Kluby” → „Dodaj formularz”, wpisz rok i przedmiot zgodnie z tym przypadkiem, zaznacz właściwą klasę i zapisz bez maila. Otwórz „Gratisy”. Wynik: ${s.expected}`;
});
giftPack.data =
  "Dla bieżących SP: 400 uczniów i Próg 30; wariant poniżej minimum ma 29 szt., dodatni 30. Warianty LOW mają 8 uczniów, Próg 1 i odpowiednio 4 lub 5 sztuk. SŚ: klasa 2, zakres podstawowy, MLK2-1 × 1. Szczegóły pozostałych wariantów podano w każdym kroku.";
const club = byId.get("CLUB-52");
club.description =
  "Sprawdzamy, czy nauczyciel po negatywnej weryfikacji może wrócić do statusu „Nasz” przez edycję tego samego formularza. Nie dodajemy drugiego formularza.";
club.preconditions = [
  login,
  "Przygotuj jednego nowego nauczyciela przypisanego do jednej szkoły podstawowej. W przedmiotach nauczyciela dodaj „Matematyka”, poziom SP. Nie powinien jeszcze mieć formularza klubowego.",
  "Konto musi mieć dostęp do przycisku „Weryfikuj neg.” oraz edycji formularza. Wybierz bieżący rok szkolny; przy każdym zapisie wyłącz wysyłanie maila.",
];
club.data =
  "Matematyka, szkoła podstawowa, klasa 4, bieżący rok formularza. Zapisz ID nauczyciela i identyfikator pierwszego formularza, aby przez cały test edytować ten sam dokument.";
club.steps = [
  "W „Nauczyciele” wyszukaj przygotowaną osobę po ID. Sprawdź przypisanie do szkoły i „Matematyka / SP”.",
  "Otwórz „Kluby” → „Dodaj formularz”. Wybierz bieżący rok, Matematyka, swoją szkołę i klasę 4 po stronie „nasze”. Wyłącz „Wysłać maila do nauczyciela”, kliknij „Zapisz” i sprawdź status „Nasz”.",
  "Na liście formularzy zaznacz zapisany formularz i kliknij „Weryfikuj neg.”. Po zakończeniu status nauczyciela ma zmienić się na „Obcy”.",
  "Zaznacz ten sam formularz i kliknij „Edytuj”. Sprawdź, że klasa 4 jest po stronie „obce”, a wydawnictwo ma wartość „INNE”.",
  "Odznacz klasę 4 po stronie „obce”, zaznacz klasę 4 po stronie „nasze”, wyłącz wysyłkę maila i kliknij „Zapisz”.",
  "Opuść kartę i ponownie wyszukaj tego nauczyciela. Status ma być „Nasz”. Otwórz edycję tego samego formularza: 4 NASZA zaznaczona, 4 OBCA odznaczona; nie powinien powstać dodatkowy formularz.",
];
const release = catalog.features.find((f) => f.id === "octopus-regresja-przed-releasem")
  .scenarios[0];
const releaseManual = {
  "ADD-01":
    "W „Nauczyciele” kliknij „Dodaj”. Wpisz testowe imię, unikalne nazwisko i e-mail w domenie example.invalid, wybierz przygotowaną szkołę. Nie dodawaj przedmiotu ani poziomu. Kliknij „Zapisz”; jeśli pojawi się pytanie o brak przedmiotu, potwierdź zapis. Wyszukaj nauczyciela ponownie — zapisane dane i szkoła mają pozostać.",
  "ADD-15":
    "W „Nauczyciele” → „Dodaj” wypełnij nazwisko, szkołę i kontakt, pozostawiając puste pole „Imię”. Kliknij „Zapisz”. Formularz ma wskazać wymagane imię, a nauczyciel nie może zostać utworzony. Zamknij przez „Anuluj”.",
  "EDIT-12":
    "Otwórz przygotowanego nauczyciela z zapisanym e-mailem. Przy polu e-mail kliknij ikonę edycji, wpisz nowy poprawny adres testowy i „Zapisz”. Otwórz kartę ponownie oraz „Historię zmian” — nowy e-mail ma być trwały, a zmiana widoczna w historii.",
  "SCH-03":
    "W „Szkoły” kliknij „Dodaj”. Wpisz unikalną nazwę, wybierz „Szkoła podstawowa”, dodaj wymagany adres i zapisz. Wyszukaj szkołę ponownie po nazwie — ma istnieć jeden nowy rekord o wpisanym typie i adresie.",
  "SCH-04":
    "W „Szkoły” → „Dodaj” wybierz typ i wpisz wymagany adres, ale pozostaw pustą nazwę. Kliknij „Zapisz”. Zapis ma być zablokowany z informacją o wymaganej nazwie. Zamknij formularz przez „Anuluj”.",
  "SCH-EDIT-04":
    "Otwórz własną szkołę z zapisanymi WWW i e-mailem. Ikoną edycji przy „WWW” zmień adres na https://qa-release.example.com/path i zapisz. Osobno zmień e-mail na nowy testowy adres. Opuść kartę i otwórz ją ponownie — obie wartości mają pozostać.",
  "CLUB-01":
    "Na karcie nowego nauczyciela dodaj przedmiot Matematyka / SP. W „Kluby” → „Dodaj formularz” wybierz bieżący rok, szkołę oraz 4 po stronie „nasze”. Wyłącz mail i zapisz. Ponownie otwórz kartę — przedmiot i formularz mają być zapisane.",
  "CLUB-02":
    "Przygotuj nauczyciela z NASZYM potwierdzeniem Matematyki SP klasy 4. W „Kluby” zaznacz formularz i „Edytuj”. Odznacz 4, zaznacz 5, wyłącz mail i zapisz. Otwórz edycję ponownie — 5 ma być zaznaczona, a 4 odznaczona.",
  "CLUB-52": club.steps.join(" "),
  "THR-12":
    "Przygotuj szkołę podstawową z liczbą uczniów 400 w jej danych. Otwórz kartę szkoły i sprawdź pole „Próg”: ma pokazywać 30. Nie zmieniaj tego pola ręcznie.",
  "ACC-01":
    "Przygotuj NASZE potwierdzenie Matematyki klasy 4 na 2026/2027. W „Uprawnienia” wybierz wpis i „Edycja”. Przyznaj klasę 4, a pozostałym klasom ustaw odmowę i zapisz. QA odczytuje eksport: ma zawierać wyłącznie właściwą klasę 4 z poziomem SP i zakresem Matematyki. Same kliknięcia na karcie nie potwierdzają eksportu.",
  "ORD-01":
    "Na karcie szkoły otwórz „Zamówienia” → „Dodaj”. Wyszukaj F7P, dodaj 1 sztukę i zapisz. Opuść kartę, otwórz szkołę ponownie i rozwiń ten dokument — F7P oraz ilość 1 mają pozostać.",
  "ORD-03":
    "Na karcie szkoły dodaj zamówienie F7P × 1 oraz P5Pv × 2. Zaznacz zapisany dokument i wejdź w edycję. Zmień ilości na F7P × 3 i P5Pv × 5, zapisz i otwórz dokument ponownie. Sprawdź nowe ilości, następnie usuń tylko ten dokument i potwierdź, że zniknął.",
  "ORD-05":
    "Na karcie szkoły otwórz „Zamówienia”, zanotuj widoczne dokumenty i kliknij „Dodaj”. Nie wybieraj produktów. Kliknij „Anuluj” i sprawdź, że nie pojawiło się nowe zamówienie.",
  "ORD-COPY-01": byId.get("ORD-COPY-01").steps.join(" "),
  "MED-02":
    "W „Szkoły” → „Szukaj” znajdź „Szkoła Podstawowa nr 5”, miejscowość Lębork (DEV). Otwórz kartę i sprawdź „Medal”: złoty medal jest widoczny, a pole jest nieedytowalne. Nie zmieniaj danych tej szkoły.",
  "GFT-01":
    "Otwórz „Centrum wysyłkowe” → „Gratisy”. Sprawdź filtry, kolumny tabeli i przyciski. Bez zaznaczenia wiersza „Edycja rekordów” ma być niedostępna.",
  "GFT-02":
    "W „Centrum wysyłkowe” → „Gratisy” dodaj własny gratis AUTO z unikalnym kodem, Matematyka / SP / klasa 4 i wagą 123 g. Sprawdź tabelę po odświeżeniu i zapis w bazie z QA. Ołówkiem zmień tytuł, symbol, wagę na 250 g oraz dodaj klasę 5. Sprawdź trwałość zmian i to samo ID. Usuń własny gratis śmietnikiem, potwierdź „Tak” i sprawdź brak aktywnego wpisu.",
};
release.steps = release.testIds.map((id) => {
  const s = byId.get(id);
  const manual =
    releaseManual[id] ||
    (id.startsWith("NCL-")
      ? s.steps.join(" ")
      : id.startsWith("POTW26-")
        ? [s.data, ...s.steps].join(" ")
        : null);
  if (!manual) throw Error("Missing release instructions " + id);
  return id + ": " + manual;
});
release.description =
  "Przed releasem sprawdzamy 26 najważniejszych przypadków Octopusa. Możesz uruchomić powiązane automaty albo wykonać poniższe czynności ręcznie. Każdy numer wskazuje jeden istniejący test.";
release.data =
  "Każdy zapis wykonuj na własnych danych testowych z unikalną nazwą lub nazwiskiem i adresem e-mail w domenie example.invalid. Zapisuj ID szkoły, nauczyciela i numery dokumentów. Dla NCL i gratisów używaj osobnych, nowych nauczycieli i pustych szkół; nie łącz tych wariantów na jednych danych. MED-02 jest wyłącznie odczytem wskazanej istniejącej szkoły.";
release.preconditions = [
  login,
  "Przygotuj dane opisane przy każdym przypadku. Dla tworzenia szkoły potrzebne są unikalna nazwa, typ oraz poprawny adres; dla nauczyciela — imię, nazwisko, szkoła i testowy e-mail.",
  "Część gratisowa wymaga dat ustawionych w bazie DEV przed dodaniem potwierdzenia nauczyciela. Osoba bez dostępu do bazy przekazuje przygotowane ID administratorowi i czeka na potwierdzenie.",
  "Uprawnienia nowego klienta sprawdzaj na szkołach z 400 uczniami bez historii kwalifikujących zakupów i nauczycielach bez flagi Testowy. Eksport uprawnień oraz kontrolę ACC-01 potwierdza QA.",
  "Po sprawdzeniu zapisz wyniki poszczególnych przypadków. Dane usuwaj dopiero po zapisaniu dowodów; przy niepowodzeniu zachowaj numery rekordów do wyjaśnienia.",
];
for (const s of collection.scenarios.filter((s) => ["13", "14"].includes(s.id.slice(-2))))
  s.preconditions = s.preconditions.filter((p) => p !== baseOrder);
for (const s of promo.scenarios) {
  if (s.id === "DEB-06")
    s.description =
      "Sprawdzamy, że po 30 września pierwsze nasze potwierdzenie bez zakupów nie przyznaje promocji debiutu.";
  if (s.id === "DEB-08")
    s.description =
      "Sprawdzamy, że po sezonie kwalifikujący zakup daje zakres zamówieniowy 4–6, a nie pełny zakres debiutu 4–8.";
}

fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + "\n");
console.log("Przepisano instrukcje kopiowania i promocji; zachowano ID i powiązania automatów.");
