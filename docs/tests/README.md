# Dokumentacja testów Octopus

Ten katalog opisuje aktualne obszary testowe. Źródłem prawdy dla nazw, lokalizacji i liczby wykonywanych scenariuszy jest generowany [indeks scenariuszy](scenario-index.md).

## Aktualny stan

- **356** scenariuszy we wszystkich 11 plikach;
- **354** scenariusze w zwykłej regresji;
- **2** scenariusze rocznej medalowości uruchamiane osobno;
- domyślnie 2 workery, maksymalnie 4;
- ORD w panelu: maksymalnie 2 workery;
- roczna medalowość: zawsze 1 worker.

| Plik testowy                         | Wykonania | Dokumentacja                                                           |
| ------------------------------------ | --------: | ---------------------------------------------------------------------- |
| `klubowiczostwo-nauczyciela.spec.ts` |        72 | [Klubowiczostwo](klubowiczostwo-nauczyciela.md)                        |
| `nauczyciel-dodawanie.spec.ts`       |        33 | [Nauczyciele](nauczyciele.md)                                          |
| `nauczyciel-edycja.spec.ts`          |        44 | [Nauczyciele](nauczyciele.md)                                          |
| `nauczyciel-rozszerzenie.spec.ts`    |         6 | [Nauczyciele](nauczyciele.md), [relacje](relacje-szkola-nauczyciel.md) |
| `szkola-dodawanie.spec.ts`           |        55 | [Dodawanie szkoły](dodawanie-szkoly.md)                                |
| `szkola-edycja.spec.ts`              |        26 | [Edycja szkoły](edycja-szkoly.md)                                      |
| `szkola-medalowosc-annual.spec.ts`   |         2 | [Roczna medalowość](medalowosc-roczna.md)                              |
| `szkola-medalowosc.spec.ts`          |        42 | [Medalowość szkoły](medalowosc-szkoly.md)                              |
| `szkola-nauczyciel.spec.ts`          |         1 | [Relacje](relacje-szkola-nauczyciel.md)                                |
| `walidacja-anulowanie.spec.ts`       |         9 | [Nauczyciele](nauczyciele.md), [relacje](relacje-szkola-nauczyciel.md) |
| `zamowienia-szkoly.spec.ts`          |        66 | [Zamówienia szkoły](zamowienia-szkoly.md)                              |
| **Razem**                            |   **356** |                                                                        |

Liczba wykonań może być większa od liczby logicznych ID, ponieważ część scenariuszy jest parametryzowana.

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
