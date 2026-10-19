import { expect } from "@playwright/test";
import { copyTestFor, copyPairPlan } from "./support/order-copy";
import { orderRow } from "./support/order";

const test = copyTestFor(copyPairPlan("SP", "LO"));

test("ORD-BUG-36304-01: usunięcie kopii pokazuje komunikat zgodny z makietą; Nie anuluje, Tak usuwa tylko kopię @school @order @copy @confirmation @redmine-36304", async ({
  copy: data,
  page,
}, info) => {
  const sourceId =
    await test.step("Przygotowanie: jedno własne zamówienie z jednym produktem", async () => {
      const product = await data.apis.SP.product("F7P", [7]);
      return data.apis.SP.save([{ product, quantity: 3 }]);
    });
  const original = (await data.apis.SP.orders()).find((row) => String(row.id) === sourceId)!;
  const before = new Set((await data.apis.LO.orders()).map((row) => String(row.id)));
  const copyDialog = await data.open("SP", sourceId);
  await data.save(copyDialog, "SP", sourceId, ["LO"]);
  await expect
    .poll(
      async () => (await data.apis.LO.orders()).filter((row) => !before.has(String(row.id))).length,
    )
    .toBe(1);
  const copied = (await data.apis.LO.orders()).find((row) => !before.has(String(row.id)))!;
  expect(copied.isCopied).toBe(true);
  const copyId = String(copied.id);
  const panel = await data.panel("LO");
  const texts: string[] = [];
  async function openConfirmation() {
    await orderRow(panel, copyId).click();
    await panel.getByRole("button", { name: "Usuń", exact: true }).click();
    const dialog = page.locator("mat-dialog-container");
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toBeVisible();
    texts.push(await dialog.innerText());
    return dialog;
  }
  try {
    const confirmation = await openConfirmation();
    await test.step("#36304: zaakceptowane pytanie o usunięcie kopii oraz przyciski Nie/Tak; tytuł niewymagany", async () => {
      await info.attach("36304 — komunikat usuwania kopii", {
        body: await confirmation.screenshot(),
        contentType: "image/png",
      });
      // Użytkownik zaakceptował dialog bez tytułu; sprawdzamy treść i działanie.
      await expect
        .soft(
          confirmation.getByText("Czy na pewno chcesz usunąć kopię dokumentu?", { exact: true }),
          "Treść musi wskazywać kopię, nie trwałe usunięcie zamówienia",
        )
        .toBeVisible();
      await expect(confirmation.getByRole("button", { name: "Nie", exact: true })).toBeVisible();
      await expect(confirmation.getByRole("button", { name: "Tak", exact: true })).toBeVisible();
    });
    await test.step("Nie: zamknięcie komunikatu bez usunięcia ani zmiany kopii i oryginału", async () => {
      await confirmation.getByRole("button", { name: "Nie", exact: true }).click();
      await expect(confirmation).toHaveCount(0);
      await expect(orderRow(panel, copyId)).toHaveCount(1);
      expect((await data.apis.LO.orders()).find((row) => String(row.id) === copyId)).toEqual(
        copied,
      );
      expect((await data.apis.SP.orders()).find((row) => String(row.id) === sourceId)).toEqual(
        original,
      );
    });
    await test.step("Tak: ponowne potwierdzenie usuwa wyłącznie kopię, oryginał pozostaje niezmieniony", async () => {
      const reopened = await openConfirmation();
      await reopened.getByRole("button", { name: "Tak", exact: true }).click();
      await expect(reopened).toHaveCount(0);
      await expect(orderRow(panel, copyId)).toHaveCount(0);
      await expect
        .poll(async () => (await data.apis.LO.orders()).some((row) => String(row.id) === copyId))
        .toBe(false);
      data.apis.LO.owned.delete(copyId);
      expect((await data.apis.SP.orders()).find((row) => String(row.id) === sourceId)).toEqual(
        original,
      );
      const sourcePanel = await data.panel("SP");
      await expect(orderRow(sourcePanel, sourceId)).toHaveCount(1);
    });
  } finally {
    // Także przy błędnej treści komunikatu pozostawiamy cleanupowi zamknięty dialog.
    const openDialog = page.locator("mat-dialog-container");
    if (await openDialog.count())
      await openDialog.getByRole("button", { name: "Nie", exact: true }).click();
    await info.attach("36304 — rzeczywista treść komunikatów", {
      body: JSON.stringify({
        sourceId,
        copyId,
        titleRequired: false,
        expectedText: "Czy na pewno chcesz usunąć kopię dokumentu?",
        actualDialogs: texts,
      }),
      contentType: "application/json",
    });
  }
});
