# Weryfikacja projektu testów

## Timeout zbiorczego usuwania — poprawka nieuruchamiana

Zrzut użytkownika pokazuje 18 PASS i timeout podczas jednego DELETE dla 8 nauczycieli. Dotychczasowy limit klienta wynosił 30 s. Zmieniono limit DELETE na 180 s, pozostawiając 30 s dla GET. Po błędzie DELETE wykonywane są odczyty kontrolne, bez ponawiania usuwania; niepewne wyniki oznaczane są UNKNOWN. Nie ustalono na podstawie zrzutu, czy serwer zakończył usuwanie. Zgodnie z prośbą użytkownika poprawki nie uruchamiano.

## Zbiorcze DELETE — zmiana niezweryfikowana

Końcowe sprzątanie i ręczne cleanup:teachers wysyłają teraz jedno DELETE z listą unikalnych ID. Zachowano kontrolę rekordów przed wysłaniem i sprawdzanie ich braku po operacji. Zgodnie z prośbą użytkownika po tej zmianie nie uruchamiano testów ani usuwania na dev. Wyniki poniżej dotyczą wcześniejszego kodu.

## Sprzątanie po całym zestawie — 2026-09-17

Usunięto wywołania DELETE z końca pojedynczych scenariuszy. Global setup nadaje uruchomieniu `cleanupBatchId`, a global teardown po zakończeniu wszystkich testów wybiera wyłącznie nauczycieli z jego rejestrów PASS. Szkoły, starsze przebiegi i dane nieudanych testów pozostają.

Weryfikacja: `npm.cmd test -- szkola-nauczyciel.spec.ts zamowienia-klubowiczostwo.spec.ts --reporter=line`: **3 PASS, 1,9 min**. Po smoke nauczyciel 532334 miał status `PENDING_SUITE_END`, gdy trwał ORD-01. Dopiero po CLUB-01 konsola zgłosiła końcowe sprzątanie dwóch nauczycieli: 532334 i 532335, obaj `DELETED`. Nie wykonano ponownie pozostałych 15 scenariuszy. Lokalnie przeszło 10 testów zabezpieczeń (w tym izolacja bieżącego uruchomienia), TypeScript i kontrola diff.

Końcowy status sprzątania znajduje się w rejestrze `runs/REG_*.json` i konsoli; załącznik testu jest wcześniejszym zapisem i może wskazywać oczekiwanie. Błąd globalnego sprzątania kończy całe uruchomienie błędem. W trybie UI sprzątanie jest związane z globalnym teardown sesji; nie zweryfikowano interaktywnie tego trybu. Ręczne polecenie cleanup:teachers pozostaje dostępne po przerwanym uruchomieniu.

## Sprzątanie nauczycieli — 2026-09-17

Dodano automatyczne sprzątanie nauczyciela po PASS w fixture scenariusza i w teście smoke. Endpoint oraz query parameters potwierdzono w kodzie klienta i u programisty. Według kontraktu endpoint usuwa także formularze i przedmiotopoziomy oraz odpina szkoły; szkoły i ich zamówienia pozostają. Nie wykonano zbiorczego usuwania starych danych.

- CLUB-01: PASS (1,2 min z odnowieniem sesji), nauczyciel 532324, formularz 737029, szkoła 93116. Rejestr `REG_1789638250903_bc579c.json`: `cleanupStatus=DELETED`. Odczyt nauczyciela po DELETE zwrócił HTTP 204; sprzątanie trwało około 5 s. Kaskada zależności opiera się na kontrakcie programisty; nie odczytywano osobno tabel bazy.
- Smoke szkoła–nauczyciel: PASS, 47,1 s, łącznie ze sprzątaniem.
- `npm.cmd run test:cleanup`: 7 PASS (lokalne testy blokad i obsługi błędów, bez sieci).
- `npm.cmd run check`, `git diff --check`: PASS. Podgląd `npm.cmd run cleanup:teachers` działa bez logowania i zmian w Octopusie.

