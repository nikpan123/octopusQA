import { expect } from "@playwright/test";
import { test } from "./support/scenario";
import { expandOrderItems, openOrders } from "./support/order";
import { liveOctopusHeaders } from "./support/live-auth";

type HistoryOrder = {
  id: number;
  isCopied: boolean;
  createdAt: string;
  orderItems: Array<{ id: number; businessCode: string; title: string; isUpdated: boolean }>;
};

// Istniejące dane synchronizacji. Testy wyłącznie odczytują je, nie edytują ilości.
const schoolId = "44874";
const orderId = "598611";

for (const [suffix, code, yearInTitle, description] of [
  ["01", "8zc", false, "bez roku w tytule nie dopisuje roku zamówienia"],
  ["02", "4wp-1", true, "zachowuje rok należący do tytułu, bez dodatkowego roku zamówienia"],
] as const) {
  test(`ORD-BUG-36305-${suffix}: historia produktu ${description} @school @order @history @readonly @redmine-36305`, async ({
    page,
    scenario,
  }, info) => {
    await scenario.app.openPanel("school", schoolId);
    const order =
      await test.step("Odczyt API: istniejące zamówienie synchronizowane i dokładny tytuł wybranej pozycji", async () => {
        const response = await page
          .context()
          .request.get(new URL("/api/SchoolOrder/GetSchoolOrders", page.url()).href, {
            headers: await liveOctopusHeaders(page),
            params: {
              model: JSON.stringify({ institutionId: Number(schoolId), page: 1, pageSize: 500 }),
            },
          });
        expect(response.ok()).toBe(true);
        const body = await response.json();
        const matches = (body.data as HistoryOrder[]).filter((row) => String(row.id) === orderId);
        expect(
          matches,
          "Wymagane istniejące zamówienie synchronizowane; nie tworzymy historii ręcznie",
        ).toHaveLength(1);
        expect(matches[0].isCopied).toBe(false);
        return matches[0];
      });
    const products = order.orderItems.filter((item) => item.businessCode === code);
    expect(products, "Jednoznaczny produkt w zamówieniu").toHaveLength(1);
    const product = products[0];
    expect(product.isUpdated, "Pozycja z historią zmian synchronizacji").toBe(true);
    expect(/\b\d{4}\/\d{4}\b/.test(product.title)).toBe(yearInTitle);
    const expectedTitle = product.title.trim();
    const panel = await openOrders(page);
    await test.step("UI: rok 2020 i pozycja istniejącego zamówienia z historią", async () => {
      const year = panel.getByRole("combobox");
      await expect(year).toHaveCount(1);
      await expect(year).toContainText(/\d{4}/);
      await year.click();
      await page.getByRole("option", { name: "2020", exact: true }).click();
    });
    const items = await expandOrderItems(panel, orderId);
    await items.getByRole("cell", { name: code, exact: true }).click();
    await expect(panel.getByRole("button", { name: "Historia", exact: true })).toBeEnabled();
    await panel.getByRole("button", { name: "Historia", exact: true }).click();
    const dialog = page
      .locator("mat-dialog-container")
      .filter({ has: page.locator("app-school-order-history-dialog") });
    try {
      await expect(dialog).toBeVisible();
      const subtitle = dialog.locator(".order-history-dialog__subtitle");
      await test.step("Porównanie: nazwa nad tabelą jest dokładnie tytułem produktu z API, bez dopisanego roku zamówienia", async () => {
        await expect(
          dialog.getByRole("heading", { name: "Historia zmian", exact: true }),
        ).toBeVisible();
        await expect(subtitle).toHaveText(expectedTitle);
        for (const column of ["Ilość przed zmianą", "Ilość", "Data"])
          await expect(
            dialog.getByRole("columnheader", { name: column, exact: true }),
          ).toBeVisible();
      });
      await info.attach(`36305-${suffix} — historia produktu`, {
        body: await dialog.screenshot(),
        contentType: "image/png",
      });
    } finally {
      await info.attach(`36305-${suffix} — porównanie tytułu`, {
        body: JSON.stringify({
          schoolId,
          orderId,
          orderYear: order.createdAt.slice(0, 4),
          productId: product.id,
          code,
          yearInTitle,
          expectedTitle,
          actualTitle: await dialog.locator(".order-history-dialog__subtitle").textContent(),
          note: "Wyłącznie odczyt istniejących danych synchronizacji; rok należący do tytułu jest dozwolony. Test nie ocenia zawartości historii ilości.",
        }),
        contentType: "application/json",
      });
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
  });
}
