import { expect } from "@playwright/test";
import { test, copyTestFor, copyPairPlan, expectCopy, type CopyNode } from "./support/order-copy";
import { expandOrderItems, orderRow } from "./support/order";

for (const [index, source, target] of [
  ["01", "SP", "LO"],
  ["02", "ZS", "SP"],
  ["03", "SP", "ZS"],
] as Array<[string, CopyNode, CopyNode]>) {
  const caseTest = copyTestFor(copyPairPlan(source, target));
  caseTest(
    `ORD-BUG-36289-${index}: kopia ${source} → ${target} zachowuje adres źródła i zależność od oryginału @school @order @copy @redmine-36289`,
    async ({ copy: data }, info) => {
      test.setTimeout(240000);
      info.annotations.push({ type: "redmine", description: "36289" });
      const original = await data.source(source);
      const targetControl = await data.source(target);
      const before = await data.snapshot();
      const sourceAddress = before[source].find(
        (row) => String(row.id) === original.id,
      )?.schoolAdressToOrder;
      const targetAddress = before[target].find(
        (row) => String(row.id) === targetControl.id,
      )?.schoolAdressToOrder;
      await test.step("Warunek danych: źródło i cel mają różne, niepuste adresy", async () => {
        expect(typeof sourceAddress).toBe("string");
        expect(sourceAddress?.trim().length).toBeGreaterThan(0);
        expect(typeof targetAddress).toBe("string");
        expect(targetAddress?.trim().length).toBeGreaterThan(0);
        expect(sourceAddress).not.toBe(targetAddress);
      });
      await data.save(await data.open(source, original.id), source, original.id, [target]);
      await expectCopy(data, before, source, original.id, [target]);
      const copied = (await data.apis[target].orders()).find(
        (row) => !before[target].some((old) => old.id === row.id),
      )!;
      await test.step("API i UI: adres kopii jest adresem źródła, nie placówki docelowej", async () => {
        expect(copied.schoolAdressToOrder).toBe(sourceAddress);
        expect(copied.schoolAdressToOrder).not.toBe(targetAddress);
        const panel = await data.panel(target);
        const row = orderRow(panel, String(copied.id));
        await row.click();
        await expect(panel.getByRole("button", { name: "Edytuj", exact: true })).toBeDisabled();
        await expandOrderItems(panel, String(copied.id));
        await expect(
          row
            .locator("xpath=following-sibling::*[1]")
            .locator(".shool-address-container > span")
            .last(),
        ).toHaveText(sourceAddress!);
      });
      await test.step("Prezentacja: rozwinięta kopia zachowuje symbol źródła i oznaczenie - kopia", async () => {
        const sourceOrder = before[source].find((row) => String(row.id) === original.id)!;
        const symbol = sourceOrder.salesOrderSymbol || sourceOrder.cmsOrderSymbol;
        expect(symbol, "Nie porównujemy pustego symbolu").toBeTruthy();
        const panel = await data.panel(target);
        const items = await expandOrderItems(panel, String(copied.id));
        await expect(items).toBeVisible();
        await expect(orderRow(panel, String(copied.id))).toContainText(`${symbol} - kopia`);
      });
      const changed = [{ product: original.lines[0].product, quantity: 8 }];
      await test.step("Zmiana oryginału: nowa ilość i usunięcie drugiego produktu", () =>
        data.apis[source].save(changed, original.id));
      await test.step("API: kopia odzwierciedla nową ilość i usunięcie pozycji bez niezależnej edycji", async () => {
        await expect
          .poll(async () => {
            const current = (await data.apis[target].orders()).find((row) => row.id === copied.id);
            return (
              current && {
                copy: current.isCopied,
                address: current.schoolAdressToOrder,
                items: current.orderItems.map((item) => ({
                  id: item.dictOrderItemId,
                  quantity: item.quantity,
                })),
              }
            );
          })
          .toEqual({
            copy: true,
            address: sourceAddress,
            items: [{ id: changed[0].product.id, quantity: 8 }],
          });
      });
      await test.step("UI po ponownym wejściu: adres źródła i zmieniona ilość kopii", async () => {
        const panel = await data.panel(target);
        const items = await expandOrderItems(panel, String(copied.id));
        await expect(items.locator("tbody > tr")).toHaveCount(1);
        await expect(
          items.locator(".mat-column-quantity").filter({ hasText: /^\s*8\s*$/ }),
        ).toHaveCount(1);
        await expect(
          orderRow(panel, String(copied.id))
            .locator("xpath=following-sibling::*[1]")
            .locator(".shool-address-container > span")
            .last(),
        ).toHaveText(sourceAddress!);
      });
      await info.attach("Adres i zależność kopii", {
        body: JSON.stringify({
          source,
          target,
          sourceAddress,
          targetAddress,
          originalId: original.id,
          copyId: copied.id,
          expectedQuantityAfterEdit: 8,
        }),
        contentType: "application/json",
      });
    },
  );
}