Nie wykonywano ponownie całego zestawu 18 testów. Narzędzie do starszych przebiegów domyślnie pokazuje listę; `--apply` wymaga jawnych nazw rejestrów PASS i ponownie weryfikuje rekord w API. Nieudane przebiegi nie są sprzątane. Błąd sprzątania jest zgłaszany jako niepowodzenie testu, a rejestr zachowuje osobno wynik scenariusza i `cleanupStatus`.

## Zamówienia i klubowiczostwo — 2026-09-17

`npm.cmd test -- zamowienia-klubowiczostwo.spec.ts`: **2 PASS**, 1,1 minuty w jednym przebiegu. ORD-01: 27,3 s; CLUB-01: 34,1 s. Kontrola TypeScript i lista 18 testów w czterech plikach: PASS. Nie wykonywano całego zestawu 18 testów razem.

- ORD-01: szkoła 93095, zamówienie 1019720, produkt KMLT18, ilość 1. Po ponownym otwarciu szkoły potwierdzono ten sam ID zamówienia, jedną pozycję, tytuł, kod, ilość i adres szkoły. Zmiana ilości wymaga kliknięcia edytora AG Grid przed wpisaniem; samo wpisanie do renderera w próbie rozpoznawczej pozostawiło domyślną ilość 10.
- CLUB-01: szkoła 93096, nauczyciel 532311, potwierdzenie 737024. Matematyka / SP została zapisana i sprawdzona po ponownym otwarciu przed dodaniem formularza. Formularz: rok 2026/2027 (odczytany z domyślnego wyboru), klasa 4 w grupie nasze. Wyłączono wysyłkę e-maila przed zapisem. Po ponownym otwarciu sprawdzono ten sam ID, rok, przedmiot, poziom, szkołę, klasę, oznaczenie Nasz oraz status przedmiotopoziomu.

HTML w `playwright-report` zawiera ten przebieg. Dane: `runs/REG_1789633987836_df66f9.json` i `runs/REG_1789634014655_7ee8e8.json`. Każde uruchomienie tworzy nowe rekordy; dane pozostają na dev. Rozpoznanie formularzy pozostawiło też szkołę 93094, nauczyciela 532310, potwierdzenie 737023 i zamówienie 1019719 (10 sztuk). Tymczasowy skrypt rozpoznawczy został usunięty. Testy nie wysyłają formularza nauczycielowi i nie obsługują dalszej realizacji zamówienia.

## Rozszerzenie nauczyciela — 2026-09-17

Dodano sześć przypadków w `tests/nauczyciel-rozszerzenie.spec.ts`; projekt wykrywa teraz 16 testów w trzech plikach.

| Przypadek                                             | Wynik                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| EDIT-03 — zapis nazwiska, trwałość i historia         | PASS w osobnej próbie po korekcie danych, 44,1 s wraz z przygotowaniem wspólnej szkoły |
| TEA-04 — niepoprawny e-mail                           | PASS, 19,4 s                                                                           |
| TEA-04 — za krótki telefon                            | PASS, 15,6 s                                                                           |
| FIND-05 — e-mail                                      | PASS, 14,5 s                                                                           |
| FIND-05 — nazwisko                                    | PASS, 15,5 s                                                                           |
| REL-02 — druga szkoła, trwałość i obie strony relacji | PASS, 32,3 s                                                                           |

Pierwsze uruchomienie nowego pliku dało 5 PASS / 1 FAIL (3 minuty). Edycja nazwiska dopuszcza litery i łącznik, więc syntetyczna wartość z cyframi i podkreśleniami została odfiltrowana. Zmieniono ją na `Nowak`, identyfikując nauczyciela przez jego ID. Ponownie wykonano wyłącznie EDIT-03: PASS. Nie jest to wynik jednego nieprzerwanego przebiegu wszystkich 16 testów.

