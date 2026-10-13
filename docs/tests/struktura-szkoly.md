# Struktura szkoły — plan testów

## 1. Cel

Plan obejmuje zakładkę `Struktura` na karcie szkoły oraz model relacji pomiędzy placówkami. Źródłem zakresu są wymagania funkcjonalne dotyczące identyfikacji jednostek, typów powiązań, CRUD relacji, walidacji hierarchii i audytu oraz aktualny wygląd interfejsu.

Zaimplementowane testy znajdują się w:

```text
tests/szkola-struktura.spec.ts
tests/szkola-struktura-dodawanie.spec.ts
tests/support/school-structure.ts
tests/support/school-structure-api.ts
tests/support/school-structure-data.ts
```

Identyfikatory `STR-*` są zarezerwowane dla tego obszaru.

Opis faktycznych działań, sprawdzeń i sprzątania wszystkich scenariuszy znajduje się w [dokumencie krok po kroku](struktura-szkoly-krok-po-kroku.md). Ten plan opisuje wymagania i zakres, a dokument szczegółowy wyjaśnia, co rzeczywiście wykonuje obecny kod każdego testu.

Stan automatyzacji:

- wszystkie scenariusze `STR-01`–`STR-106` mają implementację: 87 na istniejącym profilu i 19 podczas dodawania nowej szkoły;
- brak `fixme`, `skip` i pustych scenariuszy;
- osiem testów `test.fail` dokumentuje niezgodności DEV względem oczekiwań testów: `STR-38`, `STR-49`, `STR-50`, `STR-51`, `STR-53`, `STR-72`, `STR-74`, `STR-87`;
- pozostałe 98 scenariuszy wymaga prawidłowego wyniku bez oczekiwanej porażki;
- scenariusze zapisu korzystają z dedykowanych szkół `AUTO_STR_<ŚRODOWISKO>_*`; szkoły są współdzielone, natomiast relacje są usuwane po teście przez obsługiwaną akcję aplikacji;
- backlog bez reprezentacji w kodzie: 0 scenariuszy.

`test.fail` nie pomija scenariusza: wykonuje go i oczekuje potwierdzonej niezgodności. Naprawa aplikacji powoduje wynik „unexpectedly passed”, wymagający usunięcia oznaczenia po weryfikacji. Zielony wynik takiego uruchomienia nie oznacza braku defektów produktu. STR-51 dotyczy dodatkowego kontraktu ochrony przed utratą równoczesnej edycji, a nie potwierdzonego przez użytkownika wymagania biznesowego.

Sprostowanie STR-20: obie akcje „Pokaż…” otwierają wyniki w nowej karcie. Wcześniejsza diagnoza błędu filtrowania wynikała z badania pierwotnej karty; została wycofana. STR-20 i niezależny STR-85 przechodzą po sprawdzaniu właściwej karty.

## 2. Obserwowany interfejs

Zakładka `Struktura` udostępnia:

- pusty stan `Brak struktury organizacyjnej.`;
- przyciski `Pokaż zaznaczone`, `Pokaż wszystkie` i `Dodaj powiązanie`;
- wyniki obu akcji `Pokaż…` w nowej karcie przeglądarki;
- dialog `Dodaj powiązanie - szkoły w strukturze`;
- kryteria wyszukiwania: ID szkoły, Nazwa szkoły, Kod pocztowy, Miejscowość i Ulica;
- tabelę wyników: Dodaj, ID, Poziom, Nazwa Szkoły i Adres Szkoły;
- tabelę istniejących powiązań: Usuń, ID, Poziom, Nazwa szkoły, Adres Szkoły, Typ relacji i Hierarchia;
- akcje `Anuluj` i `Zapisz`;
- walidację pustego wyszukiwania z komunikatem `Wyszukiwanie nie może być puste`.

## 3. Dane testowe i bezpieczeństwo

