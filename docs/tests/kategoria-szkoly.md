# Kategoria szkoły testy i instrukcja krok po kroku

Kategoria pokazuje wielkość szkoły w danych podstawowych i wynikach wyszukiwania. Zestaw obejmuje 53 scenariusze: CAT-01–CAT-34 sprawdzają progi liczby uczniów, inne placówki, pozycję kolumny, sortowanie oraz przeliczenie po edycji, a CAT-35–CAT-53 kategorię nadawaną podczas tworzenia nowej szkoły przez formularz. Kod jest w [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts) i [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts).

## Reguły kategorii

| Placówka i liczba uczniów                      | Oczekiwana kategoria                               |
| ---------------------------------------------- | -------------------------------------------------- |
| Szkoła bez danych lub z liczbą 0               | A                                                  |
| Szkoła z 1–100 uczniami                        | C                                                  |
| Szkoła ze 101–400 uczniami                     | B                                                  |
| Szkoła z co najmniej 401 uczniami              | A                                                  |
| Przedszkole, placówka doskonalenia nauczycieli | D niezależnie od liczby uczniów                    |
| Szkoła NPC                                     | Jak szkoła podstawowa: A/B/C według liczby uczniów |

D dotyczy przedszkola i placówki doskonalenia nauczycieli. Doprecyzowanie użytkownika z 13.10.2026 zastępuje wcześniejsze oczekiwanie D dla NPC: szkoła NPC jest klasyfikowana jak szkoła podstawowa. Na profilu ma poziom „Szkoła Podstawowa”, a w oknie „Edycja danych” typ „Szkoła NPC” — pola te są tylko do odczytu.

Zgodnie z doprecyzowaniem użytkownika Kategoria w tabeli ma być bezpośrednio po kolumnie Poziom, a na profilu poniżej pola Poziom szkoły. To dwa osobne widoki i dwa osobne sprawdzenia. Sortowanie jest alfabetyczne: A, B, C, D albo D, C, B, A. Opcjonalnego filtrowania nie traktujemy jako obowiązkowego kryterium akceptacji. Medal nie jest przedmiotem tych testów; ma [osobny zestaw](medalowosc-szkoly.md).

## Stan weryfikacji

Scenariusze są zaimplementowane, bez `skip`, `fixme` i oznaczeń oczekiwanej porażki. Zestaw zawiera 53 testy: CAT-01–CAT-34 dla istniejących szkół i CAT-35–CAT-53 dla tworzenia przez formularz. W pełnym przebiegu DEV z 13.10.2026 przeszły 44 testy, a 9 nie przeszło. Po kontrolnej powtórce 47 scenariuszy miało potwierdzone przejście, w tym sortowanie i edycja SIO. Pozostałe 6 testów NPC miało nieaktualne oczekiwanie D; po dostosowaniu do doprecyzowanej reguły A/C/A dla 0/1/401 uczniów wszystkie 6 przeszło na DEV, również z odczytem typu NPC w oknie edycji. Łącznie 53 scenariusze mają potwierdzone przejście w tych przebiegach, ale nie wykonano jeszcze pełnego zestawu w jednym przebiegu po korekcie NPC. Kontrole typów i stylu nie zastępują wykonania tych testów w aplikacji.

Raporty przebiegów: pełny `86e9ce48-da39-40dc-a1e9-f07447d97ba4`, kontrolna powtórka `c15a2fa4-b919-4b34-a0f8-e3f0c1bd66c3`, poprawione NPC `1caac74a-1f36-43c5-94fc-a921ce6fc9c0`. Raporty wydajności i błędów są zapisywane w `runs`.

Pierwotny zapis wymagania „po Patron” został zastąpiony potwierdzoną przez użytkownika kolejnością „po Poziom”. Makieta pod wskazanym linkiem Figma nie została odczytana, więc test nie jest porównaniem wizualnym z projektem graficznym.

## Przygotowanie danych i bezpieczeństwo

### Co oznaczają pojęcia w opisach

