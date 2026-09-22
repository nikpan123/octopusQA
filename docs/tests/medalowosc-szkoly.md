# Medalowość szkoły — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcja testów **„Medalowość szkoły”** weryfikuje poprawność wyliczania, prezentowania, wyszukiwania oraz zapisywania historii medalowości szkół w Octopusie.

Testy obejmują:

| Obszar | Co sprawdzamy |
|---|---|
| UI szkoły | wyświetlany medal, readonly, tooltip |
| Wyszukiwarka szkół | filtrowanie po medalu, multiselect, zachowanie ID |
| API | medal i lista przedmiotów medalowych |
| Historia zmian | sezon, medal, autor, źródło, data |
| Reguły biznesowe | zależność medalu od liczby przedmiotów |
| Spójność | API ↔ UI ↔ tooltip ↔ historia |
| Dane zbiorcze | poprawność reguł dla większej liczby szkół |

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

| Liczba kwalifikowanych przedmiotów | Medal |
|---:|---|
| 0 | Brak |
| 1 | Brąz |
| 2 | Srebro |
| 3 lub więcej | Złoto |

Przedmioty muszą być unikalne. Wielu nauczycieli tego samego przedmiotu nie zwiększa liczby przedmiotów medalowych.

Przykład:

```json
["Matematyka"]
```

pozostaje jednym przedmiotem medalowym, nawet jeśli w szkole jest kilku nauczycieli `MAT SP`.

---

## 4. Stałe szkoły wykorzystywane w regresji

| Typ | ID | Szkoła | Oczekiwany medal | Przedmioty |
|---|---:|---|---|---|
| Gold | `57616` | Szkoła Podstawowa nr 5, Lębork | Złoto | Matematyka, Język polski, Historia, Fizyka, Edukacja wczesnoszkolna |
| Silver | `85263` | Szkoła Podstawowa nr 379, Warszawa | Srebro | Matematyka, Geografia |
| Bronze | `66109` | Szkoła Podstawowa w Raszkowie | Brąz | Matematyka |
| No medal | `92928` | Szkoła Podstawowa nr 403, Warszawa | Brak | brak |

W helperze odpowiadają im:

```ts
GOLD_SCHOOL
SILVER_SCHOOL
BRONZE_SCHOOL
NO_MEDAL_SCHOOL
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
    "subjectNames": [
      "Matematyka"
    ]
  }
}
```

W testach używamy:

```ts
informationAboutMedalCategory.medalCategoryName
informationAboutMedalCategory.subjectNames
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

| Kolumna | Przykład |
|---|---|
| Pole | Medal |
| Wartość | `2025/2026 Złoto` |
| Autor | `automat` |
| Źródło | `Formularz klubowy` |
| Data | `2026-10-01 00:00` |

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

| Test | Cel |
|---|---|
| MED-47 | medal w wynikach wyszukiwania = medal z API |
| MED-48 | samo występowanie nauczyciela danego przedmiotu nie oznacza kwalifikacji do medalu |
| MED-49 | najnowszy wpis historii odpowiada aktualnemu medalowi |
| MED-50 | maksymalnie jeden wpis medalowy na sezon |
| MED-51 | źródło każdego wpisu = `Formularz klubowy` |
| MED-52 | wpis dla sezonu zapisywany jest 1 października roku kończącego sezon |
| MED-53 | autor wpisów medalowych = `automat` |
| MED-54 | ID szkoły ma priorytet nad filtrem Medal |

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

| Test | Reguła |
|---|---|
| MED-57 | każda szkoła Brąz ma dokładnie 1 unikalny przedmiot |
| MED-58 | każda szkoła Srebro ma dokładnie 2 unikalne przedmioty |
| MED-59 | każda szkoła Złoto ma co najmniej 3 unikalne przedmioty |
| MED-60 | każda szkoła Brak ma 0 przedmiotów |

Używane helpery:

```ts
expectMedalMatchesSubjectCount(...)
expectUniqueMedalSubjects(...)
```

---

## 16. Najważniejsze helpery `school-medal.ts`

| Helper | Odpowiedzialność |
|---|---|
| `medalInput()` | pole Medal na panelu szkoły |
| `medalTooltip()` | tooltip z przedmiotami |
| `openMedalSchool()` | otwarcie konkretnej szkoły |
| `expectSchoolMedal()` | sprawdzenie wartości medalu |
| `expectMedalReadOnly()` | sprawdzenie braku edycji |
| `expectMedalTooltip()` | sprawdzenie tooltipa |
| `expectNoMedalTooltip()` | brak tooltipa dla `Brak` |
| `getMedalTooltipSubjects()` | pobranie przedmiotów z tooltipa |
| `getSchoolMedalValue()` | odczyt aktualnego medalu UI |
| `searchSchoolById()` | wyszukanie szkoły po ID |
| `searchSchoolsByMedal()` | filtr jednego medalu |
| `searchSchoolsByMedals()` | multiselect |
| `searchSchoolsByMedalsWithApi()` | filtrowanie + przechwycenie API |
| `expectSchoolResultsMedals()` | walidacja medali w tabeli |
| `prepareSchoolSearchByIdAndMedal()` | scenariusze ID + medal |
| `openSchoolHistory()` | otwarcie historii |
| `medalHistoryRows()` | wszystkie wiersze historii medalu |
| `medalHistoryRowByValue()` | konkretny wpis historii |
| `historyValueCell()` | kolumna Wartość |
| `historyAuthorCell()` | kolumna Autor |
| `historySourceCell()` | kolumna Źródło |
| `historyDateCell()` | kolumna Data |
| `getLatestMedalHistoryValue()` | najnowszy sezon |
| `getSchoolMedalApiData()` | medal i przedmioty z API |
| `expectMedalMatchesSubjectCount()` | walidacja progu medalowego |
| `expectUniqueMedalSubjects()` | brak duplikatów |
| `schoolTeachersBySubject()` | nauczyciele danego przedmioto-poziomu |

---

## 17. Roczne przeliczenie medalowości — zasada działania

Zmiana danych nauczyciela **nie powoduje natychmiastowej zmiany medalowości szkoły**.

Potwierdzony ręcznie scenariusz:

```text
szkoła ma Brak
↓
nauczyciel otrzymuje przedmiot, np. Matematyka / SP
↓
dodane zostaje aktywne potwierdzenie klubowe
↓
nauczyciel staje się „Nasz”
↓
przedmiot na widoku szkoły jest oznaczony na zielono
↓
medal szkoły nadal pozostaje bez zmian
subjectNames nadal odpowiada poprzedniemu przeliczeniu
```

To jest oczekiwane zachowanie.

Medalowość jest przeliczana w procesie rocznym. Z punktu widzenia testów najważniejszy jest proces wykonywany **1 października**. Dlatego niepoprawny byłby test:

```text
dodaj potwierdzenie
→ natychmiast oczekuj zmiany medalu
```

Poprawne podejście polega na rozdzieleniu testu na dwa etapy:

```text
PRZED PROCESEM ROCZNYM
→ odczytaj aktualny stan nauczycieli i przedmiotów
→ samodzielnie wylicz oczekiwany medal
→ zapisz snapshot

PO PROCESIE ROCZNYM
→ odczytaj medal wygenerowany przez Octopusa
→ porównaj go z wcześniej zapisanym expectedMedal
```

---

## 18. Medalowość dotyczy wszystkich szkół

Roczny test nie ogranicza się do szkół podstawowych.

Poprawnymi kandydatami są m.in.:
- szkoły podstawowe,
- licea,
- technika,
- przedszkola,
- filie oraz inne typy instytucji zwracane przez wyszukiwarkę szkół.

Dlatego w snapshotach mogą występować zarówno przedmioto-poziomy `SP`, jak i `SŚ`, np.:

```text
MAT SP
JPL SP
HIS SP

