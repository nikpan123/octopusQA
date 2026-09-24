# Przegląd jakości i refaktoryzacji testów

## Status realizacji — 2026-09-24

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
- pełną migrację `ORD-03` do helperów `order.ts`,
- helpery negatywnych i brzegowych przypadków zamówień,
- fabrykę API szkoły i metodę fixture `createSchoolViaApi()` do setupu poza testami formularza,
- dodatkowy pakiet 26 przypadków odporności, bezpieczeństwa i luk kontraktowych.

## Pomiar kontrolny 2–4 workerów

Ten sam przekrój czterech testów (`ADD-04`, `EDIT-04`, `CLUB-14`, `MED-33`) uruchomiono na DEV po przeniesieniu logowania do globalnego setupu:

| Workery | p50 testu | p95 testu | p95 setupu | Żądania przeglądarki | Żądania factory API | Cleanup zestawu |
| ------: | --------: | --------: | ---------: | -------------------: | ------------------: | --------------: |
|       2 |    3,32 s |    6,00 s |     0,33 s |                  293 |                   8 |         10,60 s |
|       4 |    3,54 s |    6,48 s |     0,39 s |                  293 |                   8 |         10,74 s |

Próba jest mała, więc nie stanowi benchmarku całej regresji. Pokazuje jednak, że cztery workery są stabilne i nie zwiększają liczby żądań, ale dla takiego przekroju nie dają zysku względem dwóch. Domyślnie pozostają dwa workery; cztery należy włączać dla większych przekrojów i oceniać na podstawie kolejnych raportów percentylowych. Globalny cleanup jest obecnie największym stałym kosztem krótkich przebiegów.

Przed centralizacją sesji każdy z czterech workerów próbował odświeżyć ją osobno, a p95 setupu wynosiło 9,66 s. Po pojedynczym odświeżeniu w globalnym setupie workery wyłącznie odczytują gotowy stan; p95 spadło do 0,39 s.

Pomiar pozostaje historyczny: po dodaniu nowych scenariuszy należy wykonać osobny benchmark pełnego obecnego zestawu 296 testów regularnych.

## Wprowadzone zmiany

1. Powtarzalna obsługa zamówień została przeniesiona do `tests/support/order.ts`.
2. `ORD-01`–`ORD-03` używają wspólnych operacji dodawania produktu, ustawiania ilości, zapisu, edycji, weryfikacji pozycji i usuwania.
3. Typ `Scenario` został wyeksportowany, a lokalne helpery dodawania nauczyciela nie używają już `any`.
4. Adres karty nauczyciela w teście smoke korzysta z `OCTOPUS_BASE_URL`, dzięki czemu działa także dla środowiska `test`.
5. Dokumentacja funkcjonalna została rozdzielona na obszary i połączona indeksem `docs/tests/README.md`.

## Zrealizowane wcześniejsze rekomendacje

### 1. Rozdzielenie zamówień i klubowiczostwa

Obszary działają już w osobnych plikach:

```text
tests/zamowienia-szkoly.spec.ts
tests/klubowiczostwo-nauczyciela.spec.ts
```

Nowe przypadki negatywne są dodatkowo wydzielone do `tests/zamowienia-negatywne.spec.ts`.

### 2. Migracja ORD-03 do `order.ts`

`ORD-03` używa `addOrderProduct()`, `setOrderQuantity()`, `expectOrderItems()`, `openOrderEdit()` i `deleteOrder()`. Scenariusz zachowuje cleanup w `finally` oraz pierwotny błąd testu.

### 3. Podział `teacher-edit.ts` według domen

Helpery są rozdzielone na moduły domenowe:

```text
teacher-basic.ts
teacher-contact.ts
teacher-address.ts
teacher-notes.ts
teacher-rodo.ts
teacher-history.ts
```

Publiczny `teacher-edit.ts` pozostaje warstwą zgodności i reeksportuje helpery.

### 4. Konfiguracja adresów środowiska

Fixture korzysta z `OCTOPUS_BASE_URL`; scenariusze nie są związane na stałe z hostem DEV.

## Dalsze rekomendacje

### 5. Utrzymać helpery dodawania nauczyciela w warstwie support

Współdzielone operacje, w tym `registerCreatedTeacher()`, znajdują się w `tests/support`. Nowe helpery należy dodawać tam dopiero wtedy, gdy rzeczywiście są używane przez więcej niż jeden scenariusz.

### 6. Utrzymać styl i formatowanie

Prettier i `format:check` są częścią `npm run quality`. Należy nadal ograniczać komentarze do uzasadnienia reguły lub ryzyka, zamiast opisywać każdą instrukcję.

### 7. Rozszerzać statyczne reguły jakości ostrożnie

TypeScript, ESLint i reguły Playwright działają w `npm run quality`. Kolejne reguły powinny być dodawane razem z usunięciem istniejących naruszeń, aby kontrola pozostała zielona.

### 8. Utrzymać generowany indeks scenariuszy

`docs/tests/scenario-index.md` jest generowany przez `npm run docs:scenarios` i kontrolowany przez `docs:scenarios:check`. Identyfikatory mogą mieć świadome luki i powtórzenia dla testów parametryzowanych; nie należy renumerować istniejących scenariuszy.

### 9. Zweryfikować nowy pakiet na stabilnym środowisku

Nowe testy obejmują celowo symulowane błędy HTTP, dwie karty, opóźnienia sieci i dane zależne od środowiska. Przed uznaniem ich za stabilny profil CI należy uruchomić pełny zestaw na DEV i TEST, udokumentować wyniki testów opisowych oraz ponowić pomiar dwóch i czterech workerów.

## Zasada dalszej refaktoryzacji

Helper powinien ukrywać mechanikę interfejsu, ale nie wymaganie biznesowe. Dobry test powinien nadal jasno pokazywać:

```text
jakie dane przygotowuje
co użytkownik robi
jaki rezultat biznesowy jest oczekiwany
```

Selektory, obsługa AG Grid, dialogi i powtarzalne oczekiwanie na stan należą do helperów. Konkretne kody produktów, klasy, zgody i oczekiwane reguły powinny pozostać widoczne w scenariuszu.
