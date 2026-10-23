# Progi minimalnego zamówienia i uprawnienia nauczyciela

Testy rozdzielają trzy zagadnienia: próg szkoły, prezentację dostępu nauczyciela oraz eksport klas do systemu materiałów cyfrowych. Wynik „Przyznano” nie jest dowodem spełnienia progu zamówień: dostęp może wynikać ze szkoły testowej, promocji albo decyzji BOK.

Zestaw obejmuje 90 scenariuszy: THR 22, PERM 25, ACC 10, ACL 17, NCL 8 i DEB 8. Nowe testy promocji nie zostały uruchomione podczas przygotowania. Użytkownik uruchamia wcześniejsze przypadki pojedynczo. Liczba implementacji nie oznacza pełnego pokrycia wszystkich dostarczonych wymagań. Lista brakujących sprawdzeń znajduje się na końcu.

## Reguły i pierwszeństwo decyzji

Nowy wzór obowiązuje od roku szkolnego 2026/2027. Dla szkoły podstawowej brak informacji o liczbie uczniów albo jawne 0 oznaczają próg domyślny 10. Dopiero dla dodatniej liczby uczniów próg cyfrowy wynosi `max(1, round(liczba uczniów / 8 × 0,6))`. Dla 1 ucznia obowiązuje zatem próg 1. NPC i przedszkole mają stały próg 10, nawet jeśli NPC prezentuje poziom Szkoła Podstawowa. Kolumna Kategoria i pole Próg mają inne reguły.

Dla wysyłki gratisów w SP wymagane jest dodatkowo minimum 5. Zakładka Uprawnienia pokazuje wyłącznie dostęp cyfrowy; nie zastępuje zakładki Gratisy.

Kolejność rozstrzygania dostępu:

1. Bez aktywnego potwierdzenia lub po zawieszeniu nauczyciela dostęp z tego potwierdzenia nie obowiązuje, także po ręcznym nadaniu BOK.
2. Przy aktywnej podstawie decyzja BOK dla konkretnej klasy ma pierwszeństwo przed wynikiem automatu.
3. W standardowej ścieżce `automaticSystemAccess = baseAccess union promotionAccess`. Ścieżki szkoły testowej i nowego nauczyciela działają niezależnie od zamówień i nie są zapisywane jako `baseAccess`. Ochrona przejściowa jest sumą `finalAccess` z odpowiednich lat, a nie osobną warstwą automatu.

Szkoła testowa i nowy nauczyciel nie mogą być zapisywani jako `baseAccess`. Promocja zamówieniowa obejmuje wyłącznie `promotionRange - baseAccess`. Zamówienie klasy 0 daje bazowo tylko klasę 0 i nie uruchamia promocji. Ręczna decyzja jednej klasy nie powinna zamrażać automatu dla pozostałych klas. Te reguły wyznaczają oczekiwania biznesowe; ich pełna weryfikacja wymaga oddzielnych danych warstw, nie tylko końcowego statusu.

Załączony arkusz „Wymagania biznesowe 26-27.xlsx” uzupełnia kontekst: arkusz „Klasy w potw 26”, A4:P13, opisuje zróżnicowane klasy przedmiotów; „potw sp i sś 2026”, A88, opisuje próg i okres zamówień 1 maja–30 kwietnia. Nowsze doprecyzowania użytkownika określają rozdzielenie warstw i datę wdrożenia nowego wzoru. Arkusz źródłowy nie jest modyfikowany ani kopiowany do repozytorium.

## Dane i bezpieczeństwo

Szkoły są wyszukiwane po dokładnej, dedykowanej nazwie i ponownie wykorzystywane. Nazwa zawiera środowisko: szkoły progów mają prefiks `AUTO_CAT_DEV_THR_` albo `AUTO_CAT_TEST_THR_`, a Uprawnień `AUTO_CAT_DEV_ENT_` albo `AUTO_CAT_TEST_ENT_`. Domyślny wariant Uprawnień korzysta z dwóch oznaczonych szkół na worker. Wariant bez flag ma oddzielną parę szkół; żaden z nich nie tworzy szkoły przed każdym scenariuszem. Szkoły pozostają po przebiegu. Zabezpieczenia przygotowania potwierdzeń i zamówień uwzględniają człon środowiska w nazwie szkoły.

PERM-23–PERM-25 mają osobny wariant fixture `accessTestFlags={teacher:false,school:false}`. Dedykowane szkoły zawierają `_ENT_UNMARKED_` w nazwie i nie otrzymują flagi Testowy. Nauczyciel nie przechodzi przez `InsertIntoTestTeachers`. Brak obu flag jest sprawdzany w UI przed i po asercjach; współdzielone szkoły wariantu testowego nie są przełączane. Po udanym scenariuszu własny nauczyciel otrzymuje flagę dopiero na potrzeby istniejącego bezpiecznego sprzątania. Po błędzie pozostaje bez flagi do analizy, a jego ID i wariant danych są zapisane w rejestrze `runs`. Domyślne zabezpieczenia cleanupu nie zostały osłabione; usunięcie takiego nieudanego przypadku wymaga istniejącej, jawnej procedury dla rekordów nieoznaczonych.

