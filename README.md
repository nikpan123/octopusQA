# Octopus QA — testy regresyjne

Repozytorium zawiera testy end-to-end aplikacji Octopus napisane w Playwright i TypeScript. Testy działają przez przeglądarkę Chromium, korzystają również z API do przygotowania danych i obsługują dwa środowiska:

| Środowisko | Adres                        | Konfiguracja                |
| ---------- | ---------------------------- | --------------------------- |
| DEV        | `https://octopus.gwodev.pl`  | `playwright.config.ts`      |
| TEST       | `https://octopus.gwotest.pl` | `playwright.test.config.ts` |

Aktualny zestaw zawiera **356 scenariuszy** w 11 plikach. Zwykła regresja wykonuje **354 scenariusze**; dwa testy `MED-YEAR-*` należą do osobnego, ciężkiego procesu rocznej medalowości.

Pełna lista jest generowana z kodu i znajduje się w [indeksie scenariuszy](docs/tests/scenario-index.md).

## Zakres projektu

| Obszar                               | Plik                                 | Liczba wykonań |
| ------------------------------------ | ------------------------------------ | -------------: |
| Klubowiczostwo nauczyciela           | `klubowiczostwo-nauczyciela.spec.ts` |             72 |
| Dodawanie nauczyciela                | `nauczyciel-dodawanie.spec.ts`       |             33 |
| Edycja nauczyciela                   | `nauczyciel-edycja.spec.ts`          |             44 |
| Rozszerzenia i relacje nauczyciela   | `nauczyciel-rozszerzenie.spec.ts`    |              6 |
| Dodawanie szkoły                     | `szkola-dodawanie.spec.ts`           |             55 |
| Edycja szkoły                        | `szkola-edycja.spec.ts`              |             26 |
| Medalowość szkoły                    | `szkola-medalowosc.spec.ts`          |             42 |
| Roczna medalowość                    | `szkola-medalowosc-annual.spec.ts`   |              2 |
| Relacja szkoła–nauczyciel            | `szkola-nauczyciel.spec.ts`          |              1 |
| Walidacja, anulowanie i wyszukiwanie | `walidacja-anulowanie.spec.ts`       |              9 |
| Zamówienia szkoły                    | `zamowienia-szkoly.spec.ts`          |             66 |
| **Razem**                            |                                      |        **356** |

Szczegółowe opisy domen znajdują się w [dokumentacji testów](docs/tests/README.md).

## Wymagania

- Node.js 22 lub nowszy;
- dostęp do GitLaba GWO oraz wybranego środowiska Octopusa;
- konto z uprawnieniami potrzebnymi do badanych operacji;
- Chromium zainstalowane przez Playwrighta.

## Pierwsze uruchomienie

```powershell
npm install
npm run install:browser
Copy-Item .env.example .env
```

Uzupełnij `.env`:

```dotenv
GITLAB_USERNAME=''
GITLAB_PASSWORD=''
OCTOPUS_DEV_USERNAME=''
OCTOPUS_DEV_PASSWORD=''
OCTOPUS_TEST_USERNAME=''
OCTOPUS_TEST_PASSWORD=''
```

Plik `.env` i zapisane sesje są lokalne i wykluczone z Gita. Starsze zmienne `OCTOPUS_USERNAME` oraz `OCTOPUS_PASSWORD` są fallbackiem wyłącznie dla DEV.

Sprawdzenie lub automatyczne odświeżenie sesji:

```powershell
npm run auth:check
npm run login:auto
```

Możliwe jest też ręczne logowanie:

```powershell
npm run login
```

Sesje DEV i TEST są przechowywane osobno w `playwright/.auth/dev/` i `playwright/.auth/test/`. Przed testem sesja jest sprawdzana, a jej odświeżenie jest synchronizowane między workerami.

## Uruchamianie testów

### DEV

```powershell
npm test
npm run test:headed
npm run test:workers:2
npm run test:workers:4
```

### TEST

Konfigurację TEST wybieraj jawnie:

```powershell
npx playwright test --config=playwright.test.config.ts
npx playwright test --headed --config=playwright.test.config.ts
```

### Wybrany obszar lub scenariusz

```powershell
npx playwright test --grep "@teacher"
npx playwright test --grep "@school-edit"
npx playwright test tests/zamowienia-szkoly.spec.ts --grep "ORD-43" --workers=1
```

Lista testów:

```powershell
npm run test:list
```

## Panel lokalny

Najwygodniejszym sposobem pracy jest lokalny panel:

```powershell
npm run test-ui
```

Panel działa domyślnie pod `http://127.0.0.1:4173` i umożliwia:

- wybór DEV lub TEST, pakietu, liczby workerów i trybu headed;
- wybór konkretnych testów oraz filtrowanie po ID lub tagu;
- śledzenie logu i wyników na żywo;
- ponawianie wyłącznie nieoczekiwanych failures;
- otwieranie raportu HTML, trace i screenshotów;
- odczyt zwięzłej, sklasyfikowanej przyczyny awarii;
- przegląd danych testowych oraz bezpieczny cleanup nauczycieli na DEV;
- uruchamianie osobnego workflow rocznej medalowości.

Pełna instrukcja: [TEST-UI.md](TEST-UI.md).

## Diagnostyka nieudanego testu

Przy niepowodzeniu projekt zapisuje kilka uzupełniających się źródeł:

