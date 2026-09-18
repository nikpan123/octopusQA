# Octopus — plan regresji, wersja robocza

Data rozpoznania: 2026-09-17. Środowisko: https://octopus.gwodev.pl.
Użytkownik potwierdził, że to dev i można tworzyć dane testowe.

Aktualizacja: wykonano pierwszy przebieg REG_20260917_01. Wyniki, ID danych i obserwacja dotycząca normalizacji nazwiska znajdują się w [raporcie](raport-regresji-REG_20260917_01.md). Poniższy katalog zachowuje pierwotny projekt scenariuszy; statusy wykonania należy odczytywać z raportu przebiegu.

Rozszerzenie: dodano testy TEA-02 (4 warianty), TEA-03, SCH-02, EDIT-02 oraz FIND-04 dla szkół i nauczycieli. Aktualny zestaw liczy 10 przypadków; najnowsze wyniki opisano w WERYFIKACJA.md. Poprawiono przygotowanie wyszukiwania i oczekiwanie na formularz; oba przypadki FIND-04 przeszły. Osobną obserwację dotyczącą wejścia bezpośrednim linkiem do kartoteki opisuje OCT-OBS-002.

Trzecie rozszerzenie: **ORD-01** — zamówienie szkoły i **CLUB-01** — przedmiotopoziom oraz formularz klubowy. Zestaw liczy teraz **18 testów**. Oba nowe scenariusze przeszły razem na dev; szczegóły w WERYFIKACJA.md.

## Podstawa i ograniczenia

Drugie rozszerzenie: EDIT-03 (nazwisko i historia), TEA-04 (błędny e-mail / telefon), FIND-05 (e-mail / nazwisko), REL-02 (druga szkoła). Łącznie 16 testów. Wszystkie sześć nowych przypadków uzyskało PASS w weryfikacji opisanej w WERYFIKACJA.md; EDIT-03 po poprawieniu danych i osobnym uruchomieniu. Nie wykonywano jeszcze całego zestawu 16 przypadków razem.

Rozpoznano interfejs zalogowanej sesji: panele Nauczyciele i Szkoły, formularze tworzenia i wyszukiwania oraz menu główne. W pierwszym przebiegu utworzono szkołę 93033 i nauczyciela 532276 oraz sprawdzono relację, edycję i historię. Nie analizowano kodu źródłowego aplikacji, API ani konfiguracji ról. Ten plik jest katalogiem scenariuszy; wyniki wykonania znajdują się w raportach. Niepotwierdzone oczekiwania wymagają uzgodnienia z osobą znającą reguły biznesowe.

## Mapa funkcji

| Obszar | Zaobserwowane elementy | Zakres rozpoznania |
|---|---|---|
| Dostęp | Bramka GitLab, zalogowany panel, Wyloguj | Logowanie wykonane przez użytkownika; wylogowania nie badano |
| Nauczyciele | Szukaj, Dodaj, historia wyszukiwania i oglądania; dane podstawowe, kontaktowe, zgody, szkoły, przedmioto-poziomy | Obejrzano panel i dwa formularze |
| Kartoteka nauczyciela | Potwierdzenia, Uprawnienia, Z czego uczy, Kontakty, Gratisy, Lepsza Szkoła, Mailingi, Kluby, Promotorzy, Historia zmian | Widoczne zakładki; zawartość dla rekordu wymaga zbadania |
| Szkoły | Szukaj, Dodaj, historia wyszukiwania; dane podstawowe i kontaktowe, RODO, dyrektor, promotor | Obejrzano pusty panel |
| Kartoteka szkoły | Nauczyciele, Zamówienia, Kontakty, Mailingi, Historia zmian, Struktura | Widoczne zakładki; zawartość dla rekordu wymaga zbadania |
| Narzędzia | Usuwanie dubli, Dodaj spotkanie, Akcja SIO, Likwidacja rekordów | Obejrzano menu |
| Mailingi | Mailer, Do odblokowania w GR, Wgraj odrzuconych, Wgraj odblokowanych | Obejrzano menu |
| Pozostałe moduły | Centrum wysyłkowe, IRE, Call Center, Marchewka | Widoczne przyciski nawigacji |
| Raporty i administracja | Raporty, Ustawienia konta, Panel administracyjny, Uprawnienia do raportów | Obejrzano menu |

## Dane do powtarzalnych testów