- Testy zapisu korzystają z dedykowanych szkół oznaczonych jako testowe, tworzonych jednokrotnie i zapamiętywanych lokalnie osobno dla DEV i TEST. Projekt nie usuwa tych placówek po każdym scenariuszu.
- Każdy test zmieniający relację przywraca stan początkowy w `finally` przez ikonę śmietnika lub potwierdzone API `DeleteInstitutionsRelation`. Cleanup API sprawdza, czy obie strony należą do rozwiązanych szkół `AUTO_STR_*`, a następnie potwierdza pusty aktywny graf.
- Znane krawędzie są usuwane przed ponownym odczytem grafu, aby przerwać ewentualny cykl zaakceptowany przez wadliwy backend. Niepowodzenie cleanupu nie jest traktowane jako oczekiwana porażka produktu.
- Jedna dedykowana szkoła `AUTO_STR_<ŚRODOWISKO>_NIEAKTYWNA` jest zawieszona i pozostaje jako wielokrotnie używana fixture do `STR-79`. Pozostałe fixture muszą być aktywne i mieć przypisany typ.
- `STR-80` tworzy rzeczywiste zamówienie na dedykowanej szkole, sprawdza potwierdzenie usuwania relacji oraz zachowanie zamówienia po anulowaniu, a następnie usuwa nowo utworzone zamówienie w `finally`.
- Scenariusze modyfikujące tę samą strukturę nie mogą działać równolegle. Należy umieścić je w osobnym serialowym `describe` albo zapewnić niezależny zestaw danych na worker.
- Test soft delete nie może opierać się wyłącznie na zniknięciu wiersza z UI. Powinien dodatkowo potwierdzić stan nieaktywny przez API lub odczyt techniczny przygotowany dla testów.

### Potwierdzony kontrakt usuwania i reaktywacji (2026-10-13)

- Usunięcie ustawia w bazie `is_Del = 1`; rekord nie jest fizycznie usuwany. Zwykły użytkownik nie ma przycisku undo. Osobna operacja przywracania jest dostępna wyłącznie Zespołowi DPD.
- Ponowne dodanie tej samej konfiguracji ustawia `is_Del = 0`. `STR-35` sprawdza zachowanie identyfikatora rekordu, a `STR-36` możliwość ponownego dodania z poziomu UI.
- `STR-34` sprawdza potwierdzenie usunięcia, pusty stan po ponownym wejściu i brak relacji w aktywnym odczycie API. Samą wartość `is_Del` należy potwierdzić osobnym odczytem technicznym; aktywne drzewo jej nie ujawnia.
- Dodawanie i edycja używają `POST /api/Institution/AddOrUpdateInstitutionRelations`, usuwanie `DELETE /api/Institution/DeleteInstitutionsRelation`, a odczyt drzewa `GET /api/Institution/GetInstitutionRelations`.

### Potwierdzone reguły funkcjonalne i dalsze pokrycie (2026-10-13)

Hierarchia dotyczy wyszukanej szkoły względem szkoły kontekstowej. Dla wszystkich trzech typów `Nadrzędna` oznacza wyszukaną szkołę jako rodzica, a `Podrzędna` jako dziecko. W wielobudynkowości wybór `Nadrzędna` oznacza wyszukaną szkołę główną i kontekstową lokalizację dodatkową.

