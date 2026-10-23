# Redmine #37164 — wielokrotne przypisanie szkoły do nauczyciela

Zgłoszenie: https://redmine.gwo.pl/issues/37164. Projekt Octopus, typ Błąd. Na przekazanym zrzucie zgłoszenie ma status „Do wdrożenia na przedprodukcję”; nie jest to wynik testów. Opis i zrzut wskazują, że po kolejnym kliknięciu Szukaj przy już wybranej szkole ikona minus ponownie zmieniała się na plus, umożliwiając duplikację i zapis.

## Reguła i dane

Jedna szkoła może być przypisana do jednego nauczyciela dokładnie raz. Ponowne wyszukanie, otwarcie okna lub edycja nie mogą umożliwiać ponownego dodania. Można natomiast dodać drugą, inną szkołę.

Testy korzystają z dwóch szkół przygotowywanych przez `shared-school` osobno na DEV i TEST. Aktualne ID są wyszukiwane po dokładnej nazwie; brakujące szkoły powstają jako rekordy Testowy. Kroki regresji nie edytują danych szkół. Każdy scenariusz używa własnego nauczyciela z identyfikatorem `REG_*`, adresem `@example.invalid` i flagą Testowy. Przy tworzeniu testowany jest rzeczywisty formularz z wymaganymi zgodami dla źródła danych. Przy edycji własny nauczyciel jest przygotowywany przez istniejącą fabrykę API. Edycja szkół odbywa się przyciskiem „Dodaj szkołę” na profilu; zapis tego okna zapisuje relacje bez otwierania osobnej edycji danych podstawowych.

## Scenariusze Playwright

| ID | Kroki | Oczekiwany rezultat |
| --- | --- | --- |
| REL-BUG-37164-01 | Otwórz dodawanie nauczyciela, dodaj Szkołę QA 1, ponownie dwukrotnie wyszukaj ją po nazwie; jeśli UI udostępnia plus, spróbuj go użyć. Zapisz szkoły i nauczyciela, otwórz profil ponownie. | Plus nie wraca; w wyborze, formularzu, zapisanej odpowiedzi API i profilu istnieje jedna relacja. |
| REL-BUG-37164-02 | Podczas tworzenia wybierz QA 1, zapisz okno szkół, otwórz je ponownie i powtórz wyszukiwanie oraz próbę duplikacji. Następnie zapisz nauczyciela i odczytaj profil. | Ponowne otwarcie okna zachowuje informację o wybranej szkole; zapis nie tworzy duplikatów. |
| REL-BUG-37164-03 | Przygotuj własnego nauczyciela z QA 1, otwórz edycję i okno szkół. Dwukrotnie wyszukaj QA 1, sprawdź akcję i spróbuj dodania, jeśli jest dostępne. Zapisz edycję i odczytaj profil. | Istniejącej relacji nie można dodać drugi raz; po zapisie API i UI zawierają tylko QA 1. |
| REL-BUG-37164-04 | Edytuj własnego nauczyciela z QA 1, dodaj inną szkołę QA 2, dwukrotnie wyszukaj QA 2 i sprawdź ochronę przed duplikacją. Zapisz i odczytaj profil. | Pierwsze dodanie innej szkoły działa. Ponowne dodanie jej jest blokowane. Po zapisie dokładnie po jednej relacji QA 1 i QA 2. |

Kontrola czeka na faktyczną odpowiedź `TeacherSchools/GetSchoolsToAddToTeacher`, aby nie ocenić stanu sprzed wyszukania. Tabele wyników i wybranych szkół są sprawdzane osobno. Próba duplikacji klika wyłącznie ikonę `add_circle_outline`; nie klika minusa, który usuwa relację. Testy akceptują również usunięcie już przypisanej szkoły z listy kandydatów.

Po zapisie nowe wejście na profil sprawdza zarówno rzeczywisty odczyt `TeacherSchools/GetTeacherSchools`, jak i wiersze UI. API musi zawierać dokładnie oczekiwane ID, bez powtórzeń. Miękkie asercje pozwalają zapisać wynik końcowy po stwierdzeniu błędu, ale taki test nadal otrzymuje FAIL, a nie oczekiwany błąd.

## Dowody, porządkowanie i uruchamianie

Każdy scenariusz dołącza zrzuty po dwóch próbach, końcowy ekran oraz JSON: ID nauczyciela, szkoły, dostępność plusa, liczba wybranych wierszy i zapisane relacje. Zrzuty ze zgłoszenia są materiałem wejściowym, a dowodem aktualnego sprawdzenia jest raport wykonania.

Własne rekordy zaliczonych testów podlegają istniejącemu cleanupowi nauczycieli na końcu przebiegu. Rekordy niezaliczonych testów pozostają do analizy zgodnie z zasadami projektu. Rejestry `runs/REG_*.json` dokumentują ich ID i stan. Nie są usuwane ani zmieniane cudze rekordy.

W panelu Octopusa: DEV, jeden worker, filtr `@redmine-37164`, bez innych zaznaczonych testów. Można też otworzyć panel z karty zgłoszenia w Centrum, z przypiętymi czterema ID. Nie trzeba uruchamiać całej regresji.

Zakres nie obejmuje równoczesnego zapisu w wielu kartach ani bezpośredniego wysłania celowo zduplikowanego żądania poza interfejsem. Testuje odtworzenie błędu użytkownika oraz trwały stan relacji.

## Wynik — 19.10.2026

Końcowy przebieg DEV, jeden worker: **4 PASS, 0 FAIL, 0 SKIP**, około 89 sekund wraz z automatycznym sprzątaniem. We wszystkich czterech scenariuszach dwie próby wyszukania wybranej szkoły nie udostępniły ponownie plusa, a tabela wyboru zawierała jeden wiersz. Po zapisie API i profil zawierały dokładnie oczekiwane szkoły, bez duplikatów. Dodanie drugiej, innej szkoły również przeszło.

[Raport Playwright — 523452d6-ee34-447d-ac0c-07a434bdf842](http://127.0.0.1:4173/report/523452d6-ee34-447d-ac0c-07a434bdf842/), przypięty do [karty #37164 w Centrum testów](http://127.0.0.1:4180/#issues/9a28211c-7d9c-484c-89a2-b999cb418353). Każdy scenariusz ma zrzuty dwóch prób, końcowy zrzut i JSON. Własnych nauczycieli zaliczonych testów usunięto przez cleanup projektu.

Błędu aktualnie nie odtworzono w sprawdzonym zakresie. Numer wdrożenia DEV jest nieznany; nie zmieniono statusu zgłoszenia w Redmine.

Wstępne przebiegi `e54833fb-c38c-47a3-b17c-adab73075c1f` i `0ecdd4d4-ba65-4d8a-8bd9-c986329cab91` wykryły problemy przygotowania nowych testów: selektor wiersza, brak wymaganej zgody w formularzu QA i niewłaściwe okno edycji. Nie są dowodem występowania zgłoszonego błędu. Zachowano historię i dodano wyjaśnienie na karcie; do potwierdzenia poprawki przypięto wyłącznie końcowy raport.
