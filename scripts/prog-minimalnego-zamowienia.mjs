/**
 * Referencyjna implementacja wzoru na próg minimalnego zamówienia,
 * zgodna z dokumentem „Scenariusze testowe – Minimalne zamówienie
 * (próg cyfrowy vs wysyłka)” (Nikodem, 24.09.2026).
 *
 * WAŻNE: to jest REFERENCYJNA reimplementacja opisanych reguł, a nie
 * import z prawdziwego backendu Octopusa (ten kod nie ma dostępu do
 * źródeł aplikacji - to osobne repozytorium testów E2E). Jej rolą jest:
 *  1) dać wykonywalną, jednoznaczną specyfikację formuły do review,
 *  2) pełnić funkcję "oracle" w testach API/E2E, gdy tylko poznamy
 *     rzeczywisty endpoint zwracający próg (patrz
 *     docs/tests/prog-minimalnego-zamowienia.md - sekcja "Braki").
 *
 * Zaimplementowane reguły (z dokumentu):
 *  - Wzór (tylko SP): próg_procentowy = round((liczba_uczniów / 8) * 60%),
 *    zaokrąglenie matematyczne (0,5 w górę).
 *  - Dostęp cyfrowy, SP: próg = próg_procentowy; jeśli wynik to 0 -> 1.
 *  - Wysyłka gratisów, SP: próg = max(próg_procentowy, 5).
 *  - Brak danych do wyliczenia (null lub 0 uczniów): wartość domyślna 10
 *    (obie formy) - przyjęta interpretacja punktu 2 "Do potwierdzenia".
 *  - Przedszkole i NPC: stała 10 dla obu form, niezależnie od liczby uczniów.
 *  - Szkoła średnia: poza nowym mechanizmem (brak wartości).
 *
 * Unikanie błędu zmiennoprzecinkowego (uwaga z dokumentu przy tabeli
 * danych testowych): zamiast liczyć (n / 8) * 0.6 w liczbach
 * zmiennoprzecinkowych (0.6 nie ma dokładnej reprezentacji binarnej),
 * przekształcamy wzór do czystej arytmetyki na liczbach całkowitych:
 *   round_half_up(3n/40) = floor((6n + 40) / 80)
 * co daje identyczny wynik matematyczny bez ryzyka błędu zaokrąglenia
 * w pobliżu granicy x,5 (przypadki n=20,60,100,140 z dokumentu).
 */

export const SCHOOL_KINDS = ["SP", "PRZEDSZKOLE", "NPC", "SREDNIA"];
export const ORDER_FORMS = ["CYFROWY", "WYSYLKA"];

const DEFAULT_THRESHOLD = 10;
const MIN_SHIPPING_THRESHOLD = 5;
const MIN_DIGITAL_THRESHOLD = 1;
const CONSTANT_THRESHOLD_KINDS = new Set(["PRZEDSZKOLE", "NPC"]);

/**
 * Próg procentowy dla szkoły podstawowej, przed zastosowaniem dolnych
 * ograniczeń specyficznych dla formy (cyfrowy/wysyłka).
 *
 * @param {number} studentCount liczba uczniów (liczba całkowita > 0)
 * @returns {number}
 */
export function calculatePercentageThreshold(studentCount) {
  if (!Number.isInteger(studentCount) || studentCount <= 0) {
    throw new Error(
      `calculatePercentageThreshold wymaga dodatniej liczby całkowitej uczniów, otrzymano: ${studentCount}`,
    );
  }
  // round_half_up(studentCount * 3 / 40) bez pośrednich floatów.
  return Math.floor((studentCount * 6 + 40) / 80);
}

function isMissingStudentCount(studentCount) {
  return studentCount === null || studentCount === undefined || studentCount === 0;
}

/**
 * Wylicza próg minimalnego zamówienia dla danej placówki, formy
 * (cyfrowy/wysyłka) i liczby uczniów.
 *
 * @param {"SP"|"PRZEDSZKOLE"|"NPC"|"SREDNIA"} schoolKind
 * @param {"CYFROWY"|"WYSYLKA"} form
 * @param {number|null|undefined} studentCount
 * @returns {number|null} próg, albo null dla szkoły średniej (mechanizm nie dotyczy)
 */
export function calculateThreshold(schoolKind, form, studentCount) {
  if (!SCHOOL_KINDS.includes(schoolKind)) {
    throw new Error(`Nieznany rodzaj placówki: ${schoolKind}`);
  }
  if (!ORDER_FORMS.includes(form)) {
    throw new Error(`Nieznana forma progu: ${form}`);
  }

  if (schoolKind === "SREDNIA") {
    // TC-SR-01/02/10: szkoła średnia pozostaje w mechanizmie BOK/CC,
    // brak wartości progu w nowym mechanizmie.
    return null;
  }

  if (CONSTANT_THRESHOLD_KINDS.has(schoolKind)) {
    // TC-PN-01..05: przedszkole i NPC mają stałą 10 dla obu form,
    // niezależnie od liczby uczniów - w tym NIE stosuje się dolne
    // ograniczenie "min. 5" dla wysyłki (TC-PN-05).
    return DEFAULT_THRESHOLD;
  }

  // schoolKind === "SP"
  if (isMissingStudentCount(studentCount)) {
    // TC-SP-11/12: brak liczby uczniów albo 0 -> wartość domyślna 10
    // dla obu form (przyjęta interpretacja punktu 2 "Do potwierdzenia").
    return DEFAULT_THRESHOLD;
  }

  const percentage = calculatePercentageThreshold(studentCount);

  if (form === "CYFROWY") {
    // TC-SP-03/04: jeśli wynik zaokrąglenia to 0, system przyjmuje 1.
    return percentage === 0 ? MIN_DIGITAL_THRESHOLD : percentage;
  }

  // form === "WYSYLKA"
  return Math.max(percentage, MIN_SHIPPING_THRESHOLD);
}
