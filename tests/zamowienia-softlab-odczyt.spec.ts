import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import { openOrders, orderRow, expandOrderItems } from "./support/order";
import { liveOctopusHeaders } from "./support/live-auth";
import { OCTOPUS_BASE_URL, OCTOPUS_ENV } from "./support/environment";
import { findHistoricalOrders, readHistoricalOrder } from "../scripts/school-order-db.mjs";

// Odczyt historycznego stanu, nie test uruchomienia synchronizacji ani przeliczeń.
test.skip(
  OCTOPUS_ENV !== "dev" || process.env.OCTOPUS_INCLUDE_DATABASE !== "1",
  "Odczyt SQL jest osobnym, jawnym pakietem DEV.",
);

for (const [id, history] of [
  ["04", false],
  ["05", true],
] as const) {
  test(`ORD-DB-${id}: anulowane zamówienie integracji ${history ? "udostępnia historię ilości" : "pozostaje widoczne z oznaczeniem anulowane"} — odczyt istniejącego stanu @school @order @copy @database @readonly @redmine-35980 @redmine-35950`, async ({
    page,
  }, info) => {
    const candidate = (await findHistoricalOrders(history)).find(
      (row) => row.isCanceled && !row.isDel,
    );
    expect(
      candidate,
      "W bazie istnieje anulowany, nieusunięty dokument konta automat",
    ).toBeDefined();
    const before = await readHistoricalOrder(candidate!.id, candidate!.schoolId);
    expect(before.actor).toBe("automat");
    expect(before.isCanceled).toBe(true);
    expect(before.isDel).toBe(false);
    expect(before.isCopied).toBe(false);
    const symbol = before.cmsOrderSymbol || before.salesOrderSymbol;
    expect(symbol).not.toBe("");
    const response = await page
      .context()
      .request.get(`${OCTOPUS_BASE_URL}/api/SchoolOrder/GetSchoolOrders`, {
        headers: await liveOctopusHeaders(page),
        params: {
          model: JSON.stringify({ institutionId: before.schoolId, page: 1, pageSize: 500 }),
        },
      });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(
      body.metaData?.totalItems ?? 0,
      "Nie pomijamy dalszych stron historii zamówień",
    ).toBeLessThanOrEqual(500);
    const record = body.data.find((row: { id: number }) => row.id === before.id);
    expect(record, "Anulowany dokument nie może być ukryty przez API listy").toBeDefined();
    expect(record.isCanceled).toBe(true);
    const app = new Octopus(page);
    await app.openPanel("school", String(before.schoolId));
    const panel = await openOrders(page);
    await panel.getByRole("combobox").first().click();
    await page.getByRole("option", { name: before.createdAt.slice(0, 4), exact: true }).click();
    await expect(orderRow(panel, String(before.id))).toContainText(`${symbol} - anulowane`);
    if (history) {
      expect(record.orderItems.length).toBeGreaterThan(0);
      const product = record.orderItems.find(
        (item: { dictOrderItemId: number }) => item.dictOrderItemId === candidate!.historyProductId,
      );
      expect(product, "Pozycja wybrana z rzeczywistej historii ilości SQL").toBeDefined();
      const items = await expandOrderItems(panel, String(before.id));
      await items
        .locator("tbody > tr")
        .filter({
          has: page
            .locator(".mat-column-businessCode")
            .getByText(product.businessCode, { exact: true }),
        })
        .click();
      const button = panel.getByRole("button", { name: "Historia", exact: true });
      await expect(button).toBeEnabled();
      await button.click();
      await expect(
        page.locator("mat-dialog-container").filter({ hasText: "Historia zmian" }),
      ).toBeVisible();
    }
    expect(
      await readHistoricalOrder(before.id, before.schoolId),
      "Test odczytowy nie zmienia rekordu",
    ).toEqual(before);
    await info.attach("Softlab — historyczny stan, bez wywołania synchronizacji", {
      body: JSON.stringify({
        record: before,
        limitation:
          "Konto automat i symbol dokumentu potwierdzają dane integracyjne. Nie dowodzi to przebiegu zmiany statusu, propagacji do kopii ani przeliczenia gratisów i uprawnień.",
      }),
      contentType: "application/json",
    });
  });
}
