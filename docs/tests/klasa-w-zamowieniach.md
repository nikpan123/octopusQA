# Klasa w zamówieniach szkolnych krok po kroku

Zestaw ORD-CLASS-01–ORD-CLASS-22 sprawdza kolumnę Klasa na liście zamówień, w szczegółach po rozwinięciu zamówienia i w zakładce Pozycje. Testy zostały przygotowane bez uruchamiania na DEV. LS jest warunkowo pomijany, ponieważ użytkownik potwierdził brak takiego produktu w katalogu.

## Przygotowanie i sprzątanie

Testy korzystają z istniejących szkół `AUTO_ORD_REFERENCE_<środowisko>_W<worker>` używanych przez ORD. Szkoła jest tworzona tylko wtedy, gdy nie istnieje. Różne workery mają osobne szkoły; testy jednego workera używają tej samej szkoły. Nie powstaje nowa szkoła dla każdego scenariusza.

Katalog produktów jest odczytywany przez `Order/GetItemOrders`. Dla referencyjnych kodów test wymaga dokładnie jednego aktywnego produktu i sprawdza przypisane klasy. Nie zmienia katalogu ani przypisania klas. Zamówienia przygotowuje przez `SchoolOrder/AddSchoolOrder`, a edycje przez `SchoolOrder/UpdateSchoolOrder`, z takim samym zestawem pól jak formularz aplikacji: szkoła, autor, data i pozycje z identyfikatorem produktu, kodem oraz ilością. Nie wysyła wymyślonego pola klasy w pozycji zamówienia.

Po zapisie API test czeka na własne zamówienie z odpowiednimi produktami i ilościami. Następnie otwiera rzeczywiste widoki w przeglądarce i sprawdza komórki Klasa. Pusta klasa oznacza pusty tekst, a nie 0, myślnik, null lub undefined. Lista klas jest porównywana jako poszczególne wartości; spacje po separatorach nie powodują błędu, ale duplikaty i nieprawidłowa kolejność już tak.

Po każdym teście, także nieudanym, sprzątanie usuwa przez `SchoolOrder/DeleteOrder` wyłącznie ID zamówień utworzonych przez ten test i potwierdza ich zniknięcie z listy API. Szkół i produktów nie usuwa. ID, dane pozycji i status sprzątania są zapisywane w rejestrze `runs/REG_...json` scenariusza. Nieudane usunięcie jest zgłaszane jako błąd, nie ukrywane.

## Dane produktów

| Kod       | Oczekiwane klasy | Zastosowanie                                                                                                                                                                      |
| --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P5Pv      | 5                | Podręcznik Język polski 5                                                                                                                                                         |
| F7P       | 7                | Podręcznik Fizyka 7                                                                                                                                                               |
| F7P-1     | 7                | Drugi, odrębny podręcznik dla tej samej klasy                                                                                                                                     |
| m-F7P     | 7                | Multipodręcznik, czyli produkt multimedialny                                                                                                                                      |
| FG2y      | 7, 8             | Produkt katalogowy przypisany do kilku klas; numer w tytule nie służy jako oczekiwana klasa                                                                                       |
| testhurtC | Brak             | Istniejący pojedynczy produkt „Testowy produkt dla hurtowni C” (DEV: ID 6889), wskazany na zrzucie użytkownika. Pustą klasę potwierdza pole classesNames z administracyjnego API. |

Przy innym katalogu na TEST może być potrzebna zmiana danych referencyjnych. Brak podstawowego produktu lub zmieniona klasa jest błędem przygotowania, a nie automatycznym powodem zaliczenia czy pominięcia testu.

Produkt do pustej klasy można wskazać przez `OCTOPUS_ORDER_CLASSLESS_CODE`; domyślnie jest to `testhurtC`. Helper wymaga pustego `classesNames` w administracyjnym katalogu i zgodnego identyfikatora pojedynczego produktu w katalogu zamówień. Nie interpretuje listy 0–8 w polu `classes` jako dowodu rzeczywistego przypisania klas.

## Scenariusze

W przypadkach sprawdzających trzy widoki test wymaga zbiorczej listy klas w nagłówku zamówienia, właściwej klasy każdej pozycji po rozwinięciu i takiej samej informacji w zakładce Pozycje. Oczekiwanie rosnącej listy klas bez powtórzeń na poziomie zamówienia opiera się na przekazanej makiecie.