MAT SŚ
JPL SŚ
HIS SŚ
```

Brak przedmiotów kwalifikowanych jest również poprawnym przypadkiem i powinien prowadzić do `Brak`.

Nie filtrujemy kandydatów na podstawie typu placówki ani poziomu szkoły.

---

## 19. Jak rozpoznajemy przedmiot kwalifikowany do kolejnego przeliczenia

Źródłem stanu wejściowego jest tabela **Nauczyciele** na panelu szkoły.

W kolumnie:

```text
Przedmioty w tej szkole
```

każdy przedmioto-poziom renderowany jest jako osobny element `.subject`.

Przedmiot, dla którego nauczyciel jest „Nasz”, otrzymuje klasę:

```html
class="subject green-background"
```

Przykład:

```html
<div class="subject green-background">HIS SP;</div>
<div class="subject green-background">FIZ SP;</div>
<div class="subject green-background">PRZ SP</div>
```

W jednym wierszu może znajdować się kilka przedmiotów, dlatego test nie może szukać całej komórki z `exact: true`. Każdy element `.subject` analizowany jest oddzielnie.

### Nauczyciel wspomagający

Sam zielony kolor nie wystarcza do zaliczenia przedmiotu.

Nauczyciel może mieć zielony przedmiot, a jednocześnie w kolumnie **Funkcja** mieć:

```text
Nauczyciel wspomagający
```

Taki nauczyciel jest wykluczany z kalkulacji medalowości.

Potwierdza to również odpowiedź `GetTeacherClubs`, gdzie formularz wspomagający ma:

```json
"isSupporting": true
```

W praktycznym kalkulatorze rocznym przyjmujemy więc:

```text
.subject.green-background
+
brak funkcji "Nauczyciel wspomagający"
=
przedmioto-poziom kwalifikowany
```

### Duplikaty

Jeżeli kilku nauczycieli kwalifikuje ten sam przedmioto-poziom, liczymy go tylko raz.

Przykład:

```text
MAT SP
MAT SP
MAT SP
```

po deduplikacji daje:

```text
MAT SP
```

---

## 20. Algorytm wyliczania expectedMedal

Helper `getExpectedAnnualMedal()` wykonuje następujące kroki:

1. Otwiera/analizuje zakładkę `Nauczyciele` bieżącej szkoły.
2. Pobiera wszystkie elementy `.subject` z kolumny `Przedmioty w tej szkole`.
3. Zostawia tylko elementy posiadające klasę `green-background`.
4. Odrzuca wiersze, których kolumna `Funkcja` zawiera `Nauczyciel wspomagający`.
5. Pobiera symbole przedmioto-poziomów, np. `MAT SP`, `JPL SŚ`.
6. Usuwa duplikaty.
7. Sortuje wynik, aby snapshot był stabilny i czytelny.
8. Wylicza oczekiwany medal zgodnie z liczbą unikalnych przedmioto-poziomów.

Reguła:

| Liczba unikalnych kwalifikowanych przedmioto-poziomów | `expectedMedal` |
|---:|---|
| 0 | Brak |
| 1 | Brąz |
| 2 | Srebro |
| 3 lub więcej | Złoto |

Przykład:

```text
[
  "EW SP",
  "FIZ SP",
  "HIS SP",
  "JPL SP",
  "MAT SP",
  "PRZ SP"
]
```

daje:

```text
expectedMedal = Złoto
```

---

## 21. Pliki związane z testem rocznym

Osobny plik testowy:

```text
tests/szkola-medalowosc-annual.spec.ts
```

Helpery roczne:

```text
tests/support/school-medal-annual.ts
```

Snapshot danych wejściowych:

```text
tests/data/medalowosc-annual-2026.json
```

Tag testów rocznych:

```text
@annual-medal
```

Najważniejsze helpery roczne:

| Helper | Odpowiedzialność |
|---|---|
| `getAnnualMedalTeacherRows()` | diagnostyczny odczyt wierszy tabeli nauczycieli |
| `getAnnualMedalTeacherSubjects()` | odczyt pojedynczych `.subject`, koloru i funkcji nauczyciela |
| `getExpectedAnnualMedal()` | wyliczenie kwalifikowanych przedmioto-poziomów i oczekiwanego medalu |
| `buildAnnualMedalSnapshot()` | przygotowanie danych dla czterech szkół referencyjnych |
| `getRandomAnnualMedalCandidates()` | pobranie i losowanie kandydatów z Warszawy |
| `buildRandomAnnualMedalSnapshot()` | wyliczenie danych dla 50 losowych szkół |
| `loadAnnualMedalSnapshot()` | wczytanie zachowanego snapshotu po procesie rocznym |

---

## 22. PREP-01 – PREP-08 — przebieg przygotowania rozwiązania

Testy `PREP-*` służą do przygotowania i zweryfikowania danych wejściowych. Nie wszystkie muszą być uruchamiane 30 września.

### MED-YEAR-PREP-01 — diagnostyka tabeli nauczycieli

Cel:
- sprawdzenie struktury DOM tabeli,
- odczyt ID nauczyciela,
- odczyt `Przedmioty w tej szkole`,
- odczyt `Funkcja`,
- znalezienie technicznego oznaczenia zielonego przedmiotu.

Wynik diagnostyki potwierdził, że zielony przedmiot ma:

```html
subject green-background
```

### MED-YEAR-PREP-02 — zielone przedmioty vs aktualny medal

Cel:
- pobranie wszystkich zielonych przedmiotów,
- wykluczenie nauczycieli wspomagających,
- porównanie z aktualnym stanem medalowości.

Ten test potwierdził istotną różnicę:

```text
aktualne zielone przedmioty
≠
koniecznie aktualne subjectNames medalu
```

Jest to poprawne, ponieważ medal pochodzi z poprzedniego procesu rocznego.

### MED-YEAR-PREP-03 — oczekiwany medal dla szkoły referencyjnej Złoto

Szkoła `57616`:

```text
kwalifikowane:
EW SP
FIZ SP
HIS SP
JPL SP
MAT SP
PRZ SP

