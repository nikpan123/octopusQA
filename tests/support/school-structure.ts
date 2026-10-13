import { expect, type Locator, type Page } from "@playwright/test";

import { Octopus, typeValue } from "./octopus";

export type StructureSchool = {
  id: string;
  name: string;
  institutionUnitId?: number;
  inactive?: boolean;
};

export type StructureRelationType = "Zespół szkół" | "Filia" | "Wielobudynkowość";
export type StructureHierarchy = "Nadrzędna" | "Podrzędna";

export async function openSchoolStructure(app: Octopus, school: StructureSchool) {
  const responsePromise = app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === "/api/Institution/GetInstitutionRelations",
  );
  await app.openPanel("school", school.id);

  await app.page.getByRole("tab", { name: "Struktura", exact: true }).click();

  const panel = app.page.getByRole("tabpanel", { name: "Struktura", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Dodaj powiązanie", exact: true })).toBeVisible();
  const response = await responsePromise;
  expect(response.ok(), "Odczyt struktury powinien się powieść").toBeTruthy();
  await response.finished();
  await expect
    .poll(
      async () =>
        (await panel.getByRole("gridcell").count()) > 0 ||
        (await panel.getByText("Brak struktury organizacyjnej.", { exact: true }).isVisible()),
    )
    .toBe(true);

  return panel;
}

export async function openSchoolStructureDialog(app: Octopus, school: StructureSchool) {
  const panel = await openSchoolStructure(app, school);
  await panel.getByRole("button", { name: "Dodaj powiązanie", exact: true }).click();

  const dialog = app.dialog("Dodaj powiązanie - szkoły w strukturze");
  await expect(dialog).toBeVisible();

  return dialog;
}

export function structureSearchResults(dialog: Locator) {
  return dialog.getByRole("treegrid").nth(0);
}

export function structureRelatedSchools(dialog: Locator) {
  return dialog.getByRole("treegrid").nth(1);
}

export function structureSearchField(dialog: Locator, label: string) {
  return dialog
    .getByText(label, { exact: true })
    .locator('xpath=following::input[not(@type="checkbox")][1]');
}

export async function fillStructureSearch(
  _app: Octopus,
  dialog: Locator,
  criteria: Partial<{
    id: string;
    name: string;
    postalCode: string;
    city: string;
    street: string;
  }>,
) {
  const fields = [
    ["ID szkoły", criteria.id],
    ["Nazwa szkoły", criteria.name],
    ["Kod pocztowy", criteria.postalCode],
    ["Miejscowość", criteria.city],
    ["Ulica", criteria.street],
  ] as const;

  for (const [label, value] of fields) {
    if (value !== undefined) await typeValue(structureSearchField(dialog, label), value);
  }
}

export async function submitStructureSearch(dialog: Locator) {
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
}

export function structureSchoolRow(dialog: Locator, schoolId: string) {
  return structureSearchResults(dialog)
    .getByRole("gridcell", { name: schoolId, exact: true })
    .locator('xpath=ancestor::*[@role="row"][1]');
}

export async function expectStructureSchoolResult(
  dialog: Locator,
  school: StructureSchool,
): Promise<Locator> {
  const row = structureSchoolRow(dialog, school.id);
  await expect(row, `Wyniki powinny zawierać szkołę ${school.id}`).toHaveCount(1);
  await expect(row).toContainText(school.name);
  return row;
}

export async function expectVisibleStructureAddressesContain(dialog: Locator, expected: string) {
  const rows = structureSearchResults(dialog).getByRole("row");
  await expect.poll(() => rows.count()).toBeGreaterThan(1);

  const count = await rows.count();
  for (let index = 1; index < count; index += 1) {
    await expect(rows.nth(index).getByRole("gridcell").nth(4)).toContainText(expected);
  }
}

export function structureRelatedSchoolRow(dialog: Locator, schoolId: string) {
  return structureRelatedSchools(dialog)
    .getByRole("gridcell", { name: schoolId, exact: true })
    .locator('xpath=ancestor::*[@role="row"][1]');
}

export async function addStructureSchoolCandidate(dialog: Locator, school: StructureSchool) {
  const resultRow = await expectStructureSchoolResult(dialog, school);
  await resultRow.getByRole("gridcell").first().click();

  const relatedRow = structureRelatedSchoolRow(dialog, school.id);
  await expect(
    relatedRow,
    `Szkoła ${school.id} powinna trafić do planowanych powiązań`,
  ).toHaveCount(1);
  await expect(relatedRow).toContainText(school.name);

  return relatedRow;
}

export async function removeStructureSchoolCandidate(dialog: Locator, school: StructureSchool) {
  const relatedRow = structureRelatedSchoolRow(dialog, school.id);
  await expect(relatedRow).toHaveCount(1);
  await relatedRow
    .locator("mat-icon")
    .filter({ hasText: "remove_circle_outline" })
    .click({ force: true });
  await expect(relatedRow).toHaveCount(0);
}

export async function selectStructureRelationCell(
  page: Page,
  row: Locator,
  column: "type" | "hierarchy",
  value: string,
) {
  const cell = row.getByRole("gridcell").nth(column === "type" ? 5 : 6);
  await cell.dblclick();

  const option = page.getByRole("option", { name: value, exact: true });
  await expect(option, `Opcja „${value}” powinna być dostępna`).toBeVisible();
  await option.click();
  await expect(cell).toContainText(value);
}

export async function createStructureRelation(
  app: Octopus,
  owner: StructureSchool,
  related: StructureSchool,
  type: StructureRelationType,
  hierarchy: StructureHierarchy,
) {
  const dialog = await openSchoolStructureDialog(app, owner);
  await fillStructureSearch(app, dialog, { id: related.id });
  await submitStructureSearch(dialog);
  const row = await addStructureSchoolCandidate(dialog, related);
  await selectStructureRelationCell(app.page, row, "type", type);
  await selectStructureRelationCell(app.page, row, "hierarchy", hierarchy);

  return saveStructureDialog(app, dialog);
}

export async function saveStructureDialog(app: Octopus, dialog: Locator) {
  const saveResponse = app.page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "POST" &&
      new URL(response.url()).pathname === "/api/Institution/AddOrUpdateInstitutionRelations"
    );
  });

  await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
  const response = await saveResponse;
  expect(response.ok(), `Zapis relacji powinien się powieść (${response.status()})`).toBeTruthy();
  await expect(dialog).toHaveCount(0);
  return response;
}

