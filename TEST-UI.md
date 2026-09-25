# Octopus Test Runner UI

Lokalny panel do uruchamiania testów Playwrighta bez wpisywania komend w PowerShellu.

## Instalacja

1. Rozpakuj paczkę w dowolnym miejscu.
2. Otwórz PowerShell w katalogu głównym projektu Octopus.
3. Uruchom instalator z pełną ścieżką do rozpakowanej paczki, np.:

```powershell
node C:\Temp\octopus-test-runner-ui\install-test-ui.mjs
```

Instalator:

- kopiuje `scripts/test-ui-server.mjs`,
- kopiuje katalog `test-ui/`,
- kopiuje `TEST-UI.md`,
- dodaje do istniejącego `package.json` skrypt `test-ui`,
- zapisuje kopię starego `package.json` jako `package.json.before-test-ui`.

Panel nie wymaga dodatkowych bibliotek npm. Korzysta wyłącznie z modułów wbudowanych w Node.js i z istniejącego Playwrighta projektu.

## Uruchomienie

W katalogu projektu:

```powershell
npm run test-ui
```

Domyślnie panel otworzy:

```text
http://127.0.0.1:4173
```

Port można zmienić:

```powershell
$env:OCTOPUS_TEST_UI_PORT=4300
npm run test-ui
```

Aby nie otwierać przeglądarki automatycznie:

```powershell
$env:OCTOPUS_TEST_UI_NO_OPEN=1
npm run test-ui
```

## Funkcje

- DEV / TEST,
- 1 / 2 / 4 workery,
- Headed / headless,
- pakiety: cała regresja, nauczyciele, szkoły, zamówienia, klubowiczostwo, medalowość,
- grep po nazwie/tagu/ID,
- automatyczna lista testów z `npx playwright test --list`,
- wybór pojedynczych testów checkboxami,
- Start / Stop,
- log Playwrighta na żywo,
- liczniki Passed / Failed / Skipped,
- czas wykonania,
- otwieranie najnowszego raportu HTML Playwrighta,
- podgląd najnowszego `runs/performance-*.json`,
- historia ostatnich 30 uruchomień w `runs/test-ui-history.json`,
- ponowne uruchomienie testów, które zakończyły się FAIL,
- osobne, zabezpieczone uruchamianie `MED-YEAR-PREP` i `MED-YEAR-01`.

## Ważne

### Raport HTML

Panel wykorzystuje istniejący reporter HTML skonfigurowany w Playwright. Po zakończeniu testów przycisk **Otwórz raport HTML** udostępnia katalog `playwright-report/` przez lokalny serwer.

### Raport wydajności

Panel nie zmienia `performance-reporter.mjs`. Po przebiegu wyszukuje najnowszy plik:

```text
runs/performance-<run-id>.json
```

i pokazuje jego zawartość w UI.

### TEST

Dla środowiska TEST panel używa:

```text
playwright.test.config.ts
```

Dla DEV:

```text
playwright.config.ts
```

### Roczna medalowość

Testy `MED-YEAR-*` są celowo oddzielone od zwykłej regresji. Panel wymaga dodatkowego potwierdzenia przed startem i uruchamia je z jednym workerem oraz `OCTOPUS_INCLUDE_ANNUAL=1`.

## Jak działają pakiety

Panel uruchamia istniejące pliki, bez zmian w samych testach:

- Nauczyciele: `nauczyciel-dodawanie`, `nauczyciel-edycja`, `nauczyciel-rozszerzenie`,
- Szkoły: `szkola-dodawanie`, `szkola-edycja`, `szkola-nauczyciel`, `walidacja-anulowanie`,
- Zamówienia: `zamowienia-szkoly`,
- Klubowiczostwo: `klubowiczostwo-nauczyciela`,
- Medalowość: `szkola-medalowosc`,
- Cała regresja: standardowe `npx playwright test` z konfiguracją środowiska.

Jeżeli zmienią się nazwy plików testowych, zaktualizuj obiekt `SUITES` na początku `scripts/test-ui-server.mjs`.


## Windows: błąd `spawn EINVAL`

Aktualna wersja nie uruchamia już `npx.cmd` bezpośrednio przez `child_process.spawn`.
Na Windows testy są uruchamiane przez lokalny plik CLI Playwrighta i `node.exe`, co usuwa błąd `spawn EINVAL`.
Jeżeli UI zgłosi brak Playwrighta, uruchom w katalogu projektu `npm install`.