- Każdy przebieg otrzymuje identyfikator, np. REG_20260917_01; identyfikator zapisujemy w obsługiwanym polu tekstowym, a ID utworzonych rekordów w raporcie.
- Przygotować dwie syntetyczne szkoły i dwóch syntetycznych nauczycieli; jeden nauczyciel powiązany z dwiema szkołami.
- Osobny zestaw do duplikatów, walidacji i operacji usuwania. Nie używać istniejących rekordów jako danych do modyfikacji bez ustalenia ich przeznaczenia.
- Po zapisie rekordu zaznaczyć „Testowy” w panelu; mechanizm sprawdzono w pierwszym przebiegu.
- Przed testami wysyłek ustalić odbiornik testowy oraz to, czy dev wysyła rzeczywiste wiadomości lub zlecenia do systemów zewnętrznych. Samo środowisko dev nie dowodzi izolacji integracji.
- Sprzątanie musi korzystać z potwierdzonego mechanizmu aplikacji; nie zakładać, że usunięcie jest odwracalne.

## Pierwszy zestaw scenariuszy

P0: proponowany krótki zestaw przed wydaniem. P1: rozszerzona regresja. Zakres wykonany i statusy są w raporcie REG_20260917_01. Pozostałe przypadki pozostają NIEURUCHOMIONE. Oczekiwania są robocze, z wyjątkiem reguł jawnie potwierdzonych przez użytkownika.

| ID | Priorytet | Warunek i kroki | Proponowany oczekiwany wynik |
|---|---|---|---|
| AUTH-01 | P0 | W nowej sesji otworzyć link panelu; przejść poprawne logowanie GitLab i dalszy dostęp do Octopusa | Użytkownik trafia do właściwego panelu; powrót przez returnUrl działa |
| AUTH-02 | P0 | W osobnej sesji testowej wylogować się i ponownie wejść bezpośrednio na adres panelu | Dane chronione nie są dostępne bez wymaganej sesji; zakres wylogowania GitLab/Octopus do ustalenia |
| NAV-01 | P0 | Przejść Nauczyciele → Szkoły → Nauczyciele | Odpowiedni panel i tytuł; brak pomieszania danych obu kartotek |
| TEA-01 | P0 | Przygotować szkołę; Dodaj nauczyciela; wypełnić wymagane dane, źródło i szkołę; zapisać; wyszukać i otworzyć ponownie | Jeden rekord z ID; zapisane dane i powiązanie są trwałe |
| TEA-02 | P0 | Otworzyć Dodaj; próbować zapisu bez nazwiska, imienia lub szkoły, osobno dla każdego braku | Czytelna walidacja; brak częściowo utworzonego rekordu. Obowiązkowość ustalona wstępnie z gwiazdek formularza |
| TEA-03 | P1 | Wprowadzić dane nowego nauczyciela; Anuluj; następnie wyszukać po unikalnej nazwie | Formularz zamknięty, rekord nieutworzony |
| SCH-02 | P1 | Uzupełnić kompletny formularz szkoły i anulować; ponownie otworzyć panel i wyszukać unikalną nazwę | Brak zapisanego rekordu |
| EDIT-02 | P1 | Na osobnym nauczycielu zmienić imię i nazwisko, anulować; otworzyć kartotekę ponownie | Poprzednie dane, powiązanie i flaga Testowy zachowane; historia identyczna jak przed anulowaniem |
| TEA-04 | P1 | Sprawdzić niepoprawny e-mail, telefon i datę oraz wartości graniczne według ustalonej specyfikacji | Walidacja zgodna z regułami; bez utraty pozostałych danych |
| TEA-05 | P1 | Wpisać dane podobne do przygotowanego nauczyciela | Lista podobnych osób wskazuje właściwy rekord; zasady blokowania duplikatu do ustalenia |
| FIND-01 | P0 | Wyszukać znanego nauczyciela po jego ID; otworzyć wynik | Wynik wskazuje właściwy rekord i zgodne szczegóły |
| FIND-02 | P1 | Osobno wyszukać po nazwisku, imieniu, e-mailu, telefonie i numerze karty na przygotowanych danych | Wyniki zgodne z ustaloną semantyką dopasowania |
| FIND-03 | P1 | Połączyć kryteria osoby, szkoły, przedmiotu, poziomu i statusu | Wyniki zgodne z ustaloną logiką łączenia filtrów |
| FIND-04 | P1 | Wyszukać unikalną nieistniejącą wartość po wcześniejszym udanym wyszukiwaniu | Czytelny brak wyników; poprzednie wyniki nie są prezentowane jako nowe |
| FIND-05 | P1 | Wybrać powiat, gminę, zmienić powiat | Gmina jest zgodna z powiatem; nieaktualny wybór nie wpływa na wyszukiwanie |
| FIND-06 | P1 | Wykonać dwa wyszukiwania i otworzyć dwa rekordy; obejrzeć obie historie | Historia wskazuje właściwe kryteria/rekordy i pozwala wrócić do odpowiedniego kontekstu |
| SCH-01 | P0 | Po rozpoznaniu formularza dodać syntetyczną szkołę, wyszukać i ponownie otworzyć | Jeden trwały rekord z poprawnymi danymi; wymagane pola do ustalenia |
| REL-01 | P0 | Powiązać syntetycznego nauczyciela ze szkołą; obejrzeć obie kartoteki | Relacja widoczna po obu stronach, bez duplikacji |
| REL-02 | P1 | Powiązać nauczyciela z drugą szkołą i przypisać przedmiot/poziom | Dane globalne i szkolne zgodne z ustalonym modelem; pierwsze powiązanie pozostaje prawidłowe |
| EDIT-01 | P0 | Zmienić pojedyncze pole rekordu testowego; ponownie otworzyć | Zmiana trwała; dopuszczona potwierdzona normalizacja wielkości liter imienia i nazwiska; pozostałe dane bez niezamierzonych zmian |
| NORM-01 | P1 | Na nauczycielu testowym wpisać imię JaN w edycji, zapisać, ponownie otworzyć rekord i sprawdzić historię | Imię Jan; wartość trwała i zgodna z historią. Reguła potwierdzona przez użytkownika. Wariant z imieniem Jan wykonano na dev — PASS. |
| AUDIT-01 | P1 | Po kontrolowanej zmianie otworzyć Historię zmian | Zapis zmiany zgodny z wymaganym zakresem audytu; autor, czas i wartości do potwierdzenia |
| CONSENT-01 | P1 | Na rekordzie testowym sprawdzić zapis kombinacji zgód | Zgody utrwalone dokładnie według wyboru; wpływ na wysyłki do osobnego potwierdzenia |
| TAB-01 | P1 | Dla przygotowanego rekordu otworzyć kolejno każdą zakładkę kartoteki | Właściwy kontekst osoby/szkoły, czytelny stan pusty lub zgodne dane |
| ROLE-01 | P0 | Powtórzyć dostęp do funkcji chronionych na kontach o uzgodnionych rolach, także przez bezpośredni adres | Dostęp zgodny z macierzą uprawnień, również poza widocznością menu |

