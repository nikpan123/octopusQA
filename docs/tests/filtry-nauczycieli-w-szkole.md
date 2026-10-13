# Filtrowanie nauczycieli w szkole testy krok po kroku

Zestaw TFL-01–TFL-30 sprawdza nagłówki Nauczyciele, Nasi i Obcy na profilu szkoły. Porównuje konkretne ID osób i liczniki, a nie tylko widoczność wierszy. Scenariusze są przygotowane do ręcznego uruchamiania po kolei. Na prośbę użytkownika nie zostały uruchomione ani ocenione na DEV.

## Reguły klasyfikacji

Nauczyciele to liczba unikalnych osób przypisanych do szkoły. Nasi to liczba zielonych pozycji w kolumnie „Przedmioty w tej szkole”, a Obcy to liczba pozycji bez zielonego koloru w tej samej kolumnie. Nie liczymy pozycji w kolumnie „Przedmioty globalne” ani pustych komórek. Czerwony tekst bez zielonego wyróżnienia również należy do niezielonych pozycji.

Jednostką liczenia jest pozycja przedmiotowa danego nauczyciela w tej szkole, nie unikalna nazwa przedmiotu w całej szkole. Matematyka u dwóch nauczycieli daje dwie pozycje. Matematyka jednego nauczyciela potwierdzona w klasach 4, 5 i 6 daje jedną pozycję, a nie trzy. Nauczyciel z dwoma przedmiotami GWO daje Nauczyciele = 1 i Nasi = 2, lecz w przefiltrowanej tabeli ma jeden wiersz.

Filtry pokazują unikalnych nauczycieli mających przynajmniej jedną pozycję odpowiadającą wybranej grupie. Osoba z zielonym i niezielonym przedmiotem może występować raz w każdej grupie. Liczniki pozostają ogólne po zmianie filtra. Nie wolno wymagać ani równości licznika Nasi/Obcy z liczbą wierszy, ani równości sumy tych liczników z liczbą nauczycieli.

Przykład ze zrzutów: Nauczyciele = 22, Nasi = 5, Obcy = 9. Filtr Nasi pokazuje trzy osoby z odpowiednio 1, 1 i 3 zielonymi przedmiotami. Filtr Obcy pokazuje sześć osób z odpowiednio 1, 2, 1, 1, 2 i 2 niezielonymi przedmiotami. Same różnice 5 przedmiotów / 3 osoby i 9 przedmiotów / 6 osób nie są błędem.

Przygotowanie danych opiera się na deklaracjach GWO i NOWA ERA. Szczególne statusy 3, 5, 6, 7 oraz puste wydawnictwo wymagają osobnych danych i sprawdzenia, czy tworzą pozycję w kolumnie szkolnej. Nie wykluczamy istniejącej niezielonej pozycji wyłącznie na podstawie wcześniejszego opisu statusów.

Dla szkoły i przedmiotu znaczenie ma najnowszy nieusunięty wpis. Zgodnie z doprecyzowaniem użytkownika aktualne potwierdzenie GWO ma pierwszeństwo przed późniejszą deklaracją Obcy po GWO dotyczącą przyszłego roku. TFL-26 sprawdza tę regułę. Wszystkie scenariusze domyślnie zapisują potwierdzenia na aktywny rok 2026/2027, potwierdzony przez użytkownika. Zmienna `OCTOPUS_TFL_CURRENT_SCHOOL_YEAR` pozwala zmienić go przy przejściu systemu na kolejny rok. Rok nie jest wybierany jako pierwszy rekord słownika: po pojawieniu się przyszłego roku taka reguła przygotowałaby nieodpowiednie dane.

TFL-26 potrzebuje przyszłego roku 2027/2028, który według użytkownika będzie dostępny około kwietnia. Jeśli nie ma go jeszcze w słowniku, test jest pomijany z jawnym powodem przed utworzeniem szkoły i nauczyciela. To nie jest zaliczenie regresji. Gdy rok pojawi się w słowniku, ten sam test przejdzie do przygotowania obu potwierdzeń i sprawdzenia w UI. Brak aktywnego roku w słowniku nadal jest błędem konfiguracji, nie powodem pominięcia wszystkich testów.

