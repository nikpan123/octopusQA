# Pokrycie projektu testami

Dokument przedstawia funkcjonalności objęte automatyzacją oraz obszary, które nadal wymagają testów. Stan został ustalony na podstawie aktualnego kodu, [indeksu 365 scenariuszy](tests/scenario-index.md) i dokumentacji domenowej.

## Jak interpretować ocenę

Projekt nie posiada kompletnego, wersjonowanego katalogu wymagań biznesowych, dlatego dokument nie podaje sztucznego procentu pokrycia. Liczba scenariuszy mówi o skali automatyzacji, ale nie dowodzi pokrycia wszystkich wymagań.

Stosowane poziomy:

| Poziom             | Znaczenie                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| Szerokie           | istnieją testy pozytywne, negatywne, trwałości, historii lub integracji API/UI |
| Częściowe          | podstawowy przepływ jest chroniony, ale istnieją istotne, zidentyfikowane luki |
| Operacyjne         | test wymaga określonego terminu, danych lub działania poza automatem           |
| Brak potwierdzenia | w aktualnym indeksie nie znaleziono scenariusza potwierdzającego zachowanie    |

## Podsumowanie

| Obszar                    |                  Liczba wykonań | Ocena      | Najważniejsze pokrycie                                              | Najważniejsza luka                                                                 |
| ------------------------- | ------------------------------: | ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Nauczyciele               |        83 + scenariusze wspólne | Szerokie   | dodawanie, edycja, kontakty, adres, notatki, RODO, historia         | uprawnienia, awarie API i równoczesna edycja                                       |
| Szkoły — dodawanie        |        57 + scenariusze wspólne | Szerokie   | typy, adres, kontakty, identyfikatory, walidacje, 422/500/timeout   | granice długości, część walidacji formatów i błędy wyszukiwania adresu             |
| Szkoły — edycja           |                              33 | Szerokie   | dane podstawowe, adres, telefon, SIO, historia, 422/500/timeout     | walidacje graniczne, retry, podwójny zapis, konflikty i uprawnienia                |
| Relacja szkoła–nauczyciel | kilka scenariuszy przekrojowych | Częściowe  | jedna i wiele szkół, widok z obu stron, trwałość relacji            | usuwanie istniejącej relacji, duplikaty i konflikty równoległe                     |
| Klubowiczostwo            |                              72 | Szerokie   | klasy, lata, szkoły, przedmioty, historia, usuwanie, restore, WSPOM | błędy API, uprawnienia, pełny kontrakt słowników i wysyłka e-mail                  |
| Zamówienia szkoły         |                              66 | Szerokie   | produkty, filtry, ilości, zapis, edycja, izolacja, załączniki       | błędy sieciowe, pobieranie załączników, uprawnienia i konflikty wielu użytkowników |
| Medalowość szkoły         |                              42 | Szerokie   | UI/API, tooltip, historia, filtry, progi i duplikaty przedmiotów    | błędy API, role oraz niezależne wymuszenie przeliczenia                            |
| Medalowość roczna         |                               2 | Operacyjne | snapshot przed jobem i porównanie po jobie na DEV/TEST              | automat nie uruchamia joba ani nie kontroluje daty systemowej                      |
| Infrastruktura testowa    |   testy jednostkowe i reportery | Częściowe  | sesja, cleanup, diagnostyka błędów, performance                     | brak testów panelu jako osobnej aplikacji i brak progów wydajności                 |

Łączna liczba **365** obejmuje 363 testy zwykłej regresji i dwa testy rocznego workflow.

## 1. Nauczyciele

Dokumentacja domenowa: [nauczyciele.md](tests/nauczyciele.md).

### Pokryte

- utworzenie minimalnego nauczyciela z e-mailem albo telefonem;
- wymagane imię, nazwisko, szkoła i co najmniej jeden kontakt;
- źródło rekordu oraz kombinacje zgód RODO;
- jedna lub wiele szkół;
- jeden lub wiele przedmioto-poziomów;
- blokowanie duplikatu przedmioto-poziomu;
- ostrzeżenie przy braku przedmioto-poziomu;
- podobna osoba oraz zajęty adres e-mail;
- walidacja długości telefonu i przyszłej daty urodzenia;
- anulowanie tworzenia bez pozostawienia rekordu i relacji;
- edycja imienia, nazwiska, daty urodzenia i adresu prywatnego;
- dodawanie, zmiana i usuwanie e-maila oraz telefonów;
- maksymalnie dwa numery telefonów;
- notatki, limit 220 znaków i pusta notatka;
- archiwizacja i odczyt bieżącego stanu;
- zależności zgód Marketing, E-mail i Telefon;
- anulowanie zmian bez zmiany danych i historii;
- wpisy historii: pole, wartość, źródło, autor i data;
- trwałość relacji po edycji i nawigacji do szkoły.