export function structurePanelSchoolRow(panel: Locator, school: StructureSchool) {
  return panel
    .getByRole("gridcell", { name: school.id, exact: true })
    .locator('xpath=ancestor::*[@role="row"][1]');
}

export async function openStructureResults(
  page: Page,
  panel: Locator,
  action: "Pokaż zaznaczone" | "Pokaż wszystkie",
) {
  const popupPromise = page.waitForEvent("popup");
  await panel.getByRole("button", { name: action, exact: true }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  await expect(popup.locator("ag-grid-angular").last()).toBeVisible();
  return popup;
}

export async function openStructureEditDialog(
  app: Octopus,
  owner: StructureSchool,
  related: StructureSchool,
) {
  const panel = await openSchoolStructure(app, owner);
  await structurePanelSchoolRow(panel, related)
    .locator("mat-icon")
    .filter({ hasText: "edit" })
    .click();
  const dialog = app.dialog("Edycja struktury");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(owner.name);
  await expect(dialog).toContainText(related.name);
  return dialog;
}

export async function selectStructureEditValue(
  app: Octopus,
  dialog: Locator,
  field: "type" | "hierarchy",
  value: string,
) {
  await dialog
    .getByRole("combobox")
    .nth(field === "type" ? 0 : 1)
    .click();
  await app.page.getByRole("option", { name: value, exact: true }).click();
  await expect(dialog.getByRole("combobox").nth(field === "type" ? 0 : 1)).toContainText(value);
}

export async function saveStructureEditDialog(app: Octopus, dialog: Locator) {
  return saveStructureDialog(app, dialog);
}

export async function expectStructureRelationVisible(
  app: Octopus,
  owner: StructureSchool,
  related: StructureSchool,
) {
  const panel = await openSchoolStructure(app, owner);
  const row = structurePanelSchoolRow(panel, related);
  await expect(row, `Struktura powinna zawierać szkołę ${related.id}`).toHaveCount(1);
  await expect(row).toContainText(related.name);
  return row;
}

// Odczytujemy odpowiedź pobraną przez aplikację po otwarciu właściwej szkoły.
// Nie korzystamy z danych poprzednio wyrenderowanych w tabeli.
export async function readStructureRelationId(
  app: Octopus,
  owner: StructureSchool,
  related: StructureSchool,
) {
  const responsePromise = app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === "/api/Institution/GetInstitutionRelations",
  );
  await openSchoolStructure(app, owner);
  const response = await responsePromise;
  expect(response.ok(), "Odczyt struktury powinien się powieść").toBeTruthy();
  const data: unknown = await response.json();

  const ids: number[] = [];
  function collectRelationIds(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectRelationIds(item);
      }
    } else if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      if (String(node.id) === related.id && Number(node.institutionRelationId) > 0) {
        ids.push(Number(node.institutionRelationId));
      }
      for (const child of Object.values(node)) {
        collectRelationIds(child);
      }
    }
  }

  collectRelationIds(data);
  expect(
    ids.length,
    `Szkoła ${related.id} nie powinna mieć zduplikowanej relacji w drzewie`,
  ).toBeLessThanOrEqual(1);
  return ids[0] ?? null;
}