Każdy scenariusz uprawnień tworzy własnego nauczyciela `REG_...`, z adresem `example.invalid`. Formularze klubowe powstają przez API z `sendEmail: false`. Nie są wysyłane e-maile z potwierdzeniami. Dane uprawnień są odczytywane z rzeczywistego API; odpowiedzi nie są podmieniane atrapami.

Ręczna decyzja używana jako przygotowanie eksportu jest zapisywana przez rzeczywisty endpoint edycji, wyłącznie dla potwierdzenia własnego nauczyciela. PERM-16 sprawdza osobno zapis przez formularz UI, a PERM-17 przywrócenie automatu. Przygotowanie przez API nie zastępuje tych sprawdzeń formularza.

Zamówienia z ACL są tworzone przez API i usuwane po teście także po błędzie. Są weryfikowane po zapisie pod kątem produktu i liczby sztuk. Zawieszenie z ACL-12 jest cofane w sprzątaniu. Nauczyciele po poprawnych testach są usuwani przez istniejący mechanizm na końcu przebiegu. Nauczyciele po błędzie zostają do analizy wraz z rejestrem w `runs`. Nie są modyfikowani zwykli nauczyciele, role kont ani konfiguracja roku.

## Scenariusze progów

Plik: `tests/szkola-prog.spec.ts`. Testy czytają rzeczywiste pole Próg w profilu szkoły. Nie sprawdzają wyłącznie lokalnej funkcji liczącej wzór.

| ID            | Dane i oczekiwany próg cyfrowy                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| THR-01–THR-07 | SP: 0→10, 1→1, 6→1, 7→1, 19→1, 20→2, 21→2; domyślne 10 dla 0, minimum 1 dla dodatniej liczby uczniów i granica zaokrąglenia 1,5                                              |
| THR-08–THR-14 | SP: 59→4, 60→5, 61→5, 100→8, 400→30, 750→56, 1200→90; wartości po obu stronach granic i większe szkoły                                                                       |
| THR-15–THR-17 | Przedszkole: 1, 400 i 1200 uczniów, zawsze próg 10                                                                                                                           |
| THR-18–THR-20 | NPC: 1, 400 i 1200 uczniów, zawsze próg 10                                                                                                                                   |
| THR-21        | Zapis Akcji SIO kolejno: 100→próg 8, 0→próg 10, puste pole→próg 10, 1→próg 1; wartości sprawdzane w otwartym profilu i po ponownym wejściu; na końcu przywraca 400 i próg 30 |
| THR-22        | Anulowanie Akcji SIO pozostawia liczbę uczniów 400 i próg 30                                                                                                                 |

THR-01–THR-14 sprawdzają też trwałość progu po przeładowaniu profilu i brak możliwości ręcznej edycji pola Próg. Edycja liczby uczniów odbywa się przez Akcję SIO.

## Scenariusze widoku Uprawnienia

Plik: `tests/nauczyciel-uprawnienia.spec.ts`.

| ID              | Co jest sprawdzane                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| PERM-01         | Położenie zakładki obok Potwierdzeń                                                                                     |
| PERM-02         | Obecność rekordu aktywnego potwierdzenia bez zamówień                                                                   |
| PERM-03         | Podstawowe kolumny listy                                                                                                |
| PERM-04         | Aktualny zestaw i kolejność siedmiu nagłówków, w tym Adres szkoły, bez usuniętej kolumny Źródło dostępu                 |
| PERM-05         | Pełna lista klas Fizyki zgodna z mechanizmem checkboxów przedmiotu i szkoły, nie tylko klasa zaznaczona w potwierdzeniu |
| PERM-06         | Status, klasa, zamówiono, próg, powód, rok zamówień i data zgodne z zapisanym wynikiem API                              |
| PERM-07         | Przyznano dla rekordu wtedy i tylko wtedy, gdy przynajmniej jedna klasa ma przyznany dostęp                             |
| PERM-08         | Zablokowane akcje bez zaznaczenia rekordu                                                                               |
| PERM-09         | Niedostępne przywracanie automatu dla rekordu automatycznego                                                            |
| PERM-10         | Zmiana checkboxa i anulowanie edycji bez zmiany decyzji ani historii                                                    |
| PERM-11         | Okno historii dla właściwego przedmiotu i roku oraz jego kolumny                                                        |
| PERM-12         | Przełączenie zakładek nie zmienia zapisanych danych kwalifikacji                                                        |
| PERM-13         | Oddzielne rekordy dla Matematyki i Fizyki                                                                               |
| PERM-14         | Oddzielne rekordy tego samego przedmiotu w dwóch szkołach                                                               |
| PERM-15         | Brak edycji danych ilościowych w szczególe                                                                              |
| PERM-16         | Nadanie klasy 4 przez UI, zapis decyzji ręcznej, eksport przyznanej klasy i nowy wpis historii                          |
| PERM-17         | Przywrócenie wyniku automatu przez UI i wyłączenie aktywnej decyzji ręcznej                                             |
| PERM-18         | Odmowa klasy 4 przez UI zachowuje dostęp i brak ręcznej ingerencji dla pozostałych klas                                 |
| PERM-19         | Anulowanie przywrócenia zachowuje decyzję BOK, eksport i historię                                                       |
| PERM-20         | Edycja tego samego przedmiotu w jednej szkole nie zmienia rekordu ani historii drugiej szkoły                           |
| PERM-21–PERM-22 | Szkoła testowa bez zamówień: deklaracja Matematyki 4 albo 7 daje w API, UI i eksporcie pełny zakres 4–8                 |
| PERM-23         | Nauczyciel i szkoły bez flag Testowy: ręczne nadanie jednej klasy przez UI i zgodny eksport                             |
| PERM-24         | Bez obu flag: kwalifikujące zamówienie F7P daje 7–8; BOK odbiera dostęp, a Przywróć ma odtworzyć automat i eksport      |
| PERM-25         | Bez obu flag: anulowanie przywrócenia zachowuje decyzję BOK, historię i eksport                                         |

