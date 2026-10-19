# Dokumentacja testów Octopus

Ten katalog opisuje aktualne obszary testowe. Źródłem prawdy dla nazw, lokalizacji i liczby wykonywanych scenariuszy jest generowany [indeks scenariuszy](scenario-index.md).

Regresja [Redmine #37176](redmine-37176.md) ma dwa nowe scenariusze: ORD-BUG-37176-01 i ORD-BUG-37176-02. Sprawdzają ilości -1 i -10, próbę zapisu oraz brak nowego zamówienia. Zostały napisane, ale nie uruchomione na DEV/TEST.

## Aktualny stan

[Kopiowanie zamówień w strukturze — Redmine 37160](kopiowanie-zamowien-struktura.md): ORD-COPY-01–ORD-COPY-19. Opisy warunków, kroków i wyników są dostępne w nowym menu Scenariusze lokalnego panelu i powiązane z testami o identycznych ID. ORD-COPY-19 wymaga odrębnego konta bez prawa edycji szkoły.

Weryfikacja kopiowania na DEV 19.10.2026: **18 passed, 1 skipped**. Testy lokalnego panelu: **10/10 passed**. To wynik nowego zestawu, nie całej regresji.

[Redmine #37203 — sortowanie Kategorii](redmine-37203.md) jest powiązany z istniejącymi CAT-23, CAT-24 i CAT-25. Dodano dowody JSON/zrzuty oraz kontrolę rzeczywistej kolejności przy czterech zmianach kierunku. Ta wersja tych trzech testów nie została jeszcze uruchomiona na DEV/TEST.

Progi i Uprawnienia mają 90 pozycji scenariuszy: THR-01–THR-22, PERM-01–PERM-25, ACC-01–ACC-10, ACL-01–ACL-17, NCL-01–NCL-08 i DEB-01–DEB-08. Nowe testy promocji nie zostały uruchomione; używają nauczycieli i szkół bez flag Testowy. Testy DEB mają rzeczywiste warunki sezonowe. [Zakres, przygotowanie danych i pozostałe luki](uprawnienia-i-progi.md). NCL-04 jest zablokowany (`fixme`) do czasu udostępnienia rzeczywistych zamówień historycznych i nie jest gotowym pokryciem tej reguły.

Dokumenty i edycja zamówień mają 30 nowych scenariuszy ORD-DOC-01–ORD-DOC-30, jeszcze nieuruchomionych. Nie dublują podstawowego zakresu ORD-48–ORD-66. ORD-DOC-28 wymaga istniejącego testowego zamówienia z integracji. [Macierz wymagań i kroki](dokumenty-zamowien.md).

Kolumna Klasa w zamówieniach ma 22 nowe scenariusze ORD-CLASS-01–ORD-CLASS-22, jeszcze nieuruchomione. Przypadek LS jest warunkowo pomijany ze względu na potwierdzony brak produktu. [Opis każdego sprawdzenia](klasa-w-zamowieniach.md).

- **757** scenariuszy we wszystkich 40 plikach;
- **755** scenariuszy w zwykłej regresji (w tym warunkowe pominięcia i oczekiwane błędy);
- **2** scenariusze rocznej medalowości uruchamiane osobno;
- domyślnie 2 workery, maksymalnie 4;
- ORD w panelu: maksymalnie 2 workery;
- roczna medalowość: zawsze 1 worker.

| Plik testowy                               | Wykonania | Dokumentacja                                                                                                                           |
| ------------------------------------------ | --------: | -------------------------------------------------------------------------------------------------------------------------------------- |
| `klubowiczostwo-*.spec.ts`                 |        72 | [Klubowiczostwo](klubowiczostwo-nauczyciela.md)                                                                                        |
| `nauczyciel-dodawanie.spec.ts`             |        33 | [Nauczyciele](nauczyciele.md)                                                                                                          |
| `nauczyciel-edycja*.spec.ts`               |        44 | [Nauczyciele](nauczyciele.md)                                                                                                          |
| `nauczyciel-rozszerzenie.spec.ts`          |         6 | [Nauczyciele](nauczyciele.md), [relacje](relacje-szkola-nauczyciel.md)                                                                 |
| `szkola-dodawanie.spec.ts`                 |        57 | [Dodawanie szkoły](dodawanie-szkoly.md)                                                                                                |
| `szkola-edycja.spec.ts`                    |        33 | [Edycja szkoły](edycja-szkoly.md)                                                                                                      |
| `szkola-medalowosc-annual.spec.ts`         |         2 | [Roczna medalowość](medalowosc-roczna.md)                                                                                              |
| `szkola-medalowosc.spec.ts`                |        42 | [Medalowość szkoły](medalowosc-szkoly.md)                                                                                              |
| `szkola-nauczyciel.spec.ts`                |         1 | [Relacje](relacje-szkola-nauczyciel.md)                                                                                                |
| `szkola-struktura.spec.ts`                 |        87 | [Struktura szkoły](struktura-szkoly.md)                                                                                                |
| `szkola-struktura-dodawanie.spec.ts`       |        19 | [Struktura krok po kroku](struktura-szkoly-krok-po-kroku.md)                                                                           |
| `szkola-kategoria.spec.ts`                 |        34 | [Kategoria szkoły krok po kroku](kategoria-szkoly.md)                                                                                  |
| `szkola-kategoria-dodawanie.spec.ts`       |        19 | [Kategoria przy tworzeniu szkoły](kategoria-szkoly.md#kategoria-przy-tworzeniu-nowej-szkoły-cat-35cat-53)                              |
| `walidacja-anulowanie.spec.ts`             |         9 | [Nauczyciele](nauczyciele.md), [relacje](relacje-szkola-nauczyciel.md)                                                                 |
| `zamowienia-*.spec.ts`                     |       139 | [Zamówienia szkoły](zamowienia-szkoly.md), [kolumna Klasa](klasa-w-zamowieniach.md), [dokumenty i Oświadczenia](dokumenty-zamowien.md) |
| `szkola-nauczyciele-filtry.spec.ts`        |        30 | [Filtry nauczycieli krok po kroku](filtry-nauczycieli-w-szkole.md)                                                                     |
| `szkola-wyszukiwanie-filtry.spec.ts`       |        32 | [Wyszukiwarka szkół krok po kroku](wyszukiwarka-szkol-filtry.md)                                                                       |
| `szkola-prog.spec.ts`                      |        22 | [Progi i Uprawnienia](uprawnienia-i-progi.md)                                                                                          |
| `nauczyciel-uprawnienia.spec.ts`           |        25 | [Progi i Uprawnienia](uprawnienia-i-progi.md)                                                                                          |
| `uprawnienia-api.spec.ts`                  |        10 | [Progi i Uprawnienia](uprawnienia-i-progi.md)                                                                                          |
| `uprawnienia-cykl-zycia.spec.ts`           |        17 | [Progi i Uprawnienia](uprawnienia-i-progi.md)                                                                                          |
| `uprawnienia-promocja-nowy-klient.spec.ts` |         8 | [Promocje i zakres pokrycia](uprawnienia-i-progi.md#promocje-nowego-klienta-i-debiutu)                                                 |
| `uprawnienia-promocja-debiutu.spec.ts`     |         8 | [Promocje i warunki sezonowe](uprawnienia-i-progi.md#promocje-nowego-klienta-i-debiutu)                                                |
| `nauczyciel-redmine-37164.spec.ts` | 4 | [Redmine 37164](redmine-37164.md) |
| `szkola-redmine-37204.spec.ts` | 4 | [Redmine 37204](redmine-37204.md) |
| **Razem**                                  |   **757** |                                                                                                                                        |

Nowy zestaw TFL-01–TFL-30 jest napisany, ale nie został uruchomiony ani zweryfikowany na DEV, zgodnie z prośbą użytkownika. Obejmuje UI, licznik unikalnych nauczycieli, liczniki szkolnych pozycji przedmiotowych Nasi/Obcy, klasyfikację, kontekst szkoły i regresję przyszłego roku. Licznik grupy nie musi być równy liczbie jej wierszy. Pozostały zakres jest wskazany w jego dokumentacji.

Liczba wykonań może być większa od liczby logicznych ID, ponieważ część scenariuszy jest parametryzowana.

Kategoria obejmuje CAT-01–CAT-53. Na DEV potwierdzono przejście wszystkich 53 scenariuszy w pełnym przebiegu i kontrolnych powtórkach z 13.10.2026. Po doprecyzowaniu reguły NPC jako szkoły podstawowej poprawione CAT-20–CAT-22 i CAT-51–CAT-53 przeszły (6/6). Nie jest to wynik jednego pełnego przebiegu po korekcie NPC; szczegóły i ograniczenia zawiera dokumentacja kategorii.

W obszarze `Struktura szkoły` wszystkie 106 scenariuszy jest wykonywanych (87 na istniejącej szkole i 19 podczas dodawania szkoły). Nie ma `fixme` ani `skip`; osiem scenariuszy `test.fail` dokumentuje niezgodności DEV względem oczekiwań testów. Zakres obejmuje obecnego użytkownika z pełnymi uprawnieniami, UI i publiczne API. Szczegóły i granice pokrycia zawiera dokument [Struktura szkoły](struktura-szkoly.md).

Dokładne działania i sprawdzenia każdego ze 106 testów opisuje [Struktura szkoły — każdy test krok po kroku](struktura-szkoly-krok-po-kroku.md), w tym symulowane odpowiedzi, sprzątanie i ograniczenia poszczególnych scenariuszy.

## Zasady wspólne

### Przygotowanie danych

- UI służy do przygotowania danych tylko wtedy, gdy dana operacja jest przedmiotem testu.
- W pozostałych przypadkach używane są API factory lub stabilne rekordy referencyjne.
- Każdy tworzony nauczyciel ma unikalny identyfikator `REG_*`. Domyślnie jest oznaczany jako testowy; warianty sprawdzające brak flag otrzymują oznaczenie dopiero po udanych asercjach na potrzeby bezpiecznego sprzątania.
- Szkoły pozostają w bazie z powodu braku obsługiwanego endpointu usuwania.
- Nauczyciele z poprawnego przebiegu są sprzątani globalnie; dane nieudanego testu pozostają do analizy.

### Diagnostyka

Nieoczekiwany błąd otrzymuje kategorię, polskie podsumowanie i — jeśli da się go wydobyć — nazwę akcji oraz lokator. Panel prezentuje te informacje obok odnośnika do pełnego raportu, screenshota i trace. Kategorie obejmują m.in. brak elementu, niewidoczność, nieaktywność, zasłonięcie, niejednoznaczny lokator, asercję, nawigację, sieć i sesję.

Oczekiwany błąd oznaczony `test.fail()` nie jest traktowany jako rzeczywisty failure.

### Raportowanie

Scenariusze korzystające z API mają nazwane kroki `test.step()`. W raporcie HTML wybierz test i rozwiń jego kroki; są one dostępne również w widoku kroków Playwright UI i trace. Przygotowanie danych, operacje API, kontrola widoku, porównania i sprzątanie są opisane oddzielnie. Część operacji odbywa się w przygotowaniu lub zakończeniu testu, więc należy rozwinąć również te sekcje.

Opis porównania wskazuje sprawdzaną wartość lub pole, rodzaj sprawdzenia i oczekiwany warunek. Zielony krok oznacza zakończenie bez błędu, czerwony wskazuje miejsce niepowodzenia. Przy błędzie asercji dostępne są oczekiwana i otrzymana wartość. Puste miejsce w przeglądarce nie oznacza pominięcia operacji API.

Kroki wykorzystują dotychczasowe operacje i odpowiedzi, bez dodatkowych zapytań ani sztucznych opóźnień. Oczekiwanie na stan końcowy jest jednym krokiem porównania, a nie osobnym opisem każdej ponowionej próby. Opisy nie zawierają tokenów, nagłówków autoryzacji ani treści załączonych dokumentów.

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

- [Redmine #37164 — unikalne przypisania szkół do nauczyciela](redmine-37164.md)
- [Redmine #37204 — filtr medalu „Brak”, przypadki i dowody](redmine-37204.md)
- [Pokrycie projektu testami i backlog luk](../POKRYCIE-TESTAMI.md)
- [Główny README](../../README.md)
- [Panel Test Runner](../../TEST-UI.md)
- [Indeks wszystkich scenariuszy](scenario-index.md)