- **UI** to widok aplikacji w przeglądarce: pola, tabela i przyciski.
- **API** to interfejs serwera, przez który aplikacja pobiera lub zapisuje dane.
- **ID** to identyfikator szkoły; wyszukiwanie po nim odróżnia placówki o podobnych nazwach.
- **Sprawdza lub wymaga** oznacza warunek `expect(...)`. Niespełniony warunek przerywa zwykłe dalsze kroki testu.
- **Fixture** to przygotowane dane testowe, tutaj jasno nazwane szkoły, używane wielokrotnie.
- **Cache** to lokalny zapis ID tych szkół. Nie przechowuje oczekiwanego wyniku aplikacji zamiast sprawdzania jej stanu.
- **`finally`** to część odpowiedzialna za przywrócenie danych, uruchamiana również po porażce.
- **`aria-colindex` i `aria-sort`** opisują numer kolumny oraz kierunek sortowania tabeli. Test odczytuje rzeczywisty stan kontrolki.

Nie trzeba ręcznie tworzyć tych szkół przed uruchomieniem testu. Pomocnicza funkcja przygotowuje je automatycznie i weryfikuje, że otworzyła właściwy rekord.

Testy używają własnych placówek `AUTO_CAT_<ŚRODOWISKO>_*`, niezależnych od danych Struktury i szkół tworzonych w pozostałych testach. Szkoły przygotowujemy raz przez API, oznaczamy Testowy i zachowujemy do kolejnych uruchomień. Ich ID zapisuje lokalny cache `playwright/.auth/<środowisko>/category-schools.json`, ignorowany przez Git.

Przed użyciem szkoły helper potwierdza jej nazwę i widoczną liczbę uczniów. Nie ustawia kategorii ręcznie — oczekiwane litery są zapisane niezależnie w danych scenariuszy, a ich wyliczenie wykonuje aplikacja.

Scenariusze edycji mają osobne szkoły EDYCJA i EDYCJA_D. W `finally` przywracają początkową liczbę uczniów także po porażce. Nie tworzą relacji, nauczycieli ani zamówień. Szkoły nie są usuwane, bo ich wielokrotne tworzenie nie jest przedmiotem tej funkcjonalności.

## Wspólne sprawdzenie wartości kategorii

Każdy test CAT-04–CAT-22 wykonuje poniższy przebieg dla swoich danych:

1. Odnajduje lub tworzy dokładnie nazwaną placówkę wskazanego typu i liczby uczniów; otwiera profil, sprawdza nazwę i liczbę.
2. Sprawdza oczekiwaną literę w polu Kategoria na profilu.
3. Wyszukuje tę szkołę po dokładnym ID i czeka na rzeczywistą odpowiedź API wyszukiwania.
4. Sprawdza jeden wiersz z jej ID i nazwą oraz oczekiwaną literę w komórce kolumny Kategoria, nie tylko dowolny tekst w wierszu.
5. Ponownie otwiera profil i jeszcze raz sprawdza kategorię, aby nie opierać wyniku tylko na poprzednim widoku.

Wyszukiwanie czyści tekstowe kryteria poprzedniej operacji. Testy korzystają z rzeczywistych odczytów i zapisów aplikacji, bez podstawiania kategorii przez symulowaną odpowiedź.

## Kolumna i dane podstawowe

### CAT-01 Widoczność kolumny Kategoria

1. Przygotowuje szkołę podstawową ze 100 uczniami.
2. Wyszukuje ją po ID.
3. Sprawdza dokładnie jeden nagłówek Kategoria oraz jego widoczność i identyfikator kolumny tabeli.

Zakres: obecność kolumny, nie jej prawidłowe umiejscowienie ani sortowanie.

### CAT-02 Pozycja bezpośrednio po Poziom

1. Wyszukuje dedykowaną szkołę podstawową ze 100 uczniami.
2. Wymaga nagłówków Poziom i Kategoria.
3. Odczytuje ich `aria-colindex`, czyli numery kolumn w tabeli.
4. Wymaga dodatniego numeru Poziomu i numeru Kategorii większego dokładnie o jeden.

Zakres: kolejność kolumn według ich indeksów, bez porównywania pikseli z makietą.

### CAT-03 Pole kategorii pod poziomem szkoły i tylko do odczytu