PERM-02 nie wymusza wyniku Brak dostępu: szkoła Testowa albo nowy nauczyciel mogą mieć dostęp bez zamówień. PERM-06 porównuje prezentację ze stanem zapisanym, a nie potwierdza poprawności całej kwalifikacji bazowej.

PERM-06 wymaga ukrycia powodu przy przyznanym dostępie; powód jest prezentowany wyłącznie przy braku dostępu. PERM-17 kontroluje przywrócenie statusu, zakresu, przypisań klas, wyłączenie oznaczeń ręcznych, eksport i zachowanie wcześniejszej historii. Sama zmiana `accessSource` na automat nie wystarcza. W przebiegu użytkownika przywrócenie zmieniło źródło, lecz pozostawiło brak dostępu zamiast wcześniejszych klas 4–8; oczekiwanie nie zostało osłabione.

PERM-21–PERM-22 sprawdzają efekt reguły szkoły testowej, lecz obecny DTO nie pozwala oddzielnie potwierdzić zapisanej podstawy kwalifikacji ani wykluczyć błędnego przypisania tego samego wyniku do innej ścieżki.

## Scenariusze eksportu

Plik: `tests/uprawnienia-api.spec.ts`. Endpoint: `GET /api/free-mh-distributor/ClassesWithLevels?email=...&schoolYearsText=2026`. Wymagany parametr `schoolYearsText` jest tekstem; pole roku w odpowiedzi nazywa się `schoolYear`. Identyfikacja w testach odbywa się po e-mailu własnego nauczyciela, bez dodatkowego `teacherId`. Opcjonalny filtr `subjectsIdText` jest pomijany, aby sprawdzać również brak nadmiarowych przypisań do innych przedmiotów. Eksport nie wysyła nagłówka `Authorization`; zachowuje cookies sesji bramki DEV. Przygotowanie decyzji BOK odbywa się przez wewnętrzne API własnego nauczyciela i nadal korzysta z aktualnego tokenu sesji Octopusa.

| ID     | Co jest sprawdzane                                                                         |
| ------ | ------------------------------------------------------------------------------------------ |
| ACC-01 | Dokładny eksport jednej przyznanej klasy wraz z poziomem i zakresem                        |
| ACC-02 | Kilka klas zgrupowanych pod jednym przedmiotem                                             |
| ACC-03 | Oddzielne grupy Matematyki i Fizyki                                                        |
| ACC-04 | Usunięcie przyznania skutkuje pustym eksportem; wcześniej ten sam eksport musi być dodatni |
| ACC-05 | Dostęp roku 2026 nie przenika do zapytania o 2025                                          |
| ACC-06 | Identyczne klasy, poziomy i zakresy z dwóch szkół są zwracane jeden raz                    |
| ACC-07 | Klasa 7 Fizyki z zakresami 4 i 18 daje dwa wpisy, a nie jeden scalony                      |
| ACC-08 | Odebranie zakresu F+ pozostawia przyznany TNŚ dla tej samej klasy                          |
| ACC-09 | Odmowa w jednej szkole nie przesłania przyznania tej samej klasy w drugiej                 |
| ACC-10 | Usunięcie jednego potwierdzenia nie usuwa klasy nadal przyznanej przez drugą szkołę        |

Odpowiedź jest tablicą rekordów nauczyciel/rok. Dla zapytania o własnego nauczyciela i jeden rok test dopuszcza maksymalnie jeden rekord, sprawdza jego `teacherId`, `schoolYear`, typy pól i unikalność przedmiotów oraz trójek klasy, poziomu i zakresu. Pole `scope` jest liczbą. Pusta tablica może reprezentować brak przyznanych przypisań; przypadki dodatnie wymagają dokładnego, niepustego zestawu klas. Kolejność grup nie ma znaczenia; dodatkowy albo brakujący wpis jest błędem. HTTP 401/403 nie jest pomijane ani traktowane jako dowód braku dostępu nauczyciela — oznacza problem dostępu do endpointu wymagający wyjaśnienia.

## Cykl życia i pierwszeństwo blokady

Plik: `tests/uprawnienia-cykl-zycia.spec.ts`.

