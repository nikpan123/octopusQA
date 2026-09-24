# Klubowiczostwo nauczyciela — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcje `CLUB-*` i `KLUB-DOD-*` weryfikują przedmioto-poziomy nauczyciela i formularze klubowe: szkołę, klasy własne i obce, wydawnictwo, trwałość edycji, walidację, anulowanie, usunięcie, przywracanie i przypadki brzegowe lat szkolnych oraz formularza WSPOM.

## 2. Pliki

```text
tests/klubowiczostwo-nauczyciela.spec.ts
tests/klubowiczostwo-dodatkowe.spec.ts
tests/support/club.ts
tests/support/club-fixtures.ts
tests/support/club-scenario.ts
tests/support/scenario.ts
```

## 3. Dane scenariuszy

Podstawowym przypadkiem jest:

```text
przedmiot: Matematyka
poziom: SP
klasy: 4, 5, 6, 7, 8
```

Lista klas jest utrzymywana w jednej stałej:

```ts
MATH_SP_CLASSES = ["4", "5", "6", "7", "8"];
```

Testy korzystają z trwałej, wspólnej puli szkół przygotowywanej przez `club-fixtures.ts`:

| Rola             | Nazwa na DEV            | Typ               |
| ---------------- | ----------------------- | ----------------- |
| podstawowa       | `AUTOMAT CLUB DEV SP A` | Szkoła podstawowa |
| druga podstawowa | `AUTOMAT CLUB DEV SP B` | Szkoła podstawowa |
| ponadpodstawowa  | `AUTOMAT CLUB DEV SŚ`   | Liceum            |

Nazwa zawiera środowisko, więc DEV i TEST nie współdzielą rekordów. Szkoły nie są usuwane po teście. Każdy test tworzy własnego nauczyciela i formularze; nauczyciel, relacje i przygotowawcze przedmioto-poziomy powstają przez `api-factory.ts` i są usuwane przez globalne sprzątanie. `CLUB-01` celowo dodaje przedmioto-poziom przez UI, ponieważ ta operacja jest częścią celu scenariusza.

### 3.1. Cache ID szkół

Fixture nie wyszukuje już wszystkich trzech szkół przez interfejs przed każdym nowym workerem. ID trwałych szkół jest zapisywane osobno dla każdego środowiska:

```text
playwright/.auth/dev/club-schools.json
playwright/.auth/test/club-schools.json
```

Pliki znajdują się w ignorowanym przez Git katalogu `playwright/.auth`. Cache zawiera wyłącznie środowisko, czas ostatniej kontroli oraz ID, nazwę i typ trzech szkół CLUB. Nie zawiera hasła ani tokenu.

Proces przygotowania szkół wygląda następująco:

1. Fixture odczytuje cache właściwy dla DEV albo TEST.
2. Jeżeli zapis jest poprawny i został zweryfikowany w ciągu ostatnich 24 godzin, zwraca ID natychmiast — bez otwierania panelu szkoły i bez wyszukiwania.
3. Po upływie 24 godzin każde zapisane ID jest sprawdzane przez bezpośrednie otwarcie panelu szkoły i porównanie pełnej nazwy.
4. Poprawne ID są zachowywane. Tylko brakująca lub niezgodna szkoła jest wyszukiwana po pełnej nazwie.
5. Jeśli wyszukiwanie niczego nie zwróci, fixture tworzy szkołę, oznacza ją jako testową i zapisuje nowe ID.
6. Odświeżony cache jest zapisywany atomowo, aby przerwanie procesu nie pozostawiło częściowego pliku.

Pierwszy przebieg na nowym środowisku nadal wykonuje trzy wyszukania, ponieważ musi poznać ID istniejących szkół. Kolejne uruchomienia w tym samym dniu pomijają ten etap. Gdy baza środowiska zostanie odtworzona albo ID przestanie wskazywać oczekiwaną szkołę, mechanizm sam wróci do wyszukania lub utworzenia właściwego rekordu.

Cache można bezpiecznie usunąć ręcznie przy diagnostyce. Następne uruchomienie odbuduje go na podstawie aktualnego stanu Octopusa. Usunięcie cache nie usuwa żadnej szkoły z bazy.