- Relacje bezpośrednie można edytować i usuwać. Pośrednie są tylko do odczytu; modyfikacja wymaga przejścia do właściwego profilu. Formularz edycji pozwala zmienić typ i hierarchię, ale nie szkołę powiązaną.
- Szkoła może być dzieckiem w jednej relacji i rodzicem w innej. Poprawny przykład to zespół → szkoła główna → filia → lokalizacja. Niedozwolone są cykle dowolnej długości i przypisanie jednej filii do dwóch szkół głównych. Użytkownik potwierdził brak limitu głębokości oraz jedną aktywną relację dla pary szkół. Testujemy reprezentatywne struktury o czterech i siedmiu poziomach oraz cykle bezpośrednie, trójwęzłowe i siedmiowęzłowe.
- Formularz musi wymagać obu stron i typu relacji oraz blokować samopowiązanie, duplikat w tym samym lub przeciwnym kierunku i sprzeczne role. Placówki muszą być aktywne i mieć typ. Edycja/usunięcie powiązane z aktywnymi zamówieniami, spotkaniami SI lub raportami wymaga ostrzeżenia albo potwierdzenia.
- W profilu dodatkowej lokalizacji można modyfikować wyłącznie bezpośrednią relację wielobudynkową ze szkołą główną. Inne relacje modyfikuje się z profilu szkoły głównej.
- Widok pokazuje całe drzewo bez rozwijania/zwijania, z wcięciami i ikonami przed nazwami. Lokalizacje wielobudynkowe są pierwszymi dziećmi niezależnie od kolejności zapisu, a poddrzewo każdej jednostki pozostaje bezpośrednio pod nią. Pusty stan nie zawiera węzłów; dostępność dodawania zależy od uprawnień.

Zakres uzgodniony z użytkownikiem obejmuje obecne konto z pełnymi uprawnieniami, UI i dostępne publiczne API. Odczyt `is_Del` w bazie, migracje schematu i inne role nie są dostępne w tej sesji. Osiem niezgodności pozostaje w aplikacji mimo kompletnej implementacji testów tego zestawu.

## 4. Etap 1 — interfejs, wyszukiwanie i podstawowy zapis

| ID       | Priorytet | Warstwa | Scenariusz                                     | Oczekiwany rezultat                                                                                                         |
| -------- | --------- | ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `STR-01` | P0        | UI      | Otwarcie zakładki dla szkoły bez relacji       | Widoczny jest komunikat `Brak struktury organizacyjnej.`, a tabela nie zawiera wierszy.                                     |
| `STR-02` | P1        | UI      | Stan przycisków dla pustej struktury           | `Pokaż zaznaczone` i `Pokaż wszystkie` są nieaktywne; `Dodaj powiązanie` jest dostępne.                                     |
| `STR-03` | P0        | UI      | Otwarcie dialogu dodawania                     | Dialog ma właściwy tytuł, oba zestawy tabel, komplet filtrów oraz akcje `Anuluj` i `Zapisz`.                                |
| `STR-04` | P0        | UI      | Puste wyszukiwanie                             | Pojawia się jeden modal `Uwaga` z tekstem `Wyszukiwanie nie może być puste`; po `OK` dialog relacji pozostaje otwarty.      |
| `STR-05` | P1        | UI      | Anulowanie pustego dialogu                     | Dialog zamyka się, nie powstaje relacja, a pusty stan zakładki pozostaje bez zmian.                                         |
| `STR-06` | P0        | UI/API  | Wyszukiwanie szkoły po dokładnym ID            | Wynik zawiera dokładnie właściwą szkołę i pokazuje zgodne ID, poziom, nazwę oraz adres.                                     |
| `STR-07` | P1        | UI      | Wyszukiwanie po pełnej nazwie                  | Lista zawiera szkołę o oczekiwanym ID; podobna nazwa innej szkoły nie powoduje błędnego wyboru.                             |
| `STR-08` | P1        | UI      | Wyszukiwanie po fragmencie nazwy               | Zwracane są wyłącznie szkoły pasujące do wpisanego fragmentu zgodnie z ustaloną semantyką wyszukiwarki.                     |
| `STR-09` | P1        | UI      | Wyszukiwanie po kodzie pocztowym               | Każdy wynik ma oczekiwany kod pocztowy.                                                                                     |
| `STR-10` | P1        | UI      | Wyszukiwanie po miejscowości                   | Każdy wynik należy do wybranej miejscowości.                                                                                |
| `STR-11` | P1        | UI      | Wyszukiwanie po ulicy                          | Każdy wynik ma adres zawierający wskazaną ulicę.                                                                            |
| `STR-12` | P1        | UI/API  | Łączenie kilku kryteriów                       | Żądanie zawiera wszystkie filtry, a wynik spełnia ich część wspólną.                                                        |
| `STR-13` | P2        | UI      | Brak wyników dla nieistniejącego kryterium     | Aplikacja pokazuje kontrolowany pusty wynik i pozwala zmienić kryteria bez zamykania dialogu.                               |
| `STR-14` | P0        | UI/API  | Dodanie szkoły z wyników do dolnej tabeli      | Wybrana szkoła pojawia się raz w tabeli powiązań z właściwymi danymi; znika możliwość ponownego dodania tego samego wyniku. |
| `STR-15` | P1        | UI      | Usunięcie niezapisanej pozycji z dolnej tabeli | Pozycja znika z planowanych powiązań i może zostać ponownie wybrana z wyników.                                              |
| `STR-16` | P0        | UI/API  | Zapis pojedynczego poprawnego powiązania       | Wysłane zostaje jedno żądanie zapisu, dialog się zamyka, a relacja jest widoczna po odświeżeniu zakładki.                   |
| `STR-17` | P0        | UI/API  | Trwałość relacji po ponownym otwarciu szkoły   | Po przejściu do innej szkoły i powrocie relacja zachowuje ID, typ, kierunek i hierarchię.                                   |
| `STR-18` | P1        | UI      | Anulowanie po dodaniu pozycji do dolnej tabeli | Żadne z przygotowanych powiązań nie zostaje zapisane.                                                                       |
| `STR-19` | P1        | UI/API  | Dodanie kilku szkół jednym zapisem             | Wszystkie wybrane, różne szkoły zostają zapisane dokładnie raz.                                                             |
| `STR-20` | P1        | UI      | `Pokaż zaznaczone`                             | Nowa karta zawiera tylko zaznaczoną szkołę; pierwotny profil i relacje pozostają bez zmian.                                 |

