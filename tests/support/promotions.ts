import { expect } from "@playwright/test";
import { setTestOrderDate } from "../../scripts/test-order-date.mjs";
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
    const orders = await data.orders().orders();
    if (orders.length) {
      const school = data.schools[0];
      const documents = orders
        .map(
          (order) =>
            `${order.salesOrderSymbol || order.cmsOrderSymbol || order.id} (ID ${order.id}, autor: ${order.createdByName || order.createdBy})`,
        )
        .join("; ");
      throw new Error(
        `[EXISTING_TEST_DATA] Nie można rozpocząć testu: szkoła ${school.name} (ID ${school.id}) ma istniejące zamówienia: ${documents}. ` +
          "Test wymaga szkoły bez zamówień i nie dotarł do sprawdzania promocji. " +
          "Sprawdź wskazane dokumenty: usuń je tylko, jeśli służyły do testów, albo przygotuj osobną szkołę. Automat nie usuwa tych zamówień.",
      );
    }
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

export async function prepareNewClientHistory(data: EntitlementData) {
  const api = data.orders();
  const product = await api.product("4P-2", [4]);
  for (const year of [promotionCalendarYear - 2, promotionCalendarYear - 1]) {
    const date = `${year}-05-01`;
    await test.step(`Przygotowanie NCL-04: zamówienie 4P-2, 1 sztuka, data w bazie ${date} i odczyt API`, async () => {
      const id = await api.save([{ product, quantity: 1 }]);
      const saved = await setTestOrderDate({
        orderId: id,
        schoolId: api.school.id,
        schoolName: api.school.name,
        userId: data.userId,
        date,
        purpose: "new-client-history",
      });
      await data.scenario.record(`newClientHistoricalOrder_${id}`, JSON.stringify(saved));
      await expect
        .poll(
          async () =>
            (await api.orders()).find((order) => String(order.id) === id)?.createdAt?.slice(0, 10),
          {
            message: `NCL-04: historyczna data ${date} zapisana w bazie i widoczna przez API`,
          },
        )
        .toBe(date);
    });
  }
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
