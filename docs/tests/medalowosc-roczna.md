# Medalowość roczna — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcja `MED-YEAR-*` opisuje testy rocznego przeliczenia medalowości szkół wykonywanego 1 października. Testy nie sprawdzają wyłącznie aktualnego stanu medalu — przed jobem samodzielnie wyliczają oczekiwany wynik na podstawie danych nauczycieli i klubowiczostwa na docelowy rok szkolny, zapisują snapshot, a po jobie porównują go z faktycznym medalem zwracanym przez Octopusa.

Standardowa regresja aktualnej medalowości (`MED-01` – `MED-60`) jest opisana osobno w [medalowosc-szkoly.md](medalowosc-szkoly.md).

## 2. Pliki i powiązane dokumenty

Główny plik testowy:

```text
tests/szkola-medalowosc-annual.spec.ts
```

Helpery roczne:

```text
tests/support/school-medal-annual.ts
```

Snapshoty środowiskowe:

```text
tests/data/medalowosc-annual-2026-dev.json
tests/data/medalowosc-annual-2026-test.json
```

Tag testów rocznych:

```text
@annual-medal
```

Powiązane dokumenty:

- [Medalowość szkoły](medalowosc-szkoly.md) — aktualny medal, UI, API, historia i reguły `MED-*`.
- [Klubowiczostwo nauczyciela](klubowiczostwo-nauczyciela.md) — formularze klubowe i potwierdzenia używane przy kwalifikacji na przyszły rok.
- [Indeks scenariuszy](scenario-index.md) — generowana lista testów.

---

## 3. Zasada działania

Zmiana danych nauczyciela **nie powoduje natychmiastowej zmiany medalowości szkoły**. Medal jest aktualizowany przez proces roczny wykonywany 1 października.

Poprawny workflow testowy jest dwuetapowy:

```text
PRZED PROCESEM ROCZNYM
-> odczytaj aktualny stan nauczycieli
-> uwzględnij klubowiczostwo na przyszły rok szkolny
-> samodzielnie wylicz expectedMedal
-> zapisz snapshot właściwy dla DEV albo TEST

PO PROCESIE ROCZNYM
-> wczytaj wcześniej zamrożony snapshot dla tego samego środowiska
-> pobierz medal po jobie
-> porównaj actualMedal z expectedMedal
```

W głównym pliku rocznym pozostają dwa docelowe testy:

```text
MED-YEAR-PREP
MED-YEAR-01
```

`MED-YEAR-PREP` zastępuje wcześniejszą nazwę `MED-YEAR-PREP-08`. Testy PREP-01 – PREP-07 były etapami diagnostycznymi podczas budowania rozwiązania i nie są potrzebne w docelowym workflow.

---

## 4. Docelowa data procesu i rok szkolny

Data procesu jest zdefiniowana w helperze:

```ts
ANNUAL_MEDAL_TARGET_PROCESS_DATE = "2026-10-01";
```

Z daty procesu wyliczany jest docelowy rok szkolny:

```text
2026-10-01
->
2026/2027
```

To właśnie klubowiczostwo na **2026/2027** decyduje, czy zielony przedmiot nauczyciela może wpłynąć na medal liczony 1 października 2026.

---

## 5. Jak rozpoznajemy przedmiot kwalifikowany

Źródłem pierwszego etapu jest tabela **Nauczyciele** na panelu szkoły. W kolumnie `Przedmioty w tej szkole` każdy przedmioto-poziom jest osobnym elementem `.subject`. Zielony przedmiot ma klasę:

```html
class="subject green-background"
```

Sam zielony kolor nie wystarcza. Przedmiot kwalifikuje się dopiero wtedy, gdy jednocześnie:

1. jest zielony (`green-background`),
2. nauczyciel nie ma funkcji `Nauczyciel wspomagający`,
3. nauczyciel ma powiązanie z tą samą szkołą dla tego samego przedmioto-poziomu,
4. powiązanie dotyczy docelowego roku szkolnego, np. `2026/2027`.