## 5. Etap 2 — typy relacji i reguły hierarchii

| ID       | Priorytet | Warstwa | Scenariusz                              | Oczekiwany rezultat                                                                                                        |
| -------- | --------- | ------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `STR-21` | P0        | UI/API  | `Zespół szkół → szkoła podrzędna`       | Można przypisać co najmniej SP, LO i Przedszkole do jednego zespołu; każda relacja ma właściwy typ i kierunek.             |
| `STR-22` | P0        | UI/API  | `Szkoła główna → Filia`                 | Jednostka główna i filia są jednoznacznie rozróżnione w obu widokach relacji.                                              |
| `STR-23` | P1        | UI/API  | Wielobudynkowość                        | Dodatkowa lokalizacja jest widoczna jako właściwy typ powiązania i nie jest mylona ze szkołą podrzędną.                    |
| `STR-24` | P0        | API     | Nieistniejący typ relacji               | API odrzuca nieznany wpis słownika; aktywna relacja nie powstaje.                                                          |
| `STR-25` | P0        | UI/API  | Duplikat tej samej relacji              | Druga relacja tego samego typu pomiędzy tą samą parą nie powstaje; użytkownik otrzymuje jednoznaczny komunikat.            |
| `STR-26` | P1        | API     | Drugi typ dla tej samej pary            | Pozostaje dokładnie jedna aktywna relacja, zgodnie z potwierdzoną regułą biznesową.                                        |
| `STR-27` | P0        | UI/API  | Samopowiązanie                          | Bieżącej szkoły nie można dodać jako jej własnej jednostki nadrzędnej ani podrzędnej.                                      |
| `STR-28` | P0        | API/UI  | Cykl bezpośredni A → B → A              | Drugi zapis jest blokowany, istniejąca relacja pozostaje bez zmian.                                                        |
| `STR-29` | P0        | API/UI  | Cykl pośredni A → B → C → A             | Zapis domykający cykl jest blokowany niezależnie od głębokości ścieżki.                                                    |
| `STR-30` | P1        | API/UI  | Cztery poziomy i wielorakie role        | Zespół → szkoła główna → filia → lokalizacja jest dostępny w całości.                                                      |
| `STR-31` | P1        | API/UI  | Hierarchia głębsza niż cztery poziomy   | Siedem poziomów jest zapisywanych i prezentowanych bez arbitralnego ograniczenia do czterech.                              |
| `STR-32` | P1        | UI/API  | Edycja typu relacji                     | Po zmianie aktualizują się dane i oba kierunki widoku; nie powstaje drugi rekord aktywny.                                  |
| `STR-33` | P1        | UI/API  | Zamiana stron relacji                   | Jednostka nadrzędna i podrzędna zostają zamienione tylko wtedy, gdy nowy układ przechodzi wszystkie walidacje.             |
| `STR-34` | P0        | UI/API  | Usunięcie relacji                       | Relacja znika z aktywnej struktury i operacji biznesowych, ale pozostaje jako nieaktywna w źródle technicznym.             |
| `STR-35` | P0        | UI/API  | Reaktywacja tego samego rekordu         | Ponowne dodanie tej samej konfiguracji przywraca ten sam identyfikator relacji. Osobne undo użytkownika nie jest dostępne. |
| `STR-36` | P1        | UI/API  | Ponowne dodanie relacji po soft delete  | Użytkownik może ponownie dodać relację, a struktura zawiera dokładnie jedno aktywne powiązanie.                            |
| `STR-37` | P1        | API     | Nieaktywna relacja nie wpływa na biznes | Usunięta relacja nie jest zwracana w aktywnym drzewie, wyszukiwaniu struktury ani logice zależnej od hierarchii.           |

