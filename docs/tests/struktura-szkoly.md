# Struktura szkoły — plan testów

## 1. Cel

Plan obejmuje zakładkę `Struktura` na karcie szkoły oraz model relacji pomiędzy placówkami. Źródłem zakresu są wymagania funkcjonalne dotyczące identyfikacji jednostek, typów powiązań, CRUD relacji, walidacji hierarchii i audytu oraz aktualny wygląd interfejsu.

Zaimplementowane testy znajdują się w:

```text
tests/szkola-struktura.spec.ts
tests/support/school-structure.ts
```

Identyfikatory `STR-*` są zarezerwowane dla tego obszaru.

Stan automatyzacji:

- wszystkie scenariusze `STR-01`–`STR-57` są zdefiniowane w zestawie Playwright;
- 29 scenariuszy jest aktywnych i potwierdzonych na DEV;
- trzy scenariusze są oznaczone `fixme` jako znane defekty: `STR-49`, `STR-50` i `STR-53`;
- 25 scenariuszy jest oznaczonych `fixme` z opisanym brakiem kontraktu backendowego, reguły biznesowej albo wymaganej roli;
- scenariusze zapisu korzystają z dedykowanych szkół `AUTO_STR_<ŚRODOWISKO>_*`; szkoły są współdzielone, natomiast relacje są usuwane po teście przez obsługiwaną akcję aplikacji;
- backlog bez reprezentacji w kodzie: 0 scenariuszy.

## 2. Obserwowany interfejs

Zakładka `Struktura` udostępnia:

- pusty stan `Brak struktury organizacyjnej.`;
- przyciski `Pokaż zaznaczone`, `Pokaż wszystkie` i `Dodaj powiązanie`;
- dialog `Dodaj powiązanie - szkoły w strukturze`;
- kryteria wyszukiwania: ID szkoły, Nazwa szkoły, Kod pocztowy, Miejscowość i Ulica;
- tabelę wyników: Dodaj, ID, Poziom, Nazwa Szkoły i Adres Szkoły;
- tabelę istniejących powiązań: Usuń, ID, Poziom, Nazwa szkoły, Adres Szkoły, Typ relacji i Hierarchia;
- akcje `Anuluj` i `Zapisz`;
- walidację pustego wyszukiwania z komunikatem `Wyszukiwanie nie może być puste`.

## 3. Dane testowe i bezpieczeństwo

- Testy zapisu korzystają z dedykowanych szkół oznaczonych jako testowe, tworzonych jednokrotnie i zapamiętywanych lokalnie osobno dla DEV i TEST. Projekt nie usuwa tych placówek po każdym scenariuszu.
- Każdy test zmieniający relację przywraca stan początkowy w `finally` przez ikonę śmietnika i potwierdzoną odpowiedź endpointu `DeleteInstitutionsRelation`.
- Scenariusze modyfikujące tę samą strukturę nie mogą działać równolegle. Należy umieścić je w osobnym serialowym `describe` albo zapewnić niezależny zestaw danych na worker.
- Test soft delete nie może opierać się wyłącznie na zniknięciu wiersza z UI. Powinien dodatkowo potwierdzić stan nieaktywny przez API lub odczyt techniczny przygotowany dla testów.

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
| `STR-20` | P1        | UI      | `Pokaż zaznaczone` i `Pokaż wszystkie`         | Pierwsza akcja ogranicza widok do zaznaczonej gałęzi, druga przywraca całą strukturę bez zmiany danych.                     |

## 5. Etap 2 — typy relacji i reguły hierarchii

