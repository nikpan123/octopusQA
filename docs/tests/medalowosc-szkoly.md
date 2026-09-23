# Medalowość szkoły — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcja testów **„Medalowość szkoły”** weryfikuje poprawność wyliczania, prezentowania, wyszukiwania oraz zapisywania historii medalowości szkół w Octopusie.

Testy obejmują:

| Obszar             | Co sprawdzamy                                     |
| ------------------ | ------------------------------------------------- |
| UI szkoły          | wyświetlany medal, readonly, tooltip              |
| Wyszukiwarka szkół | filtrowanie po medalu, multiselect, zachowanie ID |
| API                | medal i lista przedmiotów medalowych              |
| Historia zmian     | sezon, medal, autor, źródło, data                 |
| Reguły biznesowe   | zależność medalu od liczby przedmiotów            |
| Spójność           | API ↔ UI ↔ tooltip ↔ historia                     |
| Dane zbiorcze      | poprawność reguł dla większej liczby szkół        |

Identyfikatory obejmują zakres **MED-01 – MED-60**, ale świadomie zawierają luki po połączeniu scenariuszy wykonujących te same nawigacje i sprawdzających podzbiory tych samych danych.

---

## 2. Pliki

Główny plik testowy:

```text
tests/szkola-medalowosc.spec.ts
```

Helpery specyficzne dla medalowości:

```text
tests/support/school-medal.ts
```

Helpery ogólne Octopusa:

```text
tests/support/octopus.ts
```

`Octopus` odpowiada m.in. za otwieranie paneli, wyszukiwarki oraz pobieranie tabel wyników.

---

## 3. Reguły biznesowe medalowości

| Liczba kwalifikowanych przedmiotów | Medal  |
| ---------------------------------: | ------ |
|                                  0 | Brak   |
|                                  1 | Brąz   |
|                                  2 | Srebro |
|                       3 lub więcej | Złoto  |

Przedmioty muszą być unikalne. Wielu nauczycieli tego samego przedmiotu nie zwiększa liczby przedmiotów medalowych.

Przykład:

```json
["Matematyka"]
```

pozostaje jednym przedmiotem medalowym, nawet jeśli w szkole jest kilku nauczycieli `MAT SP`.

---

## 4. Dane referencyjne DEV i TEST

Dane referencyjne są rozdzielone per środowisko w:

```text
tests/support/school-medal-data.ts
```

Środowisko wybierane jest przez `OCTOPUS_ENV` z `tests/support/environment.ts`. Konfiguracje Playwrighta wskazują odpowiednio:

```text
DEV  -> https://octopus.gwodev.pl
TEST -> https://octopus.gwotest.pl
```

### DEV

| Typ      |      ID | Szkoła                             | Medal  | Przedmioty medalowe                                                 |
| -------- | ------: | ---------------------------------- | ------ | ------------------------------------------------------------------- |
| Gold     | `57616` | Szkoła Podstawowa nr 5, Lębork     | Złoto  | Matematyka, Język polski, Historia, Fizyka, Edukacja wczesnoszkolna |
| Silver   | `85263` | Szkoła Podstawowa nr 379, Warszawa | Srebro | Matematyka, Geografia                                               |
| Bronze   | `66109` | Szkoła Podstawowa w Raszkowie      | Brąz   | Matematyka                                                          |
| No medal | `92928` | Szkoła Podstawowa nr 403, Warszawa | Brak   | brak                                                                |

### TEST

| Typ      |      ID | Szkoła                                                                         | Medal  | Przedmioty medalowe                |
| -------- | ------: | ------------------------------------------------------------------------------ | ------ | ---------------------------------- |
| Gold     | `57616` | Szkoła Podstawowa nr 5, Lębork                                                 | Złoto  | Matematyka, Język polski, Historia |
| Silver   | `52005` | Szkoła Podstawowa z Oddziałami Dwujęzycznymi nr 20 Fundacji Szkolnej, Warszawa | Srebro | Matematyka, Język polski           |
| Bronze   | `66109` | Szkoła Podstawowa w Raszkowie, Raszków                                         | Brąz   | Matematyka                         |
| No medal | `92928` | Szkoła Podstawowa nr 403, Warszawa                                             | Brak   | brak                               |

W helperze odpowiadają im:

```ts
GOLD_SCHOOL;
SILVER_SCHOOL;
BRONZE_SCHOOL;
NO_MEDAL_SCHOOL;
```

Te same szkoły mogą mieć inny stan nauczycieli, klubowiczostwa, `subjectNames` i historii na DEV oraz TEST. Dlatego testy nie powinny hardkodować danych wspólnych dla obu środowisk.

Dla testu historii złotej szkoły używane są również dane środowiskowe, np.:

```text
DEV  -> 2025/2026 Złoto, 2026-10-01 00:00
TEST -> 2024/2025 Złoto, 2025-10-01 00:00
```

---

## 5. Format danych API