wykluczony wspomagający:
342492

expectedMedal:
Złoto
```

### MED-YEAR-PREP-04 — przypadek Srebro → Złoto

Szkoła `85263`:

```text
currentMedal = Srebro
currentSubjectNames = Matematyka, Geografia

aktualny stan wejściowy:
GEO SP
JPL SP
MAT SP

expectedMedal = Złoto
```

### MED-YEAR-PREP-05 — przypadek Brąz → Srebro

Szkoła `66109`:

```text
currentMedal = Brąz
currentSubjectNames = Matematyka

aktualny stan wejściowy:
GEO SP
MAT SP

expectedMedal = Srebro
```

### MED-YEAR-PREP-06 — przypadek Brak → Brak

Szkoła `92928`:

```text
currentMedal = Brak
qualifyingSubjectLevels = []
expectedMedal = Brak
```

### MED-YEAR-PREP-07 — pierwszy snapshot czterech szkół

PREP-07 zapisuje snapshot tylko dla czterech szkół referencyjnych.

Był etapem przejściowym. Do właściwego procesu 30 września używamy rozszerzonego **PREP-08**.

### MED-YEAR-PREP-08 — właściwy snapshot roczny

PREP-08 przygotowuje:

```text
4 szkoły referencyjne
+
50 losowych szkół
=
54 szkoły
```

To właśnie **PREP-08 jest testem, który należy uruchomić 30 września przed procesem rocznym**.

---

## 23. Cztery szkoły referencyjne w teście rocznym

Stałe przypadki gwarantują powtarzalne scenariusze niezależnie od losowania:

| ID | Szkoła | Stan przy przygotowaniu | Oczekiwany wynik przy aktualnym stanie wejściowym |
|---:|---|---|---|
| `57616` | Szkoła Podstawowa nr 5 | Złoto | Złoto |
| `85263` | Szkoła Podstawowa nr 379 | Srebro | Złoto |
| `66109` | Szkoła Podstawowa w Raszkowie | Brąz | Srebro |
| `92928` | Szkoła Podstawowa nr 403 | Brak | Brak |

Wartości `expectedMedal` są każdorazowo wyliczane ze stanu nauczycieli przy tworzeniu snapshotu. Powyższa tabela dokumentuje wynik z etapu przygotowawczego, ale **finalną prawdą dla testu 1 października jest JSON wygenerowany 30 września**.

---

## 24. Losowanie 50 dodatkowych szkół

Losowe szkoły nie zastępują czterech szkół referencyjnych — są dodatkową warstwą pokrycia.

### Źródło kandydatów

PREP-08 otwiera normalną wyszukiwarkę szkół i ustawia:

```text
Miasto/poczta = warszawa
```

Octopus generuje request:

```http
GET /api/InstitutionBrowser/GetInstitutions
```

z `filterModel` zawierającym m.in.:

```json
{
  "cityPost": "warszawa",
  "isSuspended": false,
  "page": 1,
  "limit": 100
}
```

`userId` nie jest hardkodowany. Request jest wykonywany przez UI, a test przechwytuje odpowiedź aplikacji.

### Dlaczego Warszawa

W bazie dev znajduje się dużo szkół automatycznie tworzonych przez inne testy. Ich nazwy zaczynają się od:

```text
REG_
REG_SHARED_
```

Przy wyszukiwaniu bez ograniczenia pierwsza pula 100 szkół była niemal w całości zanieczyszczona takimi rekordami.

Ograniczenie do Warszawy pozwala pobrać dużą pulę rzeczywistych istniejących placówek i jednocześnie ominąć większość danych generowanych przez automaty.

### Dodatkowe zabezpieczenia

Niezależnie od filtra `cityPost`, kandydat jest odrzucany, jeżeli:

```text
nazwa zaczyna się od REG_
```

Porównanie jest wykonywane bez rozróżniania wielkości liter.

Odrzucamy również:
- cztery szkoły referencyjne, aby nie było duplikatów,
- rekord bez poprawnego ID,
- rekord spoza Warszawy,
- rekord z nieobsługiwaną wartością medalu.

### Losowanie

Po odfiltrowaniu kandydatów wykonywane jest tasowanie Fisher-Yates, a następnie wybierane jest pierwszych 50 rekordów.

Losowanie odbywa się **tylko podczas tworzenia snapshotu**.

1 października **nie losujemy szkół ponownie**.

---

## 25. Przykładowy wynik PREP-08 z 22 września 2026

Przykładowy przebieg przygotowawczy zwrócił:

```text
API zwróciło 100 rekordów dla Warszawy
poprawna pula po filtrach: 99
wylosowano: 50
```

Po połączeniu z czterema szkołami referencyjnymi snapshot zawierał:

```text
54 szkoły
```

Przykładowy rozkład oczekiwanych medali:

```text
Złoto:  6
Srebro: 5
Brąz: 13
Brak:  30
```

Przykładowe przejścia:

```text
Złoto  → Złoto:  1
Srebro → Złoto:  1
Brąz   → Srebro: 1
Brąz   → Brąz:   1
Brak   → Brak:  30
Brak   → Brąz:  12
Brak   → Srebro: 4
Brak   → Złoto:  4
```

Te wartości są jedynie wynikiem konkretnego losowania z 22 września. Nie należy ich traktować jako oczekiwanego wyniku procesu 1 października.

Oczekiwane wartości dla właściwego testu po procesie pochodzą wyłącznie z finalnego snapshotu wygenerowanego 30 września.

---

## 26. Struktura snapshotu

Plik:

```text
tests/data/medalowosc-annual-2026.json
```

ma strukturę zbliżoną do:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-30T...Z",
  "targetProcessDate": "2026-10-01",
  "selection": {
    "referenceSchoolCount": 4,
    "randomSchoolCount": 50,
    "totalSchoolCount": 54,
    "randomSelection": true
  },
  "schools": [
    {
      "school": {
        "id": "66109",
        "name": "Szkoła Podstawowa w Raszkowie",
        "city": "Raszków"
      },
      "currentMedal": "Brąz",
      "currentSubjectNames": [
        "Matematyka"
      ],
      "qualifyingSubjectLevels": [
        "GEO SP",
        "MAT SP"
      ],
      "expectedMedal": "Srebro",
      "supportingTeachersExcluded": []
    }
  ]
}
```

