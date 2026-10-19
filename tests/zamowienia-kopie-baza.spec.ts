import { expect, type TestInfo } from "@playwright/test";
import { copyTestFor, copyPairPlan, type CopyData } from "./support/order-copy";
import { deleteOrder, openOrders, orderRow } from "./support/order";
import { probeSchoolOrderDatabase, readSchoolOrder } from "../scripts/school-order-db.mjs";

const test = copyTestFor(copyPairPlan("SP", "LO"));

async function prepareCopy(data: CopyData) {
  await test.step("SQL tylko do odczytu: baza DEV i kolumny IsDel oraz IsCopied", () =>
    probeSchoolOrderDatabase());
  const sourceId =
    await test.step("Przygotowanie: jeden własny oryginał, jeden produkt, dwie placówki i jedna relacja", async () => {
      const product = await data.apis.SP.product("F7P", [7]);
      return data.apis.SP.save([{ product, quantity: 3 }]);
    });
  const original = (await data.apis.SP.orders()).find((row) => String(row.id) === sourceId)!;
  const sourceBefore = await readSchoolOrder(sourceId, data.schools.SP.id);
  await test.step("SQL PRZED kopiowaniem: oryginał ma IsDel=0 i IsCopied=0", async () => {
    expect(sourceBefore).toEqual({
      id: Number(sourceId),
      schoolId: Number(data.schools.SP.id),
      isDel: false,
      isCopied: false,
    });
  });
  const targetBefore = new Set((await data.apis.LO.orders()).map((row) => String(row.id)));
  const dialog = await data.open("SP", sourceId);
  await data.save(dialog, "SP", sourceId, ["LO"]);
  const copy =
    await test.step("API: identyfikacja dokładnie jednej nowej kopii własnego zamówienia", async () => {
      await expect
        .poll(
          async () =>
            (await data.apis.LO.orders()).filter((row) => !targetBefore.has(String(row.id))).length,
        )
        .toBe(1);
      const row = (await data.apis.LO.orders()).find((row) => !targetBefore.has(String(row.id)))!;
      expect(row.isCopied).toBe(true);
      const items = (rows: typeof row.orderItems) =>
        rows
          .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
          .sort((a, b) => a.id - b.id);
      expect(items(row.orderItems)).toEqual(items(original.orderItems));
      expect(String(row.id)).not.toBe(sourceId);
      return row;
    });
  return { sourceId, copyId: String(copy.id), original, sourceBefore };
}

async function attachProof(info: TestInfo, data: unknown) {
  await info.attach("SQL — dowód flag oryginału i kopii", {
    body: JSON.stringify({
      database: "GWO_CRMDEV",
      table: "dbo.SchoolOrder",
      note: "SQL wyłącznie SELECT; kopiowanie i usuwanie przez UI.",
      data,
    }),
    contentType: "application/json",
  });
}

test("ORD-DB-02: kopia zamówienia ma w bazie IsCopied=1, a oryginał IsCopied=0 @school @order @copy @database", async ({
  copy: data,
}, info) => {
  test.setTimeout(180000);
  const prepared = await prepareCopy(data);
  let copyRow;
  let sourceAfter;
  try {
    await test.step("SQL: kopia ma własne ID, szkołę docelową, IsCopied=1 oraz IsDel=0", async () => {
      await expect
        .poll(async () => {
          copyRow = await readSchoolOrder(prepared.copyId, data.schools.LO.id);
          return copyRow;
        })
        .toEqual({
          id: Number(prepared.copyId),
          schoolId: Number(data.schools.LO.id),
          isCopied: true,
          isDel: false,
        });
    });
    await test.step("SQL i API: utworzenie kopii nie zmienia flag ani treści oryginału", async () => {
      sourceAfter = await readSchoolOrder(prepared.sourceId, data.schools.SP.id);
      expect(sourceAfter).toEqual(prepared.sourceBefore);
      expect(
        (await data.apis.SP.orders()).find((row) => String(row.id) === prepared.sourceId),
      ).toEqual(prepared.original);
    });
  } finally {
    await attachProof(info, { sourceBefore: prepared.sourceBefore, sourceAfter, copy: copyRow });
  }
});

test("ORD-DB-03: usunięcie kopii zachowuje IsDel=1 i IsCopied=1, bez usuwania oryginału @school @order @copy @database @soft-delete", async ({
  copy: data,
  page,
}, info) => {
  test.setTimeout(180000);
  const prepared = await prepareCopy(data);
  const copyBefore = await readSchoolOrder(prepared.copyId, data.schools.LO.id);
  let copyAfter;
  let sourceAfter;
  try {
    await test.step("SQL PRZED usunięciem: kopia istnieje z IsCopied=1 i IsDel=0", async () => {
      expect(copyBefore).toEqual({
        id: Number(prepared.copyId),
        schoolId: Number(data.schools.LO.id),
        isCopied: true,
        isDel: false,
      });
    });
    await test.step("UI: Usuń dotyczy wyłącznie własnej kopii w placówce docelowej", async () => {
      await data.panel("LO");
      expect(await deleteOrder(page, prepared.copyId)).toBe("DELETED");
      data.apis.LO.owned.delete(prepared.copyId);
    });
    await test.step("UI i API po odświeżeniu: kopia nie występuje na głównej liście", async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      const panel = await openOrders(page);
      await expect(orderRow(panel, prepared.copyId)).toHaveCount(0);
      await expect
        .poll(async () =>
          (await data.apis.LO.orders()).some((row) => String(row.id) === prepared.copyId),
        )
        .toBe(false);
    });
    await test.step("SQL PO: rekord kopii pozostaje z IsDel=1 i zachowuje IsCopied=1", async () => {
      await expect
        .poll(
          async () => {
            copyAfter = await readSchoolOrder(prepared.copyId, data.schools.LO.id);
            return copyAfter;
          },
          {
            timeout: 15000,
            message: "Usunięcie kopii musi być logiczne, bez utraty flagi IsCopied",
          },
        )
        .toEqual({ ...copyBefore, isDel: true });
    });
    await test.step("SQL, API i UI: oryginał nadal istnieje, ma IsDel=0 i niezmienioną treść", async () => {
      sourceAfter = await readSchoolOrder(prepared.sourceId, data.schools.SP.id);
      expect(sourceAfter).toEqual(prepared.sourceBefore);
      expect(
        (await data.apis.SP.orders()).find((row) => String(row.id) === prepared.sourceId),
      ).toEqual(prepared.original);
      const panel = await data.panel("SP");
      await expect(orderRow(panel, prepared.sourceId)).toHaveCount(1);
    });
  } finally {
    await attachProof(info, {
      sourceBefore: prepared.sourceBefore,
      sourceAfter,
      copyBefore,
      copyAfter,
    });
  }
});