### 3.2. Równoległe wykonywanie

Plik CLUB jawnie używa `test.describe.configure({ mode: "parallel" })`. Każdy scenariusz tworzy własnego nauczyciela i własne potwierdzenia, natomiast trwałe szkoły CLUB są współdzielone wyłącznie jako dane referencyjne. Dzięki temu testy z jednego pliku mogą zostać rozdzielone pomiędzy workery mimo globalnego ustawienia `fullyParallel: false`.

Domyślnie regresja używa dwóch workerów. Skrypt `npm run test:workers:4` pozwala wykorzystać cztery, jeśli środowisko DEV/TEST i komputer wykonujący testy mają wystarczającą wydajność. Kolejność komunikatów w konsoli nie musi wtedy odpowiadać numeracji CLUB, ale identyfikatory scenariuszy i raport pozostają bez zmian.

## 4. Zakres CLUB-01–CLUB-71 i KLUB-DOD-01–02

| Test          | Cel                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `CLUB-01`     | trwałość formularza i historia jego utworzenia                                                         |
| `CLUB-02`     | edycja klasy 4 na 5 oraz historia zmiany                                                               |
| `CLUB-03`     | dostępne są wyłącznie klasy 4–8                                                                        |
| `CLUB-04`     | zapis kilku klas: 4, 5, 6                                                                              |
| `CLUB-05`     | zaznaczenie wszystkich klas                                                                            |
| `CLUB-06`     | usunięcie tylko jednej klasy z zestawu                                                                 |
| `CLUB-07`     | formularz dotyczy wyłącznie wybranej szkoły                                                            |
| `CLUB-08`     | dwie szkoły tworzą osobne potwierdzenia                                                                |
| `CLUB-09`     | anulowanie dodawania nie tworzy potwierdzenia                                                          |
| `CLUB-10`     | anulowanie edycji zachowuje poprzednią klasę                                                           |
| `CLUB-11`     | usunięty formularz pozostaje oznaczony ikoną `backspace`                                               |
| `CLUB-12A`    | brak szkoły blokuje zapis                                                                              |
| `CLUB-12B`    | brak klasy blokuje zapis                                                                               |
| `CLUB-13`     | prezentacja wszystkich wydawnictw zwykłego potwierdzenia                                               |
| `CLUB-14`     | domyślnie wybrany bieżący rok szkolny                                                                  |
| `CLUB-15`     | lista szkół i przedmioto-poziomów nauczyciela                                                          |
| `CLUB-16`     | klasy dostępne dopiero po wybraniu szkoły                                                              |
| `CLUB-17`     | odznaczenie szkoły czyści wybrane klasy                                                                |
| `CLUB-18`     | klasa NASZA blokuje odpowiadającą klasę OBCĄ                                                           |
| `CLUB-19`     | klasa OBCA blokuje odpowiadającą klasę NASZĄ                                                           |
| `CLUB-20`     | różne klasy mogą być jednocześnie NASZE i OBCE                                                         |
| `CLUB-21`     | Fizyka pozwala wybrać dwie NASZE serie tej samej klasy                                                 |
| `CLUB-22`     | zaznaczenie wszystkich klas Fizyki obejmuje obie serie                                                 |
| `CLUB-23`     | Matematyka/SŚ pozwala zaznaczyć wszystkie klasy obu typów                                              |
| `CLUB-24`     | trwałość wszystkich klas Matematyki/SŚ i wydawnictwa                                                   |
| `CLUB-25`     | trwałość klas Fizyki i kodów serii `GWO F+` / `GWO TNŚ`                                                |
| `CLUB-26`     | pusta edycja pokazuje ostrzeżenie i nie zmienia rekordu                                                |
| `CLUB-27`     | istniejące potwierdzenie blokuje duplikat                                                              |
| `CLUB-28`     | trwałość formularza dla poprzedniego roku szkolnego                                                    |
| `CLUB-29`     | osobne potwierdzenia dla dwóch różnych lat szkolnych                                                   |
| `CLUB-30`     | odznaczenie wszystkich klas NASZYCH czyści wybór                                                       |
| `CLUB-31`     | odznaczenie wszystkich klas OBCYCH czyści wybór                                                        |
| `CLUB-32`     | edycja klasy NASZEJ na OBCĄ zachowuje wydawnictwo                                                      |
| `CLUB-33`     | klasa OBCA bez wydawnictwa nie tworzy formularza                                                       |
| `CLUB-34`     | zmiana wydawnictwa podczas edycji jest trwała                                                          |
| `CLUB-35`     | usunięcie ostatniej klasy OBCEJ zachowuje klasę NASZĄ                                                  |
| `CLUB-36`     | edycja dodaje klasę NASZĄ bez utraty poprzedniej                                                       |
| `CLUB-37`     | zmiana przedmiotu nie przenosi wybranych klas                                                          |
| `CLUB-38`     | Matematyka i Fizyka tworzą niezależne potwierdzenia                                                    |
| `CLUB-39`     | usuniętego formularza nie można edytować                                                               |
| `CLUB-40`     | po usunięciu można utworzyć nową tę samą kombinację                                                    |
| `CLUB-41`     | przywrócenie zachowuje klasę i tworzy wpis historii                                                    |
| `CLUB-42`     | aktywny duplikat blokuje przywrócenie i wskazuje jego ID                                               |
| `CLUB-43`     | przywrócenie zachowuje zestaw klas NASZYCH                                                             |
| `CLUB-44`     | przywrócenie zachowuje klasę OBCĄ i wydawnictwo                                                        |
| `CLUB-45`     | inny aktywny przedmiot nie blokuje przywrócenia                                                        |
| `CLUB-46`     | nowsze potwierdzenie blokuje przywrócenie starszego                                                    |
| `CLUB-47`     | inna aktywna szkoła nie blokuje przywrócenia                                                           |
| `CLUB-48`     | przywrócone potwierdzenie można ponownie edytować                                                      |
| `CLUB-49`     | cztery akcje wymagają wskazania potwierdzenia                                                          |
| `CLUB-50`     | weryfikacja zmienia klasę i tworzy wpis historii                                                       |
| `CLUB-51`     | weryfikacja negatywna obejmuje wszystkie klasy NASZE                                                   |
| `CLUB-52`     | edycja klasy z powrotem na NASZĄ przywraca status `Nasz`                                               |
| `CLUB-53`     | negatywne potwierdzenie można usunąć i zapisać w historii                                              |
| `CLUB-54`     | edycja Matematyki nie zmienia potwierdzenia Fizyki                                                     |
| `CLUB-55`     | negatywna weryfikacja Matematyki nie zmienia Fizyki                                                    |
| `CLUB-56`     | usunięcie i przywrócenie Matematyki nie zmienia Fizyki                                                 |
| `CLUB-57`     | dwie szkoły i dwa przedmioty tworzą cztery rekordy                                                     |
| `CLUB-58`     | dwa przedmioty zachowują rekordy dla dwóch różnych lat                                                 |
| `CLUB-59`     | mieszany cykl życia zachowuje osobne statusy i historie                                                |
| `CLUB-60`     | nowsze potwierdzenie blokuje dodanie starszego                                                         |
| `CLUB-61`     | Język polski pozwala zapisać jedną serię klasy 4                                                       |
| `CLUB-62`     | WSPOM tworzy potwierdzenie i funkcję wspomagającą                                                      |
| `CLUB-63`     | jeden WSPOM zapisuje dwa niezależne przedmioty                                                         |
| `CLUB-64`     | dwa szybkie kliknięcia zapisu nie tworzą dwóch rekordów                                                |
| `CLUB-65`     | wszystkie klasy OBCE Matematyki SP są trwałe                                                           |
| `CLUB-66`     | edycja polskiego zmienia serię `GWO MN` na `GWO MZ`                                                    |
| `CLUB-67`     | wszystkie NASZE polskiego wybierają jedną serię klasy 4                                                |
| `CLUB-68`     | WSPOM nie pokazuje serii polskiego ani fizyki                                                          |
| `CLUB-69`     | prezentacja wszystkich wydawnictw potwierdzenia WSPOM                                                  |
| `CLUB-70`     | WSPOM wymaga szkoły, przedmiotu i klasy                                                                |
| `CLUB-71`     | zwykłe potwierdzenie i WSPOM mogą współistnieć                                                         |
| `KLUB-DOD-01` | formularz WSPOM nie oferuje Chemii ani innych przedmiotów spoza zamkniętej listy `SUPPORTING_SUBJECTS` |
| `KLUB-DOD-02` | dokumentuje wynik próby dodania starszego roku po utworzeniu potwierdzenia dla roku bieżącego          |

