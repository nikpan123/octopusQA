import type { Page } from "@playwright/test";
import type { AuthSession } from "../scripts/auth.mjs";

import { test, expect } from "./support/fixtures";

import { GOLD_SCHOOL, NO_MEDAL_SCHOOL, SILVER_SCHOOL } from "./support/school-medal-data";
import {
  addStructureSchoolCandidate,
  createStructureRelation,
  deleteStructureRelation,
  dismissWarning,
  expectStructureRelationVisible,
  expectStructureSchoolResult,
  expectVisibleStructureAddressesContain,
  fillStructureSearch,
  openSchoolStructure,
  openSchoolStructureDialog,
  openStructureResults,
  removeStructureSchoolCandidate,
  readStructureRelationId,
  readStructureHistory,
  expectStructureHistoryEntry,
  openStructureEditDialog,
  selectStructureEditValue,
  saveStructureEditDialog,
  selectStructureRelationCell,
  structureRelatedSchools,
  structureRelatedSchoolRow,
  structurePanelSchoolRow,
  structureSearchField,
  structureSearchResults,
  structureSchoolRow,
  submitStructureSearch,
} from "./support/school-structure";
import {
  ensureStructureTestSchools,
  ensureInactiveStructureSchool,
  type StructureSchoolKey,
} from "./support/school-structure-data";
import { StructureApi } from "./support/school-structure-api";
import type { StructureSchool } from "./support/school-structure";
import { Octopus } from "./support/octopus";
import { createSimpleOrder } from "./support/order-scenario";
import { openOrders, getOrderIds, deleteOrder } from "./support/order";
import { ORDER_PRODUCTS } from "./data/order-product-data";

type StructureSaveItem = {
  institutionRelationId: number | null;
  sourceInstitutionUnitId: number;
  linkedInstitutionUnitId: number;
  institutionRelationTypeId: number;
  createdBy: number;
};

async function withStructureGraph(
  page: Page,
  authSession: AuthSession,
  keys: StructureSchoolKey[],
  action: (
    api: StructureApi,
    schools: Record<StructureSchoolKey, StructureSchool>,
    app: Octopus,
  ) => Promise<void>,
) {
  const app = new Octopus(page);
  const schools = (await ensureStructureTestSchools(page, app, keys)) as Record<
    StructureSchoolKey,
    StructureSchool
  >;
  const owned = keys.map((key) => schools[key]);
  const api = new StructureApi(page.context().request, authSession);
  await api.resolve(owned);
  await api.cleanup(owned);
  await action(api, schools, app).finally(async () => {
    try {
      await api.cleanup(owned);
    } catch (error) {
      test.fail(false);
      throw error;
    }
  });
}

async function mockStructureSave(page: Page, status = 200) {
  const payloads: StructureSaveItem[][] = [];

  await page.route("**/api/Institution/AddOrUpdateInstitutionRelations", async (route) => {
    const body = route.request().postDataJSON() as StructureSaveItem[];
    payloads.push(body);
    await route.fulfill({
      status,
      contentType: "application/json",
      body: status >= 200 && status < 300 ? "true" : JSON.stringify({ status }),
    });
  });

  return payloads;
}

async function prepareStructureRelation(
  page: Page,
  app: Octopus,
  dialog: ReturnType<Octopus["dialog"]>,
  school: StructureSchool,
  type: "Zespół szkół" | "Filia" | "Wielobudynkowość",
  hierarchy: "Nadrzędna" | "Podrzędna",
) {
  await fillStructureSearch(app, dialog, { id: school.id });
  await submitStructureSearch(dialog);
  const row = await addStructureSchoolCandidate(dialog, school);
  await selectStructureRelationCell(page, row, "type", type);
  await selectStructureRelationCell(page, row, "hierarchy", hierarchy);
  return row;
}