| ID       | Priorytet | Warstwa | Scenariusz                                  | Oczekiwany rezultat                                                                                                         |
| -------- | --------- | ------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `STR-21` | P0        | UI/API  | `Zespół szkół → szkoła podrzędna`           | Można przypisać co najmniej SP, LO i Przedszkole do jednego zespołu; każda relacja ma właściwy typ i kierunek.              |
| `STR-22` | P0        | UI/API  | `Szkoła główna → Filia`                     | Jednostka główna i filia są jednoznacznie rozróżnione w obu widokach relacji.                                               |
| `STR-23` | P1        | UI/API  | Wielobudynkowość                            | Dodatkowa lokalizacja jest widoczna jako właściwy typ powiązania i nie jest mylona ze szkołą podrzędną.                     |
| `STR-24` | P0        | UI/API  | Niedozwolony typ relacji dla pary jednostek | Zapis jest blokowany przed utworzeniem relacji, a komunikat wyjaśnia ograniczenie.                                          |
| `STR-25` | P0        | UI/API  | Duplikat tej samej relacji                  | Druga relacja tego samego typu pomiędzy tą samą parą nie powstaje; użytkownik otrzymuje jednoznaczny komunikat.             |
| `STR-26` | P1        | UI/API  | Ta sama para z innym dozwolonym typem       | Zachowanie jest zgodne z decyzją biznesową: relacja zostaje zapisana albo świadomie zablokowana.                            |
| `STR-27` | P0        | UI/API  | Samopowiązanie                              | Bieżącej szkoły nie można dodać jako jej własnej jednostki nadrzędnej ani podrzędnej.                                       |
| `STR-28` | P0        | API/UI  | Cykl bezpośredni A → B → A                  | Drugi zapis jest blokowany, istniejąca relacja pozostaje bez zmian.                                                         |
| `STR-29` | P0        | API/UI  | Cykl pośredni A → B → C → A                 | Zapis domykający cykl jest blokowany niezależnie od głębokości ścieżki.                                                     |
| `STR-30` | P1        | API/UI  | Maksymalna dozwolona głębokość              | Relacja na granicy limitu zostaje zapisana.                                                                                 |
| `STR-31` | P1        | API/UI  | Przekroczenie głębokości hierarchii         | Relacja przekraczająca skonfigurowany limit jest blokowana bez częściowego zapisu.                                          |
| `STR-32` | P1        | UI/API  | Edycja typu relacji                         | Po zmianie aktualizują się dane i oba kierunki widoku; nie powstaje drugi rekord aktywny.                                   |
| `STR-33` | P1        | UI/API  | Zamiana stron relacji                       | Jednostka nadrzędna i podrzędna zostają zamienione tylko wtedy, gdy nowy układ przechodzi wszystkie walidacje.              |
| `STR-34` | P0        | UI/API  | Usunięcie relacji                           | Relacja znika z aktywnej struktury i operacji biznesowych, ale pozostaje jako nieaktywna w źródle technicznym.              |
| `STR-35` | P0        | UI/API  | Przywrócenie usuniętej relacji              | `Undo` aktywuje ten sam rekord relacji, bez tworzenia duplikatu.                                                            |
| `STR-36` | P1        | UI/API  | Ponowne dodanie relacji po soft delete      | System przywraca poprzedni rekord albo blokuje operację zgodnie z kontraktem; nigdy nie pozostawia dwóch aktywnych relacji. |
| `STR-37` | P1        | API     | Nieaktywna relacja nie wpływa na biznes     | Usunięta relacja nie jest zwracana w aktywnym drzewie, wyszukiwaniu struktury ani logice zależnej od hierarchii.            |

## 6. Etap 3 — identyfikator Zespołu szkół, API, trwałość i audyt