## Kolejne etapy

1. Pierwszy przebieg tworzenia szkoły i nauczyciela, powiązania, wyszukiwania oraz edycji wykonano. Samodzielny kod tego procesu znajduje się w `tests/szkola-nauczyciel.spec.ts`; sposób uruchomienia w README.md. Status sprawdzenia skryptu jest niezależny od wyniku wcześniejszego przebiegu sterowanego przez asystenta.
2. Potwierdzić reguły walidacji, duplikatów, relacji i historię zmian. Rozpisać zakładki na osobne operacje i testy.
3. Osobno rozpoznać Centrum wysyłkowe, IRE, Call Center, Marchewkę, raporty i narzędzia. Widoczność pozycji menu nie oznacza pokrycia regresją.
4. Ustalić role oraz izolację integracji, potem zaplanować wysyłki, importy i operacje zbiorcze.
5. Zautomatyzować stabilne scenariusze przeglądarkowe; każda asercja powinna badać wynik biznesowy i trwałość danych. Do testów API i jednostkowych potrzebny będzie dodatkowy dostęp lub dokumentacja.

## Raport każdego przebiegu

Zapisywać: identyfikator scenariusza, wersję aplikacji (jeśli dostępna), datę, rolę, ID danych testowych, wynik PASS/FAIL/BLOCKED, wynik rzeczywisty i dowód błędu bez haseł ani tokenów. Nie oznaczać przypadku PASS tylko dlatego, że ekran się otworzył.

## Pytania do właściciela produktu / zespołu

- Które trzy procesy są najważniejsze przed wydaniem?
- Jakie istnieją role i czy będą dostępne konta do ich testowania?
- Które integracje na dev są rzeczywiste, a które zastąpione atrapą lub odbiornikiem testowym?
- Kto potwierdzi niejednoznaczne oczekiwane wyniki i zasady duplikatów?
- Jak identyfikować wdrożoną wersję i odtwarzać/sprzątać dane testowe?