1. reporter błędów klasyfikuje awarię jako m.in. brak elementu, niewidoczny lub nieaktywny element, niejednoznaczny lokator, błąd asercji, nawigacji, sieci albo sesji;
2. panel pokazuje krótkie objaśnienie, lokator, akcję i sugestię dalszej analizy;
3. raport HTML zawiera pełny call log Playwrighta;
4. screenshot i trace zachowują stan aplikacji z chwili awarii;
5. `runs/REG_*.json` przechowuje identyfikatory i adres ostatniego rekordu scenariusza.

Pliki klasyfikacji są zapisywane jako `runs/failures-<run-id>.json`. Sam klasyfikator można sprawdzić poleceniem:

```powershell
npm run test:failures
```

Testy oznaczone `test.fail()` są oczekiwanymi awariami. Nie trafiają do listy rzeczywistych problemów ani do funkcji **Ponów failed**.

## Raporty i artefakty

| Lokalizacja                      | Zawartość                              |
| -------------------------------- | -------------------------------------- |
| `playwright-report/`             | ostatni raport HTML uruchomienia z CLI |
| `test-results/<run-id>/`         | screenshoty, trace i artefakty testów  |
| `runs/html-reports/<run-id>/`    | raporty uruchomień wykonanych z panelu |
| `runs/performance-<run-id>.json` | czasy p50/p90/p95/max i liczniki HTTP  |
| `runs/failures-<run-id>.json`    | sklasyfikowane nieoczekiwane awarie    |
| `runs/REG_*.json`                | dane i stan konkretnego scenariusza    |
| `runs/test-ui-history.json`      | historia ostatnich uruchomień panelu   |

Raport HTML z ostatniego uruchomienia CLI:

```powershell
npm run report
```

## Dane testowe i cleanup

Każdy scenariusz otrzymuje identyfikator `REG_<timestamp>_<suffix>`. Nauczyciele utworzeni w poprawnie zakończonym przebiegu są sprzątani w globalnym teardownie. Rekord po nieudanym teście pozostaje do diagnostyki i otrzymuje `cleanupStatus: KEPT_FAILED_TEST`.

Bezpieczny podgląd lokalnych rejestrów:

```powershell
npm run cleanup:preview
```

Usunięcie wskazanego nauczyciela po analizie:

```powershell
npm run cleanup:teachers -- REG_...json --include-failed --apply
```

Cleanup działa tylko na DEV i przed `DELETE` ponownie sprawdza ID, testowy e-mail, nazwisko, zgodność rekordu oraz flagę `Testowy`. Opcja `--allow-unmarked` omija wyłącznie brak tej flagi i powinna być używana świadomie.

Szkoły nie są automatycznie usuwane, ponieważ projekt nie ma potwierdzonego endpointu ich cleanupu. Testy niezwiązane z dodawaniem szkoły korzystają więc, gdy to możliwe, z API lub stabilnych danych referencyjnych.

## Równoległość

- domyślnie używane są 2 workery;
- konfiguracja dopuszcza 1–4 workery przez `OCTOPUS_WORKERS`;
- jednocześnie może działać tylko jeden przebieg dla danego środowiska;
- pakiet ORD jest ograniczony w panelu do 1–2 workerów;
- każdy worker ORD używa własnych szkół `AUTO_ORD_REFERENCE_<ENV>_W<n>` i wariantu `_B`;
- roczna medalowość zawsze działa na jednym workerze.

Szczegóły ORD: [README-PARALLEL-ORD.md](README-PARALLEL-ORD.md).

## Roczna medalowość

`MED-YEAR-PREP` i `MED-YEAR-01` generują snapshot oraz wykonują kilka tysięcy żądań. Są wyłączone ze zwykłej regresji i uruchamiane jawnie:

```powershell
npm run test:annual:dev
npm run test:annual:test
```

Etapy należy wykonywać osobno zgodnie z [instrukcją rocznej medalowości](docs/tests/medalowosc-roczna.md).

## Jakość i dokumentacja

```powershell
npm run check
npm run lint
npm run format:check
npm run docs:scenarios:check
npm run quality
```

Po dodaniu, usunięciu lub zmianie nazwy testu wygeneruj indeks ponownie:

```powershell
npm run docs:scenarios
```

## Struktura projektu

```text
tests/*.spec.ts             scenariusze Playwrighta
tests/support/              fixtures, page helpers i API factory
tests/data/                 dane referencyjne i snapshoty
scripts/                    logowanie, cleanup, reportery i serwer panelu
test-ui/                    frontend lokalnego panelu
docs/tests/                 dokumentacja domen i indeks scenariuszy
playwright.shared.ts        wspólna konfiguracja DEV/TEST
runs/                       lokalne rejestry i raporty przebiegów
test-results/               artefakty Playwrighta
```

`tests/support/octopus.ts` jest główną warstwą obsługi Octopusa. `octopus2.ts` pozostaje starszym wariantem i nie powinien być wybierany do nowych helperów.

## Mapa dokumentacji

- [Pokrycie projektu testami i backlog luk](docs/POKRYCIE-TESTAMI.md)
- [Dokumentacja obszarów testowych](docs/tests/README.md)
- [Pełny indeks scenariuszy](docs/tests/scenario-index.md)
- [Panel Test Runner](TEST-UI.md)
- [Zamówienia na dwóch workerach](README-PARALLEL-ORD.md)
- [Roczna medalowość](docs/tests/medalowosc-roczna.md)
- [Przegląd jakości i refaktoryzacji](docs/przeglad-refaktoryzacji.md)

Pliki `WERYFIKACJA.md`, `regresja-octopus.md`, `raport-regresji-REG_20260917_01.md` i `OCT-OBS-002.md` są zapisami historycznymi lub dokumentami konkretnej obserwacji. Nie zastępują bieżącej instrukcji z tego README.
