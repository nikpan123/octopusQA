import { test, expect, type Scenario } from "./support/scenario";
import {
  DEFAULT_CITY,
  DEFAULT_POSTAL_CODE,
  fillSchoolAddTextField,
  prepareCompleteSchoolAdd,
  saveSchoolAdd,
} from "./support/school-add";
import { calculateThreshold } from "../scripts/prog-minimalnego-zamowienia.mjs";

/*
 * =========================================================
 * PRÓG MINIMALNEGO ZAMÓWIENIA — POJEDYNCZY POTWIERDZONY PUNKT DANYCH
 * =========================================================
 *
 * Zakres tego pliku (w odróżnieniu od scripts/prog-minimalnego-zamowienia.
 * test.mjs, który testuje WYŁĄCZNIE czystą reimplementację wzoru w izolacji):
 * to jest prawdziwy test E2E, który tworzy rzeczywistą szkołę w Octopusie
 * przez UI i sprawdza, że PRAWDZIWE API zwraca wartość zgodną ze wzorem
 * z dokumentu źródłowego.
 *
 * Jest tu tylko JEDEN scenariusz, bo tylko JEDEN punkt danych został
 * potwierdzony realnym Network capture (patrz docs/tests/prog-minimalnego-
 * -zamowienia.md, sekcja "Braki blokujące", punkt 1): szkoła SP z
 * `quantityOfStudents: 750` zwraca w GET /api/InstitutionBrowser/
 * GetInstitutions pole `threshold: 56` — dokładnie tyle, ile przewiduje
 * wzór. Pola "Liczba uczniów" (UI) i endpoint GetInstitutions są tu użyte
 * WYŁĄCZNIE w sposób już wcześniej potwierdzony w tym repozytorium:
 *  - zapis i odczyt pola "Liczba uczniów" — patrz SCH-32 w
 *    tests/szkola-dodawanie.spec.ts (istniejący, przechodzący test);
 *  - odczyt pola przez interception GetInstitutions po otwarciu panelu
 *    szkoły — dokładnie ten sam wzorzec co getSchoolMedalApiData() w
 *    tests/support/school-medal.ts.
 * Żaden endpoint ani selektor nie jest tu zgadywany.
 *
 * NIE dodano tu testu dla TC-SP-14 (rozróżnienie cyfrowy vs wysyłka), bo
 * dla n=750 obie wartości wychodzą sobie równe (56) — ten jeden punkt
 * danych nie rozstrzyga, którą z dwóch wartości reprezentuje pojedyncze
 * pole `threshold` z API. Potrzebny jest drugi, jeszcze niepotwierdzony
 * Network capture dla liczby uczniów, przy której cyfrowy i wysyłka się
 * różnią (patrz dokumentacja) — dopóki go nie ma, pisanie takiego testu
 * oznaczałoby zgadywanie.
 *
 * Szkoła utworzona w tym teście NIE jest usuwana (Octopus nie ma
 * potwierdzonego endpointu DELETE dla szkół - identycznie jak pozostałe
 * testy w szkola-dodawanie.spec.ts) i jest rejestrowana ze statusem
 * `KEPT_NO_DELETE_ENDPOINT`.
 */

test.describe.configure({ mode: "parallel" });

async function recordThresholdSchool(scenario: Scenario, schoolId: string, number: string) {
  await scenario.record("schoolId", schoolId);
  await scenario.record("schoolAddress", `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`);
  await scenario.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
}

test("TC-SP-01 (E2E): szkoła SP z 750 uczniami ma próg minimalnego zamówienia zgodny ze wzorem @school @threshold", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const studentCount = "750";

  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "Liczba uczniów", studentCount);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();
  await recordThresholdSchool(s, schoolId, number);

  // Wzorzec identyczny jak getSchoolMedalApiData() w support/school-medal.ts:
  // rejestrujemy oczekiwanie na odpowiedź PRZED nawigacją, która ją wywoła.
  const institutionsResponse = page.waitForResponse((response) => {
    if (response.request().method() !== "GET") return false;
    const url = new URL(response.url());
    if (url.pathname !== "/api/InstitutionBrowser/GetInstitutions") return false;
    const filterModel = url.searchParams.get("filterModel");
    if (!filterModel) return false;
    try {
      const parsed = JSON.parse(filterModel);
      return (
        Array.isArray(parsed.institutionIds) && parsed.institutionIds.map(String).includes(schoolId)
      );
    } catch {
      return false;
    }
  });

  await s.app.openPanel("school", schoolId);
  const response = await institutionsResponse;
  expect(response.ok(), "GetInstitutions powinien zwrócić poprawną odpowiedź").toBeTruthy();
  await response.finished();

  const body = await response.json();
  const schoolData = body.data?.find((item: { id: number }) => String(item.id) === schoolId);
  expect(schoolData, `API powinno zwrócić szkołę o ID ${schoolId}`).toBeTruthy();

  // Dla n=750 próg cyfrowy i wysyłkowy są sobie równe (56) - patrz
  // komentarz na górze pliku. Referencyjny wzór (nie realny import z
  // backendu Octopusa) jest tu użyty jako "oracle", dokładnie tak jak
  // opisano w prog-minimalnego-zamowienia.mjs.
  const expectedThreshold = calculateThreshold("SP", "CYFROWY", 750);
  await s.record("schoolThreshold", String(schoolData.threshold));
  expect(
    schoolData.threshold,
    `Pole threshold z API (${schoolData.threshold}) powinno odpowiadać wzorowi z dokumentu (${expectedThreshold})`,
  ).toBe(expectedThreshold);
});
