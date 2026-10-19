import { expect } from "@playwright/test";
import { ACCESS_YEAR, test, type AccessRecord, type EntitlementData } from "./entitlements";
import {
  accessClasses,
  currentPermission,
  expectAccessExport,
  expectUnmarkedRecords,
} from "./access-regression";

// Sprawdzamy rzeczywisty wynik serwera. Nie zmieniamy zegara przeglądarki:
// nie sterowałby on procesem kwalifikacji po stronie backendu.
export const promotionToday = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Warsaw",
}).format(new Date());
export const promotionCalendarYear = Number(promotionToday.slice(0, 4));
const opening = process.env.OCTOPUS_CLUB_FORMS_OPEN_DATE;
export const debutWindow =
  !!opening &&
  /^\d{4}-\d{2}-\d{2}$/.test(opening) &&
  opening.startsWith(String(promotionCalendarYear)) &&
  opening <= promotionToday &&
  promotionToday <= `${promotionCalendarYear}-09-30`;
export const afterDebutWindow = promotionToday >= `${promotionCalendarYear}-10-01`;

export async function preparePromotion(data: EntitlementData) {
  await expectUnmarkedRecords(data);
  await test.step("Warunek przygotowania: dedykowana szkoła nie ma pozostawionych zamówień", async () => {
    expect(
      await data.orders().orders(),
      "Pozostałości poprzedniego przebiegu wymagają wyjaśnienia; test nie usuwa cudzych zamówień",
    ).toEqual([]);
  });
}

export async function previousConfirmation(
  data: EntitlementData,
  own = true,
  subject = "Matematyka",
  classes = ["4"],
) {
  // Poprzedni status wynika z roku szkolnego potwierdzenia. createdAt jest
  // serwerową datą wprowadzenia, nie datą, którą API pozwala cofnąć.
  // create() sprawdza zapis właściwego roku, nauczyciela, przedmiotu i klas.
  return test.step(`Przygotowanie: potwierdzenie na poprzedni rok szkolny ${ACCESS_YEAR - 1}/${ACCESS_YEAR}, wydawnictwo ${own ? "nasze" : "obce"}`, () =>
    data.club.create(data.teacherId, data.schools[0].id, own, {
      subject,
      classes,
      year: `${ACCESS_YEAR - 1}/${ACCESS_YEAR}`,
    }));
}

export async function promotionThreshold(data: EntitlementData, record: AccessRecord) {
  return test.step("Odczyt: obowiązujący zapisany próg ilościowy (wzór progu sprawdzają osobne testy THR)", async () => {
    let threshold = 0;
    await expect
      .poll(async () => {
        const details = (await currentPermission(data, record)).details;
        threshold = details.find((item) => item.class === "4")?.threshold ?? 0;
        return Number.isInteger(threshold) && threshold > 1;
      })
      .toBe(true);
    return threshold;
  });
}

export async function expectPromotion(
  data: EntitlementData,
  record: AccessRecord,
  levels: number[],
  scopeId = 4,
) {
  const expected = [...levels].sort((a, b) => a - b);
  await test.step(`Porównanie API: automat przyznaje dokładnie klasy [${expected}] w zakresie ${scopeId}`, async () => {
    await expect
      .poll(async () => {
        const current = await currentPermission(data, record);
        return {
          source: current.accessSource,
          classes: current.permissionClasses
            .filter((item) => item.isChecked && item.isOur)
            .map((item) => ({ class: item.class, scope: item.scopeId ?? 4 }))
            .sort((a, b) => a.class - b.class || a.scope - b.scope),
        };
      })
      .toEqual({
        source: "automat",
        classes: expected.map((value) => ({ class: value, scope: scopeId })),
      });
  });
  const classes = await accessClasses(data, record, levels, scopeId);
  await expectAccessExport(data, [{ record, classes }]);
  await expectUnmarkedRecords(data);
}
