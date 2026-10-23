import { expect } from "@playwright/test";
import { copyTestFor } from "./support/order-copy";
import { captureCopyAudit } from "./support/copy-change-audit";
import { openSchoolEditForm, cancelSchoolEdit } from "./support/school-edit";

function isolatedTest(kind: string) {
  return copyTestFor({ nodes: ["SP", "BSP"], relations: [["SP", "BSP"]] }).extend({
    copyNamespace: [
      async ({}, use, worker) => {
        const run = process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN?.replace(/-/g, "").slice(0, 12);
        if (!run) throw new Error("Brak izolacji danych zmiany statusu szkoły");
        await use(`${run}_${kind}_W${worker.parallelIndex}`);
      },
      { scope: "worker" },
    ],
  });
}
const readonlyTest = isolatedTest("TYPE");
readonlyTest(
  "ORD-SPEC-35980-24: typ i poziom istniejącej szkoły są nieedytowalne i nie zmieniają relacji ani zamówień @school @order @copy @structure @readonly @redmine-35980",
  async ({ copy: data, scenario }) => {
    await data.source("SP");
    const before = await data.snapshot();
    const edges = data.structure.edges(await data.structure.tree(data.schools.SP));
    await test.step("Typ szkoły: pola są tylko do odczytu po utworzeniu", async () => {
      await scenario.app.openPanel("school", data.schools.SP.id);
      const form = await openSchoolEditForm(scenario.app.page);
      for (const value of ["Szkoła podstawowa", "Szkoła Podstawowa"]) {
        const values = await form
          .locator("input[disabled]")
          .evaluateAll((elements) =>
            elements.map((element) => (element as HTMLInputElement).value),
          );
        expect(values).toContain(value);
      }
      await cancelSchoolEdit(form);
      expect(await data.snapshot()).toEqual(before);
      expect(data.structure.edges(await data.structure.tree(data.schools.SP))).toEqual(edges);
    });
  },
);

const test = isolatedTest("SUSP");
test("ORD-SPEC-35980-23: zawieszenie szkoły usuwa powiązane kopie bez usunięcia oryginałów @school @order @copy @structure @redmine-35980 @redmine-35990", async ({
  copy: data,
  scenario,
}, info) => {
  const { original, control, copyId } =
    await test.step("Zawieszenie: własny oryginał, kopia i niezależny dokument", async () => {
      const original = await data.source("SP");
      const control = await data.source("BSP");
      const before = await data.apis.BSP.orders();
      await data.save(await data.open("SP", original.id), "SP", original.id, ["BSP"]);
      const copies = (await data.apis.BSP.orders()).filter(
        (row) => !before.some((old) => old.id === row.id),
      );
      expect(copies).toHaveLength(1);
      expect(copies[0].isCopied).toBe(true);
      return { original, control, copyId: String(copies[0].id) };
    });
  const audit = await captureCopyAudit(scenario.app, data.schools.BSP);
  await test.step("Zawieszenie: potwierdzenie operacji w UI na własnej szkole", async () => {
    await scenario.app.openPanel("school", data.schools.BSP.id);
    await scenario.app.page.getByRole("button", { name: "Zawieś", exact: true }).click();
    const dialog = scenario.app.dialog("Zawieszanie szkoły");
    await expect(dialog).toBeVisible();
    const responsePromise = scenario.app.page.waitForResponse(
      (r) =>
        r.request().method() !== "GET" &&
        /^\/api\/(School|Institution)\//.test(new URL(r.url()).pathname),
    );
    await dialog.getByRole("button", { name: "Tak", exact: true }).click();
    expect((await responsePromise).ok()).toBe(true);
    await expect(dialog).toHaveCount(0);
  });
  await test.step("Zawieszenie: kopia znika, oba oryginały pozostają", async () => {
    await expect
      .poll(async () => (await data.apis.BSP.orders()).some((row) => String(row.id) === copyId))
      .toBe(false);
    expect(
      (await data.apis.SP.orders()).some((row) => String(row.id) === original.id && !row.isCopied),
    ).toBe(true);
    expect(
      (await data.apis.BSP.orders()).some((row) => String(row.id) === control.id && !row.isCopied),
    ).toBe(true);
    await info.attach("Zawieszenie — dane własne", {
      body: JSON.stringify({
        sourceId: original.id,
        controlId: control.id,
        copyId,
        schoolId: data.schools.BSP.id,
      }),
      contentType: "application/json",
    });
  });
  await test.step("Zawieszenie: audyt usunięcia kopii", async () => {
    await info.attach("Audyt zawieszenia i usunięcia kopii", {
      body: JSON.stringify(await audit.verify(copyId)),
      contentType: "application/json",
    });
  });
});
