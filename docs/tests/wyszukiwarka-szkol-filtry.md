# Rozszerzone filtry wyszukiwarki szkół

Zestaw SFLT-01–SFLT-32 obejmuje nowe pola wyszukiwarki, łączenie kryteriów, dokładne RSPO i czyszczenie filtrów. Po przebiegu użytkownika poprawiono SFLT-09 (założenie o obu medalach na jednej stronie) i SFLT-16 (dopasowanie tekstu opcji poziomu). Poprawione testy nie zostały ponownie uruchomione przez agenta. Trzy scenariusze sezonu SI wymagają wskazania kontrolowanych szkół, a jeden dokumentuje brak pola Notatki.

## Dane i sposób porównania

Scenariusze korzystają ze wspólnych czterech szkół `AUTO_SFLT_DEV_V1_A/B/C/D` (na TEST: `AUTO_SFLT_TEST_V1_A/B/C/D`). Powstają przez istniejące API tylko wtedy, gdy ich jeszcze nie ma, i są oznaczane jako testowe. Szkoła A ma 401 uczniów, B ma 101, C ma 1, a D jest przedszkolem. Zestaw nie ma medali ani spotkań SI. RSPO to 871100–871103 na DEV oraz 871200–871203 na TEST. Numery nie muszą być unikalne w całej bazie; większość scenariuszy dodatkowo ogranicza wynik własną nazwą.

ID szkół są zapisywane w `playwright/.auth/<środowisko>/search-filter-schools.json`. Kolejne testy i kolejne uruchomienia używają tego samego zestawu. Przy pierwszym użyciu w każdym workerze sprawdzane są nazwa, kategoria i liczba uczniów; rozbieżność przerywa przygotowanie, zamiast automatycznie zmieniać dane. Testy filtrów nie edytują szkół i nie dodają im medali ani SI, więc mogą współdzielić rekordy. W opisach scenariuszy „tworzy cztery szkoły” oznacza teraz przygotowanie lub ponowne użycie wspólnego zestawu, nie tworzenie go dla każdego testu.

Blokada plikowa chroni przygotowanie przed równoległym tworzeniem przez kilka workerów. Po przerwaniu częściowego przygotowania zapisane ID są używane ponownie, a brakujące rekordy wyszukiwane po stałej nazwie. Niejednoznaczne nazwy lub niepotwierdzony zapis powodują czytelny błąd, a nie automatyczne tworzenie kolejnego kompletu. Po awaryjnym zatrzymaniu procesu może pozostać plik `.lock`; przed jego usunięciem należy potwierdzić, że proces właściciela już nie działa.

Testy porównują ID zwrócone przez rzeczywistą wyszukiwarkę z ID przygotowanych szkół. Kliknięcia i wybór opcji odbywają się w UI; odpowiedź i wysłane kryteria są odczytywane z żądania wyszukiwarki. Nie jest to test samego API ani test z atrapą backendu. Na początku czyszczone są pola tekstowe oraz Medal, Kategoria, SI, Tagi i Poziom, aby poprzednie kryteria nie wpływały na wynik.

Własna nazwa ogranicza zbiór do czterech szkół i pozwala porównać kompletny wynik, zamiast sprawdzać tylko pierwszą stronę dużej listy. Szkoły pozostają w środowisku do kolejnych uruchomień. Nie należy wykorzystywać ich do ręcznych zmian ani testów dodających medale lub SI. Szkoły utworzone przez wcześniejszą wersję testów z losowymi nazwami nie są automatycznie usuwane ani przejmowane.

## Scenariusze krok po kroku

