# Nauczyciele — dokumentacja testów automatycznych

## 1. Cel sekcji

Testy nauczycieli weryfikują utworzenie rekordu, jego edycję, walidację danych, normalizację, historię zmian oraz wyszukiwanie.

| Obszar             | Co sprawdzamy                                             |
| ------------------ | --------------------------------------------------------- |
| Dane podstawowe    | imię, nazwisko, data urodzenia                            |
| Kontakt            | e-mail, maksymalnie dwa telefony, rekord minimalny        |
| RODO               | Marketing, E-mail, Telefon i źródło zgody                 |
| Szkoły             | jedna lub wiele relacji i usunięcie relacji przed zapisem |
| Przedmioto-poziomy | dodawanie, wiele wartości, duplikaty i wymagane pola      |
| Dodatkowe dane     | adres prywatny, uwagi i notatki                           |
| Audyt              | trwałość danych, autor, data, źródło i historia zmian     |
| Wyszukiwanie       | ID, nazwisko i e-mail                                     |

## 2. Pliki

```text
tests/nauczyciel-dodawanie.spec.ts
tests/nauczyciel-edycja.spec.ts
tests/nauczyciel-rozszerzenie.spec.ts
tests/walidacja-anulowanie.spec.ts
tests/support/teacher-add.ts
tests/support/teacher-edit.ts
tests/support/scenario.ts
tests/support/api-factory.ts
tests/support/octopus.ts
```

## 3. Dane i cykl życia scenariusza

Fixture `scenario` tworzy unikalny identyfikator w formacie:

```text
REG_<timestamp>_<losowy-sufiks>
```

Na jego podstawie powstają nazwisko, nazwa szkoły i adres e-mail w domenie `example.invalid`. Dane przebiegu są zapisywane w `runs/*.json`, a utworzone rekordy są oznaczane jako testowe. Rekord po nieudanym teście pozostaje do diagnostyki; rekordy poprawnego przebiegu mogą zostać usunięte przez cleanup zestawu.

### 3.1. Sprzątanie po nieudanym teście

Globalne sprzątanie nie usuwa automatycznie nauczyciela z testu `FAILED`, `FAIL`, `TIMEDOUT` ani `INTERRUPTED`. Rejestr otrzymuje `cleanupStatus: KEPT_FAILED_TEST`, dzięki czemu dane pozostają dostępne do analizy. Po zakończeniu diagnostyki można użyć jawnej opcji `--include-failed`.

```powershell
# Podgląd PASS oraz nieudanych — bez zmian w bazie
npm.cmd run cleanup:teachers -- --include-failed

# Podgląd jednego konkretnego rejestru FAILED
npm.cmd run cleanup:teachers -- REG_123456_abcdef.json --include-failed

# Usunięcie jednego konkretnego rejestru FAILED
npm.cmd run cleanup:teachers -- REG_123456_abcdef.json --include-failed --apply

# Usunięcie wszystkich rekordów pokazanych w zbiorczym podglądzie
npm.cmd run cleanup:teachers -- --include-failed --apply
```

Do usuwania wyłącznie wybranych błędów należy podać pełne nazwy plików z kolumny `rejestr`. Wariant zbiorczy obejmuje również oczekujące rekordy `PASS`. Każdy nauczyciel jest przed DELETE sprawdzany po ID, unikalnym e-mailu lub zapisanym nazwisku oraz fladze `Testowy`. Brak `--apply` zawsze oznacza wyłącznie lokalny podgląd.

Setup testów `EDIT-*` nie przechodzi przez formularz dodawania. Factory API tworzy nauczyciela, relacje ze szkołami i przedmioto-poziomy, po czym scenariusz otwiera bezpośrednio kartę utworzonego rekordu. UI pozostaje warstwą testowaną dla samej edycji. Testy `ADD-*` nadal przygotowują nauczyciela przez UI, ponieważ dodawanie jest ich celem.

`FIND-05` wyszukuje po unikalnym nazwisku i e-mailu oraz potwierdza dokładnie jeden wynik i właściwe ID. Dla pola e-mail helper emituje natywne zdarzenie `input` i opuszcza pole bez dodatkowego `keyup`; obecny formularz wyszukiwania po `keyup` kopiuje wartość e-maila również do modelu nazwiska, co zmieniałoby semantykę żądania.

Otwarcie karty nauczyciela czeka na odpowiedź historii statusów, a snapshot historii na wyrenderowanie pierwszego rzeczywistego wiersza danych. Zapobiega to porównaniu częściowo załadowanej tabeli z jej stanem końcowym bez używania stałych opóźnień.

Testy `ADD-*` korzystają również ze stałych szkół QA:

|      ID | Nazwa       |
| ------: | ----------- |
| `93391` | Szkoła QA 1 |
| `93392` | Szkoła QA 2 |