| ID           | Co robi i czego wymaga                                                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORD-CLASS-01 | Przez API zamawia F7P. Na liście zamówień wymaga widocznego nagłówka Klasa bezpośrednio po Symbol.                                                                                                 |
| ORD-CLASS-02 | Przygotowuje F7P, rozwija własne zamówienie i wymaga nagłówka Klasa bezpośrednio po Tytuł w szczegółach.                                                                                           |
| ORD-CLASS-03 | Przygotowuje F7P, przechodzi do Pozycji i wymaga nagłówka Klasa bezpośrednio po Tytuł.                                                                                                             |
| ORD-CLASS-04 | Zamawia P5Pv w ilości 2. W trzech widokach wymaga klasy 5.                                                                                                                                         |
| ORD-CLASS-05 | Zamawia F7P w ilości 2. W trzech widokach wymaga klasy 7.                                                                                                                                          |
| ORD-CLASS-06 | Zamawia multipodręcznik m-F7P. W trzech widokach wymaga klasy 7.                                                                                                                                   |
| ORD-CLASS-07 | Zamawia FG2y, wcześniej sprawdzając klasy katalogowe 7 i 8. W trzech widokach wymaga obu klas, nie numeru 2 z tytułu.                                                                              |
| ORD-CLASS-08 | Odczytuje produkt testhurtC, potwierdza pustą klasę administracyjną i zgodność ID/kodu z katalogiem zamówień. Zamawia go i wymaga pustej komórki w trzech widokach. Nie jest pomijany.             |
| ORD-CLASS-09 | Przypadek LS jest pomijany z powodem, gdy nie wskazano dostępnego produktu LS. Nie tworzy zamówienia dla produktu zastępczego. Po pojawieniu się LS może sprawdzić klasy katalogowe i trzy widoki. |
| ORD-CLASS-10 | Dodaje do jednego zamówienia najpierw F7P, potem P5Pv. W nagłówku wymaga 5,7; przy produktach odpowiednio 7 i 5.                                                                                   |
| ORD-CLASS-11 | Zamawia F7P i F7P-1. W obu pozycjach wymaga 7, a w nagłówku jednego 7, nie 7,7.                                                                                                                    |
| ORD-CLASS-12 | Zamawia 25 sztuk F7P. Klasa w każdym widoku musi pozostać 7, nie 25.                                                                                                                               |
| ORD-CLASS-13 | Łączy F7P z produktem testhurtC bez przypisanej klasy. Nagłówek ma 7, ale komórka drugiego produktu pozostaje pusta. Nie jest pomijany.                                                            |
| ORD-CLASS-14 | Tworzy dwa zamówienia tego samego F7P w ilości 2 i 3. W Pozycjach wymaga jednego wiersza produktu z klasą 7; po jego rozwinięciu obu ID zamówień.                                                  |
| ORD-CLASS-15 | Tworzy osobne zamówienia klasy 7 i klasy 5. Sprawdza oba w trzech widokach, bez mieszania klas w nagłówkach i szczegółach.                                                                         |
| ORD-CLASS-16 | Sprawdza klasę 5 w trzech widokach, przeładowuje stronę i powtarza sprawdzenia.                                                                                                                    |
| ORD-CLASS-17 | Trzykrotnie przełącza Pozycje i Zamówienia. Wymaga niezmienionej klasy 7 w pozycji i własnym zamówieniu.                                                                                           |
| ORD-CLASS-18 | Tworzy zamówienie P5Pv i potwierdza 5. Przez API zastępuje produkt F7P w tym samym zamówieniu. Wymaga 7 w trzech widokach i braku starego produktu w rozwiniętym zamówieniu.                       |
| ORD-CLASS-19 | Tworzy zamówienie dla klas 5 i 7, po czym przez API usuwa z niego produkt klasy 5. Wymaga pozostawienia klasy 7 w trzech widokach.                                                                 |
| ORD-CLASS-20 | Tworzy dwa zamówienia F7P i usuwa pierwsze przez API. Drugie nadal musi mieć klasę 7 w trzech widokach.                                                                                            |
| ORD-CLASS-21 | Tworzy zamówienie w szkole podstawowej workera i sprawdza klasę 7. Otwiera drugą szkołę referencyjną i wymaga braku tego ID zamówienia.                                                            |
| ORD-CLASS-22 | Trzykrotnie rozwija i zwija to samo zamówienie. Za każdym razem wymaga klasy 7 w szczegółach i nagłówku.                                                                                           |

## Uruchamianie

W panelu wybierz pakiet Zamówienia. Grep `@order-class` wybiera cały zestaw. Pojedynczy test można wybrać na liście po ID `ORD-CLASS-xx`. Panel uruchomiony przed dodaniem pliku wymaga ponownego uruchomienia po zakończeniu aktywnych testów.

```powershell
npm test -- tests/zamowienia-klasa.spec.ts --grep "ORD-CLASS-04:"
```

Po dodaniu rzeczywistego produktu LS można przed startem panelu ustawić `OCTOPUS_ORDER_LS_CODE` na potwierdzony kod, a `OCTOPUS_ORDER_LS_CLASSES` na oczekiwane klasy rozdzielone przecinkiem. Pominięty test LS nie jest potwierdzeniem spełnienia wymagania dla LS.

## Granice pokrycia

Przebieg użytkownika ujawnił błędny dobór danych ORD-CLASS-08: pozycja 6542 z kodem Zestaw rozwinęła się przy zapisie na składniki 6892 i 6893. Helper wyklucza teraz kolekcje i korzysta z istniejącego produktu testhurtC (DEV: 6889), wskazanego na zrzucie użytkownika. Odczyt administracyjny `Order/GetItemOrdersForOrderPanel` zwraca dla niego puste `classesNames`, mimo że `classes` zawiera 0–8. Dlatego wcześniejszy wniosek o braku pojedynczych produktów bez klasy był nieprawidłowy. ORD-CLASS-08 i 13 pozostają wykonywane; nie zmieniamy oczekiwania pustej komórki na domyślną listę 0–8. Nie tworzono nowego produktu ani nie zmieniano katalogu.

Testy nie tworzą zamówień z systemów zewnętrznych CMS/Sales i nie dowodzą poprawności ich synchronizacji. Edycje sprawdzają odświeżenie widoku po ponownym otwarciu szkoły, nie automatyczne odświeżenie stale otwartej strony po zmianie w innej sesji. Nie obejmują wszystkich numerów klas, uprawnień różnych ról ani wizualnego porównania całej makiety. Bezpośredni odczyt katalogu i sprawdzenie kodu formularza posłużyły do przygotowania helpera API; operacje zapisu i sprzątania zostaną zweryfikowane dopiero podczas uruchomienia przez użytkownika.

Źródła: [scenariusze](../../tests/zamowienia-klasa.spec.ts), [przygotowanie API i asercje klas](../../tests/support/order-class.ts), [istniejące szkoły referencyjne](../../tests/support/order-school.ts).
