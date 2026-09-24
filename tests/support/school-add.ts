import { expect, type Locator, type Page, type Request } from "@playwright/test";

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

// Etykieta i mat-form-field są rodzeństwem wewnątrz input-item. Ograniczenie
// do tego kontenera odróżnia np. pole „Nazwa z SIO” od nagłówka tabeli szkół.
export function schoolAddTextField(form: Locator, label: string) {
  return form
    .locator(".new-school__input-item")
    .filter({ hasText: label })
    .locator('input:not([type="checkbox"])');
}

export async function fillSchoolAddTextField(form: Locator, label: string, value: string) {
  const input = schoolAddTextField(form, label);
  await expect(input, `Pole formularza szkoły „${label}” powinno być jednoznaczne`).toHaveCount(1);
  await expect(input).toBeEditable();
  await typeValue(input, value);
  return input;
}

export async function fillSchoolPhone(form: Locator, digits: string) {
  const input = schoolAddTextField(form, "Nr telefonu");
  await expect(input, "Pole numeru telefonu powinno być jednoznaczne").toHaveCount(1);
  await expect(input).toBeEditable();
  await input.fill(digits);
  await input.press("Tab");
  await expect.poll(async () => (await input.inputValue()).replace(/\D/g, "")).toBe(digits);
  return input;
}

export function schoolPanelTextField(scope: Locator, label: string) {
  return scope
    .getByText(label, { exact: true })
    .locator('xpath=following::input[not(@type="checkbox")][1]');
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
  const postalCodeInput = address.locator('input[id="zip_code_input"]');
  const cityInput = address.getByRole("combobox").nth(1);

  // Po ponownym otwarciu edycji aplikacja zachowuje kryteria i utworzony
  // wcześniej adres. Nowy kod był wtedy wyszukiwany razem ze starą
  // miejscowością, np. „18-312” + „Gdańsk”, co dawało pustą tabelę.
  await address.getByRole("button", { name: "Wyczyść pola", exact: true }).click();
  await expect(postalCodeInput).toHaveValue("");
  await expect(cityInput).toHaveValue("");

  // Pole kodu korzysta z autocomplete. Atomowe fill() ustawia widoczną
  // wartość, ale nie zawsze uruchamia wyszukiwanie. Wpisanie cyfr jak przez
  // użytkownika i wybranie podpowiedzi emituje pełną sekwencję zdarzeń.
  await postalCodeInput.click();
  await postalCodeInput.pressSequentially(postalCode.replace(/\D/g, ""), { delay: 150 });
  await expect(postalCodeInput).toHaveValue(postalCode);

  const postalCodeOption = address.page().getByRole("option", {
    name: postalCode,
    exact: true,
  });
  await expect(postalCodeOption).toBeVisible();
  await postalCodeOption.click();

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

export async function saveSchoolStreetAddress(
  address: Locator,
  postalCode: string,
  city: string,
  street: string,
  number: string,
) {
  const cityRow = await searchSchoolCity(address, postalCode, city);
  await expect(cityRow).toHaveCount(1);
  await cityRow.click();

  const streetSearch = address
    .getByText("Ulica:", { exact: true })
    .locator("xpath=ancestor::*[.//input][1]")
    .locator("input")
    .first();
  await typeValue(streetSearch, street);
  const streetCell = address.getByRole("cell", { name: street, exact: true });
  await expect(streetCell).toHaveCount(1);
  await streetCell.locator("xpath=ancestor::tr[1]").click();

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
  let saveRequestBody = "";
  const isSchoolSave = (url: string, method: string) =>
    method === "POST" && new URL(url).pathname === "/api/Institution/AddNewInstitution";
  const countRequest = (request: Request) => {
    if (!isSchoolSave(request.url(), request.method())) return;
    saveRequestCount += 1;
    saveRequestBody = request.postData() ?? "";
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
  return { schoolId, saveRequestCount, saveRequestBody };
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
