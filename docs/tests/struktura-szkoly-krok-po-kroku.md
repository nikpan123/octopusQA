# Struktura szkoły — każdy test krok po kroku

Dokument opisuje faktyczne działanie wszystkich 106 scenariuszy `STR-01`–`STR-106`: 87 z [pliku testów profilu](../../tests/szkola-struktura.spec.ts) oraz 19 z [testów dodawania nowej szkoły](../../tests/szkola-struktura-dodawanie.spec.ts). Jest opisem obecnego kodu, a nie rozszerzoną listą życzeń. Stan: 2026-10-13. Nie obejmuje pozostałych obszarów projektu.

Plan wymagań, niezgodności i granice całego obszaru znajdują się w [dokumencie Struktury](struktura-szkoly.md). Przy zmianie testów trzeba aktualizować także niniejszy opis.

## Jak czytać dokument

- **UI** oznacza działania w przeglądarce i sprawdzanie widocznych elementów.
- **Rzeczywiste API** oznacza odczyt lub zapis na wybranym środowisku aplikacji; odpowiedzi nie są zastępowane.
- **Symulacja odpowiedzi** oznacza przechwycenie żądania przeglądarki. Test sam zwraca odpowiedź albo przerywa połączenie; zapis nie dociera do serwera.
- **Sprawdzenie** to warunek zapisany jako `expect(...)`. Jeśli nie jest spełniony, dalsze instrukcje testu zasadniczo nie wykonują się; sprzątanie w `finally` nadal jest uruchamiane.
- **Oczekiwana porażka (`test.fail`)** nie pomija testu. Dotyczy STR-38, STR-49, STR-50, STR-51, STR-53, STR-72, STR-74 i STR-87. Przejście wszystkich sprawdzeń daje wynik „unexpectedly passed”. Samo oznaczenie nie sprawdza, czy porażka nastąpiła dokładnie w oczekiwanej instrukcji, dlatego trzeba czytać szczegóły raportu.
- Tagi `@school`, `@structure`, `@api` itd. służą do wyboru i grupowania testów. Sam tag nie dowodzi, że dana operacja dociera do serwera.

## Wspólne przygotowanie i funkcje pomocnicze

### Dane referencyjne i dane dedykowane

`NO_MEDAL_SCHOOL`, `GOLD_SCHOOL` i `SILVER_SCHOOL` to istniejące szkoły referencyjne z [konfiguracji danych](../../tests/support/school-medal-data.ts), zależnej od środowiska. Testy wyszukiwania oraz symulowanych zapisów korzystają z nich bez tworzenia prawdziwych relacji. Scenariusze pustego stanu zakładają, że szkoła `NO_MEDAL_SCHOOL` nie ma struktury; nie czyszczą jej automatycznie.

Dedykowane szkoły mają nazwy `AUTO_STR_<ŚRODOWISKO>_*`. Skróty używane poniżej:

| Klucz           | Końcówka nazwy      | Rola danych testowych                                |
| --------------- | ------------------- | ---------------------------------------------------- |
| `group`         | `ZESPOL`            | Zespół szkół                                         |
| `group2`        | `ZESPOL_2`          | Drugi zespół                                         |
| `primary`       | `SP`                | Szkoła podstawowa                                    |
| `secondary`     | `LO`                | Liceum                                               |
| `preschool`     | `PRZEDSZKOLE`       | Przedszkole                                          |
| `main`          | `GLOWNA`            | Szkoła podstawowa używana jako główna                |
| `branch`        | `FILIA`             | Szkoła podstawowa używana jako filia lub lokalizacja |
| `nodeC`–`nodeF` | `WEZEL_C`–`WEZEL_F` | Dodatkowe szkoły podstawowe do hierarchii            |
| `inactive`      | `NIEAKTYWNA`        | Dedykowana zawieszona szkoła                         |

Nazwy `main` i `branch` nie narzucają kierunku relacji. W niektórych testach `branch` jest rodzicem `main`.

`ensureStructureTestSchools` najpierw korzysta z zapisanych identyfikatorów i sprawdza nazwę szkoły. Jeśli nie ma zapisu, wyszukuje dokładną nazwę; dopiero gdy szkoły nie ma, tworzy ją przez `app.createSchool` (w obecnej wersji przez API). Oznacza szkołę jako `Testowy` i zapamiętuje identyfikator. Szkoły pozostają do kolejnych uruchomień; nie są tworzone i usuwane przy każdym teście. Dodawanie nowej szkoły jako przedmiot testu w STR-90–STR-96 nadal odbywa się przez rzeczywisty formularz UI.

### Procedura G — `withStructureGraph`

Każdy opis oznaczony „procedura G” obejmuje następujące rzeczywiste działania:

1. Przygotowanie wymienionych dedykowanych szkół oraz sesji obecnego użytkownika.
2. Odczyt każdej szkoły przez API wyszukiwania: dokładnie jeden wynik, zgodne ID i nazwa `AUTO_STR_*`, aktywność oraz dodatni identyfikator przypisanego typu placówki.
3. Ustalenie wewnętrznych `institutionUnitId`. Publiczne ID szkoły i wewnętrzne ID jednostki to różne wartości.
4. Usunięcie wcześniejszych aktywnych relacji tych danych i potwierdzenie pustego grafu przed scenariuszem.
5. Wykonanie kroków konkretnego testu.
6. Sprzątanie relacji po scenariuszu, również po jego porażce: najpierw znanych relacji, z wielobudynkowością w pierwszej kolejności, następnie pozostałych odnalezionych krawędzi. Dla krawędzi odnalezionych w drzewie obie strony muszą należeć do rozwiązanych danych testowych.
7. Potwierdzenie przez API, że aktywne drzewa przygotowanych szkół nie zawierają relacji. Błąd sprzątania wyłącza oczekiwaną porażkę, aby nie ukryć problemu z pozostawionymi danymi.

### Procedura U — prawdziwa relacja tworzona i usuwana przez UI

Testy używające tej procedury przygotowują wskazane szkoły, usuwają ich wcześniejsze powiązanie, wykonują scenariusz i w `finally` ponownie usuwają powiązanie, jeśli istnieje.

Dodawanie: otwarcie profilu i Struktury → Dodaj powiązanie → wyszukanie szkoły po ID → kliknięcie Dodaj w wyniku → wybór typu i hierarchii przez dwuklik komórki → Zapisz → potwierdzenie udanego HTTP i zamknięcia dialogu.

Usuwanie: otwarcie Struktury → śmietnik w wierszu → widoczne okno „Usuwanie struktury” z nazwami obu szkół → Tak → udany HTTP DELETE → zniknięcie dialogu i wiersza. Szkoły nie są usuwane.

### Jak działają odczyty i symulacje

- Otwarcie Struktury czeka na rzeczywisty GET `GetInstitutionRelations`, widoczny panel i wyrenderowane komórki albo komunikat pustego stanu.
- `api.seed(A, B, typ)` tworzy prawdziwą relację A → B, sprawdza udany HTTP oraz `codeResult: 204`, odczytuje ją z drzewa i zapamiętuje ID do sprzątania.
- `api.attempt(A, B, typ)` wysyła POST `AddOrUpdateInstitutionRelations` z obiema wewnętrznymi jednostkami, typem, użytkownikiem i domyślnie pustym ID nowej relacji. Samo wywołanie nie sprawdza sukcesu ani odmowy.
- `api.reject` dopuszcza HTTP 400, 404, 409 lub 422 albo HTTP 200 z takim `codeResult`. Sukces i 500 nie spełniają warunku. Nie sprawdza konkretnego komunikatu ani dokładnej przyczyny odmowy.
- `api.tree` pobiera rzeczywiste drzewo, a `api.edges` zbiera z niego relacje rodzic–dziecko ze wszystkich poziomów. Liczba krawędzi nie jest liczbą szkół. Drzewo może obejmować całą połączoną strukturę, także przy odczycie z profilu dziecka.
- `readStructureRelationId` odczytuje odpowiedź drzewa pobraną przy otwarciu profilu i szuka ID relacji przy wskazanej szkole. Sprawdza brak wielokrotnego wystąpienia; zwraca ID albo `null`.
- `mockStructureSave` przechwytuje POST z przeglądarki i zbiera jego treść. Dla sukcesu zwraca testowe `true`, dla błędu wskazany status i `{status}`. Nie jest to sprawdzenie prawdziwego kontraktu odpowiedzi sukcesu serwera.
- Po zwykłych testach UI przeglądarka kończy izolowany kontekst. Jeśli opis mówi „bez zapisu”, nie ma utrwalonej relacji do usunięcia, nawet gdy dialog nie został jawnie zamknięty.

### Procedura H — sprawdzanie historii

`readStructureHistory` otwiera profil i Historię zmian, czeka na udany GET `SchoolHistory` albo `SchoolComplexHistory` i odczytuje dane odpowiedzi. Wspólne sprawdzenie wpisu obejmuje:

1. Wzrost całkowitej liczby wpisów względem stanu przed operacją.
2. Pole `Struktura` w pierwszym, najnowszym wpisie.
3. Opis zawierający wskazaną akcję i `ID:<publiczne ID powiązanej szkoły>`.
4. `createdBy` równy ID obecnego użytkownika.
5. Niepuste `author` i `reason` oraz datę możliwą do odczytania.
6. Widoczną komórkę z tym opisem w UI Historii zmian.

Nie jest sprawdzane wewnętrzne ID relacji w audycie DB, dokładny moment wykonania operacji ani pełny zestaw starych i nowych wartości.

## STR-01–STR-15 — pusty stan, dialog i wyszukiwanie

### STR-01 — Szkoła bez relacji pokazuje pusty stan

Tryb: UI i rzeczywisty odczyt API; bez zapisu.

1. Otwiera profil `NO_MEDAL_SCHOOL` i zakładkę Struktura.
2. Czeka na pobranie i wyrenderowanie struktury.
3. Sprawdza widoczność dokładnego tekstu „Brak struktury organizacyjnej.”.

Zakres: komunikat dla istniejącej szkoły referencyjnej. Nie tworzy pustej szkoły i nie sprawdza osobno braku wszystkich ikon.

### STR-02 — Przyciski w pustym stanie

Tryb: UI; bez zapisu.

1. Otwiera Strukturę `NO_MEDAL_SCHOOL`.
2. Sprawdza, że Pokaż zaznaczone jest nieaktywne.
3. Sprawdza, że Pokaż wszystkie jest nieaktywne.
4. Sprawdza, że Dodaj powiązanie jest aktywne.

Zakres: obecny użytkownik z pełnymi uprawnieniami; nie sprawdza konta bez uprawnień.

### STR-03 — Elementy dialogu dodawania

