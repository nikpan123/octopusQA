# Potwierdzenia SP i SŚ 2026 — gratisy

Osobny pakiet w panelu Octopusa: **Potwierdzenia SP i SŚ 2026 — gratisy (Excel)**. Wszystkie przypadki mają prefiks `POTW26-` i tag `@potw26`. Pakiet może wykonywać klasy po kolei (1 proces) albo w dwóch procesach na odizolowanych danych. W panelu dostępne są 1 i 2 procesy; podgląd w jednej karcie i debugger pozostają pojedyncze.

Każdy przypadek tego pakietu przygotowuje jedną odizolowaną szkołę i jednego nauczyciela przypisanego do tej szkoły. Przygotowanie szkoły oraz utworzenie nauczyciela z przypisaniem szkoły i przedmiotów są odrębnymi etapami. Wspólny mechanizm domyślnie przygotowuje jedną szkołę także dla uprawnień i promocji. Dwie szkoły jawnie wybierają testy kopiowania oraz PERM-14, PERM-20, ACC-06, ACC-09, ACC-10 i ACL-13, które sprawdzają niezależność szkół. POTW26 jawnie wybiera jedną. Lista użytych szkół trafia do danych raportu jako `accessSchools`.

Źródłem jest „Wymagania biznesowe 26-27.xlsx”, zakładka „potw sp i sś 2026”, oraz pomocniczo „Klasy w potw 26” i „weryfikacja sś”. Oryginalny Excel pozostaje bez zmian. Zapisano adresy źródłowych komórek oraz skrót SHA-256 pliku.

Macierz obejmuje **51 pozycji**: **28 SP** oraz **23 SŚ**, wszystkie 9 bloków przedmiotów i serii. Zawiera **590 scenariuszy z implementacją automatyczną**: **360 SP** i **230 SŚ**. Implementacja nie oznacza zaliczonego wykonania. Po doprecyzowaniu reguły SŚ usunięto blokadę automatyzacji oraz 46 nieaktualnych przypadków dotyczących braku i negatywnego wyniku weryfikacji CC. Każdy pozostały scenariusz ma powiązane kroki automatu. Pełnego pakietu nie wykonano.

Wzorzec implementacji: istniejący `ORD-GIFT-DIAG-01` i scenariusze gratisów kopiowania zamówień. Pakiet kontroluje konkretny produkt, ID, ilość 1, szkołę, blokadę i jej powód. Dla potwierdzenia NASZ na wymagany rok pozycja gratisu ma powstać także przy blokadzie ilości lub braku zamówienia. Dla potwierdzenia obcego wydawcy wpis nie może powstać — także z blokadą. Odczytuje rzeczywiste Gratisy przez `GetPositions` i `GetNotDel`, następnie otwiera zakładkę Gratisy i zapisuje zrzut. Nie drukuje i nie nadaje przesyłek.

Dla języka polskiego SP klasa 4 seria MN wybiera opcję formularza „4 Między N”, a MZ — „4 Moim Z”. Jeżeli API zwraca jednocześnie ogólną klasę „4” i nazwaną opcję MN, wybierana jest nazwana seria. Dla pozostałych klas MN bez nazwanej opcji wybierana jest ogólna klasa o właściwym numerze. Duplikaty tej samej nazwanej opcji nadal zatrzymują test jako niejednoznaczne dane. Faktycznie wybrana nazwa trafia do raportu jako `confirmationClassName`. Raport c47bb601-36ac-4ea4-bc36-22c152fc8b06 zatrzymał się na niejednoznacznym wyborze „4” / „4 Między N”, przed zapisaniem potwierdzenia.

