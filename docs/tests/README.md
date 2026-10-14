# Dokumentacja testów Octopus

Ten katalog opisuje aktualne obszary testowe. Źródłem prawdy dla nazw, lokalizacji i liczby wykonywanych scenariuszy jest generowany [indeks scenariuszy](scenario-index.md).

## Aktualny stan

Kolumna Klasa w zamówieniach ma 22 nowe scenariusze ORD-CLASS-01–ORD-CLASS-22, jeszcze nieuruchomione. Przypadek LS jest warunkowo pomijany ze względu na potwierdzony brak produktu. [Opis każdego sprawdzenia](klasa-w-zamowieniach.md).

- **608** scenariuszy we wszystkich 29 plikach;
- **606** scenariuszy w zwykłej regresji (w tym warunkowe pominięcia i oczekiwane błędy);
- **2** scenariusze rocznej medalowości uruchamiane osobno;
- domyślnie 2 workery, maksymalnie 4;
- ORD w panelu: maksymalnie 2 workery;
- roczna medalowość: zawsze 1 worker.

| Plik testowy                         | Wykonania | Dokumentacja                                                                                              |
| ------------------------------------ | --------: | --------------------------------------------------------------------------------------------------------- |
| `klubowiczostwo-*.spec.ts`           |        72 | [Klubowiczostwo](klubowiczostwo-nauczyciela.md)                                                           |
| `nauczyciel-dodawanie.spec.ts`       |        33 | [Nauczyciele](nauczyciele.md)                                                                             |
| `nauczyciel-edycja*.spec.ts`         |        44 | [Nauczyciele](nauczyciele.md)                                                                             |
| `nauczyciel-rozszerzenie.spec.ts`    |         6 | [Nauczyciele](nauczyciele.md), [relacje](relacje-szkola-nauczyciel.md)                                    |
| `szkola-dodawanie.spec.ts`           |        57 | [Dodawanie szkoły](dodawanie-szkoly.md)                                                                   |
| `szkola-edycja.spec.ts`              |        33 | [Edycja szkoły](edycja-szkoly.md)                                                                         |
| `szkola-medalowosc-annual.spec.ts`   |         2 | [Roczna medalowość](medalowosc-roczna.md)                                                                 |
| `szkola-medalowosc.spec.ts`          |        42 | [Medalowość szkoły](medalowosc-szkoly.md)                                                                 |
| `szkola-nauczyciel.spec.ts`          |         1 | [Relacje](relacje-szkola-nauczyciel.md)                                                                   |
| `szkola-struktura.spec.ts`           |        87 | [Struktura szkoły](struktura-szkoly.md)                                                                   |
| `szkola-struktura-dodawanie.spec.ts` |        19 | [Struktura krok po kroku](struktura-szkoly-krok-po-kroku.md)                                              |
| `szkola-kategoria.spec.ts`           |        34 | [Kategoria szkoły krok po kroku](kategoria-szkoly.md)                                                     |
| `szkola-kategoria-dodawanie.spec.ts` |        19 | [Kategoria przy tworzeniu szkoły](kategoria-szkoly.md#kategoria-przy-tworzeniu-nowej-szkoły-cat-35cat-53) |
| `walidacja-anulowanie.spec.ts`       |         9 | [Nauczyciele](nauczyciele.md), [relacje](relacje-szkola-nauczyciel.md)                                    |
| `zamowienia-*.spec.ts`               |        88 | [Zamówienia szkoły](zamowienia-szkoly.md), [kolumna Klasa](klasa-w-zamowieniach.md)                       |
| `szkola-nauczyciele-filtry.spec.ts`  |        30 | [Filtry nauczycieli krok po kroku](filtry-nauczycieli-w-szkole.md)                                        |
| `szkola-wyszukiwanie-filtry.spec.ts` |        32 | [Wyszukiwarka szkół krok po kroku](wyszukiwarka-szkol-filtry.md)                                          |
| **Razem**                            |   **608** |                                                                                                           |

Nowy zestaw TFL-01–TFL-30 jest napisany, ale nie został uruchomiony ani zweryfikowany na DEV, zgodnie z prośbą użytkownika. Obejmuje UI, licznik unikalnych nauczycieli, liczniki szkolnych pozycji przedmiotowych Nasi/Obcy, klasyfikację, kontekst szkoły i regresję przyszłego roku. Licznik grupy nie musi być równy liczbie jej wierszy. Pozostały zakres jest wskazany w jego dokumentacji.

Liczba wykonań może być większa od liczby logicznych ID, ponieważ część scenariuszy jest parametryzowana.

Kategoria obejmuje CAT-01–CAT-53. Na DEV potwierdzono przejście wszystkich 53 scenariuszy w pełnym przebiegu i kontrolnych powtórkach z 13.10.2026. Po doprecyzowaniu reguły NPC jako szkoły podstawowej poprawione CAT-20–CAT-22 i CAT-51–CAT-53 przeszły (6/6). Nie jest to wynik jednego pełnego przebiegu po korekcie NPC; szczegóły i ograniczenia zawiera dokumentacja kategorii.

W obszarze `Struktura szkoły` wszystkie 106 scenariuszy jest wykonywanych (87 na istniejącej szkole i 19 podczas dodawania szkoły). Nie ma `fixme` ani `skip`; osiem scenariuszy `test.fail` dokumentuje niezgodności DEV względem oczekiwań testów. Zakres obejmuje obecnego użytkownika z pełnymi uprawnieniami, UI i publiczne API. Szczegóły i granice pokrycia zawiera dokument [Struktura szkoły](struktura-szkoly.md).

Dokładne działania i sprawdzenia każdego ze 106 testów opisuje [Struktura szkoły — każdy test krok po kroku](struktura-szkoly-krok-po-kroku.md), w tym symulowane odpowiedzi, sprzątanie i ograniczenia poszczególnych scenariuszy.

## Zasady wspólne

### Przygotowanie danych

- UI służy do przygotowania danych tylko wtedy, gdy dana operacja jest przedmiotem testu.
- W pozostałych przypadkach używane są API factory lub stabilne rekordy referencyjne.
- Każdy tworzony rekord ma unikalny identyfikator `REG_*` i jest oznaczany jako testowy.
- Szkoły pozostają w bazie z powodu braku obsługiwanego endpointu usuwania.
- Nauczyciele z poprawnego przebiegu są sprzątani globalnie; dane nieudanego testu pozostają do analizy.

### Diagnostyka

Nieoczekiwany błąd otrzymuje kategorię, polskie podsumowanie i — jeśli da się go wydobyć — nazwę akcji oraz lokator. Panel prezentuje te informacje obok odnośnika do pełnego raportu, screenshota i trace. Kategorie obejmują m.in. brak elementu, niewidoczność, nieaktywność, zasłonięcie, niejednoznaczny lokator, asercję, nawigację, sieć i sesję.

Oczekiwany błąd oznaczony `test.fail()` nie jest traktowany jako rzeczywisty failure.

### Raportowanie

- `runs/REG_*.json` — dane scenariusza;
- `runs/performance-*.json` — czasy i liczniki HTTP;
- `runs/failures-*.json` — sklasyfikowane awarie;
- `test-results/` — screenshoty i trace;
- `playwright-report/` lub `runs/html-reports/` — raport HTML.

## Uruchamianie

```powershell
# zwykła regresja DEV
npm test

# zwykła regresja TEST
npx playwright test --config=playwright.test.config.ts

# wybrany obszar
npx playwright test --grep "@teacher"
npx playwright test --grep "@order"

# panel lokalny
npm run test-ui
```

Roczny workflow:

```powershell
npm run test:annual:dev
npm run test:annual:test
```

## Aktualizacja indeksu

Po zmianie testów:

```powershell
npm run docs:scenarios
npm run docs:scenarios:check
```

Nie edytuj tabeli w `scenario-index.md` ręcznie.

## Powiązane dokumenty

- [Pokrycie projektu testami i backlog luk](../POKRYCIE-TESTAMI.md)
- [Główny README](../../README.md)
- [Panel Test Runner](../../TEST-UI.md)
- [Indeks wszystkich scenariuszy](scenario-index.md)