test.describe("Struktura szkoły", () => {
  // Przypadki zapisu współdzielą dedykowane szkoły, więc muszą działać kolejno.
  test.describe.configure({ mode: "default" });
  test("STR-01: szkoła bez relacji pokazuje pusty stan struktury @school @structure @smoke", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const panel = await openSchoolStructure(app, NO_MEDAL_SCHOOL);

    await expect(panel.getByText("Brak struktury organizacyjnej.", { exact: true })).toBeVisible();
  });

  test("STR-02: pusty stan blokuje filtrowanie struktury i pozwala dodać powiązanie @school @structure @validation", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const panel = await openSchoolStructure(app, NO_MEDAL_SCHOOL);

    await expect(
      panel.getByRole("button", { name: "Pokaż zaznaczone", exact: true }),
    ).toBeDisabled();
    await expect(
      panel.getByRole("button", { name: "Pokaż wszystkie", exact: true }),
    ).toBeDisabled();
    await expect(
      panel.getByRole("button", { name: "Dodaj powiązanie", exact: true }),
    ).toBeEnabled();
  });

  test("STR-03: dialog dodawania zawiera filtry, obie tabele i akcje @school @structure @dialog", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    for (const label of ["ID szkoły", "Nazwa szkoły", "Kod pocztowy", "Miejscowość", "Ulica"]) {
      await expect(
        structureSearchField(dialog, label),
        `Dialog powinien zawierać pole „${label}”`,
      ).toBeVisible();
    }

    const results = structureSearchResults(dialog);
    for (const header of ["Dodaj", "ID", "Poziom", "Nazwa Szkoły", "Adres Szkoły"]) {
      await expect(results.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }

    const related = structureRelatedSchools(dialog);
    for (const header of [
      "Usuń",
      "ID",
      "Poziom",
      "Nazwa szkoły",
      "Adres Szkoły",
      "Typ relacji",
      "Hierarchia",
    ]) {
      await expect(related.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }

    await expect(dialog.getByRole("button", { name: "Szukaj", exact: true })).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Anuluj", exact: true })).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeVisible();
  });

  test("STR-04: puste wyszukiwanie pokazuje walidację i pozostawia dialog otwarty @school @structure @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await submitStructureSearch(dialog);
    await dismissWarning(page, "Wyszukiwanie nie może być puste");
    await expect(dialog).toBeVisible();
  });

  test("STR-05: anulowanie pustego dialogu nie zmienia struktury @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);

    const panel = page.getByRole("tabpanel", { name: "Struktura", exact: true });
    await expect(panel.getByText("Brak struktury organizacyjnej.", { exact: true })).toBeVisible();
  });

  test("STR-06: wyszukiwanie po dokładnym ID zwraca właściwą szkołę @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, GOLD_SCHOOL);
  });

  test("STR-07: wyszukiwanie po pełnej nazwie zwraca właściwą szkołę @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { name: SILVER_SCHOOL.name });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, SILVER_SCHOOL);
  });

  test("STR-08: wyszukiwanie po fragmencie nazwy zwraca pasującą szkołę @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    const nameFragment = GOLD_SCHOOL.name.split(" ").slice(0, 3).join(" ");

    await fillStructureSearch(app, dialog, { name: nameFragment });
    await submitStructureSearch(dialog);

    const rows = structureSearchResults(dialog).getByRole("row");
    await expect.poll(() => rows.count()).toBeGreaterThan(1);

    const count = await rows.count();
    for (let index = 1; index < count; index += 1) {
      await expect(rows.nth(index).getByRole("gridcell").nth(3)).toContainText(nameFragment);
    }
  });

  test("STR-09: wyszukiwanie po kodzie pocztowym zwraca zgodne adresy @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { postalCode: "84-300" });
    await submitStructureSearch(dialog);
    await expectVisibleStructureAddressesContain(dialog, "84-300");
  });

  test("STR-10: wyszukiwanie po miejscowości zwraca zgodne adresy @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { city: "Lębork" });
    await submitStructureSearch(dialog);
    await expectVisibleStructureAddressesContain(dialog, "Lębork");
  });

  test("STR-11: wyszukiwanie po ulicy zwraca zgodne adresy @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { street: "Kościuszki" });
    await submitStructureSearch(dialog);
    await expectVisibleStructureAddressesContain(dialog, "Kościuszki");
  });

  test("STR-12: wyszukiwanie łączy ID i nazwę szkoły @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id, name: GOLD_SCHOOL.name });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, GOLD_SCHOOL);
  });

  test("STR-13: nieistniejące ID pozostawia pustą tabelę wyników @school @structure @search @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: "999999" });
    await submitStructureSearch(dialog);

    await expect(structureSearchResults(dialog).getByRole("row")).toHaveCount(1);
    await expect(structureSearchResults(dialog).getByRole("gridcell")).toHaveCount(0);
    await expect(dialog).toBeVisible();
  });

  test("STR-14: szkołę można dodać do planowanych powiązań bez zapisu @school @structure @positive", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-15: niezapisaną szkołę można usunąć z planowanych powiązań @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);
    await removeStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(0);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-16: pojedyncze poprawne powiązanie wysyła jedno żądanie zapisu @school @structure @api", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    expect(payloads[0]).toHaveLength(1);
    expect(payloads[0][0]).toMatchObject({
      institutionRelationId: null,
      institutionRelationTypeId: 1,
    });
    expect(payloads[0][0].sourceInstitutionUnitId).not.toBe(payloads[0][0].linkedInstitutionUnitId);
    await expect(dialog).toHaveCount(0);
  });

  test("STR-17: trwałość relacji po ponownym otwarciu @school @structure @persistence", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["group", "primary"]);
    const group = schools.group!;
    const primary = schools.primary!;

    await deleteStructureRelation(app, group, primary, { ifExists: true });
    try {
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      await expectStructureRelationVisible(app, group, primary);

      await app.openPanel("school", primary.id);
      await expectStructureRelationVisible(app, group, primary);
    } finally {
      await deleteStructureRelation(app, group, primary, { ifExists: true });
    }
  });

  test("STR-18: anulowanie po dodaniu szkoły nie zachowuje planowanego powiązania @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    let dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);

    const panel = page.getByRole("tabpanel", { name: "Struktura", exact: true });
    await expect(panel.getByText("Brak struktury organizacyjnej.", { exact: true })).toBeVisible();

    dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await expect(structureRelatedSchools(dialog).getByRole("row")).toHaveCount(1);
    await expect(structureRelatedSchools(dialog).getByRole("gridcell")).toHaveCount(0);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-19: kilka szkół jest wysyłanych dokładnie raz w jednym zapisie @school @structure @api", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    await prepareStructureRelation(page, app, dialog, SILVER_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    expect(payloads[0]).toHaveLength(2);
    expect(new Set(payloads[0].map((item) => item.linkedInstitutionUnitId)).size).toBe(2);
    await expect(dialog).toHaveCount(0);
  });

  test("STR-20: Pokaż zaznaczone otwiera wybrane szkoły w nowej karcie @school @structure @filter", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "branch"],
      async (api, s, app) => {
        await api.seed(s.group, s.main, 1);
        await api.seed(s.main, s.branch, 2);
        const panel = await openSchoolStructure(app, s.group);
        const row = structurePanelSchoolRow(panel, s.main);
        await row.getByRole("gridcell", { name: s.main.id, exact: true }).click();
        await expect(row).toHaveAttribute("aria-selected", "true");
        const popup = await openStructureResults(page, panel, "Pokaż zaznaczone");
        try {
          const results = popup.locator("ag-grid-angular").last();
          await expect(results.getByRole("gridcell", { name: s.main.id, exact: true })).toHaveCount(
            1,
          );
          await expect(
            results.getByRole("gridcell", { name: s.group.id, exact: true }),
          ).toHaveCount(0);
          await expect(
            results.getByRole("gridcell", { name: s.branch.id, exact: true }),
          ).toHaveCount(0);
        } finally {
          await popup.close();
        }
      },
    );
  });

  for (const relation of [
    { id: "STR-21", label: "Zespół szkół" as const, apiId: 1 },
    { id: "STR-22", label: "Filia" as const, apiId: 2 },
    { id: "STR-23", label: "Wielobudynkowość" as const, apiId: 3 },
  ]) {
    test(`${relation.id}: typ „${relation.label}” jest dostępny i mapowany do kontraktu API @school @structure @api`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
      await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, relation.label, "Podrzędna");
      const payloads = await mockStructureSave(page);

      await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

      await expect.poll(() => payloads.length).toBe(1);
      expect(payloads[0][0].institutionRelationTypeId).toBe(relation.apiId);
      await expect(dialog).toHaveCount(0);
    });
  }

  test("STR-24: nieistniejący typ relacji jest odrzucany @school @structure @api @negative", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      await api.reject(await api.attempt(s.main, s.branch, 999999));
      expect(api.edges(await api.tree(s.main))).toHaveLength(0);
    });
  });

  test("STR-25: duplikat aktywnej relacji @school @structure @validation", async ({ page }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["group", "primary"]);
    const group = schools.group!;
    const primary = schools.primary!;

    await deleteStructureRelation(app, group, primary, { ifExists: true });
    try {
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      const originalId = await readStructureRelationId(app, group, primary);
      expect(originalId).not.toBeNull();
      const dialog = await openSchoolStructureDialog(app, group);
      await expect(structureRelatedSchoolRow(dialog, primary.id)).toHaveCount(1);
      await fillStructureSearch(app, dialog, { id: primary.id });
      await submitStructureSearch(dialog);
      const candidate = structureSchoolRow(dialog, primary.id);
      if ((await candidate.count()) === 1) {
        await candidate.getByRole("gridcell").first().click();
      }
      await expect(structureRelatedSchoolRow(dialog, primary.id)).toHaveCount(1);
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
      expect(await readStructureRelationId(app, group, primary)).toBe(originalId);
    } finally {
      await deleteStructureRelation(app, group, primary, { ifExists: true });
    }
  });

  test("STR-26: drugi typ nie tworzy drugiej aktywnej relacji dla pary @school @structure @api", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      const original = await api.seed(s.main, s.branch, 2);
      await api.attempt(s.main, s.branch, 3);
      const edges = api.edges(await api.tree(s.main));
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe(original);
    });
  });

  test("STR-27: bieżącej szkoły nie można dodać jako własnego powiązania @school @structure @validation @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: NO_MEDAL_SCHOOL.id });
    await submitStructureSearch(dialog);

    const currentSchool = structureSchoolRow(dialog, NO_MEDAL_SCHOOL.id);
    if ((await currentSchool.count()) === 1) {
      await currentSchool.getByRole("gridcell").first().click();

      const warning = page.getByRole("dialog").filter({ hasText: "Uwaga" }).last();
      if (await warning.isVisible().catch(() => false)) {
        await warning.getByRole("button", { name: "OK", exact: true }).click();
      }
    }

    await expect(structureRelatedSchoolRow(dialog, NO_MEDAL_SCHOOL.id)).toHaveCount(0);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-28: cykl bezpośredni jest blokowany przez API @school @structure @api @negative", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      const original = await api.seed(s.main, s.branch, 2);
      await api.reject(await api.attempt(s.branch, s.main, 2));
      expect(api.edges(await api.tree(s.main))).toEqual([
        { id: original, parent: api.unit(s.main), child: api.unit(s.branch), type: 2 },
      ]);
    });
  });

  test("STR-29: cykl pośredni jest blokowany przez API @school @structure @api @negative", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch", "nodeC"], async (api, s) => {
      await api.seed(s.main, s.branch, 2);
      await api.seed(s.branch, s.nodeC, 2);
      await api.reject(await api.attempt(s.nodeC, s.main, 2));
      expect(api.edges(await api.tree(s.main))).toHaveLength(2);
    });
  });

  test("STR-30: cztery poziomy i wielorakie role szkoły są obsługiwane @school @structure @hierarchy", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "branch", "nodeC"],
      async (api, s, app) => {
        await api.seed(s.group, s.main, 1);
        await api.seed(s.main, s.branch, 2);
        await api.seed(s.branch, s.nodeC, 3);
        const panel = await openSchoolStructure(app, s.group);
        await expect(panel.locator('[role="gridcell"][col-id="id"]')).toHaveText([
          s.group.id,
          s.main.id,
          s.branch.id,
          s.nodeC.id,
        ]);
        expect(api.edges(await api.tree(s.branch))).toHaveLength(3);
      },
    );
  });

  test("STR-31: hierarchia głębsza niż cztery poziomy nie ma sztucznego limitu @school @structure @hierarchy", async ({
    page,
    authSession,
  }) => {
    test.setTimeout(360000);
    const keys: StructureSchoolKey[] = [
      "main",
      "branch",
      "primary",
      "nodeC",
      "nodeD",
      "nodeE",
      "nodeF",
    ];
    await withStructureGraph(page, authSession, keys, async (api, s, app) => {
      for (let index = 1; index < keys.length; index++)
        await api.seed(s[keys[index - 1]], s[keys[index]], 2);
      expect(api.edges(await api.tree(s.main))).toHaveLength(keys.length - 1);
      const panel = await openSchoolStructure(app, s.main);
      await expect(panel.locator('[role="gridcell"][col-id="id"]')).toHaveText(
        keys.map((key) => s[key].id),
      );
    });
  });

  test("STR-32: edycja typu zapisanej relacji @school @structure @edit", async ({ page }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["main", "branch"]);
    const main = schools.main!;
    const branch = schools.branch!;

    await deleteStructureRelation(app, main, branch, { ifExists: true });
    try {
      await createStructureRelation(app, main, branch, "Filia", "Podrzędna");
      const originalId = await readStructureRelationId(app, main, branch);
      expect(originalId).not.toBeNull();
      const dialog = await openStructureEditDialog(app, main, branch);
      await selectStructureEditValue(app, dialog, "type", "Wielobudynkowość");
      await saveStructureEditDialog(app, dialog);
      expect(await readStructureRelationId(app, main, branch)).toBe(originalId);

      const reopened = await openSchoolStructureDialog(app, main);
      await expect(
        structureRelatedSchoolRow(reopened, branch.id).getByRole("gridcell").nth(5),
      ).toContainText("Wielobudynkowość");
      await reopened.getByRole("button", { name: "Anuluj", exact: true }).click();
      const inverse = await openStructureEditDialog(app, branch, main);
      await expect(inverse.getByRole("combobox").first()).toContainText("Wielobudynkowość");
      await expect(inverse.getByRole("combobox").nth(1)).toContainText("Nadrzędna");
      await expect(inverse.getByRole("textbox")).toHaveCount(0);
      await inverse.getByRole("button", { name: "Anuluj", exact: true }).click();
    } finally {
      await deleteStructureRelation(app, main, branch, { ifExists: true });
    }
  });

  test("STR-33: zamiana stron zapisanej relacji @school @structure @edit", async ({ page }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["main", "branch"]);
    const main = schools.main!;
    const branch = schools.branch!;

    await deleteStructureRelation(app, main, branch, { ifExists: true });
    try {
      const created = await createStructureRelation(app, main, branch, "Filia", "Podrzędna");
      const original = (created.request().postDataJSON() as StructureSaveItem[])[0];
      const dialog = await openStructureEditDialog(app, main, branch);
      await selectStructureEditValue(app, dialog, "hierarchy", "Nadrzędna");
      const edited = await saveStructureEditDialog(app, dialog);
      const updated = (edited.request().postDataJSON() as StructureSaveItem[])[0];
      expect(updated.sourceInstitutionUnitId).toBe(original.linkedInstitutionUnitId);
      expect(updated.linkedInstitutionUnitId).toBe(original.sourceInstitutionUnitId);
      const reopened = await openStructureEditDialog(app, main, branch);
      await expect(reopened.getByRole("combobox").nth(1)).toContainText("Nadrzędna");
      await reopened.getByRole("button", { name: "Anuluj", exact: true }).click();
    } finally {
      await deleteStructureRelation(app, main, branch, { ifExists: true });
    }
  });

  test("STR-34: ikona śmietnika usuwa relację ze struktury @school @structure @delete", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["group", "primary"]);
    const group = schools.group!;
    const primary = schools.primary!;

    await deleteStructureRelation(app, group, primary, { ifExists: true });
    try {
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      await expectStructureRelationVisible(app, group, primary);
      await deleteStructureRelation(app, group, primary);

      const panel = await openSchoolStructure(app, group);
      await expect(
        panel.getByText("Brak struktury organizacyjnej.", { exact: true }),
      ).toBeVisible();
      expect(await readStructureRelationId(app, group, primary)).toBeNull();
    } finally {
      await deleteStructureRelation(app, group, primary, { ifExists: true });
    }
  });

  test("STR-35: ponowne dodanie reaktywuje ten sam rekord relacji @school @structure @persistence", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["group", "primary"]);
    const group = schools.group!;
    const primary = schools.primary!;

    await deleteStructureRelation(app, group, primary, { ifExists: true });
    try {
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      const originalId = await readStructureRelationId(app, group, primary);
      expect(originalId).not.toBeNull();
      await deleteStructureRelation(app, group, primary);
      expect(await readStructureRelationId(app, group, primary)).toBeNull();
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      expect(await readStructureRelationId(app, group, primary)).toBe(originalId);
    } finally {
      await deleteStructureRelation(app, group, primary, { ifExists: true });
    }
  });

  test("STR-36: relację można ponownie dodać po usunięciu @school @structure @delete", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["group", "primary"]);
    const group = schools.group!;
    const primary = schools.primary!;

    await deleteStructureRelation(app, group, primary, { ifExists: true });
    try {
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      await deleteStructureRelation(app, group, primary);
      await createStructureRelation(app, group, primary, "Zespół szkół", "Podrzędna");
      await expectStructureRelationVisible(app, group, primary);
    } finally {
      await deleteStructureRelation(app, group, primary, { ifExists: true });
    }
  });

  test("STR-37: usunięta relacja nie trafia do aktywnego drzewa ani formularza @school @structure @delete", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      await api.deactivate(await api.seed(s.main, s.branch, 2));
      expect(api.edges(await api.tree(s.main))).toHaveLength(0);
      expect(api.edges(await api.tree(s.branch))).toHaveLength(0);
      const dialog = await openSchoolStructureDialog(app, s.main);
      await expect(structureRelatedSchoolRow(dialog, s.branch.id)).toHaveCount(0);
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    });
  });

  test("STR-38: nadany identyfikator zespołu ma dokładnie trzy cyfry @school @structure @identifier", async ({
    page,
  }) => {
    test.fail(
      true,
      "Potwierdzona niezgodność DEV: dedykowany Zespół szkół otrzymał ID 5014, wymaganie mówi o trzech cyfrach.",
    );
    const schools = await ensureStructureTestSchools(page, new Octopus(page), ["group"]);
    expect(schools.group!.id).toMatch(/^\d{3}$/);
  });

  test("STR-39: dwa dedykowane zespoły mają różne identyfikatory @school @structure @identifier", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["group", "group2"], async (_api, s) => {
      expect(s.group.id).not.toBe(s.group2.id);
    });
  });

  test("STR-40: identyfikatory zespołu i szkół nie kolidują w danych referencyjnych @school @structure @identifier", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "branch", "primary"],
      async (_api, s) => {
        const ids = [s.group.id, s.main.id, s.branch.id, s.primary.id];
        expect(new Set(ids).size).toBe(ids.length);
      },
    );
  });

  test("STR-41: wyszukiwanie zespołu po własnym ID jest jednoznaczne @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const s = await ensureStructureTestSchools(page, app, ["group", "main"]);
    const dialog = await openSchoolStructureDialog(app, s.main!);
    await fillStructureSearch(app, dialog, { id: s.group!.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, s.group!);
    await expect(structureSearchResults(dialog).getByRole("row")).toHaveCount(2);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });

  test("STR-42: publiczne API jednoznacznie identyfikuje zespół @school @structure @api", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["group"], async (api, s) => {
      const response = await api.get(
        `/api/InstitutionBrowser/GetInstitutions?filterModel=${encodeURIComponent(JSON.stringify({ institutionIds: [s.group.id], page: 1, limit: 10 }))}`,
      );
      const body = (await response.json()) as {
        data: Array<{ id: number; institutionUnitId: number; name: string; levelName: string }>;
      };
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        id: Number(s.group.id),
        institutionUnitId: api.unit(s.group),
        name: s.group.name,
        levelName: "ZS",
      });
    });
  });

  test("STR-43: API zachowuje ID, obie strony i typ zapisanej relacji @school @structure @api @persistence", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      const id = await api.seed(s.main, s.branch, 2);
      const expected = [{ id, parent: api.unit(s.main), child: api.unit(s.branch), type: 2 }];
      expect(api.edges(await api.tree(s.main))).toEqual(expected);
      expect(api.edges(await api.tree(s.branch))).toEqual(expected);
    });
  });

  test("STR-44: wybór typu w UI odpowiada słownikowi API @school @structure @dictionary", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const response = await api.get("/api/Dictionary/GetDictInstitutionRelationType");
      const types = (await response.json()) as Array<{ id: number; name: string }>;
      expect(types).toEqual(
        expect.arrayContaining([
          { id: 1, name: "Zespół szkół" },
          { id: 2, name: "Filia" },
          { id: 3, name: "Wielobudynkowość" },
        ]),
      );
      expect(new Set(types.map((entry) => entry.id)).size).toBe(types.length);
      const dialog = await openSchoolStructureDialog(app, s.main);
      await fillStructureSearch(app, dialog, { id: s.branch.id });
      await submitStructureSearch(dialog);
      const row = await addStructureSchoolCandidate(dialog, s.branch);
      await row.getByRole("gridcell").nth(5).dblclick();
      expect(
        (await page.getByRole("option").allTextContents()).map((text) => text.trim()).sort(),
      ).toEqual(types.map((entry) => entry.name).sort());
      await page.getByRole("option", { name: "Filia", exact: true }).click();
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    });
  });

  test("STR-45: historia pokazuje utworzenie relacji @school @structure @history", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const before = await readStructureHistory(app, s.main);
      await api.seed(s.main, s.branch, 2);
      const after = await readStructureHistory(app, s.main);
      await expectStructureHistoryEntry(app, before, after, s.branch, "Dodano Filia", api.userId);
    });
  });

  test("STR-46: historia pokazuje zmianę typu relacji @school @structure @history", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      const before = await readStructureHistory(app, s.main);
      const dialog = await openStructureEditDialog(app, s.main, s.branch);
      await selectStructureEditValue(app, dialog, "type", "Wielobudynkowość");
      await saveStructureEditDialog(app, dialog);
      const after = await readStructureHistory(app, s.main);
      await expectStructureHistoryEntry(
        app,
        before,
        after,
        s.branch,
        "Zmieniono typ relacji na Wielobudynkowość",
        api.userId,
      );
      expect(api.edges(await api.tree(s.main)).map((edge) => edge.id)).toEqual([id]);
    });
  });

  test("STR-47: historia pokazuje usunięcie relacji @school @structure @history", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      const before = await readStructureHistory(app, s.main);
      await deleteStructureRelation(app, s.main, s.branch);
      api.acknowledgeDeleted(id);
      const after = await readStructureHistory(app, s.main);
      await expectStructureHistoryEntry(app, before, after, s.branch, "Usunięto Filia", api.userId);
    });
  });

  test("STR-48: historia pokazuje reaktywację relacji @school @structure @history", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      await api.deactivate(id);
      const before = await readStructureHistory(app, s.main);
      expect(await api.seed(s.main, s.branch, 2)).toBe(id);
      const after = await readStructureHistory(app, s.main);
      await expectStructureHistoryEntry(app, before, after, s.branch, "Dodano Filia", api.userId);
    });
  });

  test("STR-49: odpowiedź 422 nie zamyka dialogu ani nie ponawia zapisu @school @structure @api @negative", async ({
    page,
  }) => {
    test.fail(true, "Znany defekt DEV: po odpowiedzi 422 dialog jest zamykany.");
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page, 422);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    await expect(dialog).toBeVisible();
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
  });

  test("STR-50: odpowiedź 500 zachowuje przygotowaną relację i pozwala ponowić zapis @school @structure @api @negative", async ({
    page,
  }) => {
    test.fail(true, "Znany defekt DEV: po odpowiedzi 500 dialog jest zamykany i traci stan.");
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page, 500);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeEnabled();
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
  });

  test("STR-51: równoczesna edycja zgłasza konflikt zamiast cichego nadpisania @school @structure @api @concurrency", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      const id = await api.seed(s.main, s.branch, 2);
      const responses = await Promise.all([
        api.attempt(s.main, s.branch, 1, { institutionRelationId: id }),
        api.attempt(s.main, s.branch, 3, { institutionRelationId: id }),
      ]);
      const results = await Promise.all(
        responses.map(async (response) => ({
          status: response.status(),
          body: (await response.json()) as { codeResult?: number },
        })),
      );
      expect(
        results.every(
          (result) =>
            result.status === 409 ||
            (result.status === 200 && [204, 409].includes(result.body.codeResult ?? 0)),
        ),
      ).toBe(true);
      test.fail(
        true,
        "Potwierdzona luka kontraktu DEV: równoczesne edycje są przyjmowane bez zgłoszenia konfliktu.",
      );
      expect(
        results.some((result) => result.status === 409 || result.body.codeResult === 409),
        "Co najmniej jeden konkurujący zapis powinien zgłosić konflikt",
      ).toBe(true);
      expect(api.edges(await api.tree(s.main))).toHaveLength(1);
    });
  });

  test("STR-52: obecny użytkownik ma akcje dodawania, edycji i usuwania @school @structure @permissions", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const empty = await openSchoolStructure(app, s.main);
      await expect(
        empty.getByRole("button", { name: "Dodaj powiązanie", exact: true }),
      ).toBeEnabled();
      await api.seed(s.main, s.branch, 2);
      const dialog = await openStructureEditDialog(app, s.main, s.branch);
      await expect(dialog.getByRole("combobox")).toHaveCount(2);
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
      const panel = await openSchoolStructure(app, s.main);
      await structurePanelSchoolRow(panel, s.branch)
        .locator("mat-icon")
        .filter({ hasText: "delete_outline" })
        .click();
      const confirmation = page
        .locator("mat-dialog-container")
        .filter({ hasText: "Usuwanie struktury" });
      await expect(confirmation.getByRole("button", { name: "Tak", exact: true })).toBeEnabled();
      await confirmation.getByRole("button", { name: "Nie", exact: true }).click();
    });
  });

  test("STR-53: wyszukiwanie złożone wyłącznie z białych znaków jest odrzucane @school @structure @validation @negative", async ({
    page,
  }) => {
    test.fail(
      true,
      "Znany defekt DEV: kryterium złożone z samych spacji zwraca pełną listę szkół.",
    );
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { name: "   " });
    await submitStructureSearch(dialog);
    await dismissWarning(page, "Wyszukiwanie nie może być puste");

    await expect(dialog).toBeVisible();
    await expect(structureSearchResults(dialog).getByRole("gridcell")).toHaveCount(0);
  });

  test("STR-54: ponowne wyszukiwanie zastępuje poprzednie wyniki @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, GOLD_SCHOOL);

    await fillStructureSearch(app, dialog, { id: SILVER_SCHOOL.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, SILVER_SCHOOL);
    await expect(structureSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(0);
  });

  test("STR-55: tej samej szkoły nie można dodać dwukrotnie do planowanych powiązań @school @structure @validation", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    const resultRow = structureSchoolRow(dialog, GOLD_SCHOOL.id);
    if ((await resultRow.count()) === 1) {
      await resultRow.getByRole("gridcell").first().click();
    }

    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });

  test("STR-56: usuniętą planowaną szkołę można ponownie dodać @school @structure @positive", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);
    await removeStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });

  test("STR-57: anulowanie kilku planowanych powiązań nie zachowuje żadnego z nich @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    let dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await fillStructureSearch(app, dialog, { id: SILVER_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, SILVER_SCHOOL);
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
    await expect(structureRelatedSchoolRow(dialog, SILVER_SCHOOL.id)).toHaveCount(1);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await expect(structureRelatedSchools(dialog).getByRole("gridcell")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });

  for (const invalid of [
    { id: "STR-58", label: "brak szkoły nadrzędnej", extra: { sourceInstitutionUnitId: 0 } },
    { id: "STR-59", label: "brak szkoły podrzędnej", extra: { linkedInstitutionUnitId: 0 } },
    { id: "STR-60", label: "brak typu relacji", extra: { institutionRelationTypeId: 0 } },
    { id: "STR-61", label: "samopowiązanie w API", self: true },
    { id: "STR-62", label: "nieistniejąca szkoła", extra: { linkedInstitutionUnitId: 2147483647 } },
  ]) {
    test(`${invalid.id}: ${invalid.label} nie zapisuje relacji @school @structure @api @negative`, async ({
      page,
      authSession,
    }) => {
      await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
        await api.reject(
          await api.attempt(s.main, invalid.self ? s.main : s.branch, 2, invalid.extra),
        );
        expect(api.edges(await api.tree(s.main))).toHaveLength(0);
      });
    });
  }

  test("STR-63: filii nie można przypisać do dwóch szkół głównych @school @structure @api @negative", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch", "nodeC"], async (api, s) => {
      const id = await api.seed(s.main, s.branch, 2);
      await api.reject(await api.attempt(s.nodeC, s.branch, 2));
      expect(api.edges(await api.tree(s.branch))).toEqual([
        { id, parent: api.unit(s.main), child: api.unit(s.branch), type: 2 },
      ]);
    });
  });

  test("STR-64: relacje pośrednie są tylko do odczytu @school @structure @permissions", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "branch"],
      async (api, s, app) => {
        await api.seed(s.group, s.main, 1);
        await api.seed(s.main, s.branch, 2);
        const panel = await openSchoolStructure(app, s.group);
        const indirect = structurePanelSchoolRow(panel, s.branch);
        for (const action of ["delete_outline", "edit"]) {
          await expect(indirect.locator("mat-icon").filter({ hasText: action })).toHaveClass(
            /disabled-icon/,
          );
        }
        await indirect.getByRole("gridcell").nth(0).click();
        await expect(app.dialog("Usuwanie struktury")).toHaveCount(0);
        await indirect.getByRole("gridcell").nth(1).click();
        await expect(app.dialog("Edycja struktury")).toHaveCount(0);
        expect(api.edges(await api.tree(s.group))).toHaveLength(2);
        const direct = await openStructureEditDialog(app, s.main, s.branch);
        await expect(direct).toBeVisible();
        await direct.getByRole("button", { name: "Anuluj", exact: true }).click();
      },
    );
  });

  test("STR-65: dodatkowa lokalizacja modyfikuje wyłącznie bezpośrednią wielobudynkowość @school @structure @permissions", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["main", "branch", "nodeC"],
      async (api, s, app) => {
        await api.seed(s.main, s.branch, 3);
        await api.seed(s.main, s.nodeC, 2);
        const allowed = await openStructureEditDialog(app, s.branch, s.main);
        await expect(allowed.getByRole("combobox").first()).toContainText("Wielobudynkowość");
        await allowed.getByRole("button", { name: "Anuluj", exact: true }).click();
        const panel = await openSchoolStructure(app, s.branch);
        const other = structurePanelSchoolRow(panel, s.nodeC);
        for (const action of ["delete_outline", "edit"]) {
          await expect(other.locator("mat-icon").filter({ hasText: action })).toHaveClass(
            /disabled-icon/,
          );
        }
        await other.getByRole("gridcell").nth(1).click();
        await expect(app.dialog("Edycja struktury")).toHaveCount(0);
        await other.getByRole("gridcell").nth(0).click();
        await expect(app.dialog("Usuwanie struktury")).toHaveCount(0);
        const fromMain = await openStructureEditDialog(app, s.main, s.nodeC);
        await expect(fromMain.getByRole("combobox").first()).toContainText("Filia");
        await fromMain.getByRole("button", { name: "Anuluj", exact: true }).click();
      },
    );
  });

  test("STR-66: lokalizacja jest przed filią niezależnie od kolejności utworzenia @school @structure @layout", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["main", "branch", "nodeC"],
      async (api, s, app) => {
        await api.seed(s.main, s.nodeC, 2);
        await api.seed(s.main, s.branch, 3);
        const panel = await openSchoolStructure(app, s.main);
        await expect(panel.locator('[role="gridcell"][col-id="id"]')).toHaveText([
          s.main.id,
          s.branch.id,
          s.nodeC.id,
        ]);
      },
    );
  });

  test("STR-67: ikony i wcięcia odwzorowują poziomy bez zwijania @school @structure @layout", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "branch", "nodeC"],
      async (api, s, app) => {
        await api.seed(s.group, s.main, 1);
        await api.seed(s.main, s.branch, 2);
        await api.seed(s.branch, s.nodeC, 3);
        const panel = await openSchoolStructure(app, s.group);
        await expect(panel.locator(".ag-group-expanded,.ag-group-contracted")).toHaveCount(0);
        const positions: number[] = [];
        for (const school of [s.group, s.main, s.branch, s.nodeC]) {
          const cell = structurePanelSchoolRow(panel, school).getByRole("gridcell").nth(3);
          await expect(cell.locator("img,svg,ion-icon").first()).toBeVisible();
          positions.push(
            await cell
              .locator('span[style*="padding-left"]')
              .evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingLeft)),
          );
          expect(
            await cell.evaluate((element, name) => {
              const icon = element.querySelector("img");
              const label = Array.from(element.querySelectorAll("[data-tooltip]")).find(
                (node) => node.getAttribute("data-tooltip") === name,
              );
              return Boolean(
                icon &&
                label &&
                icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
              );
            }, school.name),
          ).toBe(true);
        }
        for (let index = 1; index < positions.length; index++)
          expect(positions[index]).toBeGreaterThan(positions[index - 1]);
        expect(positions[2] - positions[1]).toBe(positions[1] - positions[0]);
        expect(positions[3] - positions[2]).toBe(positions[1] - positions[0]);
      },
    );
  });

  test("STR-68: podstruktura pozostaje ciągła przed kolejnym rodzeństwem @school @structure @layout", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "primary", "branch", "nodeC"],
      async (api, s, app) => {
        await api.seed(s.group, s.main, 1);
        await api.seed(s.group, s.primary, 1);
        await api.seed(s.main, s.branch, 2);
        await api.seed(s.branch, s.nodeC, 3);
        const panel = await openSchoolStructure(app, s.group);
        const ids = await panel.locator('[role="gridcell"][col-id="id"]').allTextContents();
        expect(ids[0]).toBe(s.group.id);
        expect([...ids].sort()).toEqual(
          [s.group.id, s.main.id, s.branch.id, s.nodeC.id, s.primary.id].sort(),
        );
        const mainIndex = ids.indexOf(s.main.id);
        expect(ids.slice(mainIndex, mainIndex + 3)).toEqual([s.main.id, s.branch.id, s.nodeC.id]);
      },
    );
  });

  test("STR-69: Nie w potwierdzeniu nie usuwa relacji ani szkoły @school @structure @cancel", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      const panel = await openSchoolStructure(app, s.main);
      await structurePanelSchoolRow(panel, s.branch)
        .locator("mat-icon")
        .filter({ hasText: "delete_outline" })
        .click();
      const confirmation = page
        .locator("mat-dialog-container")
        .filter({ hasText: "Usuwanie struktury" });
      await expect(confirmation).toContainText(s.main.name);
      await expect(confirmation).toContainText(s.branch.name);
      await confirmation.getByRole("button", { name: "Nie", exact: true }).click();
      expect(api.edges(await api.tree(s.main)).map((edge) => edge.id)).toEqual([id]);
      await app.openPanel("school", s.branch.id);
      await expect(app.detail("name")).toHaveValue(s.branch.name);
    });
  });

  test("STR-70: anulowanie edycji odrzuca typ i hierarchię @school @structure @cancel", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      const dialog = await openStructureEditDialog(app, s.main, s.branch);
      await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeDisabled();
      await selectStructureEditValue(app, dialog, "type", "Wielobudynkowość");
      await selectStructureEditValue(app, dialog, "hierarchy", "Nadrzędna");
      await expect(dialog.getByRole("textbox")).toHaveCount(0);
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
      expect(api.edges(await api.tree(s.main))).toEqual([
        { id, parent: api.unit(s.main), child: api.unit(s.branch), type: 2 },
      ]);
    });
  });

  test("STR-71: usunięcie relacji zachowuje obie szkoły @school @structure @delete", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      await api.deactivate(await api.seed(s.main, s.branch, 2));
      for (const school of [s.main, s.branch]) {
        await app.openPanel("school", school.id);
        await expect(app.detail("name")).toHaveValue(school.name);
      }
    });
  });

  test("STR-72: timeout zapisu zachowuje dialog i przygotowaną relację @school @structure @negative", async ({
    page,
  }) => {
    test.fail(true, "Potwierdzony defekt DEV: timeout zapisu zamyka dialog dodawania.");
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Filia", "Podrzędna");
    await page.route("**/api/Institution/AddOrUpdateInstitutionRelations", (route) =>
      route.abort("timedout"),
    );
    const failed = page.waitForEvent("requestfailed", {
      predicate: (request) => request.url().includes("AddOrUpdateInstitutionRelations"),
    });
    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
    await failed;
    await expect(dialog).toBeVisible();
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
  });

  test("STR-73: blokada aktywnego procesu nie usuwa relacji w UI @school @structure @negative @mock", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      const panel = await openSchoolStructure(app, s.main);
      await page.route("**/api/Institution/DeleteInstitutionsRelation?**", (route) =>
        route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            Message: "Relacja jest powiązana z aktywnym zamówieniem; usunięcie zablokowane.",
          }),
        }),
      );
      await structurePanelSchoolRow(panel, s.branch)
        .locator("mat-icon")
        .filter({ hasText: "delete_outline" })
        .click();
      const response = page.waitForResponse((item) => item.request().method() === "DELETE");
      await page
        .locator("mat-dialog-container")
        .filter({ hasText: "Usuwanie struktury" })
        .getByRole("button", { name: "Tak", exact: true })
        .click();
      await response;
      await expect(structurePanelSchoolRow(panel, s.branch)).toHaveCount(1);
      expect(api.edges(await api.tree(s.main)).map((edge) => edge.id)).toEqual([id]);
    });
  });

  test("STR-74: blokada aktywnego procesu zachowuje edytowaną relację @school @structure @negative @mock", async ({
    page,
    authSession,
  }) => {
    test.fail(
      true,
      "Potwierdzony defekt DEV: odpowiedź 409 zamyka formularz edycji zamiast zachować jego stan.",
    );
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      const dialog = await openStructureEditDialog(app, s.main, s.branch);
      await selectStructureEditValue(app, dialog, "type", "Wielobudynkowość");
      await page.route("**/api/Institution/AddOrUpdateInstitutionRelations", (route) =>
        route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            Message: "Relacja jest powiązana z aktywnym raportem; edycja zablokowana.",
          }),
        }),
      );
      const response = page.waitForResponse(
        (item) =>
          item.request().method() === "POST" &&
          item.url().includes("AddOrUpdateInstitutionRelations"),
      );
      await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
      await response;
      await expect(dialog).toBeVisible();
      expect(api.edges(await api.tree(s.main))).toEqual([
        { id, parent: api.unit(s.main), child: api.unit(s.branch), type: 2 },
      ]);
    });
  });

  test("STR-75: zespół przyjmuje SP, LO i przedszkole @school @structure @positive", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "primary", "secondary", "preschool"],
      async (api, s, app) => {
        for (const school of [s.primary, s.secondary, s.preschool])
          await api.seed(s.group, school, 1);
        const panel = await openSchoolStructure(app, s.group);
        for (const school of [s.primary, s.secondary, s.preschool])
          await expect(structurePanelSchoolRow(panel, school)).toHaveCount(1);
        expect(api.edges(await api.tree(s.group)).map((edge) => edge.type)).toEqual([1, 1, 1]);
      },
    );
  });

  for (const relation of [
    { id: "STR-76", type: "Zespół szkół" as const, apiId: 1 },
    { id: "STR-77", type: "Filia" as const, apiId: 2 },
    { id: "STR-78", type: "Wielobudynkowość" as const, apiId: 3 },
  ]) {
    test(`${relation.id}: Nadrzędna oznacza wyszukaną szkołę jako rodzica dla ${relation.type} @school @structure @hierarchy`, async ({
      page,
      authSession,
    }) => {
      await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
        await createStructureRelation(app, s.main, s.branch, relation.type, "Nadrzędna");
        const edges = api.edges(await api.tree(s.branch));
        expect(edges).toHaveLength(1);
        expect(edges[0]).toMatchObject({
          parent: api.unit(s.branch),
          child: api.unit(s.main),
          type: relation.apiId,
        });
      });
    });
  }
  test("STR-79: zawieszonej szkoły nie można powiązać @school @structure @status @negative", async ({
    page,
    authSession,
  }) => {
    const app = new Octopus(page);
    const schools = await ensureStructureTestSchools(page, app, ["main"]);
    const api = new StructureApi(page.context().request, authSession);
    await api.resolve([schools.main!]);
    const inactive = await ensureInactiveStructureSchool(page, app, api);
    await api.cleanup([schools.main!]);
    try {
      await api.reject(await api.attempt(schools.main!, inactive, 2));
      expect(api.edges(await api.tree(schools.main!))).toHaveLength(0);
    } finally {
      await api.cleanup([schools.main!]);
    }
  });
  test("STR-80: zamówienie wymaga potwierdzenia usuwania relacji i pozostaje po anulowaniu @school @structure @order", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s, app) => {
      const id = await api.seed(s.main, s.branch, 2);
      await app.openPanel("school", s.main.id);
      await openOrders(page);
      const before = new Set(await getOrderIds(page));
      try {
        const { orderId } = await createSimpleOrder(
          page,
          ORDER_PRODUCTS.physics7.products[1].code,
          "1",
        );
        const panel = await openSchoolStructure(app, s.main);
        await structurePanelSchoolRow(panel, s.branch)
          .locator("mat-icon")
          .filter({ hasText: "delete_outline" })
          .click();
        const confirmation = page
          .locator("mat-dialog-container")
          .filter({ hasText: "Usuwanie struktury" });
        await expect(confirmation).toBeVisible();
        await confirmation.getByRole("button", { name: "Nie", exact: true }).click();
        expect(api.edges(await api.tree(s.main)).map((edge) => edge.id)).toEqual([id]);
        await app.openPanel("school", s.main.id);
        await openOrders(page);
        expect(await getOrderIds(page)).toContain(orderId);
      } finally {
        await app.openPanel("school", s.main.id);
        await openOrders(page);
        for (const orderId of await getOrderIds(page)) {
          if (!before.has(orderId)) await deleteOrder(page, orderId);
        }
        expect((await getOrderIds(page)).sort()).toEqual([...before].sort());
      }
    });
  });
  test("STR-81: cykl zamykający siedem poziomów jest blokowany @school @structure @api @negative", async ({
    page,
    authSession,
  }) => {
    test.setTimeout(360000);
    const keys: StructureSchoolKey[] = [
      "main",
      "branch",
      "primary",
      "nodeC",
      "nodeD",
      "nodeE",
      "nodeF",
    ];
    await withStructureGraph(page, authSession, keys, async (api, s) => {
      for (let index = 1; index < keys.length; index++)
        await api.seed(s[keys[index - 1]], s[keys[index]], 2);
      await api.reject(await api.attempt(s.nodeF, s.main, 2));
      expect(api.edges(await api.tree(s.main))).toHaveLength(keys.length - 1);
    });
  });

  test("STR-82: pojedynczy zapis formularza utrwala kilka relacji @school @structure @api", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "primary"],
      async (api, s, app) => {
        const dialog = await openSchoolStructureDialog(app, s.group);
        for (const school of [s.main, s.primary])
          await prepareStructureRelation(page, app, dialog, school, "Zespół szkół", "Podrzędna");
        const responsePromise = page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            response.url().includes("AddOrUpdateInstitutionRelations"),
        );
        await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
        const response = await responsePromise;
        expect(response.ok()).toBe(true);
        expect(response.request().postDataJSON()).toHaveLength(2);
        await expect(dialog).toHaveCount(0);
        expect(api.edges(await api.tree(s.group))).toHaveLength(2);
      },
    );
  });

  test("STR-83: błędna pozycja nie zostawia częściowego zapisu formularza @school @structure @api @negative", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      await api.reject(
        await api.attemptMany([
          { parent: s.main, child: s.branch, type: 2 },
          { parent: s.main, child: s.main, type: 2 },
        ]),
      );
      expect(api.edges(await api.tree(s.main))).toHaveLength(0);
    });
  });

  test("STR-84: równoczesne dodanie nie tworzy dwóch aktywnych relacji @school @structure @api @concurrency", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["main", "branch"], async (api, s) => {
      await Promise.all([api.attempt(s.main, s.branch, 2), api.attempt(s.main, s.branch, 2)]);
      expect(api.edges(await api.tree(s.main))).toHaveLength(1);
    });
  });

  test("STR-85: Pokaż wszystkie działa niezależnie od Pokaż zaznaczone @school @structure @filter", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["group", "main", "branch"],
      async (api, s, app) => {
        await api.seed(s.group, s.main, 1);
        await api.seed(s.main, s.branch, 2);
        const panel = await openSchoolStructure(app, s.group);
        const popup = await openStructureResults(page, panel, "Pokaż wszystkie");
        try {
          const results = popup.locator("ag-grid-angular").last();
          for (const school of [s.group, s.main, s.branch])
            await expect(
              results.getByRole("gridcell", { name: school.id, exact: true }),
            ).toHaveCount(1);
        } finally {
          await popup.close();
        }
      },
    );
  });

  test("STR-86: historia zespołu szkół zawiera audyt dodania szkoły @school @structure @history", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(page, authSession, ["group", "primary"], async (api, s, app) => {
      const before = await readStructureHistory(app, s.group);
      await api.seed(s.group, s.primary, 1);
      const after = await readStructureHistory(app, s.group);
      await expectStructureHistoryEntry(
        app,
        before,
        after,
        s.primary,
        "Dodano Zespół szkół",
        api.userId,
      );
    });
  });
  test("STR-87: przejście do roli dodatkowej lokalizacji ogranicza akcje istniejącej filii @school @structure @permissions", async ({
    page,
    authSession,
  }) => {
    await withStructureGraph(
      page,
      authSession,
      ["main", "branch", "nodeC"],
      async (api, s, app) => {
        await api.seed(s.branch, s.nodeC, 2);
        await api.seed(s.main, s.branch, 3);
        expect(
          api
            .edges(await api.tree(s.branch))
            .filter((edge) => edge.child === api.unit(s.nodeC) && edge.type === 2),
        ).toHaveLength(1);
        const panel = await openSchoolStructure(app, s.branch);
        const row = structurePanelSchoolRow(panel, s.nodeC);
        await row.getByRole("gridcell").nth(1).click();
        const editor = app.dialog("Edycja struktury");
        const editAvailable = await editor.isVisible();
        if (editAvailable)
          await editor.getByRole("button", { name: "Anuluj", exact: true }).click();
        const warning = app.dialog("Uwaga");
        if (await warning.isVisible())
          await warning.getByRole("button", { name: "OK", exact: true }).click();
        await row.getByRole("gridcell").nth(0).click();
        const deletion = app.dialog("Usuwanie struktury");
        const deleteAvailable = await deletion.isVisible();
        if (deleteAvailable)
          await deletion.getByRole("button", { name: "Nie", exact: true }).click();
        expect(
          api
            .edges(await api.tree(s.branch))
            .filter((edge) => edge.child === api.unit(s.nodeC) && edge.type === 2),
        ).toHaveLength(1);
        test.fail(true, "DEV udostępnia edycję i usuwanie filii z profilu dodatkowej lokalizacji");
        expect({ editAvailable, deleteAvailable }).toEqual({
          editAvailable: false,
          deleteAvailable: false,
        });
      },
    );
  });
});