### Znaczenie pól

`currentMedal`
: medal zapisany w Octopusie **przed procesem rocznym**. Może pochodzić z poprzedniego przeliczenia i nie musi odpowiadać aktualnemu stanowi nauczycieli.

`currentSubjectNames`
: przedmioty aktualnie przypisane do istniejącego medalu przez `informationAboutMedalCategory.subjectNames`.

`qualifyingSubjectLevels`
: aktualny stan wejściowy wyliczony z tabeli nauczycieli, np. `MAT SP`, `JPL SŚ`.

`expectedMedal`
: medal, który proces 1 października powinien wyliczyć na podstawie `qualifyingSubjectLevels`.

`supportingTeachersExcluded`
: ID nauczycieli wspomagających, których zielone przedmioty zostały wykluczone z kalkulacji.

---

## 27. Najważniejsza zasada: snapshot musi być zamrożony przed jobem

Snapshot pełni rolę danych oczekiwanych.

Jeżeli zostanie nadpisany po wykonaniu procesu rocznego, test traci sens, ponieważ stan wejściowy i wynik procesu zaczną pochodzić z tego samego momentu.

Dlatego obowiązuje zasada:

```text
30 września
→ generujemy FINALNY snapshot
→ od tej chwili NIE uruchamiamy PREP-08 ponownie

1 października
→ tylko odczytujemy zapisany snapshot
→ porównujemy go z wynikiem joba
```

Zalecane jest zachowanie kopii finalnego JSON-a, np. przez commit w repozytorium lub skopiowanie pliku w bezpieczne miejsce.

---

## 28. Harmonogram wykonania testu rocznego — co, kiedy i jak

### Etap A — przygotowanie rozwiązania, przed 30 września

