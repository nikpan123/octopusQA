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

Aktualny zestaw obejmuje testy **MED-01 – MED-60**.

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

## 4. Stałe szkoły wykorzystywane w regresji

| Typ      |      ID | Szkoła                             | Oczekiwany medal | Przedmioty                                                          |
| -------- | ------: | ---------------------------------- | ---------------- | ------------------------------------------------------------------- |
| Gold     | `57616` | Szkoła Podstawowa nr 5, Lębork     | Złoto            | Matematyka, Język polski, Historia, Fizyka, Edukacja wczesnoszkolna |
| Silver   | `85263` | Szkoła Podstawowa nr 379, Warszawa | Srebro           | Matematyka, Geografia                                               |
| Bronze   | `66109` | Szkoła Podstawowa w Raszkowie      | Brąz             | Matematyka                                                          |
| No medal | `92928` | Szkoła Podstawowa nr 403, Warszawa | Brak             | brak                                                                |

W helperze odpowiadają im:

```ts
GOLD_SCHOOL;
SILVER_SCHOOL;
BRONZE_SCHOOL;
NO_MEDAL_SCHOOL;
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

### MED-01 – MED-05 — Złoto

- wartość `Złoto`,
- pole readonly,
- tooltip,
- lista przedmiotów,
- medal w wynikach wyszukiwania.

### MED-06 – MED-10 — Srebro

Analogiczny zestaw dla szkoły `85263`.

### MED-11 – MED-15 — Brąz

Analogiczny zestaw dla szkoły `66109`.

### MED-16 – MED-19 — Brak

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

Zakres:

- poprawność wpisu,
- jeden wpis na sezon,
- format wartości,
- źródło,
- autor,
- data 1 października,
- kolejność sezonów.

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

## 12. MED-47 – MED-54 — spójność i wyjątki

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

| Helper                              | Odpowiedzialność                      |
| ----------------------------------- | ------------------------------------- |
| `medalInput()`                      | pole Medal na panelu szkoły           |
| `medalTooltip()`                    | tooltip z przedmiotami                |
| `openMedalSchool()`                 | otwarcie konkretnej szkoły            |
| `expectSchoolMedal()`               | sprawdzenie wartości medalu           |
| `expectMedalReadOnly()`             | sprawdzenie braku edycji              |
| `expectMedalTooltip()`              | sprawdzenie tooltipa                  |
| `expectNoMedalTooltip()`            | brak tooltipa dla `Brak`              |
| `getMedalTooltipSubjects()`         | pobranie przedmiotów z tooltipa       |
| `getSchoolMedalValue()`             | odczyt aktualnego medalu UI           |
| `searchSchoolById()`                | wyszukanie szkoły po ID               |
| `searchSchoolsByMedal()`            | filtr jednego medalu                  |
| `searchSchoolsByMedals()`           | multiselect                           |
| `searchSchoolsByMedalsWithApi()`    | filtrowanie + przechwycenie API       |
| `expectSchoolResultsMedals()`       | walidacja medali w tabeli             |
| `prepareSchoolSearchByIdAndMedal()` | scenariusze ID + medal                |
| `openSchoolHistory()`               | otwarcie historii                     |
| `medalHistoryRows()`                | wszystkie wiersze historii medalu     |
| `medalHistoryRowByValue()`          | konkretny wpis historii               |
| `historyValueCell()`                | kolumna Wartość                       |
| `historyAuthorCell()`               | kolumna Autor                         |
| `historySourceCell()`               | kolumna Źródło                        |
| `historyDateCell()`                 | kolumna Data                          |
| `getLatestMedalHistoryValue()`      | najnowszy sezon                       |
| `getSchoolMedalApiData()`           | medal i przedmioty z API              |
| `expectMedalMatchesSubjectCount()`  | walidacja progu medalowego            |
| `expectUniqueMedalSubjects()`       | brak duplikatów                       |
| `schoolTeachersBySubject()`         | nauczyciele danego przedmioto-poziomu |

---

## 17. Ograniczenie — medalowość przeliczana jest rocznie

Zmiana danych nauczyciela **nie powoduje natychmiastowej zmiany medalowości szkoły**.

Potwierdzony ręcznie scenariusz:

```text
szkoła ma Brak
↓
nauczyciel otrzymuje Matematyka / SP
↓
dodane zostaje aktywne potwierdzenie
↓
nauczyciel staje się „Nasz”
↓
medal szkoły nadal = Brak
subjectNames nadal = []
```

Nie oznacza to błędu.

Medalowość jest przeliczana w procesie rocznym — **1 października**.

Dlatego test typu:

```text
dodaj potwierdzenie
→ oczekuj natychmiast Brązu
```

jest niepoprawny.

---

## 18. Czego nie testujemy w codziennej regresji

Nie wykonujemy automatycznie scenariuszy wymagających przejścia daty:

```text
30 września → reset
1 października → ponowne przeliczenie
```

Nie mamy obecnie potwierdzonego mechanizmu:

- ręcznego uruchomienia joba,
- fake date,
- endpointu recalculate,
- procedury uruchamianej tylko dla jednej szkoły.

---

## 19. Potencjalny zestaw testów rocznych

Jeżeli pojawi się możliwość ręcznego uruchomienia procesu przeliczenia:

```text
MED-YEAR-01 – brak kwalifikowanych przedmiotów → Brak
MED-YEAR-02 – 1 przedmiot → Brąz
MED-YEAR-03 – 2 przedmioty → Srebro
MED-YEAR-04 – 3 przedmioty → Złoto
MED-YEAR-05 – nauczyciel bez aktywnego potwierdzenia nie liczy się
MED-YEAR-06 – nauczyciel wspierający nie liczy się
MED-YEAR-07 – duplikaty nauczycieli nie zwiększają liczby przedmiotów
MED-YEAR-08 – zapis historii 1 października
MED-YEAR-09 – dokładnie jeden wpis na nowy sezon
```

Rekomendowany tag:

```text
@annual-medal
```

---

## 20. Diagnostyka testów

W testach API celowo pozostawione są `console.log`.

Przykład:

```ts
console.log(
  `MED-57: szkoła ${school.id}. ` +
    `Medal: ${medal}. ` +
    `Przedmioty: ${JSON.stringify(subjectNames)}.`,
);
```

Przy problemach z filtrowaniem warto logować:

```ts
JSON.stringify(filterModel, null, 2);
```

Szczególnie ważne pola:

- `institutionIds`,
- `medal`,
- `page`,
- `limit`.

---

## 21. Jak dodawać kolejne testy

1. Najpierw sprawdzić, czy podobna operacja nie ma już helpera w `school-medal.ts`.
2. Jeżeli test zawiera dużo `waitForResponse`, parsowania URL lub powtarzających się locatorów — przenieść techniczną część do helpera.
3. Test powinien przede wszystkim pokazywać wymaganie biznesowe.
4. Nie hardkodować `userId` z `filterModel`.
5. Do identyfikacji konkretnej szkoły używać ID, nie samej nazwy.
6. Pamiętać, że ID ma priorytet nad innymi filtrami wyszukiwarki.
7. Dla nowych testów API zostawiać czytelne logi diagnostyczne.
8. Nie oczekiwać natychmiastowego przeliczenia medalowości po zmianie nauczyciela.
9. Testy zależne od procesu 1 października trzymać osobno od standardowej regresji.

---

## 22. Ogólny przepływ testów

```text
                    ┌─────────────────┐
                    │     Szkoła      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │      Medal      │
                    │ Brak/Brąz/...   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
        UI                API              Historia
          │                  │                  │
     pole Medal       medalCategoryName    sezon + medal
     tooltip          subjectNames          automat
          │                  │              Formularz klubowy
          └──────────────────┼──────────────────┘
                             │
                             ▼
                   Spójność wszystkich
                        reprezentacji
                             │
                             ▼
                  Reguła 0 / 1 / 2 / 3+
```

---

## 23. Stan obecny

Na ten moment **MED-01 – MED-60 przechodzą** i pokrywają główną część medalowości możliwą do stabilnego sprawdzania przez cały rok.

Największy brak w automatyzacji dotyczy samego **procesu rocznego przeliczenia medalowości 1 października**. Dopóki nie ma dostępnego ręcznego triggera tego procesu, powinien być traktowany jako osobny scenariusz roczny, a nie część zwykłej regresji.
