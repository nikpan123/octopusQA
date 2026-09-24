# Odporność i bezpieczeństwo — dokumentacja testów automatycznych

## Cel

Dokument grupuje przekrojowe scenariusze dodane 24.09.2026. Nie zastępują one audytu bezpieczeństwa, testów penetracyjnych ani pełnej macierzy uprawnień. Sprawdzają konkretne zachowania interfejsu i API obserwowane w przepływach szkół, nauczycieli, zamówień, klubowiczostwa i medalowości.

## Pliki i zakres

| Plik                                           | Scenariusze              | Zakres                                                                 |
| ---------------------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `tests/dane-brzegowe-i-bezpieczenstwo.spec.ts` | `BRZEG-01–05`            | długie dane, bezpieczne renderowanie, Unicode, schowek, sumy kontrolne |
| `tests/nauczyciel-kontrakty.spec.ts`           | `CONTRACT-01–03`         | różnice kontraktów dodawania i edycji nauczyciela                      |
| `tests/sesja-i-odpornosc.spec.ts`              | `AUTH-01–02`, `RESIL-01` | 401/403, dwie karty i podwójny zapis przy wolnej sieci                 |
| `tests/zamowienia-negatywne.spec.ts`           | `ORD-04–10`              | niepoprawne dane, 403 i współbieżne usunięcie                          |
| `tests/klubowiczostwo-dodatkowe.spec.ts`       | `KLUB-DOD-01–02`         | zamknięta lista przedmiotów WSPOM i kolejność lat                      |
| `tests/szkola-medalowosc-dodatkowe.spec.ts`    | `SZK-MED-DOD-01`         | jakość danych medalowych poza Warszawą                                 |

Parametryzowane scenariusze dają łącznie 26 nowych przypadków wykonawczych. Ich pełne nazwy, tagi i lokalizacje są w [generowanym indeksie](scenario-index.md).

## Rodzaje oczekiwań

Scenariusze dzielą się na dwie grupy:

- twarde niezmienniki — brak wykonania XSS, brak widmowego rekordu po 401/403, jedno żądanie przy podwójnym zapisie oraz brak zawieszenia drugiej karty;
- testy dokumentujące — polityka bardzo długiej nazwy, walidacja sum kontrolnych, kolejność lat klubowych i strategia konfliktu dwóch edycji.

Test dokumentujący może dopuścić więcej niż jeden kontrolowany rezultat i zapisać go w logu lub rejestrze. Nie wolno zmieniać go na jednoznaczne wymaganie bez potwierdzenia kontraktu biznesowego.

## Izolacja i bezpieczeństwo danych