## 6. Etap 3 — identyfikator Zespołu szkół, API, trwałość i audyt

| ID       | Priorytet | Warstwa | Scenariusz                            | Oczekiwany rezultat                                                                                                                   |
| -------- | --------- | ------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `STR-38` | P0        | UI/API  | Automatyczne nadanie ID Zespołu szkół | Nowo utworzony zespół otrzymuje widoczny, dokładnie trzycyfrowy identyfikator.                                                        |
| `STR-39` | P0        | API     | Różne ID dwóch zespołów               | Dwa dedykowane zespoły otrzymują różne ID i są jednoznacznie odczytywane przez publiczne API.                                         |
| `STR-40` | P0        | API     | Brak kolizji z numeracją szkół        | Identyfikator zespołu nie może być równy ID istniejącej jednostki innego typu.                                                        |
| `STR-41` | P0        | UI/API  | Wyszukiwanie zespołu po jego ID       | Wynik jednoznacznie identyfikuje zespół. Wymaganie trzech cyfr jest niezależnie egzekwowane przez STR-38.                             |
| `STR-42` | P1        | API     | Dane identyfikacyjne zespołu          | Publiczne API zwraca ID, institutionUnitId, nazwę i oznaczenie poziomu ZS.                                                            |
| `STR-43` | P0        | API     | Trwałość publicznego rekordu relacji  | ID, obie strony i typ są spójne w kolejnych odczytach z obu profili. Pola wewnętrzne DB pozostają poza zakresem.                      |
| `STR-44` | P1        | UI/API  | Spójność słownika typów               | UI odzwierciedla cały słownik API, bez zduplikowanych identyfikatorów. Migracje schematu DB nie są testowane.                         |
| `STR-45` | P0        | UI/API  | Audyt utworzenia                      | Nowy wpis Struktura zawiera powiązaną szkołę, operację, autora, identyfikator użytkownika, źródło i datę; jest widoczny w UI.         |
| `STR-46` | P0        | UI/API  | Audyt edycji                          | Historia zawiera poprzedni i nowy typ lub kierunek relacji.                                                                           |
| `STR-47` | P0        | UI/API  | Audyt soft delete                     | Historia zapisuje usunięcie logiczne i użytkownika, a rekordu nie usuwa fizycznie.                                                    |
| `STR-48` | P0        | UI/API  | Audyt przywrócenia                    | Historia zapisuje reaktywację tej samej relacji wraz z czasem i użytkownikiem.                                                        |
| `STR-49` | P1        | API     | Błąd 4xx walidacji zapisu             | Dialog pozostaje otwarty, nie ma częściowego zapisu, a użytkownik widzi kontrolowany komunikat.                                       |
| `STR-50` | P1        | API     | Błąd 500 i timeout zapisu             | Stan przed operacją zostaje zachowany; ponowienie przez użytkownika nie tworzy duplikatu.                                             |
| `STR-51` | P1        | API     | Konflikt równoczesnej edycji          | Drugi zapis nie nadpisuje po cichu nowszej wersji; system zwraca konflikt lub wymusza odświeżenie.                                    |
| `STR-52` | P2        | UI/API  | Uprawnienia obecnego użytkownika      | Przy pełnych uprawnieniach dostępne są dodawanie, edycja i potwierdzenie usuwania. Inne role wyłączono zgodnie z decyzją użytkownika. |

