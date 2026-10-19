# Kopiowanie zamówień w strukturze placówek

Scenariusze dotyczą wymagania Redmine 37160: zamówienie można skopiować do każdej innej placówki tej samej struktury, również z pominięciem poziomów i pomiędzy gałęziami. Dokument oznacza tu zamówienie, nie sam plik załącznika.

## Wynik weryfikacji

DEV, 19.10.2026: **18 passed, 1 skipped, 0 failed**, jeden worker, bez powtórek. Pełny przebieg trwał 7,1 minuty. ORD-COPY-01–ORD-COPY-18 przeszły wraz ze sprzątaniem. ORD-COPY-19 nie potwierdza kontroli uprawnień: wymaga osobnej sesji konta bez School.EDIT i pozostaje pominięty.

Testy lokalnego panelu: **10/10 passed**, w tym prezentacja scenariusza, wybór wyłącznie powiązanego testu i brak samoczynnego uruchamiania. Sprawdzenie typów oraz lint nowego zestawu i panelu zakończyły się bez błędów. Wynik dotyczy tego zestawu, nie pełnej regresji projektu. Raport wydajności przebiegu: `runs/performance-0044d6b7-8ab8-4b76-9f2a-02c4b2abd375.json`.

## Scenariusze w panelu

W [panelu Scenariusze](http://127.0.0.1:4173/#business-scenarios) wyszukaj `37160` lub `ORD-COPY`. Każdy scenariusz ma warunki wstępne, kroki, oczekiwany wynik i powiązany test o identycznym ID. Przycisk „Wybierz powiązany test” zaznacza tylko ten test; uruchomienie wymaga osobnego przycisku „Uruchom testy”. Brak testu w katalogu blokuje wybór. Scenariusz wymagający niedostępnej sesji z ograniczonymi prawami jest oznaczony jako zablokowany.

Opisy są zapisane w `test-ui/scenarios.json` i odczytywane przez `GET /api/scenarios`. Testy znajdują się w `tests/zamowienia-kopiowanie-struktura.spec.ts`. Adnotacje `redmine=37160` i `scenario=ORD-COPY-*` łączą wykonania z wymaganiem i opisem scenariusza. Pakiet Zamówienia obejmuje nowy plik.

## Dane i powiązania

Dedykowane placówki mają prefiks `AUTO_STR_DEV_COPY_` albo `AUTO_STR_TEST_COPY_`. Struktura A zawiera zespół A, jego szkołę podstawową SP oraz technikum TECH; liceum LO jest dzieckiem SP, zatem wnukiem zespołu A. Osobny zespół B ma szkołę BSP. SOLO nie ma struktury.

| Scenariusz i test       | Sprawdzenie                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| ORD-COPY-01–ORD-COPY-03 | A → SP, A → LO, A → TECH                                                  |
| ORD-COPY-04–ORD-COPY-07 | LO → A, LO → SP, LO → TECH, TECH → LO                                     |
| ORD-COPY-08–ORD-COPY-12 | SP → A, SP → LO, SP → TECH, TECH → A, TECH → SP                           |
| ORD-COPY-13             | Brak placówki źródłowej na liście celów                                   |
| ORD-COPY-14             | Brak B, BSP i SOLO na liście celów struktury A                            |
| ORD-COPY-15             | Kopia ma wyłączone Kopiuj; oryginał można skopiować                       |
| ORD-COPY-16             | Brak celu blokuje zapis; anulowanie wybranego celu niczego nie zapisuje   |
| ORD-COPY-17             | Zapis do trzech celów tworzy dokładnie jedną kopię w każdym               |
| ORD-COPY-18             | Placówka samodzielna nie udostępnia kopiowania                            |
| ORD-COPY-19             | Konto bez School.EDIT — pominięty do czasu udostępnienia oddzielnej sesji |

## Przebieg i bezpieczeństwo

Przygotowanie relacji oraz zamówienia korzysta z prawdziwego API. Oryginał zawiera F7P w ilości 3 i 4P-2 w ilości 2. Kopiowanie odbywa się przez formularz UI. Test porównuje rzeczywiste żądanie zapisu z wybranymi odbiorcami i sprawdza nowy rekord, oznaczenie kopii, produkty, ilości oraz brak zmian oryginału i zamówień pozostałych placówek. W testach kierunków kopia musi być też widoczna po ponownym otwarciu placówki docelowej.

Odpowiedzi DEV nie są podmieniane atrapami. Negatywne przypadki sprawdzają ograniczenia interfejsu; nie stanowią dowodu odrzucania spreparowanych żądań API. Testy samego lokalnego panelu korzystają z atrap sieci i nie uruchamiają zamówień na DEV.

Przed przygotowaniem wymagany jest brak relacji dedykowanych placówek. Sprzątanie usuwa nowe zamówienia w tych placówkach i wyłącznie relacje utworzone przez bieżący test, także po błędzie. Istniejące wcześniej zamówienia nie są usuwane. Szkoły referencyjne pozostają do ponownego użycia. Testy nie zmieniają ról konta użytkownika i nie wysyłają wiadomości.

## Uruchomienie

```powershell
npx playwright test tests/zamowienia-kopiowanie-struktura.spec.ts --workers=1 --retries=0
```

Jeden worker zapewnia sekwencyjne korzystanie z dedykowanej struktury. Sam katalog scenariuszy nie uruchamia testów ani przygotowania danych.