Polecenia: `npm.cmd test -- nauczyciel-rozszerzenie.spec.ts`, następnie `npm.cmd test -- nauczyciel-rozszerzenie.spec.ts --grep EDIT-03 --reporter=line --output=runs/weryfikacja-edit-03`. HTML zachowuje pierwszy przebieg rozszerzenia z pierwotnym niepowodzeniem; oddzielna poprawna próba znajduje się w `runs/weryfikacja-edit-03`, a dane utworzonych rekordów w `runs/REG_*.json`. Poprawki nazw testów `email/phone` na `e-mail/telefon` nie zmieniają scenariuszy.

Walidację potwierdzono w UI dla `invalid-email` oraz numeru `123`, przy poprawnych pozostałych wymaganych danych. Każdy przypadek sprawdza komunikat i brak utworzonego nauczyciela w wyszukiwaniu. Nie wywodzimy z tych przykładów pełnej specyfikacji numerów międzynarodowych ani adresów e-mail.

Nowy fixture tworzy szkołę raz na proces wykonawczy. Każdy test ma własnego nauczyciela/formularz; REL-02 dodatkowo tworzy drugą szkołę. Wspólna szkoła nie jest usuwana; zapis jej ID i nazwy jest w `runs/REG_SHARED_*.json`. Starsze scenariusze zachowują dotychczasowe przygotowanie. Kontrola TypeScript, lista 16 testów oraz `git diff --check`: PASS.

## Aktualna weryfikacja po poprawce wyszukiwania — 2026-09-17

Poprawiono `tests/support/octopus.ts`: pierwsze wyszukiwanie szkoły/nauczyciela zaczyna się od panelu bez ID, a wpisywanie kryteriów czeka na widoczność formularza i fokus pierwszego pola. Drugie wyszukiwanie w FIND-04 pozostaje w tej samej sesji panelu z poprzednimi wynikami. Nie usunięto asercji komunikatu, kliknięcia OK ani pustej listy.

- `npm.cmd test`: **9 PASS, 1 FAIL**, 5,4 minuty. Test główny oraz oba FIND-04: **PASS**.
- Jedyny FAIL: TEA-02, brak nazwiska. Sesja wygasła podczas przygotowania szkoły i aplikacja skierowała test na `/login`. Następny worker automatycznie zalogował się do GitLaba i Octopusa.
- `npm.cmd test -- --grep nazwisko --reporter=line --output=runs/diagnostyka-wyszukiwania/powtorka-walidacji`: **1 PASS**, 31 sekund. Powtórzono wyłącznie przypadek przerwany utratą sesji.
- Wszystkie 10 scenariuszy uzyskało PASS w tej weryfikacji, ale nie w jednym nieprzerwanym przebiegu.
- `npm.cmd run check` i `git diff --check`: PASS.

Raport HTML w `playwright-report` zachowuje pełny przebieg 9/1; oddzielna powtórka nie nadpisuje go. Jej pliki wynikowe są w `runs/diagnostyka-wyszukiwania/powtorka-walidacji`, a zapis danych w `runs/REG_*.json`. Kopia poprzedniego raportu użytkownika jest w `runs/diagnostyka-wyszukiwania/playwright-report`.

Wcześniejsze stwierdzenie o ogólnym błędzie komunikatu było zbyt szerokie. Odrębną ścieżkę wejścia przez bezpośredni adres z ID i ustalenia z diagnostyki opisano w [OCT-OBS-002](OCT-OBS-002.md). Nie zmieniano kodu aplikacji.

## Historyczne rozszerzenie zestawu — 2026-09-17

Dodano dziewięć niezależnych przypadków w `tests/walidacja-anulowanie.spec.ts`. Łącznie jest 10 testów (w tym dotychczasowy proces z imieniem Jan).

Końcowe uruchomienie `npm.cmd test`: **8 passed, 2 failed**, około 4,4 minuty. `npm.cmd run check` oraz `git diff --check` zakończyły się poprawnie.

