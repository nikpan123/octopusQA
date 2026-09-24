# Dokumentacja testów automatycznych

Dokumenty opisują cel, dane, reguły biznesowe, zakres scenariuszy i helpery używane przez testy regresji Octopusa.

Pełna, generowana lista 299 testów znajduje się w [indeksie scenariuszy](scenario-index.md). Zwykła regresja wykonuje 297 z nich; dwa scenariusze `MED-YEAR-*` należą do osobnego workflow rocznego. Liczby są stanem na 24.09.2026 i należy je aktualizować przez `npm run docs:scenarios`, nie ręcznie.

| Funkcjonalność                  | Dokument                                                       | Główne identyfikatory                                                       |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Dodawanie szkoły                | [dodawanie-szkoly.md](dodawanie-szkoly.md)                     | `SCH-*`                                                                     |
| Edycja szkoły                   | [edycja-szkoly.md](edycja-szkoly.md)                           | `SCH-EDIT-*`                                                                |
| Medalowość szkoły               | [medalowosc-szkoly.md](medalowosc-szkoly.md)                   | `MED-*`                                                                     |
| Roczne przeliczenie medalowości | [medalowosc-roczna.md](medalowosc-roczna.md)                   | `MED-YEAR-*`                                                                |
| Dodawanie i edycja nauczyciela  | [nauczyciele.md](nauczyciele.md)                               | `ADD-*`, `EDIT-*`, `TEA-*`, `FIND-*`                                        |
| Relacje szkoła–nauczyciel       | [relacje-szkola-nauczyciel.md](relacje-szkola-nauczyciel.md)   | `REL-*`, scenariusz `@smoke`                                                |
| Zamówienia szkoły               | [zamowienia-szkoly.md](zamowienia-szkoly.md)                   | `ORD-*`                                                                     |
| Klubowiczostwo nauczyciela      | [klubowiczostwo-nauczyciela.md](klubowiczostwo-nauczyciela.md) | `CLUB-*`                                                                    |
| Odporność i bezpieczeństwo      | [odpornosc-i-bezpieczenstwo.md](odpornosc-i-bezpieczenstwo.md) | `BRZEG-*`, `CONTRACT-*`, `AUTH-*`, `RESIL-*`, `KLUB-DOD-*`, `SZK-MED-DOD-*` |
| Próg minimalnego zamówienia     | [prog-minimalnego-zamowienia.md](prog-minimalnego-zamowienia.md) | `TC-SP-*`, `TC-PN-*` (głównie testy jednostkowe `node:test`, poza Playwright; jeden potwierdzony punkt danych ma też prawdziwy test E2E — `tests/prog-minimalnego-zamowienia.spec.ts`, `@school @threshold` — patrz dokument) |

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
npx playwright test --grep @security
npx playwright test --grep @concurrency
npm run test:annual:dev
```

Przed uruchomieniem wymagane są poprawne dane logowania w `.env`. Sesja jest sprawdzana w globalnym setupie i przed testami. Gdy zbliża się wygaśnięcie, blokada między procesami pozwala odświeżyć ją jednemu workerowi; pozostałe odczytują ten sam nowy stan bez równoległych logowań. Domyślnie dwa workery wykonują niezależne pliki spec, a zakres 2–4 można kontrolować przez `OCTOPUS_WORKERS`.

Po każdym przebiegu `scripts/performance-reporter.mjs` zapisuje `runs/performance-<run-id>.json`. Raport zawiera czasy całkowite, globalny setup i cleanup, setup/ciało/cleanup testów, p50/p90/p95/maksimum oraz liczniki żądań i statusów HTTP.

Scenariusze `@annual-medal` są wyłączone ze zwykłej regresji, ponieważ generują snapshot, wykonują kilka tysięcy żądań i należą do osobnego, dwufazowego procesu rocznego. Uruchamia się je jawnie skryptem `test:annual:dev` albo `test:annual:test`, zawsze na jednym workerze.

Dotyczy to również `npm.cmd run test:test`: polecenie wykonuje zwykły zestaw regresyjny i pomija `MED-YEAR-PREP` oraz `MED-YEAR-01`. Aktualną liczbę można potwierdzić przez `npm.cmd run test:test -- --list`. Skryptów rocznych nie należy uruchamiać bez `--grep`, ponieważ wtedy oba etapy wykonałyby się w jednym przebiegu. Poprawne osobne polecenia znajdują się w [dokumentacji rocznego workflow](medalowosc-roczna.md#14-uruchomienie-med-year-prep).

## Historyczny wynik pomiaru 2–4 workerów

Pomiar DEV z 23.09.2026 obejmował wcześniejszy zestaw 171 testów: 171/171 w 19,7 min na dwóch workerach (`p50=6,99 s`, `p95=17,95 s`). Cztery workery zakończyły przebieg w 15,9 min, ale tylko 166/171 testów przeszło; wystąpił między innymi błąd HTTP 500 optimistic concurrency podczas setupu API, a `p95` wzrosło do 20,05 s. Wyniku nie należy interpretować jako weryfikacji obecnego zestawu 296 testów. Domyślnym profilem pozostają dwa workery. Cztery są dostępne jako świadomy test obciążeniowy, nie jako profil CI.

Raporty porównawcze:

- `runs/performance-1d8097ac-dbeb-467d-ab3f-6eb6e7b22763.json` — dwa workery, przebieg zielony;
- `runs/performance-4a30477c-13cd-43d5-bf3a-1b30b1cac0d6.json` — cztery workery, pomiar granicy obciążenia.