| ID     | Co jest sprawdzane                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| ACL-01 | Usunięcie potwierdzenia blokuje wcześniej potwierdzone nadanie BOK w eksporcie i UI/API Uprawnień                        |
| ACL-02 | Zmiana wszystkich klas na obce blokuje także nadanie BOK                                                                 |
| ACL-03 | Negatywna weryfikacja przez UI blokuje także nadanie BOK                                                                 |
| ACL-04 | Usunięcie Matematyki nie zmienia aktywnej Fizyki tego samego nauczyciela                                                 |
| ACL-05 | Historia decyzji BOK pozostaje po usunięciu potwierdzenia                                                                |
| ACL-06 | Przywrócenie usuniętego potwierdzenia ponownie pokazuje rekord                                                           |
| ACL-07 | Zmiana obce→nasze ponownie pokazuje rekord                                                                               |
| ACL-08 | Najpierw zamówienie: bez potwierdzenia brak dostępu; po potwierdzeniu wykorzystane zostaje 31 podręczników F7P i próg 30 |
| ACL-09 | Najpierw potwierdzenie: późniejsze zamówienie aktualizuje liczbę zaliczonych podręczników do 31 przy progu 30            |
| ACL-10 | Nowe zamówienie aktualizuje ilość w tle, lecz nie nadpisuje odmowy BOK                                                   |
| ACL-11 | Usunięcie potwierdzenia nie usuwa zamówienia szkoły                                                                      |
| ACL-12 | Zawieszenie własnego nauczyciela blokuje wcześniej nadany dostęp BOK; na końcu zawieszenie jest cofane                   |
| ACL-13 | Usunięcie potwierdzenia jednej szkoły zachowuje inne klasy, rekord i historię tego samego przedmiotu w drugiej szkole    |
| ACL-14 | Zmiana decyzji BOK z Matematyki nie zmienia Fizyki ani jej historii                                                      |
| ACL-15 | Usunięcie zamówienia zmniejsza zaliczoną ilość do 0, ale nie odbiera ręcznego nadania BOK                                |
| ACL-16 | Korekta zamówienia poniżej progu aktualizuje ilość bez nadpisania ręcznego nadania BOK                                   |
| ACL-17 | Przywrócenie potwierdzenia wykorzystuje pozostawione zamówienie, odtwarza eksport i zachowuje wcześniejszą historię      |

ACL-06 i ACL-07 sprawdzają ponowne pojawienie się rekordu, nie pełną ponowną kwalifikację wszystkich warstw. ACL-08 i ACL-09 kontrolują ilość i próg, ale na szkole Testowej sam końcowy status nie dowodzi poprawnego zapisania `baseAccess`.

ACL-15–ACL-16 kontrolują aktualizację ilości i pierwszeństwo BOK, a nie odrębny zapis kwalifikacji bazowej. Zamówienia są sprzątane w istniejącym fixture także po nieudanym teście. Przygotowanie odmowy zakresu TNŚ obsługuje słownik, w którym istnieje tylko zielony wariant danego zakresu: zapis decyzji używa tej samej klasy i scope z jawnym `isOur=false`.

## Promocje nowego klienta i debiutu

W panelu **Scenariusze** dostępny jest osobny dział **Uprawnienia — promocja debiutu i nowego klienta**: 16 przypadków z warunkami początkowymi, danymi, krokami i wynikami, powiązanych z istniejącymi testami DEB i NCL. Przypadki można uruchamiać osobno lub wybrać dostępne testy działu. NCL-04 przygotowuje historyczne daty własnych zamówień w bazie DEV; sześć sezonowych testów debiutu poza wymaganym okresem jest pomijanych. Dodanie scenariuszy nie stanowi wyniku uruchomienia DEV.

Pliki `tests/uprawnienia-promocja-nowy-klient.spec.ts` i `tests/uprawnienia-promocja-debiutu.spec.ts` sprawdzają rzeczywiste przypisania klas oraz dokładny eksport klas, poziomów i zakresów. Wszystkie używają nauczyciela i szkół bez flagi Testowy, z osobnymi szkołami per przypadek. Zamówienia są sprzątane także po błędzie; szkoły pozostają do ponownego użycia. Pozostałe po wcześniejszym przebiegu zamówienia powodują błąd warunku przygotowania, a nie automatyczne usuwanie nieznanych danych.

| ID            | Sprawdzenie                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| NCL-01–NCL-03 | Zakup klasy 4: próg−1 nie daje promocji; próg i próg+1 dają dokładnie 4–6                                  |
| NCL-04 | Dwa zamówienia po 1 sztuce z Y−2 i Y−1: zmiana CreatedAt w bazie DEV, odczyt API; bieżący zakup na progu daje 4–6 |
| NCL-05        | Zakup klasy 7 daje tylko 7–8                                                                               |
| NCL-06        | Zakup klas 4 i 7 daje sumę 4–8                                                                             |
| NCL-07–NCL-08 | Korekta poniżej progu albo usunięcie zakupu wycofuje przyznany wcześniej zakres promocyjny                 |
| DEB-01–DEB-03 | Pierwsza deklaracja Matematyki 4 lub Fizyki 7 rozszerza zakres bez zamówień; Fizyka rozdziela scope 4 i 18 |
| DEB-04        | Poprzedni rok obcy, obecnie nasz: zakres debiutu 4–8                                                       |
| DEB-05        | Poprzedni rok nasz wyklucza ponowny debiut z tego samego przedmiotu                                        |
| DEB-06        | Od 1 października pierwsze potwierdzenie bez zakupów nie przyznaje debiutu                                 |
| DEB-07        | Wcześniejsze nasze potwierdzenie Matematyki nie wyklucza pierwszego debiutu z Fizyki                       |
| DEB-08        | Po 30 września zakup klasy 4 daje 4–6, nie zakres debiutu 4–8                                              |

