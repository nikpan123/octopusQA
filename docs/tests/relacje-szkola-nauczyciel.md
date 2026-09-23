# Relacje szkoła–nauczyciel — dokumentacja testów automatycznych

## 1. Cel sekcji

Testy weryfikują dwukierunkową i trwałą relację między nauczycielem a szkołą: szkoła jest widoczna na karcie nauczyciela, a nauczyciel w zakładce `Nauczyciele` szkoły.

## 2. Pliki

```text
tests/szkola-nauczyciel.spec.ts
tests/nauczyciel-rozszerzenie.spec.ts
tests/nauczyciel-dodawanie.spec.ts
tests/support/shared-school.ts
tests/support/scenario.ts
tests/support/octopus.ts
```

## 3. Scenariusze

| Test      | Cel                                                                    |
| --------- | ---------------------------------------------------------------------- |
| `REL-01`  | utworzenie nauczyciela z relacją i odczyt nauczyciela od strony szkoły |
| `REL-02`  | dodanie drugiej szkoły nie usuwa pierwszej relacji                     |
| `ADD-09`  | nauczyciela można utworzyć z dwiema szkołami                           |
| `ADD-10`  | szkołę można usunąć z formularza przed zapisem                         |
| `ADD-30`  | anulowanie nie tworzy rekordu ani relacji                              |
| `EDIT-45` | dane są trwałe po przejściu do szkoły i powrocie                       |
| `EDIT-46` | edycja nauczyciela nie usuwa relacji                                   |

Scenariusz `@smoke` dodatkowo łączy pełny przepływ:

```text
utworzenie szkoły
→ utworzenie nauczyciela
→ wyszukanie nauczyciela
→ edycja i normalizacja
→ historia zmian
→ weryfikacja od strony szkoły
```

## 4. Reguły biznesowe

- Relacja jest identyfikowana przez ID szkoły i ID nauczyciela, nie wyłącznie przez tekst nazwy.
- Dodanie kolejnej szkoły zachowuje wszystkie wcześniejsze powiązania.
- Ta sama osoba musi być widoczna w każdej powiązanej szkole.
- Zmiana danych osobowych nie może usuwać relacji.
- Anulowanie dodawania nauczyciela nie może pozostawić pustej relacji w szkole.
- Historia nauczyciela zawiera wpis `Dodana Szkoła` z nazwą placówki.

## 5. Fixture współdzielonej szkoły

`shared-school.ts` udostępnia testom jako fixture `school` stabilną, referencyjną szkołę medalową przypisaną do środowiska:

```ts
school.id;
school.name;
```

Fixture nie wykonuje nawigacji ani wyszukiwania przez UI i nie tworzy szkoły. Relację nauczyciela ze szkołą przygotowuje factory API razem z rekordem nauczyciela. Dzięki temu testy edycji i relacji nie powtarzają kosztownego setupu interfejsowego.

## 6. Asercje relacji

Od strony nauczyciela test sprawdza tabelę szkół i konkretne ID placówek. Od strony szkoły sprawdza zakładkę `Nauczyciele` oraz komórki:

```text
ID nauczyciela
imię
nazwisko
```

Takie podejście chroni test przed przypadkowym dopasowaniem osoby o podobnej nazwie.

Lista nauczycieli szkoły jest paginowana. Helper `schoolTeacherRow()` przełącza tabelę na `Pokaż wszystkich` przed wyszukaniem wiersza po ID; sama obecność nauczyciela w odpowiedzi API nie oznacza jeszcze, że jego wiersz znajduje się na aktualnie wyrenderowanej stronie tabeli.

## 7. Uruchamianie

```text
npx playwright test tests/szkola-nauczyciel.spec.ts
npx playwright test tests/nauczyciel-rozszerzenie.spec.ts --grep @relation
```