| Obszar                                                | Wynik końcowego przebiegu                           |
| ----------------------------------------------------- | --------------------------------------------------- |
| Pełna ścieżka szkoła–nauczyciel, JaN → Jan, historia  | PASS                                                |
| Walidacja braku imienia, nazwiska, szkoły, kontaktu   | 4 × PASS                                            |
| Anulowanie dodawania nauczyciela i szkoły             | 2 × PASS                                            |
| Anulowanie edycji, zachowanie danych i historii       | PASS                                                |
| Puste wyniki po wcześniejszym znalezieniu nauczyciela | FAIL — komunikat nie był widoczny w końcowym stanie |
| Puste wyniki po wcześniejszym znalezieniu szkoły      | FAIL — komunikat zniknął przed kliknięciem OK       |

Opis obserwacji i odtworzenia: [OCT-OBS-002](OCT-OBS-002.md). Te same dwa przypadki przeszły we wcześniejszym przebiegu, co wskazuje na zależność od momentu zamknięcia komunikatu. Nie oznaczono ich jako pomijanych ani oczekiwanych błędów. Przyczynę w kodzie aplikacji trzeba jeszcze ustalić.

Raport końcowy: lokalny `playwright-report/index.html`, dostępny przez `npm.cmd run report`. Zrzuty i ślady nieudanych przypadków: `test-results`. Rejestry danych: `runs/*.json`. Dane są pozostawione na dev. Wcześniejsze próby również tworzyły dane, a przed poprawką oczekiwania na zapis nie każda próba utrwaliła flagę Testowy; rekordy nadal można rozpoznać po unikalnym prefiksie REG.

Podczas uruchamiania poprawiono synchronizację automatyzacji: odczyt początkowych danych dopiero po załadowaniu e-maila; zaznaczenie flagi Testowy dopiero po wczytaniu jej stanu, oczekiwanie na zakończenie zapisu i weryfikacja po odświeżeniu. Anulowanie edycji po tych poprawkach przeszło zarówno oddzielnie, jak i w pełnym zestawie.

Pierwsza próba zestawu została przerwana z powodu wygasłej sesji, zanim powstały dane. Użytkownik odnowił sesję. Wszystkie powyższe wyniki pochodzą z późniejszych uruchomień z aktywną sesją.

## Historyczny pierwszy test

2026-09-17, Octopus dev, Chromium (Playwright 1.63.0).

- `npm.cmd run check`: PASS — kontrola typów TypeScript.
- `node --check scripts/login.mjs`: PASS — składnia skryptu logowania.
- `npm.cmd run test:list`: PASS — wykrywa jeden test całego procesu.
- `npm.cmd run login`: PASS — użytkownik zalogował się, zapisano lokalną sesję.
- `npm.cmd test`: **1 passed**, test 26,5 s, całość 29,0 s.
- Sprawdzono wykluczenie sesji i artefaktów z Git przez `git check-ignore`.

Zaliczony przebieg: `REG_1789626483792_d4f729`. Szczegóły i ID rekordów w `runs/REG_1789626483792_d4f729.json`, raport w `playwright-report/index.html`.

Potwierdzono tworzenie szkoły i nauczyciela, wyszukiwanie, trwałość flag Testowy, relację w obu kartotekach, normalizację BoŻena → Bożena, zachowanie e-maila i zgód oraz wpisy historii.

Podczas przygotowania skryptu wcześniejsze próby zatrzymały się na obsłudze fokusu wyszukiwarki i selektorze tabeli historii. Poprawiono wprowadzanie tekstu (fill oraz zdarzenie keyup) i selektory komórek. Jeden przebieg przerwano po rozpoznaniu nieprawidłowej roli komórki. Są to próby uruchomieniowe automatyzacji, nie zgłoszenia błędów Octopusa. Częściowe dane pozostały na dev; rejestry wszystkich prób znajdują się w `runs`. Brak pola result w rejestrze oznacza przerwany/niedokończony przebieg, nigdy PASS.

Zaliczenie dotyczy jednej ścieżki na jednej sesji użytkownika. Nie zweryfikowano całego katalogu regresji, wszystkich ról ani wszystkich przeglądarek. Test sam nie wykonuje logowania — korzysta z zapisanej sesji. Tryby headed/UI udostępniono w poleceniach, a końcowy przebieg weryfikacyjny wykonano bez widocznego okna.
