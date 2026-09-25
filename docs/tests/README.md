# Dokumentacja testów automatycznych

Dokumenty opisują cel, dane, reguły biznesowe, zakres scenariuszy i helpery używane przez testy regresji Octopusa.

Pełna, generowana lista **349 testów** znajduje się w [indeksie scenariuszy](scenario-index.md). Zwykła regresja wykonuje **347** z nich; dwa scenariusze `MED-YEAR-*` należą do osobnego workflow rocznego. Aktualny zestaw został rozszerzony między innymi o scenariusze dodawania i edycji szkoły oraz pełniejszą regresję zamówień szkoły `ORD-01`–`ORD-62`.

| Funkcjonalność                  | Dokument                                                       | Główne identyfikatory                 |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Dodawanie szkoły                | [dodawanie-szkoly.md](dodawanie-szkoly.md)                     | `SCH-*`                               |
| Edycja szkoły                   | [edycja-szkoly.md](edycja-szkoly.md)                           | `SCH-EDIT-*`                          |
| Medalowość szkoły               | [medalowosc-szkoly.md](medalowosc-szkoly.md)                   | `MED-*`                               |
| Roczne przeliczenie medalowości | [medalowosc-roczna.md](medalowosc-roczna.md)                   | `MED-YEAR-*`                          |
| Dodawanie i edycja nauczyciela  | [nauczyciele.md](nauczyciele.md)                               | `ADD-*`, `EDIT-*`, `TEA-*`, `FIND-*` |
| Relacje szkoła–nauczyciel       | [relacje-szkola-nauczyciel.md](relacje-szkola-nauczyciel.md)   | `REL-*`, scenariusz `@smoke`          |
| Zamówienia szkoły               | [zamowienia-szkoly.md](zamowienia-szkoly.md)                   | `ORD-*`                               |
| Klubowiczostwo nauczyciela      | [klubowiczostwo-nauczyciela.md](klubowiczostwo-nauczyciela.md) | `CLUB-*`                              |

## Aktualny stan zestawu testów

| Plik testowy | Liczba scenariuszy |
| --- | ---: |
| `klubowiczostwo-nauczyciela.spec.ts` | 72 |
| `nauczyciel-dodawanie.spec.ts` | 33 |
| `nauczyciel-edycja.spec.ts` | 44 |
| `nauczyciel-rozszerzenie.spec.ts` | 6 |
| `szkola-dodawanie.spec.ts` | 55 |
| `szkola-edycja.spec.ts` | 23 |
| `szkola-medalowosc-annual.spec.ts` | 2 |
| `szkola-medalowosc.spec.ts` | 42 |
| `szkola-nauczyciel.spec.ts` | 1 |
| `walidacja-anulowanie.spec.ts` | 9 |
| `zamowienia-szkoly.spec.ts` | 62 |
| **Razem** | **349** |

Pełne nazwy wszystkich scenariuszy, ich identyfikatory, pliki źródłowe i tagi są utrzymywane w [scenario-index.md](scenario-index.md).

### Zamówienia szkoły

Aktualny pakiet `ORD-01`–`ORD-62` obejmuje między innymi:

- kontrakt formularza dodawania zamówienia i anulowanie operacji;
- słowniki oraz filtrowanie produktów po przedmiocie, poziomie, klasie, tytule i kodzie;
- dodawanie, przenoszenie i usuwanie produktów z bieżącego zamówienia;
- edycję ilości, wartości graniczne i automatyczne uzupełnianie ilości po wyczyszczeniu pola;
- zapis zamówienia bez konieczności pozostawienia wybranego filtra `Przedmiot`, jeżeli produkt został już dodany;
- zabezpieczenie przed utworzeniem duplikatu przy dwóch szybkich kliknięciach `Zapisz` z krótkim odstępem;
- nadawanie różnych ID kolejnym zamówieniom i izolację operacji usuwania;
- edycję i trwałość zapisanych danych;
- dodawanie wielu załączników, usuwanie z potwierdzeniem oraz zachowanie pozostałych plików;
- trwałość załączników po zapisaniu zamówienia, z uwzględnieniem systemowej nazwy pliku widocznej po ponownym otwarciu edycji;
- odrzucanie niedozwolonych formatów i plików przekraczających 10 MB oraz obsługę wariantów komunikatu błędu uploadu;
- granicę dokładnie 10 MB dla dozwolonego pliku;
- cleanup utworzonych zamówień również po niepowodzeniu właściwej części testu.

## Strategia przygotowania danych: UI a API

W testach szkoły obowiązuje rozdzielenie przygotowania danych od funkcji będącej celem scenariusza:

- `tests/szkola-dodawanie.spec.ts` tworzy szkołę przez **UI**, ponieważ formularz dodawania i żądanie `POST /api/Institution/AddNewInstitution` są bezpośrednim przedmiotem testu;
- `tests/szkola-edycja.spec.ts` przygotowuje szkołę przez **API**, a samą edycję wykonuje przez UI; dzięki temu test edycji nie powtarza za każdym razem pełnego przepływu dodawania;
- testy innych modułów korzystają z API albo stabilnych szkół referencyjnych, jeżeli samo tworzenie szkoły nie jest częścią badanego wymagania.

Helper przygotowujący szkołę do edycji nie zakłada konkretnego miasta ani kodu pocztowego. Po utworzeniu rekordu odczytuje rzeczywisty adres z panelu i zapisuje go w danych scenariusza. Dzięki temu test nie zależy od stałych `API_SCHOOL_CITY` ani `API_SCHOOL_POSTAL_CODE`.

W scenariuszach zamówień wykorzystywane są stabilne szkoły referencyjne odpowiednie dla bieżącego środowiska. Zamówienia utworzone przez test są rejestrowane i usuwane w cleanupie, aby nie pozostawiać danych po przebiegu testów. Stan listy zamówień potrzebny do rozpoznania nowego ID jest pobierany przed otwarciem formularza dodawania, dzięki czemu kolejne zamówienia nie mogą zostać pomylone z wcześniej istniejącymi rekordami.

## Uruchamianie

```text
npm test
npm run test:dev
npm run test:test
npm run test:workers:2
npm run test:workers:4
```

Wybrany obszar można uruchomić przez tag, np.:

```text
npx playwright test --grep @teacher
npx playwright test --grep @order
npx playwright test --grep @club
npm run test:annual:dev
```

Pojedynczy scenariusz zamówień można uruchomić np. tak:

```text
npx playwright test tests/zamowienia-szkoly.spec.ts -g "ORD-43" --workers=1 --headed
```

Przed uruchomieniem wymagane są poprawne dane logowania w `.env`. Sesja jest sprawdzana w globalnym setupie i przed testami. Gdy zbliża się wygaśnięcie, blokada między procesami pozwala odświeżyć ją jednemu workerowi; pozostałe odczytują ten sam nowy stan bez równoległych logowań. Domyślnie dwa workery wykonują niezależne pliki spec, a zakres 2–4 można kontrolować przez `OCTOPUS_WORKERS`.

Po każdym przebiegu `scripts/performance-reporter.mjs` zapisuje `runs/performance-<run-id>.json`. Raport zawiera czasy całkowite, globalny setup i cleanup, setup/ciało/cleanup testów, p50/p90/p95/maksimum oraz liczniki żądań i statusów HTTP.

Scenariusze `@annual-medal` są wyłączone ze zwykłej regresji, ponieważ generują snapshot, wykonują kilka tysięcy żądań i należą do osobnego, dwufazowego procesu rocznego. Uruchamia się je jawnie skryptem `test:annual:dev` albo `test:annual:test`, zawsze na jednym workerze.

Dotyczy to również `npm.cmd run test:test`: polecenie wykonuje zwykły zestaw regresyjny i pomija `MED-YEAR-PREP` oraz `MED-YEAR-01`. Aktualną liczbę można potwierdzić przez `npm.cmd run test:test -- --list`. Skryptów rocznych nie należy uruchamiać bez `--grep`, ponieważ wtedy oba etapy wykonałyby się w jednym przebiegu. Poprawne osobne polecenia znajdują się w [dokumentacji rocznego workflow](medalowosc-roczna.md#14-uruchomienie-med-year-prep).

## Aktualizacja dokumentacji scenariuszy

Po dodaniu, usunięciu albo zmianie nazw testów należy ponownie wygenerować indeks:

```text
npm run docs:scenarios
```

Następnie warto zweryfikować liczbę testów dostępną dla wybranego środowiska:

```text
npm.cmd run test:test -- --list
```

Dzięki temu `scenario-index.md` oraz liczby podane w tej dokumentacji pozostają zgodne z faktycznym zestawem regresyjnym.

## Wynik pomiaru 2–4 workerów

Historyczny pomiar DEV z 23.09.2026 dotyczył wcześniejszego zestawu 171 testów: 171/171 przeszło w 19,7 min na dwóch workerach (`p50=6,99 s`, `p95=17,95 s`). Cztery workery zakończyły ten sam ówczesny zestaw w 15,9 min, ale tylko 166/171 testów przeszło; wystąpił między innymi błąd HTTP 500 optimistic concurrency podczas setupu API, a `p95` wzrosło do 20,05 s. Wynik jest zachowany jako punkt odniesienia wydajnościowy, a nie jako aktualna liczba scenariuszy. Domyślnym profilem pozostają dwa workery.

Raporty porównawcze:

- `runs/performance-1d8097ac-dbeb-467d-ab3f-6eb6e7b22763.json` — dwa workery, przebieg zielony;
- `runs/performance-4a30477c-13cd-43d5-bf3a-1b30b1cac0d6.json` — cztery workery, pomiar granicy obciążenia.
