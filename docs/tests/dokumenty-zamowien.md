# Dokumenty i edycja zamówień krok po kroku

Nowy zestaw ORD-DOC-01–ORD-DOC-30 uzupełnia istniejące testy, zamiast ponownie sprawdzać te same operacje. Obejmuje dokumenty zamówień szkolnych oraz nauczycielskie gratisy z powodem blokady Oświadczenie. Nowych testów nie uruchomiono na DEV; odczyty API i kodu formularzy posłużyły do przygotowania danych i obsługi widoków. ORD-DOC-28 wymaga istniejącego testowego zamówienia z integracji.

## Co było już pokryte

| Wymaganie                                               | Istniejące scenariusze                          | Uzupełnienie                                                                                                                                  |
| ------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Dodawanie PDF, JPG i PNG                                | ORD-48–ORD-50                                   | Używają teraz rzeczywistych plików tych formatów, nie bufora dowolnych bajtów. ORD-DOC-01–03 sprawdzają zapis, podgląd i pobranie zawartości. |
| Wiele plików, usuwanie pojedynczego i wszystkich        | ORD-51–ORD-53                                   | ORD-DOC-05/06 sprawdzają zmiany zapisane podczas edycji, a nie tylko stan formularza przed zapisem.                                           |
| Filtry i produkty nie usuwają plików                    | ORD-54/55                                       | ORD-DOC-07/08/30 sprawdzają zachowanie zapisanych plików po zmianach zamówienia.                                                              |
| Trwałość i anulowanie                                   | ORD-56–ORD-58                                   | ORD-DOC-09 sprawdza anulowanie edycji istniejących dokumentów.                                                                                |
| Niedozwolone formaty i granice 10 MB                    | ORD-59–ORD-62                                   | ORD-DOC-15/16 wymagają walidacji także w API; ORD-DOC-24–26 obejmują formularz nauczycielskiego Oświadczenia.                                 |
| Informacja o plikach na liście                          | ORD-63–ORD-66                                   | ORD-DOC-01–04 przechodzą od ikony do podglądu i pobierania.                                                                                   |
| Dodawanie, edycja ilości i usuwanie ręcznego zamówienia | ORD-01–ORD-03                                   | ORD-DOC-30 zmienia produkt i ilość przez UI, zachowując dokument. ORD-CLASS-18/19 uzupełniają edycje przez API.                               |
| Edytowalne filtry Przedmiot, Poziom, Klasy, Tytuł/Kod   | Testy formularza i produktów ORD oraz ORD-CLASS | ORD-DOC-30 używa ich w istniejącym zamówieniu. Są kryteriami wyboru produktu; zapis pozycji przechowuje identyfikator produktu i ilość.       |
| Nauczycielskie Oświadczenie i powiązanie ze szkołą      | Brak dedykowanego wcześniejszego przepływu      | ORD-DOC-18–27 i 29.                                                                                                                           |

## Przygotowanie danych

Szkoły są ponownie używanymi rekordami `AUTO_ORD_REFERENCE_<środowisko>_W<worker>`, a nie nowymi szkołami dla każdego testu. Zamówienia i dokumenty powstają przez API, o ile przedmiotem testu nie jest samo działanie formularza. Zmiany i usuwanie dotyczą wyłącznie zamówień oraz plików zarejestrowanych jako własne w bieżącym scenariuszu.

Pliki są małymi dokumentami testowymi: PDF z tekstem, PNG z pojedynczym pikselem i JPEG z pojedynczym szarym pikselem. Nie zawierają danych osób ani skanów rzeczywistych zakupów. Zgodność zawartości jest porównywana bajt po bajcie: najpierw w odpowiedzi repozytorium, a następnie w rzeczywistym pobraniu przez przycisk Pobierz. Podgląd wymaga otwartego komponentu i ramki z adresem blob. Nie jest to pikselowa ocena renderowania PDF ani obrazów.