Medal pobierany jest z:

```http
GET /api/InstitutionBrowser/GetInstitutions
```

Interesujący fragment odpowiedzi:

```json
{
  "informationAboutMedalCategory": {
    "medalCategoryName": "Brąz",
    "subjectNames": ["Matematyka"]
  }
}
```

W testach używamy:

```ts
informationAboutMedalCategory.medalCategoryName;
informationAboutMedalCategory.subjectNames;
```

---

## 6. Zakres MED-01 – MED-19 — UI i podstawowe scenariusze

### MED-02, MED-04 i MED-05 — Złoto

- wartość `Złoto` i pole readonly w jednym scenariuszu,
- tooltip i lista przedmiotów w jednym scenariuszu,
- medal w wynikach wyszukiwania.

### MED-07, MED-09 i MED-10 — Srebro

Analogiczny zestaw dla szkoły `85263`.

### MED-12, MED-14 i MED-15 — Brąz

Analogiczny zestaw dla szkoły `66109`.

### MED-17 – MED-19 — Brak

Sprawdzane są:

- `Medal = Brak`,
- `subjectNames = []`,
- brak tooltipa medalowego,
- poprawność w wynikach wyszukiwania.

---

## 7. MED-20 – MED-26 — Historia medalowości

Historia znajduje się w zakładce:

```text
Historia zmian
```

Sprawdzane kolumny:

| Kolumna | Przykład            |
| ------- | ------------------- |
| Pole    | Medal               |
| Wartość | `2025/2026 Złoto`   |
| Autor   | `automat`           |
| Źródło  | `Formularz klubowy` |
| Data    | `2026-10-01 00:00`  |

Format wartości:

```regex
^\d{4}/\d{4} (Złoto|Srebro|Brąz|Brak)$
```

Historia na DEV i TEST może mieć inną długość. Na jednym środowisku wszystkie wpisy mieszczą się bez przewijania, a na drugim panel ma osobny pionowy scroll. Dlatego testy historii korzystają z helpera:

```ts
collectMedalHistoryEntries(page, history);
```

Helper:

- odczytuje pełną historię medalowości,
- obsługuje panel bez osobnego scrolla,
- obsługuje przewijany / wirtualizowany panel,
- deduplikuje wpisy odczytywane podczas przewijania,
- zwraca `value`, `author`, `source` i `date`.

Zakres MED-20 – MED-26:

- poprawność wpisu referencyjnego,
- jeden wpis na sezon,
- format wartości,
- źródło,
- autor,
- data 1 października,
- kolejność sezonów.

MED-26 powinien weryfikować kolejność historii dla wszystkich czterech kategorii referencyjnych, nie tylko dla Złota.

---

## 8. MED-27 – MED-31 — filtrowanie wyszukiwarki

Sprawdzane filtry:

- `Złoto`,
- `Srebro`,
- `Brąz`,
- `Brak`,
- multiselect, np. `Złoto + Srebro`.

Wyniki nie mogą zawierać medalu spoza wybranych wartości.

---

## 9. Ważna zasada wyszukiwarki — ID ma priorytet

Jeżeli wyszukujemy:

```text
ID = 66109
Medal = Złoto
```

wyszukiwarka zwróci szkołę:

```text
66109 / Brąz
```

To jest **oczekiwane zachowanie**.

ID identyfikuje konkretną szkołę i ma priorytet nad pozostałymi kryteriami. MED-54 dokumentuje tę zasadę.

---

## 10. MED-32 – MED-43 — spójność API, UI i tooltipa

Dla czterech szkół referencyjnych sprawdzamy spójność:

```text
API
↓
pole Medal
↓
tooltip
```

Przykład:

```text
API:
medalCategoryName = Brąz
subjectNames = ["Matematyka"]

UI:
Medal = Brąz

Tooltip:
Matematyka
```

Dla `Brak`:

- API `subjectNames = []`,
- UI `Medal = Brak`,
- tooltip nie istnieje.

---

## 11. MED-44 – MED-46 — reguły biznesowe

MED-44:

```text
0 → Brak
1 → Brąz
2 → Srebro
3+ → Złoto
```

MED-45:

- brak duplikatów w `subjectNames`.

MED-46:

- wielu nauczycieli `MAT SP` nie oznacza wielu przedmiotów medalowych.

---

## 12. MED-47 – MED-54 — spójność, historia i wyjątki

| Test   | Cel                                                                                |
| ------ | ---------------------------------------------------------------------------------- |
| MED-47 | medal w wynikach wyszukiwania = medal z API                                        |
| MED-48 | samo występowanie nauczyciela danego przedmiotu nie oznacza kwalifikacji do medalu |
| MED-49 | najnowszy wpis historii odpowiada aktualnemu medalowi                              |
| MED-50 | maksymalnie jeden wpis medalowy na sezon                                           |
| MED-51 | źródło każdego wpisu = `Formularz klubowy`                                         |
| MED-52 | wpis dla sezonu zapisywany jest 1 października roku kończącego sezon               |
| MED-53 | autor wpisów medalowych = `automat`                                                |
| MED-54 | ID szkoły ma priorytet nad filtrem Medal                                           |