## 7. Etap 4 — odporność wyszukiwania i przygotowania relacji

| ID       | Priorytet | Warstwa | Scenariusz                                          | Oczekiwany rezultat                                                                                   |
| -------- | --------- | ------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `STR-53` | P1        | UI      | Wyszukiwanie zawierające tylko białe znaki          | Kryterium jest traktowane jak puste; pojawia się kontrolowana walidacja i nie są prezentowane wyniki. |
| `STR-54` | P1        | UI      | Zmiana kryterium i ponowne wyszukiwanie             | Nowe wyniki zastępują poprzednie; tabela nie zawiera nieaktualnych wierszy.                           |
| `STR-55` | P0        | UI      | Dwukrotne wybranie tej samej szkoły                 | W dolnej tabeli znajduje się dokładnie jeden wiersz danej szkoły.                                     |
| `STR-56` | P1        | UI      | Ponowne dodanie po usunięciu planowanego powiązania | Usunięta przed zapisem szkoła ponownie staje się dostępna i może zostać dodana jeden raz.             |
| `STR-57` | P1        | UI      | Anulowanie kilku planowanych powiązań               | Zamknięcie dialogu przez `Anuluj` odrzuca cały przygotowany zestaw.                                   |

## 8. Macierz wymagań

| Wymaganie | Pokrywające testy                        |
| --------: | ---------------------------------------- |
|       1–5 | `STR-38`–`STR-42`                        |
|       6–8 | `STR-34`, `STR-35`, `STR-37`, `STR-43`   |
|         9 | `STR-45`–`STR-48`                        |
|        10 | `STR-21`                                 |
|        11 | `STR-22`                                 |
|        12 | `STR-23`                                 |
|     13–14 | `STR-44` oraz test migracji w backendzie |
|        15 | `STR-14`, `STR-16`, `STR-17`, `STR-43`   |
|        16 | `STR-32`, `STR-33`, `STR-46`             |
|        17 | `STR-34`, `STR-37`, `STR-47`             |
|        18 | `STR-35`, `STR-48`                       |
|        19 | `STR-24`, `STR-26`                       |
|        20 | `STR-25`, `STR-36`                       |
|        21 | `STR-21`–`STR-24`                        |
|        22 | `STR-28`, `STR-29`                       |
|        23 | `STR-30`, `STR-31`                       |
|        24 | `STR-27`                                 |
|        25 | `STR-45`–`STR-48`                        |

## 9. Uzupełnione przypadki STR-58–STR-87