W praktyce sprawdzamy więc:

```text
zielony przedmiot
+
nie jest nauczycielem wspomagającym
+
ten sam schoolId
+
ten sam subjectLevel
+
targetSchoolYear
=
kwalifikowany przedmioto-poziom
```

Jeżeli kilku nauczycieli kwalifikuje ten sam przedmioto-poziom, liczymy go tylko raz.

---

## 6. Rezygnacja z klubowiczostwa na przyszły rok

To ważny przypadek, który musi być uwzględniony w kalkulatorze rocznym. Nauczyciel może mieć obecnie zielony przedmiot, ale nie mieć przedłużonego klubowiczostwa na przyszły rok. Taki przedmiot **nie może** zwiększać `expectedMedal`.

Przykład: szkoła `91970` — Szkoła Podstawowa nr 396.

Stan wejściowy widoczny na panelu szkoły może sugerować:

```text
MAT SP
PRZ SP
```

Jednak dwóch nauczycieli matematyki ma klubowiczostwo tylko do `2025/2026`, natomiast nauczyciel przyrody ma wpis na `2026/2027`. Dlatego poprawny wynik dla procesu 2026 to:

```json
{
  "qualifyingSubjectLevels": ["PRZ SP"],
  "expectedMedal": "Brąz"
}
```

Matematyka powinna zostać odnotowana jako wykluczona z powodu braku klubowiczostwa na `2026/2027`.

---

## 7. Nauczyciel wspomagający

Nauczyciel z zielonym przedmiotem może mieć w kolumnie `Funkcja` wartość:

```text
Nauczyciel wspomagający
```

Taki nauczyciel jest wykluczany niezależnie od klubowiczostwa. Jego ID trafia do:

```text
supportingTeachersExcluded
```

---

## 8. Algorytm `getExpectedAnnualMedal()`

Helper wykonuje następujące kroki:

1. Odczytuje ID aktualnie otwartej szkoły.
2. Wylicza `targetSchoolYear` z `targetProcessDate`.
3. Pobiera zielone przedmioty nauczycieli z panelu szkoły.
4. Wyklucza nauczycieli wspomagających.
5. Grupuje kandydatów po `teacherId`, aby nie otwierać tego samego nauczyciela wielokrotnie.
6. Otwiera panel nauczyciela.
7. Odczytuje tabelę jego szkół i sprawdza dopasowanie `schoolId + subjectLevel + targetSchoolYear`.
8. Przedmiot bez takiego dopasowania trafia do `clubMembershipExcluded`.
9. Kwalifikowane przedmioto-poziomy są deduplikowane i sortowane.
10. Na ich podstawie wyliczany jest `expectedMedal`.

Reguła:

| Liczba unikalnych kwalifikowanych przedmioto-poziomów | `expectedMedal` |
| ----------------------------------------------------: | --------------- |
|                                                     0 | Brak            |
|                                                     1 | Brąz            |
|                                                     2 | Srebro          |
|                                          3 lub więcej | Złoto           |

---

## 9. Weryfikacja panelu nauczyciela

Otwieranie panelu nauczyciela może sporadycznie nie zakończyć się poprawnie. Helper wykonuje do dwóch prób otwarcia panelu.

Jeżeli nauczyciela nadal nie da się zweryfikować, nie wolno automatycznie uznać go za osobę bez klubowiczostwa. Dla losowych szkół pomijana jest wtedy **cała szkoła**, a test pobiera kolejnego kandydata z puli rezerwowej.

Dzięki temu błąd techniczny panelu nauczyciela nie zaniża sztucznie `expectedMedal`.

---

## 10. Losowanie szkół i pula rezerwowa

`MED-YEAR-PREP` buduje snapshot z:

```text
4 szkoły referencyjne
+
50 poprawnie zweryfikowanych szkół losowych z Warszawy
=
54 szkoły
```

Źródłem kandydatów jest wyszukiwarka szkół z:

```text
Miasto/poczta = warszawa
```