W NCL wcześniejsze nasze potwierdzenie eliminuje ścieżkę pierwszego potwierdzenia nauczyciela, lecz szkoła nie ma kwalifikujących zakupów historycznych. Potwierdzenie dotyczy poprzedniego roku szkolnego, ale jest wprowadzane z bieżącą datą serwera. Próg jest odczytywany z zapisanego wyniku kwalifikacji; wzór progu kontrolują niezależnie testy THR.

NCL-04 został odblokowany 23.10.2026: tworzy dwa własne zamówienia 4P-2 po 1 sztuce, ustawia daty na 1 maja roku Y−2 i Y−1 bezpośrednio w bazie DEV i potwierdza je odczytem API. Następnie sprawdza brak dostępu i dodaje bieżące zamówienie na progu. Wymaga konfiguracji bazy DEV / GWO_CRMDEV; na TEST jest pomijany. Zapis SQL pozostaje ograniczony do własnego ręcznego zamówienia, użytkownika i dedykowanej szkoły NCL-04. Test usuwa własne zamówienia w sprzątaniu także po błędzie. Nie wykonano nowego testu na DEV.

DEB-01–DEB-05 i DEB-07 działają wyłącznie w rzeczywistym oknie sezonowym. Przed kolekcją testów należy ustawić zmienną środowiskową `OCTOPUS_CLUB_FORMS_OPEN_DATE=YYYY-MM-DD` na faktyczną datę otwarcia formularzy. Brak daty albo dzień poza okresem otwarcia–30 września oznacza jawne pominięcie przed przygotowaniem danych. DEB-06 i DEB-08 działają od 1 października do końca roku. Data pochodzi z zegara urządzenia w strefie Europe/Warsaw; urządzenie i serwer muszą mieć zgodną datę. Testy nie przestawiają zegara backendu.

Odczyt API nie ujawnia osobnych warstw `baseAccess` i `promotionAccess`, kodu `new_client` ani `validTo`. Nowe testy potwierdzają skutki kwalifikacji i eksport, nie zapis tych pól. Nadal brakuje sprawdzeń klas 0–3, NPC i przedszkoli, szczegółowych serii języka polskiego, granic dat z kontrolowanym procesem oraz trwałego wygaśnięcia wcześniej nadanego debiutu. DEB-06 sprawdza nowe potwierdzenie po terminie, nie przejście istniejącego rekordu przez datę wygaśnięcia.

PERM-18 potwierdza manualną odmowę przez powód BOK i nowy wpis Ręczna edycja w historii. Nie wymaga `modifiedManualy=true`: obecny zapis UI pozostawia tę flagę false mimo ręcznej decyzji. Pozostałe klasy oraz ich eksport nadal muszą pozostać niezmienione.

## Macierz dalszych sprawdzeń reguł biznesowych

Poniższa macierz opisuje pełne wymagania, także ich część sprawdzaną już przez NCL i DEB. Nie stanowi dodatkowych testów Playwright. Dostępny odczyt uprawnień zawiera końcowy status, przypisania i szczegóły ilościowe, ale nie udostępnia kontraktu wszystkich warstw ani kontrolowanego `processDate`. Publiczny Swagger v1 pokazuje interfejsy integracyjne, w tym eksport, bez kontraktu tych przeliczeń. Brak takiego opisu nie dowodzi, że wewnętrzny endpoint nie istnieje. Użytkownik nie dysponuje obecnie dodatkowym opisem API; pełne sprawdzenie zapisanych warstw pozostaje poza gotowymi scenariuszami.

### Nowy klient i zwykły klient

Klientem jest szkoła, a kwalifikacja jest osobna dla `schoolId + subjectId + orderYear`. Nowy klient ma kwalifikujące zamówienie w `orderYear` i nie ma go w dwóch poprzednich latach. Brak zamówienia i ilość poniżej progu mają ten sam skutek kwalifikacyjny, ale ilość poniżej progu pozostaje widoczna BOK. Zwykły klient nie jest nowym klientem ani aktywną kontynuacją. Zakresy są wspólne dla statusów: 1–3, 4–6 i 7–8, rozszerzane w ramach serii. Powód promocji to odpowiednio `new_client` albo `order_ranges`.