## Przygotowanie danych i sprzątanie

Test tworzy własną szkołę `AUTO_TFL_<ŚRODOWISKO>_<ETYKIETA>_REG_...` i oznacza ją jako Testowy. Nauczyciele mają unikalne nazwiska `REG_... FILTR ...`, adresy w domenie `example.invalid` i flagę nauczyciela testowego. Przypisania tworzy istniejąca fabryka API. Tworzenie i edycja formularzy odbywa się przez `POST /api/TeacherFormClub`, ten sam endpoint, z którego korzysta UI Octopusa. Nie jest to publiczny formularz internetowy dla nauczyciela ani bezpośredni zapis do bazy. Dla Naszych zapisywana jest klasa GWO (`isOur: true`), dla Obcych klasa (`isOur: false`) z wydawnictwem NOWA ERA. Każdy zapis ma `sendEmail: false`.

Klasy, zakresy i identyfikator wydawnictwa są pobierane ze słowników API, nie wpisywane na sztywno. Dane audytowe pochodzą z sesji oraz zalogowanego użytkownika. Po zapisie pomocnik pobiera formularze nauczyciela i potwierdza ID, szkołę, przedmiot, rok, klasy oraz wydawnictwo. Nowe ID musi pojawić się dokładnie raz. Edycja zachowuje ID. Soft delete korzysta z `POST /api/TeacherFormClub/DelOrGetBackFormClub` i potwierdza `isDel: true` odczytem API. Nie ma automatycznych ponowień POST po błędzie, aby nie tworzyć duplikatów po niepewnym zapisie.

API przygotowuje dane; właściwe oczekiwania dotyczące filtrów, liczników i statusu Obcy po GWO nadal są sprawdzane w przeglądarce. Nie otwiera się formularza klubowego dla każdego nauczyciela. Testy samego formularza w zestawach CLUB pozostają bez zmian.

Najczęściej scenariusz tworzy jedną szkołę. TFL-21 i TFL-30 tworzą dwie. Pełna seria tworzy 32 szkoły, gdy TFL-26 jest wykonywany, albo 31 przy jego sezonowym pominięciu; liczby nie obejmują ponowień. Nie usuwa istniejących danych użytkowników. Szkoły pozostają po testach, ponieważ nie ma potwierdzonego mechanizmu ich bezpiecznego usuwania. Nauczyciele z poprawnie zakończonych scenariuszy są przekazywani do istniejącego sprzątania na końcu przebiegu; przy błędzie pozostają do diagnostyki.

Każdy nauczyciel ma osobny rejestr `runs/REG_....json` z ID, nazwiskiem, e-mailem i identyfikatorem bieżącej partii sprzątania. Plik `runs/tfl-<ID>.json` zbiera szkoły i ID potwierdzeń danego scenariusza. Sprawdzenie osoby i flagi testowej przed usunięciem pozostaje zadaniem istniejącego cleanup. Szkoły nie są współdzielone między testami, więc nieudany scenariusz nie zanieczyszcza następnego.

## Kontrolowany zestaw czterech nauczycieli

Powtarzalne scenariusze interfejsu tworzą:

- jedną osobę z GWO w Matematyce;
- jedną osobę z NOWA ERA w Matematyce;
- jedną osobę z GWO w Matematyce i NOWA ERA w Języku polskim;
- jedną osobę bez wpisów wydawnictwa.

Oczekiwane liczniki to 4 ogółem, 2 Nasi, 2 Obcy. Małe listy mieszczą się w tabeli; porównanie ID zachowuje duplikaty, więc powtórzona osoba powoduje błąd.

## Scenariusze

### TFL-01 Nagłówki są klikalne

1. Przygotowuje szkołę z czterema nauczycielami o znanej klasyfikacji.
2. Sprawdza widoczność i aktywność przycisków Nasi, Obcy i Nauczyciele.
3. Klika każdy przycisk i wymaga dokładnego zestawu ID nauczycieli odpowiedniej grupy.