- Odpowiedzi 401, 403 i kontrolowane opóźnienie są symulowane przez przechwycenie konkretnego żądania w kontekście testu.
- Payload XSS używa nieszkodliwego znacznika w `window`; nie otwiera prawdziwego dialogu i nie wysyła danych poza aplikację.
- Wzorzec SQL injection jest traktowany jako tekst wejściowy. Test nie próbuje uzyskać dostępu do bazy ani wykonywać destrukcyjnych poleceń.
- Druga karta w testach współbieżności działa w osobnym kontekście przeglądarki z odtworzoną sesją tego samego użytkownika.
- Utworzeni nauczyciele podlegają standardowemu cleanupowi. Szkoły i zamówienia są sprzątane tylko tam, gdzie test ma potwierdzoną operację usuwania.
- **Sprzątanie nauczycieli obsługuje teraz WIELU nauczycieli na jeden przebieg scenariusza** (24.09.2026): rejestr `runs/REG_*.json` przechowuje ich jako listę w polu `teachers` (patrz `scripts/cleanup-teachers.mjs`, `getTeacherEntries`/`setTeacherEntries`), zamiast pojedynczego pola `teacherId`. Wcześniej test tworzący dwóch nauczycieli w jednym scenariuszu (np. `CONTRACT-01`: część dodawania + część edycji) tracił pierwszego z nich dla sprzątania, bo drugi nadpisywał jego wpis w rejestrze — mimo poprawnej flagi Testowy pozostawał w bazie na stałe. `scenario.createTeacher()` i `registerCreatedTeacher()` rejestrują teraz każdego utworzonego nauczyciela na liście automatycznie; `scenario.updateTeacherIdentity()` pozwala zaktualizować oczekiwany e-mail/nazwisko już zarejestrowanego nauczyciela po jego edycji w teście (np. `nauczyciel-edycja.spec.ts`, EDIT-12/20/22). `RESIL-01` dodatkowo rejestruje nauczyciela utworzonego przez UI (wcześniej nie był w ogóle śledzony i pozostawał trwałą sierotą). Stary, płaski format pojedynczego `teacherId` jest nadal odczytywany wstecznie kompatybilnie.
- **`cleanup:teachers --all --apply` jest teraz odporny na pojedynczy zły rekord** (24.09.2026): wcześniej `cleanupTeacherBatch` sprawdzał WSZYSTKICH nauczycieli z paczki w jednej pętli i przerywał całą operację na pierwszym niezgodnym z rejestrem lub bez flagi Testowy — jeden problematyczny rekord blokował usunięcie setek poprawnych (obserwowane realnie: 235 poprawnych nauczycieli zablokowanych przez jeden bez flagi Testowy). Teraz błąd pojedynczego nauczyciela jest zbierany, a przetwarzanie pozostałych trwa dalej; na końcu operacja nadal kończy się błędem (kod wyjścia ≠ 0), ale z jasnym podsumowaniem, którzy nauczyciele zostali pominięci i dlaczego — reszta paczki zostaje usunięta. Patrz nowy test `cleanup-teachers.test.mjs`: "jeden nauczyciel bez flagi Testowy nie blokuje usunięcia pozostałych".
- **Nowa flaga `--include-untested`** (24.09.2026, `npm run cleanup:teachers -- --all --include-untested --apply`): pozwala usunąć również nauczycieli, którzy nie mają potwierdzonej flagi Testowy (np. `markTestRecord()` nie zdążył jej zapisać przy dużym obciążeniu — patrz niżej). Domyślnie flaga Testowy jest nadal wymagana (zachowanie bez zmian, jak dotąd); z `--include-untested` wymóg flagi jest pomijany, ale identyfikacja nauczyciela po ID + e-mailu (i nazwisku, jeśli podane w rejestrze) pozostaje obowiązkowa — to ona jest właściwym zabezpieczeniem przed usunięciem cudzego rekordu, flaga Testowy była dodatkową, czysto informacyjną warstwą. Dotyczy zarówno `cleanupTeacherBatch` (masowe czyszczenie), jak i `deleteTestTeacher` (pojedynczy rekord).
- **Naprawiona cicha "ucieczka" w `Octopus.markTestRecord()`** (24.09.2026, `tests/support/octopus.ts`): wcześniej, jeśli serwer nie potwierdził zapisu flagi Testowy w ciągu 5 s, funkcja po cichu kontynuowała (checkbox mógł wyglądać na zaznaczony w UI, zanim serwer faktycznie przetworzył zapis), co pozwalało testowi przejść mimo niezapisanej flagi — to prawdopodobne źródło realnie zaobserwowanego przypadku (nauczyciel 533888, `ADD-09`, stworzony pod dużym obciążeniem przy 236 nauczycielach w jednej partii). Teraz brak potwierdzenia w ciągu 10 s jest głośnym błędem testu, nie cichym sukcesem.

## Uruchamianie

```text
npx playwright test tests/dane-brzegowe-i-bezpieczenstwo.spec.ts
npx playwright test tests/nauczyciel-kontrakty.spec.ts
npx playwright test tests/sesja-i-odpornosc.spec.ts
npx playwright test tests/zamowienia-negatywne.spec.ts
npx playwright test tests/klubowiczostwo-dodatkowe.spec.ts
npx playwright test tests/szkola-medalowosc-dodatkowe.spec.ts
```

Przekroje tagów:

```text
npx playwright test --grep @security
npx playwright test --grep @auth
npx playwright test --grep @concurrency
npx playwright test --grep @edge-input
```

## Ograniczenia

- `AUTH-01` nie zastępuje testu pełnego wygaśnięcia sesji i ponownego logowania; symuluje odpowiedź endpointu zapisu.
- `AUTH-02` używa jednego konta w dwóch kartach i nie sprawdza konfliktu dwóch różnych użytkowników.
- `SZK-MED-DOD-01` zależy od bieżących danych i może zostać pominięty, jeśli brak szkół medalowych spoza Warszawy.
- Scenariusze nie potwierdzają odporności całej aplikacji na wszystkie klasy ataków.