| ID      | Co robi i czego wymaga                                                                                                                                                                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SFLT-01 | Otwiera formularz. Sprawdza komplet i kolejność opcji Medalu, Kategorii i SI, wielokrotny wybór Medalu/Kategorii oraz możliwość wpisania RSPO.                                                                                                                                         |
| SFLT-02 | Tworzy cztery szkoły. Wybiera A i wspólną nazwę. Wymaga wyłącznie ID szkoły A.                                                                                                                                                                                                         |
| SFLT-03 | W tych samych warunkach wybiera B. Wymaga wyłącznie ID szkoły B.                                                                                                                                                                                                                       |
| SFLT-04 | Wybiera C. Wymaga wyłącznie ID szkoły C.                                                                                                                                                                                                                                               |
| SFLT-05 | Wybiera D. Wymaga wyłącznie ID przedszkola.                                                                                                                                                                                                                                            |
| SFLT-06 | Wybiera A i B jednocześnie. Wymaga obu szkół i wykluczenia C/D; potwierdza OR.                                                                                                                                                                                                         |
| SFLT-07 | Wybiera niekolejne A i C. Wymaga obu szkół i wykluczenia B/D.                                                                                                                                                                                                                          |
| SFLT-08 | Wybiera A/B/C/D. Wymaga wszystkich czterech szkół.                                                                                                                                                                                                                                     |
| SFLT-09 | Dla znanej szkoły złotej i własnej szkoły bez medalu najpierw sprawdza medal na profilu. Następnie osobno wyszukuje każdą po nazwie i miejscowości, z wyborem Brak oraz Złoto. Wymaga obecności jej ID i braku innych medali. Nie wymaga obu medali na jednej stronie ogólnego wyniku. |
| SFLT-10 | Wybiera Medal Brak, kategorię A i własną nazwę. Wymaga szkoły A bez medalu.                                                                                                                                                                                                            |
| SFLT-11 | Powtarza kombinację Brak z kategorią B. Wymaga szkoły B.                                                                                                                                                                                                                               |
| SFLT-12 | Powtarza kombinację Brak z kategorią C. Wymaga szkoły C.                                                                                                                                                                                                                               |
| SFLT-13 | Powtarza kombinację Brak z kategorią D. Wymaga przedszkola; D nie może być wykluczone z Brak.                                                                                                                                                                                          |
| SFLT-14 | Wybiera Medal Brak lub Złoto, kategorię B lub C oraz własną nazwę. Wymaga dokładnie B/C, czyli OR wewnątrz pola i AND między polami.                                                                                                                                                   |
| SFLT-15 | Wybiera kategorię A lub B, lecz dokładną nazwę szkoły B. Wymaga wyłącznie B.                                                                                                                                                                                                           |
| SFLT-16 | Wybiera poziom Szkoła Podstawowa, Medal Brak, wszystkie kategorie i własną nazwę. Wymaga A/B/C i wykluczenia przedszkola D.                                                                                                                                                            |
| SFLT-17 | Podaje pełny RSPO szkoły A i nazwę własnego zestawu. Sprawdza wysłany numer i wyłącznie ID szkoły A.                                                                                                                                                                                   |
| SFLT-18 | Podaje RSPO skrócony o ostatnią cyfrę oraz nazwę zestawu. Wymaga pustej odpowiedzi i komunikatu Brak wyników wyszukiwania, zatwierdza OK i sprawdza pustą tabelę.                                                                                                                      |
| SFLT-19 | Łączy dokładny RSPO szkoły A z kategorią D i nazwą zestawu. Sprawdza wysłanie RSPO oraz kategorii D do API i wymaga ID szkoły A: dokładny RSPO ma pierwszeństwo nad pozostałymi filtrami.                                                                                              |
| SFLT-20 | Najpierw wyszukuje cztery własne szkoły. Potem podaje nieistniejącą nazwę i Medal Brak. Wymaga komunikatu braku wyników i usunięcia poprzednich wierszy.                                                                                                                               |
| SFLT-21 | Wybiera A/D i potwierdza ich widoczność w polu Kategoria. Klika krzyżyk czyszczenia. Wymaga pustego pola, braku krzyżyka i odznaczonych opcji A/D. Wyszukuje po nazwie, sprawdza brak aktywnego kryterium kategorii w żądaniu oraz wszystkie cztery szkoły.                            |
| SFLT-22 | Wybiera Brak/Złoto i potwierdza ich widoczność w polu Medal. Klika krzyżyk czyszczenia. Wymaga pustego pola, braku krzyżyka i odznaczonych opcji Brak/Złoto. Wyszukuje po nazwie, sprawdza brak aktywnego kryterium medalu w żądaniu oraz wszystkie cztery szkoły.                     |
| SFLT-23 | Wybiera SI Tak, po czym używa przycisku czyszczenia SI. Wymaga braku kryterium SI i wszystkich czterech szkół.                                                                                                                                                                         |
| SFLT-24 | Wyszukuje kolejno A, D i B. Po każdej zmianie wymaga wyłącznie ID odpowiedniej szkoły, bez poprzednich wyników.                                                                                                                                                                        |
| SFLT-25 | Wpisuje błędny tekst abc do RSPO, opuszcza pole, poprawia na prawidłowy numer i wyszukuje. Wymaga poprawnego wyniku po korekcie; nie określa zachowania zapisu błędnego formularza.                                                                                                    |
| SFLT-26 | Łączy SI Tak z Medalem Brak, kategoriami A/D i nazwą nowych szkół. Weryfikuje `si: true` w żądaniu i wymaga pustego wyniku, bo szkoły nie mają SI.                                                                                                                                     |
| SFLT-27 | W tej samej kombinacji wybiera SI Nie. Weryfikuje `si: false` i wymaga dokładnie A/D.                                                                                                                                                                                                  |
| SFLT-28 | Dla skonfigurowanej szkoły z SI bieżącego sezonu potwierdza dokładną identyfikację po nazwie, obecność przy SI Tak i brak przy SI Nie.                                                                                                                                                 |
| SFLT-29 | Dla szkoły z SI wyłącznie poprzednich sezonów wymaga obecności przy SI Nie i braku przy Tak.                                                                                                                                                                                           |
| SFLT-30 | Dla szkoły z SI wyłącznie przyszłego sezonu wymaga obecności przy SI Nie i braku przy Tak.                                                                                                                                                                                             |
| SFLT-31 | Wymaga etykiety Notatki w formularzu. Obecny DEV ma Tagi, a nie Notatki, dlatego przypadek oznaczono `test.fail`. Nie udaje pokrycia filtrowania treści notatek.                                                                                                                       |
| SFLT-32 | Ustawia wyłącznie RSPO, bez nazwy, Medalu, Kategorii i SI. Wymaga obecności własnej szkoły A oraz wykluczenia pozostałych trzech szkół o sąsiednich numerach. Nie zakłada unikalności RSPO w całym DEV.                                                                                |

