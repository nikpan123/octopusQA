import { expect, type Locator } from "@playwright/test";
import { test as base } from "./scenario";
import { OrderClassApi } from "./order-class";
import { StructureApi } from "./school-structure-api";
<<<<<<< Updated upstream
import { ensureStructureTestSchools } from "./school-structure-data";
=======
import { ensureStructureTestSchools, type StructureSchoolKey } from "./school-structure-data";
>>>>>>> Stashed changes
import { liveOctopusHeaders } from "./live-auth";
import { openOrders, orderRow } from "./order";
import type { StructureSchool } from "./school-structure";
import {
  COPY_KEYS,
  FULL_COPY_PLAN,
  validateCopyPlan,
  type CopyPlan,
  type CopyNode,
} from "./copy-plan.mjs";
export { copyPairPlan, ISOLATION_COPY_PLAN, STANDALONE_COPY_PLAN } from "./copy-plan.mjs";
export type { CopyNode } from "./copy-plan.mjs";

<<<<<<< Updated upstream
export const test = base.extend<{ copy: CopyData; copyPlan: CopyPlan }>({
  copyPlan: [FULL_COPY_PLAN, { option: true }],
  copy: [
    async ({ page, scenario, authSession, copyPlan }, use, info) => {
=======
export const test = base.extend<
  {
    copy: CopyData;
    copyPlan: CopyPlan;
    copySchoolKeys: Record<CopyNode, StructureSchoolKey>;
  },
  { copyNamespace: string }
>({
  copyNamespace: [
    async ({}, use, worker) => {
      const run = process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN?.replace(/-/g, "").slice(0, 12);
      if (!run) throw new Error("Brak identyfikatora uruchomienia do izolacji szkół kopiowania.");
      await use(`${run}_W${worker.parallelIndex}`);
    },
    { scope: "worker" },
  ],
  copyPlan: [FULL_COPY_PLAN, { option: true }],
  copySchoolKeys: [COPY_KEYS, { option: true }],
  copy: [
    async ({ page, scenario, authSession, copyPlan, copySchoolKeys, copyNamespace }, use, info) => {
>>>>>>> Stashed changes
      const { nodes, relations: plannedRelations } = validateCopyPlan(copyPlan);
      const entries =
        await test.step(`Przygotowanie: tylko wymagane placówki ${nodes.join(", ")} (${nodes.length})`, () =>
          ensureStructureTestSchools(
            page,
            scenario.app,
<<<<<<< Updated upstream
            nodes.map((node) => COPY_KEYS[node]),
          ));
      const schools = Object.fromEntries(
        nodes.map((node) => [node, entries[COPY_KEYS[node]]!]),
=======
            nodes.map((node) => copySchoolKeys[node]),
            copyNamespace,
          ));
      const schools = Object.fromEntries(
        nodes.map((node) => [node, entries[copySchoolKeys[node]]!]),
>>>>>>> Stashed changes
      ) as Record<CopyNode, StructureSchool>;
      const structure = new StructureApi(page.context().request, authSession);
      await structure.resolve(Object.values(schools));
      for (const school of Object.values(schools))
        expect(
          structure.edges(await structure.tree(school)),
<<<<<<< Updated upstream
          "Nie zmieniamy pozostałości ani obcych relacji",
=======
          `Przygotowanie kopiowania: szkoła ${school.name} (${school.id}) musi być bez relacji. Nie usuwamy zastanych powiązań.`,
>>>>>>> Stashed changes
        ).toEqual([]);
      const apis = Object.fromEntries(
        nodes.map((node) => [
          node,
          new OrderClassApi(
            page.context().request,
            {},
            structure.userId,
            schools[node],
            scenario,
            () => liveOctopusHeaders(page),
            node === "A" || node === "B",
          ),
        ]),
      ) as Record<CopyNode, OrderClassApi>;
      const before = new Map<CopyNode, Set<string>>();
      const relations: number[] = [];
      for (const node of nodes)
        before.set(node, new Set((await apis[node].orders()).map((row) => String(row.id))));
      const snapshot = async () =>
        Object.fromEntries(
          await Promise.all(nodes.map(async (node) => [node, await apis[node].orders()])),
        ) as Record<CopyNode, Awaited<ReturnType<OrderClassApi["orders"]>>>;
      try {
        for (const [parent, child] of plannedRelations)
          relations.push(await structure.seed(schools[parent], schools[child], 1));
        await info.attach("Zakres przygotowania danych", {
<<<<<<< Updated upstream
          body: JSON.stringify({ nodes, relations: plannedRelations }),
=======
          body: JSON.stringify({
            nodes,
            namespace: copyNamespace,
            schools: Object.fromEntries(
              nodes.map((node) => [
                node,
                {
                  ...schools[node],
                  institutionUnitId: structure.unit(schools[node]),
                },
              ]),
            ),
            relations: plannedRelations,
            cleanup:
              "Wyłącznie dokumenty i relacje utworzone przez bieżący test; zastane powiązania pozostają nietknięte.",
          }),
>>>>>>> Stashed changes
          contentType: "application/json",
        });
        await use({
          nodes,
          schools,
          apis,
          structure,
          snapshot,
          async source(node) {
            expect(nodes, "Źródło musi należeć do planu testu").toContain(node);
            return test.step(`Przygotowanie API: oryginalne zamówienie w ${node}, dwa produkty i różne ilości`, async () => {
              const api = apis[node];
              const lines = [
                { product: await api.product("F7P", [7]), quantity: 3 },
                { product: await api.product("4P-2", [4]), quantity: 2 },
              ];
              const id = await api.save(lines);
              return { id, lines };
            });
          },
          async open(node, id) {
            expect(nodes, "Źródło kopiowania musi należeć do planu testu").toContain(node);
            await scenario.app.openPanel("school", schools[node].id);
            const panel = await openOrders(page);
            await orderRow(panel, id).click();
            await expect(panel.getByRole("button", { name: "Kopiuj", exact: true })).toBeEnabled();
            await panel.getByRole("button", { name: "Kopiuj", exact: true }).click();
            const dialog = page.locator("app-school-copy-order-dialog");
            await expect(dialog).toBeVisible();
            return dialog;
          },
          async save(dialog, source, id, targets) {
            expect(nodes, "Źródło i wszystkie cele muszą należeć do planu testu").toEqual(
              expect.arrayContaining([source, ...targets]),
            );
            await test.step(`UI: wybór celów ${targets.join(", ")} i zapis kopii`, async () => {
              for (const target of targets) {
                const row = copyTargetRow(dialog, schools[target]);
                await expect(row).toHaveCount(1);
                await row.getByRole("gridcell").first().click();
                await expect(
                  dialog
                    .locator(".copy-order-dialog__selected-grid")
                    .getByRole("gridcell", { name: schools[target].id, exact: true }),
                ).toHaveCount(1);
              }
              const response = page.waitForResponse(
                (r) =>
                  r.request().method() === "POST" &&
                  /\/(?:SchoolOrder\/MakeSchoolOrderCopy|SchoolComplexOrder\/MakeSchoolComplexOrderCopy)$/.test(
                    new URL(r.url()).pathname,
                  ),
              );
              await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
              const saved = await response;
              expect(saved.ok(), `Zapis kopii HTTP ${saved.status()}`).toBe(true);
              expect(saved.request().postDataJSON()).toEqual({
                institutionOrderId: Number(id),
                institutionUnitIdsCopyTo: targets.map((node) => structure.unit(schools[node])),
                createdBy: structure.userId,
              });
              await expect(dialog).toHaveCount(0);
              await scenario.record("orderCopy", JSON.stringify({ source, id, targets }));
            });
          },
          async panel(node) {
            expect(nodes, "Panel musi należeć do planu testu").toContain(node);
            await scenario.app.openPanel("school", schools[node].id);
            return openOrders(page);
          },
<<<<<<< Updated upstream
=======
          async unlink(parent, child) {
            const edge = structure
              .edges(await structure.tree(schools[parent]))
              .find(
                (item) =>
                  item.parent === structure.unit(schools[parent]) &&
                  item.child === structure.unit(schools[child]),
              );
            expect(
              edge,
              "Usuwamy tylko bezpośrednią relację przygotowaną przez ten test",
            ).toBeDefined();
            expect(relations).toContain(edge!.id);
            await structure.deactivate(edge!.id);
            relations.splice(relations.indexOf(edge!.id), 1);
          },
>>>>>>> Stashed changes
        });
      } finally {
        const cleanup = async () => {
          const errors: unknown[] = [];
          // Najpierw zbieramy wszystkie własne nowe dokumenty, następnie usuwamy
          // kopie ze wszystkich placówek PRZED źródłami (także SP → A).
          const addedOrders: Array<{ node: CopyNode; id: string; isCopied: boolean }> = [];
          for (const node of [...nodes].reverse()) {
            try {
              const added = (await apis[node].orders()).filter(
                (row) => !before.get(node)!.has(String(row.id)),
              );
              for (const row of added) {
                addedOrders.push({ node, id: String(row.id), isCopied: Boolean(row.isCopied) });
              }
            } catch (error) {
              errors.push(error);
            }
          }
          for (const row of addedOrders.sort((a, b) => Number(b.isCopied) - Number(a.isCopied))) {
            try {
              apis[row.node].owned.add(row.id);
              await apis[row.node].remove(row.id);
            } catch (error) {
              errors.push(error);
            }
          }
          for (const id of relations.reverse()) {
            try {
              await structure.deactivate(id);
            } catch (error) {
              errors.push(error);
            }
          }
          if (errors.length) throw errors[0];
        };
        await cleanup();
      }
    },
    { timeout: 240000 },
  ],
});

export function copyTestFor(plan: CopyPlan) {
  validateCopyPlan(plan);
  return test.extend({ copyPlan: plan });
}

export type CopyData = {
  nodes: CopyNode[];
  schools: Record<CopyNode, StructureSchool>;
  apis: Record<CopyNode, OrderClassApi>;
  structure: StructureApi;
  snapshot: () => Promise<Record<CopyNode, Awaited<ReturnType<OrderClassApi["orders"]>>>>;
  source: (node: CopyNode) => Promise<{
    id: string;
    lines: Array<{ product: Awaited<ReturnType<OrderClassApi["product"]>>; quantity: number }>;
  }>;
  open: (node: CopyNode, id: string) => Promise<Locator>;
  save: (dialog: Locator, source: CopyNode, id: string, targets: CopyNode[]) => Promise<void>;
  panel: (node: CopyNode) => Promise<Locator>;
<<<<<<< Updated upstream
=======
  unlink: (parent: CopyNode, child: CopyNode) => Promise<void>;
>>>>>>> Stashed changes
};

export function copyTargetRow(dialog: Locator, school: StructureSchool) {
  return dialog
    .locator(".copy-order-dialog__relations-grid")
    .getByRole("row")
    .filter({ has: dialog.page().getByRole("gridcell", { name: school.id, exact: true }) });
}

export async function expectCopy(
  data: CopyData,
  before: Awaited<ReturnType<CopyData["snapshot"]>>,
  source: CopyNode,
  id: string,
  targets: CopyNode[],
) {
  await test.step("Porównanie API: nowe kopie tylko u wybranych odbiorców, identyczne produkty i ilości, oryginał bez zmian", async () => {
    expect(data.nodes, "Nie wolno pominąć kontroli celu przez zbyt mały plan danych").toEqual(
      expect.arrayContaining([source, ...targets]),
    );
    const original = before[source].find((row) => String(row.id) === id)!;
    for (const node of data.nodes) {
      const rows = await data.apis[node].orders();
      const added = rows.filter((row) => !before[node].some((old) => old.id === row.id));
      expect(added, `Liczba nowych zamówień w ${node}`).toHaveLength(
        targets.includes(node) ? 1 : 0,
      );
      if (targets.includes(node)) {
        expect(added[0].isCopied, `Oznaczenie kopii w ${node}`).toBe(true);
        expect(
          added[0].orderItems
            .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
            .sort((a, b) => a.id - b.id),
        ).toEqual(
          original.orderItems
            .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
            .sort((a, b) => a.id - b.id),
        );
      }
      for (const old of before[node])
        expect(
          rows.find((row) => row.id === old.id),
          `Nie zmieniono istniejącego zamówienia ${node}/${old.id}`,
        ).toEqual(old);
    }
  });
}