Tryb: UI; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` otwiera Dodaj powiązanie.
2. Sprawdza pięć widocznych pól: ID, nazwa, kod pocztowy, miejscowość i ulica.
3. Sprawdza nagłówki pierwszej tabeli: Dodaj, ID, Poziom, Nazwa Szkoły, Adres Szkoły.
4. Sprawdza nagłówki drugiej tabeli: Usuń, ID, Poziom, Nazwa szkoły, Adres Szkoły, Typ relacji, Hierarchia.
5. Sprawdza aktywność Szukaj i Anuluj oraz widoczność Zapisz.

Zakres: obecność kontrolek, nie poprawność ich całej funkcjonalności. Zapisz nie musi tu być aktywne.

### STR-04 — Puste wyszukiwanie

Tryb: UI; bez zapisu.

1. Otwiera pusty dialog dodawania na `NO_MEDAL_SCHOOL`.
2. Klika Szukaj bez wprowadzania kryteriów.
3. Sprawdza widoczne ostrzeżenie „Wyszukiwanie nie może być puste”.
4. Klika OK i sprawdza zamknięcie ostrzeżenia.
5. Sprawdza, że dialog dodawania nadal jest widoczny.

Zakres: walidacja frontendu; nie liczy żądań wyszukiwania ani nie sprawdza osobno pustej tabeli.

### STR-05 — Anulowanie pustego dialogu

Tryb: UI; bez zapisu.

1. Otwiera dialog dodawania na `NO_MEDAL_SCHOOL`.
2. Klika Anuluj.
3. Sprawdza, że dialog zniknął.
4. Sprawdza komunikat pustej struktury na profilu.

### STR-06 — Wyszukiwanie po dokładnym ID

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wpisuje ID `GOLD_SCHOOL` i klika Szukaj.
3. Sprawdza dokładnie jeden wiersz z tym ID oraz zgodną nazwę w tym wierszu.

Zakres: właściwy wiersz; nie wymaga, aby cała tabela zawierała tylko jeden wynik.

### STR-07 — Wyszukiwanie po pełnej nazwie

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wpisuje pełną nazwę `SILVER_SCHOOL` i klika Szukaj.
3. Sprawdza dokładnie jeden wiersz z ID tej szkoły i jej nazwą.

Zakres: obecność właściwej szkoły, nie globalna unikalność nazwy.

### STR-08 — Wyszukiwanie po fragmencie nazwy

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Z nazwy `GOLD_SCHOOL` bierze pierwsze trzy wyrazy.
2. Wpisuje ten fragment w dialogu na `NO_MEDAL_SCHOOL` i klika Szukaj.
3. Czeka na co najmniej jeden wiersz danych oprócz nagłówka.
4. W każdym aktualnie obecnym wierszu danych sprawdza, że komórka nazwy zawiera ten fragment.

Zakres: pasowanie widocznych/wyrenderowanych wyników. Nie sprawdza kompletności wszystkich stron wyników ani obecności konkretnego ID `GOLD_SCHOOL`.

### STR-09 — Wyszukiwanie po kodzie pocztowym

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wpisuje kod `84-300` i klika Szukaj.
3. Sprawdza, że są wiersze danych.
4. Sprawdza, że adres każdego aktualnie wyrenderowanego wyniku zawiera `84-300`.

Zakres: bieżąca tabela, nie kompletność wszystkich wyników w systemie.

### STR-10 — Wyszukiwanie po miejscowości

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wpisuje miejscowość `Lębork` i klika Szukaj.
3. Wymaga wierszy danych.
4. Sprawdza obecność tekstu `Lębork` w adresie każdego aktualnie wyrenderowanego wyniku.

Zakres: zawartość tekstu adresu; nie porównuje osobnego pola miejscowości w bazie.

### STR-11 — Wyszukiwanie po ulicy

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wpisuje ulicę `Kościuszki` i klika Szukaj.
3. Wymaga wierszy danych.
4. Sprawdza obecność tekstu `Kościuszki` w adresie każdego aktualnie wyrenderowanego wyniku.

### STR-12 — ID i nazwa jednocześnie

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wypełnia jednocześnie ID i nazwę `GOLD_SCHOOL`.
3. Klika Szukaj.
4. Sprawdza jeden wiersz z tym ID i zgodną nazwą.

Zakres: dwa zgodne kryteria. Nie sprawdza wariantu z ID jednej szkoły i nazwą innej.

### STR-13 — Nieistniejące ID

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wpisuje ID `999999` i klika Szukaj.
3. Sprawdza, że tabela zawiera tylko wiersz nagłówka i zero komórek danych.
4. Sprawdza, że dialog pozostaje widoczny.

Zakres: ID przyjęte jako nieistniejące; test nie sprawdza wcześniej jego nieobecności w bazie.

### STR-14 — Dodanie szkoły do roboczej listy

Tryb: UI; bez zapisu.

1. Otwiera dialog na `NO_MEDAL_SCHOOL`.
2. Wyszukuje `GOLD_SCHOOL` po ID; sprawdza jej wiersz i nazwę.
3. Klika Dodaj w pierwszej komórce wiersza.
4. Sprawdza dokładnie jeden wiersz tej szkoły i jej nazwę w dolnej, roboczej tabeli.
5. Klika Anuluj i sprawdza zniknięcie dialogu.

Zakres: dodanie planowanego powiązania; trwała relacja nie jest tworzona.

### STR-15 — Usunięcie szkoły z roboczej listy

Tryb: UI; bez zapisu.

1. W dialogu na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL`.
2. Sprawdza obecność jednego roboczego wiersza.
3. Klika ikonę usunięcia planowanego wiersza (`remove_circle_outline`).
4. Sprawdza brak tego wiersza w dolnej tabeli.
5. Anuluje dialog i sprawdza jego zamknięcie.

Zakres: usunięcie pozycji przed zapisem, nie śmietnik usuwający utrwaloną relację.

## STR-16–STR-29 — zapis, typy i podstawowe walidacje

### STR-16 — Jedno żądanie dla jednej pozycji

Tryb: UI z symulacją sukcesu zapisu; bez rzeczywistego utworzenia relacji.

1. Na `NO_MEDAL_SCHOOL` przygotowuje `GOLD_SCHOOL`, typ Zespół szkół, hierarchię Podrzędna.
2. Przechwytuje żądania zapisu i podstawia odpowiedź sukcesu.
3. Klika Zapisz i czeka, aż licznik przechwyconych żądań wyniesie jeden.
4. Sprawdza jedną pozycję w treści żądania, puste ID nowej relacji i typ `1`.
5. Sprawdza, że ID jednostek obu stron są różne.
6. Sprawdza zamknięcie dialogu.

Zakres: format i liczba żądań w tym przebiegu. Nie sprawdza dokładnej wartości obu stron ani trwałości w serwerze.

### STR-17 — Relacja widoczna po ponownym otwarciu

Tryb: procedura U; rzeczywisty zapis i odczyt.

1. Przygotowuje `group` i `primary`, usuwa wcześniejsze powiązanie.
2. Z profilu `group` tworzy relację Zespół szkół, Podrzędna, do `primary`.
3. Ponownie otwiera Strukturę `group`; sprawdza jeden wiersz `primary` i jej nazwę.
4. Przechodzi na profil `primary`.
5. Ponownie otwiera profil i Strukturę `group`; jeszcze raz sprawdza wiersz `primary`.
6. W `finally` usuwa relację przez UI.

Zakres: ponowne pobranie po nawigacji. Mimo przejścia na `primary`, właściwe sprawdzenie relacji ponownie dotyczy profilu `group`; test nie sprawdza jej w obu profilach.

### STR-18 — Anulowanie jednej roboczej pozycji

Tryb: UI; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL` do dolnej tabeli.
2. Klika Anuluj; sprawdza zamknięcie dialogu i pustą Strukturę.
3. Ponownie otwiera dialog dodawania.
4. Sprawdza tylko nagłówek dolnej tabeli i zero komórek danych.
5. Anuluje drugi dialog i sprawdza jego zamknięcie.

### STR-19 — Jedno żądanie dla dwóch pozycji

Tryb: UI z symulacją sukcesu zapisu; bez rzeczywistego utworzenia relacji.

1. Na `NO_MEDAL_SCHOOL` dodaje `GOLD_SCHOOL` i `SILVER_SCHOOL`, obie jako Zespół szkół / Podrzędna.
2. Przechwytuje zapis i zwraca testowy sukces.
3. Klika Zapisz; czeka na jedno przechwycone żądanie.
4. Sprawdza dwie pozycje oraz dwa różne `linkedInstitutionUnitId` w jego treści.
5. Sprawdza zamknięcie dialogu.

Zakres: jedna paczka z dwiema różnymi stronami wyszukanymi; realny wielopozycyjny zapis sprawdza STR-82.

### STR-20 — Pokaż zaznaczone w nowej karcie

Tryb: procedura G (`group`, `main`, `branch`), rzeczywiste API i UI.

1. Tworzy `group` → `main` jako Zespół szkół oraz `main` → `branch` jako Filię.
2. Otwiera Strukturę `group`.
3. Klika komórkę ID `main`; sprawdza zaznaczenie wiersza (`aria-selected=true`).
4. Klika Pokaż zaznaczone i czeka na nową kartę oraz widoczną tabelę wyników.
5. W nowej karcie sprawdza jeden wynik z ID `main` i brak wyników z ID `group` oraz `branch`.
6. Zamyka nową kartę w `finally`; procedura G sprząta relacje.

Zakres: jedna zaznaczona szkoła. Nie sprawdza zaznaczenia kilku szkół ani zaznaczania całej gałęzi. Nie jest obecnie oznaczony jako oczekiwana porażka.

### STR-21 — Mapowanie typu Zespół szkół

Tryb: UI z symulacją sukcesu zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL`.
2. Wybiera Zespół szkół oraz Podrzędna; sprawdza tekst wybranych komórek.
3. Przechwytuje zapis, klika Zapisz i czeka na jedno żądanie.
4. Sprawdza `institutionRelationTypeId=1` w pierwszej pozycji.
5. Sprawdza zamknięcie dialogu.

Zakres: dostępność i mapowanie opcji formularza, nie akceptacja tego układu przez rzeczywisty backend.

### STR-22 — Mapowanie typu Filia

Tryb: UI z symulacją sukcesu zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL`.
2. Wybiera Filia oraz Podrzędna.
3. Przechwytuje zapis, klika Zapisz i czeka na jedno żądanie.
4. Sprawdza `institutionRelationTypeId=2` w pierwszej pozycji i zamknięcie dialogu.

Zakres: mapowanie formularza; nie trwałość relacji Matka–Filia w serwerze.

### STR-23 — Mapowanie typu Wielobudynkowość

Tryb: UI z symulacją sukcesu zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL`.
2. Wybiera Wielobudynkowość oraz Podrzędna.
3. Przechwytuje zapis, klika Zapisz i czeka na jedno żądanie.
4. Sprawdza `institutionRelationTypeId=3` w pierwszej pozycji i zamknięcie dialogu.

Zakres: mapowanie opcji; nie reguły ograniczające działania dodatkowej lokalizacji.

### STR-24 — Nieistniejący typ relacji

Tryb: procedura G (`main`, `branch`), rzeczywiste API; nie używa formularza do zapisu.