Cel: upewnić się, że helpery działają poprawnie.

Można uruchamiać PREP-01 – PREP-08 dowolnie wiele razy.

Najważniejszy test kontrolny:

```powershell
npx playwright test tests/szkola-medalowosc-annual.spec.ts --grep "PREP-08"
```

Oczekiwany rezultat:

```text
4 szkoły referencyjne
50 losowych szkół z Warszawy
54 szkoły w snapshotcie
```

Snapshot wygenerowany na tym etapie jest tylko techniczny i może zostać później nadpisany.

### Etap B — 30 września: wygenerowanie FINALNEGO snapshotu

PREP-08 należy uruchomić **30 września po zakończeniu planowanych zmian danych, ale przed nocnym resetem/procesem rocznym**.

Uruchom:

```powershell
npx playwright test tests/szkola-medalowosc-annual.spec.ts --grep "PREP-08"
```

Po zakończeniu sprawdź log:

```text
snapshot zapisany: tests/data/medalowosc-annual-2026.json
zapisano 54 szkół: 4 referencyjne + 50 losowych
```

Następnie sprawdź plik:

```text
tests/data/medalowosc-annual-2026.json
```

Kontrola minimalna:

```text
schemaVersion = 1
targetProcessDate = 2026-10-01
selection.referenceSchoolCount = 4
selection.randomSchoolCount = 50
selection.totalSchoolCount = 54
schools.length = 54
```

Dodatkowo sprawdź, czy:
- nie ma duplikatów ID,
- nie ma szkół `REG_*`,
- wszystkie losowe szkoły mają `city = Warszawa`,
- dla każdej szkoły istnieje `expectedMedal`,
- `qualifyingSubjectLevels` jest tablicą,
- snapshot nie jest pusty.

**Po tej kontroli snapshot uznajemy za zamrożony.**

### Etap C — od momentu zamrożenia do wykonania joba

Nie uruchamiaj:

```text
MED-YEAR-PREP-08
```

Nie nadpisuj:

```text
tests/data/medalowosc-annual-2026.json
```

Nie należy też celowo zmieniać danych nauczycieli/formularzy w szkołach zapisanych w snapshotcie.

Jeżeli ktoś zmieni dane wejściowe po zamrożeniu snapshotu, wynik 1 października może różnić się od oczekiwanego nie z powodu błędu procesu, tylko z powodu zmiany danych między snapshotem a jobem.

### Etap D — 1 października po wykonaniu procesu rocznego

Najpierw upewnij się, że proces roczny został wykonany.

Następnie uruchom:

```powershell
npx playwright test tests/szkola-medalowosc-annual.spec.ts --grep "MED-YEAR-01"
```

**Nie uruchamiaj wcześniej PREP-08.**

`MED-YEAR-01` wczyta istniejący JSON i przejdzie po wszystkich 54 szkołach.

Dla każdej szkoły porówna:

```text
expectedMedal ze snapshotu
vs
medalCategoryName zwrócony po jobie przez GetInstitutions
```

Przykład logu:

```text
MED-YEAR-01: 17/54 66109 "Szkoła Podstawowa w Raszkowie":
przed jobem=Brąz,
oczekiwany=Srebro,
faktyczny=Srebro
```

### Etap E — po teście

Jeżeli wszystkie 54 porównania przejdą:

```text
proces roczny poprawnie ustawił kategorie medali dla badanego zbioru
```

Jeżeli test się wywali, zapisz dla błędnej szkoły:
- ID,
- nazwę,
- `currentMedal`,
- `qualifyingSubjectLevels`,
- `expectedMedal`,
- faktyczny medal po jobie,
- ewentualnie aktualny `subjectNames`,
- dane nauczycieli z panelu szkoły.

Nie regeneruj snapshotu w celu „naprawienia” niezgodności.

---

## 29. MED-YEAR-01 — właściwy test po procesie

`MED-YEAR-01` jest testem porównującym wynik joba z wcześniej zamrożonym stanem wejściowym.

Schemat:

```text
loadAnnualMedalSnapshot()
↓
54 zapisane szkoły
↓
getSchoolMedalApiData(school)
↓
medalCategoryName po jobie
↓
expect(actual).toBe(expectedMedal)
```

Test nie wylicza ponownie `expectedMedal` 1 października.

To celowe — oczekiwany rezultat musi pochodzić ze stanu **sprzed joba**.

Test ma zwiększony timeout:

```ts
test.setTimeout(10 * 60 * 1000);
```

ponieważ sprawdza kilkadziesiąt szkół i dla każdej otwiera panel / oczekuje na odpowiedź API.

Przed `targetProcessDate` test jest automatycznie pomijany (`skipped`).

Dla snapshotu 2026:

```text
targetProcessDate = 2026-10-01
```

---

## 30. Interpretacja wyników MED-YEAR-01

### PASS

Przykład:

```text
currentMedal = Brąz
expectedMedal = Srebro
actualMedal = Srebro
```

Proces poprawnie przeliczył medal.

### FAIL — medal pozostał stary

Przykład:

```text
currentMedal = Brąz
expectedMedal = Srebro
actualMedal = Brąz
```

Możliwe kierunki analizy:
- job nie objął szkoły,
- job się nie wykonał,
- dane wejściowe procesu różnią się od reguły użytej przez test,
- dane szkoły zmieniły się po wygenerowaniu snapshotu,
- istnieje dodatkowa reguła biznesowa nieuwzględniona przez helper.

### FAIL — inny nowy medal

Przykład:

```text
currentMedal = Brak
expectedMedal = Złoto
actualMedal = Srebro
```

Należy porównać:
- zielone przedmioto-poziomy przed jobem,
- nauczycieli wspomagających,
- aktualny `subjectNames`,
- dane formularzy klubowych,
- ewentualne zmiany wprowadzone między snapshotem a procesem.

### Uwaga

Nie należy automatycznie uznawać każdego FAIL-a za błąd aplikacji. Najpierw trzeba wykluczyć zmianę danych wejściowych po zamrożeniu snapshotu.

---

## 31. Diagnostyka PREP-08

PREP-08 powinien logować co najmniej:

```text
filterModel wyszukiwania Warszawy
liczbę rekordów zwróconych przez API
liczbę kandydatów po filtrach
liczbę pominiętych REG_*
liczbę pominiętych szkół referencyjnych
każdą analizowaną szkołę
currentMedal → expectedMedal
qualifyingSubjectLevels
rozkład expectedMedal
rozkład przejść currentMedal → expectedMedal
ścieżkę zapisanego snapshotu
```

Przykład:

```text
PREP-08: API zwróciło 100 rekordów dla Warszawy
PREP-08: poprawna pula Warszawa: 99
PREP-08: pominięto: REG_*=0, inne miasto=0, referencyjne=1, niepoprawny medal=0
```

Takie logi pozwalają szybko wykryć zmianę zachowania wyszukiwarki lub danych środowiska.

---

## 32. Diagnostyka MED-YEAR-01

Dla każdej szkoły powinien być widoczny log w formacie:

```text
ID + nazwa
currentMedal
expectedMedal
actualMedal
```

Przykład:

```text
85263 "Szkoła Podstawowa nr 379":
Srebro → oczekiwany Złoto → faktyczny Złoto
```

Dzięki temu przy awarii od razu wiadomo:
- która szkoła nie przeszła,
- czy oczekiwaliśmy zmiany,
- jaka była wartość przed procesem,
- jaki wynik zwrócił proces.

---

## 33. Czego NIE robić przy teście rocznym

Nie należy:

1. Tworzyć nowych szkół specjalnie do testu rocznego.
2. Opierać testu wyłącznie na szkołach `REG_*` generowanych przez automaty.
3. Losować nowego zestawu szkół 1 października.
4. Uruchamiać PREP-08 po jobie przed MED-YEAR-01.
5. Nadpisywać finalnego JSON-a z 30 września.
6. Zakładać, że `currentMedal` musi być równy `expectedMedal` przed jobem.
7. Zakładać, że każdy zielony przedmiot liczy się do medalu bez sprawdzenia funkcji nauczyciela.
8. Liczyć nauczyciela wspomagającego.
9. Liczyć ten sam przedmioto-poziom wielokrotnie.
10. Ograniczać test tylko do szkół podstawowych.
11. Hardkodować `userId` w `filterModel`.
12. Traktować brak natychmiastowej zmiany medalu po edycji nauczyciela jako błąd.

---

## 34. Ograniczenia testu rocznego

Obecne rozwiązanie nie steruje samym jobem.

Test:
- nie uruchamia procesu rocznego,
- nie zmienia daty systemowej,
- nie używa fake date,
- nie ma endpointu typu `recalculate`,
- nie wymusza przeliczenia pojedynczej szkoły.

