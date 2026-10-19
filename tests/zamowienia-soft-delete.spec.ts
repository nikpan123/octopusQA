import { expect } from "@playwright/test";
import { test } from "./support/order-class";
import { deleteOrder, openOrders, orderRow } from "./support/order";
import {
  probeSchoolOrderDatabase,
  readSchoolOrder,
  type SchoolOrderDbRow,
} from "../scripts/school-order-db.mjs";

test("ORD-DB-01: Usuń ukrywa zamówienie w UI i zachowuje rekord SchoolOrder z IsDel=1 @school @order @database @soft-delete", async ({
  classOrders: api,
  page,
  scenario,
}, info) => {
  test.setTimeout(180000);
  await test.step("SQL tylko do odczytu: właściwa baza DEV i wymagane kolumny SchoolOrder", async () => {
    const probe = await probeSchoolOrderDatabase();
    expect(probe.database).toBe("GWO_CRMDEV");
  });
  const id =
    await test.step("Przygotowanie: jedno własne zamówienie z jednym produktem", async () => {
      const product = await api.product("F7P", [7]);
      return api.save([{ product, quantity: 3 }]);
    });
  expect(api.owned.has(id), "SQL sprawdza wyłącznie zamówienie utworzone w tym teście").toBe(true);
  const before =
    await test.step("SQL PRZED: dokładnie ten rekord istnieje i ma IsDel=0", async () => {
      const row = await readSchoolOrder(id, api.school.id);
      expect(row).toEqual({
        id: Number(id),
        schoolId: Number(api.school.id),
        isDel: false,
        isCopied: false,
      });
      return row!;
    });
  await test.step("UI: usunięcie własnego zamówienia przyciskiem Usuń", async () => {
    await scenario.app.openPanel("school", api.school.id);
    await openOrders(page);
    expect(await deleteOrder(page, id)).toBe("DELETED");
    // Nie usuwamy ponownie logicznie usuniętego rekordu podczas cleanupu.
    api.owned.delete(id);
    await scenario.record(`orderClassCleanup_${id}`, "DELETED_VIA_UI");
  });
  await test.step("UI po odświeżeniu: zamówienia nie ma na głównej liście", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    const panel = await openOrders(page);
    await expect(orderRow(panel, id)).toHaveCount(0);
    await expect
      .poll(async () => (await api.orders()).some((row) => String(row.id) === id))
      .toBe(false);
  });
  let after: SchoolOrderDbRow | null = null;
  await test.step("SQL PO: ten sam rekord pozostał w bazie, zmienił się tylko IsDel na 1", async () => {
    try {
      await expect
        .poll(
          async () => {
            after = await readSchoolOrder(id, api.school.id);
            return after;
          },
          {
            timeout: 15000,
            intervals: [250, 500, 1000],
            message:
              "Soft delete musi zachować istniejący rekord; brak rekordu oznacza hard delete",
          },
        )
        .toEqual({ ...before, isDel: true });
    } finally {
      await info.attach("SQL — dowód soft delete przed i po", {
        body: JSON.stringify({
          database: "GWO_CRMDEV",
          table: "dbo.SchoolOrder",
          orderId: id,
          schoolId: api.school.id,
          before,
          after,
          note: "SQL: wyłącznie SELECT. Usunięcie wykonane przez UI.",
        }),
        contentType: "application/json",
      });
    }
  });
});
