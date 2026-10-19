# Redmine #37203 — sortowanie po kolumnie Kategoria

Zgłoszenie: https://redmine.gwo.pl/issues/37203. Projekt: Octopus. Obszar: wyszukiwarka szkół, tabela Wyniki wyszukiwania. Na przekazanym zrzucie zgłoszenie jest otwarte, w statusie „Do testów na developie”. To informacja ze zgłoszenia, nie wynik wykonania testów.

## Problem i oczekiwane zachowanie

Kliknięcie nagłówka Kategoria zmienia oznaczenie kierunku, lecz wiersze pozostają w tej samej kolejności. Na zrzutach widoczna jest kolejność D, C, B, A zarówno przy strzałce w górę, jak i w dół.

Po ustawieniu sortowania rosnącego rzeczywista kolejność ma wynosić A, B, C, D, a po ustawieniu malejącego D, C, B, A. ID oraz pozostałe dane muszą pozostać przypisane do właściwych szkół. Sama strzałka lub atrybut `aria-sort` nie jest dowodem poprawności.

## Warunki i dane testowe

- Konto mające dostęp do wyszukiwarki szkół i przygotowania danych testowych.
- Środowisko DEV; TEST tylko przy świadomym wyborze i dostępnych danych.
- Cztery dedykowane szkoły `AUTO_CAT_<ŚRODOWISKO>_SORT_A`–`SORT_D` z istniejącego fixture kategorii.
- Szkoła A: podstawowa, 401 uczniów; B: podstawowa, 101 uczniów; C: podstawowa, 1 uczeń; D: przedszkole, 999 uczniów.
- Wyniki zawężone do wspólnego prefiksu tych czterech szkół. Nie używamy całej bazy, bo tabela wirtualizuje duże wyniki.

Fixture wyszukuje lub tworzy dedykowane szkoły i potwierdza ich kategorię. Nie zmienia danych dowolnych szkół ani nie zakłada stałych ID ze zrzutu zgłoszenia. Jeśli dane są niezgodne lub niejednoznaczne, przygotowanie ma się nie powieść. Szkoły pozostają jako wielokrotnie używany zestaw testowy; nie są usuwane po wykonaniu. Nie uruchamiaj równocześnie innego procesu edytującego te same fixture.

| Szkoła | Oczekiwana kategoria | Pozycja rosnąco | Pozycja malejąco |
| ------ | -------------------- | --------------: | ---------------: |
| SORT_A | A                    |               1 |                4 |
| SORT_B | B                    |               2 |                3 |
| SORT_C | C                    |               3 |                2 |
| SORT_D | D                    |               4 |                1 |

## CAT-23 — kierunek rosnący

1. Przygotuj cztery szkoły i zapamiętaj ich ID oraz kategorie.
2. Otwórz wyszukiwanie szkół, wyczyść wcześniejsze kryteria i wyszukaj prefiks danych sortowania.
3. Ustaw nagłówek Kategoria w stan `ascending` (najwyżej trzy kliknięcia, aby obsłużyć cykl nagłówka).
4. Sprawdź atrybut kierunku i poczekaj na zgodny porządek faktycznych wierszy.
5. Porównaj pełną listę par ID–kategoria z oczekiwanym A, B, C, D. Lista ma zawierać dokładnie cztery właściwe szkoły.
6. Zapisz zrzut ekranu i dane JSON.

Wynik oczekiwany: wszystkie cztery wiersze w porządku rosnącym; właściwe ID przy właściwych literach.

## CAT-24 — kierunek malejący

1. Przygotuj i wyszukaj ten sam wydzielony zestaw.
2. Ustaw `descending` i potwierdź stan nagłówka.
3. Porównaj pełne pary ID–kategoria z kolejnością D, C, B, A.
4. Zapisz zrzut i dane JSON.

Wynik oczekiwany: cztery właściwe szkoły w kolejności malejącej. Ten test samodzielnie nie wystarczy do wykrycia błędu, jeśli nieposortowane dane przypadkiem już były w takiej kolejności — dlatego uruchamiamy także CAT-23 i CAT-25.

