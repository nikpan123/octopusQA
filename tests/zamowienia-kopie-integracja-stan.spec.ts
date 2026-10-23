import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import { openOrders, orderRow, expandOrderItems } from "./support/order";
import { liveOctopusHeaders } from "./support/live-auth";
import { OCTOPUS_ENV } from "./support/environment";
import { readCopyEvidence, readHistoricalOrder } from "../scripts/school-order-db.mjs";
import { readOrderHistoryRows, hasDatedOrderHistory } from "../scripts/order-history-table.mjs";

test.skip(
  OCTOPUS_ENV !== "dev" || process.env.OCTOPUS_INCLUDE_DATABASE !== "1",
  "Odczyt SQL wymaga jawnego pakietu DEV. Nie wywołuje synchronizacji.",
);
type Order = {
  id: number;
  isCopied: boolean;
  isCanceled: boolean;
  orderItems: Array<{ dictOrderItemId: number; businessCode: string; quantity: number }>;
};
async function orders(page: import("@playwright/test").Page, schoolId: number) {
  const response = await page.context().request.get("/api/SchoolOrder/GetSchoolOrders", {
    headers: await liveOctopusHeaders(page),
    params: { model: JSON.stringify({ institutionId: schoolId, page: 1, pageSize: 500 }) },
  });
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.metaData.totalItems, "Nie pomijamy stron dokumentów").toBeLessThanOrEqual(500);
  return body.data as Order[];
}
async function history(
  page: import("@playwright/test").Page,
  schoolId: number,
  orderId: number,
  productId: number,
  createdAt: string,
) {
  const app = new Octopus(page);
  await app.openPanel("school", String(schoolId));
  const panel = await openOrders(page);
  await panel.getByRole("combobox").first().click();
  await page.getByRole("option", { name: createdAt.slice(0, 4), exact: true }).click();
  const order = (await orders(page, schoolId)).find((row) => row.id === orderId);
  expect(order).toBeDefined();
  const product = order!.orderItems.find((item) => item.dictOrderItemId === productId);
  expect(product).toBeDefined();
  const items = await expandOrderItems(panel, String(orderId));
  await items
    .locator("tbody > tr")
    .filter({
      has: page
        .locator(".mat-column-businessCode")
        .getByText(product!.businessCode, { exact: true }),
    })
    .click();
  const button = panel.getByRole("button", { name: "Historia", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  const dialog = page.locator("mat-dialog-container").filter({ hasText: "Historia zmian" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(async () => hasDatedOrderHistory(await readOrderHistoryRows(dialog)), {
      message: "Historia zawiera rzeczywistą zmianę z datą, nie wiersz Brak danych",
    })
    .toBe(true);
  const values = await readOrderHistoryRows(dialog);
  await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  return values;
}

test("ORD-DB-06: źródło khsynchro i istniejąca kopia pokazują tę samą niepustą historię produktu — tylko odczyt @school @order @copy @database @readonly @redmine-35980", async ({
  page,
}, info) => {
  const candidates = await readCopyEvidence("FindCopyHistory");
  test.skip(
    candidates.length === 0,
    "Brak istniejącej aktywnej pary źródło khsynchro/kopia z historią; nie tworzymy ani nie zmieniamy danych integracji.",
  );
  let pair: (typeof candidates)[number] | undefined;
  for (const candidate of candidates) {
    const source = (await orders(page, candidate.sourceSchoolId)).find(
      (row) => row.id === candidate.sourceId,
    );
    const copy = (await orders(page, candidate.copySchoolId)).find(
      (row) => row.id === candidate.copyId,
    );
    if (
      source?.orderItems.some((item) => item.dictOrderItemId === candidate.productId) &&
      copy?.orderItems.some((item) => item.dictOrderItemId === candidate.productId)
    ) {
      pair = candidate;
      break;
    }
  }
  test.skip(
    !pair,
    "Historyczne pozycje z SQL nie są już bieżącymi pozycjami tych dokumentów w API. Brak pary z tą samą widoczną pozycją i historią.",
  );
  if (!pair) return;
  const before = await readCopyEvidence("ReadCopyPair", pair.sourceId, pair.sourceSchoolId);
  const linked = before.find((row) => row.copyId === pair.copyId)!;
  expect(linked.copyMarked).toBe(true);
  await test.step("Integracja stan: rzeczywiste powiązanie SQL źródła i kopii", async () => {
    expect((await readHistoricalOrder(pair.sourceId, pair.sourceSchoolId)).actor).toBe("automat");
    expect(linked.sourceDeleted).toBe(false);
    expect(linked.copyDeleted).toBe(false);
  });
  await test.step("Integracja stan: historia tej samej pozycji źródła i kopii jest identyczna", async () => {
    const sourceHistory = await history(
      page,
      pair.sourceSchoolId,
      pair.sourceId,
      pair.productId!,
      linked.sourceCreatedAt,
    );
    const copyHistory = await history(
      page,
      pair.copySchoolId,
      pair.copyId,
      pair.productId!,
      linked.copyCreatedAt,
    );
    expect(copyHistory).toEqual(sourceHistory);
    await info.attach("Historia źródła i kopii — zastany stan", {
      body: JSON.stringify({
        pair,
        sourceHistory,
        copyHistory,
        limitation:
          "Bez kontrolowanej kolejnej synchronizacji; nie jest to dowód przejścia przed/po.",
      }),
      contentType: "application/json",
    });
  });
  expect(await readCopyEvidence("ReadCopyPair", pair.sourceId, pair.sourceSchoolId)).toEqual(
    before,
  );
});

for (const [id, kind] of [
  ["07", "FV"],
  ["08", "KFV"],
  ["09", "anulowane"],
  ["10", "usunięte"],
] as const) {
  test(`ORD-DB-${id}: ${kind} źródła i powiązane kopie — kontrola istniejącego stanu, nie wywołania Softlabu @school @order @copy @database @readonly @redmine-35980 @redmine-35950`, async ({
    page,
  }, info) => {
    const candidates = await readCopyEvidence("FindCopyStates");
    const candidate = candidates.find((row) =>
      kind === "anulowane"
        ? row.sourceCanceled && !row.sourceDeleted
        : kind === "usunięte"
          ? row.sourceDeleted
          : row.typeSymbol === kind && !row.sourceDeleted && !row.copyDeleted,
    );
    test.skip(
      !candidate,
      `Brak zastanej pary źródło–kopia dla ${kind}. Nie zmieniamy statusów w bazie.`,
    );
    const selected = candidate!;
    const before = await readCopyEvidence(
      "ReadCopyPair",
      selected.sourceId,
      selected.sourceSchoolId,
    );
    await test.step("Integracja stan: źródło i wszystkie rzeczywiście powiązane kopie SQL", async () => {
      expect(before.length).toBeGreaterThan(0);
      for (const row of before) {
        expect(row.sourceId).toBe(selected.sourceId);
        expect(row.copyMarked).toBe(true);
      }
    });
    await test.step("Integracja stan: prezentacja dokumentu i aktualne treści albo usunięcie kopii", async () => {
      if (kind === "anulowane" || kind === "usunięte") {
        for (const row of before) {
          expect(row.copyDeleted, "Nieaktywne źródło nie pozostawia aktywnej kopii").toBe(true);
          expect(
            (await orders(page, row.copySchoolId)).some((order) => order.id === row.copyId),
          ).toBe(false);
        }
        if (kind === "usunięte") {
          expect(
            before[0].sourceStatusAuditCount,
            "Usunięcie przez automat musi mieć audyt powiązany z ID dokumentu",
          ).toBeGreaterThan(0);
          expect(
            (await orders(page, selected.sourceSchoolId)).some(
              (row) => row.id === selected.sourceId,
            ),
          ).toBe(false);
        }
      } else {
        const source = (await orders(page, selected.sourceSchoolId)).find(
          (row) => row.id === selected.sourceId,
        )!;
        expect(source).toBeDefined();
        const contents = (row: Order) =>
          row.orderItems
            .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
            .sort((a, b) => a.id - b.id);
        for (const row of before.filter((row) => !row.copyDeleted)) {
          const copy = (await orders(page, row.copySchoolId)).find(
            (order) => order.id === row.copyId,
          )!;
          expect(copy).toBeDefined();
          expect(copy.isCopied).toBe(true);
          expect(contents(copy)).toEqual(contents(source));
          const app = new Octopus(page);
          await app.openPanel("school", String(row.copySchoolId));
          const panel = await openOrders(page);
          await panel.getByRole("combobox").first().click();
          await page
            .getByRole("option", { name: row.copyCreatedAt.slice(0, 4), exact: true })
            .click();
          await expect(orderRow(panel, String(row.copyId))).toContainText(
            `${row.sourceSalesSymbol || row.sourceCmsSymbol} - kopia`,
          );
        }
      }
      await info.attach("Stan integracyjnego źródła i kopii", {
        body: JSON.stringify({
          kind,
          rows: before,
          limitation:
            "Zastany stan. Brak dowodu zastąpienia konkretnego zamówienia fakturą, czasu synchronizacji lub przeliczeń operacyjnych.",
        }),
        contentType: "application/json",
      });
    });
    expect(
      await readCopyEvidence("ReadCopyPair", selected.sourceId, selected.sourceSchoolId),
    ).toEqual(before);
  });
}