MED-49 – MED-53 analizują pełną historię przez `collectMedalHistoryEntries()`, więc działają zarówno dla krótkiej historii bez scrolla, jak i dla rozbudowanej historii wymagającej przewijania.

Dla szkoły z `Medal = Brak` historia medalowości może zawierać `0` wpisów. Jest to poprawny przypadek. Jeżeli wpisy istnieją, nadal są normalnie walidowane. Brak wpisów historii dla szkoły z medalem innym niż `Brak` jest traktowany jako nieprawidłowość.

---

## 13. MED-55 – MED-56 — request + response wyszukiwarki

Przechwytywany jest request:

```http
GET /api/InstitutionBrowser/GetInstitutions
```

oraz analizowany `filterModel`.

MED-55:

- wyszukiwanie bez ID po jednym medalu.

MED-56:

- multiselect `Złoto + Srebro`.

Sprawdzane są:

- request,
- response API,
- wyniki UI.

---

## 14. Helper `searchSchoolsByMedalsWithApi`

Helper usuwa z testów powtarzalny kod techniczny:

```ts
page.waitForResponse(...)
new URL(...)
JSON.parse(...)
response.json()
```

Zwraca:

```ts
{
  results,
  filterModel,
  schools,
}
```

Dzięki temu test skupia się na wymaganiu biznesowym.

---

## 15. MED-57 – MED-60 — reguły progów na większym zbiorze danych

| Test   | Reguła                                                  |
| ------ | ------------------------------------------------------- |
| MED-57 | każda szkoła Brąz ma dokładnie 1 unikalny przedmiot     |
| MED-58 | każda szkoła Srebro ma dokładnie 2 unikalne przedmioty  |
| MED-59 | każda szkoła Złoto ma co najmniej 3 unikalne przedmioty |
| MED-60 | każda szkoła Brak ma 0 przedmiotów                      |

Używane helpery:

```ts
expectMedalMatchesSubjectCount(...)
expectUniqueMedalSubjects(...)
```

---

## 16. Najważniejsze helpery `school-medal.ts`

| Helper                              | Odpowiedzialność                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `medalInput()`                      | pole Medal na panelu szkoły                                                      |
| `medalTooltip()`                    | tooltip z przedmiotami                                                           |
| `openMedalSchool()`                 | otwarcie konkretnej szkoły po ID; identyfikacja rekordu nie zależy od pola nazwy |
| `expectSchoolMedal()`               | sprawdzenie wartości medalu                                                      |
| `expectMedalReadOnly()`             | sprawdzenie braku edycji                                                         |
| `expectMedalTooltip()`              | sprawdzenie tooltipa                                                             |
| `expectNoMedalTooltip()`            | brak tooltipa dla `Brak`                                                         |
| `getMedalTooltipSubjects()`         | pobranie przedmiotów z tooltipa                                                  |
| `getSchoolMedalValue()`             | odczyt aktualnego medalu UI                                                      |
| `searchSchoolById()`                | wyszukanie szkoły po ID                                                          |
| `searchSchoolsByMedal()`            | filtr jednego medalu                                                             |
| `searchSchoolsByMedals()`           | multiselect                                                                      |
| `searchSchoolsByMedalsWithApi()`    | filtrowanie + przechwycenie API                                                  |
| `expectSchoolResultsMedals()`       | walidacja medali w tabeli                                                        |
| `prepareSchoolSearchByIdAndMedal()` | scenariusze ID + medal                                                           |
| `openSchoolHistory()`               | otwarcie historii i oczekiwanie na załadowanie danych                            |
| `collectMedalHistoryEntries()`      | zebranie wszystkich wpisów `Medal`, z obsługą scrolla i braku scrolla            |
| `medalHistoryRows()`                | bezpośrednie wiersze historii; pomocnicze dla prostych przypadków                |
| `getSchoolMedalApiData()`           | medal i przedmioty z API                                                         |
| `expectMedalMatchesSubjectCount()`  | walidacja progu medalowego                                                       |
| `expectUniqueMedalSubjects()`       | brak duplikatów                                                                  |
| `schoolTeachersBySubject()`         | nauczyciele danego przedmioto-poziomu                                            |

---

## 17. Roczne przeliczenie medalowości

Roczny proces wyliczania medalu jest opisany w osobnym dokumencie:

[**Medalowość roczna — dokumentacja testów automatycznych**](medalowosc-roczna.md)

Dokument obejmuje testy `MED-YEAR-PREP` i `MED-YEAR-01`, snapshoty DEV/TEST, wyliczanie `expectedMedal`, klubowiczostwo na docelowy rok szkolny oraz workflow przed i po jobie rocznym.