1. Otwiera profil szkoły podstawowej ze 100 uczniami.
2. Sprawdza widoczne pole Kategoria.
3. Wymaga nieaktywnego pola i wartości C.
4. Sprawdza widoczne pole Poziom szkoły i pobiera położenie obu pól na ekranie.
5. Wymaga, aby górna krawędź pola Kategoria znajdowała się co najmniej na wysokości dolnej krawędzi pola Poziom szkoły — czyli w wierszu poniżej, bez pionowego nakładania.

Zakres: położenie pola na profilu i brak możliwości ręcznego wpisania kategorii. Nie sprawdza ustalonej liczby pikseli odstępu, wyglądu ikonek ani ręcznie zmodyfikowanego żądania API.

## Progi i typy placówek

Każdy z poniższych scenariuszy wykonuje osobno pięć kroków wspólnego sprawdzenia wartości kategorii.

### CAT-04 Szkoła bez podanej liczby uczniów

1. Odnajduje lub tworzy szkołę podstawową bez podanej liczby uczniów, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_BRAK`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **A**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **A** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **A**.

Przygotowuje szkołę podstawową bez opcji liczby uczniów w danych tworzenia; oczekuje A na profilu, w wynikach i po ponownym otwarciu. Helper dopuszcza pustą wartość albo normalizację do 0 w odczycie. To nie jest bezpośredni dowód przechowania SQL NULL — brak danych i zero mogą być normalizowane przez aplikację.

### CAT-05 Zero uczniów

1. Odnajduje lub tworzy szkołę podstawową z 0 uczniów, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_0`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **A**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **A** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **A**.

Przygotowuje szkołę podstawową z liczbą 0, potwierdza tę liczbę i oczekuje A w obu widokach oraz po ponownym otwarciu. Sprawdza wyjątek od reguły małej szkoły.

### CAT-06 Jeden uczeń

1. Odnajduje lub tworzy szkołę podstawową z 1 uczniem, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_1`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **C**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **C** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **C**.

Przygotowuje szkołę podstawową z liczbą 1 i oczekuje C. Sprawdza dolną granicę kategorii C.

### CAT-07 Sto uczniów

1. Odnajduje lub tworzy szkołę podstawową ze 100 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_100`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **C**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **C** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **C**.

Przygotowuje szkołę podstawową z liczbą 100 i oczekuje C. Sprawdza, że górna granica C jest włączona do przedziału.

### CAT-08 Sto jeden uczniów

1. Odnajduje lub tworzy szkołę podstawową ze 101 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_101`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **B**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **B** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **B**.

Przygotowuje szkołę podstawową z liczbą 101 i oczekuje B. Sprawdza dolną granicę B.

### CAT-09 Czterystu uczniów

1. Odnajduje lub tworzy szkołę podstawową z 400 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_400`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **B**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **B** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **B**.

Przygotowuje szkołę podstawową z liczbą 400 i oczekuje B. Sprawdza, że 400 nie należy jeszcze do A.

### CAT-10 Czterystu jeden uczniów

1. Odnajduje lub tworzy szkołę podstawową z 401 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_401`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **A**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **A** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **A**.

Przygotowuje szkołę podstawową z liczbą 401 i oczekuje A. Sprawdza pierwszą wartość powyżej granicy B.

### CAT-11 Duża liczba uczniów

1. Odnajduje lub tworzy szkołę podstawową z 1200 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_SP_1200`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **A**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **A** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **A**.

Przygotowuje szkołę podstawową z liczbą 1200 i oczekuje A. Sprawdza typową większą wartość, nie maksymalną wartość obsługiwaną przez bazę lub formularz.

### CAT-12 Liceum z kategorią B

1. Odnajduje lub tworzy liceum ze 101 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_LO_101`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **B**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **B** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **B**.

Przygotowuje liceum ze 101 uczniami i oczekuje B. Sprawdza, że klasyfikacja wielkościowa nie dotyczy wyłącznie szkół podstawowych.

### CAT-13 Technikum z kategorią C

1. Odnajduje lub tworzy technikum z 1 uczniem, z nazwą `AUTO_CAT_<ŚRODOWISKO>_TECH_1`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **C**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **C** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **C**.

Przygotowuje technikum z jednym uczniem i oczekuje C. Sprawdza obsługę kolejnego typu klasyfikowanej szkoły.

### CAT-14 Przedszkole z zerem uczniów

1. Odnajduje lub tworzy przedszkole z 0 uczniów, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_0_0`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **D**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **D** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **D**.