### TFL-02 Domyślna pełna lista

1. Przygotowuje czterech nauczycieli i otwiera szkołę.
2. Bez wybierania filtra wymaga wszystkich czterech ID, w tym nauczyciela bez deklaracji.

### TFL-03 Lista Nasi

1. Przygotowuje czterech nauczycieli.
2. Klika Nasi.
3. Wymaga dwóch konkretnych ID: nauczyciela GWO i nauczyciela z GWO w jednym z dwóch przedmiotów.

### TFL-04 Lista Obcy

1. Przygotowuje czterech nauczycieli.
2. Klika Obcy.
3. Wymaga dwóch konkretnych ID: nauczyciela NOWA ERA i nauczyciela z NOWA ERA w jednym z dwóch przedmiotów.

### TFL-05 Powrót do wszystkich nauczycieli

1. Przygotowuje czterech nauczycieli.
2. Wybiera Nasi i sprawdza dwie właściwe osoby, następnie Nauczyciele i wszystkie cztery osoby.
3. Powtarza przejście z Obcych do pełnej listy.

### TFL-06 Stałe liczniki

1. Przygotowuje czterech nauczycieli.
2. Przełącza Nasi, Obcy i Nauczyciele, sprawdzając ID na każdej liście.
3. Przy każdym filtrze wymaga nadal liczników 4 ogółem, 2 Nasi i 2 Obcy.

### TFL-07 Brak deklaracji

1. Tworzy jednego nauczyciela z przedmiotem, ale bez formularza i wpisów wydawnictwa.
2. Wymaga liczników 1, 0, 0 i obecności na pełnej liście.
3. Wymaga pustych list Nasi i Obcy, a po powrocie jednej osoby.

### TFL-08 Jedna osoba w dwóch grupach

1. Tworzy jednego nauczyciela Matematyki i Języka polskiego.
2. Zapisuje GWO dla Matematyki i NOWA ERA dla Języka polskiego.
3. Wymaga liczników 1 nauczyciel, 1 zielony przedmiot i 1 niezielony przedmiot.
4. W każdym z trzech filtrów wymaga tego samego ID dokładnie raz.

### TFL-09 Kilka przedmiotów GWO bez duplikatów

1. Tworzy jednego nauczyciela z dwoma przedmiotami.
2. Zapisuje klasy 4, 5, 6 jako Nasze w Matematyce i klasę 4 jako Naszą w Języku polskim.
3. Wymaga liczników 1 nauczyciel, 2 zielone przedmioty i 0 niezielonych. Trzy klasy Matematyki nie zwiększają licznika do czterech.
4. Wybiera Nasi i wymaga jednego ID, bez duplikatu osoby; ponownie sprawdza liczniki 1, 2, 0.
5. Wraca do Nauczycieli i wymaga tego samego pojedynczego ID.

### TFL-10 Kilka obcych przedmiotów bez duplikatów

1. Tworzy jednego nauczyciela z dwoma przedmiotami.
2. Zapisuje NOWA ERA dla klas 4, 5, 6 Matematyki i klasy 4 Języka polskiego.
3. Wymaga liczników 1 nauczyciel, 0 zielonych przedmiotów i 2 niezielone. Trzy klasy Matematyki nie zwiększają licznika do czterech.
4. Wybiera Obcy i wymaga jednej osoby, bez duplikatu; ponownie sprawdza liczniki 1, 0, 2.
5. Wraca do Nauczycieli i wymaga tego samego pojedynczego ID.

### TFL-11 Regresja licznika Obcy

1. Tworzy sześciu nauczycieli z NOWA ERA: pierwszych trzech ma Matematykę i Język polski, pozostałych trzech tylko Matematykę.
2. Wymaga liczników 6 nauczycieli, 0 zielonych przedmiotów i 9 niezielonych (3 × 2 + 3 × 1). Powtarzające się przedmioty różnych osób są liczone osobno.
3. Klika Obcy i porównuje listę z sześcioma utworzonymi ID. Nie oczekuje dziewięciu nauczycieli.
4. Ponownie sprawdza liczniki 6, 0, 9, potem pustą listę Nasi przy tych samych licznikach.
5. Wraca do Nauczycieli i wymaga sześciu ID, każde dokładnie raz.