### Wymaga pokrycia lub potwierdzenia wymagań

- zachowanie dla różnych ról i użytkownika bez uprawnień do dodawania lub edycji;
- kontrolowane błędy 4xx/5xx i timeouty podczas tworzenia oraz zapisu edycji;
- równoczesna edycja tego samego nauczyciela w dwóch sesjach;
- pełne filtrowanie, sortowanie i paginacja wyszukiwarki nauczycieli;
- usuwanie całego rekordu nauczyciela z poziomu UI, jeżeli taka funkcja jest częścią produktu;
- walidacje graniczne długości imienia, nazwiska, e-maila, adresu i notatki poza obecnym limitem;
- zachowanie sesji użytkownika podczas długiego formularza lub wygaśnięcia JWT w trakcie zapisu.

## 2. Dodawanie szkoły

Dokumentacja domenowa: [dodawanie-szkoly.md](tests/dodawanie-szkoly.md).

### Pokryte

- minimalny poprawny formularz oraz oznaczenie rekordu jako testowego;
- wymagane pola: nazwa, typ i adres;
- siedem obsługiwanych typów szkoły i wynikający z nich poziom;
- trwałość nazwy, typu, poziomu i adresu po ponownym otwarciu;
- wyszukiwanie szkoły po unikalnej nazwie;
- kod pocztowy, miejscowość, ulica i numer budynku;
- nieznany kod pocztowy, numer z literą i separatorem;
- czyszczenie, zastępowanie i anulowanie zmiany adresu;
- nazwa z polskimi znakami, interpunkcją i normalizacją spacji;
- duplikaty tej samej nazwy i adresu oraz tej samej nazwy pod innym adresem;
- nazwa SIO, liczba uczniów, RSPO, REGON i NIP;
- wiodące zera w REGON i NIP;
- WWW, e-mail, telefon komórkowy i stacjonarny;
- błędny e-mail i niepełny telefon;
- pełny formularz, puste pola opcjonalne i anulowanie;
- dwa szybkie kliknięcia zapisu;
- kontrolowane błędy HTTP 422 i 500 oraz timeout przy zapisie.

### Wymaga pokrycia

- minimalna i maksymalna długość nazwy oraz nazwa przekraczająca limit;
- niepoprawne formaty i wartości graniczne RSPO, REGON, NIP oraz liczby uczniów;
- kod pocztowy zwracający wiele miejscowości;
- zmiana kodu po wyborze miejscowości;
- zmiana wybranej miejscowości;
- opcjonalny numer lokalu;
- błąd lub timeout wyszukiwania adresu;
- ponowienie zapisu po kontrolowanym błędzie lub timeoucie;
- zachowanie danych formularza po błędzie, jeżeli stanie się częścią kontraktu produktu;
- role i uprawnienia do tworzenia szkoły.

## 3. Edycja szkoły

Dokumentacja domenowa: [edycja-szkoly.md](tests/edycja-szkoly.md).

### Pokryte

- wczytanie bieżącej nazwy;
- zapis i anulowanie zmiany nazwy;
- edycja WWW, e-maila i nazwy SIO;
- usuwanie oraz rezygnacja z usunięcia wartości opcjonalnych;
- normalizacja e-maila i spacji w nazwie;
- polskie znaki i interpunkcja;
- pusta nazwa jako błąd walidacji;
- readonly typu i poziomu dla wszystkich siedmiu typów szkół;
- kolejne edycje różnych pól bez nadpisania wcześniejszych zmian.
- trwała zmiana adresu;
- dodanie drugiego telefonu i przełączenie typu komórkowy/stacjonarny;
- trwała zmiana liczby uczniów, RSPO, REGON i NIP;
- kompletny wpis historii zmiany nazwy;
- brak utrwalenia zmiany po kontrolowanych odpowiedziach 422, 500 i timeoucie.

### Wymaga dalszego pokrycia

- usuwanie lub zastępowanie istniejącego telefonu;
- walidacje graniczne danych SIO podczas edycji;
- dwa szybkie kliknięcia `Zapisz`;
- ponowienie zapisu po błędzie;
- konflikt równoczesnej edycji;
- role i uprawnienia.

