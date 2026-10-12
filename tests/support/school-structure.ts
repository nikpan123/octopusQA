import { expect, type Locator, type Page } from "@playwright/test";

import { Octopus, typeValue } from "./octopus";

export type StructureSchool = {
  id: string;
  name: string;
};

export async function openSchoolStructure(app: Octopus, school: StructureSchool) {
  await app.openPanel("school", school.id);

  await app.page.getByRole("tab", { name: "Struktura", exact: true }).click();

  const panel = app.page.getByRole("tabpanel", { name: "Struktura", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Dodaj powiązanie", exact: true })).toBeVisible();

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
  await relatedRow.getByRole("gridcell").first().click();
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

export async function dismissWarning(page: Page, text: string) {
  const warning = page.locator("mat-dialog-container").filter({ hasText: text });
  await expect(warning).toBeVisible();
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);
}
