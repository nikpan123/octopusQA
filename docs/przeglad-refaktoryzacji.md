# Przegląd jakości i refaktoryzacji testów

> Migawka stanu z 23.09.2026. Część rekomendacji została już wdrożona, dlatego bieżące komendy, strukturę i liczbę scenariuszy należy sprawdzać w [README](../README.md) oraz [indeksie scenariuszy](tests/scenario-index.md).

## Aktualizacja audytu — 2026-10-12

### Mocne strony

- 365 nazwanych scenariuszy z generowanym i automatycznie weryfikowanym indeksem.
- Wspólne helpery domenowe ograniczają duplikację selektorów i przygotowania danych.
- Izolowane identyfikatory `REG_*`, rejestry przebiegów i wielostopniowa walidacja chronią cleanup przed usunięciem obcych danych.
- Raport HTML, trace, screenshoty, klasyfikacja awarii i metryki wydajności tworzą dobry zestaw diagnostyczny.
- Kontrole TypeScript, ESLint, Prettier i zgodności dokumentacji są dostępne pod jedną komendą `npm run quality`.
- Testy odróżniają defekt produktu od niestabilności automatyzacji; trwałe błędy nie są ukrywane przez `test.fail()`.

### Wynik pełnej regresji i wykonane poprawki

Pełna regresja DEV uruchomiona na dwóch workerach zakończyła się początkowo wynikiem 327/363. Analiza 36 awarii wykazała przeterminowane dane referencyjne, zmianę reguł zgód, wyścig podczas oznaczania rekordów testowych, zbyt kruche wyszukiwanie oraz przejściowy konflikt zapisu historii nauczyciela.

Poprawiono:

- oczekiwanie na potwierdzenie zapisu flagi `Testowy`,
- przygotowanie poprawnej zgody podczas dodawania nauczyciela,
- stabilne wyszukiwanie szkoły po ID,
- obsługę nieznanego kodu pocztowego,
- dane referencyjne medali i wydawnictw,
- wąskie ponowienie wyłącznie konfliktu optimistic concurrency,
- scenariusz wartości ujemnej po naprawie zachowania aplikacji.

Po poprawkach testy zmienionych obszarów przechodzą. Dwa scenariusze nadal konsekwentnie wykrywają jeden defekt produktu: filtrowanie szkół po `Medal = Brak`. Szczegóły i dowody znajdują się w [raporcie MED-30/MED-60](issues/MED-30-MED-60-filtr-medal-brak.md).

### Usprawnienia CI

- Pull requesty i zmiany na głównych gałęziach uruchamiają kontrolę jakości oraz testy jednostkowe.
- Pełną regresję DEV można uruchomić ręcznie z ograniczeniem współbieżności do jednego przebiegu.
- CI wykonuje najwyżej jedno ponowienie; lokalnie retry pozostaje domyślnie wyłączone.
- Reporter przechowuje wyłącznie końcowy stan testu, więc udany retry nie tworzy fałszywej awarii.
- CI zapisuje raport GitHub, JUnit, HTML, trace, screenshoty, klasyfikację błędów i metryki.
- Końcowy cleanup działa także po nieudanym przebiegu, ale usuwa tylko rekordy należące do automatu i pozytywnie zweryfikowane przez istniejące zabezpieczenia.

### Kolejne kroki

1. Naprawić kontrakt filtrowania `Medal = Brak` w aplikacji lub API i potwierdzić `MED-30` oraz `MED-60`.
2. Uruchomić pełną regresję po wdrożeniu poprawki produktu i zapisać nową wartość bazową.
3. Skonfigurować cztery sekrety logowania wymagane przez ręczny workflow E2E.
4. Dodać okresowe uruchomienie regresji dopiero po potwierdzeniu stabilności ręcznego workflow.
5. Ograniczać zależność od zmiennych danych DEV przez kontrolowane dane referencyjne lub endpoint seedujący.

## Status realizacji — 2026-09-23

Zrealizowano:

- rozdzielenie zamówień i klubowiczostwa na osobne pliki spec,
- podział `teacher-edit.ts` na moduły domenowe z zachowaniem wspólnego eksportu,
- usunięcie adresu DEV z logiki fixture scenariusza,
- przeniesienie helperów dodawania nauczyciela do `tests/support`,
- wspólne formatowanie przez Prettier,
- kontrolę TypeScript, ESLint i reguł Playwright przez `npm run quality`,
- generowany indeks wszystkich scenariuszy w `docs/tests/scenario-index.md`.
- API factory tworzące nauczyciela, relacje i przedmioto-poziomy,
- migrację setupu `EDIT-*` i `CLUB-*` do API,
- usunięcie startowej nawigacji fixture do panelu nauczyciela,
- redukcję powtarzających się scenariuszy `MED-*`,
- kontrolowany zakres 2–4 workerów (domyślnie 2),
- raport percentyli czasu fixture/setup/test/cleanup i liczników HTTP.

## Pomiar kontrolny 2–4 workerów

Ten sam przekrój czterech testów (`ADD-04`, `EDIT-04`, `CLUB-14`, `MED-33`) uruchomiono na DEV po przeniesieniu logowania do globalnego setupu:

| Workery | p50 testu | p95 testu | p95 setupu | Żądania przeglądarki | Żądania factory API | Cleanup zestawu |
| ------: | --------: | --------: | ---------: | -------------------: | ------------------: | --------------: |
|       2 |    3,32 s |    6,00 s |     0,33 s |                  293 |                   8 |         10,60 s |
|       4 |    3,54 s |    6,48 s |     0,39 s |                  293 |                   8 |         10,74 s |

Próba jest mała, więc nie stanowi benchmarku całej regresji. Pokazuje jednak, że cztery workery są stabilne i nie zwiększają liczby żądań, ale dla takiego przekroju nie dają zysku względem dwóch. Domyślnie pozostają dwa workery; cztery należy włączać dla większych przekrojów i oceniać na podstawie kolejnych raportów percentylowych. Globalny cleanup jest obecnie największym stałym kosztem krótkich przebiegów.

Przed centralizacją sesji każdy z czterech workerów próbował odświeżyć ją osobno, a p95 setupu wynosiło 9,66 s. Po pojedynczym odświeżeniu w globalnym setupie workery wyłącznie odczytują gotowy stan; p95 spadło do 0,39 s.

Osobną, nadal aktualną rekomendacją pozostaje pełna migracja `ORD-03` do helperów z `order.ts`.

## Wprowadzone zmiany

1. Powtarzalna obsługa zamówień została przeniesiona do `tests/support/order.ts`.
2. `ORD-01` i `ORD-02` używają wspólnych operacji dodawania produktu, ustawiania ilości, zapisu i weryfikacji pozycji.
3. Typ `Scenario` został wyeksportowany, a lokalne helpery dodawania nauczyciela nie używają już `any`.
4. Adres karty nauczyciela w teście smoke korzysta z `OCTOPUS_BASE_URL`, dzięki czemu działa także dla środowiska `test`.
5. Dokumentacja funkcjonalna została rozdzielona na obszary i połączona indeksem `docs/tests/README.md`.

## Rekomendacje — priorytet wysoki

### 1. Rozdzielić zamówienia i klubowiczostwo

`tests/zamowienia-klubowiczostwo.spec.ts` łączy dwa niezależne obszary i ma ponad dwa tysiące linii. Warto rozdzielić go na:

```text
tests/zamowienia-szkoly.spec.ts
tests/klubowiczostwo-nauczyciela.spec.ts
```

Zmiana poprawi nawigację, raporty i możliwość uruchamiania plików bez `--grep`.

### 2. Dokończyć migrację ORD-03 do `order.ts`

`ORD-03` nadal zawiera starszą, rozbudowaną wersję selektorów. Powinien używać `addOrderProduct()`, `setOrderQuantity()`, `expectOrderItems()`, `openOrderEdit()` i `deleteOrder()`. Migrację najlepiej wykonać razem z uruchomieniem testu na stabilnym środowisku, ponieważ scenariusz obejmuje zapis i cleanup danych.

### 3. Podzielić `teacher-edit.ts` według domen

Plik ma ponad 1500 linii i obejmuje kilka niezależnych modułów. Proponowany podział:

```text
teacher-basic.ts
teacher-contact.ts
teacher-address.ts
teacher-notes.ts
teacher-rodo.ts
teacher-history.ts
```

Publiczny plik `teacher-edit.ts` może czasowo reeksportować helpery, aby migracja testów była stopniowa.

### 4. Usunąć adresy środowiska z logiki fixture

W `scenario.ts` rozpoznawanie `lastUrl` nadal używa wyrażenia zależnego od hosta `octopus.gwodev.pl`. Powinno porównywać `new URL(page.url()).host` z konfiguracją środowiska albo sprawdzać wyłącznie ścieżkę URL.

## Rekomendacje — priorytet średni

### 5. Przenieść lokalne helpery dodawania nauczyciela

`registerCreatedTeacher()`, `expectTeacherInSchool()` i `searchTeacherByEmail()` są już typowane, ale pozostają w pliku spec. Jeśli będą potrzebne w kolejnym scenariuszu, należy przenieść je odpowiednio do `scenario.ts`, helpera relacji i helpera wyszukiwania.

### 6. Ujednolicić styl i formatowanie

W repozytorium występują pojedyncze i podwójne cudzysłowy oraz bardzo różna szczegółowość komentarzy. Warto dodać Prettier i skrypt `format:check`, aby zmiany nie generowały przypadkowych różnic.

### 7. Dodać statyczne reguły jakości

TypeScript działa w trybie `strict`, ale brakuje reguł wykrywających nieużywane importy, obietnice bez `await` i zbyt szerokie typy. ESLint dla TypeScript i Playwright może wychwytywać te problemy przed uruchomieniem testów E2E.

### 8. Ujednolicić indeks scenariuszy

Identyfikatory mają świadome luki, ale brakuje jednej tabeli mapującej ID do pliku i wymagania. Indeks w dokumentacji jest dobrym początkiem; kolejnym krokiem może być automatyczne generowanie listy nazw testów w CI.

## Zasada dalszej refaktoryzacji

Helper powinien ukrywać mechanikę interfejsu, ale nie wymaganie biznesowe. Dobry test powinien nadal jasno pokazywać:

```text
jakie dane przygotowuje
co użytkownik robi
jaki rezultat biznesowy jest oczekiwany
```

Selektory, obsługa AG Grid, dialogi i powtarzalne oczekiwanie na stan należą do helperów. Konkretne kody produktów, klasy, zgody i oczekiwane reguły powinny pozostać widoczne w scenariuszu.