| Dane lub zdarzenie                                             | Oczekiwane sprawdzenie                                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Kwalifikujące zamówienie 2026, brak w 2025 i 2024              | Status nowego klienta dla tego przedmiotu i roku, powód `new_client`                     |
| W 2025 i 2024 były wyłącznie zamówienia poniżej progu          | Nadal nowy klient, jeśli zamówienie 2026 kwalifikuje się                                 |
| Kwalifikujące zamówienie w jednym z dwóch poprzednich lat      | Brak nowego statusu `new_client`; osobno ocena aktywnej kontynuacji                      |
| Szkoła kupuje Matematyki od lat, Fizyki dopiero teraz          | Niezależna klasyfikacja klienta per przedmiot, nie per nauczyciel                        |
| Ilość próg−1, próg i próg+1 w `orderYear`                      | Promocję uruchamiają tylko dwa ostatnie przypadki; brak promocji dla próg−1              |
| Kwalifikująca klasa 0                                          | Baza zawiera wyłącznie 0; brak nowego zakresu promocyjnego                               |
| Kwalifikująca klasa 4                                          | Baza {4}, zakres {4,5,6}, promocja {5,6}; klasa 4 nie jest promocyjna                    |
| Kwalifikująca klasa 7                                          | Baza {7}, zakres {7,8}, promocja {8}                                                     |
| Klasy 4 i 7, albo 1, 4 i 7                                     | Suma uruchomionych zakresów: odpowiednio 4–8 albo 1–8, z zachowaniem serii               |
| Zwykły klient: 2026→{4}, 2025→{7}, 2024→{8}                    | Baza {4,7,8}, promocja {5,6}, automat {4,5,6,7,8}, powód `order_ranges`                  |
| Brak kwalifikującego zamówienia 2026; 2025→{5}, 2024→{7}       | Baza {5,7}, brak nowej promocji, automat {5,7}                                           |
| Poniżej progu w 2026, kwalifikujące w latach bazowych          | Wynik jak przy braku kwalifikującego zamówienia 2026; historyczna baza nie znika         |
| Edycja zamówienia lub korekta usuwa kwalifikację w `orderYear` | Usunięcie promocji zależnej od tego zamówienia, zachowanie niezależnej historycznej bazy |
| BOK odmawia klasy 5 i nadaje 3 przy automacie 4–8              | `finalAccess={3,4,6,7,8}`; zapisany automat nadal 4–8                                    |
| Ponowne przeliczenie tych samych danych                        | Brak duplikatów warstw i klas; brak nadpisania BOK                                       |

Do automatyzacji potrzebne są: odczyt kwalifikujących klas i warstw, zapis kontrolowanych zamówień historycznych, wyznaczenie `baseOrderYears` oraz dane szkoły bez niezależnej ścieżki testowej i nauczyciela bez aktywnej ścieżki tymczasowej. Nie wystarczy końcowy status Przyznano na obecnej szkole Testowej.

### Nowy nauczyciel i daty graniczne

Reguła działa per przedmiot od dnia otwarcia formularzy do 30 września włącznie. Wymaga aktywnego naszego potwierdzenia i jednego z warunków: jest to pierwsze potwierdzenie klubowe z danego przedmiotu albo w poprzednim roku występował status obcy/obcy po GWO. Do sierpnia analizowane są N i N+1, we wrześniu N i N−1. Potwierdzenie musi być wprowadzone w okresie działania reguły. Nie są analizowane zamówienia, progi ani status klienta. Zapis obejmuje automat, podstawę reguły i `validTo` równy 30 września roku zastosowania; powód w UI pozostaje ukryty przy przyznaniu.

| Dane lub zdarzenie                                                           | Oczekiwane sprawdzenie                                                                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Dzień przed otwarciem, dzień otwarcia, 31 sierpnia                           | Granica początku oraz analiza wyłącznie właściwych potwierdzeń N/N+1                                                          |
| 1 i 30 września                                                              | Analiza N/N−1, dostęp ważny do 30 września                                                                                    |
| 1 października                                                               | Ścieżka wygasa; standardowa kwalifikacja może przyznać albo odmówić, nie wolno utrzymywać dostępu wyłącznie z wygasłej reguły |
| Pierwsze potwierdzenie, poprzednio obcy, poprzednio obcy po GWO              | Trzy niezależne warianty wejścia do reguły                                                                                    |
| Poprzednio nasze dla tego samego przedmiotu                                  | Brak kwalifikacji jako nowy nauczyciel na tej podstawie                                                                       |
| Nowy tylko z Fizyki, kontynuujący Matematykę                                 | Tymczasowa ścieżka dotyczy wyłącznie właściwego przedmiotu                                                                    |
| Deklaracja 0, 2 albo 4                                                       | Zakres odpowiednio 0, 1–3 albo 4–8                                                                                            |
| Seria Moim zdaniem oraz zakresy Fizyki                                       | Octopus respektuje serię zakupu i deklaracji; nie przenosi automatycznie rozszerzeń wykonywanych w innych systemach           |
| Brak zamówień albo ilość poniżej progu                                       | Nie blokuje tej ścieżki; nie tworzy `baseAccess` z deklaracji                                                                 |
| Usunięcie, negatywna weryfikacja, obce we wszystkich klasach lub zawieszenie | Brak aktywnego dostępu z tej podstawy, także przy BOK                                                                         |