| ID            | Pokrycie                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| STR-58–STR-60 | Brak rodzica, dziecka lub typu w żądaniu API.                                                                                |
| STR-61–STR-62 | Samopowiązanie i nieistniejąca jednostka w API.                                                                              |
| STR-63        | Zakaz przypisania jednej filii do dwóch szkół głównych.                                                                      |
| STR-64        | Nieaktywne akcje pośrednich powiązań i możliwość edycji po przejściu do właściwego profilu.                                  |
| STR-65        | Profil dodatkowej lokalizacji edytuje tylko bezpośrednią wielobudynkowość; pozostałe akcje są zablokowane.                   |
| STR-66        | Lokalizacje przed filiami mimo późniejszego utworzenia.                                                                      |
| STR-67        | Ikony przed nazwami, regularne wcięcia czterech poziomów, brak rozwijania/zwijania.                                          |
| STR-68        | Ciągłe poddrzewo przed lub po innym rodzeństwie, bez narzucania nieokreślonego sortowania rodzeństwa.                        |
| STR-69–STR-70 | Anulowanie usuwania i edycji nie utrwala zmian.                                                                              |
| STR-71        | Usunięcie relacji zachowuje obie szkoły.                                                                                     |
| STR-72        | Timeout dodawania powinien zachować dialog i stan.                                                                           |
| STR-73–STR-74 | Reakcja frontendu na kontrolowaną blokadę aktywnego procesu (409); backendowe wykrywanie procesu nie jest mockiem dowodzone. |
| STR-75        | Jeden zespół z SP, LO i przedszkolem.                                                                                        |
| STR-76–STR-78 | Wyszukana szkoła przy wyborze Nadrzędna jest rodzicem dla każdego typu.                                                      |
| STR-79        | Rzeczywista zawieszona szkoła nie może być stroną nowej relacji.                                                             |
| STR-80        | Rzeczywiste zamówienie pozostaje po anulowaniu potwierdzenia usuwania relacji; zamówienie testowe jest sprzątane.            |
| STR-81        | Cykl zamykający siedmiopoziomową hierarchię jest odrzucany.                                                                  |
| STR-82        | Jeden rzeczywisty zapis formularza utrwala kilka relacji.                                                                    |
| STR-83        | Niepoprawna pozycja powoduje odrzucenie całej paczki bez częściowego zapisu.                                                 |
| STR-84        | Równoczesne dodanie tej samej pary nie tworzy dwóch aktywnych relacji.                                                       |
| STR-85        | Pokaż wszystkie otwiera nową kartę z kompletem szkół struktury, niezależnie od Pokaż zaznaczone.                             |
| STR-86        | Historia profilu zespołu zawiera audyt dodania szkoły, tak jak historia zwykłej szkoły.                                      |
| STR-87        | Szkoła z istniejącą filią po wejściu w rolę dodatkowej lokalizacji nie może edytować ani usuwać filii z własnego profilu.    |

## 10. Potwierdzone niezgodności DEV i kolejne poprawki produktu

| Test   | Niezgodność                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STR-38 | Zespół testowy otrzymał ID 5014 zamiast wymaganego identyfikatora trzycyfrowego.                                                                                    |
| STR-49 | Odpowiedź 422 zamyka formularz dodawania.                                                                                                                           |
| STR-50 | Odpowiedź 500 zamyka formularz i traci jego stan.                                                                                                                   |
| STR-51 | Równoczesne edycje nie sygnalizują konfliktu wymaganego w planowanym kontrakcie testu.                                                                              |
| STR-53 | Wyszukiwanie samych spacji zwraca wyniki zamiast walidacji.                                                                                                         |
| STR-72 | Timeout zamyka formularz dodawania.                                                                                                                                 |
| STR-74 | Blokada edycji (409) zamyka formularz zamiast zachować zmienione wartości.                                                                                          |
| STR-87 | Po zmianie szkoły w dodatkową lokalizację nadal można otworzyć edycję i potwierdzenie usuwania jej istniejącej filii z tego profilu. Operacje anulowano bez zapisu. |

Po naprawie należy uruchomić odpowiedni scenariusz, potwierdzić cały przebieg i usunąć oznaczenie `test.fail`. Priorytet: ograniczenia akcji dodatkowej lokalizacji, zachowanie formularzy po błędzie i białe znaki, następnie identyfikatory. Kontrakt współbieżności STR-51 należy najpierw uzgodnić z właścicielem produktu. Filtrowanie nie jest obecnie zgłoszoną niezgodnością.

## 11. Granice uzgodnionego zakresu

