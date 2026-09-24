import { expect, type Locator, type Page } from "@playwright/test";

import { Octopus, typeValue } from "./octopus";

export const DEFAULT_SCHOOL_TYPE = "Szkoła podstawowa";
export const DEFAULT_POSTAL_CODE = "80-064";
export const DEFAULT_CITY = "Gdańsk";
export const SUPPORTED_SCHOOL_TYPES = [
  "Szkoła podstawowa",
  "Liceum",
  "Technikum",
  "Placówka doskonalenia nauczycieli",
  "Zespół szkół",
  "Szkoła NPC",
  "Przedszkole",
] as const;

export async function openSchoolAddForm(app: Octopus) {
  await app.openPanel("school");
  await app.page
    .getByRole("button", { name: "Dodaj", exact: true })
    .filter({ has: app.page.getByText("school", { exact: true }) })
    .click();

  const form = app.dialog("Dodaj nową szkołę");
  await expect(form).toBeVisible();
  return form;
}

export async function fillSchoolName(app: Octopus, form: Locator, name: string) {
  const input = app.field(form, "* Nazwa");
  await typeValue(input, name);
  return input;
}

export async function selectSchoolType(
  page: Page,
  form: Locator,
  schoolType = DEFAULT_SCHOOL_TYPE,
) {
  const type = form.getByRole("combobox").first();
  await type.click();
  await page.getByRole("option", { name: schoolType, exact: true }).click();
  await expect(type).toContainText(schoolType);
  return type;
}

export async function openSchoolAddressForm(page: Page, form: Locator) {
  await form.getByRole("button", { name: "Dodaj adres szkoły", exact: true }).click();
  const address = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Edycja adresu", exact: true }),
  });
  await expect(address).toBeVisible();
  return address;
}

export async function searchSchoolCity(address: Locator, postalCode: string, city = DEFAULT_CITY) {
  await typeValue(address.locator('input[id="zip_code_input"]'), postalCode);
  const row = address.getByRole("row").filter({ hasText: postalCode }).filter({ hasText: city });
  return row;
}

export async function saveSchoolAddress(
  address: Locator,
  postalCode: string,
  city: string,
  number: string,
) {
  const row = await searchSchoolCity(address, postalCode, city);
  await expect(row).toHaveCount(1);
  await row.click();
  await typeValue(address.locator('input[id="number"]'), number);
  await address.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(address).toHaveCount(0);
}

export async function prepareCompleteSchoolAdd(
  page: Page,
  app: Octopus,
  name: string,
  number: string,
  schoolType = DEFAULT_SCHOOL_TYPE,
) {
  const form = await openSchoolAddForm(app);
  await fillSchoolName(app, form, name);
  await selectSchoolType(page, form, schoolType);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, number);
  return form;
}

export async function saveSchoolAdd(
  page: Page,
  form: Locator,
  clickOptions: { clickCount?: number; delay?: number } = {},
) {
  let saveRequestCount = 0;
  const isSchoolSave = (url: string, method: string) =>
    method === "POST" && new URL(url).pathname === "/api/Institution/AddNewInstitution";
  const countRequest = (request: { url(): string; method(): string }) => {
    if (isSchoolSave(request.url(), request.method())) saveRequestCount += 1;
  };
  page.on("request", countRequest);

  try {
    const saved = page.waitForResponse(
      (response) => isSchoolSave(response.url(), response.request().method()),
      { timeout: 20_000 },
    );
    await form.getByRole("button", { name: "Zapisz", exact: true }).click(clickOptions);
    const response = await saved;
    expect(response.ok(), "Zapis szkoły powinien zakończyć się powodzeniem").toBeTruthy();
    await response.finished();
    await expect(form).toHaveCount(0);
    await expect(page).toHaveURL(/\/school\/school-panel\/\d+$/);
  } finally {
    page.off("request", countRequest);
  }

  const schoolId = page.url().split("/").pop() ?? "";
  expect(schoolId).toMatch(/^\d+$/);
  return { schoolId, saveRequestCount };
}

export async function expectSchoolSaveBlocked(page: Page, form: Locator) {
  const save = form.getByRole("button", { name: "Zapisz", exact: true });

  if (await save.isEnabled()) await save.click();

  await expect(form).toBeVisible();
  await expect(page).toHaveURL(/\/school\/school-panel$/);
}

export async function cancelSchoolAdd(form: Locator) {
  await form.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(form).toHaveCount(0);
}