Przygotowuje przedszkole z liczbą 0 i oczekuje D, nie domyślnego A dla szkoły.

### CAT-15 Przedszkole z jednym uczniem

1. Odnajduje lub tworzy przedszkole z 1 uczniem, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_0_1`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **D**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **D** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **D**.

Przygotowuje przedszkole z liczbą 1 i oczekuje D, nie C.

### CAT-16 Przedszkole z dużą liczbą uczniów

1. Odnajduje lub tworzy przedszkole z 401 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_0_401`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **D**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **D** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **D**.

Przygotowuje przedszkole z liczbą 401 i oczekuje D, nie A.

### CAT-17 Placówka doskonalenia nauczycieli z zerem uczniów

1. Odnajduje lub tworzy placówkę doskonalenia nauczycieli z 0 uczniów, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_1_0`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **D**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **D** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **D**.

Przygotowuje placówkę doskonalenia nauczycieli z liczbą 0 i oczekuje D.

### CAT-18 Placówka doskonalenia nauczycieli z jednym uczniem

1. Odnajduje lub tworzy placówkę doskonalenia nauczycieli z 1 uczniem, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_1_1`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **D**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **D** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **D**.

Przygotowuje placówkę doskonalenia nauczycieli z liczbą 1 i oczekuje D, mimo że ta liczba dawałaby C w szkole.

### CAT-19 Placówka doskonalenia nauczycieli z dużą liczbą uczniów

1. Odnajduje lub tworzy placówkę doskonalenia nauczycieli z 401 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_1_401`; sprawdza nazwę i liczbę uczniów na profilu.
2. Sprawdza, że pole Kategoria na profilu ma wartość **D**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **D** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **D**.

Przygotowuje placówkę doskonalenia nauczycieli z liczbą 401 i oczekuje D.

### CAT-20 Szkoła NPC z zerem uczniów

1. Odnajduje lub tworzy szkołę NPC z 0 uczniów, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_2_0`; sprawdza nazwę i liczbę uczniów na profilu.
2. Potwierdza poziom „Szkoła Podstawowa” na profilu oraz typ „Szkoła NPC” i poziom „Szkoła Podstawowa” w oknie edycji, które zamyka bez zapisu. Sprawdza, że pole Kategoria na profilu ma wartość **A**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **A** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **A**.

Szkoła NPC podlega progom szkoły podstawowej, więc ten przypadek wymaga A.

### CAT-21 Szkoła NPC z jednym uczniem