## 4. Relacje szkoła–nauczyciel

Dokumentacja domenowa: [relacje-szkola-nauczyciel.md](tests/relacje-szkola-nauczyciel.md).

### Pokryte

- utworzenie nauczyciela z relacją do szkoły;
- widoczność szkoły na karcie nauczyciela;
- widoczność nauczyciela w paginowanej tabeli szkoły;
- dodanie drugiej szkoły bez utraty pierwszej relacji;
- utworzenie nauczyciela z dwiema szkołami;
- usunięcie szkoły z formularza przed zapisaniem nauczyciela;
- anulowanie tworzenia bez pozostawienia relacji;
- trwałość relacji po zmianie danych nauczyciela;
- historia dodania szkoły.

### Wymaga pokrycia

- usunięcie istniejącej relacji z zapisanego nauczyciela;
- ponowne dodanie wcześniej usuniętej relacji;
- próba dodania tej samej szkoły drugi raz;
- konflikt, gdy relacja jest modyfikowana równolegle;
- zachowanie po archiwizacji nauczyciela lub szkoły;
- role i uprawnienia widoku relacji.

## 5. Klubowiczostwo nauczyciela

Dokumentacja domenowa: [klubowiczostwo-nauczyciela.md](tests/klubowiczostwo-nauczyciela.md).

### Pokryte

- tworzenie, edycja, anulowanie, logiczne usuwanie i przywracanie formularza;
- trwałość i historia zmian;
- wybór szkoły, roku, przedmiotu, poziomu i klas;
- klasy NASZE i OBCE oraz ich wzajemne blokowanie;
- wydawnictwo wymagane dla klasy OBCEJ;
- warianty Matematyki SP i SŚ, Fizyki oraz Języka polskiego;
- serie Fizyki i dwie serie klasy 4 Języka polskiego;
- zaznaczanie i odznaczanie wszystkich klas;
- niezależność szkół, przedmiotów i lat szkolnych;
- blokowanie duplikatów oraz konflikty przywracania;
- weryfikacja negatywna i powrót klasy do statusu NASZ;
- mieszany cykl życia wielu potwierdzeń;
- formularz WSPOM, funkcja nauczyciela wspomagającego i wiele przedmiotów;
- współistnienie zwykłego potwierdzenia oraz WSPOM;
- dwa szybkie kliknięcia zapisu bez utworzenia duplikatu.

### Wymaga pokrycia lub decyzji produktowej

- pełny kontrakt wszystkich przedmiotów i poziomów ze słownika, a nie tylko reprezentatywnych kombinacji;
- zmiana słowników klas i wydawnictw po stronie API;
- kontrolowane błędy 4xx/5xx oraz timeouty zapisu, usuwania, restore i historii;
- równoczesna edycja lub weryfikacja tego samego potwierdzenia w dwóch sesjach;
- role i uprawnienia do edycji, usuwania, przywracania oraz weryfikacji;
- wysyłka i treść e-maila do nauczyciela — testy celowo wyłączają wysyłkę;
- zachowanie dla większej liczby szkół i bardzo rozbudowanej historii.

## 6. Zamówienia szkoły

Dokumentacja domenowa: [zamowienia-szkoly.md](tests/zamowienia-szkoly.md).

### Pokryte

- otwieranie i anulowanie formularza;
- słowniki przedmiotu, poziomu i klas;
- wyszukiwanie produktów po kodzie i filtrach;
- reset filtrów i kolejne wyszukiwania;
- przenoszenie jednego lub wielu produktów pomiędzy listami;
- brak duplikatu produktu i trwałość wyboru po zmianie filtrów;
- edycja ilości w AG Grid, `Tab`, zero, wartość ujemna i pusta wartość;
- zapis pustego i poprawnego zamówienia;
- zabezpieczenie przed dwukrotnym zapisem;
- unikalne ID, izolacja szkół, edycja, usuwanie i reload;
- jeden lub wiele załączników PDF, JPG i PNG;
- odrzucenie WEBP, TXT i pliku większego niż 10 MB;
- akceptacja pliku dokładnie 10 MB;
- usuwanie załączników i trwałość po ponownym otwarciu;
- wskaźnik załącznika na liście;
- cleanup zamówień po teście;
- izolacja danych dla dwóch workerów.

### Wymaga pokrycia