## CAT-25 — przełączanie kierunków i integralność rekordów

1. Przygotuj dane i zapamiętaj niezależne oczekiwane powiązania ID z kategorią.
2. Wyszukaj cztery szkoły.
3. Ustaw kolejno: rosnąco → malejąco → rosnąco → malejąco.
4. Po każdym etapie sprawdź zarówno kierunek nagłówka, jak i rzeczywistą kolejność wszystkich par ID–kategoria.
5. Zapisz osobny zrzut i JSON po każdym etapie, również gdy kontrola zakończy się błędem.

Wynik oczekiwany: kolejność czterech szkół zmienia się zgodnie z kierunkiem; żaden rekord nie znika, nie dubluje się i nie otrzymuje kategorii innej szkoły. Niezmienna kolejność przy zmieniającej się strzałce daje FAIL.

## Automaty i dowody

Wykorzystano istniejące scenariusze `CAT-23`, `CAT-24`, `CAT-25` w `tests/szkola-kategoria.spec.ts`, uzupełnione o tag `@redmine-37203`, adnotację Redmine oraz dowody. CAT-25 rozszerzono o rzeczywistą kolejność w czterech etapach. Łączna liczba scenariuszy w projekcie pozostaje bez zmian.

Wiersze są odczytywane według `row-index` AG Grid, a nie przypadkowej kolejności DOM. Faktyczne dane nie są sortowane po kategorii w kodzie odczytu. Oczekiwania wynikają z definicji danych A–D.

Do każdego etapu raport Playwright dołącza:

- zrzut ekranu także dla zaliczonego sprawdzenia;
- JSON z numerem zgłoszenia, poprzednim i oczekiwanym kierunkiem, obserwowanym `aria-sort`, liczbą kliknięć oraz wierszami przed i po;
- oczekiwane pary ID–kategoria i aktualne indeksy wierszy.

Jeżeli test zatrzyma się już na przygotowaniu, nie ma jeszcze dowodu wykonania sortowania; raport błędu przygotowania nie potwierdza odtworzenia #37203. Dowody z ukończonych etapów i nieudanej asercji pozostają w raporcie. Test nie jest oznaczony `test.fail()` — niezgodne sortowanie ma dać rzeczywisty FAIL.

## Uruchomienie i przypięcie wyniku

W panelu Octopusa wybierz DEV i filtr `@redmine-37203`. Wyczyść wcześniejsze zaznaczenia, bo zaznaczone testy mają pierwszeństwo przed filtrem. Alternatywnie zaznacz tylko CAT-23, CAT-24, CAT-25. Dla tego zestawu wystarczy jeden worker. Uruchom testy, poczekaj na koniec i sprawdź szczegóły oraz załączniki.

W Centrum otwórz kartę #37203, odśwież historię i wybierz „Przypnij raport wykonania”. Podaj rzeczywistą wersję aplikacji lub „DEV — stan na [data], numer wdrożenia nieznany”. W opisie wskaż wykonane ID i wynik. Nie przypinaj starszego raportu CAT-23–25 jako wykonania aktualnej wersji testów bez weryfikacji daty i zakresu.

Przykład notatki po faktycznym zaliczeniu: „Wykonano CAT-23, CAT-24 i CAT-25. Potwierdzono A→D i D→A oraz cztery kolejne kierunki z zachowaniem ID i kategorii. Dowody: zrzuty i JSON w raporcie”. Przy FAIL opisz kierunek, oczekiwaną i rzeczywistą kolejność.

## Granice i aktualny stan

Nie obejmuje kolejności rekordów mających tę samą kategorię, pustych kategorii, sortowania wielu kolumn, stronicowania dużej listy ani utrzymywania sortowania po ponownym otwarciu aplikacji. Zgłoszenie nie określa kolejności po wyłączeniu sortowania, więc nie zakładamy konkretnego porządku w tym stanie.

Testy zostały zmodyfikowane i opisane. Nie wykonano aktualnej wersji na DEV/TEST. Zrzuty zgłoszenia dokumentują objaw, a nie przejście nowych kontroli.