| ID       | Priorytet | Warstwa | Scenariusz                              | Oczekiwany rezultat                                                                                                                                               |
| -------- | --------- | ------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STR-38` | P0        | UI/API  | Automatyczne nadanie ID Zespołu szkół   | Nowo utworzony zespół otrzymuje widoczny, dokładnie trzycyfrowy identyfikator.                                                                                    |
| `STR-39` | P0        | API     | Unikalność ID zespołu                   | Próba utworzenia drugiego zespołu z tym samym identyfikatorem jest blokowana atomowo.                                                                             |
| `STR-40` | P0        | API     | Brak kolizji z numeracją szkół          | Identyfikator zespołu nie może być równy ID istniejącej jednostki innego typu.                                                                                    |
| `STR-41` | P0        | UI/API  | Wyszukiwanie zespołu po trzycyfrowym ID | Wyszukiwanie zwraca jednoznacznie właściwy zespół i nie dopasowuje zwykłej szkoły.                                                                                |
| `STR-42` | P1        | API     | Dane identyfikacyjne w integracji       | API lub eksport zwraca typ jednostki i trzycyfrowy identyfikator pozwalający jednoznacznie rozpoznać zespół.                                                      |
| `STR-43` | P0        | API/DB  | Trwałość rekordu relacji                | Rekord zawiera ID relacji, jednostkę nadrzędną, podrzędną, typ, stan aktywności i pola audytowe.                                                                  |
| `STR-44` | P1        | API     | Rozszerzalność słownika typów           | Nowy typ relacji dodany przez obsługiwany słownik jest dostępny bez zmiany kontraktu endpointu. Test migracji schematu należy utrzymywać w repozytorium backendu. |
| `STR-45` | P0        | UI/API  | Audyt utworzenia                        | Historia zawiera ID relacji, użytkownika, czas, typ operacji oraz utworzone wartości.                                                                             |
| `STR-46` | P0        | UI/API  | Audyt edycji                            | Historia zawiera poprzedni i nowy typ lub kierunek relacji.                                                                                                       |
| `STR-47` | P0        | UI/API  | Audyt soft delete                       | Historia zapisuje usunięcie logiczne i użytkownika, a rekordu nie usuwa fizycznie.                                                                                |
| `STR-48` | P0        | UI/API  | Audyt przywrócenia                      | Historia zapisuje reaktywację tej samej relacji wraz z czasem i użytkownikiem.                                                                                    |
| `STR-49` | P1        | API     | Błąd 4xx walidacji zapisu               | Dialog pozostaje otwarty, nie ma częściowego zapisu, a użytkownik widzi kontrolowany komunikat.                                                                   |
| `STR-50` | P1        | API     | Błąd 500 i timeout zapisu               | Stan przed operacją zostaje zachowany; ponowienie przez użytkownika nie tworzy duplikatu.                                                                         |
| `STR-51` | P1        | API     | Konflikt równoczesnej edycji            | Drugi zapis nie nadpisuje po cichu nowszej wersji; system zwraca konflikt lub wymusza odświeżenie.                                                                |
| `STR-52` | P2        | UI/API  | Uprawnienia tylko do odczytu            | Użytkownik bez prawa edycji widzi strukturę, ale nie może dodać, edytować, usunąć ani przywrócić relacji.                                                         |

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

## 9. Rekomendowana kolejność automatyzacji

1. `STR-01`–`STR-18`: aktualnie widoczny interfejs, wyszukiwanie, anulowanie i podstawowy zapis.
2. `STR-21`, `STR-22`, `STR-24`, `STR-25`, `STR-27`–`STR-29`: najważniejsze reguły integralności.
3. `STR-34`, `STR-35`, `STR-37`, `STR-45`–`STR-48`: cykl życia i audyt.
4. `STR-38`–`STR-44`: identyfikacja zespołu i kontrakty integracyjne.
5. Pozostałe scenariusze graniczne, awarie oraz uprawnienia.

## 10. Informacje wymagające potwierdzenia przed implementacją

- dokładne nazwy wartości słownika `Typ relacji`;
- znaczenie i dozwolone wartości kolumny `Hierarchia`;
- maksymalna głębokość drzewa;
- czy ta sama para może mieć kilka różnych aktywnych typów relacji;
- gdzie w UI znajdują się edycja i `undo`;
- czy `Wielobudynkowość` łączy szkołę z rekordem adresu, czy z inną jednostką szkoły;
- endpointy tworzenia, edycji, soft delete, restore, pobierania aktywnego drzewa i historii;
- role uprawnione do odczytu i modyfikacji;
- sposób seedowania oraz bezpiecznego cleanupu relacji na DEV i TEST.