- błędy i timeouty wyszukiwania produktów, zapisu, edycji, usuwania oraz uploadu;
- ponowienie operacji po błędzie sieciowym;
- pobieranie lub otwieranie zapisanego załącznika i weryfikacja jego zawartości;
- duplikat nazwy pliku, nazwy bardzo długie i znaki specjalne;
- maksymalna liczba załączników oraz łączny limit rozmiaru, jeśli istnieją;
- konflikt edycji lub usunięcia tego samego zamówienia przez dwóch użytkowników;
- role i uprawnienia;
- duże zamówienia i zachowanie tabeli przy wielu produktach;
- jawne kryteria czasu odpowiedzi — obecnie czasy są mierzone, ale nie stanowią asercji.

## 7. Medalowość szkoły

Dokumentacja domenowa: [medalowosc-szkoly.md](tests/medalowosc-szkoly.md).

### Pokryte

- wartości Złoto, Srebro, Brąz i Brak;
- pole readonly oraz tooltip z przedmiotami;
- zgodność medalu w panelu, wynikach wyszukiwania i API;
- brak tooltipa i pusta lista przedmiotów dla `Brak`;
- historia: wartość, autor, źródło, data i kolejność;
- maksymalnie jeden wpis na sezon;
- filtrowanie po pojedynczym medalu i multiselect;
- priorytet wyszukiwania po ID nad filtrem medalu;
- progi: 0/1/2/3+ unikalnych przedmiotów;
- brak duplikatów przedmiotów;
- wielu nauczycieli tego samego przedmiotu nie zwiększa liczby przedmiotów medalowych;
- nauczyciel bez kwalifikującego klubowiczostwa nie wpływa automatycznie na medal;
- większy zbiór wyników dla każdej kategorii.

### Wymaga pokrycia

- kontrolowane błędy i timeouty API medalu, historii i wyszukiwarki;
- zachowanie przy częściowej lub niepoprawnej odpowiedzi API;
- role i uprawnienia do odczytu danych medalowych;
- zmiana danych wejściowych i przeliczenie pojedynczej szkoły w izolowanym teście, jeśli powstanie wspierany endpoint;
- bardzo długa historia i graniczne zachowanie wirtualizowanej listy;
- jednoznaczny kontrakt strefy czasowej dla daty 1 października.

## 8. Roczna medalowość

Dokumentacja domenowa: [medalowosc-roczna.md](tests/medalowosc-roczna.md).

### Pokryte

- wyliczenie oczekiwanego medalu na podstawie nauczycieli i klubowiczostwa;
- kwalifikacja przedmiotów, rezygnacja na przyszły rok i nauczyciel wspomagający;
- osobne snapshoty DEV oraz TEST;
- losowanie szkół i pula rezerwowa;
- zamrożenie danych przed jobem;
- porównanie medalu oczekiwanego z wynikiem po jobie;
- diagnostyka rozbieżności per szkoła i nauczyciel.

### Ograniczenia i brakujące pokrycie

- test nie uruchamia joba;
- test nie zmienia ani nie kontroluje daty systemowej;
- nie ma testowego endpointu przeliczenia pojedynczej szkoły;
- wiarygodność zależy od niezmieniania danych pomiędzy PREP a jobem;
- cały cykl nie jest samodzielnym testem możliwym do uruchomienia o dowolnej porze;
- nie ma automatycznej weryfikacji zachowania joba przy częściowym błędzie, ponowieniu lub przerwaniu.

## 9. Infrastruktura testowa

### Pokryte

- lokalna kontrola ważności JWT;
- logowanie z GitLabem oraz bez dodatkowego formularza GitLaba;
- oddzielne sesje DEV i TEST;
- odtwarzanie `sessionStorage` tylko dla Octopusa;
- odświeżanie sesji synchronizowane między workerami;
- blokada równoległego uruchomienia dla środowiska;
- bezpieczny cleanup nauczycieli, weryfikacja danych i batchowanie DELETE;
- idempotentny brak rekordu i potwierdzenie usunięcia;
- zachowanie danych po nieudanym teście;
- raport czasu i liczników HTTP;
- screenshot i trace przy failure;
- klasyfikacja błędów Playwrighta;
- osobne raporty HTML i historia panelu.

### Wymaga pokrycia

- automatyczne testy endpointów i renderowania lokalnego Test Runner UI;
- pełny test integracyjny reportera błędów z rzeczywistym, kontrolowanie nieudanym testem Playwrighta;
- scenariusze uszkodzonego lub częściowo zapisanego pliku sesji;
- zachowanie blokady po awarii procesu i przy kilku hostach;
- retencja oraz automatyczne sprzątanie starych raportów i artefaktów;
- progi wydajności powodujące failure, nie tylko zbieranie metryk;
- automatyczne sprawdzanie dokumentacji w CI.

