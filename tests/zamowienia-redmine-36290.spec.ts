import { expect } from "@playwright/test";
import {
  test,
  copyTestFor,
  copyPairPlan,
  expectCopy,
  type CopyData,
  type CopyNode,
} from "./support/order-copy";
import {
  expandOrderItems,
  orderRow,
  openOrderEdit,
  setOrderQuantity,
  saveOrderEdit,
} from "./support/order";
import { liveOctopusHeaders } from "./support/live-auth";
import type { ClassLine } from "./support/order-class";

const canonicalItems = (items: Array<{ dictOrderItemId: number; quantity: number }>) =>
  items
    .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
    .sort((a, b) => a.id - b.id);

async function expectItems(
  data: CopyData,
  node: CopyNode,
  id: string,
  lines: ClassLine[],
  checkUI = true,
) {
  await expect
    .poll(
      async () => {
        const row = (await data.apis[node].orders()).find((item) => String(item.id) === id);
        return row && canonicalItems(row.orderItems);
      },
      { message: `Dokument ${node}/${id}: dokładnie oczekiwane produkty i ilości` },
    )
    .toEqual(
      lines
        .map(({ product, quantity }) => ({ id: product.id, quantity }))
        .sort((a, b) => a.id - b.id),
    );
  if (!checkUI) return;
  const panel = await data.panel(node);
  const items = await expandOrderItems(panel, id);
  await expect(items.locator("tbody > tr")).toHaveCount(lines.length);
  for (const line of lines) {
    const row = items.locator("tbody > tr").filter({
      has: items
        .page()
        .locator(".mat-column-businessCode")
        .getByText(line.product.businessCode, { exact: true }),
    });
    await expect(row).toHaveCount(1);
    // Znak ! sygnalizuje historię zmiany ilości; nie jest częścią samej liczby.
    await expect(row.locator(".mat-column-quantity")).toHaveText(
      new RegExp(`^\\s*${line.quantity}\\s*!?\\s*$`),
    );
  }
}

async function expectManualHistoryUnavailable(
  data: CopyData,
  node: CopyNode,
  id: string,
  code: string,
) {
  const panel = await data.panel(node);
  const items = await expandOrderItems(panel, id);
  await items
    .locator("tbody > tr")
    .filter({
      has: items.page().locator(".mat-column-businessCode").getByText(code, { exact: true }),
    })
    .click();
  await expect(
    panel.getByRole("button", { name: "Historia", exact: true }),
    "Zamówienie ręczne nie ma historii synchronizacji z khsynchro, także po zmianie ilości",
  ).toBeDisabled();
}

for (const [suffix, source, target] of [
  ["05", "SP", "LO"],
  ["06", "ZS", "SP"],
] as Array<[string, CopyNode, CopyNode]>) {
  const caseTest = copyTestFor(copyPairPlan(source, target));
  caseTest(
    `ORD-BUG-36290-${suffix}: zamówienie ręczne i jego kopia ${source} → ${target} nie udostępniają historii khsynchro po edycji ilości @school @order @copy @history @manual @redmine-36290`,
    async ({ copy: data }, info) => {
      test.setTimeout(240000);
      const original = await data.source(source);
      const before = await data.snapshot();
      await data.save(await data.open(source, original.id), source, original.id, [target]);
      await expectCopy(data, before, source, original.id, [target]);
      const copied = (await data.apis[target].orders()).find(
        (row) => !before[target].some((old) => old.id === row.id),
      )!;
      await test.step("UI: zmiana ilości oryginału z 3 na 8 i zapis formularza", async () => {
        const panel = await data.panel(source);
        const form = await openOrderEdit(panel.page(), original.id);
        await setOrderQuantity(form, original.lines[0].product.businessCode, "8");
        await saveOrderEdit(form);
        const lines = [{ ...original.lines[0], quantity: 8 }, original.lines[1]];
        await expectItems(data, source, original.id, lines, false);
        await expectItems(data, target, String(copied.id), lines);
      });
      await test.step("Historia synchronizacji nie dotyczy zamówień ręcznych: przycisk nieaktywny w źródle i kopii", async () => {
        await expectManualHistoryUnavailable(
          data,
          source,
          original.id,
          original.lines[0].product.businessCode,
        );
        await expectManualHistoryUnavailable(
          data,
          target,
          String(copied.id),
          original.lines[0].product.businessCode,
        );
        await info.attach("Zakres historii zamówień ręcznych", {
          body: JSON.stringify({
            source: original.id,
            copy: copied.id,
            origin: "manual",
            historyAvailable: false,
            synchronizedOrdersCovered: false,
          }),
          contentType: "application/json",
        });
      });
    },
  );
}

