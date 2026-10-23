import { expect } from "@playwright/test";
import { copyTestFor } from "./support/order-copy";
import { captureCopyAudit } from "./support/copy-change-audit";
import {
  openStructureEditDialog,
  selectStructureEditValue,
  saveStructureEditDialog,
} from "./support/school-structure";

// Two own primary schools: do not edit school types or business reference data.
const test = copyTestFor({ nodes: ["SP", "BSP"], relations: [["SP", "BSP"]] });
const documents = (rows: Array<Record<string, unknown>>) =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(([key]) => key !== "institutionAllRelationInformation"),
    ),
  );

for (const [id, field, value] of [
  ["20", "hierarchy", "Nadrzędna"],
  ["21", "type", "Filia"],
  ["22", "type", "Wielobudynkowość"],
] as const) {
  test(`ORD-SPEC-35980-${id}: edycja relacji ${field} → ${value} przelicza kopie bez zmiany oryginałów @school @order @copy @structure @redmine-35980 @redmine-35990`, async ({
    copy: data,
    scenario,
  }, info) => {
    const { original, control, copyId, before, edge } =
      await test.step("Zmiana struktury: oryginał, kopia i niezależny dokument kontrolny", async () => {
        const original = await data.source("SP");
        const control = await data.source("BSP");
        // Distinct contents identify copies of the source, not the local control document.
        await data.apis.BSP.save(
          control.lines.map((line) => ({ ...line, quantity: 11 })),
          control.id,
        );
        const initial = await data.snapshot();
        await data.save(await data.open("SP", original.id), "SP", original.id, ["BSP"]);
        let copyId = "";
        await expect
          .poll(async () => {
            const added = (await data.apis.BSP.orders()).filter(
              (row) => !initial.BSP.some((old) => old.id === row.id),
            );
            if (added.length === 1) copyId = String(added[0].id);
            return added.length;
          })
          .toBe(1);
        expect(
          (await data.apis.BSP.orders()).find((row) => String(row.id) === copyId)?.isCopied,
        ).toBe(true);
        const edges = data.structure.edges(await data.structure.tree(data.schools.SP));
        expect(edges).toHaveLength(1);
        return { original, control, copyId, before: await data.snapshot(), edge: edges[0] };
      });
    const audit = await captureCopyAudit(scenario.app, data.schools.BSP);
    await test.step("Zmiana struktury: zapis nowego kształtu relacji w UI", async () => {
      const dialog = await openStructureEditDialog(scenario.app, data.schools.SP, data.schools.BSP);
      await selectStructureEditValue(scenario.app, dialog, field, value);
      await saveStructureEditDialog(scenario.app, dialog);
      const expected =
        field === "hierarchy"
          ? { id: edge.id, parent: edge.child, child: edge.parent, type: edge.type }
          : { ...edge, type: value === "Filia" ? 2 : 3 };
      await expect
        .poll(async () => data.structure.edges(await data.structure.tree(data.schools.SP)))
        .toEqual([expected]);
    });
    await test.step("Zmiana struktury: aktualne kopie i nienaruszone oryginały", async () => {
      const initialState = await data.snapshot();
      await info.attach("Stan dokumentów po edycji relacji", {
        body: JSON.stringify({
          field,
          value,
          previousCopyId: copyId,
          documents: Object.fromEntries(
            data.nodes.map((node) => [
              node,
              initialState[node].map((row) => ({
                id: row.id,
                isCopied: row.isCopied,
                items: row.orderItems,
              })),
            ]),
          ),
        }),
        contentType: "application/json",
      });
      // User correction: relation edits remove copies; recreating one is a separate manual action.
      await expect
        .poll(async () => (await data.apis.BSP.orders()).filter((row) => row.isCopied))
        .toEqual([]);
      if (value === "Wielobudynkowość") {
        const contents = (items: (typeof before.SP)[number]["orderItems"]) =>
          items
            .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
            .sort((a, b) => a.id - b.id);
        const expectedItems = contents(
          before.SP.find((row) => String(row.id) === original.id)!.orderItems,
        );
        // Keep the manual action visible inside the combined scenario/report stage.
        // eslint-disable-next-line playwright/no-nested-step
        await test.step("Zmiana struktury: ponowne ręczne utworzenie kopii po zmianie relacji", async () => {
          await data.save(await data.open("SP", original.id), "SP", original.id, ["BSP"]);
          await expect
            .poll(async () =>
              (await data.apis.BSP.orders())
                .filter((row) => row.isCopied)
                .map((row) => contents(row.orderItems)),
            )
            .toEqual([expectedItems]);
        });
      }
      expect(documents((await data.apis.SP.orders()).filter((row) => !row.isCopied))).toEqual(
        documents(before.SP.filter((row) => !row.isCopied)),
      );
      const rows = await data.apis.BSP.orders();
      expect(rows.some((row) => String(row.id) === control.id)).toBe(true);
      expect(documents(rows.filter((row) => !row.isCopied))).toEqual(
        documents(before.BSP.filter((row) => !row.isCopied)),
      );
      // Copy identifiers are not used as an oracle for creation versus reactivation.
      await info.attach("Skutki edycji relacji", {
        body: JSON.stringify({
          originalId: original.id,
          controlId: control.id,
          previousCopyId: copyId,
          copyIdMayBeReused: value === "Wielobudynkowość",
          field,
          value,
          currentIds: rows.map((row) => row.id),
        }),
        contentType: "application/json",
      });
    });
    await test.step("Zmiana struktury: audyt usunięcia kopii", async () => {
      await info.attach("Audyt usunięcia kopii po edycji", {
        body: JSON.stringify(await audit.verify(copyId)),
        contentType: "application/json",
      });
    });
  });
}