## 10. Luki przekrojowe

W aktualnym zestawie nie znaleziono systematycznego pokrycia następujących klas ryzyka:

1. **Role i uprawnienia** — większość testów działa na jednym koncie z szerokimi prawami.
2. **Przeglądarki i urządzenia** — konfiguracja obejmuje Desktop Chrome/Chromium; brak Firefox, WebKit, urządzeń mobilnych i responsywności.
3. **Dostępność** — brak automatycznych testów klawiatury, nazw dostępności i kontrastu jako kompletnego audytu WCAG.
4. **Odporność sieciowa** — tworzenie i edycja szkoły mają macierz 4xx/5xx/timeout, ale pozostałe moduły oraz retry nadal nie są pokryte systematycznie.
5. **Współbieżność użytkowników** — zabezpieczenie przed podwójnym kliknięciem jest testowane, lecz nie konflikty dwóch niezależnych sesji.
6. **Bezpieczeństwo aplikacji** — brak testów autoryzacji obiektowej, dostępu bez sesji i separacji ról; powinny być projektowane z zespołem bezpieczeństwa.
7. **Wydajność kontraktowa** — metryki są zbierane, ale brak zaakceptowanych progów czasu i obciążenia.
8. **Wizualna regresja** — brak snapshotów wizualnych i kontroli układu.
9. **Cleanup szkół** — brak wspieranego endpointu powoduje pozostawianie rekordów testowych.

## 11. Rekomendowany backlog

Priorytety są rekomendacją QA i wymagają potwierdzenia z właścicielem produktu.

| Priorytet | Zadanie                                                                 | Uzasadnienie                                                             |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| P0        | Ustalić i przetestować macierz ról oraz uprawnień                       | jeden użytkownik nie potwierdza zasad autoryzacji                        |
| P1        | Dodać konflikty dwóch sesji dla nauczyciela, szkoły, klubu i zamówienia | obecne testy podwójnego kliknięcia nie sprawdzają optimistic concurrency |
| P1        | Domknąć granice walidacji szkoły                                        | długości i formaty identyfikatorów są tylko częściowo pokryte            |
| P1        | Rozszerzyć załączniki ORD o odczyt/pobranie i błędy uploadu             | zapis pliku nie potwierdza możliwości późniejszego użycia                |
| P1        | Pokryć usuwanie istniejącej relacji szkoła–nauczyciel                   | obecne testy skupiają się na dodawaniu i trwałości relacji               |
| P1        | Dodać wspierany testowy trigger rocznej medalowości                     | pozwoliłby uruchamiać pełny cykl niezależnie od kalendarza               |
| P2        | Dodać Firefox/WebKit lub formalnie ograniczyć wsparcie do Chromium      | obecny zakres przeglądarek powinien być świadomą decyzją                 |
| P2        | Dodać podstawowy audyt dostępności i nawigację klawiaturą               | obecny zestaw nie mierzy WCAG                                            |
| P2        | Ustalić progi p95 i maksymalny czas kluczowych operacji                 | obecne raportowanie nie blokuje regresji wydajnościowej                  |
| P2        | Dodać testy wizualne wybranych ekranów                                  | ochrona logiki nie wykrywa regresji układu                               |

Zrealizowano dwa wcześniejsze zadania P0: rozszerzenie edycji szkoły o adres, telefon, dane SIO i historię (`SCH-EDIT-18`–`SCH-EDIT-21`) oraz kontrolowane 422/500/timeout dla tworzenia i edycji szkoły (`SCH-16`, `SCH-58`, `SCH-59`, `SCH-EDIT-22`–`SCH-EDIT-24`). Odporność pozostałych modułów nadal figuruje w ich sekcjach jako luka.

## 12. Zasady utrzymania dokumentu

Po dodaniu lub usunięciu scenariuszy należy:

1. uruchomić `npm run docs:scenarios`;
2. zaktualizować odpowiednią sekcję **Pokryte** lub **Wymaga pokrycia**;
3. nie uznawać luki za zamkniętą wyłącznie na podstawie helpera — wymagany jest wykonywany test z asercją biznesową;
4. wskazać ID scenariusza w dokumentacji domenowej;
5. potwierdzić liczbę testów przez `npm run docs:scenarios:check`.

Dokument opisuje pokrycie funkcjonalne. Nie zastępuje raportu pokrycia kodu aplikacji, testów bezpieczeństwa ani formalnej macierzy wymagań.
