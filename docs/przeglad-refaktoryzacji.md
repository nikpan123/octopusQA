# Przegląd jakości i refaktoryzacji testów

## Status realizacji — 2026-09-23

Zrealizowano:

- rozdzielenie zamówień i klubowiczostwa na osobne pliki spec,
- podział `teacher-edit.ts` na moduły domenowe z zachowaniem wspólnego eksportu,
- usunięcie adresu DEV z logiki fixture scenariusza,
- przeniesienie helperów dodawania nauczyciela do `tests/support`,
- wspólne formatowanie przez Prettier,
- kontrolę TypeScript, ESLint i reguł Playwright przez `npm run quality`,
- generowany indeks wszystkich scenariuszy w `docs/tests/scenario-index.md`.

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