1. Przygotowuje aktywne szkoły i pusty graf.
2. Wysyła próbę nowej relacji `main` → `branch` z `institutionRelationTypeId=999999`.
3. Sprawdza odmowę przez `api.reject`: dopuszczalne HTTP 400/404/409/422 lub odpowiedni `codeResult` przy HTTP 200.
4. Ponownie odczytuje drzewo `main`.
5. Sprawdza zero aktywnych relacji w tym drzewie.
6. Procedura G sprząta także ewentualny niepoprawnie zaakceptowany zapis.

Zakres: odmowa i brak aktywnego zapisu. Nie sprawdza tekstu błędu, przyczyny odmowy, ostrzeżenia UI ani bazy; nie weryfikuje wcześniej w słowniku, że `999999` nie istnieje.

### STR-25 — Duplikat istniejącego powiązania w dialogu

Tryb: procedura U; rzeczywista relacja, próba duplikatu w UI.

1. Przygotowuje `group` i `primary`; usuwa wcześniejszą relację.
2. Tworzy Zespół szkół / Podrzędna i zapamiętuje niepuste ID relacji.
3. Otwiera dialog dodawania; sprawdza jeden istniejący wiersz `primary`.
4. Wyszukuje `primary` po ID. Jeśli szkoła jest dostępna jako kandydat, klika jej Dodaj.
5. Sprawdza, że dolna tabela nadal zawiera tylko jeden wiersz `primary`.
6. Anuluje dialog i sprawdza, że odczytane ID relacji pozostało takie samo.
7. Usuwa relację w `finally`.

Zakres: zabezpieczenie formularza. Nie wymaga konkretnego ostrzeżenia i nie wysyła drugiego rzeczywistego zapisu duplikatu.

### STR-26 — Drugi typ dla tej samej pary

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Tworzy Filię `main` → `branch`; zapamiętuje ID.
2. Wysyła próbę nowej Wielobudynkowości dla tej samej skierowanej pary.
3. Odczytuje aktywne drzewo `main`.
4. Sprawdza dokładnie jedną krawędź i jej ID równe pierwotnemu.
5. Procedura G sprząta relacje.

Zakres: brak drugiego aktywnego rekordu. Test nie wymaga odmowy API i nie sprawdza końcowego typu; dopuszcza zmianę typu tego samego rekordu lub odrzucenie nowego typu.

### STR-27 — Samopowiązanie w formularzu

Tryb: UI; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje tę samą szkołę po jej ID.
2. Jeśli jest jeden wiersz wyniku, próbuje kliknąć Dodaj.
3. Jeśli pojawi się ostrzeżenie Uwaga, zamyka je przyciskiem OK.
4. Sprawdza brak własnej szkoły w dolnej tabeli planowanych powiązań.
5. Anuluje dialog i sprawdza jego zamknięcie.

Zakres: szkoła może zostać wykluczona z wyników albo zablokowana przy dodawaniu. Konkretny komunikat nie jest wymagany; ochronę samego API sprawdza STR-61.

### STR-28 — Cykl bezpośredni

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Tworzy Filię `main` → `branch`; zapamiętuje ID.
2. Wysyła próbę odwrotnej Filii `branch` → `main`.
3. Sprawdza odmowę przez `api.reject`.
4. Sprawdza, że drzewo zawiera dokładnie pierwotną krawędź: to samo ID, rodzica, dziecko i typ `2`.
5. Procedura G sprząta relacje.

Zakres: odwrócenie dwuwęzłowej relacji, powodujące cykl.

### STR-29 — Cykl pośredni przez trzy szkoły

Tryb: procedura G (`main`, `branch`, `nodeC`), rzeczywiste API.

1. Tworzy Filie `main` → `branch` i `branch` → `nodeC`.
2. Próbuje dodać `nodeC` → `main`, zamykając cykl.
3. Sprawdza odmowę przez `api.reject`.
4. Sprawdza, że drzewo nadal ma dwie krawędzie.
5. Procedura G sprząta relacje.

Zakres: długość cyklu trzy. Po odmowie sprawdzana jest liczba krawędzi, nie pełna ponowna zgodność każdej z nich.

## STR-30–STR-44 — hierarchia, CRUD, identyfikatory i słownik

### STR-30 — Cztery poziomy i różne role szkoły

Tryb: procedura G (`group`, `main`, `branch`, `nodeC`), rzeczywiste API i UI.

1. Tworzy `group` → `main` jako Zespół szkół, `main` → `branch` jako Filię oraz `branch` → `nodeC` jako Wielobudynkowość.
2. Otwiera Strukturę `group`.
3. Sprawdza dokładną kolejność wszystkich komórek ID: `group`, `main`, `branch`, `nodeC`.
4. Odczytuje API z perspektywy `branch`; wymaga trzech krawędzi całej struktury.
5. Procedura G usuwa relacje.

Zakres: szkoła będąca dzieckiem może mieć własne dzieci; kompletność i kolejność jednej czteropoziomowej struktury. Ikony i wcięcia sprawdza osobno STR-67.

### STR-31 — Siedem poziomów bez limitu czterech

Tryb: procedura G (`main`, `branch`, `primary`, `nodeC`, `nodeD`, `nodeE`, `nodeF`), rzeczywiste API i UI.

1. Ustawia maksymalny czas testu na 360 sekund.
2. Tworzy łańcuch siedmiu szkół w wymienionej kolejności; wszystkie sześć relacji mają typ Filia.
3. Sprawdza sześć krawędzi w drzewie `main`.
4. Otwiera Strukturę `main` i sprawdza dokładną kolejność siedmiu ID.
5. Procedura G usuwa relacje.

Zakres: siedem poziomów; nie dowód obsługi dowolnej liczby poziomów ani test obciążeniowy bardzo dużego grafu.

### STR-32 — Zmiana typu istniejącej relacji

Tryb: procedura U (`main`, `branch`), rzeczywisty zapis przez UI.

1. Tworzy Filię `main` → `branch`; odczytuje niepuste ID relacji.
2. Otwiera Edycję struktury na `main` dla `branch`.
3. Wybiera Wielobudynkowość, sprawdza wybór, zapisuje i czeka na udany HTTP oraz zamknięcie dialogu.
4. Sprawdza, że ID relacji pozostało pierwotne.
5. W dialogu dodawania na `main` sprawdza typ Wielobudynkowość przy `branch`; anuluje.
6. Na profilu `branch` otwiera edycję powiązania z `main`; sprawdza typ Wielobudynkowość i hierarchię Nadrzędna.
7. Sprawdza brak pól tekstowych do zmiany szkoły; anuluje edycję.
8. Usuwa relację w `finally`.

Zakres: ten sam rekord i widok typu z obu stron. Nie sprawdza historii tej operacji; robi to STR-46.

### STR-33 — Zamiana kierunku relacji

Tryb: procedura U (`main`, `branch`), rzeczywisty zapis przez UI.

1. Tworzy Filię / Podrzędna i zapamiętuje obie jednostki z treści żądania tworzenia.
2. W edycji na `main` zmienia hierarchię na Nadrzędna i zapisuje.
3. Sprawdza treść żądania edycji: nowy rodzic jest poprzednim dzieckiem, a nowe dziecko poprzednim rodzicem.
4. Ponownie otwiera edycję; sprawdza zapisany wybór Nadrzędna.
5. Anuluje edycję i usuwa relację w `finally`.

Zakres: poprawna zamiana stron jednej relacji. Nie sprawdza negatywnej edycji powodującej cykl ani zachowania ID rekordu wprost.

### STR-34 — Usunięcie śmietnikiem

Tryb: procedura U (`group`, `primary`), rzeczywisty zapis i usunięcie.

1. Tworzy Zespół szkół / Podrzędna i sprawdza widoczny wiersz `primary`.
2. Klika śmietnik, sprawdza modal z obiema nazwami, potwierdza Tak i czeka na udany DELETE oraz zniknięcie wiersza.
3. Ponownie otwiera Strukturę `group` i sprawdza komunikat pustego stanu.
4. Odczytuje relację z odpowiedzi API; wymaga `null`, czyli braku w aktywnym drzewie.
5. W `finally` dodatkowo próbuje usunąć relację tylko wtedy, gdy nadal istnieje.

Zakres: zniknięcie aktywnego powiązania, nie bezpośredni odczyt `is_Del` ani fizycznej obecności rekordu w DB.

### STR-35 — Reaktywacja tego samego rekordu

Tryb: procedura U (`group`, `primary`), rzeczywisty zapis, usunięcie i ponowne dodanie.

1. Tworzy Zespół szkół / Podrzędna; zapamiętuje niepuste ID relacji.
2. Usuwa ją śmietnikiem i potwierdza brak w aktywnym odczycie (`null`).
3. Ponownie dodaje tę samą parę, typ i kierunek przez formularz.
4. Sprawdza, że ID aktywnej relacji jest równe pierwotnemu.
5. Usuwa reaktywowane powiązanie w `finally`.

Zakres: publicznie obserwowana reaktywacja. Nie korzysta z przycisku undo ani z roli DPD; nie odczytuje `is_Del` z DB.

### STR-36 — Ponowne dodanie po usunięciu

Tryb: procedura U (`group`, `primary`).

1. Tworzy relację Zespół szkół / Podrzędna.
2. Usuwa ją przez UI.
3. Ponownie dodaje tę samą konfigurację.
4. Sprawdza jeden widoczny wiersz `primary` ze zgodną nazwą w Strukturze `group`.
5. Usuwa relację w `finally`.

Zakres: powrót relacji do UI. W przeciwieństwie do STR-35 nie porównuje jej ID przed i po usunięciu.

### STR-37 — Usunięta relacja nie wraca do aktywnego widoku

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI.

1. Tworzy Filię `main` → `branch` przez API.
2. Usuwa ją przez API (`deactivate`).
3. Sprawdza zero krawędzi w drzewie `main` oraz w drzewie `branch`.
4. Otwiera dialog dodawania na `main`; sprawdza brak wiersza `branch` w dolnej tabeli istniejących/planowanych relacji.
5. Anuluje dialog; procedura G potwierdza czysty stan.

Zakres: aktywne odczyty i formularz; nie wszystkie inne procesy biznesowe korzystające ze struktury.

### STR-38 — Dokładnie trzycyfrowe ID zespołu

Tryb: przygotowanie dedykowanej szkoły przez UI; oczekiwana porażka.

1. Oznacza test jako `test.fail`: na DEV zaobserwowano czterocyfrowe ID 5014.
2. Zapewnia istnienie szkoły `group`, korzystając z cache, wyszukiwania lub tworzenia.
3. Sprawdza publiczne ID wyrażeniem `^\d{3}$`: dokładnie trzy cyfry, bez dodatkowych znaków.

Zakres: format ID istniejącej lub przygotowanej fixture, nie tworzenie nowego zespołu przy każdym wykonaniu ani test generatora wszystkich ID. Szkoła pozostaje do ponownego użycia.

### STR-39 — Dwa zespoły mają różne ID

Tryb: procedura G (`group`, `group2`), rzeczywisty odczyt API.

1. Przygotowuje dwa odrębnie nazwane zespoły i jednoznacznie rozwiązuje je przez API.
2. Sprawdza, że ich publiczne ID nie są równe.
3. Procedura G potwierdza brak relacji; szkoły pozostają.