export async function deleteStructureRelation(
  app: Octopus,
  owner: StructureSchool,
  related: StructureSchool,
  options: { ifExists?: boolean } = {},
) {
  const panel = await openSchoolStructure(app, owner);
  const row = structurePanelSchoolRow(panel, related);

  if (options.ifExists && (await row.count()) === 0) return false;

  await expect(row, `Struktura powinna zawierać relację ze szkołą ${related.id}`).toHaveCount(1);
  await row.locator("mat-icon").filter({ hasText: "delete_outline" }).click();

  const confirmation = app.page.locator("mat-dialog-container").filter({
    hasText: "Usuwanie struktury",
  });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(owner.name);
  await expect(confirmation).toContainText(related.name);

  const deleteResponse = app.page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "DELETE" &&
      new URL(response.url()).pathname === "/api/Institution/DeleteInstitutionsRelation"
    );
  });

  await confirmation.getByRole("button", { name: "Tak", exact: true }).click();
  const response = await deleteResponse;
  expect(
    response.ok(),
    `Usunięcie relacji powinno się powieść (${response.status()})`,
  ).toBeTruthy();
  await expect(confirmation).toHaveCount(0);
  await expect(row).toHaveCount(0);
  return true;
}

export async function dismissWarning(page: Page, text: string) {
  const warning = page.locator("mat-dialog-container").filter({ hasText: text });
  await expect(warning).toBeVisible();
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);
}

export async function readStructureHistory(app: Octopus, school: StructureSchool) {
  const responsePromise = app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      /^\/api\/(School|SchoolComplex)History\//.test(new URL(response.url()).pathname),
  );
  await app.openPanel("school", school.id);
  await app.page.getByRole("tab", { name: "Historia zmian", exact: true }).click();
  const response = await responsePromise;
  expect(response.ok(), "Odczyt historii powinien się powieść").toBe(true);
  return (await response.json()) as {
    data: Array<{
      institutionId: number;
      field: string;
      value: string;
      author: string;
      createdBy: number;
      reason: string;
      date: string;
    }>;
    metaData: { totalItems: number };
  };
}

export async function expectStructureHistoryEntry(
  app: Octopus,
  before: Awaited<ReturnType<typeof readStructureHistory>>,
  after: Awaited<ReturnType<typeof readStructureHistory>>,
  related: StructureSchool,
  action: string,
  userId: number,
) {
  expect(after.metaData.totalItems).toBeGreaterThan(before.metaData.totalItems);
  const entry = after.data[0];
  expect(entry.field).toBe("Struktura");
  expect(entry.value).toContain(action);
  expect(entry.value).toContain(`ID:${related.id}`);
  expect(entry.createdBy).toBe(userId);
  expect(entry.author.trim()).not.toBe("");
  expect(entry.reason.trim()).not.toBe("");
  expect(Number.isFinite(Date.parse(entry.date))).toBe(true);
  const history = app.page.getByRole("tabpanel", { name: "Historia zmian", exact: true });
  await expect(
    history.getByRole("gridcell", { name: entry.value, exact: true }).first(),
  ).toBeVisible();
}
