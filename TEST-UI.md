# Octopus Test Runner UI

Lokalny panel do uruchamiania testów, śledzenia wyników, analizy awarii i obsługi danych testowych bez ręcznego składania poleceń Playwrighta.

## Uruchomienie

```powershell
npm run test-ui
```

Domyślny adres:

```text
http://127.0.0.1:4173
```

Inny port można wskazać przez `OCTOPUS_TEST_UI_PORT`.

### Panel już działa — błąd EADDRINUSE

Komunikat `listen EADDRINUSE ... 127.0.0.1:4173` oznacza, że port 4173 jest już zajęty. Najpierw otwórz [http://127.0.0.1:4173](http://127.0.0.1:4173). Jeżeli widzisz Octopus Test Runner, panel działa i nie trzeba drugi raz wykonywać `npm run test-ui`. Odśwież istniejącą kartę klawiszem F5.

Panel może działać w innym terminalu albo w tle, również gdy terminal, w którym właśnie wpisujesz polecenie, jest pusty. Nie zatrzymuj przypadkowych procesów Node.js — mogą należeć do VS Code albo aktywnych testów.

Jeżeli pod tym adresem nie ma naszego panelu, trzeba ustalić, jaki program zajmuje port. Alternatywnie można uruchomić panel na innym, wolnym porcie, np. 4174:

```powershell
$env:OCTOPUS_TEST_UI_PORT = "4174"
npm run test-ui
```

Wtedy otwórz `http://127.0.0.1:4174`. Nie uruchamiaj równoczesnych testów na tym samym środowisku z dwóch paneli. Zmiana portu nie zwalnia blokady trwających testów.

## Funkcje

### Debugger testów — pierwsza wersja

Otwórz **Debugger testów** w menu. Wybierz środowisko i test, przeczytaj zakres, a następnie kliknij **Rozpocznij debugowanie**. To wykonuje rzeczywisty test; przygotowanie sesji i danych odbywa się automatycznie. Przycisk **Następny krok** lub klawisz **F10** wykonuje jeden opisany etap, który może zawierać kilka działań przeglądarki albo żądań API.

Konfiguracja i sesja mają osobne widoki. Po starcie podgląd pojawia się po lewej, a etapy po prawej; pod podglądem są pomiary i logi. **Konfiguracja** pozwala wrócić do formularza, a **Wróć do sesji** przywraca podgląd bez ponownego uruchamiania testu. W czasie wykonania wybór testu pozostaje zablokowany. Przyciski ▶, Ⅱ i ■ oznaczają kontynuację, pauzę oraz zatrzymanie; opis można sprawdzić po najechaniu lub w **Instrukcji**. Pomiary z pliku wydajności pojawiają się wyłącznie dla bieżącego przebiegu; czasy debugowania obejmują także pauzy.

- **UI:** obraz rzeczywistej sesji Playwrighta odświeża się w panelu. Kliknięcia w obraz nie sterują stroną.
- **API:** rozwiń etap, aby zobaczyć żądanie, odpowiedź i rezultat kontroli. Dane uwierzytelniające są ukryte.
- **Kontynuuj automatycznie:** wykonuje kolejne etapy bez oczekiwania na przycisk. **Pauza przed następnym krokiem** nie przerywa aktualnie wykonywanego etapu.
- **Zatrzymaj test:** kończy proces. Może przerwać sprzątanie i pozostawić dane testowe.
- Po zakończeniu dostępne są raport Playwrighta i **Zapis kroków JSON**. Wynik pojedynczego etapu nie zastępuje wyniku całego testu. Końcowy odebrany obraz UI trafia także do załączników testu.

W pilotażu obsługiwane są testy `MED-BUG-37204-01`–`04` (UI: filtry medalu) i `ORD-SPEC-35980-05`–`08` (API: ograniczenia kopiowania). Pozostałe przypadki nadal działają w katalogu oraz istniejącym Inspektorze; wymagają dodania opisanych etapów do tego debuggera. Pierwsza wersja jest w Octopusie, z mechanizmem przygotowanym do wykorzystania w pozostałych panelach.

W testach API kopiowania są dodatkowe punkty podglądu: **po przygotowaniu danych**, **po badanym żądaniu API** oraz **przed sprzątaniem**. Pokazują ID i nazwy szkół, źródło i cel, ID zamówień oraz linki do profili szkół. Po otwarciu linku wybierz zakładkę Zamówienia; po żądaniu odśwież otwartą kartę. Przed wysłaniem można także przeczytać planowane żądanie. Dane przygotowawcze mogą wymagać wcześniejszych wywołań API; punkt „przed API” dotyczy konkretnej badanej próby kopiowania.

Te punkty zawsze wstrzymują automatyczną kontynuację. Dane pozostają do obejrzenia również po błędzie asercji, do naciśnięcia **Zatwierdź sprzątanie**. Nie edytuj ich ręcznie — zmieniłoby to warunki testu. Po zakończeniu sesji zapis ID i linków pozostaje w krokach JSON, ale dokumenty mogą już być usunięte przez sprzątanie. Przycisk Zatrzymaj test nadal kończy proces od razu i może przerwać sprzątanie.

Test UI dodaje etapy przez `guidedUiStep` z `tests/support/guided-ui-step.ts` i oznaczenie `@step-ui`. Test API korzysta z istniejącego `guidedApiStep` oraz `@step-api`. Zwykłe uruchomienie tych testów nie czeka na debugger. Obraz jest przechowywany w pamięci tylko dla bieżącej sesji. Sterowanie i aktualizacje obrazu są powiązane z identyfikatorem przebiegu; klucz połączenia procesu testowego nie jest publikowany w stanie panelu.

Izolowaną kontrolę debuggera uruchamia `npm run test:debugger`. Korzysta z lokalnej strony próbnej i przechwyconych wywołań panelu, bez logowania do Octopusa i bez testów na DEV/TEST.

### Scenariusze testowe

Menu **Scenariusze** prowadzi do opisów funkcjonalności: warunków wstępnych, kroków, oczekiwanych wyników i powiązanych ID testów. Pierwszy zestaw obejmuje kopiowanie zamówień w strukturze placówek, Redmine 37160. Wyszukiwanie działa po ID, nazwie i numerze zgłoszenia. Przycisk wyboru zaznacza wyłącznie powiązany test w katalogu, ale go nie uruchamia. Szczegóły: [kopiowanie zamówień](docs/tests/kopiowanie-zamowien-struktura.md).

Opisy są zapisane lokalnie w `test-ui/scenarios.json`. Brak powiązanego testu lub brak danych wymaganych do automatyzacji jest widoczny i blokuje przycisk wyboru. Po zmianach serwera panel wymaga restartu; samo odświeżenie karty nie dodaje nowych endpointów do już działającego procesu.

- wybór środowiska DEV lub TEST;
- pakiety: cała regresja, nauczyciele, szkoły, zamówienia, klubowiczostwo i medalowość;
- 1, 2 lub 4 workery, z ograniczeniem ORD do maksymalnie 2;
- tryb headed lub headless;
- grep po nazwie, tagu albo ID;
- wybór pojedynczych scenariuszy checkboxami;
- Start, Stop i **Ponów failed**;
- log Playwrighta na żywo;
- liczniki `Passed`, `Expected failed`, `Failed` i `Skipped`;
- osobny raport HTML dla każdego przebiegu;
- raport wydajności i historię 30 ostatnich uruchomień;
- sklasyfikowane przyczyny niepowodzeń;
- podgląd nauczycieli i szkół z `runs/REG_*.json`;
- bezpieczne usuwanie nauczycieli testowych z DEV;
- osobny workflow `MED-YEAR-*`.

### Struktura szkoły w panelu

Pakiet **Szkoły** obejmuje zarówno `szkola-struktura.spec.ts` (STR-01–STR-87), jak i `szkola-struktura-dodawanie.spec.ts` (STR-88–STR-106). Można uruchomić pakiet, użyć pola Grep z `@structure` albo zaznaczyć konkretne krótkie ID na liście testów. Zaznaczone testy mają pierwszeństwo przed pakietem i Grep, a ich ID są dopasowywane dokładnie (STR-10 nie wybiera STR-100).

Po zmianie serwera panelu należy ponownie uruchomić `npm run test-ui`, a w przeglądarce odświeżyć stronę i listę przyciskiem **Odśwież**. Nowe testy tworzenia szkoły korzystają z dedykowanych danych; relacje są sprzątane, szkoły testowe pozostają zgodnie z opisem [testów Struktury](docs/tests/struktura-szkoly-krok-po-kroku.md).

### Kategoria szkoły w panelu

Pakiet **Szkoły** zawiera `szkola-kategoria.spec.ts` (CAT-01–CAT-34) oraz `szkola-kategoria-dodawanie.spec.ts` (CAT-35–CAT-53). Grep `@category` wybiera oba zestawy, a `@category.*@school-add` tylko testy tworzenia; na liście można wybrać pojedyncze ID CAT. [Dokumentacja kategorii](docs/tests/kategoria-szkoly.md) rozpisuje sprawdzenia i stan weryfikacji. Po dodaniu nowego pliku serwer panelu wymaga ponownego uruchomienia — dopiero po zakończeniu aktywnych testów. Nie należy zatrzymywać trwającej regresji ani usuwać jej blokady, aby wymusić drugi start.

W pakiecie Szkoły dostępny jest również `szkola-nauczyciele-filtry.spec.ts` z TFL-01–TFL-30. Grep `@teacher-filter` wybiera całość; ID `TFL-26:` wybiera regresję aktualnego GWO przed przyszłym Obcy po GWO. Formularze są przygotowywane przez API, a filtry i liczniki sprawdzane w UI. Aktywny rok domyślny to 2026/2027; po zmianie roku systemu ustaw `OCTOPUS_TFL_CURRENT_SCHOOL_YEAR` przed startem panelu. TFL-26 jest pomijany z powodem do pojawienia się przyszłego roku 2027/2028 w słowniku (około kwietnia). Testy nie zostały uruchomione na prośbę użytkownika. [Instrukcja każdego scenariusza](docs/tests/filtry-nauczycieli-w-szkole.md) opisuje tworzone dane, oczekiwania i sprzątanie.

W pakiecie Szkoły są też SFLT-01–SFLT-32 (`szkola-wyszukiwanie-filtry.spec.ts`), wybierane przez `@school-search`. SFLT-28–SFLT-30 wymagają skonfigurowania kontrolowanych szkół z SI, a SFLT-31 jest oczekiwanym błędem brakującego pola Notatki. [Dokumentacja wyszukiwarki](docs/tests/wyszukiwarka-szkol-filtry.md) zawiera kroki i konfigurację. Testy nie zostały uruchomione.

## Przepływ uruchomienia

Pakiet Zamówienia obejmuje również `zamowienia-dokumenty.spec.ts`: ORD-DOC-01–ORD-DOC-30, grep `@order-document`. Przygotowanie zamówień i większości dokumentów odbywa się przez API; testy operacji formularza używają UI. ORD-DOC-28 wymaga zmiennej `OCTOPUS_ORDER_EXTERNAL_REFERENCE` z istniejącym testowym zamówieniem z integracji. [Konfiguracja i zakres](docs/tests/dokumenty-zamowien.md).

Pakiet Szkoły obejmuje THR-01–THR-22 (`@threshold`). Pakiet Nauczyciele obejmuje PERM-01–PERM-25, ACC-01–ACC-10 oraz ACL-01–ACL-17 (`@entitlement`). Dodatkowe filtry to `@access-api` i `@access-lifecycle`. Parser obsługuje pojedyncze ID tych grup. [Dane, bezpieczeństwo i zakres Uprawnień](docs/tests/uprawnienia-i-progi.md). Przed odświeżeniem konfiguracji uruchomionego serwera panelu poczekaj na koniec aktywnych testów. Grep `@unmarked` wybiera PERM-23–PERM-25: wariant bez flag Testowy u nauczyciela i szkół.

Pakiet Zamówienia obejmuje `zamowienia-klasa.spec.ts` (ORD-CLASS-01–ORD-CLASS-22). Grep `@order-class` wybiera testy kolumny Klasa. Przygotowanie, edycje i sprzątanie zamówień korzystają z API; UI służy do kontroli trzech widoków. LS jest warunkowo pomijany z powodu braku produktu. [Dokumentacja](docs/tests/klasa-w-zamowieniach.md).

```text
przeglądarka :4173
    │ POST /api/run
    ▼
scripts/test-ui-server.mjs
    │ node <playwright-cli> test ...
    ▼
Playwright
    ├── stdout/stderr ───────────────► log na żywo
    ├── runs/html-reports/<run-id>/ ─► raport HTML
    ├── runs/performance-*.json ─────► raport wydajności
    └── runs/failures-*.json ────────► przyczyny awarii
```

Serwer używa lokalnego pliku CLI Playwrighta i `node.exe`, dzięki czemu na Windows nie zależy od uruchamiania `npx.cmd` przez `spawn`.

## Diagnostyka awarii

Po nieudanym przebiegu karta statusu pokazuje sekcję **Dlaczego testy się nie powiodły**. Dla każdego testu widoczne są:

- kategoria i krótkie objaśnienie;
- ID testu;
- lokator, jeśli reporter potrafił go odczytać;
- ostatnia akcja Playwrighta;
- sugestia dalszej analizy;
- rozwijany pełny komunikat techniczny;
- link do raportu ze screenshotem i trace.

Rozpoznawane kategorie:

| Kategoria                | Znaczenie                                                  |
| ------------------------ | ---------------------------------------------------------- |
| Brak elementu            | lokator nie znalazł pasującego elementu                    |
| Element niewidoczny      | element istnieje, ale nie stał się widoczny                |
| Element nieaktywny       | element pozostał disabled                                  |
| Element zasłonięty       | kliknięcie przechwytuje inny element, overlay albo spinner |
| Niejednoznaczny lokator  | lokator pasuje do wielu elementów                          |
| Niespełnione oczekiwanie | wartość otrzymana różni się od oczekiwanej                 |
| Nawigacja / sieć / sesja | problem ze stroną, API albo uwierzytelnieniem              |
| Przekroczony czas        | operacja nie zakończyła się w limicie                      |

Klasyfikacja ułatwia diagnozę, ale pełny call log i trace pozostają rozstrzygającym źródłem szczegółów.

## Passed i expected failed

Test oznaczony przez `test.fail()` może zakończyć się błędem zgodnie z oczekiwaniem. Panel prezentuje wtedy:

```text
Passed          wynik Playwrighta, łącznie z expected failures
Expected failed liczba kontrolowanych, oczekiwanych awarii
Failed          tylko nieoczekiwane awarie
Skipped         testy pominięte
```

Expected failure nie trafia do sekcji przyczyn ani do **Ponów failed**.

## Raporty per run

Każdy przebieg panelu otrzymuje własny katalog:

```text
runs/html-reports/<run-id>/index.html
```

Historia znajduje się w `runs/test-ui-history.json`, a przyczyny w `runs/failures-<run-id>.json`. Uruchomienie pojedynczego testu nie nadpisuje wcześniejszego raportu z panelu.

## Dane testowe

Panel czyta wyłącznie lokalne rejestry `runs/REG_*.json`; nie pobiera całej bazy.

### Nauczyciele

Widok pokazuje ID, identyfikator `REG_*`, e-mail, środowisko, test, wynik i `cleanupStatus`. Rekord można otworzyć w Octopusie. Dla bezpiecznych rekordów DEV dostępne jest pojedyncze lub zbiorcze usuwanie.

UI korzysta z `scripts/cleanup-teachers.mjs`. Przed DELETE ponownie sprawdzane są dane rekordu, testowy e-mail, flaga `Testowy` i środowisko. Cleanup jest blokowany podczas aktywnego przebiegu.

### Szkoły

Szkoły można przeglądać i otwierać. Nie ma przycisku usuwania, ponieważ projekt nie ma obsługiwanego endpointu cleanupu szkół.

## Workery

- zwykłe pakiety: 1, 2 lub 4;
- ORD: 1 lub 2, z osobnymi szkołami referencyjnymi na worker;
- `MED-YEAR-*`: zawsze 1.

## Roczna medalowość

Panel uruchamia `MED-YEAR-PREP` i `MED-YEAR-01` jako osobne, potwierdzane operacje, ustawia `OCTOPUS_INCLUDE_ANNUAL=1` i wymusza jeden worker. Testy te nie wchodzą do zwykłej regresji.

## Endpointy lokalne

### Raporty przy scenariuszach

Widok scenariuszy pokazuje ostatni powiązany przebieg, jego datę, środowisko i zakres (np. 1/3 testów), link do raportu oraz historię pięciu ostatnich przebiegów. Wyniki są odczytywane z zakończonych raportów zapisanych przez panel i tylko z wybranego środowiska. Nie łączymy wyników różnych przebiegów w jeden PASS. Brakujące lub nieczytelne raporty są sygnalizowane.

Braki archiwum są opisane osobno, w rozwijanej informacji na górze widoku. Nie dodajemy globalnego ostrzeżenia do wyników niezwiązanych scenariuszy. Na karcie scenariusza można sprawdzić liczbę jego własnych przebiegów bez raportu. Jeżeli brakuje raportu nowszego powiązanego przebiegu, karta ostrzega o tym przy wyniku ostatniego dostępnego zapisu. Brak HTML nie oznacza braków w pokryciu testami.

Powiązanie kroku z raportem definiuje opcjonalne `stepLinks` w `test-ui/scenarios.json`: indeks `step` liczony od zera oraz `testId` należący do scenariusza i tablica dokładnych nazw `titles` z `test.step`. Krok obejmujący kilka testów używa `checks: [{ testId, titles }, ...]`. Wszystkie wymagane testy i etapy muszą być zapisane jednoznacznie w tym samym przebiegu, aby krok otrzymał PASS. FAIL dowolnego wymaganego etapu pozostaje widoczny także przy braku zapisów pozostałych etapów. Rozwijana lista „Powiązane etapy” umożliwia przejście do każdego z nich oddzielnie.

Powiązano 122 kroki we wszystkich 35 scenariuszach: cały zestaw ORD-COPY-01–19 i 16 scenariuszy zbiorczych #35980. Pozostałe 3 kroki w ORD-SC-35980-10 i -11 wymagają kontrolowanego zdarzenia/synchronizacji, których nie można wywołać na DEV. Nowe testy SQL/API/UI sprawdzają wyłącznie istniejący stan; brak odpowiednich danych oznacza SKIP, nie PASS. Samo powiązanie lub pełna automatyzacja kroku nie dowodzi poprawnego działania. Znane niezgodności gratisów i uprawnień pozostają widoczne jako FAIL, nie są maskowane zmianą oczekiwań. Wewnętrzne warstwy dostępu i kontrola zegara nie są potwierdzane testem końcowego statusu. Istniejącym kontrolom bez nazw dodano etapy `test.step`. Te nazwy pojawiają się w raportach z kolejnych uruchomień — stare raporty nie są przepisywane. „Brak zapisu kroku” oznacza wtedy gotowe powiązanie, ale brak odpowiedniego zapisu w wybranym raporcie.

Przycisk „Pokaż wykonanie” otwiera konkretny przebieg i wskazany etap bez ponownego uruchamiania testu. Brak mapowania albo etapu w starszym raporcie nie oznacza PASS.

Wynik kroku nie oznacza zaliczenia całego testu ani wymagania. Załączniki w podglądzie należą do całego wykonania testu. Automatyzacja (pokrycie) pozostaje osobną informacją.

```text
GET  /api/status
GET  /api/tests
GET  /api/scenario-evidence?environment=dev
GET  /api/test-preview?id=<test-id>&environment=dev&runId=<run-id>
POST /api/run
POST /api/stop
GET  /api/history
GET  /api/test-data
POST /api/test-data/teachers/delete
GET  /api/performance/latest
POST /api/rerun-failed
GET  /report/<run-id>/
```

## Pliki panelu

```text
scripts/test-ui-server.mjs
test-ui/index.html
test-ui/app.js
test-ui/styles.css
```

Panel nie wymaga osobnych bibliotek frontendowych.

## Rozwiązywanie problemów

### Otwieranie ze zgłoszenia w Centrum testów

Przycisk „Otwórz panel testów” na karcie zgłoszenia otwiera nową kartę z zaznaczonymi automatycznymi scenariuszami przypiętymi do tego zgłoszenia. Lista pokazuje ten wybór; przycisk „Przejdź do pełnego katalogu” odsłania pozostałe scenariusze. Samo otwarcie karty nie uruchamia testów. Zaznaczone ID mają pierwszeństwo przed pakietem i filtrem grep.

Jeśli przypiętego ID nie ma w aktualnym katalogu lub dotyczy osobnego workflow rocznego, panel pokazuje ostrzeżenie i blokuje uruchomienie z tego wyboru. Wyczyść nieaktualne powiązania w Centrum albo świadomie przejdź do pełnego katalogu. Testy ręczne nie są wysyłane do automatycznego wykonania.

- Po zmianie plików panelu zatrzymaj serwer przez `Ctrl+C`, uruchom go ponownie i odśwież stronę przez `Ctrl+F5`.
- Jeżeli brakuje Playwrighta, wykonaj `npm install`.
- Jeżeli port jest zajęty, ustaw inną wartość `OCTOPUS_TEST_UI_PORT`.
- Jeżeli test kończy się bez sklasyfikowanej przyczyny, otwórz raport HTML i trace; reporter użyje wtedy kategorii **Inny błąd**.

Powrót do [głównej dokumentacji](README.md).

### Debugger całego katalogu
Zakładka „Debugger testów” udostępnia wszystkie testy katalogu DEV / TEST, także CAT-23. Opisany `test.step` jest jednym etapem; czynności przeglądarki i żądania API poza takim etapem mają własne zatrzymania. „Następny krok” wykonuje etap, „Kontynuuj automatycznie” zwalnia kolejne, „Pauza” czeka przed następnym. Zagnieżdżone etapy należą do etapu nadrzędnego. Przygotowanie sesji/logowanie pozostaje automatyczne; pozostałe przygotowanie danych może pojawić się jako krok. Widok nie zmienia zawartości żądań ani odpowiedzi używanych przez asercje.

Warianty o wspólnym ID mają osobne klucze wyboru i są uruchamiane pojedynczo po pełnym tytule oraz lokalizacji. Testy bazy danych pozostają ograniczone do DEV. Roczne testy są jawnie oznaczone „ROCZNY”: przygotowanie snapshotu i weryfikację wykonuj w odpowiedniej kolejności na tym samym środowisku; nie trafiają do zwykłej regresji. Specjalne punkty podglądu testów API i potwierdzenie sprzątania pozostają zachowane. Stop kończy proces i może pozostawić dane. Zwykłe uruchamianie bez debuggera nie instaluje zatrzymań.

Weryfikacja lokalna: `npm run test:debugger` (przykładowy formularz i lokalne API, bez uruchamiania scenariuszy biznesowych).

### Motyw raportów HTML
Raporty Playwrighta pod `/report/` i `/latest-report/` otrzymują pełne tło zgodne z motywem i początkowy motyw z ustawienia wspólnego dla lokalnych paneli. Zmiana motywu w Centrum testów dociera także do już otwartego raportu. Poprawka działa na odpowiedzi serwera: nie zmienia plików historycznych ani zapisanych wyników i załączników. Weryfikacja: `npm run test:report-theme`.

### Edycja scenariuszy
W zakładce „Scenariusze” rozwiń przypadek i kliknij „Edytuj scenariusz”; przycisk jest też w osobnym oknie opisu. Formularz zapisuje tytuł, opis, warunki, dane, kroki, oczekiwany wynik i ograniczenia. Nie zmienia ID, powiązanych testów ani kodu automatu. Możesz dodawać, usuwać i przestawiać kroki. Zapis jest lokalny i atomowy; poprzednia wersja katalogu znajduje się w `runs/scenario-edits/`. Równoczesny zapis w innej karcie powoduje komunikat o konflikcie, bez utraty wpisanego tekstu.

Po zmianie instrukcji wcześniejsze wykonania są dostępne w historii, ale nie potwierdzają nowej wersji opisu. Niezmienione i jednoznaczne instrukcje zachowują swoje powiązania z etapami testu po przestawieniu; nowe lub przepisane kroki nie dziedziczą dawnych wyników. Takie powiązanie można później przygotować w katalogu. Testy edytora: `npm run test:scenario-editor`, integracja wszystkich lokalnych paneli: `npm run test:scenario-editors:all`.