Dlatego MED-YEAR-01 należy uruchomić dopiero po potwierdzeniu, że proces roczny faktycznie się wykonał.

Najważniejszym ryzykiem jest zmiana danych między finalnym snapshotem a jobem. Im krótszy okres między zamrożeniem danych 30 września a wykonaniem procesu, tym wiarygodniejszy wynik.

---

## 35. Checklista — 30 września

Przed uruchomieniem:

```text
[ ] Kod testów jest aktualny
[ ] Logowanie do Octopusa działa
[ ] PREP-08 przechodzi technicznie
[ ] tests/data/ istnieje lub może zostać utworzone
[ ] nikt nie planuje już zmian danych w wybranych szkołach przed jobem
```

Uruchom:

```powershell
npx playwright test tests/szkola-medalowosc-annual.spec.ts --grep "PREP-08"
```

Po uruchomieniu:

```text
[ ] Test zakończył się PASS
[ ] Snapshot zawiera 54 szkoły
[ ] Są 4 szkoły referencyjne
[ ] Jest 50 losowych szkół
[ ] Losowe szkoły są z Warszawy
[ ] Brak nazw REG_*
[ ] Brak duplikatów ID
[ ] targetProcessDate = 2026-10-01
[ ] Każda szkoła ma expectedMedal
[ ] Snapshot został zabezpieczony przed nadpisaniem
```

---

## 36. Checklista — 1 października

Przed testem:

```text
[ ] Potwierdzono wykonanie procesu rocznego
[ ] Finalny JSON z 30 września nadal istnieje i nie został nadpisany
[ ] NIE uruchomiono ponownie PREP-08
```

Uruchom:

```powershell
npx playwright test tests/szkola-medalowosc-annual.spec.ts --grep "MED-YEAR-01"
```

Po teście:

```text
[ ] Wszystkie 54 szkoły zostały sprawdzone
[ ] Każdy actualMedal = expectedMedal
[ ] Ewentualne błędy mają zapisane ID szkoły i pełną diagnostykę
```

Jeżeli test nie przejdzie:

```text
[ ] Nie regeneruj snapshotu
[ ] Sprawdź, czy dane szkoły nie zmieniły się po 30 września
[ ] Sprawdź kwalifikowane przedmioty i nauczycieli wspomagających
[ ] Sprawdź actual subjectNames
[ ] Sprawdź wykonanie joba
[ ] Dopiero potem zgłaszaj błąd aplikacji
```

---

## 37. Docelowy przebieg rocznego testu — skrót

```text
22–29 września
    ↓
rozwój i próby PREP-01..PREP-08
    ↓
30 września, przed nocnym procesem
    ↓
URUCHOM PREP-08
    ↓
4 referencyjne + 50 losowych z Warszawy
    ↓
wylicz qualifyingSubjectLevels
    ↓
wylicz expectedMedal
    ↓
zapisz FINALNY medalowosc-annual-2026.json
    ↓
NIE NADPISUJ PLIKU
    ↓
1 października po wykonaniu joba
    ↓
URUCHOM MED-YEAR-01
    ↓
54 × expectedMedal vs actual medalCategoryName
    ↓
PASS / analiza niezgodności
```

---

## 38. Ogólny przepływ testów medalowości

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
                             │
                             ▼
                   Proces roczny 1 października
                             │
                ┌────────────┴────────────┐
                │                         │
         snapshot 30.09              wynik joba 01.10
                │                         │
                └────────────┬────────────┘
                             ▼
                 expectedMedal = actualMedal
```

---

## 39. Stan obecny

Standardowa regresja medalowości obejmuje testy **MED-01 – MED-60**.

Osobno przygotowany jest roczny workflow `@annual-medal`, który pozwala zweryfikować rzeczywisty proces 1 października bez tworzenia sztucznych szkół i bez ręcznego przeliczania każdej placówki.

Na obecnym etapie:
- PREP-08 poprawnie buduje snapshot 54 szkół,
- kandydaci losowi pobierani są z Warszawy,
- `REG_*` są wykluczane,
- wszystkie typy szkół są dozwolone,
- kalkulator uwzględnia zielone przedmioty, duplikaty i nauczycieli wspomagających,
- `MED-YEAR-01` jest przygotowany do porównania finalnego snapshotu z wynikiem procesu po 1 października,
- sam job nadal pozostaje zewnętrznym procesem i nie jest uruchamiany przez test.