- Testujemy jedno konto z pełnymi uprawnieniami. Role read-only, brak uprawnień i operacje DPD pozostają poza zakresem zgodnie z decyzją użytkownika.
- Bez dostępu do bazy nie sprawdzamy bezpośrednio wartości `is_Del`, schematu tabel, migracji ani atomowych ograniczeń unikalności poprzez wstrzyknięcie kolidujących danych. ID, unikalne wyniki wyszukiwania, aktywne drzewo i reaktywacja tego samego rekordu są sprawdzane przez API/UI.
- Historia ujawnia ID powiązanej szkoły, autora, źródło, czas i opis zmiany. Nie udostępnia wewnętrznego ID relacji ani pełnego technicznego logu starej/nowej wartości; nie należy utożsamiać testów historii z audytem tabel DB.
- Testy 73/74 sprawdzają zachowanie UI przy odmowie API dla aktywnego procesu. Rzeczywiste zamówienie i potwierdzenie sprawdza STR-80. Backendowe powiązania z rzeczywistymi SI/raportami wymagają odrębnych kontrolowanych fixture; ten zestaw ich nie tworzy i nie certyfikuje wykrywania takich powiązań.
- Nie tworzymy uszkodzonych rekordów szkół bez typu przez bazę. Wszystkie aktywne fixture muszą mieć przypisany typ; wymagane strony/typ relacji, nieistniejące jednostki i nieaktywna szkoła mają osobne testy negatywne.
- Siedem poziomów oraz kilka długości cyklu to reprezentatywne granice praktyczne, nie matematyczny dowód dla dowolnie dużego grafu. Uzgodniona reguła biznesowa nie przewiduje limitu głębokości.

## 12. Struktura podczas dodawania nowej szkoły

Osobny plik `szkola-struktura-dodawanie.spec.ts` obejmuje 19 scenariuszy STR-88–STR-106. Pozwala otworzyć strukturę przed nadaniem ID szkoły; wewnętrzny Zapisz przekazuje plan, a dopiero zapis szkoły utrwala powiązania. [Dokładne kroki każdego testu](struktura-szkoly-krok-po-kroku.md#str-88str-106--struktura-podczas-tworzenia-nowej-szkoły).

| Testy           | Sprawdzany obszar                                                                       |
| --------------- | --------------------------------------------------------------------------------------- |
| STR-88–STR-89   | Dostępność dialogu i odroczenie zapisu do utworzenia szkoły                             |
| STR-90–STR-95   | Rzeczywisty zapis wszystkich trzech typów relacji w obu kierunkach                      |
| STR-96          | Rzeczywisty zapis dwóch powiązań z jednym nowym profilem                                |
| STR-97–STR-99   | Anulowanie wewnętrznego i nadrzędnego formularza oraz usuwanie planowanej pozycji       |
| STR-100–STR-103 | Duplikat, puste wyszukiwanie, zmiana planu i obowiązkowa nazwa szkoły                   |
| STR-104–STR-106 | Brak osieroconego zapisu relacji przy kontrolowanym 422, 500 i timeout tworzenia szkoły |

Istniejące placówki `AUTO_STR_<ŚRODOWISKO>_DODAWANIE_*` są oddzielne od danych poprzedniego pliku, więc oba pliki nie sprzątają sobie wzajemnie powiązań. Rzeczywiste testy tworzenia szkoły muszą dodać nowe rekordy; są nazwane `AUTO_STR_<ŚRODOWISKO>_ADD_*`, oznaczane Testowy, a po scenariuszu relacje są usuwane. Same szkoły pozostają (brak potwierdzonej obsługi ich usuwania); ich ID i status sprzątania są zapisywane lokalnie w `runs/<nazwa>.json` i dołączane do raportu.

Granica: testy błędów blokują tworzenie szkoły przed zapisem na serwerze. Nie dowodzą atomowości backendu przy błędzie drugiego etapu, po faktycznym utworzeniu szkoły. Kontrolują brak próby zapisu relacji po nieudanym pierwszym etapie. Nie dublują wszystkich walidacji grafu istniejącej szkoły w nowym formularzu.
