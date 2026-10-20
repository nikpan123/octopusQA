import { test as accessTest, GRANTED, type AccessRecord } from "./support/entitlements";
import { expect } from "@playwright/test";
import { StructureApi } from "./support/school-structure-api";
import { liveOctopusHeaders } from "./support/live-auth";
import { OCTOPUS_BASE_URL } from "./support/environment";

const test = accessTest.extend({
  accessSchoolNamespace: async ({}, use, info) => {
    const run = process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN?.replace(/-/g, "").slice(0, 12);
    if (!run) throw new Error("Brak identyfikatora izolacji testów kopiowania i uprawnień.");
    await use(`COPY_${run}_P${info.parallelIndex}`);
  },
});
test.use({ accessTestFlags: { teacher: false, school: false } });

for (const [id, change] of [
  ["13", "brak kopii nie daje dostępu"],
  ["11", "usunięcie kopii"],
  ["12", "obniżenie ilości w oryginale"],
] as const) {
  const title =
    id === "13"
      ? "zamówienie źródła bez kopii nie daje ilości ani dostępu odbiorcy"
      : `kopia nadaje dostęp odbiorcy, a ${change} odbiera podstawę zamówieniową`;
  test(`ORD-SPEC-35980-${id}: ${title} @school @order @copy @entitlement @unmarked @redmine-35980`, async ({
    access: data,
    authSession,
  }, info) => {
    const [sourceSchool, targetSchool] = data.schools;
    const source = data.orders(sourceSchool),
      target = data.orders(targetSchool);
    const structure = new StructureApi(data.page.context().request, authSession);
    await structure.resolve(data.schools);
    for (const school of data.schools)
      expect(
        structure.edges(await structure.tree(school)),
        "Nie zmieniamy zastanych relacji szkół uprawnień",
      ).toEqual([]);
    expect(await source.orders(), "Własna szkoła źródłowa bez pozostałych zamówień").toEqual([]);
    expect(await target.orders(), "Własna szkoła docelowa bez pozostałych zamówień").toEqual([]);
    let relation: number | undefined;
    let copyId: string | undefined;
    try {
      relation = await structure.seed(sourceSchool, targetSchool, 1);
      const record = await data.create("Fizyka", ["7"], targetSchool);
      const current = async () => (await data.records()).find((row) => row.id === record.id)!;
      const details = (row: AccessRecord) => row.details.find((item) => item.class === "7 F+");
      const exported = async () =>
        (await data.export()).some(
          (assignment) =>
            assignment.subjectId === record.subjectId &&
            assignment.classes.some((item) => item.classLevel === 7),
        );
      await test.step("Bez zamówień i flag Testowy nie ma niezależnego przyznania dostępu", async () => {
        const before = await current();
        expect(before.accessStatus).not.toBe(GRANTED);
        expect(details(before)?.orderedCount).toBe(0);
        expect(await exported()).toBe(false);
      });
      const product = await source.product("F7P", [7]);
      const sourceId = await source.save([{ product, quantity: 31 }]);
      const sourceBefore = (await source.orders()).find((row) => String(row.id) === sourceId)!;
      if (id === "13") {
        await test.step("Brak kopii: zamówienie powiązanego źródła nie nalicza ilości ani dostępu odbiorcy", async () => {
          expect(await target.orders()).toEqual([]);
          await expect
            .poll(async () => ({
              count: details(await current())?.orderedCount,
              granted: (await current()).accessStatus === GRANTED,
            }))
            .toEqual({ count: 0, granted: false });
          expect(await exported()).toBe(false);
        });
        return;
      }
      const response = await data.page
        .context()
        .request.post(`${OCTOPUS_BASE_URL}/api/SchoolOrder/MakeSchoolOrderCopy`, {
          headers: await liveOctopusHeaders(data.page),
          data: {
            institutionOrderId: Number(sourceId),
            institutionUnitIdsCopyTo: [structure.unit(targetSchool)],
            createdBy: structure.userId,
          },
        });
      expect(response.ok()).toBe(true);
      const copies = (await target.orders()).filter((row) => row.isCopied);
      expect(copies).toHaveLength(1);
      copyId = String(copies[0].id);
      target.owned.add(copyId);
      await test.step("Kopia daje 31 sztuk przy progu 30 i przyznaje dostęp w placówce docelowej", async () => {
        await expect
          .poll(async () => ({
            count: details(await current())?.orderedCount,
            threshold: details(await current())?.threshold,
            status: (await current()).accessStatus,
          }))
          .toEqual({ count: 31, threshold: 30, status: GRANTED });
        await expect
          .poll(exported, { message: "Eksport faktycznie nadaje klasę 7 odbiorcy kopii" })
          .toBe(true);
      });
      if (id === "11") await target.remove(copyId);
      else await source.save([{ product, quantity: 29 }], sourceId);
      await test.step(`${change}: ponowne przeliczenie nie zachowuje nieaktualnego dostępu`, async () => {
        await expect
          .poll(async () => ({
            count: details(await current())?.orderedCount,
            granted: (await current()).accessStatus === GRANTED,
          }))
          .toEqual({ count: id === "11" ? 0 : 29, granted: false });
        await expect
          .poll(exported, {
            message: "Eksport odbiera klasę po utracie kwalifikującego zamówienia",
          })
          .toBe(false);
      });
      if (id === "11")
        expect((await source.orders()).find((row) => String(row.id) === sourceId)).toEqual(
          sourceBefore,
        );
      await info.attach("Uprawnienia zależne od kopii — bez niezależnej ścieżki Testowy", {
        body: JSON.stringify({
          sourceSchool,
          targetSchool,
          sourceId,
          copyId,
          record: await current(),
          rule: "SP 400 uczniów → próg cyfrowy 30, dane bieżącego roku; brak zamówień historycznych i decyzji BOK.",
        }),
        contentType: "application/json",
      });
    } finally {
      // Kopia musi zniknąć przed oryginałem i relacją. finish() sprząta własne źródło.
      for (const row of await target.orders())
        if (row.isCopied) {
          target.owned.add(String(row.id));
          await target.remove(String(row.id));
        }
      if (relation !== undefined) await structure.deactivate(relation);
    }
  });
}
