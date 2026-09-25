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
