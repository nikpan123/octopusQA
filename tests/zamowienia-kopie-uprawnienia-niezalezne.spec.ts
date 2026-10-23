import { expect } from "@playwright/test";
import {
  test as accessTest,
  GRANTED,
  ACCESS_YEAR,
  type AccessRecord,
} from "./support/entitlements";
import { StructureApi } from "./support/school-structure-api";
import { liveOctopusHeaders } from "./support/live-auth";

const test = accessTest.extend({
  accessSchoolNamespace: async ({}, use, info) => {
    const run = process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN?.replace(/-/g, "").slice(0, 12);
    if (!run) throw new Error("Brak izolacji testów niezależnych uprawnień");
    await use(`COPY_RIGHT_${run}_P${info.parallelIndex}`);
  },
});
test.use({
  accessTestFlags: { teacher: false, school: false },
  accessTeacherSchools: "target",
  accessSchoolCount: 2,
});

for (const [id, mode] of [
  ["25", "BOK nadaje"],
  ["26", "BOK odmawia"],
  ["27", "lokalne zamówienie"],
  ["28", "inny przedmiot"],
  ["29", "inny rok"],
] as const) {
  test(`ORD-SPEC-35980-${id}: kopia i niezależna podstawa — ${mode} @school @order @copy @entitlement @redmine-35980`, async ({
    access: data,
    authSession,
  }, info) => {
    const [sourceSchool, targetSchool] = data.schools;
    const source = data.orders(sourceSchool),
      target = data.orders(targetSchool);
    const structure = new StructureApi(data.page.context().request, authSession);
    await structure.resolve(data.schools);
    for (const school of data.schools)
      expect(structure.edges(await structure.tree(school))).toEqual([]);
    expect(await source.orders()).toEqual([]);
    expect(await target.orders()).toEqual([]);
    let relation: number | undefined;
    let record: AccessRecord;
    let sourceId: string | undefined;
    let copyId: string | undefined;
    let previousId: number | undefined;
    const current = async () => (await data.records()).find((row) => row.id === record.id)!;
    const exported = async (subjectId: number, year = ACCESS_YEAR) =>
      (await data.export(year)).some(
        (row) =>
          row.subjectId === subjectId &&
          row.classes.some((item) => item.classLevel === (subjectId === 4 ? 7 : 4)),
      );
    try {
      await test.step("Uprawnienia niezależne: potwierdzenie odbiorcy i własne źródło", async () => {
        relation = await structure.seed(sourceSchool, targetSchool, 1);
        if (mode === "inny rok") {
          const declaration = await data.club.create(data.teacherId, targetSchool.id, true, {
            subject: "Fizyka",
            classes: ["7"],
            year: `${ACCESS_YEAR - 1}/${ACCESS_YEAR}`,
          });
          previousId = Number(declaration.confirmationId);
        }
        record = await data.create("Fizyka", ["7"], targetSchool);
        const product = await source.product("F7P", [7]);
        sourceId = await source.save([{ product, quantity: 31 }]);
      });
      let math: AccessRecord | undefined;
      await test.step("Uprawnienia niezależne: przygotowanie odrębnej podstawy BOK, lokalnej, przedmiotu lub roku", async () => {
        if (mode === "BOK nadaje" || mode === "BOK odmawia") {
          const boxes = (await data.checkboxes(record)).filter(
            (item) =>
              item.schoolId === Number(targetSchool.id) &&
              item.class === 7 &&
              item.scopeId === 4 &&
              item.isOur,
          );
          expect(boxes).toHaveLength(1);
          await data.decide(record, mode === "BOK nadaje" ? boxes : []);
        } else if (mode === "lokalne zamówienie") {
          await target.save([{ product: await target.product("F7P", [7]), quantity: 31 }]);
        } else if (mode === "inny przedmiot") {
          math = await data.create("Matematyka", ["4"], targetSchool);
          expect(math.accessStatus).not.toBe(GRANTED);
        }
      });
      await test.step("Uprawnienia niezależne: rzeczywista kopia 31 sztuk w szkole odbiorcy", async () => {
        const response = await data.page
          .context()
          .request.post("/api/SchoolOrder/MakeSchoolOrderCopy", {
            headers: await liveOctopusHeaders(data.page),
            data: {
              institutionOrderId: Number(sourceId!),
              institutionUnitIdsCopyTo: [structure.unit(targetSchool)],
              createdBy: structure.userId,
            },
          });
        expect(response.ok()).toBe(true);
        const copies = (await target.orders()).filter((row) => row.isCopied);
        expect(copies).toHaveLength(1);
        copyId = String(copies[0].id);
        target.owned.add(copyId);
        expect(
          copies[0].orderItems.map((item) => ({
            id: item.dictOrderItemId,
            quantity: item.quantity,
          })),
        ).toEqual([{ id: 3005, quantity: 31 }]);
      });
      await test.step("Uprawnienia niezależne: zmiana kopii respektuje odrębną podstawę i eksport", async () => {
        if (mode === "BOK nadaje") {
          await target.remove(copyId!);
          await expect.poll(async () => (await current()).accessStatus).toBe(GRANTED);
          await expect.poll(() => exported(4)).toBe(true);
        } else if (mode === "BOK odmawia") {
          expect((await current()).accessStatus).not.toBe(GRANTED);
          expect(await exported(4)).toBe(false);
        } else if (mode === "lokalne zamówienie") {
          // Remove the copied basis completely, leaving only the local original.
          await source.remove(sourceId!);
          await expect
            .poll(async () => (await target.orders()).filter((row) => row.isCopied).length)
            .toBe(0);
          await expect
            .poll(async () => {
              const row = await current();
              return {
                count: row.details.find((item) => item.class === "7 F+")?.orderedCount,
                status: row.accessStatus,
              };
            })
            .toEqual({ count: 31, status: GRANTED });
          expect(await exported(4)).toBe(true);
        } else if (mode === "inny przedmiot") {
          const actual = (await data.records()).find((row) => row.id === math!.id)!;
          expect(actual.accessStatus).not.toBe(GRANTED);
          expect(actual.details.find((item) => item.class.startsWith("4"))?.orderedCount).toBe(0);
          expect(await exported(math!.subjectId)).toBe(false);
        } else {
          // The Uprawnienia list exposes the current year only. Do not invent a
          // historical row there; verify the saved prior-year form and year-specific export.
          const forms = await data.get<Array<{ id: number; year: number; isDel: boolean }>>(
            `/api/TeacherFormClub/${data.teacherId}`,
          );
          expect(forms.find((form) => form.id === previousId)).toMatchObject({
            year: ACCESS_YEAR - 1,
            isDel: false,
          });
          expect(String((await current()).schoolYear)).toMatch(
            new RegExp(`^${ACCESS_YEAR}(?:/${ACCESS_YEAR + 1})?$`),
          );
          expect(
            await data.export(ACCESS_YEAR - 1),
            "Kopia bieżącego roku nie nadaje żadnych klas w poprzednim roku",
          ).toEqual([]);
        }
        await info.attach("Niezależna podstawa i eksport", {
          body: JSON.stringify({
            mode,
            teacherId: data.teacherId,
            sourceId,
            copyId,
            records: await data.records(),
            currentExport: await data.export(),
          }),
          contentType: "application/json",
        });
      });
    } finally {
      await test.step("Uprawnienia niezależne: sprzątanie własnych kopii i relacji", async () => {
        for (const row of await target.orders())
          if (row.isCopied) {
            target.owned.add(String(row.id));
            await target.remove(String(row.id));
          }
        if (relation !== undefined) await structure.deactivate(relation);
      });
    }
  });
}