Odrzucane są m.in.:

- szkoły referencyjne,
- rekordy `REG_*`,
- rekordy bez poprawnego ID,
- rekordy spoza Warszawy,
- rekordy z nieobsługiwaną wartością medalu.

Po tasowaniu pobierane jest 50 szkół oraz do 20 kandydatów rezerwowych. Jeżeli którejś losowej szkoły nie można rzetelnie przeanalizować z powodu problemu z panelem nauczyciela, jest ona pomijana i zastępowana kolejną szkołą z rezerwy.

Finalny snapshot nadal musi zawierać dokładnie 50 losowych szkół.

---

## 11. Pliki DEV i TEST

Snapshoty są rozdzielone per środowisko:

```text
tests/data/medalowosc-annual-2026-dev.json
tests/data/medalowosc-annual-2026-test.json
```

Ścieżka jest budowana na podstawie `OCTOPUS_ENV`.

```text
DEV  -> medalowosc-annual-2026-dev.json
TEST -> medalowosc-annual-2026-test.json
```

Dzięki temu uruchomienie `MED-YEAR-PREP` na TEST nie nadpisuje snapshotu DEV i odwrotnie. `MED-YEAR-01` zawsze wczytuje plik odpowiadający aktualnie uruchomionej konfiguracji Playwrighta.

---

## 12. Struktura snapshotu

Przykładowy wpis po nowych zmianach:

```json
{
  "school": {
    "id": "91970",
    "name": "Szkoła Podstawowa nr 396",
    "city": "Warszawa"
  },
  "currentMedal": "Brąz",
  "currentSubjectNames": ["Matematyka"],
  "qualifyingSubjectLevels": ["PRZ SP"],
  "expectedMedal": "Brąz",
  "supportingTeachersExcluded": [],
  "clubMembershipExcluded": [
    {
      "teacherId": "171449",
      "subjectLevel": "MAT SP",
      "targetSchoolYear": "2026/2027",
      "reason": "Brak klubowiczostwa dla MAT SP w roku szkolnym 2026/2027"
    },
    {
      "teacherId": "523035",
      "subjectLevel": "MAT SP",
      "targetSchoolYear": "2026/2027",
      "reason": "Brak klubowiczostwa dla MAT SP w roku szkolnym 2026/2027"
    }
  ],
  "targetSchoolYear": "2026/2027"
}
```

Znaczenie pól:

`currentMedal`
: medal zapisany przed procesem rocznym.

`currentSubjectNames`
: przedmioty aktualnie zapisane przy istniejącym medalu przez API.

`qualifyingSubjectLevels`
: unikalne przedmioto-poziomy, które spełniają wszystkie warunki dla docelowego roku szkolnego.

`expectedMedal`
: medal oczekiwany po jobie.

`supportingTeachersExcluded`
: ID nauczycieli wspomagających pominiętych w kalkulacji.

`clubMembershipExcluded`
: przedmioty nauczycieli pominięte z powodu braku klubowiczostwa dla docelowego roku szkolnego.

`targetSchoolYear`
: rok szkolny wyliczony z `targetProcessDate`.

---

## 13. Najważniejsza zasada: snapshot zamrażamy przed jobem

```text
30 września
-> uruchom MED-YEAR-PREP osobno na DEV i TEST
-> wygeneruj właściwe snapshoty środowiskowe
-> od tej chwili NIE uruchamiaj MED-YEAR-PREP ponownie

1 października po wykonaniu joba
-> uruchom tylko MED-YEAR-01
-> porównaj wynik z zamrożonym plikiem dla tego samego środowiska
```

Nie regeneruj snapshotu po jobie w celu „naprawienia” niezgodności.

---

## 13.1. Wykluczenie z regularnej regresji

Oba testy roczne mają tag `@annual-medal`. Konfiguracja Playwrighta domyślnie wyklucza ten tag, dlatego poniższe polecenia nie wykonują `MED-YEAR-PREP` ani `MED-YEAR-01`:

```powershell
npm.cmd test
npm.cmd run test:dev
npm.cmd run test:test
npm.cmd run test:workers:2
npm.cmd run test:workers:4
```

Zakres można sprawdzić bez uruchamiania testów:

```powershell
npm.cmd run test:test -- --list
```

Regularna regresja powinna zawierać 171 testów. Pełny katalog zawiera 173 scenariusze, z czego dwa `MED-YEAR-*` należą wyłącznie do workflow rocznego.

Nie ustawiaj globalnie zmiennej `OCTOPUS_INCLUDE_ANNUAL=1`. Jest ona ustawiana tylko na czas jawnego uruchomienia skryptów `test:annual:dev` i `test:annual:test`.

---

## 14. Uruchomienie MED-YEAR-PREP

### DEV

```powershell
npm.cmd run test:annual:dev -- --grep "MED-YEAR-PREP"
```

Oczekiwany plik:

```text
tests/data/medalowosc-annual-2026-dev.json
```

### TEST

```powershell
npm.cmd run test:annual:test -- --grep "MED-YEAR-PREP"
```

Nie uruchamiaj samego `npm.cmd run test:annual:test` bez `--grep`: wykonałoby to kolejno `MED-YEAR-PREP` i `MED-YEAR-01`. Etapy muszą pozostać rozdzielone jobem rocznym.

Oczekiwany plik:

```text
tests/data/medalowosc-annual-2026-test.json
```

Po każdym przebiegu sprawdź:

- `schools.length = 54`,
- 4 szkoły referencyjne,
- 50 losowych szkół,
- brak duplikatów ID,
- brak `REG_*`,
- poprawny `targetProcessDate`,
- `targetSchoolYear`,
- `clubMembershipExcluded`,
- każda szkoła ma `expectedMedal`.

---

## 15. MED-YEAR-01 — właściwy test po procesie

`MED-YEAR-01` nie wylicza oczekiwanego medalu ponownie. Wczytuje zamrożony JSON dla bieżącego środowiska i porównuje:

```text
expectedMedal ze snapshotu
vs
medalCategoryName zwrócony po jobie
```

Przed `targetProcessDate` test jest pomijany.

### DEV

```powershell
npm.cmd run test:annual:dev -- --grep "MED-YEAR-01"
```

### TEST

```powershell
npm.cmd run test:annual:test -- --grep "MED-YEAR-01"
```

---

## 16. Diagnostyka MED-YEAR-PREP

Logi powinny pozwolić odtworzyć decyzję kalkulatora. Przydatne informacje:

```text
ID i nazwa szkoły
targetSchoolYear
currentMedal -> expectedMedal
qualifyingSubjectLevels
supportingTeachersExcluded
clubMembershipExcluded
liczba szkół pominiętych technicznie
ścieżka zapisanego snapshotu
```

Przykład poprawnego wykluczenia:

```text
MAT SP
-> zielony
-> nauczyciel nie jest wspomagający
-> brak wpisu na 2026/2027
-> trafia do clubMembershipExcluded
```

---

## 17. Interpretacja wyników MED-YEAR-01

### PASS

```text
expectedMedal = Brąz
actualMedal = Brąz
```

Proces ustawił oczekiwaną kategorię.

### FAIL

Przy niezgodności sprawdź przede wszystkim:

- czy job został wykonany,
- czy dane szkoły nie zmieniły się po zamrożeniu snapshotu,
- `qualifyingSubjectLevels`,
- `supportingTeachersExcluded`,
- `clubMembershipExcluded`,
- aktualne `subjectNames`,
- klubowiczostwo nauczycieli na `targetSchoolYear`.

Nie każdy FAIL oznacza błąd aplikacji; najpierw trzeba wykluczyć zmianę danych wejściowych po zamrożeniu snapshotu.

---

## 18. Czego NIE robić

Nie należy:

1. Losować nowego zestawu szkół po wykonaniu joba.
2. Uruchamiać `MED-YEAR-PREP` po jobie przed `MED-YEAR-01`.
3. Nadpisywać finalnego snapshotu DEV snapshotem TEST ani odwrotnie.
4. Zakładać, że każdy zielony przedmiot liczy się do medalu.
5. Pomijać kontrolę klubowiczostwa na przyszły rok szkolny.
6. Liczyć nauczyciela wspomagającego.
7. Traktować niedostępnego panelu nauczyciela jako „brak klubowiczostwa”.
8. Liczyć ten sam przedmioto-poziom wielokrotnie.
9. Ograniczać test tylko do szkół podstawowych.
10. Regenerować snapshot w celu ukrycia niezgodności po jobie.

---

## 19. Checklista — 30 września

```text
[ ] npx tsc --noEmit przechodzi
[ ] logowanie DEV działa
[ ] logowanie TEST działa
[ ] MED-YEAR-PREP przechodzi na DEV
[ ] MED-YEAR-PREP przechodzi na TEST
[ ] powstał medalowosc-annual-2026-dev.json
[ ] powstał medalowosc-annual-2026-test.json
[ ] każdy snapshot ma 54 szkoły
[ ] każdy snapshot ma 4 referencyjne + 50 losowych
[ ] brak REG_* i duplikatów ID
[ ] targetProcessDate = 2026-10-01
[ ] targetSchoolYear = 2026/2027
[ ] clubMembershipExcluded wygląda wiarygodnie
[ ] oba snapshoty zostały zabezpieczone przed nadpisaniem
```

---

## 20. Checklista — po jobie 1 października

```text
[ ] potwierdzono wykonanie procesu rocznego
[ ] nie uruchomiono ponownie MED-YEAR-PREP
[ ] snapshot DEV nie został nadpisany
[ ] snapshot TEST nie został nadpisany
[ ] MED-YEAR-01 uruchomiono osobno na DEV
[ ] MED-YEAR-01 uruchomiono osobno na TEST
[ ] każdy actualMedal = expectedMedal albo niezgodność została przeanalizowana
```

---

## 21. Ograniczenia testu rocznego

Test nie uruchamia samego joba i nie zmienia daty systemowej. Nie ma też endpointu wykorzystywanego przez test do wymuszenia przeliczenia pojedynczej szkoły.

Wiarygodność testu zależy od zamrożenia danych wejściowych możliwie krótko przed właściwym procesem i od niezmieniania szkół zapisanych w snapshotach między PREP a jobem.

---

## 22. Docelowy przebieg

```text
przed 30 września
    |
    v
testy techniczne helperów
    |
    v
30 września
    |
    +--> DEV  -> MED-YEAR-PREP -> medalowosc-annual-2026-dev.json
    |
    +--> TEST -> MED-YEAR-PREP -> medalowosc-annual-2026-test.json
    |
    v
NIE NADPISUJ SNAPSHOTÓW
    |
    v
1 października po jobie
    |
    +--> DEV  -> MED-YEAR-01 -> porównanie z DEV JSON
    |
    +--> TEST -> MED-YEAR-01 -> porównanie z TEST JSON
    |
    v
PASS / analiza niezgodności
```

---

## 23. Stan obecny

Standardowa regresja medalowości obejmuje testy **MED-01 – MED-60**.

Roczny workflow `@annual-medal` składa się docelowo z dwóch testów:

```text
MED-YEAR-PREP
MED-YEAR-01
```

Aktualne rozwiązanie:

- działa na DEV i TEST z osobnymi danymi i snapshotami,
- obsługuje krótką i rozbudowaną historię medalowości,
- uwzględnia nauczycieli wspomagających,
- uwzględnia brak klubowiczostwa na docelowy rok szkolny,
- nie traktuje błędu technicznego panelu nauczyciela jako braku klubowiczostwa,
- korzysta z rezerwowych szkół, aby finalnie zebrać 50 poprawnie zweryfikowanych kandydatów,
- porównuje po jobie tylko z wcześniej zamrożonym snapshotem właściwego środowiska.