Zakres: dwie próbki danych, nie globalne ograniczenie unikalności w DB i nie próba ręcznego nadania zduplikowanego ID.

### STR-40 — Brak kolizji ID w czterech fixture

Tryb: procedura G (`group`, `main`, `branch`, `primary`), rzeczywisty odczyt API.

1. Przygotowuje zespół i trzy szkoły; sprawdza ich jednoznaczne odczyty przez API.
2. Zbiera cztery publiczne ID do listy.
3. Sprawdza, że zbiór unikalnych ID ma tyle elementów co lista.
4. Procedura G potwierdza pusty graf.

Zakres: kolizje w tych danych referencyjnych, nie w całym systemie.

### STR-41 — Wyszukiwanie zespołu po jego ID

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu relacji.

1. Przygotowuje `group` i `main`.
2. Otwiera dialog dodawania na `main`.
3. Wpisuje publiczne ID `group` i klika Szukaj.
4. Sprawdza jeden wiersz z tym ID i zgodną nazwą.
5. Sprawdza dokładnie dwa wiersze całej tabeli: nagłówek i jeden wynik.
6. Anuluje dialog.

Zakres: jednoznaczne wyszukanie faktycznego ID zespołu. Nie wymaga tutaj trzech cyfr; ten wymóg jest w STR-38.

### STR-42 — Identyfikacja zespołu w publicznym API

Tryb: procedura G (`group`), rzeczywiste API.

1. Pobiera `GetInstitutions` z filtrem na publiczne ID `group`.
2. Sprawdza dokładnie jeden wynik.
3. Porównuje ID, wewnętrzne `institutionUnitId` i nazwę z przygotowaną szkołą.
4. Sprawdza `levelName="ZS"`.
5. Procedura G potwierdza brak relacji.

Zakres: publiczny model odczytu, nie eksport ani wszystkie interfejsy integracyjne.

### STR-43 — Stabilne ID, strony i typ w odczytach

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Tworzy Filię `main` → `branch`; zapamiętuje ID.
2. Buduje oczekiwaną pojedynczą krawędź: ID relacji, ID jednostki rodzica, ID jednostki dziecka i typ `2`.
3. Porównuje całe krawędzie drzewa `main` z tym oczekiwaniem.
4. Tak samo porównuje drzewo `branch`.
5. Procedura G usuwa relację.

Zakres: trwałość publicznego odczytu z obu profili. Nie sprawdza kolumn wewnętrznej tabeli DB.

### STR-44 — Słownik typów API i opcje UI

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI; bez zapisu relacji.

1. Pobiera słownik `GetDictInstitutionRelationType`.
2. Sprawdza obecność typów: `1` Zespół szkół, `2` Filia, `3` Wielobudynkowość.
3. Sprawdza brak powtórzonych ID w całym zwróconym słowniku.
4. W dialogu na `main` wyszukuje i dodaje `branch` do roboczej tabeli.
5. Otwiera wybór typu relacji przez dwuklik komórki.
6. Porównuje posortowane nazwy wszystkich opcji UI z nazwami słownika API.
7. Wybiera Filię i anuluje dialog; procedura G kończy sprzątanie.

Zakres: zgodność bieżącego słownika z UI, także jeśli ma dodatkowe typy. Nie dodaje nowego typu i nie dowodzi braku konieczności migracji schematu.

## STR-45–STR-57 — historia, błędy i robocze powiązania

### STR-45 — Historia utworzenia

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI, procedura H.

1. Odczytuje Historię zmian `main` przed operacją.
2. Tworzy Filię `main` → `branch` przez API.
3. Ponownie pobiera historię `main`.
4. Wykonuje wszystkie sprawdzenia H dla akcji „Dodano Filia”, ID szkoły `branch` i obecnego użytkownika.
5. Procedura G usuwa relację.

Zakres: audyt rzeczywistego utworzenia przez API i jego prezentacja w UI. Nie wymaga tworzenia przez formularz.

### STR-46 — Historia zmiany typu

Tryb: procedura G (`main`, `branch`), rzeczywista edycja UI, procedura H.

1. Tworzy Filię i zapamiętuje ID relacji.
2. Odczytuje historię przed edycją.
3. Otwiera edycję, zmienia typ na Wielobudynkowość i zapisuje.
4. Pobiera historię po edycji.
5. Wykonuje H dla „Zmieniono typ relacji na Wielobudynkowość”.
6. Sprawdza, że drzewo zawiera tylko pierwotne ID relacji.
7. Procedura G usuwa relację.

Zakres: nowy typ w opisie oraz to samo ID relacji. Nie wymaga starego typu w tekście historii ani osobnego audytu zmiany hierarchii.

### STR-47 — Historia usunięcia

Tryb: procedura G (`main`, `branch`), rzeczywiste usunięcie UI, procedura H.

1. Tworzy Filię i zapamiętuje ID.
2. Odczytuje historię przed usunięciem.
3. Usuwa powiązanie przez śmietnik i potwierdzenie Tak.
4. Informuje helper API, że znana relacja została już usunięta, aby nie usuwać jej drugi raz.
5. Pobiera historię i wykonuje H dla „Usunięto Filia”.
6. Procedura G potwierdza czysty graf.

Zakres: wpis publicznej historii usunięcia, nie bezpośrednia kontrola soft delete w bazie.

### STR-48 — Historia reaktywacji

Tryb: procedura G (`main`, `branch`), rzeczywiste API, procedura H.

1. Tworzy Filię, zapamiętuje ID i usuwa ją przez API.
2. Odczytuje historię po usunięciu, przed ponownym dodaniem.
3. Dodaje tę samą Filię przez API i sprawdza zwrócone ID równe pierwotnemu.
4. Odczytuje historię ponownie i wykonuje H dla „Dodano Filia”.
5. Procedura G usuwa reaktywowaną relację.

Zakres: ponowne dodanie jest w historii opisywane jako dodanie. Test nie wymaga osobnego słowa „przywrócono” i nie wykonuje operacji DPD.

### STR-49 — Odmowa zapisu HTTP 422

Tryb: UI z symulacją HTTP 422; oczekiwana porażka; brak rzeczywistego zapisu.

1. Oznacza znaną niezgodność: DEV zamyka dialog po 422.
2. Na `NO_MEDAL_SCHOOL` przygotowuje `GOLD_SCHOOL` jako Zespół szkół / Podrzędna.
3. Przechwytuje POST zapisu i zamiast serwera zwraca HTTP 422 z `{status:422}`.
4. Klika Zapisz i czeka na jedno przechwycone żądanie.
5. Wymaga nadal widocznego dialogu.
6. Wymaga jednego przygotowanego wiersza `GOLD_SCHOOL` w dolnej tabeli.

Obecny DEV nie spełnia kroku 5; wtedy krok 6 nie jest wykonywany. Nie ma utrwalonej relacji do usunięcia.

Zakres: reakcja frontendu na odmowę. Nie sprawdza rzeczywistej walidacji backendu, treści komunikatu błędu ani ponownego zapisu. Licznik jest sprawdzany w danym momencie, nie w długim okresie obserwacji automatycznych ponowień.

Co zrobić: zachować test i `test.fail` jako udokumentowaną niezgodność. W aplikacji po 422 należy pozostawić formularz i przygotowane dane. Po naprawie prześledzić cały przebieg, usunąć `test.fail` i uruchomić test ponownie. Nie zmieniać oczekiwania na zamknięcie formularza tylko po to, żeby test przeszedł. Przy uzgodnionym projekcie komunikatu można osobno rozszerzyć jego sprawdzanie.

### STR-50 — Błąd serwera HTTP 500

Tryb: UI z symulacją HTTP 500; oczekiwana porażka.

1. Oznacza znaną niezgodność: zamknięcie dialogu i utrata stanu po 500.
2. Na `NO_MEDAL_SCHOOL` przygotowuje `GOLD_SCHOOL` jako Zespół szkół / Podrzędna.
3. Przechwytuje zapis i zwraca HTTP 500 z `{status:500}`.
4. Klika Zapisz i czeka na jedno żądanie.
5. Wymaga widocznego dialogu, aktywnego przycisku Zapisz i zachowanego wiersza szkoły.

Zakres: możliwość dalszej pracy w formularzu. Mimo nazwy testu nie klika Zapisz drugi raz, nie symuluje późniejszego sukcesu i nie sprawdza braku duplikatu po ponowieniu. Przy obecnej porażce na widoczności późniejsze sprawdzenia nie wykonują się. Rzeczywisty serwer nie zapisuje relacji.

### STR-51 — Konflikt równoczesnej edycji

Tryb: procedura G (`main`, `branch`), rzeczywiste API; oczekiwana porażka kontraktu.

1. Tworzy Filię i zapamiętuje ID relacji.
2. Równocześnie wysyła dwie edycje tego samego ID: typ `1` i typ `3`, z tymi samymi stronami.
3. Odczytuje oba statusy HTTP i odpowiedzi JSON.
4. Wymaga odpowiedzi HTTP 409 albo HTTP 200 z `codeResult` 204 lub 409; inne wyniki nie są akceptowane.
5. Włącza oczekiwaną porażkę dla braku konfliktu.
6. Wymaga, aby co najmniej jedna odpowiedź zgłosiła 409.
7. Następnie wymaga jednej aktywnej krawędzi; procedura G sprząta także po wcześniejszej porażce.

Zakres: dwie konkurujące edycje jednego rekordu, nie dwa konta ani dwie sesje UI. Ochrona przed cichym nadpisaniem jest dodatkowym kontraktem do uzgodnienia z właścicielem produktu. Przy obecnym braku 409 krok 7 nie jest wykonywany.

### STR-52 — Akcje obecnego użytkownika

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI.

1. Na pustej Strukturze `main` sprawdza aktywne Dodaj powiązanie.
2. Tworzy Filię przez API.
3. Otwiera edycję i sprawdza dwa pola wyboru; anuluje.
4. Klika śmietnik i sprawdza aktywny przycisk Tak w potwierdzeniu.
5. Klika Nie; procedura G usuwa relację po teście.

Zakres: dostęp do akcji jednego obecnego użytkownika. Nie zapisuje edycji w tym scenariuszu i nie sprawdza innych ról.

### STR-53 — Wyszukiwanie samych spacji

Tryb: UI i rzeczywiste wyszukiwanie; oczekiwana porażka; bez zapisu.

1. Oznacza znaną niezgodność: spacje zwracają listę zamiast walidacji.
2. Na `NO_MEDAL_SCHOOL` otwiera dialog i wpisuje trzy spacje w nazwie.
3. Klika Szukaj.
4. Wymaga ostrzeżenia „Wyszukiwanie nie może być puste”, zamyka je przez OK.
5. Wymaga nadal otwartego dialogu oraz zero komórek danych w tabeli wyników.

Zakres: trzy spacje w polu nazwy, nie tabulatory, nowe linie ani wszystkie pola wyszukiwania. Brak ostrzeżenia zatrzymuje przebieg przed krokiem 5.

### STR-54 — Zastąpienie wyników kolejnym wyszukiwaniem

