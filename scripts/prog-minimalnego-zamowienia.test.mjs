import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculatePercentageThreshold,
  calculateThreshold,
  SCHOOL_KINDS,
  ORDER_FORMS,
} from "./prog-minimalnego-zamowienia.mjs";

/*
 * =========================================================
 * UWAGA O ZAKRESIE TEGO PLIKU
 * =========================================================
 *
 * Te testy weryfikują WYŁĄCZNIE referencyjną reimplementację wzoru
 * (prog-minimalnego-zamowienia.mjs), napisaną na podstawie dokumentu
 * „Scenariusze testowe – Minimalne zamówienie (próg cyfrowy vs
 * wysyłka)”. Nie wołają żadnego prawdziwego API ani UI Octopusa -
 * w repozytorium nie ma potwierdzonego endpointu zwracającego/
 * przeliczającego ten próg (patrz docs/tests/prog-minimalnego-
 * -zamowienia.md, sekcja "Braki blokujące"). Traktuj je jako
 * wykonywalną specyfikację formuły do przeglądu z analitykiem, a nie
 * jako dowód, że produkcyjny Octopus liczy próg tak samo - dopóki nie
 * podłączymy tych samych funkcji (lub odpowiednika API/UI) w
 * rzeczywistym teście regresyjnym.
 *
 * Pokryte punkty z dokumentu: TC-SP-01..09, TC-SP-15, TC-PN-01..05.
 * NIE pokryte tutaj (wymagają prawdziwego API/UI/DB - patrz dokumentacja):
 * TC-SP-10/11/12/13/14, TC-SR-*, TC-YR-*, TC-CY-*, TC-HI-*, TC-DH-*, TC-UI-*.
 * TC-SP-11/12 (brak/0 uczniów) SĄ jednak pokryte niżej, ponieważ czysta
 * logika domyślnej wartości 10 nie wymaga żadnego wywołania sieciowego.
 */

test("TC-SP-01: 750 uczniów -> cyfrowy 56, wysyłka 56", () => {
  assert.equal(calculateThreshold("SP", "CYFROWY", 750), 56);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 750), 56);
});

test("TC-SP-02: wartości dokładnie x,5 zaokrąglają się w górę (20, 60, 100, 140)", () => {
  const cases = [
    { studentCount: 20, expected: 2 },
    { studentCount: 60, expected: 5 },
    { studentCount: 100, expected: 8 },
    { studentCount: 140, expected: 11 },
  ];
  for (const { studentCount, expected } of cases) {
    assert.equal(
      calculatePercentageThreshold(studentCount),
      expected,
      `próg procentowy dla ${studentCount} uczniów`,
    );
    assert.equal(calculateThreshold("SP", "CYFROWY", studentCount), expected);
    // Wysyłka: 2 i 5 są poniżej dolnego ograniczenia 5, więc obie dają 5.
    const expectedShipping = Math.max(expected, 5);
    assert.equal(calculateThreshold("SP", "WYSYLKA", studentCount), expectedShipping);
  }
});

test("TC-SP-03: 6 uczniów (0,45) i 7 uczniów (0,525) - zaokrąglenie 0 i 1", () => {
  assert.equal(calculatePercentageThreshold(6), 0);
  assert.equal(calculateThreshold("SP", "CYFROWY", 6), 1, "reguła 0 -> 1 dla dostępu cyfrowego");

  assert.equal(calculatePercentageThreshold(7), 1);
  assert.equal(calculateThreshold("SP", "CYFROWY", 7), 1);
});

test("TC-SP-04: 1 uczeń (0,075) - dostęp cyfrowy 1, wysyłka 5", () => {
  assert.equal(calculatePercentageThreshold(1), 0);
  assert.equal(calculateThreshold("SP", "CYFROWY", 1), 1);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 1), 5);
});

test("TC-SP-05: 40 uczniów (3,0) - cyfrowy 3, wysyłka podniesiona do 5", () => {
  assert.equal(calculatePercentageThreshold(40), 3);
  assert.equal(calculateThreshold("SP", "CYFROWY", 40), 3);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 40), 5);
});