Potrzebny jest sposób przeliczenia z zadanym czasem serwera lub kontrolowane środowisko z odpowiednią datą. Zegar przeglądarki nie zmienia `processDate` serwera. Reguły ważnej do września nie da się pozytywnie zweryfikować zwykłym przebiegiem 15 października 2026.

### Szkoła testowa i ochrona przejściowa

Szkoła testowa przyznaje dostęp z aktywnego naszego potwierdzenia bez analizy zamówień, progów, statusu klienta i reguły nowego nauczyciela. PERM-21–PERM-22 pokrywają efekt mapowania 4/7→4–8 dla Matematyki. Nadal potrzebne są przypadki 0→0, 1–3→1–3, Macierz Szkolna i Zagranica, brak ingerencji w dotychczasowe zasady szkół średnich oraz zapis odrębnej podstawy kwalifikacji.

Zmiana flagi szkoły musi przeliczać wszystkie właściwe aktywne potwierdzenia nauczycieli. Po zdjęciu flagi i po przywróceniu automatu ma obowiązywać aktualna standardowa ścieżka; przy zachowanej fladze — ścieżka testowa. Wymaga to oddzielnej szkoły do zmiany flagi i co najmniej dwóch bezpiecznie sprzątanych nauczycieli, bez przełączania współdzielonych szkół bieżącego pakietu.

W maju–sierpniu `finalAccessTransition=finalAccess(N) union finalAccess(N+1)`, a we wrześniu `finalAccess(N−1) union finalAccess(N)`. Decyzje BOK wpływają tylko na wynik roku, dla którego je zapisano; nie są kopiowane między latami. Plan testów obejmuje sumę i deduplikację zakresów, odmienne BOK dla tej samej klasy w dwóch latach oraz wygaszenie ochrony po okresie przejściowym. Ochrony nie należy zapisywać jako osobnej warstwy automatu.

## Uruchamianie i analiza błędów

W panelu Test Runner pakiet Szkoły zawiera THR, a pakiet Nauczyciele zawiera PERM, ACC i ACL. Można zaznaczyć pojedyncze ID. Grep `@threshold` wybiera progi, `@entitlement` pozostałe trzy pliki, `@access-api` eksport, a `@access-lifecycle` zdarzenia. Po zmianie konfiguracji pakietów należy ponownie uruchomić serwer panelu, ale dopiero po zakończeniu trwających testów.

Testy korzystają z aktywnego roku potwierdzeń 2026/2027. Zmiana `OCTOPUS_TFL_CURRENT_SCHOOL_YEAR` dotyczy również tych fixture, ale nie zmienia historycznej daty wejścia w życie nowego wzoru.

Jeżeli przygotowanie zatrzyma się na braku rekordu uprawnienia, sprawdź zapis potwierdzenia i mechanizm uruchamiania kwalifikacji. Nie zastępuj odpowiedzi pustą atrapą i nie usuwaj asercji widoczności. Dla pustej liczby uczniów i 0 oczekiwany próg to 10; minimum 1 ze wzoru dotyczy dodatniej liczby uczniów.

## Brakujące pokrycie

### Migracja progów z 2026 na lata 2024 i 2025

Istniejące progi historyczne 10 dla lat 2024 i 2025 mają zostać zastąpione progami tej samej szkoły z 2026. Dotyczy to dostępu cyfrowego, wysyłki gratisów i LS. Mechanizm wyznaczania progów na 2026 pozostaje bez zmian, w tym minimum 5 dla wysyłki. Nie wprowadzamy nowej reguły wyliczania LS — punktem odniesienia jest obowiązujący próg tego mechanizmu na 2026.

To zastępuje wcześniejsze założenie o pozostawieniu stałych progów historycznych 10/8 lub zastosowaniu nowego progu tylko wtedy, gdy jest niższy. Próg ma zostać skopiowany również wtedy, gdy rośnie powyżej 10.

Po migracji trzeba ponownie wyliczyć uprawnienia na 2026 na podstawie zamówień z 2024 i 2025. Samo wyświetlenie nowej liczby w UI nie potwierdza wykonania przeliczenia.

| Przypadek do sprawdzenia                               | Oczekiwany wynik                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Próg szkoły na 2026 wynosi 8                           | Zapisane progi 10 na 2024 i 2025 zmieniają się na 8; 2026 pozostaje 8                                               |
| Próg szkoły na 2026 wynosi 24                          | Zapisane progi 10 na 2024 i 2025 zmieniają się na 24; 2026 pozostaje 24                                             |
| Próg szkoły na 2026 wynosi 10                          | Historyczne progi pozostają 10                                                                                      |
| Brak liczby uczniów albo 0                             | Obowiązuje domyślne 10, także jako wartość odniesienia migracji                                                     |
| Dwie szkoły mają progi 8 i 24                          | Każda otrzymuje własny próg; brak kopiowania wartości między szkołami                                               |
| Zamówienie historyczne 8 szt., próg spada z 10 do 8    | Po przeliczeniu spełnia próg ilościowy; dostęp nauczyciela nadal zależy od aktywnego potwierdzenia i warstw decyzji |
| Zamówienie historyczne 10 szt., próg rośnie z 10 do 24 | Po przeliczeniu nie spełnia progu ilościowego; niezależna promocja nie może maskować wyniku kwalifikacji bazowej    |
| Ponowne wykonanie aktualizacji                         | Te same progi i brak zduplikowanych rekordów; dane zamówień i progi na 2026 pozostają niezmienione                  |