### TFL-12 Szkoła bez nauczycieli

1. Tworzy szkołę bez nauczycieli i czeka na odpowiedź pobrania listy.
2. Przełącza trzy filtry.
3. W każdym wymaga pustej listy i liczników 0, 0, 0.

### TFL-13 Pusta grupa Obcy

1. Tworzy jednego nauczyciela GWO.
2. Klika Obcy i wymaga pustej listy przy licznikach 1, 1, 0.
3. Powraca do pełnej listy i wymaga jednego ID.

### TFL-14 Pusta grupa Nasi

1. Tworzy jednego nauczyciela NOWA ERA.
2. Klika Nasi i wymaga pustej listy przy licznikach 1, 0, 1.
3. Powraca do pełnej listy i wymaga jednego ID.

### TFL-15 Filtrowanie bez przeładowania

1. Przygotowuje czterech nauczycieli i zapisuje URL profilu.
2. Dodaje techniczny znacznik do dokumentu przeglądarki i zaczyna obserwować nawigacje głównego okna.
3. Przełącza trzy filtry, każdorazowo sprawdzając właściwe ID, ten sam URL i zachowany znacznik.
4. Wymaga zera nawigacji głównej ramki, a w końcu odłącza obserwator.

### TFL-16 Wyróżnienie filtra Nasi

1. Przygotowuje czterech nauczycieli i uaktywnia inny filtr niż Nasi.
2. Zapisuje nieaktywny wygląd przycisku Nasi: tło, obramowanie, cień, grubość i dekorację tekstu.
3. Uaktywnia Nasi i sprawdza właściwe ID nauczycieli.
4. Odsuwa mysz i przenosi fokus klawiszem Tab, aby hover ani fokus nie udawały aktywnego filtra.
5. Wymaga zmiany przynajmniej jednej z obserwowanych cech wyglądu. To kontrola stylu, nie porównanie pikselowe z makietą.

### TFL-17 Wyróżnienie filtra Obcy

1. Przygotowuje czterech nauczycieli i uaktywnia inny filtr niż Obcy.
2. Zapisuje nieaktywny wygląd przycisku Obcy: tło, obramowanie, cień, grubość i dekorację tekstu.
3. Uaktywnia Obcy i sprawdza właściwe ID nauczycieli.
4. Odsuwa mysz i przenosi fokus klawiszem Tab, aby hover ani fokus nie udawały aktywnego filtra.
5. Wymaga zmiany przynajmniej jednej z obserwowanych cech wyglądu. To kontrola stylu, nie porównanie pikselowe z makietą.

### TFL-18 Wyróżnienie filtra Nauczyciele

1. Przygotowuje czterech nauczycieli i uaktywnia inny filtr niż Nauczyciele.
2. Zapisuje nieaktywny wygląd przycisku Nauczyciele: tło, obramowanie, cień, grubość i dekorację tekstu.
3. Uaktywnia Nauczyciele i sprawdza właściwe ID nauczycieli.
4. Odsuwa mysz i przenosi fokus klawiszem Tab, aby hover ani fokus nie udawały aktywnego filtra.
5. Wymaga zmiany przynajmniej jednej z obserwowanych cech wyglądu. To kontrola stylu, nie porównanie pikselowe z makietą.

### TFL-19 Dane szkoły pozostają bez zmian

1. Zapamiętuje nazwę, adres i poziom szkoły.
2. Po wybraniu Nasi oraz Obcy wymaga identycznych wartości tych pól.
3. Przy każdym filtrze otwiera Edycję danych i zamyka ją przez Anuluj.
4. Potwierdza, że odwołanie edycji nie zmieniło przefiltrowanej listy.

### TFL-20 Dostęp do pozostałych zakładek