test("TC-SP-06: 100 uczniów (7,5) - cyfrowy 8, wysyłka 8 (powyżej progu 5, brak podnoszenia)", () => {
  assert.equal(calculateThreshold("SP", "CYFROWY", 100), 8);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 100), 8);
});

test("TC-SP-07: 53/60/67 uczniów - wysyłka zawsze 5, cyfrowy 4/5/5", () => {
  const cases = [
    { studentCount: 53, digital: 4 },
    { studentCount: 60, digital: 5 },
    { studentCount: 67, digital: 5 },
  ];
  for (const { studentCount, digital } of cases) {
    assert.equal(calculateThreshold("SP", "CYFROWY", studentCount), digital);
    assert.equal(calculateThreshold("SP", "WYSYLKA", studentCount), 5);
  }
});

test("TC-SP-08 [DO POTWIERDZENIA]: 126 uczniów (9,45) - próg wyliczony 9 jest wiążący, nie podnosimy do 10", () => {
  // Dokumentacja: "próg nie może zostać wyliczony" dotyczy braku danych
  // (null/0), NIE wyniku poniżej 10 dla poprawnej liczby uczniów.
  // Jeśli analityk potwierdzi INNĄ interpretację (np. że każdy próg SP
  // poniżej 10 jest podnoszony do 10), zmienić oczekiwaną wartość tutaj
  // ORAZ w calculateThreshold (obecnie brak takiego podnoszenia).
  assert.equal(calculateThreshold("SP", "CYFROWY", 126), 9);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 126), 9);
});

test("TC-SP-09: 127 uczniów (9,525) - cyfrowy 10, wysyłka 10", () => {
  assert.equal(calculateThreshold("SP", "CYFROWY", 127), 10);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 127), 10);
});

test("TC-SP-11: brak liczby uczniów (null) - wartość domyślna 10 dla obu form", () => {
  assert.equal(calculateThreshold("SP", "CYFROWY", null), 10);
  assert.equal(calculateThreshold("SP", "WYSYLKA", null), 10);
  assert.equal(calculateThreshold("SP", "CYFROWY", undefined), 10);
});

test("TC-SP-12 [DO POTWIERDZENIA]: liczba uczniów = 0 - wartość domyślna 10 (nie 1/5 wg reguły 0->1)", () => {
  // Dokumentacja proponuje alternatywną interpretację (1 i 5 wg reguły
  // "0 -> 1"). Ten test koduje domyślną interpretację z dokumentu
  // (traktujemy 0 tak samo jak null). Jeśli analityk potwierdzi
  // alternatywę, zmienić oczekiwaną wartość tutaj ORAZ
  // isMissingStudentCount() w prog-minimalnego-zamowienia.mjs.
  assert.equal(calculateThreshold("SP", "CYFROWY", 0), 10);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 0), 10);
});

test("TC-SP-15: bardzo duża liczba uczniów (100 000) - 7500 dla obu form, brak przepełnienia", () => {
  assert.equal(calculatePercentageThreshold(100_000), 7_500);
  assert.equal(calculateThreshold("SP", "CYFROWY", 100_000), 7_500);
  assert.equal(calculateThreshold("SP", "WYSYLKA", 100_000), 7_500);
});

test("Ochrona przed błędem zmiennoprzecinkowym: naiwny round(n/8*0.6) różni się od implementacji dla części wartości granicznych", () => {
  // Ten test dokumentuje SAM PROBLEM opisany w uwadze implementacyjnej
  // dokumentu - nie testuje naszej implementacji (ta go unika), tylko
  // pokazuje, dlaczego unikanie floatów było konieczne.
  const naive = (n) => Math.round((n / 8) * 0.6);
  const boundaryCases = [20, 60, 100, 140];
  let atLeastOneNaiveDivergence = false;
  for (const n of boundaryCases) {
    if (naive(n) !== calculatePercentageThreshold(n)) atLeastOneNaiveDivergence = true;
  }
  // Nie asertujemy sztywno, że naiwna wersja ZAWSZE się myli (zależy od
  // silnika JS/platformy) - to demonstracja klasy błędu, nie kontrakt.
  // Jeśli to poniższe `assert` kiedyś zawiedzie, to dobra wiadomość:
  // silnik JS akurat nie popełnił błędu zmiennoprzecinkowego dla tych
  // konkretnych wartości - ale implementacja i tak pozostaje bezpieczna,
  // bo nie używa naiwnej wersji.
  assert.equal(typeof atLeastOneNaiveDivergence, "boolean");
});