Doprecyzowanie z 22.10.2026: zbyt mała liczba podręczników oznacza utworzoną pozycję z blokadą „Za mała ilość”. Brak zamówienia lub zamówienie poza wymaganym okresem oznacza blokadę „Brak zamówień”. Przy spełnieniu warunków pozycja ma być niezablokowana, z pustym powodem. Wyjątek doprecyzowany przez użytkownika: potwierdzenie obcego wydawcy nie tworzy żadnego wpisu. Wszystkie 51 wariantów FOREIGN (28 SP i 23 SŚ) oraz po 51 wariantów TEST-TEACHER i OLD-CONFIRM wymagają od razu pustej listy Gratisów, bez wpisów z blokadą lub bez blokady. Nauczyciel z flagą Testowy ani nauczyciel mający wyłącznie potwierdzenie z poprzedniego roku (2025/2026), bez potwierdzenia na 2026/2027, nie generuje gratisów. Raport 304031db-b100-4bbe-a941-8f03c7427359 pokazał prawidłową pustą listę dla OLD-CONFIRM; zmieniono oczekiwanie testu, nie wynik archiwalnego raportu. Raport e63f9e1f-ef2a-4743-ad2f-4abd69d1cb9e pokazał prawidłową pustą listę; FAIL wynikał z wcześniejszego błędnego oczekiwania testu. Pozostałe negatywne warianty wymagają obecności zablokowanej pozycji i niepustego powodu; dokładna treść tych innych powodów nie została jeszcze ustalona. Raport `e3431854-b8f9-45c0-9378-6a365e0d8227` pokazuje poprawnie utworzoną pozycję 4PN-3, 1 egzemplarz, z blokadą „Za mała ilość” dla 29 sztuk przy progu 30; poprzednia wersja testu sprawdzała wyłącznie brak możliwości wysyłki.

## Daty i progi

| Zakres                                       | Okres zamówień        | Warunek ilościowy                                                                                               |
| -------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| SP: pozycje wskazane w arkuszu dla 2024/2025 | 01.05.2024–30.04.2025 | minimum 10 sztuk (9: bez wysyłki, 10: wysyłka)                                                                  |
| SP: pozycje wskazane w arkuszu dla 2025/2026 | 01.05.2025–30.04.2026 | minimum 10 sztuk (9: bez wysyłki, 10: wysyłka)                                                                  |
| SP: pozycje wskazane w arkuszu dla 2026/2027 | 01.05.2026–30.04.2027 | max(5, wartość pola Próg szkoły), bez ponownego naliczania 60%; przy braku liczby uczniów osobna reguła A88: 10 |
| SŚ: wszystkie pozycje                        | 01.05.2026–30.04.2027 | bez progu ilościowego: zamówienie 1 egzemplarza i potwierdzenie NASZ na wymagany rok                            |

Reguła SŚ doprecyzowana przez użytkownika 22.10.2026: wystarczy, że szkoła ma zamówienie właściwego tytułu (co najmniej 1 egzemplarz), a nauczyciel ma potwierdzenie NASZ na wymagany rok. Weryfikacja CC nie jest dodatkowym warunkiem tworzenia gratisu. Obowiązuje okres zamówień 1.05.2026–30.04.2027 i kolejność: zamówienie, zmiana daty w bazie, odczyt daty przez API, dodanie potwierdzenia. Pole Próg szkoły nie jest warunkiem gratisu dla SŚ; automat nie porównuje go z pustą wartością. Zachowano przypadki dat granicznych, braku zamówienia, obcego wydawcy, flagi Testowy i potwierdzenia z poprzedniego roku.

Ostateczne doprecyzowanie użytkownika z 21.10.2026: pole Próg określa wymaganą liczbę zamówionych podręczników. Dla 400 uczniów wynosi **30** i takie jest minimum zamówienia dla gratisu w aktualnym sezonie. Współczynnik 60% jest już uwzględniony w tej wartości; nie mnożymy pola ponownie przez 0,6. Test kontroluje wartość pola Próg przed użyciem danych. Istniejące testy zakładki Uprawnienia nie są zmieniane.