Ta macierz jest zakresem do zaimplementowania, a nie listą wykonanych lub gotowych scenariuszy Playwright. Potrzebny jest kontrakt odczytu zapisanych progów rocznych dla trzech rodzajów uprawnień oraz wyników kwalifikacji bazowej, a także kontrolowany sposób wykonania migracji i przeliczenia. Obecny zestaw odczytuje pojedynczy próg cyfrowy szkoły i wynik uprawnień nauczyciela; to nie wystarcza do potwierdzenia migracji zapisanych danych.

| Obszar                            | Co pozostaje i czego potrzeba                                                                                                                                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roczne progi cyfrowe i wysyłkowe  | Niezależny zapis per szkoła, rok i klasa, minimum wysyłkowe 5, jedna obowiązująca wartość oraz maksymalnie jeden roczny wpis historii per próg. Potrzebny kontrakt odczytu progów i historii oraz sposób przeliczenia wskazanego roku. Obecny UI pokazuje jedną wartość cyfrową. |
| Dane historyczne i cykl dotacyjny | Migracja progów 2024/2025 do wartości z 2026, przeliczenie uprawnień na 2026 i mapowanie n+1/n/n-1. Zakres migracji opisano powyżej; potrzebne są kontrolowane dane historyczne, odczyt progów rocznych i wyzwalacz kwalifikacji.                                                |
| Reprezentacja braku danych SIO    | THR-21 sprawdza zapis pustego pola i domyślne 10 w UI. Oddzielna kontrola zapisanego `null` w API pozostaje poza tym sprawdzeniem.                                                                                                                                               |
| Oddzielne warstwy dostępu         | Rozdzielenie baseAccess i promotionAccess, osobna podstawa szkoły testowej/nowego nauczyciela, automat niezależny od BOK oraz ochrona jako suma finalAccess odpowiednich lat. Potrzebny odczyt warstw i kontrolowany processDate; końcowy status nie wystarcza.                  |
| Klasa 0                           | Dostęp bazowy wyłącznie do 0 i brak promocji. Potrzebne dane kwalifikacji bez ścieżki szkoły Testowej lub nowego nauczyciela.                                                                                                                                                    |
| Manualna pojedyncza klasa         | PERM-18 kontroluje pojedynczą odmowę i brak ingerencji w pozostałe klasy. Nadal potrzebne jest przeliczenie automatu pozostałych klas przy aktywnej decyzji BOK tylko dla jednej klasy, z odczytem oddzielnych warstw.                                                           |
| Dostęp bez zamówień               | Deterministyczny przypadek Brak dostępu/Brak zamówień, Za mała ilość i granice próg−1/próg/próg+1 bez niezależnych promocji.                                                                                                                                                     |
| Eksport SŚ i brak scope           | ACC-07–ACC-08 pokrywają różne scope tej samej klasy i ich odrębne cofnięcie. Nadal brak scenariuszy aktywnych/usuniętych formularzy SŚ i rzeczywistego braku scope→4.                                                                                                            |
| Izolacja innych nauczycieli       | Cofnięcie dostępu jednemu nauczycielowi bez zmiany innych osób i szkolnej kwalifikacji zamówień; ACL-04 sprawdza inne potwierdzenie tej samej osoby, ACL-11 zachowanie zamówienia, nie całą kwalifikację szkoły.                                                                 |
| Prezentacja i role                | Pełna kolorystyka, wybór roku w UI, zakres tylko przyznanych klas dla częściowego wyniku, pełny audyt autora i daty oraz konta bez prawa edycji.                                                                                                                                 |

Aktualny zakres jest częściowy i powinien być rozszerzany po udostępnieniu brakujących kontraktów i danych. Sezonowe pominięcia DEB wynikają z rzeczywistej daty obowiązywania reguły, nie zastępują sprawdzenia brakujących warstw.

Audyt nazw danych testowych z 23.10.2026: raport `64b2fdb2-fc38-4e89-b216-c6186b1f3411` zawiera 9 FAIL na wspólnej kontroli starego fragmentu nazwy `_ENT_UNMARKED_` oraz 6 pominięć sezonowych. Przypadki FAIL nie dotarły do oceny promocji. W `expectUnmarkedRecords` zastosowano wspólny wzorzec `entitlementSchoolPattern(OCTOPUS_ENV, true)`, obsługujący dawne nazwy oraz aktualne EU/P26, z zachowaniem odczytu nazwy i flag Testowy w UI. Przejrzano kontrole nazw w testach, przygotowaniu danych, API zamówień i potwierdzeń oraz sprzątaniu. Pozostałe odwołania do REG dotyczą pełnej tożsamości rejestru/e-maila, a nie nazwiska widocznego w aplikacji. Dodano kontrolę lokalną poprawnej nazwy, obcego środowiska, innej przestrzeni danych, zmienionej nazwy oraz włączonych flag Testowy. Wynik wymaga ponownego uruchomienia promocji na DEV.
