# Centrum wysyłkowe — Gratisy

Osobna paczka w **Uruchom testy → Centrum wysyłkowe — Gratisy (7)**. Nie dodajemy nowego scenariusza do katalogu Scenariusze. Z terminala: `npm run test:gift:catalog`.

Przed testem zaloguj się do Octopusa jako osoba, która może przeglądać, dodawać, edytować i usuwać gratisy. Otwórz **Centrum wysyłkowe → Gratisy**. Nie potrzeba szkoły, nauczyciela ani zamówienia. GFT-02 dodatkowo wymaga DEV i lokalnego dostępu SELECT do bazy GWO_CRMDEV, tak jak istniejące testy bazowe.

Każdy zapis dotyczy własnego gratisu z krótką nazwą, np. **AUTO Gratis 7a3f2b10**, kodem **AUTO-7a3f2b10** i symbolem **AT-7a3f2b10**. Końcówka zmienia się przy każdym uruchomieniu. Nie edytujemy ani nie usuwamy istniejących produktów firmy. Po teście automat usuwa swoje gratisy przez śmietnik, również gdy sprawdzenie zakończy się błędem.

| Test | Co robimy i jaki wynik sprawdzamy |
|---|---|
| GFT-01 | Otwieramy zakładkę. Sprawdzamy filtry, kolumny oraz dostępność Szukaj, Wyczyść filtry, Dodaj nowy gratis i Eksportuj do Excela. Edycja rekordów jest niedostępna bez zaznaczenia. |
| GFT-02 | Dodajemy gratis, odświeżamy listę i porównujemy zapis z bazą. Edytujemy go ołówkiem, ponownie sprawdzamy zapis, następnie usuwamy śmietnikiem i potwierdzamy brak aktywnego rekordu. |
| GFT-03 | Klikamy Zapisz w pustym formularzu: wymagane tytuł, przedmiot i poziom blokują zapis. Wypełniamy formularz i anulujemy: nowy gratis nie powstaje. |
| GFT-04 | Wyszukujemy własny gratis osobno po ID, tytule, kodzie i symbolu; łączymy filtry z Matematyka / SP / klasa 4. Nieistniejący kod daje pustą tabelę. Wyczyść filtry usuwa wybrane kryteria. |
| GFT-05 | Anulujemy zmianę tytułu oraz potwierdzenie usunięcia. Po ponownym otwarciu gratis zachowuje dane. Zaznaczanie wiersza włącza Edycję rekordów, a odznaczenie ją wyłącza. |

| GFT-06 | Dodajemy gratis ze wszystkimi klasami 0–8. Kolumna Klasa jest pusta od razu i po odświeżeniu. Po otwarciu edycji wszystkie klasy są nadal zaznaczone. |
| GFT-07 | Edytujemy gratis z klasy 4 na wszystkie klasy 0–8, a następnie na tylko 5 i 8. Wszystkie klasy oznaczają pustą kolumnę; ograniczony wybór pokazuje dokładnie 5 i 8, w dowolnej kolejności. Po każdym zapisie odświeżamy listę i sprawdzamy zaznaczenia w formularzu. |

## Ręczne wykonanie GFT-02

1. Kliknij **Dodaj nowy gratis**. Wpisz własną nazwę AUTO i unikalny kod. Wybierz **Matematyka**, **Szkoła Podstawowa**, klasę **4**, symbol AT z tą samą końcówką i wagę **123**. Kliknij **Zapisz**.
2. Wyszukaj gratis po kodzie. Zapisz jego ID. W tabeli mają być wpisany tytuł, kod i symbol, poziom **SP**, przedmiot **MAT**, klasa **4** i waga **123g**. Po odświeżeniu dane pozostają.
3. QA porównuje ID i pola z `DictOrderItem`, przedmiot z `OrderItemSubject`, a poziom i klasy z `OrderItemClass`. Automatyczny odczyt jest wyłącznie SELECT; dowód JSON znajduje się w raporcie przy kroku porównania.
4. Kliknij **ołówek** przy tym wierszu. Dopisz **E** do tytułu i symbolu, zmień wagę na **250** oraz dodaj klasę **5**, zachowując **4**. Kliknij **Zapisz**.
5. Otwórz widok ponownie i wyszukaj kod. Tytuł, symbol, waga i klasy mają być zmienione, a ID niezmienione. QA porównuje również nowy zapis w bazie.
6. Kliknij **śmietnik** tego gratisu i **Tak**. Po odświeżeniu i wyszukaniu kodu wpisu nie ma. W bazie rekord nie istnieje albo ma `IsDel = true`.

W szybkiej regresji przed releasem znajdują się **GFT-01 i GFT-02**. Pozostałe pięć przypadków uruchamia się z pełnej paczki. Weryfikacja DEV: dotychczasowe **5/5 PASS** oraz nowe **GFT-06 i GFT-07: 2/2 PASS** po poprawce zamykania formularza i sprzątania. Dane z wcześniejszego nieudanego sprzątania zostały usunięte śmietnikiem. Eksport pliku i zapis zbiorowej edycji nie są objęte tą paczką; sprawdzamy dostępność ich przycisków.

## Ręczne sprawdzenie wszystkich klas

1. W Dodaj nowy gratis wpisz własne dane AUTO, wybierz Matematyka i Szkoła Podstawowa. W polu Klasy zaznacz **0, 1, 2, 3, 4, 5, 6, 7, 8** i zapisz.
2. Wyszukaj gratis po kodzie. Kolumna **Klasa ma być pusta**. Odśwież stronę i wyszukaj kod ponownie — wynik jest taki sam.
3. Ołówkiem otwórz edycję i rozwiń Klasy. Wszystkie dziewięć opcji ma być zaznaczonych; pusta kolumna nie oznacza utraty wyboru.
4. Pozostaw tylko klasy **5 i 8**, odznaczając pozostałe, i zapisz. Tabela ma pokazać klasy **5 i 8**, w dowolnej kolejności (np. **5,8** albo **8,5**). Po ponownym otwarciu edycji tylko te dwie klasy pozostają zaznaczone.
5. Zaznacz ponownie wszystkie klasy i zapisz. Kolumna Klasa znowu ma być pusta. Po sprawdzeniu usuń własny gratis śmietnikiem.

Porównanie klas w tabeli i bazie nie wymaga kolejności. Nadal sprawdza dokładną liczbę i wartości: brakująca, dodatkowa lub powtórzona klasa powoduje błąd. Dla wszystkich klas 0–8 kolumna pozostaje pusta.