1. Wybiera Obcy w szkole z czterema nauczycielami.
2. Otwiera Zamówienia, Kontakty, Mailingi, Historię zmian i Strukturę; wymaga widoczności każdej zakładki.
3. Wraca do Nauczycieli i przyciskiem Nauczyciele potwierdza pełną listę.
4. Nie zakłada, że filtr musi być zachowany po przejściu między zakładkami.

### TFL-21 Klasyfikacja osobno dla każdej szkoły

1. Tworzy szkoły A i B oraz jednego nauczyciela przypisanego do obu.
2. Zapisuje GWO w szkole A i NOWA ERA w szkole B, dla Matematyki.
3. W A wymaga liczników 1, 1, 0 oraz osoby tylko w Naszych.
4. W B wymaga liczników 1, 0, 1 oraz osoby tylko w Obcych.

### TFL-22 Zmiana GWO na NOWA ERA

1. Tworzy nauczyciela GWO i potwierdza liczniki 1, 1, 0.
2. Przez API edytuje ten sam formularz: zapisuje klasę 4 jako Obcą z NOWA ERA. Potwierdza zachowane ID i nowe dane odczytem API.
3. Ponownie otwiera szkołę i wymaga liczników 1, 0, 1, obecności w Obcych oraz pustej grupy Nasi.
4. Nie traktuje historycznej wersji GWO jako drugiego, aktywnego przypisania.

### TFL-23 Zmiana NOWA ERA na GWO

1. Tworzy nauczyciela NOWA ERA i potwierdza liczniki 1, 0, 1.
2. Przez API edytuje ten sam formularz: zapisuje klasę 4 jako Naszą i usuwa obce wydawnictwo z formularza. Potwierdza zachowane ID i nowe dane odczytem API.
3. Ponownie otwiera szkołę i wymaga liczników 1, 1, 0, obecności w Naszych i pustej grupy Obcy.

### TFL-24 Usunięcie potwierdzenia GWO

1. Tworzy nauczyciela GWO i sprawdza jego obecność w Naszych.
2. Przez API oznacza własne potwierdzenie jako usunięte i potwierdza `isDel: true` ponownym odczytem formularza.
3. W szkole wymaga liczników 1, 0, 0 i pustych grup Nasi oraz Obcy.
4. Nauczyciel pozostaje na pełnej liście.

### TFL-25 Usunięcie obcego potwierdzenia

1. Tworzy nauczyciela NOWA ERA i sprawdza jego obecność w Obcych.
2. Przez API oznacza własne potwierdzenie jako usunięte i potwierdza `isDel: true` ponownym odczytem formularza.
3. W szkole wymaga liczników 1, 0, 0 i pustych grup Nasi oraz Obcy.
4. Nauczyciel pozostaje na pełnej liście.

### TFL-26 Aktualne GWO przed przyszłym Obcy po GWO

1. Przed tworzeniem danych sprawdza aktywny rok 2026/2027 oraz przyszły 2027/2028 w słowniku. Aktywny rok może wskazywać `OCTOPUS_TFL_CURRENT_SCHOOL_YEAR`. Przy braku przyszłego roku zgłasza pominięcie z wyraźnym powodem i nie tworzy danych.
2. Tworzy nauczyciela i przez API zapisuje GWO na wybrany rok, a następnie późniejsze potwierdzenie NOWA ERA na kolejny rok szkolny. Potwierdza oba zapisy odczytem API.
3. Wymaga na profilu nauczyciela statusu Obcy po GWO, aby potwierdzić przygotowanie szczególnego przypadku.
4. Otwiera szkołę i wymaga liczników 1, 1, 0.
5. Nauczyciel musi być w Naszych oraz na pełnej liście, ale nie w Obcych.

### TFL-27 Powtarzane kliknięcia

1. Przygotowuje czterech nauczycieli.
2. Każdy z trzech filtrów klika trzykrotnie i po każdym kliknięciu sprawdza dokładną listę.
3. Wymaga niezmienionych liczników 4, 2, 2.