## 4. Dodawanie — ADD-01–ADD-30

| Zakres      | Funkcjonalność                                                    |
| ----------- | ----------------------------------------------------------------- |
| `ADD-01–03` | minimalny rekord z e-mailem lub telefonem, bieżąca data urodzenia |
| `ADD-04–05` | domyślne i wybrane źródło                                         |
| `ADD-06–08` | kombinacje zgód RODO                                              |
| `ADD-09–10` | dwie szkoły i usunięcie szkoły przed zapisem                      |
| `ADD-11–12` | jeden lub wiele przedmioto-poziomów                               |
| `ADD-13–14` | zachowanie pisowni oraz podobna osoba                             |
| `ADD-18–19` | brak kontaktu i ostrzeżenie o braku przedmioto-poziomu            |
| `ADD-21–25` | zajęty e-mail, długość telefonu i data urodzenia                  |
| `ADD-27–29` | brak poziomu, brak przedmiotu i duplikat                          |
| `ADD-30`    | anulowanie nie tworzy nauczyciela ani relacji                     |

Numery niewystępujące w pliku są świadomymi lukami w identyfikatorach; nie należy renumerować istniejących testów, ponieważ identyfikatory mogą występować w raportach i zgłoszeniach.

## 5. Edycja — EDIT-02–EDIT-47

| Zakres       | Funkcjonalność                                                         |
| ------------ | ---------------------------------------------------------------------- |
| `EDIT-02–11` | anulowanie, imię, nazwisko, normalizacja i walidacja                   |
| `EDIT-12–23` | e-mail, telefony, usuwanie kontaktu i rekord minimalny                 |
| `EDIT-24–27` | data urodzenia i adres prywatny                                        |
| `EDIT-28–34` | uwagi, notatki, archiwizacja i limit 220 znaków                        |
| `EDIT-35–42` | zależności zgód RODO, ostrzeżenia i źródła                             |
| `EDIT-43–47` | zapis bez zmian, anulowanie, nawigacja, relacje i kompletność historii |

## 6. Najważniejsze reguły biznesowe

- Nauczyciel musi mieć imię, nazwisko, szkołę oraz co najmniej jeden kontakt: e-mail lub telefon.
- Brak przedmioto-poziomu wymaga osobnego potwierdzenia, ale nie blokuje poprawnego rekordu.
- Telefon ma 9 cyfr; interfejs nie powinien przyjąć dziesiątej.
- Można zapisać maksymalnie dwa numery telefonów.
- Przyszła data urodzenia jest niepoprawna.
- Tego samego przedmioto-poziomu nie można dodać ponownie.
- W edycji imię i nazwisko są normalizowane; test dodawania celowo dokumentuje inne zachowanie.
- Zgody E-mail i Telefon zależą od zgody Marketing podczas edycji.
- Notatka ma limit 220 znaków, a pusta notatka nie jest zapisywana.
- Anulowanie formularza nie może zmienić danych ani historii.

## 7. Historia zmian

Testy sprawdzają nie tylko aktualny stan karty, ale również wpis audytowy. Typowa weryfikacja obejmuje:

```text
pole → nowa wartość → źródło operacji → autor → data
```

Do porównania historii przed i po anulowaniu służą snapshoty zwracane przez `teacherHistorySnapshot()`.

## 8. Najważniejsze helpery

| Helper                                 | Odpowiedzialność                                               |
| -------------------------------------- | -------------------------------------------------------------- |
| `openNewTeacherForm()`                 | otwarcie formularza dodawania                                  |
| `saveNewTeacherWithoutSubjectLevel()`  | zapis wraz z obsługą ostrzeżenia                               |
| `addNewTeacherSubjectLevel()`          | dodanie przedmiotu i poziomu                                   |
| `expectTeacherCreationHistoryChange()` | wpis historii utworzenia                                       |
| `openBasicTeacherEdit()`               | podstawowa edycja nauczyciela                                  |
| `openTeacherEmailEdit()`               | edycja e-maila                                                 |
| `getSavedTeacherPhones()`              | odczyt zapisanych telefonów                                    |
| `openTeacherPrivateAddressEdit()`      | edycja adresu prywatnego                                       |
| `addTeacherNote()`                     | zapis notatki                                                  |
| `openTeacherRodoEdit()`                | edycja zgód RODO                                               |
| `expectTeacherHistoryChange()`         | asercja pojedynczej zmiany                                     |
| `schoolTeacherRow()`                   | wiersz nauczyciela po pokazaniu całej paginowanej listy szkoły |

## 9. Uruchamianie

```text
npx playwright test tests/nauczyciel-dodawanie.spec.ts
npx playwright test tests/nauczyciel-edycja.spec.ts
npx playwright test --grep @teacher
```
