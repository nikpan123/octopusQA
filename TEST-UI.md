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

```text
GET  /api/status
GET  /api/tests
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

- Po zmianie plików panelu zatrzymaj serwer przez `Ctrl+C`, uruchom go ponownie i odśwież stronę przez `Ctrl+F5`.
- Jeżeli brakuje Playwrighta, wykonaj `npm install`.
- Jeżeli port jest zajęty, ustaw inną wartość `OCTOPUS_TEST_UI_PORT`.
- Jeżeli test kończy się bez sklasyfikowanej przyczyny, otwórz raport HTML i trace; reporter użyje wtedy kategorii **Inny błąd**.

Powrót do [głównej dokumentacji](README.md).