1. Odnajduje lub tworzy szkołę NPC z 1 uczniem, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_2_1`; sprawdza nazwę i liczbę uczniów na profilu.
2. Potwierdza poziom „Szkoła Podstawowa” na profilu oraz typ „Szkoła NPC” i poziom „Szkoła Podstawowa” w oknie edycji, które zamyka bez zapisu. Sprawdza, że pole Kategoria na profilu ma wartość **C**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **C** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **C**.

Szkoła NPC podlega progom szkoły podstawowej, więc ten przypadek wymaga C.

### CAT-22 Szkoła NPC z dużą liczbą uczniów

1. Odnajduje lub tworzy szkołę NPC z 401 uczniami, z nazwą `AUTO_CAT_<ŚRODOWISKO>_INNE_2_401`; sprawdza nazwę i liczbę uczniów na profilu.
2. Potwierdza poziom „Szkoła Podstawowa” na profilu oraz typ „Szkoła NPC” i poziom „Szkoła Podstawowa” w oknie edycji, które zamyka bez zapisu. Sprawdza, że pole Kategoria na profilu ma wartość **A**.
3. Otwiera wyszukiwarkę, czyści poprzednie kryteria i wyszukuje tę placówkę po dokładnym ID; czeka na odpowiedź API.
4. Wymaga jednego wiersza z tym ID i zgodną nazwą oraz wartości **A** w jego komórce Kategoria.
5. Ponownie otwiera profil po ID i jeszcze raz sprawdza kategorię **A**.

Szkoła NPC podlega progom szkoły podstawowej, więc ten przypadek wymaga A.

## Sortowanie

Scenariusze CAT-23–CAT-25 są powiązane z [Redmine #37203](redmine-37203.md). Bieżąca wersja dodaje adnotację, tag `@redmine-37203`, zrzuty i JSON z kolejnością wierszy. Wersja po tej zmianie nie została uruchomiona na DEV/TEST; wcześniejsze wyniki nie potwierdzają wykonania nowych kontroli.

Do sortowania służą dokładnie cztery oddzielne szkoły SORT_A, SORT_B, SORT_C i SORT_D. Wyszukiwanie ich wspólnego prefiksu nie obejmuje pozostałych danych kategorii. Cztery wiersze pozwalają sprawdzić kompletny zestaw bez uznawania częściowo wyrenderowanej dużej listy za wszystkie wyniki.

Wiersze są odczytywane według `row-index`, nie przypadkowej kolejności elementów w DOM. Test wymaga też zgodnych ID, aby sortowanie samych tekstów lub brak któregoś wyniku nie dały fałszywego sukcesu.

### CAT-23 Sortowanie rosnące

1. Przygotowuje cztery szkoły z kategoriami A, B, C i D.
2. Wyszukuje tylko ich wspólny prefiks.
3. Klika nagłówek Kategoria do uzyskania stanu `ascending`, najwyżej przez trzy próby.
4. Wymaga `aria-sort=ascending` oraz kolejności liter A, B, C, D w wierszach.
5. Porównuje wszystkie ID wyników z ID czterech przygotowanych szkół.

### CAT-24 Sortowanie malejące

1. Przygotowuje te same cztery szkoły i wyszukuje ich prefiks.
2. Klika nagłówek do uzyskania `descending`.
3. Wymaga `aria-sort=descending` i kolejności D, C, B, A.
4. Porównuje cały zestaw ID, nie tylko kolejność liter.

### CAT-25 Sortowanie zachowuje dane

1. Przygotowuje cztery szkoły i niezależną listę par ID oraz oczekiwana kategoria.
2. Wyszukuje ich wspólny prefiks.
3. Ustawia kolejno rosnąco, malejąco, rosnąco, malejąco; potwierdza stan nagłówka.
4. Po każdym ustawieniu porównuje pełną kolejność par ID i kategoria z niezależnym oczekiwaniem i zapisuje zrzut oraz JSON. Ta sama kontrola wykrywa zmianę przypisania kategorii, brak lub duplikat szkoły.

Zakres: te same szkoły i litery po zmianie sortowania. Ten scenariusz nie sprawdza trzeciego stanu bez sortowania ani sortowania wielu kolumn jednocześnie.

## Zmiana liczby uczniów

CAT-26–CAT-32 korzystają z oddzielnej szkoły EDYCJA. Każdy scenariusz:

Przygotowanie przed testem odtwarza przez Akcja SIO bazową liczbę 100 (dla EDYCJA_D: 401), jeśli poprzedni przebieg pozostawił inną wartość. Dotyczy to wyłącznie tych dwóch szkół edycyjnych. Sprzątanie działa w `finally` fixture Playwright z oddzielnym limitem 120 sekund, a po zapisie ponownie otwiera profil i potwierdza przywróconą liczbę. Nie jest gwarantowane przy wymuszonym zakończeniu procesu; dlatego następny test również weryfikuje i przygotowuje stan początkowy.

1. Przygotowuje szkołę podstawową ze 100 uczniami i zapamiętuje początkową wartość.
2. Przez Akcja SIO zapisuje wartość początkową danego scenariusza.
3. Przez Akcja SIO zapisuje nową wartość, czeka na poprawną odpowiedź zapisu i zamknięcie dialogu. Bez przeładowania profilu potwierdza nową liczbę i automatycznie zaktualizowaną kategorię. Dopiero potem sprawdza wyniki wyszukiwania i ponownie otwarty profil, aby potwierdzić trwałość zmiany.
4. Sprawdza nową kategorię na profilu i w komórce wyników wyszukiwania po dokładnym ID.
5. W `finally` przywraca zapamiętaną liczbę i potwierdza ją po ponownym odczycie, również jeśli sprawdzenie kategorii nie przeszło.

Sprawdzenie dotyczy stanu po zapisie i ponownym pobraniu danych. Nie jest testem czasu przeliczenia w milisekundach ani zmian wywołanych zewnętrznym jobem.

### CAT-26 Przejście ze 100 do 101 uczniów

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **100**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, wpisuje **101**, zapisuje i potwierdza nową liczbę w nowym odczycie.
4. Wymaga kategorii **B** na profilu, a następnie wyszukuje szkołę po ID i wymaga **B** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje najpierw 100, następnie 101 i wymaga kategorii B po zmianie. Sprawdza przekroczenie granicy C do B.

### CAT-27 Przejście z 400 do 401 uczniów

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **400**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, wpisuje **401**, zapisuje i potwierdza nową liczbę w nowym odczycie.
4. Wymaga kategorii **A** na profilu, a następnie wyszukuje szkołę po ID i wymaga **A** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje 400, następnie 401 i wymaga A. Sprawdza przekroczenie granicy B do A.

### CAT-28 Przejście ze 101 do 100 uczniów

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **101**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, wpisuje **100**, zapisuje i potwierdza nową liczbę w nowym odczycie.
4. Wymaga kategorii **C** na profilu, a następnie wyszukuje szkołę po ID i wymaga **C** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje 101, następnie 100 i wymaga C. Sprawdza zmianę B do C po zmniejszeniu liczby.

### CAT-29 Zmiana dużej szkoły na zero uczniów

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **401**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, wpisuje **0**, zapisuje i potwierdza nową liczbę w nowym odczycie.
4. Wymaga kategorii **A** na profilu, a następnie wyszukuje szkołę po ID i wymaga **A** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje 401, następnie 0 i nadal wymaga A, a nie C lub pustej kategorii.

### CAT-30 Wyczyszczenie liczby uczniów

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **100**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, czyści pole liczby uczniów, zapisuje i potwierdza puste pole w nowym odczycie.
4. Wymaga kategorii **A** na profilu, a następnie wyszukuje szkołę po ID i wymaga **A** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje 100, następnie pustą wartość i wymaga A. Sprawdza domyślną kategorię po usunięciu danych przez UI; nie odczytuje SQL NULL bezpośrednio.

### CAT-31 Przejście od zera do jednego ucznia

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **0**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, wpisuje **1**, zapisuje i potwierdza nową liczbę w nowym odczycie.
4. Wymaga kategorii **C** na profilu, a następnie wyszukuje szkołę po ID i wymaga **C** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje 0, następnie 1 i wymaga C. Sprawdza odejście od domyślnego A po podaniu dodatniej liczby.

### CAT-32 Przejście z 401 do 400 uczniów

1. Otwiera szkołę `AUTO_CAT_<ŚRODOWISKO>_EDYCJA` i zapamiętuje początkową liczbę uczniów (dla przygotowanych danych: 100).
2. Otwiera Akcja SIO, wpisuje **401**, zapisuje i potwierdza tę liczbę po ponownym otwarciu profilu.
3. Ponownie otwiera Akcja SIO, wpisuje **400**, zapisuje i potwierdza nową liczbę w nowym odczycie.
4. Wymaga kategorii **B** na profilu, a następnie wyszukuje szkołę po ID i wymaga **B** w jej komórce Kategoria.
5. W `finally` odtwarza zapamiętaną początkową liczbę uczniów i potwierdza jej zapis, także gdy test wcześniej nie przeszedł.

Zapisuje 401, następnie 400 i wymaga B. Sprawdza zmianę A do B przy dolnej granicy dużej szkoły.

### CAT-33 Anulowanie zmiany liczby uczniów

1. Otwiera oddzielną szkołę EDYCJA ze 100 uczniami.
2. W Akcji SIO wpisuje roboczo 101.
3. Klika Anuluj zamiast Zapisz.
4. Ponownie otwiera profil i wymaga nadal liczby 100 oraz kategorii C.
5. Wyszukuje szkołę po ID i sprawdza C w tabeli.

### CAT-34 Inna placówka pozostaje w D po edycji

1. Otwiera oddzielne przedszkole EDYCJA_D z liczbą 401; zapamiętuje tę liczbę.
2. Przez Akcja SIO zapisuje liczbę 1, czeka na poprawną odpowiedź zapisu i potwierdza aktualizację na bieżącym profilu bez jego przeładowania. Po sprawdzeniu wyników wyszukiwania ponownie otwiera profil i potwierdza trwałość liczby 1 oraz kategorii D.
3. Wymaga D na profilu i w wynikach wyszukiwania.
4. W `finally` przywraca początkową liczbę uczniów.

Zakres: edycja liczby nie zmienia kategorii przedszkola. Dla pozostałych dwóch typów D są przypadki danych początkowych, nie oddzielne warianty edycji.

## Uruchamianie i granice pokrycia

Po zwolnieniu DEV zestaw można uruchomić poleceniem:

```powershell
npm test -- tests/szkola-kategoria.spec.ts
```

W panelu plik należy do pakietu Szkoły. Grep `@category` wybiera ten obszar, a lista umożliwia wybór CAT-01–CAT-34. Po aktualizacji serwera panelu wymagane jest jego ponowne uruchomienie, ale nie podczas aktywnego przebiegu.

Zakres nie obejmuje:

- opcjonalnego filtrowania kategorii;
- wszystkich kombinacji liczby dla liceów i techników;
- oddzielnych bibliotek i poradni bez przygotowanych danych odpowiednich typów;
- wewnętrznego modelu DB, innych ról użytkowników ani klasyfikacji zespołu szkół;
- walidacji liczb ujemnych, ułamkowych lub maksymalnej wartości — wymaganie nie definiuje takich reguł;
- porównania graficznego z Figma i wydajności sortowania bardzo dużego zbioru.

Brak tych scenariuszy nie oznacza, że aplikacja zachowuje się w nich poprawnie. Wynik po wykonaniu tego zestawu należy raportować oddzielnie od liczby zaimplementowanych testów.

## Pliki źródłowe

- [Scenariusze kategorii](../../tests/szkola-kategoria.spec.ts).
- [Kategoria przy dodawaniu szkoły](../../tests/szkola-kategoria-dodawanie.spec.ts).
- [Wyszukiwanie, odczyt i edycja](../../tests/support/school-category.ts).
- [Stałe dane i przygotowanie szkół](../../tests/support/school-category-data.ts).

## Kategoria przy tworzeniu nowej szkoły: CAT-35–CAT-53

Te testy zawsze tworzą nową szkołę przez „Dodaj nową szkołę”. Nie korzystają z cache ani API do tworzenia, nie edytują liczby przez Akcja SIO i nie naprawiają kategorii po zapisie. Nazwa `AUTO_CAT_<ŚRODOWISKO>_ADD_<PRZYPADEK>_<UNIKALNE_ID>` i osobny numer adresu odróżniają każde wykonanie. Po zapisie rekord jest oznaczany jako Testowy. ID, nazwa, typ, liczba i oczekiwana kategoria trafiają do danych scenariusza w `runs`, zanim test sprawdzi kategorię.

Szkoły pozostają na DEV: brak potwierdzonego mechanizmu ich bezpiecznego usuwania. Pełny przebieg tworzy 19 szkół (ponowienia tworzą dodatkowe rekordy). Nie tworzy nauczycieli, zamówień ani relacji. Scenariusze zostały wykonane na DEV. Oczekiwania NPC skorygowano na podstawie nowego doprecyzowania użytkownika, nie przez pomijanie testów ani oznaczanie ich jako oczekiwane porażki.

### CAT-35: Szkoła podstawowa, brak danych → A

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. Pozostawia pole „Liczba uczniów” puste i potwierdza, że test nie wpisał zera.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, pustą liczbę uczniów lub jej normalizację do 0 i kategorię **A**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **A** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **A**, potwierdzając trwałość danych.

### CAT-36: Szkoła podstawowa, 0 uczniów → A

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **0**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **0** i kategorię **A**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **A** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **A**, potwierdzając trwałość danych.

### CAT-37: Szkoła podstawowa, 1 uczniów → C

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **1**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **1** i kategorię **C**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **C** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **C**, potwierdzając trwałość danych.

### CAT-38: Szkoła podstawowa, 100 uczniów → C

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **100**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **100** i kategorię **C**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **C** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **C**, potwierdzając trwałość danych.

### CAT-39: Szkoła podstawowa, 101 uczniów → B

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **101**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **101** i kategorię **B**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **B** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **B**, potwierdzając trwałość danych.

### CAT-40: Szkoła podstawowa, 400 uczniów → B

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **400**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **400** i kategorię **B**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **B** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **B**, potwierdzając trwałość danych.

### CAT-41: Szkoła podstawowa, 401 uczniów → A

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **401**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **401** i kategorię **A**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **A** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **A**, potwierdzając trwałość danych.

### CAT-42: Szkoła podstawowa, 1200 uczniów → A

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła podstawowa” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **1200**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **1200** i kategorię **A**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **A** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **A**, potwierdzając trwałość danych.

### CAT-43: Liceum, 101 uczniów → B

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Liceum” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **101**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **101** i kategorię **B**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **B** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **B**, potwierdzając trwałość danych.

### CAT-44: Technikum, 1 uczniów → C

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Technikum” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **1**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **1** i kategorię **C**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **C** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **C**, potwierdzając trwałość danych.

### CAT-45: Przedszkole, 0 uczniów → D

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Przedszkole” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **0**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **0** i kategorię **D**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **D** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **D**, potwierdzając trwałość danych.

### CAT-46: Przedszkole, 1 uczniów → D

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Przedszkole” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **1**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **1** i kategorię **D**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **D** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **D**, potwierdzając trwałość danych.

### CAT-47: Przedszkole, 401 uczniów → D

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Przedszkole” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **401**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **401** i kategorię **D**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **D** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **D**, potwierdzając trwałość danych.

### CAT-48: Placówka doskonalenia nauczycieli, 0 uczniów → D

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Placówka doskonalenia nauczycieli” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **0**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **0** i kategorię **D**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **D** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **D**, potwierdzając trwałość danych.

### CAT-49: Placówka doskonalenia nauczycieli, 1 uczniów → D

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Placówka doskonalenia nauczycieli” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **1**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **1** i kategorię **D**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **D** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **D**, potwierdzając trwałość danych.

### CAT-50: Placówka doskonalenia nauczycieli, 401 uczniów → D

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Placówka doskonalenia nauczycieli” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **401**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **401** i kategorię **D**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **D** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **D**, potwierdzając trwałość danych.

### CAT-51: Szkoła NPC, 0 uczniów → A

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła NPC” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **0**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **0** i kategorię **A**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **A** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **A**, potwierdzając trwałość danych.

### CAT-52: Szkoła NPC, 1 uczniów → C

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła NPC” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **1**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **1** i kategorię **C**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **C** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **C**, potwierdzając trwałość danych.

### CAT-53: Szkoła NPC, 401 uczniów → A

1. Otwiera „Dodaj nową szkołę”, wpisuje unikalną nazwę testową, wybiera typ „Szkoła NPC” i dodaje poprawny, unikalny adres.
2. W polu „Liczba uczniów” wpisuje **401**, opuszcza pole i potwierdza wpisaną wartość.
3. Klika „Zapisz”, czeka na poprawną odpowiedź utworzenia i otwarcie nowego profilu. Wymaga dokładnie jednego żądania zapisu, rejestruje ID szkoły i oznacza ją jako Testowy.
4. Bez ponownego otwierania profilu sprawdza dokładną nazwę, liczbę uczniów **401** i kategorię **A**.
5. Wyszukuje nową szkołę po zapisanym ID i wymaga kategorii **A** w tabeli wyników.
6. Ponownie otwiera profil po ID i sprawdza nazwę, liczbę uczniów oraz kategorię **A**, potwierdzając trwałość danych.