for (const [suffix, source, target] of [
  ["01", "SP", "LO"],
  ["02", "ZS", "SP"],
] as Array<[string, CopyNode, CopyNode]>) {
  const caseTest = copyTestFor(copyPairPlan(source, target));
  caseTest(
    `ORD-BUG-36290-${suffix}: kopia ${source} → ${target} jest nieedytowalna i odzwierciedla pozycje oraz ilości oryginału @school @order @copy @redmine-36290`,
    async ({ copy: data }, info) => {
      test.setTimeout(240000);
      info.annotations.push({ type: "redmine", description: "36290" });
      const original = await data.source(source);
      const before = await data.snapshot();
      await data.save(await data.open(source, original.id), source, original.id, [target]);
      await expectCopy(data, before, source, original.id, [target]);
      const copied = (await data.apis[target].orders()).find(
        (row) => !before[target].some((old) => old.id === row.id),
      )!;
      const copyId = String(copied.id);
      await test.step("UI: oryginał ma aktywną edycję, kopia nie pozwala zmieniać ilości ani dodawać i usuwać pozycji", async () => {
        const sourcePanel = await data.panel(source);
        await orderRow(sourcePanel, original.id).click();
        await expect(
          sourcePanel.getByRole("button", { name: "Edytuj", exact: true }),
        ).toBeEnabled();
        const targetPanel = await data.panel(target);
        await orderRow(targetPanel, copyId).click();
        await expect(
          targetPanel.getByRole("button", { name: "Edytuj", exact: true }),
        ).toBeDisabled();
        const items = await expandOrderItems(targetPanel, copyId);
        await expect(items.getByRole("spinbutton")).toHaveCount(0);
      });
      const quantityChanged = [{ ...original.lines[0], quantity: 8 }, original.lines[1]];
      await test.step("Zmiana ilości oryginału 3 → 8: zgodność API i UI kopii", async () => {
        await data.apis[source].save(quantityChanged, original.id);
        // save() już potwierdza rzeczywisty zapis wszystkich pozycji źródła przez API.
        await expectItems(data, target, copyId, quantityChanged);
      });
      const third = { product: await data.apis[source].product("F8P", [8]), quantity: 5 };
      for (const [name, lines] of [
        ["Dodanie pozycji do oryginału", [...quantityChanged, third]],
        ["Usunięcie drugiej pozycji z oryginału", [quantityChanged[0], third]],
        [
          "Zamiana produktu w oryginale",
          [quantityChanged[0], { ...original.lines[1], quantity: 6 }],
        ],
      ] as Array<[string, ClassLine[]]>) {
        await test.step(`${name}: kopia zawiera dokładnie nowe pozycje i ilości w API oraz UI`, async () => {
          await data.apis[source].save(lines, original.id);
          await expectItems(data, target, copyId, lines);
        });
      }
    },
  );
}

for (const [suffix, source, target] of [
  ["03", "SP", "LO"],
  ["04", "SP", "ZS"],
] as Array<[string, CopyNode, CopyNode]>) {
  const caseTest = copyTestFor(copyPairPlan(source, target));
  caseTest(
    `ORD-BUG-36290-${suffix}: bezpośrednie API nie pozwala edytować kopii w ${target} ani zmieniać oryginału @school @order @copy @negative @redmine-36290`,
    async ({ copy: data, page }, info) => {
      test.setTimeout(240000);
      const original = await data.source(source);
      const before = await data.snapshot();
      await data.save(await data.open(source, original.id), source, original.id, [target]);
      await expectCopy(data, before, source, original.id, [target]);
      const copied = (await data.apis[target].orders()).find(
        (row) => !before[target].some((old) => old.id === row.id),
      )!;
      const baseline = await data.snapshot();
      const third = { product: await data.apis[source].product("F8P", [8]), quantity: 5 };
      for (const [name, lines] of [
        ["zmiana ilości", [{ ...original.lines[0], quantity: 99 }, original.lines[1]]],
        ["dodanie pozycji", [...original.lines, third]],
        ["usunięcie pozycji", [original.lines[0]]],
      ] as Array<[string, ClassLine[]]>) {
        await test.step(`Próba API: ${name} kopii nie zmienia żadnego dokumentu`, async () => {
          const complex = target === "ZS";
          const endpoint = complex
            ? "SchoolComplexOrder/UpdateSchoolComplexOrder"
            : "SchoolOrder/UpdateSchoolOrder";
          const response = await page
            .context()
            .request.post(new URL(`/api/${endpoint}`, page.url()).href, {
              headers: await liveOctopusHeaders(page),
              data: {
                institutionId: Number(data.schools[target].id),
                institutionOrderId: copied.id,
                createdBy: data.structure.userId,
                createdAt: new Date().toISOString(),
                orderItems: lines.map(({ product, quantity }) => ({
                  dictOrderItemId: product.id,
                  businessCode: product.businessCode,
                  quantity,
                })),
              },
            });
          await info.attach(`API kopii — ${name}`, {
            body: JSON.stringify({
              status: response.status(),
              sourceId: original.id,
              copyId: copied.id,
            }),
            contentType: "application/json",
          });
          expect(
            response.status(),
            "Ochrona kopii nie powinna powodować błędu serwera",
          ).toBeLessThan(500);
          const after = await data.snapshot();
          await info.attach(`Stan po próbie — ${name}`, {
            body: JSON.stringify({ before: baseline, after }),
            contentType: "application/json",
          });
          expect
            .soft(after, "Kopia, oryginał i pozostałe dokumenty pozostają bez zmian")
            .toEqual(baseline);
        });
      }
    },
  );
}
