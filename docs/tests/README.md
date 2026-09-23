# Dokumentacja testów automatycznych

Dokumenty opisują cel, dane, reguły biznesowe, zakres scenariuszy i helpery używane przez testy regresji Octopusa.

Pełna, generowana lista testów znajduje się w [indeksie scenariuszy](scenario-index.md).

| Funkcjonalność                  | Dokument                                                       | Główne identyfikatory                |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| Medalowość szkoły               | [medalowosc-szkoly.md](medalowosc-szkoly.md)                   | `MED-*`                              |
| Roczne przeliczenie medalowości | [medalowosc-roczna.md](medalowosc-roczna.md)                   | `MED-YEAR-*`                         |
| Dodawanie i edycja nauczyciela  | [nauczyciele.md](nauczyciele.md)                               | `ADD-*`, `EDIT-*`, `TEA-*`, `FIND-*` |
| Relacje szkoła–nauczyciel       | [relacje-szkola-nauczyciel.md](relacje-szkola-nauczyciel.md)   | `REL-*`, scenariusz `@smoke`         |
| Zamówienia szkoły               | [zamowienia-szkoly.md](zamowienia-szkoly.md)                   | `ORD-*`                              |
| Klubowiczostwo nauczyciela      | [klubowiczostwo-nauczyciela.md](klubowiczostwo-nauczyciela.md) | `CLUB-*`                             |

## Uruchamianie

```text
npm test
npm run test:dev
npm run test:test
```

Wybrany obszar można uruchomić przez tag, np.:

```text
npx playwright test --grep @teacher
npx playwright test --grep @order
npx playwright test --grep @club
npx playwright test --grep @annual-medal
```

Przed uruchomieniem wymagane są poprawne dane logowania w `.env` oraz aktualna sesja utworzona przez `npm run login`.