Do Oświadczenia powstaje własny nauczyciel `REG_...` z adresem w domenie `example.invalid`. Gratis przygotowuje ten sam endpoint co formularz nauczyciela, z powodem blokady **Oświadczenie**, statusem Nowe, sposobem wysyłki Normalna i istniejącym kontaktem Gratis od promotora. Testy nie odblokowują i nie wysyłają tego zamówienia. Zmiana powodu na Brak w ORD-DOC-23 odbywa się wyłącznie w formularzu, który następnie jest anulowany. Nie powstaje niezablokowane zamówienie nauczycielskie.

Gdy Oświadczenie ma szkołę, identyfikator szkolnego wpisu jest odczytywany przez powiązany plik. Nie zakładamy, że ID zamówienia nauczyciela i ID wpisu szkolnego są identyczne. Szkolny wpis Oświadczenia nie jest usuwany ani edytowany jako zwykłe zamówienie szkolne.

## Scenariusze krok po kroku

Nazwa wyświetlana w podglądzie jest porównywana z nazwą techniczną repozytorium. W pobieranej nazwie separatory `/` i `\` są zastępowane podkreśleniami, a brakujące rozszerzenie jest uzupełniane zgodnie z typem MIME: `.pdf`, `.jpg` lub `.jpeg`, `.png`. Jeśli nazwa techniczna już zawiera właściwe rozszerzenie, test nie oczekuje jego ponownego dodania. Ta normalizacja dotyczy wyłącznie nazwy; porównanie bajtów nie pomija żadnej różnicy zawartości.

| ID         | Co robi i sprawdza                                                                                                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORD-DOC-01 | Przygotowuje zamówienie i PDF przez API. Otwiera ikonę dokumentu, podgląd i przycisk Pobierz. Porównuje nazwę techniczną i wszystkie bajty pobranego PDF z przesłanym plikiem.                                                |
| ORD-DOC-02 | Ten sam przepływ dla JPG.                                                                                                                                                                                                     |
| ORD-DOC-03 | Ten sam przepływ dla PNG.                                                                                                                                                                                                     |
| ORD-DOC-04 | Zapisuje trzy różne formaty w jednym zamówieniu. Sprawdza nawigację podglądu, pobiera każdy plik i wymaga wyłączenia przycisków na krańcach listy.                                                                            |
| ORD-DOC-05 | Przygotowuje istniejący PNG przez API, dodaje PDF w edycji UI i zapisuje. Wymaga dwóch plików, zachowanego ID i zawartości pierwotnego PNG oraz obecności bajtów nowego PDF.                                                  |
| ORD-DOC-06 | Przygotowuje dwa zapisane skany. W edycji UI usuwa pierwszy i zapisuje. Wymaga wyłącznie drugiego ID oraz niezmienionej zawartości.                                                                                           |
| ORD-DOC-07 | Zmienia ilość produktu przez API w zamówieniu z dokumentem. Cały rekord dokumentu, w tym ID i zawartość, pozostaje bez zmian.                                                                                                 |
| ORD-DOC-08 | Zastępuje produkt innym przez API. Istniejący dokument pozostaje bez zmian.                                                                                                                                                   |
| ORD-DOC-09 | W edycji usuwa istniejący dokument i dodaje nowy, ale wybiera Anuluj. Repozytorium musi nadal zwracać wyłącznie oryginalny rekord.                                                                                            |
| ORD-DOC-10 | Wysyła dwa różne PNG o tej samej nazwie dowod.png. Wymaga różnych ID i technicznych nazw zgodnych ze szkolnym schematem rok/BOK/ID_indeks, bez nadpisania zawartości.                                                         |
| ORD-DOC-11 | Wysyła osiem plików i wymaga ośmiu różnych ID. To kontrola większej liczby plików, nie matematyczny dowód braku dowolnego limitu.                                                                                             |
| ORD-DOC-12 | Sprawdza autora utworzenia zamówienia względem zalogowanego użytkownika, datę utworzenia i ich zgodność z kolumnami UI. Nie jest testem pełnej historii dokumentu.                                                            |
| ORD-DOC-13 | Wybiera rok zamówienia i potwierdza jego obecność. Wybiera inny rok i wymaga ukrycia wpisu. Po powrocie do właściwego roku otwiera dokument.                                                                                  |
| ORD-DOC-14 | Usuwa własne zamówienie szkolne przez API i wymaga braku jego wpisu w API i UI. Dotyczy widocznego powiązania, nie fizycznych bloków repozytorium.                                                                            |
| ORD-DOC-15 | Próbuje przesłać EXE przez API. Wymaga 400/413/415/422 oraz niezmienionego wcześniej zapisanego PDF. Odpowiedź 500 nie jest poprawną walidacją.                                                                               |
| ORD-DOC-16 | Próbuje przesłać plik o 1 bajt większy niż 10 MiB przez API. Wymaga odrzucenia i zachowania wcześniejszego dokumentu.                                                                                                         |
| ORD-DOC-17 | Podczas edycji UI dodaje nowy plik i kontrolowanie zwraca 500 tylko dla uploadu. Wymaga zachowania starego dokumentu, pozostawienia formularza i możliwości anulowania. Nie zastępuje pozostałych żądań backendu.             |
| ORD-DOC-18 | Tworzy Oświadczenie z przypisaną szkołą i przesyła PDF/JPG/PNG. Pobiera te same pliki w profilu nauczyciela i w szkolnym wpisie oznaczonym Oświadczenie, porównując bajty.                                                    |
| ORD-DOC-19 | Do istniejącego Oświadczenia dodaje PDF przez edycję UI. Po zapisie wymaga dwóch plików i niezmienionego pierwotnego skanu.                                                                                                   |
| ORD-DOC-20 | Usuwa jeden z dwóch skanów Oświadczenia przez edycję UI. Wymaga pozostawienia drugiego i braku usuniętego ID w szkolnych powiązaniach.                                                                                        |
| ORD-DOC-21 | Tworzy Oświadczenie bez wskazania szkoły, mimo że nauczyciel jest do niej przypisany. Dokument musi być dostępny u nauczyciela, ale nie w zamówieniach tej szkoły.                                                            |
| ORD-DOC-22 | Tworzy Oświadczenie w szkole A, dodaje nauczycielowi szkołę B i usuwa jego przypisanie do A. Dokument pozostaje u nauczyciela i w pierwotnej A; nie pojawia się w B. Wszystkie zmiany dotyczą własnego nauczyciela testowego. |
| ORD-DOC-23 | Otwiera edycję Oświadczenia i potwierdza aktywny przycisk dodania pliku. W formularzu zmienia powód blokady na Brak i wymaga wyłączenia przycisku, po czym anuluje zmiany. Nie zapisuje zwykłego gratisu.                     |
| ORD-DOC-24 | W edycji Oświadczenia wybiera EXE. Wymaga komunikatu walidacji i braku zapisanego pliku; anuluje formularz.                                                                                                                   |
| ORD-DOC-25 | Ten sam przepływ dla pliku większego niż 10 MiB.                                                                                                                                                                              |
| ORD-DOC-26 | Wybiera plik dokładnie 10 MiB w formularzu Oświadczenia i wymaga przyjęcia na listę. Anuluje bez wysyłania dużego pliku do repozytorium.                                                                                      |
| ORD-DOC-27 | W szkolnym wpisie Oświadczenia wymaga nieaktywnej edycji zamówienia szkolnego, a następnie otwiera jego edycję w profilu nauczyciela.                                                                                         |
| ORD-DOC-28 | Dla wskazanego, istniejącego testowego zamówienia z integracji wymaga nieaktywnej edycji szkolnej. Bez konfiguracji jest pomijany z powodem. Nie udaje integracji przez podmianę typu ręcznego zamówienia.                    |
| ORD-DOC-29 | Usuwa własne Oświadczenie przez API. Wymaga braku zamówienia u nauczyciela i braku powiązania jego pliku w szkole.                                                                                                            |
| ORD-DOC-30 | W UI edycji usuwa F7P z zamówienia, wybiera przedmiot Język polski, poziom SP i klasę 5, dodaje P5Pv i ustawia ilość 3. Po zapisie sprawdza nowe pozycje przez API i zachowany dokument.                                      |

## Uruchamianie

W panelu wybierz Zamówienia i grep `@order-document` lub pojedyncze ID ORD-DOC. Plik: `tests/zamowienia-dokumenty.spec.ts`. Nie uruchamiaj drugiego przebiegu na tym samym środowisku, gdy istnieje aktywna blokada testów.

```powershell
npm test -- tests/zamowienia-dokumenty.spec.ts --grep "ORD-DOC-01:"
```

ORD-DOC-28 wymaga zmiennej ustawionej przed startem panelu, ze zweryfikowanym zamówieniem z rzeczywistej integracji w szkole testowej:

```powershell
$env:OCTOPUS_ORDER_EXTERNAL_REFERENCE = '{"schoolId":"ID_SZKOLY","schoolName":"AUTO_NAZWA_SZKOLY","id":"ID_ZAMOWIENIA"}'
```

Nie podawaj ręcznego zamówienia jako przykładu integracji. Test jest wyłącznie odczytowy i nie zmienia wskazanego zamówienia.

## Sprzątanie

Zamówienia szkolne usuwa fixture ORD-CLASS, a Oświadczenia fixture dokumentowa, wyłącznie po ID utworzonych w bieżącym scenariuszu. Błędy sprzątania są zapisywane w rejestrze runs i zgłaszane, nie ignorowane. Nauczyciel jest objęty dotychczasowym cleanupem projektu: poprawnie zakończone scenariusze kwalifikują go do usunięcia, nieudane pozostawiają go do diagnostyki. Szkoły referencyjne pozostają do ponownego użycia.

## Wymagania nadal niepotwierdzone

- Macierz BOK/CC/student/inny uprawniony i użytkownik bez dostępu: testy używają obecnego konta z pełnymi uprawnieniami. Nie zmieniają ról ani nie zastępują odmów uprawnień atrapą API.
- Fizyczne usunięcie danych z repozytorium po usunięciu zamówienia: sprawdzamy zniknięcie zamówienia i powiązań. Brak dostępu do bazy i niezależnego odczytu usuniętego obiektu plikowego nie pozwala dowieść usunięcia samych danych binarnych.
- Pełna historia zmian dokumentów, autor i data każdej edycji dokumentu oraz osobna informacja o każdym dodaniu w edycji wymagają dostępnego widoku lub kontraktu audytu. ORD-DOC-12 obejmuje autora i datę zamówienia, nie pełny audyt dokumentu.
- Formularz używa istniejącego filtra Rok, który aktualny frontend porównuje z datą utworzenia. ORD-DOC-13 nie dowodzi zgodności granic sezonu szkolnego przy przełomie lat ani zmiany danych historycznych.
- Osiem plików nie dowodzi braku jakiegokolwiek limitu. Pozostałe konfiguracje formatów i rozmiarów wymagają zatwierdzonej konfiguracji środowiska.
- Integracja wymaga rzeczywistego przykładu ORD-DOC-28. Nie tworzymy zewnętrznych zamówień, nie uruchamiamy wysyłki i nie testujemy edycji danych nauczycielskiego gratisu poza dokumentami.

Źródła: [nowe scenariusze](../../tests/zamowienia-dokumenty.spec.ts), [API i podgląd dokumentów](../../tests/support/order-documents.ts), [wcześniejsze załączniki](../../tests/zamowienia-zalaczniki.spec.ts).