### TFL-28 Obsługa klawiaturą

1. Przygotowuje czterech nauczycieli.
2. Ustawia fokus kolejno na Nasi, Obcy i Nauczyciele, a następnie naciska Enter.
3. Po każdym aktywowaniu wymaga właściwego zestawu ID.

### TFL-29 Filtrowanie nie zmienia zapisanych danych

1. Przygotowuje czterech nauczycieli i wybiera Obcy.
2. Ponownie otwiera profil szkoły.
3. Wybiera Nauczyciele i wymaga wszystkich czterech ID oraz liczników 4, 2, 2.
4. Nie wymaga zapamiętania filtra po ponownym otwarciu profilu.

### TFL-30 Nauczyciel spoza szkoły

1. Tworzy szkoły A i B.
2. Do B dodaje nauczyciela GWO; nie przypisuje go do A.
3. Otwiera A i wymaga liczników 0, 0, 0 oraz pustej listy w każdym filtrze.

## Uruchamianie po kolei

W panelu wybierz pakiet Szkoły i pojedynczy test TFL. Pole grep `@teacher-filter` wybiera cały zestaw, a np. `TFL-26:` tylko regresję dotyczącą przyszłego roku. Po dodaniu pliku działający serwer panelu wymaga ponownego uruchomienia, ale wyłącznie po zakończeniu aktywnych testów. Nie usuwaj blokady działającego przebiegu.

Z terminala można uruchomić pojedynczy scenariusz:

```powershell
npm test -- --config=playwright.config.ts tests/szkola-nauczyciele-filtry.spec.ts --grep "TFL-26:"
```

Każdy scenariusz ma limit 10 minut na przygotowanie i sprawdzenie. Limity oczekiwania pojedynczych asercji pozostają zgodne z konfiguracją projektu.

Przy zmianie aktywnego roku zmienną można ustawić w PowerShell przed uruchomieniem testów lub serwera panelu. Wartość musi odpowiadać aktywnemu rokowi systemu, nie najnowszemu przyszłemu rokowi ze słownika:

```powershell
$env:OCTOPUS_TFL_CURRENT_SCHOOL_YEAR = "2026/2027"
```

## Zakres do uzupełnienia

- Bezpośrednie przypadki statusów 3, 5, 6, 7 oraz wpisu z pustym wydawnictwem wymagają kontrolowanego sposobu zapisania takich danych. Formularz klubowy nie pozwala zapisać Obcego bez wydawnictwa; nie obchodzimy tej walidacji przez zgadywanie API.
- Liczniki są porównywane z liczbą pozycji wynikającą z przygotowanych deklaracji, a wiersze z konkretnymi ID osób. Zestaw nie zawiera jeszcze bezpośredniej kontroli koloru każdej pozycji ani tego, czy przy mieszanym nauczycielu filtr ukrywa przeciwne przedmioty w jego komórce.
- TFL-22 i TFL-23 sprawdzają zmianę aktualnej deklaracji, a TFL-24 i TFL-25 pominięcie jedynego usuniętego potwierdzenia. Nie dowodzą wyboru starszego wpisu spośród kilku niezależnych rekordów historii, gdy najnowszy został usunięty.
- Nie ma jeszcze scenariuszy równych dat wpisów, dużych list z wirtualizacją lub paginacją oraz szybkich kliknięć podczas trwających odpowiedzi.
- TFL-20 sprawdza dostępność innych zakładek, nie wszystkie operacje biznesowe w ich wnętrzu.
- Scenariusze działają dla obecnego użytkownika z pełnymi uprawnieniami. Obecność kodu nie jest dowodem poprawności aplikacji; wynik będzie znany dopiero po uruchomieniu.

## Pliki źródłowe

- [Scenariusze filtrów](../../tests/szkola-nauczyciele-filtry.spec.ts).
- [Przygotowanie danych i odczyt list](../../tests/support/school-teacher-filters.ts).
- [API formularzy klubowych dla TFL](../../tests/support/club-form-api.ts).
- [Formularze klubowe](../../tests/support/club.ts).