## Rozbieżności DEV po przebiegu użytkownika

Odczyt wyszukiwarki przez API z 14.10.2026, bez zapisu historii wyszukiwania i bez modyfikowania szkół, potwierdził następujące wyniki dla zestawu `AUTO_SFLT_DEV_V1`. Zapytania miały tę samą nazwę zestawu, użytkownika i paginację; różniły się wskazanym kryterium:

| Kryterium                                     | Wynik                          | Znaczenie dla testów                                                                                                                                             |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tylko nazwa zestawu                           | 4 szkoły, każda z medalem Brak | Dane istnieją; brak wyników poniżej nie wynika z nieutworzenia szkół.                                                                                            |
| Medal `[null]`, czyli wybór Brak w formularzu | 0 szkół                        | SFLT-10–SFLT-14 i SFLT-27 zachowują oczekiwania biznesowe; nie usuwamy filtra medalu, aby je zaliczyć.                                                           |
| Medal `[]`                                    | 0 szkół                        | Odczyt API potwierdził problem jawnej pustej listy. SFLT-22 używa obecnie krzyżyka, który może zamiast listy wysłać brak parametru; nadal wymaga czterech szkół. |
| Kategoria `[]`                                | 0 szkół                        | Odczyt API potwierdził problem jawnej pustej listy. SFLT-21 używa obecnie krzyżyka, który może zamiast listy wysłać brak parametru; nadal wymaga czterech szkół. |
| Kategoria `[1]`                               | Szkoła A                       | Pojedynczy filtr kategorii działa dla tego zestawu.                                                                                                              |
| RSPO `871100` oraz Kategoria `[4]`            | Szkoła A, ID 94435             | Zachowanie poprawne według doprecyzowania użytkownika: dokładny RSPO ma pierwszeństwo nad kategorią. SFLT-19 wymaga zwrócenia szkoły A.                          |

