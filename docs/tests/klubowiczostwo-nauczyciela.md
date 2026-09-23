# Klubowiczostwo nauczyciela — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcja `CLUB-*` weryfikuje przedmioto-poziomy nauczyciela i formularze klubowe: szkołę, klasy własne i obce, wydawnictwo, trwałość edycji, walidację, anulowanie oraz usunięcie.

## 2. Pliki

```text
tests/zamowienia-klubowiczostwo.spec.ts
tests/support/club.ts
tests/support/scenario.ts
```

## 3. Dane scenariuszy

Podstawowym przypadkiem jest:

```text
przedmiot: Matematyka
poziom: SP
klasy: 4, 5, 6, 7, 8
```

Lista klas jest utrzymywana w jednej stałej:

```ts
MATH_SP_CLASSES = ["4", "5", "6", "7", "8"]
```

## 4. Zakres CLUB-01–CLUB-13

| Test | Cel |
|---|---|
| `CLUB-01` | trwałość przedmioto-poziomu i formularza |
| `CLUB-02` | edycja klasy 4 na 5 |
| `CLUB-03` | dostępne są wyłącznie klasy 4–8 |
| `CLUB-04` | zapis kilku klas: 4, 5, 6 |
| `CLUB-05` | zaznaczenie wszystkich klas |
| `CLUB-06` | usunięcie tylko jednej klasy z zestawu |
| `CLUB-07` | formularz dotyczy wyłącznie wybranej szkoły |
| `CLUB-08` | dwie szkoły tworzą osobne potwierdzenia |
| `CLUB-09` | anulowanie dodawania nie tworzy potwierdzenia |
| `CLUB-10` | anulowanie edycji zachowuje poprzednią klasę |
| `CLUB-11` | usunięty formularz pozostaje oznaczony ikoną `backspace` |
| `CLUB-12A` | brak szkoły blokuje zapis |
| `CLUB-12B` | brak klasy blokuje zapis |
| `CLUB-13` | trwałość klasy obcej i wydawnictwa |

## 5. Reguły biznesowe

- Formularz klubowy wymaga wybranej szkoły i co najmniej jednej klasy.
- Matematyka na poziomie SP udostępnia klasy 4–8.
- Własne i obce klasy są niezależne.
- Klasa obca wymaga wskazania wydawnictwa.
- Dwie szkoły nauczyciela tworzą dwa różne potwierdzenia, nawet dla tego samego przedmiotu.
- Kolejność zwróconych potwierdzeń nie określa szkoły; test identyfikuje szkołę po szczegółach rekordu.
- Usunięcie jest logiczne: rekord pozostaje w tabeli i otrzymuje oznaczenie `backspace`.
- Testy wyłączają wysyłkę e-maila do nauczyciela.

## 6. Najważniejsze helpery `club.ts`

| Helper | Odpowiedzialność |
|---|---|
| `addMathSp()` | dodanie Matematyka / SP |
| `openNewClubForm()` | formularz nowego potwierdzenia |
| `selectSchool()` | wybór szkoły nauczyciela |
| `ownClass()` / `foreignClass()` | checkbox konkretnej klasy |
| `disableTeacherEmail()` | wyłączenie wiadomości testowej |
| `saveClubForm()` | zapis i odczyt ID potwierdzenia |
| `openClubEdit()` | otwarcie edycji po ID |
| `confirmationRow()` | wiersz potwierdzenia |
| `confirmationDetails()` | rozwinięte szczegóły |
| `cancelClubForm()` | anulowanie formularza |
| `confirmDeleteIfShown()` | opcjonalny dialog usunięcia |

## 7. Identyfikacja potwierdzeń

W `CLUB-08` test nie zakłada, że pierwszy zwrócony rekord należy do pierwszej szkoły. Każde potwierdzenie jest rozwijane, a przypisanie następuje po nazwie szkoły i klasie. Zapobiega to zależności od kolejności danych z API.

## 8. Uruchamianie

```text
npx playwright test tests/zamowienia-klubowiczostwo.spec.ts --grep @club
```