## 5. Reguły biznesowe

- Formularz klubowy wymaga wybranej szkoły i co najmniej jednej klasy.
- Matematyka na poziomie SP udostępnia klasy 4–8.
- Własne i obce klasy są niezależne.
- Dla standardowego przedmioto-poziomu ten sam numer klasy nie może być jednocześnie NASZ i OBCY.
- Fizyka/SP ma klasy NASZE `7`, `8`, `7TNŚ`, `8TNŚ`; można zaznaczyć obie NASZE serie tej samej klasy.
- W boxie szkoły standardowa seria Fizyki jest prezentowana jako `GWO F+`, seria TNŚ jako `GWO TNŚ`, a równoczesny wybór obu serii jako `GWO F+ / TNŚ`.
- Matematyka/SŚ ma klasy NASZE `1P–5P`, `1R–5R` oraz OBCE `1–5`; wszystkie mogą być zaznaczone równocześnie.
- Klasa obca wymaga wskazania wydawnictwa.
- Każde dostępne wydawnictwo musi być widoczne zarówno w edycji formularza, jak i w boxie szkoły. Zwykły formularz udostępnia `WIKING`, `OPERON`, `MAC`, `NOWA ERA`, `WSiP` i `INNE`. Formularz WSPOM dodatkowo udostępnia `GWO „Między nami”` oraz `GWO „Moim zdaniem”`, a nazwę WSiP prezentuje w liście jako `WSIP`.
- Zmiana wydawnictwa w istniejącym formularzu powinna być trwała.
- Zmiana przedmiotu nie może przenosić klas wybranych dla poprzedniego przedmiotu.
- Dwie szkoły nauczyciela tworzą dwa różne potwierdzenia, nawet dla tego samego przedmiotu.
- Ta sama szkoła i rok mogą mieć osobne potwierdzenia dla różnych przedmiotów.
- Kolejność zwróconych potwierdzeń nie określa szkoły; test identyfikuje szkołę po szczegółach rekordu.
- Usunięcie jest logiczne: rekord pozostaje w tabeli i otrzymuje oznaczenie `backspace`.
- Usuniętego rekordu nie można edytować, ale nie blokuje on utworzenia nowego potwierdzenia dla tej samej szkoły, roku i przedmiotu. Nowy rekord otrzymuje nowe ID, a poprzedni pozostaje oznaczony jako usunięty. Klasy w nowym formularzu wybiera się niezależnie — mogą być takie same jak w usuniętym rekordzie albo inne.
- Usunięte potwierdzenie można przywrócić, jeżeli nie istnieje inne aktywne potwierdzenie dla tej samej kombinacji roku, przedmiotu i szkoły.
- Przywrócenie zachowuje wcześniejsze klasy oraz wydawnictwo i nie zmienia ID potwierdzenia.
- Aktywne potwierdzenie innego przedmiotu albo innej szkoły nie jest konfliktem przywracania.
- Nowsze potwierdzenie dla tego samego przedmiotu, poziomu i szkoły blokuje przywrócenie starszego, nawet jeśli rekordy dotyczą różnych lat szkolnych. Komunikat wskazuje ID nowszego potwierdzenia.
- Nowsze potwierdzenie blokuje również późniejsze dodanie starszego formularza dla tej samej szkoły, poziomu i przedmiotu. Jeśli potrzebne są dwa lata, należy zapisać je chronologicznie: najpierw starszy, potem nowszy.
- Jeśli aktywna jest identyczna kombinacja roku, przedmiotu i szkoły, Octopus blokuje przywrócenie, pokazuje komunikat oraz ID aktywnego potwierdzenia. Usunięty rekord nadal pozostaje oznaczony ikoną `backspace`.
- Akcje „Edytuj”, „Weryfikuj neg.”, „Usuń” i „Historia” wymagają wskazania aktywnego potwierdzenia. Weryfikacja negatywna zmienia wszystkie jego klasy NASZE na OBCE i ustawia wydawnictwo `INNE`, przez co przedmioto-poziom nauczyciela otrzymuje status `Obcy`.
- Negatywnie zweryfikowane potwierdzenie nadal można edytować i usuwać. Zmiana klasy z OBCEJ z powrotem na NASZĄ przywraca status przedmioto-poziomu `Nasz`.
- Historia wybranego potwierdzenia zapisuje klasy, status NASZ, typ modyfikacji, autora i datę. Obejmuje utworzenie, edycję klas, weryfikację negatywną, logiczne usunięcie oraz przywrócenie.
- Potwierdzenia różnych przedmiotów są niezależne. Edycja, weryfikacja negatywna, usunięcie albo przywrócenie jednego przedmiotu nie może zmieniać klas, statusu ani historii drugiego.
- Jeden nauczyciel może mieć równocześnie osobne potwierdzenia dla wielu kombinacji szkoły, przedmiotu i roku szkolnego. Każda kombinacja otrzymuje własne ID i zachowuje własny zestaw klas.
- Język polski na poziomie SP udostępnia dwie NASZE serie klasy 4: `4 Między N` oraz `4 Moim Z`. Zaznaczenie jednej serii blokuje drugą, dlatego w jednym potwierdzeniu może być aktywna tylko jedna z nich.
- Podczas edycji potwierdzenia Języka polskiego można zmienić serię klasy 4, ale po zmianie poprzednia seria pozostaje odznaczona i zablokowana. Ponowny zapis nadal nie może zawierać obu serii.
- W boxie szkoły seria `4 Między N` jest prezentowana jako `GWO MN`, a `4 Moim Z` jako `GWO MZ`.
- Połączenie serii `4 Moim Z` z dowolną klasą 5–8 jest prezentowane jako `GWO MN / MZ`, ponieważ klasy 5–8 należą do serii „Między nami”.
- `Zaznacz wszystkie możliwe (nasze)` dla Języka polskiego wybiera klasy 5–8 oraz dokładnie jedną z dwóch serii klasy 4. Wybór pozostaje trwały po ponownym otwarciu formularza.
- Opcja `Zaznacz wszystkie możliwe` obejmuje osobne zestawy klas NASZYCH i OBCYCH. Zapis wszystkich klas OBCYCH wymaga wydawnictwa, a pełny wybór powinien pozostać trwały po ponownym otwarciu formularza.
- Formularz `Dodaj form. wspom` tworzy potwierdzenia z oznaczeniem `WSPOM`. Wybrana szkoła otrzymuje przy nauczycielu funkcję `Nauczyciel wspomagający`, a każdy zaznaczony przedmiot jest zapisywany jako osobne potwierdzenie.
- Formularz WSPOM używa uproszczonych klas bez serii: Język polski udostępnia klasy 4–8, a Fizyka klasy 7–8. Nie występują w nim serie `4 Między N`, `4 Moim Z`, `7TNŚ` ani `8TNŚ`.
- WSPOM może zapisać klasę OBCĄ po wskazaniu wydawnictwa. Taki zapis nadaje przedmioto-poziomowi status `Obcy`, zachowując funkcję `Nauczyciel wspomagający`. Pełne nazwy serii GWO są w boxie szkoły prezentowane skrótami: `GWO „Między nami”` jako `GWO MN`, a `GWO „Moim zdaniem”` jako `GWO MZ`; pozostałe nazwy są prezentowane bez zmiany.
- Formularz WSPOM wymaga wybrania szkoły, co najmniej jednego przedmiotu oraz co najmniej jednej klasy dla wybranego przedmiotu.
- Zwykłe potwierdzenie i potwierdzenie WSPOM mogą współistnieć dla tej samej szkoły, roku i przedmiotu; są zapisywane jako rekordy o różnych ID.
- Dwa szybkie kliknięcia myszy w `Zapisz`, rozdzielone odstępem 100 ms, nie powinny tworzyć dwóch potwierdzeń tej samej kombinacji.
- Testy wyłączają wysyłkę e-maila do nauczyciela.
- Lista przedmiotów WSPOM jest zamknięta i pochodzi z `SUPPORTING_SUBJECTS`; obecnie nie zawiera między innymi Chemii, Wychowania fizycznego, Plastyki, Muzyki ani Informatyki.
- `KLUB-DOD-02` jest testem dokumentującym bieżącą politykę kolejności lat. Zarówno akceptacja, jak i kontrolowana blokada są rejestrowane; formalna reguła biznesowa wymaga potwierdzenia przed zaostrzeniem oczekiwania.