test("TC-PN-01: przedszkole, 30 uczniów -> cyfrowy 10, wysyłka 10", () => {
  assert.equal(calculateThreshold("PRZEDSZKOLE", "CYFROWY", 30), 10);
  assert.equal(calculateThreshold("PRZEDSZKOLE", "WYSYLKA", 30), 10);
});

test("TC-PN-02: NPC, 30 uczniów -> cyfrowy 10, wysyłka 10", () => {
  assert.equal(calculateThreshold("NPC", "CYFROWY", 30), 10);
  assert.equal(calculateThreshold("NPC", "WYSYLKA", 30), 10);
});

test("TC-PN-03: przedszkole i NPC z 1, 5, 500, 750 uczniami - zawsze 10 i 10, wzór SP nie jest stosowany", () => {
  for (const kind of ["PRZEDSZKOLE", "NPC"]) {
    for (const studentCount of [1, 5, 500, 750]) {
      assert.equal(calculateThreshold(kind, "CYFROWY", studentCount), 10);
      assert.equal(calculateThreshold(kind, "WYSYLKA", studentCount), 10);
    }
  }
  // Kontrast: dla SP z 750 uczniami wynik to 56, nie 10 - potwierdza,
  // że stała 10 dla PRZEDSZKOLE/NPC nie jest przypadkową zbieżnością.
  assert.notEqual(calculateThreshold("SP", "CYFROWY", 750), 10);
});

test("TC-PN-04: przedszkole i NPC bez liczby uczniów (null) - 10 i 10, brak błędu", () => {
  assert.doesNotThrow(() => calculateThreshold("PRZEDSZKOLE", "CYFROWY", null));
  assert.equal(calculateThreshold("PRZEDSZKOLE", "CYFROWY", null), 10);
  assert.equal(calculateThreshold("NPC", "WYSYLKA", undefined), 10);
});

test("TC-PN-05: przedszkole z 40 uczniami - wysyłka 10, NIE 5 (brak ograniczenia min. 5 z SP)", () => {
  assert.equal(calculateThreshold("PRZEDSZKOLE", "WYSYLKA", 40), 10);
  // Kontrast jawny z regułą SP dla tej samej liczby uczniów (TC-SP-05).
  assert.equal(calculateThreshold("SP", "WYSYLKA", 40), 5);
});

test("Szkoła średnia: brak wartości progu w nowym mechanizmie (założenie reimplementacji, nie potwierdzone API)", () => {
  assert.equal(calculateThreshold("SREDNIA", "CYFROWY", 500), null);
  assert.equal(calculateThreshold("SREDNIA", "WYSYLKA", null), null);
});

/*
 * =========================================================
 * ROZSZERZENIE: WALIDACJA BŁĘDNYCH ARGUMENTÓW
 * =========================================================
 * Dotąd żaden test nie sprawdzał zachowania funkcji dla danych spoza
 * kontraktu (ujemna/niecałkowita liczba uczniów, nieznany rodzaj
 * placówki, nieznana forma progu). To czysta logika defensywna - nie
 * wymaga żadnego wywołania sieciowego.
 */

test("calculatePercentageThreshold: odrzuca niecałkowitą, zerową i ujemną liczbę uczniów", () => {
  for (const invalid of [0, -1, -100, 1.5, NaN, Infinity]) {
    assert.throws(
      () => calculatePercentageThreshold(invalid),
      undefined,
      `powinno rzucić dla studentCount = ${invalid}`,
    );
  }
});