Doprecyzowanie z 22.10.2026 na podstawie fragmentu Excela: „nie mniej niż 5 szt.” oznacza co najmniej 5, zatem minimum bieżącego sezonu wynosi `max(5, Próg)`. Pole Próg zawiera już współczynnik 60%; nie mnożymy go ponownie. Raport 47470331-4120-4115-b48e-473cd577f145 pokazał prawidłowy niezablokowany gratis przy 5 sztukach i progu 1; test błędnie zakładał minimum 6. Wycofano także przejściową interpretację minimum równego 1. Każdy okres ma oddzielne przypadki dla 1 maja, 30 kwietnia, dnia przed początkiem i dnia po końcu. Dla 400 uczniów przypadki badają **29/30/31 sztuk**. Dla 8 uczniów i pola Próg = 1 przypadki LOW-MINUS i LOW-MIN sprawdzają odpowiednio 4 sztuki (blokada „Za mała ilość”) i 5 sztuk (gratis bez blokady). Zastępują wcześniejsze przypadki FLOOR-MINUS i FLOOR z błędną granicą 5/6. Dla poprzednich lat granica wynosi 9/10/11 sztuk. Bez liczby uczniów zachowano osobną regułę źródłową A88 (minimum 10) i przypadki 9/10 sztuk. SŚ sprawdza 1 i 2 egzemplarze oraz potwierdzenie NASZ, bez kroku CC.

## Przygotowanie daty w bazie

Raport szybkiego pakietu `663198b1-c20b-45a2-9405-a094ebb716dd` z 23.10.2026: NO-ORDER zaliczony, 13 przypadków zatrzymanych przed potwierdzeniem z powodu błędnej składni skryptu daty, a SŚ POTW26-06-MIN zatrzymany na braku produktu MLK1N-1 w katalogu zamówień. Naprawiono uszkodzoną linię kontroli nazwy szkoły i usunięto zdublowaną część skryptu PowerShell. Kontrole lokalne obejmują parsowanie bez wykonania SQL i zgodność zabezpieczeń starych oraz skróconych nazw szkół. Nie jest to wynik sprawdzenia reguł gratisów. Korekta użytkownika z 23.10.2026: potwierdzenie matematyki SŚ dla klasy 1, zakres podstawowy, korzysta z podręcznika klasy 2 **MLK2N-1 (ID 4024)**. Zarówno zamówienie, jak i oczekiwany gratis wskazują MLK2N-1; potwierdzenie pozostaje dla klasy 1 P. Poprawka obejmuje wszystkie 10 wariantów POTW26-06 w pełnej macierzy. Szybki pakiet po kolejnej korekcie użytkownika sprawdza klasę 2 P: POTW26-08-MIN, zamówienie i oczekiwany gratis MLK2-1 (ID 4023), zamiast przypadku klasy 1 z MLK2N-1. Zapisano ją w `tests/data/potwierdzenia-gratisy-2026-overrides.json`, nakładanym przez automat i generator scenariuszy; surowy odczyt Excela zachowano bez zmian.

API dodawania zamówienia na DEV nadpisuje przesłane `createdAt` datą bieżącą. Dlatego po dodaniu własnego zamówienia test wywołuje dedykowany zapis SQL w `dbo.SchoolOrder.CreatedAt`, a następnie ponownie odczytuje datę przez API. Dopiero po potwierdzeniu wymaganej daty przechodzi do oceny gratisów. We wszystkich wariantach zawierających zamówienie obowiązuje kolejność: utworzenie zamówienia, zmiana daty w bazie, potwierdzenie daty odczytem API, a dopiero potem dodanie potwierdzenia nauczyciela. Wariant z potwierdzeniem przed zamówieniem został usunięty.

Zmiana SQL jest parametryzowana i transakcyjna. Wymaga zgodności ID zamówienia, ID i dokładnej nazwy szkoły pakietu oraz użytkownika tworzącego. Dopuszcza tylko własne nieusunięte zamówienie ręczne bez flagi kopii, z pustym symbolem lub automatycznym symbolem BOK odpowiadającym temu ID. Zapis musi objąć dokładnie jeden rekord. Błąd powoduje rollback. Nie zmienia pozycji zamówienia, dat środowiska ani zwykłych danych użytkowników.