Tryb: UI i rzeczywiste wyszukiwanie; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje `GOLD_SCHOOL` po ID; sprawdza jej wiersz i nazwę.
2. Zastępuje wartość pola ID identyfikatorem `SILVER_SCHOOL`.
3. Ponownie klika Szukaj i sprawdza wiersz oraz nazwę `SILVER_SCHOOL`.
4. Sprawdza brak poprzedniego wiersza `GOLD_SCHOOL`.

Zakres: zastąpienie wyników przy zmianie jednego kryterium, nie konkurujące odpowiedzi wolnego i szybkiego wyszukiwania.

### STR-55 — Dwukrotne dodanie do roboczej listy

Tryb: UI; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL` do dolnej tabeli.
2. Jeśli jej wiersz nadal istnieje w górnych wynikach, ponownie klika Dodaj.
3. Sprawdza dokładnie jeden wiersz tej szkoły w dolnej tabeli.
4. Anuluje dialog.

Zakres: duplikat przed zapisem. Dopuszcza usunięcie kandydata z górnej tabeli po pierwszym dodaniu.

### STR-56 — Ponowne dodanie usuniętej roboczej pozycji

Tryb: UI; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje i dodaje `GOLD_SCHOOL`.
2. Usuwa jej roboczy wiersz ikoną `remove_circle_outline`; sprawdza zniknięcie.
3. Ponownie dodaje tę samą szkołę z wyników.
4. Sprawdza jeden dolny wiersz tej szkoły.
5. Anuluje dialog.

Zakres: robocza lista, nie reaktywacja soft-deleted rekordu.

### STR-57 — Anulowanie dwóch roboczych pozycji

Tryb: UI; bez zapisu.

1. Na `NO_MEDAL_SCHOOL` wyszukuje kolejno `GOLD_SCHOOL` i `SILVER_SCHOOL` i dodaje obie do dolnej tabeli.
2. Sprawdza jeden wiersz każdej z nich w tej tabeli.
3. Anuluje dialog i otwiera go ponownie.
4. Sprawdza zero komórek danych w dolnej tabeli.
5. Anuluje ponownie otwarty dialog.

Zakres: odrzucenie dwóch planowanych pozycji po zamknięciu; typy i hierarchie nie są tu ustawiane ani zapisywane.

## STR-58–STR-71 — walidacje API, dostęp do akcji i prezentacja

### STR-58 — Brak poprawnej szkoły nadrzędnej

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje pusty graf aktywnych szkół.
2. Wysyła próbę Filii, ale zastępuje `sourceInstitutionUnitId` wartością `0`.
3. Sprawdza odmowę przez `api.reject`.
4. Odczytuje drzewo `main` i sprawdza zero krawędzi.
5. Procedura G sprząta po próbie.

Zakres: wartość zero jako niepoprawny rodzic. Nie usuwa pola z JSON i nie sprawdza wariantu `null`.

### STR-59 — Brak poprawnej szkoły podrzędnej

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje pusty graf.
2. Wysyła próbę Filii z `linkedInstitutionUnitId=0`.
3. Sprawdza odmowę przez `api.reject` oraz zero krawędzi w drzewie `main`.
4. Procedura G sprząta po próbie.

Zakres: zero w polu dziecka, nie brak pola ani `null`; nie sprawdza konkretnego komunikatu.

### STR-60 — Brak poprawnego typu relacji

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje pusty graf.
2. Wysyła próbę `main` → `branch` z `institutionRelationTypeId=0`.
3. Sprawdza odmowę przez `api.reject`.
4. Sprawdza zero krawędzi w ponownie pobranym drzewie `main`.
5. Procedura G sprząta po próbie.

Zakres: zero zamiast typu; brak pola i `null` nie są osobnymi wariantami tego testu.

### STR-61 — Samopowiązanie bezpośrednio przez API

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje szkoły i pusty graf.
2. Wysyła próbę Filii `main` → `main`, czyli równe ID jednostek obu stron.
3. Wymaga odmowy przez `api.reject`.
4. Sprawdza zero krawędzi w drzewie `main`.
5. Procedura G sprząta po próbie.

Zakres: serwerowa ochrona przed samopowiązaniem dla typu Filia, niezależna od formularza. `branch` jest przygotowana, lecz nie jest stroną tej próby.

### STR-62 — Nieistniejąca jednostka podrzędna

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje pusty graf.
2. Wysyła próbę Filii z dzieckiem `linkedInstitutionUnitId=2147483647` zamiast jednostki `branch`.
3. Sprawdza odmowę przez `api.reject`.
4. Wymaga zero krawędzi w drzewie `main`.
5. Procedura G sprząta po próbie.

Zakres: wybrany identyfikator przyjęty jako nieistniejący; jego nieobecność nie jest osobno potwierdzana przed próbą.

### STR-63 — Jedna filia nie ma dwóch szkół głównych

Tryb: procedura G (`main`, `branch`, `nodeC`), rzeczywiste API.

1. Tworzy Filię `main` → `branch`; zapamiętuje ID.
2. Próbuje utworzyć drugą Filię `nodeC` → `branch`.
3. Sprawdza odmowę przez `api.reject`.
4. Odczytuje drzewo `branch` i wymaga dokładnie pierwotnej krawędzi, ze zgodnym ID, rodzicem, dzieckiem i typem `2`.
5. Procedura G usuwa relacje.

Zakres: dwóch rodziców jednej filii; nie wszystkie możliwe sprzeczności typów w większym grafie.

### STR-64 — Pośrednie powiązanie jest tylko do odczytu

Tryb: procedura G (`group`, `main`, `branch`), rzeczywiste API i UI.

1. Tworzy `group` → `main` jako Zespół szkół i `main` → `branch` jako Filię.
2. Otwiera Strukturę `group`, gdzie `branch` jest pośrednia.
3. Sprawdza klasę `disabled-icon` ikon edycji i usuwania przy `branch`.
4. Klika komórki obu akcji; wymaga braku modali usuwania i edycji.
5. Sprawdza przez API, że struktura nadal ma dwie krawędzie.
6. Przechodzi do `main` i otwiera edycję bezpośredniego powiązania z `branch`; wymaga widocznego dialogu, potem anuluje.
7. Procedura G usuwa relacje.

Zakres: blokada UI i dostęp z właściwego profilu. Nie testuje uprawnień API przy ręcznym żądaniu z niedozwolonego kontekstu.

### STR-65 — Dodatkowa lokalizacja a inne powiązania

Tryb: procedura G (`main`, `branch`, `nodeC`), rzeczywiste API i UI.

1. Tworzy Wielobudynkowość `main` → `branch` oraz Filię `main` → `nodeC`.
2. Z profilu dodatkowej lokalizacji `branch` otwiera edycję bezpośredniej relacji z `main`.
3. Sprawdza typ Wielobudynkowość i anuluje.
4. Na Strukturze `branch` sprawdza `disabled-icon` edycji i usuwania przy `nodeC`.
5. Próbuje obie akcje dla `nodeC`; wymaga braku dialogów.
6. Z profilu `main` otwiera edycję `nodeC`, sprawdza typ Filia i anuluje.
7. Procedura G usuwa relacje.

Zakres: `nodeC` jest tutaj pośrednią/sąsiednią filią, nie własną filią `branch`. Ograniczenie istniejącej własnej filii po zmianie roli sprawdza STR-87. Nie zapisuje edycji ani nie potwierdza usunięcia w tym teście.

### STR-66 — Lokalizacje przed filiami

Tryb: procedura G (`main`, `branch`, `nodeC`), rzeczywiste API i UI.

1. Najpierw tworzy Filię `main` → `nodeC`.
2. Dopiero potem tworzy Wielobudynkowość `main` → `branch`.
3. Otwiera Strukturę `main`.
4. Wymaga dokładnej kolejności ID: `main`, `branch`, `nodeC`.
5. Procedura G usuwa relacje.

Zakres: jedna lokalizacja musi być przed jedną filią mimo późniejszego utworzenia. Nie określa sortowania kilku lokalizacji między sobą.

### STR-67 — Ikony, wcięcia i brak zwijania

Tryb: procedura G (`group`, `main`, `branch`, `nodeC`), rzeczywiste API i UI.

1. Tworzy cztery poziomy: Zespół szkół → Filia → Wielobudynkowość, jak w STR-30.
2. Otwiera Strukturę `group`; wymaga braku elementów rozwijania i zwijania AG Grid.
3. Dla każdej szkoły sprawdza widoczną ikonę w komórce nazwy.
4. Odczytuje rzeczywiste CSS `padding-left` elementu wcięcia.
5. Sprawdza w DOM, że obrazek ikony znajduje się przed elementem z nazwą szkoły.
6. Wymaga rosnących wcięć kolejnych poziomów i jednakowych różnic między nimi.
7. Procedura G usuwa relacje.

Zakres: struktura DOM i wartości wcięć. Nie porównuje wyglądu z makietą piksel po pikselu, nie sprawdza konkretnego pliku ikony dla danego typu i nie ocenia czytelności przy dowolnej głębokości.

### STR-68 — Ciągłość podstruktury

Tryb: procedura G (`group`, `main`, `primary`, `branch`, `nodeC`), rzeczywiste API i UI.

1. Tworzy dwa dzieci zespołu: `main` i `primary`.
2. Pod `main` tworzy Filię `branch`, a pod nią lokalizację `nodeC`.
3. Otwiera Strukturę `group` i odczytuje listę ID w tabeli.
4. Wymaga `group` na pierwszym miejscu.
5. Sprawdza, że lista zawiera dokładnie pięć oczekiwanych ID, bez braków i dodatkowych wystąpień.
6. Wymaga ciągłego fragmentu `main`, `branch`, `nodeC` bez wstawienia `primary` do środka.
7. Procedura G usuwa relacje.

Zakres: ciągłość poddrzewa. Mimo nazwy testu nie wymaga, by `primary` było po poddrzewie; może być także przed nim. Kolejność rodzeństwa nie jest tu narzucona.

### STR-69 — Nie w potwierdzeniu usunięcia

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI.

1. Tworzy Filię i zapamiętuje ID.
2. Otwiera Strukturę `main` i klika śmietnik przy `branch`.
3. Sprawdza obie nazwy szkół w potwierdzeniu.
4. Klika Nie.
5. Sprawdza przez API, że jedyna relacja nadal ma pierwotne ID.
6. Otwiera profil `branch` i sprawdza jej nazwę — szkoła nadal istnieje.
7. Procedura G usuwa relację już w ramach sprzątania.

Zakres: anulowanie zachowuje relację i wskazaną szkołę. Nie liczy żądań DELETE; kontroluje rezultat.

### STR-70 — Anulowanie zmiany typu i hierarchii

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI.

1. Tworzy Filię `main` → `branch`; zapamiętuje ID.
2. Otwiera edycję i sprawdza, że Zapisz jest początkowo nieaktywne.
3. Zmienia roboczo typ na Wielobudynkowość oraz hierarchię na Nadrzędna.
4. Sprawdza brak pól tekstowych pozwalających zmieniać szkołę.
5. Klika Anuluj.
6. Odczytuje API i wymaga dokładnie pierwotnej krawędzi: to samo ID, kierunek i typ Filia.
7. Procedura G usuwa relację.

Zakres: zmienione wartości nie są zapisywane przy anulowaniu. Nie próbuje zmienić szkoły przez ręcznie przygotowane API.

### STR-71 — Usunięcie relacji nie usuwa szkół

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI.

1. Tworzy Filię przez API i usuwa ją przez API.
2. Otwiera osobno profil `main` i profil `branch`.
3. Na każdym sprawdza nazwę zgodną z przygotowanymi danymi.
4. Procedura G dodatkowo potwierdza brak relacji.

Zakres: obie placówki są nadal dostępne po usunięciu powiązania. Nie korzysta tutaj z UI śmietnika i nie odczytuje DB.

## STR-72–STR-87 — odporność, procesy, kierunki i dodatkowe przypadki

### STR-72 — Timeout zapisu

Tryb: UI z symulacją przerwanego żądania; oczekiwana porażka.

1. Oznacza znaną niezgodność: timeout zamyka dialog.
2. Na `NO_MEDAL_SCHOOL` przygotowuje `GOLD_SCHOOL` jako Filię / Podrzędna.
3. Przechwytuje zapis i przerywa go z przyczyną `timedout` zamiast wysyłać do serwera.
4. Klika Zapisz i czeka na zdarzenie nieudanego żądania tego zapisu.
5. Wymaga nadal widocznego dialogu i jednego zachowanego wiersza szkoły.

Zakres: reakcja na symulowane niepowodzenie sieci. Nie mierzy rzeczywistego czasu oczekiwania serwera, nie ponawia zapisu i nie tworzy trwałej relacji. Porażka na widoczności zatrzymuje dalsze sprawdzenie wiersza.

### STR-73 — Odmowa usunięcia powiązanego z procesem

Tryb: procedura G (`main`, `branch`), prawdziwa relacja i symulowana odmowa DELETE.

1. Tworzy prawdziwą Filię i zapamiętuje ID.
2. Otwiera Strukturę `main`.
3. Przechwytuje przeglądarkowe DELETE relacji i zwraca HTTP 409 z opisem blokady aktywnego zamówienia.
4. Klika śmietnik i Tak w potwierdzeniu; czeka na odpowiedź DELETE.
5. Wymaga nadal jednego wiersza `branch` w UI.
6. Odczytuje rzeczywiste API i wymaga pierwotnego ID relacji.
7. Procedura G usuwa prawdziwą relację przez własny kontekst API, którego przechwycenie żądań przeglądarki nie blokuje.

Zakres: UI nie usuwa wiersza po odmowie. Nie tworzy zamówienia, nie sprawdza, czy backend wykrywa proces, i nie wymaga wyświetlenia konkretnego tekstu błędu.

### STR-74 — Odmowa edycji powiązanej z procesem

Tryb: procedura G (`main`, `branch`), prawdziwa relacja i symulowany HTTP 409; oczekiwana porażka.

1. Oznacza znaną niezgodność: 409 zamyka edycję.
2. Tworzy prawdziwą Filię; zapamiętuje ID.
3. Otwiera edycję i wybiera Wielobudynkowość.
4. Przechwytuje POST przeglądarki i zwraca 409 z opisem blokady aktywnego raportu.
5. Klika Zapisz i czeka na odpowiedź.
6. Wymaga nadal widocznego dialogu.
7. Następnie odczytuje API i wymaga pierwotnej krawędzi z typem Filia; procedura G sprząta.

Zakres: reakcja UI na odmowę oraz zaplanowane sprawdzenie stanu serwera. Przy obecnej porażce w kroku 6 krok 7 nie jest wykonywany. Nie tworzy raportu, nie dowodzi wykrywania raportu przez backend i nie sprawdza osobno zachowania zmienionej opcji w widocznym dialogu.

### STR-75 — Zespół z SP, LO i przedszkolem

Tryb: procedura G (`group`, `primary`, `secondary`, `preschool`), rzeczywiste API i UI.

1. Przygotowuje zespół i placówki trzech typów.
2. Dla każdej placówki tworzy relację typu Zespół szkół z `group` jako rodzicem.
3. Otwiera Strukturę `group` i sprawdza jeden wiersz każdej placówki.
4. Odczytuje drzewo API; wymaga dokładnie trzech typów krawędzi: `[1,1,1]`.
5. Procedura G usuwa relacje.

Zakres: dopuszczalność trzech typów placówek w jednym zespole; zapis odbywa się przez API, nie jednym formularzem UI.

### STR-76 — Nadrzędna dla Zespołu szkół

Tryb: procedura G (`main`, `branch`), rzeczywisty zapis UI i odczyt API.

1. Otwiera profil kontekstowy `main` i wyszukuje `branch`.
2. Tworzy relację Zespół szkół z wyborem Nadrzędna.
3. Pobiera drzewo z profilu `branch`; wymaga jednej krawędzi.
4. Sprawdza, że rodzicem jest jednostka `branch`, dzieckiem `main`, a typem `1`.
5. Procedura G usuwa relację.

Zakres: semantyka hierarchii — odnosi się do wyszukanej szkoły. Nie sprawdza zmiany poziomu placówki na ZS ani generowania nowego ID zespołu.

### STR-77 — Nadrzędna dla Filii

Tryb: procedura G (`main`, `branch`), rzeczywisty zapis UI i odczyt API.

1. Na profilu `main` dodaje wyszukaną `branch` jako Filia / Nadrzędna.
2. Pobiera drzewo `branch` i wymaga jednej krawędzi.
3. Sprawdza rodzica `branch`, dziecko `main` i typ `2`.
4. Procedura G usuwa relację.

Zakres: wyszukana szkoła jest macierzysta; sama nazwa fixture `FILIA` nie determinuje jej roli.

### STR-78 — Nadrzędna dla Wielobudynkowości

Tryb: procedura G (`main`, `branch`), rzeczywisty zapis UI i odczyt API.

1. Na profilu `main` dodaje wyszukaną `branch` jako Wielobudynkowość / Nadrzędna.
2. Pobiera drzewo `branch` i wymaga jednej krawędzi.
3. Sprawdza rodzica `branch`, dziecko `main` i typ `3`.
4. Procedura G usuwa relację.

Zakres: zgodnie z doprecyzowaniem użytkownika wyszukana `branch` jest szkołą główną, kontekstowa `main` dodatkową lokalizacją.

### STR-79 — Zawieszona szkoła nie jest stroną nowej relacji

Tryb: rzeczywiste API i przygotowanie zawieszonej fixture przez UI; własne sprzątanie.

1. Przygotowuje `main` i ustala jej wewnętrzne ID.
2. Zapewnia dedykowaną `inactive`. Jeśli nie ma zapisanej zawieszonej fixture, tworzy/odnajduje ją, ustala ID i zawiesza przez Zawieś → Tak; zapisuje ten stan do ponownego użycia.
3. Usuwa wcześniejsze relacje drzewa `main`.
4. Próbuje dodać Filię `main` → `inactive` przez API.
5. Sprawdza odmowę przez `api.reject` i zero krawędzi drzewa `main`.
6. W `finally` ponownie sprząta graf `main`.

Zakres: faktycznie przygotowana zawieszona szkoła jako dziecko. Szkoła pozostaje zawieszona i nie jest odtwarzana przy każdym wykonaniu; przy użyciu cache zawieszenie nie jest ponownie wykonywane ani niezależnie sprawdzane w tym helperze. Nie sprawdza zawieszonego rodzica ani filtrowania wyników UI.

### STR-80 — Rzeczywiste zamówienie i anulowanie usuwania

Tryb: procedura G (`main`, `branch`), rzeczywiste API i UI, rzeczywiste zamówienie.

1. Tworzy Filię `main` → `branch` i zapamiętuje ID.
2. Otwiera Zamówienia `main`; zapamiętuje wszystkie obecne ID zamówień.
3. Tworzy nowe zamówienie z drugim produktem zestawu `physics7` i ilością `1`; zapamiętuje ID nowego zamówienia.
4. Otwiera Strukturę, klika śmietnik przy `branch` i wymaga widocznego potwierdzenia usuwania.
5. Klika Nie; przez API sprawdza zachowanie ID relacji.
6. Ponownie otwiera Zamówienia i sprawdza obecność ID nowego zamówienia.
7. W wewnętrznym `finally` usuwa zamówienia nieobecne w początkowym zbiorze i porównuje końcowe ID z początkowymi.
8. Procedura G usuwa relację.

Zakres: zwykłe potwierdzenie i anulowanie w obecności rzeczywistego zamówienia szkoły. Nie wymaga ostrzeżenia wymieniającego zamówienie, nie klika Tak i nie dowodzi, że zamówienie jest technicznie przypisane do rekordu tej konkretnej relacji. Nie sprawdza SI ani raportów.

### STR-81 — Cykl zamykający siedem poziomów

Tryb: procedura G (`main`, `branch`, `primary`, `nodeC`, `nodeD`, `nodeE`, `nodeF`), rzeczywiste API.

1. Ustawia maksymalny czas testu na 360 sekund.
2. Tworzy łańcuch siedmiu szkół, sześć krawędzi typu Filia, w wymienionej kolejności.
3. Próbuje dodać Filię `nodeF` → `main`, która zamknęłaby cykl.
4. Wymaga odmowy przez `api.reject`.
5. Wymaga nadal sześciu krawędzi w drzewie `main`.
6. Procedura G usuwa relacje.

Zakres: cykl długości siedem, nie dowód wykrywania cykli dowolnej długości ani sprawdzenie wizualizacji.

### STR-82 — Rzeczywisty zapis dwóch pozycji formularza

Tryb: procedura G (`group`, `main`, `primary`), rzeczywisty zapis UI i odczyt API.

1. Otwiera dialog na `group`.
2. Wyszukuje i dodaje `main` oraz `primary`, ustawiając obu Zespół szkół / Podrzędna.
3. Klika Zapisz i czeka na rzeczywistą odpowiedź POST.
4. Sprawdza udany status HTTP oraz dwie pozycje w treści tego żądania.
5. Wymaga zamkniętego dialogu.
6. Odczytuje drzewo `group` i sprawdza dwie aktywne krawędzie.
7. Procedura G usuwa relacje.

Zakres: dwupozycyjna paczka naprawdę dociera do serwera. Test nie liczy wszystkich żądań tak jak STR-19 ani nie porównuje tu osobno dokładnych stron obu odczytanych krawędzi.

### STR-83 — Niepoprawna pozycja blokuje całą paczkę

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje pusty graf.
2. Wysyła jeden POST z dwiema pozycjami: poprawną Filią `main` → `branch` i samopowiązaniem `main` → `main`.
3. Wymaga odmowy całego żądania przez `api.reject`.
4. Odczytuje drzewo `main` i wymaga zero krawędzi — również poprawna pozycja nie może zostać aktywnie zapisana.
5. Procedura G sprząta po próbie.

Zakres: atomowość aktywnego wyniku konkretnej paczki. Nie korzysta z formularza mimo jego wymienienia w nazwie i nie kontroluje rekordów/historycznych wpisów bezpośrednio w DB.

### STR-84 — Równoczesne dodanie tej samej pary

Tryb: procedura G (`main`, `branch`), rzeczywiste API.

1. Przygotowuje pusty graf.
2. Równocześnie wysyła dwie identyczne próby utworzenia Filii `main` → `branch`.
3. Czeka na zakończenie obu żądań.
4. Odczytuje drzewo `main` i wymaga dokładnie jednej aktywnej krawędzi.
5. Procedura G usuwa relację.

Zakres: brak dwóch aktywnych relacji po wyścigu zapisów. Nie sprawdza statusów ani treści obu odpowiedzi; nie wymaga, by jedna odpowiedź była sukcesem, a druga konkretnie konfliktem.

### STR-85 — Pokaż wszystkie w nowej karcie

Tryb: procedura G (`group`, `main`, `branch`), rzeczywiste API i UI.

1. Tworzy `group` → `main` jako Zespół szkół i `main` → `branch` jako Filię.
2. Otwiera Strukturę `group`.
3. Bez wcześniejszego użycia Pokaż zaznaczone klika Pokaż wszystkie.
4. Czeka na nową kartę, załadowanie dokumentu i tabelę wyników.
5. Dla `group`, `main` i `branch` sprawdza po jednym wyniku z odpowiednim ID.
6. Zamyka kartę w `finally`; procedura G usuwa relacje.

Zakres: obecność wszystkich trzech szkół niezależnie od STR-20. Nie sprawdza osobno braku dodatkowych, innych wyników ani ich kolejności.

### STR-86 — Historia dodania na profilu zespołu

Tryb: procedura G (`group`, `primary`), rzeczywiste API i UI, procedura H.

1. Odczytuje Historię zmian `group` przed operacją.
2. Tworzy relację Zespół szkół `group` → `primary` przez API.
3. Ponownie odczytuje historię zespołu.
4. Wykonuje wszystkie sprawdzenia H dla „Dodano Zespół szkół” i ID `primary`.
5. Procedura G usuwa relację.

Zakres: ścieżka historii zespołu, nie tylko zwykłej szkoły. Edycja, usunięcie i reaktywacja na historii zespołu nie są osobnymi wariantami tego testu.

### STR-87 — Ograniczenia po zmianie szkoły w dodatkową lokalizację

Tryb: procedura G (`main`, `branch`, `nodeC`), rzeczywiste API i UI; oczekiwana porażka.

1. Najpierw tworzy własną Filię `branch` → `nodeC`.
2. Następnie tworzy Wielobudynkowość `main` → `branch`, zmieniając rolę `branch` na dodatkową lokalizację.
3. Sprawdza przez API, że nadal istnieje jedna krawędź Filia do `nodeC`.
4. Na profilu `branch` klika komórkę edycji przy `nodeC` i zapisuje informację, czy otworzył się dialog.
5. Jeśli dialog się otworzył, klika Anuluj. Jeśli jest ostrzeżenie Uwaga, zamyka je przez OK.
6. Klika komórkę śmietnika przy `nodeC` i zapisuje informację, czy otworzył się modal usuwania.
7. Jeśli modal się otworzył, klika Nie — nie potwierdza usunięcia.
8. Sprawdza, że relacja Filia do `nodeC` nadal istnieje.
9. Włącza oczekiwaną porażkę i wymaga, aby obie zanotowane dostępności były `false`.
10. Procedura G usuwa przygotowane relacje, najpierw Wielobudynkowość.

Obecny DEV pozwala otworzyć oba dialogi; końcowe sprawdzenie nie przechodzi. Wszystkie robocze akcje są anulowane.

Zakres: dostępność dialogów w niedozwolonym kontekście po zmianie roli. Nie zapisuje edycji ani nie potwierdza usunięcia, więc nie dowodzi, że backend zaakceptowałby takie operacje. W przeciwieństwie do STR-65 chodzi o wcześniej istniejącą własną filię dodatkowej lokalizacji.

## STR-88–STR-106 — struktura podczas tworzenia nowej szkoły

### Wspólna procedura N — nowy formularz i sprzątanie

`withNewSchool` używa oddzielnych szkół `addBranch`, `addMain`, `addGroup`, z nazwami `AUTO_STR_<ŚRODOWISKO>_DODAWANIE_FILIA`, `..._GLOWNA`, `..._ZESPOL`. Nie współdzieli relacji z testami istniejącego profilu.

1. Przygotowuje wskazane istniejące szkoły testowe, rozwiązuje ich ID przez API i czyści ich aktywne relacje.
2. Otwiera prawdziwy formularz nowej szkoły; wypełnia unikalną nazwę `AUTO_STR_<ŚRODOWISKO>_ADD_<czas>_<losowy fragment>`, typ i adres z unikalnym numerem.
3. Wykonuje scenariusz. „Zapisz” w wewnętrznym dialogu struktury tylko przekazuje plan do formularza szkoły; nie jest tym samym co zapis istniejącej relacji.
4. Jeśli scenariusz wywoła rzeczywisty zapis szkoły, sprawdza udany HTTP, zamknięcie formularza, profil z nowym ID i jedno żądanie tworzenia szkoły. Oznacza rekord jako Testowy i jednoznacznie odczytuje go przez API.
5. Zapisuje ID, nazwę, środowisko i status sprzątania w `runs/<nazwa>.json`; pliki są lokalne, ignorowane przez Git. Po teście dołącza też dane nowej szkoły do raportu.
6. W `finally` usuwa relacje między własnymi danymi i wymaga pustego aktywnego grafu. Jeśli zapis przerwał się po nawigacji na nowy profil, próbuje odzyskać ID z URL po sprawdzeniu nazwy.
7. Nie usuwa nowej szkoły: projekt nie ma potwierdzonej obsługi jej usuwania. Siedem pozytywnych scenariuszy STR-90–STR-96 tworzy siedem szkół przy pełnym wykonaniu nowego pliku; są oznaczone i pozostają bez relacji. Testy roboczych formularzy i symulowanych błędów nie tworzą nowych szkół.

### STR-88 — Dostępność struktury przed nadaniem ID

Tryb: UI, bez zapisu szkoły.

1. Otwiera Dodaj nową szkołę i wpisuje unikalną nazwę; nie zapisuje profilu.
2. Klika Dodaj powiązanie w formularzu szkoły.
3. Sprawdza widoczny dialog struktury i pięć pól wyszukiwania: ID, nazwa, kod, miejscowość, ulica.
4. Wymaga zero komórek danych w dolnej tabeli.
5. Anuluje wewnętrzny dialog i wymaga nadal widocznego formularza szkoły; następnie anuluje także szkołę.

Zakres: zagnieżdżony dialog dostępny już dla niezapisanej szkoły. Nie sprawdza wszystkich nagłówków ani wszystkich pól szkoły.

### STR-89 — Wewnętrzny zapis odkłada plan

Tryb: UI i symulowany HTTP 422 końcowego zapisu; bez nowej szkoły.

1. Przygotowuje istniejącą `addBranch` oraz kompletny, nowy formularz szkoły.
2. Przechwytuje żądania tworzenia szkoły i zapisu relacji; ewentualnym zapisom zwraca 422.
3. W wewnętrznym dialogu wybiera `addBranch` jako Filię / Podrzędna i klika Zapisz.
4. Wymaga zamknięcia tylko wewnętrznego dialogu i nadal widocznego formularza szkoły.
5. Sprawdza zero przechwyconych żądań — struktura nie została jeszcze wysłana do serwera.
6. Ponownie otwiera strukturę i sprawdza jeden wiersz `addBranch`; anuluje.
7. Klika Zapisz w formularzu szkoły, czeka na odpowiedź tworzenia i sprawdza jedno przechwycone żądanie. Jego treść dołącza do raportu.

Zakres: przechowanie planu i odroczenie zapisu, nie rzeczywista trwałość. Nie wymaga umieszczenia relacji w JSON `AddNewInstitution`; aplikacja może wysłać je osobno po udanym utworzeniu szkoły.

### STR-90 — Nowa szkoła jako rodzic Filii

Tryb: procedura N (`addBranch`), rzeczywisty zapis UI i odczyt API.

1. Przygotowuje nową szkołę podstawową.
2. W strukturze wybiera istniejącą `addBranch`, typ Filia i Podrzędna; akceptuje plan.
3. Zapisuje nową szkołę i sprawdza jedno żądanie jej tworzenia.
4. Wymaga jednej krawędzi: nowa jednostka → `addBranch`, typ `2`.
5. Sprawdza identyczne krawędzie w odczycie z obu profili.
6. Na Strukturze nowej szkoły wymaga jednego wiersza `addBranch`.
7. Procedura N usuwa relację i zachowuje oznaczoną szkołę.

### STR-91 — Nowa szkoła jako dziecko Filii

Tryb: procedura N (`addMain`), rzeczywisty zapis UI i odczyt API.

1. Przygotowuje nową szkołę podstawową.
2. Wybiera istniejącą `addMain`, typ Filia i Nadrzędna; akceptuje plan.
3. Zapisuje szkołę; wymaga jednej krawędzi `addMain` → nowa szkoła, typ `2`.
4. Porównuje krawędzie z obu profili i sprawdza wiersz `addMain` w Strukturze nowej szkoły.
5. Procedura N sprząta relację.

Zakres: Nadrzędna odnosi się do wyszukanej szkoły, nie do tworzonego profilu.

### STR-92 — Nowa szkoła jako członek istniejącego zespołu

Tryb: procedura N (`addGroup`), rzeczywisty zapis UI i odczyt API.

1. Przygotowuje nową szkołę podstawową.
2. Wybiera istniejący `addGroup`, typ Zespół szkół i Nadrzędna; akceptuje plan.
3. Zapisuje szkołę; wymaga jednej krawędzi `addGroup` → nowa szkoła, typ `1`.
4. Porównuje krawędzie z obu profili i sprawdza wiersz zespołu w Strukturze nowej szkoły.
5. Procedura N sprząta relację.

### STR-93 — Nowy zespół od razu ze szkołą podrzędną

Tryb: procedura N (`addBranch`), rzeczywisty zapis UI i odczyt API.

1. W formularzu nowej placówki wybiera typ szkoły Zespół szkół.
2. W strukturze wybiera `addBranch`, typ relacji Zespół szkół i Podrzędna; akceptuje plan.
3. Zapisuje zespół; wymaga jednej krawędzi nowy zespół → `addBranch`, typ `1`.
4. Porównuje krawędzie z obu profili i sprawdza wiersz szkoły w Strukturze zespołu.
5. Procedura N sprząta relację i pozostawia testowy zespół.

Zakres: zapis powiązania przy tworzeniu zespołu. Format trzycyfrowego ID nadal jest osobnym wymaganiem STR-38.

### STR-94 — Nowa szkoła z dodatkową lokalizacją

Tryb: procedura N (`addBranch`), rzeczywisty zapis UI i odczyt API.

1. Przygotowuje nową szkołę podstawową.
2. Wybiera `addBranch`, Wielobudynkowość i Podrzędna; akceptuje plan.
3. Zapisuje szkołę; wymaga jednej krawędzi nowa szkoła → `addBranch`, typ `3`.
4. Porównuje krawędzie z obu profili i sprawdza wiersz lokalizacji na nowym profilu.
5. Procedura N sprząta relację.

### STR-95 — Nowa szkoła jako dodatkowa lokalizacja

Tryb: procedura N (`addMain`), rzeczywisty zapis UI i odczyt API.

1. Przygotowuje nową szkołę podstawową.
2. Wybiera `addMain`, Wielobudynkowość i Nadrzędna; akceptuje plan.
3. Zapisuje szkołę; wymaga jednej krawędzi `addMain` → nowa szkoła, typ `3`.
4. Porównuje krawędzie z obu profili i sprawdza wiersz `addMain` na nowym profilu.
5. Procedura N sprząta relację.

Zakres: wyszukana szkoła staje się główną, nowa jest dodatkową lokalizacją. Ograniczenia edycji innych relacji sprawdzają STR-65/87.

### STR-96 — Dwie relacje razem z nową szkołą

Tryb: procedura N (`addBranch`, `addMain`), rzeczywisty zapis UI i odczyt API.

1. Przygotowuje nową szkołę podstawową.
2. W jednym wewnętrznym dialogu dodaje obie istniejące szkoły jako Filia / Podrzędna i akceptuje plan.
3. Zapisuje nową szkołę jednym żądaniem jej tworzenia.
4. Wymaga dokładnie dwóch krawędzi API, zawierających obie oczekiwane Filie z nową jednostką jako rodzicem.
5. W Strukturze nowego profilu sprawdza po jednym wierszu obu szkół.
6. Procedura N usuwa obie relacje.

Zakres: kompletność dwóch poprawnych powiązań. Nie sprawdza atomowości częściowo niepoprawnej paczki podczas tworzenia szkoły.

### STR-97 — Anulowanie wewnętrznego dialogu

Tryb: procedura N (`addBranch`), UI; bez zapisu nowej szkoły.

1. Dodaje roboczo `addBranch` jako Filię / Podrzędna.
2. Klika Anuluj w strukturze, nie Zapisz.
3. Wymaga widocznego formularza szkoły i zachowanej nazwy.
4. Ponownie otwiera strukturę i wymaga pustej dolnej tabeli.
5. Anuluje oba formularze; procedura N potwierdza brak relacji.

### STR-98 — Anulowanie szkoły po zaakceptowaniu struktury

Tryb: procedura N (`addBranch`), UI z przechwyceniem ewentualnych zapisów.

1. Przygotowuje Filię / Podrzędna i akceptuje wewnętrzny plan przez Zapisz.
2. Klika Anuluj w formularzu szkoły.
3. Sprawdza zero żądań tworzenia szkoły/zapisu relacji.
4. Sprawdza pusty graf istniejącej szkoły.
5. Wyszukuje unikalną nazwę nowej szkoły i wymaga komunikatu braku wyników oraz pustej tabeli.
6. Procedura N potwierdza czysty stan.

Zakres: zaakceptowany lokalnie plan nie pozostawia szkoły ani relacji po anulowaniu nadrzędnego formularza.

### STR-99 — Usunięcie zaakceptowanej pozycji przed zapisem szkoły

Tryb: procedura N (`addBranch`), UI; bez zapisu nowej szkoły.

1. Dodaje Filię / Podrzędna i akceptuje plan.
2. Ponownie otwiera strukturę i usuwa wiersz `addBranch` ikoną roboczego usuwania.
3. Akceptuje zmieniony, pusty plan.
4. Otwiera strukturę ponownie i wymaga braku wiersza tej szkoły.
5. Anuluje formularze; procedura N potwierdza brak aktywnych relacji.

### STR-100 — Duplikat w planie nowej szkoły

Tryb: procedura N (`addBranch`), UI; bez zapisu nowej szkoły.

1. Dodaje `addBranch` jako Filię / Podrzędna.
2. Ponownie wyszukuje tę samą szkołę; jeśli jest dostępna w górnej tabeli, ponownie klika Dodaj.
3. Wymaga dokładnie jednego dolnego wiersza tej szkoły.
4. Akceptuje plan, otwiera go ponownie i znów wymaga jednego wiersza.
5. Anuluje formularze; procedura N potwierdza czysty graf.

Zakres: zabezpieczenie roboczej listy, nie dwa konkurujące rzeczywiste zapisy nowej szkoły.

### STR-101 — Puste wyszukiwanie w zagnieżdżonym dialogu

Tryb: UI; bez zapisu szkoły i relacji.

1. Otwiera pusty formularz nowej szkoły i dialog struktury.
2. Klika Szukaj bez kryteriów.
3. Wymaga „Wyszukiwanie nie może być puste” i zamyka ostrzeżenie przez OK.
4. Wymaga nadal widocznego dialogu struktury; anuluje go.
5. Wymaga nadal widocznego formularza szkoły; anuluje także szkołę.

### STR-102 — Zmiana zaakceptowanego typu i hierarchii

Tryb: procedura N (`addBranch`), UI; bez zapisu nowej szkoły.

1. Dodaje i akceptuje Filię / Podrzędna.
2. Ponownie otwiera plan i zmienia typ na Wielobudynkowość, hierarchię na Nadrzędna.
3. Akceptuje zmiany lokalne.
4. Otwiera plan trzeci raz i sprawdza te dwa teksty w komórkach wiersza.
5. Anuluje oba formularze; procedura N sprząta.

Zakres: zachowanie zmienionego lokalnego planu. Rzeczywisty zapis kierunków i typów jest w STR-90–STR-95.

### STR-103 — Struktura nie zastępuje obowiązkowej nazwy szkoły

Tryb: procedura N (`addBranch`), UI z przechwyceniem ewentualnych zapisów.

1. Przygotowuje kompletną szkołę i akceptuje plan Filii / Podrzędna.
2. Czyści nazwę szkoły.
3. Jeśli Zapisz jest aktywne, próbuje kliknąć; nieaktywny przycisk także jest poprawną blokadą.
4. Wymaga nadal widocznego formularza i zero przechwyconych żądań tworzenia/zapisu.
5. Anuluje szkołę; procedura N potwierdza czysty graf.

Zakres: wymagane pole nazwy. Brak typu i adresu w połączeniu ze strukturą nie jest osobnym wariantem tego testu.

### STR-104 — Odmowa 422 tworzenia szkoły bez osieroconej relacji

Tryb: procedura N (`addBranch`), prawdziwy odczyt API, symulowana odmowa tworzenia szkoły.

1. Przechwytuje tworzenie szkoły i zwraca HTTP 422; osobno liczy i blokuje ewentualny zapis relacji.
2. Przygotowuje i akceptuje plan Filii / Podrzędna.
3. Klika Zapisz szkołę i czeka na odpowiedź jej tworzenia.
4. Wymaga braku nowego profilu, zamknięcia formularza zgodnie z obecnym kontraktem testów dodawania szkoły oraz zero prób zapisu relacji.
5. Sprawdza pusty graf istniejącej szkoły i brak nowej szkoły przy wyszukaniu unikalnej nazwy.
6. Procedura N sprząta.

Zakres: brak osieroconego zapisu po odmowie tworzenia szkoły. Nie sprawdza zachowania roboczego formularza po błędzie. To inny formularz i inny endpoint niż STR-49, który wymaga zachowania dialogu edycji struktury istniejącej szkoły.

### STR-105 — Błąd 500 tworzenia szkoły bez osieroconej relacji

Tryb: procedura N (`addBranch`), UI i rzeczywisty odczyt, symulowany HTTP 500.

1. Przechwytuje tworzenie szkoły i zwraca 500; ewentualny zapis relacji liczy i blokuje.
2. Dodaje i akceptuje plan Filii / Podrzędna.
3. Próbuje zapisać szkołę i czeka na odpowiedź.
4. Wymaga zamkniętego formularza, pozostania na panelu bez ID i zero prób zapisu relacji.
5. Sprawdza pusty graf i brak szkoły po nazwie; procedura N sprząta.

Zakres: brak nowego profilu i relacji, nie ponowienie zapisu po awarii ani odporność rzeczywistego serwera na częściowy zapis.

### STR-106 — Timeout tworzenia szkoły bez osieroconej relacji

Tryb: procedura N (`addBranch`), UI i rzeczywisty odczyt, symulowany timeout.

1. Przechwytuje żądanie tworzenia szkoły i przerywa je z `timedout`; ewentualny zapis relacji liczy i blokuje.
2. Dodaje i akceptuje plan Filii / Podrzędna.
3. Próbuje zapisać szkołę i czeka na zdarzenie nieudanego żądania tworzenia.
4. Wymaga zamkniętego formularza, panelu bez nowego ID i zero prób zapisu relacji.
5. Sprawdza pusty graf i brak szkoły po nazwie; procedura N sprząta.

Zakres: przerwanie żądania przed kontaktem z serwerem. Nie symuluje timeoutu po faktycznym zapisaniu szkoły przez serwer ani nie certyfikuje atomowości obu backendowych operacji.

## Zasady interpretacji wyników i dalsze działania

1. Działający test potwierdza wyłącznie opisane sprawdzenia, nie całą funkcjonalność wymienioną w jego nazwie.
2. Brak dostępu do DB oznacza, że nie potwierdzamy bezpośrednio `is_Del`, schematu, migracji ani pełnego technicznego audytu. Ponowne dodanie tego samego ID relacji i brak aktywnego wiersza to obserwacje API/UI.
3. Konto jest jedno, z pełnymi uprawnieniami; brak uprawnień, read-only i osobne przywracanie DPD nie są tutaj wykonywane.
4. Testy 73/74 symulują odmowę dla procesu. STR-80 używa rzeczywistego zamówienia szkoły, ale nie certyfikuje backendowego przypisania procesu do konkretnej relacji. Rzeczywiste SI i raporty nie są przygotowywane.
5. Dla oczekiwanej porażki należy sprawdzić, w którym kroku faktycznie wystąpił błąd. Po poprawce produktu należy uruchomić cały dany test, usunąć `test.fail` i potwierdzić zwykłe przejście.
6. STR-51 wymaga najpierw decyzji o kontrakcie równoczesnej edycji; pozostałe znane niezgodności i priorytety opisuje [plan Struktury](struktura-szkoly.md#10-potwierdzone-niezgodności-dev-i-kolejne-poprawki-produktu).

## Pliki źródłowe

- [Testy STR-01–STR-87](../../tests/szkola-struktura.spec.ts).
- [Testy STR-88–STR-106 podczas dodawania szkoły](../../tests/szkola-struktura-dodawanie.spec.ts).
- [Obsługa formularzy, odczytu relacji i historii](../../tests/support/school-structure.ts).
- [Rzeczywiste API i sprzątanie grafu](../../tests/support/school-structure-api.ts).
- [Przygotowanie dedykowanych szkół](../../tests/support/school-structure-data.ts).
- [Dane szkół referencyjnych](../../tests/support/school-medal-data.ts).
- [Przygotowanie zamówienia](../../tests/support/order-scenario.ts).