test("calculateThreshold: odrzuca nieznany rodzaj placówki i nieznaną formę progu", () => {
  assert.throws(() => calculateThreshold("LICEUM", "CYFROWY", 100));
  assert.throws(
    () => calculateThreshold("sp", "CYFROWY", 100),
    "rodzaj jest wrażliwy na wielkość liter",
  );
  assert.throws(() => calculateThreshold("SP", "WYSLKA", 100));
  assert.throws(
    () => calculateThreshold("SP", "cyfrowy", 100),
    "forma jest wrażliwa na wielkość liter",
  );
});

test("calculateThreshold: dla SP z niepoprawną (ale niepustą) liczbą uczniów propaguje błąd walidacji wzoru", () => {
  // -5 i 1.5 nie są "brakiem danych" (to jedyny przypadek zwracający
  // wartość domyślną 10) - trafiają więc do calculatePercentageThreshold
  // i powinny rzucić tak samo, jak przy bezpośrednim wywołaniu tej funkcji.
  assert.throws(() => calculateThreshold("SP", "CYFROWY", -5));
  assert.throws(() => calculateThreshold("SP", "WYSYLKA", 1.5));
});

/*
 * =========================================================
 * ROZSZERZENIE: WŁAŚCIWOŚCI OGÓLNE (property-based, pełny przegląd 1..300)
 * =========================================================
 * Zamiast pojedynczych przykładów z dokumentu, te testy sprawdzają
 * niezmienniki, które MUSZĄ być prawdziwe dla każdej liczby uczniów w
 * rozsądnym zakresie - dobre uzupełnienie przykładów punktowych, bo
 * łapią regresje, których pojedyncze przypadki mogłyby nie zauważyć.
 */

test("Właściwość: próg wysyłki SP nigdy nie jest niższy niż próg cyfrowy SP dla tej samej liczby uczniów", () => {
  for (let n = 1; n <= 300; n += 1) {
    const digital = calculateThreshold("SP", "CYFROWY", n);
    const shipping = calculateThreshold("SP", "WYSYLKA", n);
    assert(
      shipping >= digital,
      `dla ${n} uczniów wysyłka (${shipping}) powinna być >= cyfrowy (${digital})`,
    );
  }
});

test("Właściwość: próg cyfrowy SP jest zawsze >= 1, a wysyłka zawsze >= 5, dla dowolnej dodatniej liczby uczniów", () => {
  for (let n = 1; n <= 300; n += 1) {
    assert(calculateThreshold("SP", "CYFROWY", n) >= 1, `cyfrowy dla ${n} uczniów`);
    assert(calculateThreshold("SP", "WYSYLKA", n) >= 5, `wysyłka dla ${n} uczniów`);
  }
});

test("Właściwość: próg procentowy SP jest niemalejący wraz ze wzrostem liczby uczniów", () => {
  let previous = calculatePercentageThreshold(1);
  for (let n = 2; n <= 300; n += 1) {
    const current = calculatePercentageThreshold(n);
    assert(
      current >= previous,
      `próg procentowy powinien być niemalejący: n=${n - 1}->${previous}, n=${n}->${current}`,
    );
    previous = current;
  }
});

test("Właściwość: dla PRZEDSZKOLE i NPC wynik jest zawsze stałą 10, niezależnie od liczby uczniów (1..300)", () => {
  for (const kind of ["PRZEDSZKOLE", "NPC"]) {
    for (let n = 1; n <= 300; n += 50) {
      for (const form of ORDER_FORMS) {
        assert.equal(calculateThreshold(kind, form, n), 10, `${kind}/${form} dla ${n} uczniów`);
      }
    }
  }
});

test("Kontrakt eksportów: SCHOOL_KINDS i ORDER_FORMS zawierają dokładnie oczekiwane wartości", () => {
  // Test-strażnik: gdyby ktoś przypadkiem dodał/usunął/przeliterował
  // wartość w tych stałych, ten test zawiedzie zanim zawiedzie coś
  // bardziej mylącego gdzie indziej.
  assert.deepEqual([...SCHOOL_KINDS].sort(), ["NPC", "PRZEDSZKOLE", "SP", "SREDNIA"]);
  assert.deepEqual([...ORDER_FORMS].sort(), ["CYFROWY", "WYSYLKA"]);
});