Wykonanie automatu wymaga lokalnych zmiennych `OCTOPUS_DEV_DB_*` oraz uprawnień SELECT i UPDATE do niezbędnych tabel/kolumn. Helper jest ograniczony do DEV i `GWO_CRMDEV`. Na TEST przypadki są jawnie pomijane do czasu dodania odpowiedniej konfiguracji bazy; nie korzystają z połączenia DEV. Dane logowania nie trafiają do raportu.

## Pokrycie i ograniczenia

- Pozycje scalone zostały rozwinięte: polski i historia SŚ mają osobne przypadki dla klas 4 i 5, mimo wspólnego produktu. Polski SŚ obejmuje obie części podręcznika dla klas 1–3. MZ klasa 4 obejmuje obie pozycje wysyłkowe. Matematyka SŚ rozdziela zakres podstawowy i rozszerzony. Fizyka SP rozdziela F+ i TNŚ.
- Każda pozycja ma scenariusze braku zamówienia, obcego wydawcy, flagi Testowy nauczyciela i potwierdzenia z poprzedniego roku. Dla FOREIGN, TEST-TEACHER i OLD-CONFIRM test wymaga braku pozycji od razu po dodaniu potwierdzenia; wykrycie nawet zablokowanej pozycji oznacza błąd. W pozostałych wariantach test wymaga dokładnie jednej pozycji gratisu, ilości 1 i właściwego stanu blokady; sam brak gratisu nie wystarcza. Wynik jest sprawdzany bezpośrednio po dodaniu potwierdzenia i odczycie Gratisów, bez okresu obserwacji i bez ponawiania błędnego wyniku.
- Pozostałe blokady ogólne A92:A98, w tym wcześniejsze otrzymanie tytułu, druga szkoła, Macierz/Zagranica i wspomagający, wymagają osobnego rozszerzenia. Nie są deklarowane jako pokryte tym pakietem.
- Katalog produktów i przypisania klas nie są zastępowane podobnym tytułem. Brak dokładnego produktu lub jednoznacznej klasy zatrzymuje przygotowanie z opisem brakujących danych.
- Przypadki przyszłych dat zapisują rzeczywistą przyszłą datę zamówienia. Nie przestawiają zegara serwera.
- Własne potwierdzenia, zamówienia oraz niewysłane gratisy są sprzątane także po błędzie. Nauczyciele bez flagi z zaliczonego testu są usuwani bez zaznaczania Testowy, po sprawdzeniu ID, nazwiska, adresu example.invalid i środowiska. Po błędzie zostają do analizy. Domyślne zasady sprzątania pozostałych pakietów nie są zmieniane.
- W testach generowania gratisu nauczyciel i szkoła mają wyłączoną flagę Testowy. Wariant TEST-TEACHER włącza ją tylko nauczycielowi, ponieważ sprawdza całkowity brak generowania gratisów dla nauczyciela testowego. Testy negatywne progów, dat i wydawcy zachowują wyłączone flagi, aby nie zasłaniać właściwej przyczyny odmowy.
- W debuggerze profil nauczyciela otwiera się już podczas przygotowania. Zakładka Gratisy jest otwierana przed oceną wyniku, również gdy późniejsza asercja nie przejdzie. Obraz debuggera działa także z włączoną nakładką podglądu. Zmiany obowiązują w nowej sesji debuggera.

## Uruchomienie

Do bieżącej kontroli wybierz w panelu pakiet **Gratisy 2026 — szybki test (13 przypadków)** albo scenariusz **Szybka kontrola przypisywania gratisów — 13 najważniejszych przypadków**. Pakiet wykorzystuje istniejące testy z tagiem `@gift-smoke`; nie tworzy dodatkowych kopii automatów. Obejmuje granice 29/30 i 4/5, brak zamówienia, brak wpisu dla obcego/Testowego/poprzedniego roku oraz dodatnie przypadki SŚ, MN, MZ, F+ i TNŚ. To kontrola podstawowych reguł, nie pełna macierz klas i dat.