## 6. Najważniejsze helpery `club.ts`

| Helper                               | Odpowiedzialność                         |
| ------------------------------------ | ---------------------------------------- |
| API factory                          | przygotowanie Matematyka / SP            |
| `openNewClubForm()`                  | formularz nowego potwierdzenia           |
| `openNewSupportingClubForm()`        | formularz potwierdzenia WSPOM            |
| `selectSupportingSchool()`           | wybór szkoły w formularzu WSPOM          |
| `supportingSubject()`                | checkbox przedmiotu WSPOM                |
| `supportingOwnClasses()`             | klasy NASZE przedmiotu WSPOM             |
| `supportingForeignClasses()`         | klasy OBCE przedmiotu WSPOM              |
| `supportingOwnClass()`               | konkretna klasa NASZA przedmiotu WSPOM   |
| `supportingForeignClass()`           | konkretna klasa OBCA przedmiotu WSPOM    |
| `selectSupportingForeignPublisher()` | wydawnictwo klasy OBCEJ WSPOM            |
| `saveSupportingClubForm()`           | zapis i odczyt ID potwierdzenia WSPOM    |
| `openSupportingClubEdit()`           | edycja potwierdzenia WSPOM               |
| `selectSchool()`                     | wybór szkoły nauczyciela                 |
| `ownClass()` / `foreignClass()`      | checkbox konkretnej klasy                |
| `disableTeacherEmail()`              | wyłączenie wiadomości testowej           |
| `saveClubForm()`                     | zapis i odczyt ID potwierdzenia          |
| `openClubEdit()`                     | otwarcie edycji po ID                    |
| `confirmationRow()`                  | wiersz potwierdzenia                     |
| `confirmationDetails()`              | rozwinięte szczegóły                     |
| `deleteClubConfirmation()`           | logiczne usunięcie po ID                 |
| `deletedConfirmationIcon()`          | kontrola stanu usunięcia                 |
| `requestClubRestore()`               | rozpoczęcie przywracania po ID           |
| `restoreClubConfirmation()`          | przywrócenie i kontrola po GET           |
| `negativelyVerifyClubConfirmation()` | negatywna weryfikacja i kontrola statusu |
| `openClubHistory()`                  | historia wybranego potwierdzenia         |
| `clubHistoryRows()`                  | wiersze historii oświadczenia            |
| `clubHistoryEntry()`                 | wpis historii po klasie i modyfikacji    |
| `subjectLevelRow()`                  | przedmioto-poziom nauczyciela            |
| `teacherSchoolPublisherCell()`       | wydawnictwo/seria w boxie szkoły         |
| `teacherSchoolFunctionCell()`        | funkcja nauczyciela w boxie szkoły       |
| `cancelClubForm()`                   | anulowanie formularza                    |
| `confirmDeleteIfShown()`             | opcjonalny dialog usunięcia              |

## 7. Identyfikacja potwierdzeń

W `CLUB-08` test nie zakłada, że pierwszy zwrócony rekord należy do pierwszej szkoły. Każde potwierdzenie jest rozwijane, a przypisanie następuje po nazwie szkoły i klasie. Zapobiega to zależności od kolejności danych z API.

## 8. Uruchamianie

```text
npx playwright test tests/klubowiczostwo-nauczyciela.spec.ts --grep @club
npx playwright test tests/klubowiczostwo-dodatkowe.spec.ts
```