Przypadki filtra Brak i pustych list pozostają zwykłymi testami z oczekiwaniem zgodnym z wymaganiami, nie `skip` ani `test.fail`. Nie normalizujemy w helperze pustych list ani wartości Brak i nie zmieniamy odpowiedzi API. Dzięki temu test nadal wykryje błąd aplikacji. Pozostałe zależne kombinacje wymagają ponownej oceny po naprawie filtra Brak. Pierwszeństwo RSPO nie jest błędem; wcześniejsza interpretacja AND dla SFLT-19 została zastąpiona potwierdzoną regułą biznesową.

SFLT-21 i SFLT-22 sprawdzają obecnie przycisk czyszczenia, a nie ponowne klikanie zaznaczonych opcji. Pozwala to odróżnić obsługę resetu pola od obsługi jawnej pustej listy. Osobny scenariusz ręcznego odznaczenia wszystkich opcji pozostaje do uzupełnienia; nie należy uznawać problemu pustych list API za naprawiony na podstawie samego działania krzyżyka.

## Dane do testów sezonu SI

SFLT-28–SFLT-30 nie tworzą spotkań automatycznie i nie zmieniają daty systemowej. Wymagają kontrolowanych szkół testowych o unikalnej nazwie, aktywnych i widocznych dla konta testowego. Wskazana szkoła musi mieć rzeczywiste SI z promotorem zgodnie z warunkiem danego scenariusza; bieżący sezon musi odpowiadać konfiguracji aplikacji, a nie założeniu o roku kalendarzowym.

Przed startem panelu można ustawić:

```powershell
$env:OCTOPUS_SEARCH_SI_CURRENT = '{"id":"ID_SZKOLY","name":"AUTO_NAZWA_SZKOLY_Z_BIEZACYM_SI"}'
$env:OCTOPUS_SEARCH_SI_PAST_ONLY = '{"id":"ID_SZKOLY","name":"AUTO_NAZWA_SZKOLY_TYLKO_Z_HISTORYCZNYM_SI"}'
$env:OCTOPUS_SEARCH_SI_FUTURE_ONLY = '{"id":"ID_SZKOLY","name":"AUTO_NAZWA_SZKOLY_TYLKO_Z_PRZYSZLYM_SI"}'
```

Zastąp ID i nazwy rzeczywistymi danymi. Bez odpowiedniej zmiennej konkretny test jest pomijany z powodem — to nie jest zaliczenie walidacji sezonu. Przed każdym przebiegiem trzeba upewnić się, że w tych szkołach nie dodano spotkania z innego sezonu i że konfiguracja nadal jest aktualna.

## Uruchamianie i ograniczenia

W panelu wybierz Szkoły, a następnie pojedynczy SFLT. Grep `@school-search` wybiera cały zestaw. Serwer panelu uruchomiony przed zmianą listy pakietów trzeba ponownie uruchomić dopiero po zakończeniu aktywnych testów.

```powershell
npm test -- tests/szkola-wyszukiwanie-filtry.spec.ts --grep "SFLT-17:"
```

Dokładny RSPO ma pierwszeństwo nad pozostałymi filtrami, analogicznie do ID. Użytkownik potwierdził ten wyjątek: numer identyfikuje jedną szkołę, więc niezgodna kategoria nie wyklucza jej z wyniku. SFLT-19 sprawdza ten przypadek, a MED-54 zachowuje pierwszeństwo ID nad Medalem. Zasada AND dotyczy pozostałych kombinacji bez takiego identyfikatora.

Pełne pokrycie pozostaje otwarte: filtrowanie Notatek i ich kombinacje wymaga dostępnego pola; termin „błędy w konfiguracji filtrów” wymaga konkretnych przykładów i oczekiwanego sposobu obsługi. SFLT-25 chroni powrót do poprawnego RSPO, ale nie dowodzi obsługi wszystkich błędów konfiguracji, awarii słowników lub sieci. SFLT-09 i istniejące MED uzupełniają testy nowych szkół, lecz nie dowodzą wyboru wyłącznie bieżącego medalu przy równoległych danych historycznych.

Źródła: [scenariusze](../../tests/szkola-wyszukiwanie-filtry.spec.ts), [przygotowanie i obsługa formularza](../../tests/support/school-search-filters.ts).