```powershell
npm run test:gift:smoke
```

Można wybrać 1 lub 2 procesy. Nowy przycisk pakietu w konfiguracji wymaga ponownego uruchomienia panelu; opis scenariusza wystarczy odświeżyć. Przy wyborze szybkiego pakietu panel czyści wcześniejsze zaznaczenia i filtr, żeby nie uruchomić przypadkiem pełnej regresji. Testy wymagają DEV i przygotowania dat zamówień jak pełny pakiet. Zestaw nie został jeszcze uruchomiony na DEV.

Wybierz pakiet w panelu albo uruchom:

```powershell
npx playwright test tests/potwierdzenia-gratisy-2026.spec.ts --workers=1
```

Przykład pojedynczego przypadku:

```powershell
npx playwright test --grep 'POTW26-41-MIN:' --workers=1
```

W katalogu scenariuszy dostępne są warunki, dane, daty, kroki i oczekiwane wyniki każdego przypadku. SP i SŚ są dostępne do uruchomienia automatycznego na DEV. Pełnego pakietu nie wykonano. Wyniki kontrolnych uruchomień nie stanowią wyniku całości.

Nazwy kroków odpowiadają konkretnemu wariantowi i są wspólne dla katalogu i nowego raportu z automatu. Utworzenie zamówienia, ustawienie daty w bazie i dodanie potwierdzenia to osobne etapy. Wariant NO-ORDER ma kontrolę pustej listy zamówień, bez etapu SQL; dane scenariusza nie nakazują tworzenia zamówienia. Kroki oceny podają kod gratisu, ilość i oczekiwaną blokadę lub brak wpisu; ocena następuje od razu. Archiwalne raporty zachowują wcześniejsze nazwy kroków.

## Kontrola na DEV — 21.10.2026

**Wyniki archiwalne.** Nie potwierdzają zaliczenia aktualnej wersji pakietu. Obowiązujące oczekiwanie dla 400 uczniów: 29 sztuk nie wystarcza, 30 sztuk wystarcza. Przejściowa interpretacja minimum 18 została wycofana. Dla zamówień historycznych minimum wynosi 10: przypadek 9 sztuk ma być ujemny, a 10 dodatni. Wcześniejsze niezgodności wymagają powtórzenia po ustaleniu reguł, zanim zostanie rozstrzygnięta przyczyna.

Po dodaniu zmiany daty bezpośrednio w bazie przeszedł pojedynczy `POTW26-41-MIN` (Fizyka F+, 30 sztuk, 01.05.2026). Następny przebieg sześciu przypadków zakończył się wynikiem **4 passed, 2 failed**:

| Przypadek        | Wynik  | Obserwacja                                                                                                                                            |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| POTW26-01-MIN    | passed | Matematyka klasa 4, 30 sztuk, 01.05.2026                                                                                                              |
| POTW26-02-MIN    | failed | Matematyka klasa 5: 10 sztuk 5P-2 z 01.05.2024; gratis 5PN-2 zablokowany powodem „Brak zamówień”, mimo zapisanej i ponownie odczytanej właściwej daty |
| POTW26-29-MIN    | passed | Polski MZ klasa 4, P4PN-200, 30 sztuk                                                                                                                 |
| POTW26-41-END    | passed | Fizyka F+, zamówienie na koniec okresu 30.04.2027                                                                                                     |
| POTW26-41-BEFORE | failed | Fizyka F+: zamówienie z 30.04.2026, przed początkiem okresu; pojawił się niezablokowany F7P                                                           |
| POTW26-43-MIN    | passed | Fizyka TNŚ, F7P-1, 30 sztuk                                                                                                                           |

Obserwacja granicy daty wymaga osobnego powtórzenia po korekcie. Obserwacja historycznego zamówienia 10 sztuk również wymaga powtórzenia przy obowiązującej granicy 9/10. Wcześniejsze kontrolne uruchomienia sprzed dodania zapisu SQL zatrzymywały się podczas przygotowania daty; nie stanowią wyników końcowej implementacji.

