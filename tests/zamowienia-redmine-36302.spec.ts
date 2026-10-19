import { expect, type Locator } from "@playwright/test";
import { test, classProductRow, showClassOrders, showClassPositions } from "./support/order-class";

async function expectExpanded(row: Locator, expanded: boolean) {
  await expect(
    row
      .locator("mat-icon")
      .filter({ hasText: expanded ? /^keyboard_arrow_up$/ : /^keyboard_arrow_down$/ }),
  ).toHaveCount(1);
  const details = row.locator("xpath=following-sibling::*[1]").locator("table");
  if (expanded) await expect(details).toBeVisible();
  else await expect(details).toBeHidden();
}

async function toggle(row: Locator) {
  await row
    .locator("mat-icon")
    .filter({ hasText: /^keyboard_arrow_(?:up|down)$/ })
    .click();
}

test("ORD-BUG-36302-01: rozwijanie i zwijanie podręcznika w Pozycjach nie zmienia pozostałych wierszy @school @order @positions @isolation @redmine-36302", async ({
  classOrders: api,
  page,
}, info) => {
  const products =
    await test.step("Przygotowanie: trzy różne produkty, w tym dwa tego samego przedmiotu", async () => [
      await api.product("4P-2", [4]),
      await api.product("P5Pv", [5]),
      await api.product("F7P", [7]),
    ]);
  const [first, second] =
    await test.step("Przygotowanie: dwa własne zamówienia; pierwsze zawiera dwa produkty", async () => [
      await api.save(products.slice(0, 2).map((product) => ({ product, quantity: 2 }))),
      await api.save([{ product: products[2], quantity: 3 }]),
    ]);
  await showClassOrders(page, api);
  const positions = await showClassPositions(page);
  const rows = products.map((product) => classProductRow(positions, product));
  const states: boolean[][] = [];
  async function check(expected: boolean[]) {
    for (let i = 0; i < rows.length; i++) {
      await expect(
        rows[i],
        `Dokładnie jedna pozycja produktu ${products[i].businessCode}`,
      ).toHaveCount(1);
      await expectExpanded(rows[i], expected[i]);
      if (expected[i]) {
        const details = rows[i].locator("xpath=following-sibling::*[1]");
        await expect(
          details.getByRole("cell", { name: i === 2 ? second : first, exact: true }),
        ).toHaveCount(1);
        await expect(
          details.getByRole("cell", { name: i === 2 ? first : second, exact: true }),
        ).toHaveCount(0);
      }
    }
    states.push(expected);
  }
  try {
    await test.step("Stan początkowy: wszystkie trzy pozycje są zwinięte", () =>
      check([false, false, false]));
    await test.step("Rozwinięcie pierwszego podręcznika: tylko jego szczegóły są widoczne", async () => {
      await toggle(rows[0]);
      await check([true, false, false]);
    });
    await test.step("Rozwinięcie drugiego podręcznika: pierwszy pozostaje otwarty, trzeci zamknięty", async () => {
      await toggle(rows[1]);
      await check([true, true, false]);
    });
    await test.step("Zwinięcie pierwszego podręcznika: drugi pozostaje otwarty", async () => {
      await toggle(rows[0]);
      await check([false, true, false]);
    });
    await test.step("Rozwinięcie produktu z innego zamówienia: nie zmienia dwóch poprzednich pozycji", async () => {
      await toggle(rows[2]);
      await check([false, true, true]);
    });
    await test.step("Zwinięcie drugiego podręcznika: trzeci nadal pokazuje swoje zamówienie", async () => {
      await toggle(rows[1]);
      await check([false, false, true]);
    });
    await test.step("Zwinięcie trzeciego i ponowne rozwinięcie pierwszego: stan nie przenika między pozycjami", async () => {
      await toggle(rows[2]);
      await check([false, false, false]);
      await toggle(rows[0]);
      await check([true, false, false]);
    });
    await info.attach("Pozycje — końcowy stan niezależnego rozwinięcia", {
      body: await positions.screenshot(),
      contentType: "image/png",
    });
  } finally {
    await info.attach("36302 — sprawdzone stany pozycji", {
      body: JSON.stringify({
        schoolId: api.school.id,
        orderIds: [first, second],
        products: products.map((p) => p.businessCode),
        verifiedStates: states,
        note: "true = rozwinięty; kolejność zgodna z products. Stan dopisywany dopiero po zaliczeniu wszystkich asercji.",
      }),
      contentType: "application/json",
    });
  }
});