Audyt przygotowania danych z 22.10.2026: usunięto niepotrzebną drugą szkołę we wspólnym przygotowaniu testów uprawnień i promocji. Gdy dwie szkoły są wymagane, etapy odróżniają pierwszą i drugą szkołę. Sprzątanie zamówień nie dodaje pustego etapu, gdy nie utworzono dokumentów lub zostały już usunięte; nieudane usuwanie pozostaje do ponowienia. Testy kopiowania korzystają z jawnych planów placówek, a szkoły formularzy klubowych i filtrowania stanowią współdzielone zestawy potrzebne do scenariuszy — nie usunięto ich wymaganych danych. Kontrole lokalne wykonują rzeczywisty mechanizm przygotowania z atrapami API: jedna szkoła, dwie szkoły, przypisanie nauczyciela i brak powtórnego pustego sprzątania. Nie uruchamiano DEV.

Przyspieszenie pakietu: flagę Testowy nowego nauczyciela przygotowanie weryfikuje przez API, bez uruchamiania dodatkowej przeglądarki w tle. Profil nauczyciela nie jest ponownie otwierany przed sprzątaniem, jeśli jest już widoczny. Zgodnie z doprecyzowaniem użytkownika gratis tworzy się od razu: usunięto pięciosekundowe obserwacje oraz ponawianie odczytów podczas oceny wyniku. Po dodaniu potwierdzenia wystarcza jeden odczyt Gratisów i bezpośrednia asercja. Odpowiedź API trafia do raportu także przy niezaliczonym sprawdzeniu. Panel nie obcina już wyboru do 100 ID; zbyt długa lista zgłasza jawny błąd zamiast pomijania testów. Zmiany obsługi uruchomień wymagają ponownego uruchomienia panelu po zakończeniu trwającego przebiegu. Kontrole lokalne nie stanowią pomiaru przyspieszenia na DEV.

Na prośbę użytkownika z 23.10.2026 z szybkiego pakietu wyłączono POTW26-01-BEFORE oraz POTW26-02-MIN. Oba pozostają w pełnej macierzy z dotychczasowymi oczekiwaniami; nie oznacza to poprawienia ani zaliczenia ich wyników. Szybki pakiet nie sprawdza już tych dwóch reguł daty zamówienia.


## Przeliczenia po przygotowaniu danych

Po utworzeniu własnego zamówienia, zmianie CreatedAt w bazie i potwierdzeniu daty przez API test wykonuje `dbo.RecalculateSchoolClassDigitalAccessesBasedOnSchoolId` z ID tej szkoły. Po zapisaniu formularza klubowego wykonuje `dbo.SendBookFromFormClubPSChangesStates` z ID zapisanego formularza. Dopiero po zakończeniu procedury sprawdza wpis i powód blokady w Gratisach. Nie dodajemy sztucznego oczekiwania.

Wariant NO-ORDER nie tworzy zamówienia i pomija pierwsze przeliczenie; po utworzeniu formularza wykonuje drugie. Obie operacje wymagają DEV / GWO_CRMDEV oraz prawa EXECUTE. Skrypt dopuszcza wyłącznie szkoły POTW26, sprawdza właściciela zamówienia lub formularza oraz zgodność szkoły formularza. Nie przyjmuje dowolnego SQL ani nazw procedur. ID i potwierdzenie wykonania są dołączone do raportu.

Zmiana obejmuje wszystkie testy POTW26, także wybrane przez paczkę szybkich gratisów i regresję przed releasem. Oczekiwania biznesowe pozostają takie same: dla 5P-2 × 9 sztuk z 01.05.2024 wymagany powód to „Za mała ilość”.

Weryfikacja po dodaniu procedur (23.10.2026): 6/6 PASS na DEV — POTW26-02-MINUS, POTW26-02-MIN, POTW26-01-NO-ORDER, POTW26-01-FOREIGN, POTW26-01-TEST-TEACHER i POTW26-08-MIN. Nie wykonano pełnej macierzy 590 testów.
