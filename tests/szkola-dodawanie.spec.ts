import type { Page } from "@playwright/test";

import { test, expect, type Scenario } from "./support/scenario";
import {
  DEFAULT_CITY,
  DEFAULT_POSTAL_CODE,
  SUPPORTED_SCHOOL_TYPES,
  cancelSchoolAdd,
  expectSchoolSaveBlocked,
  fillSchoolAddTextField,
  fillSchoolName,
  fillSchoolPhone,
  openSchoolAddForm,
  openSchoolAddressForm,
  prepareCompleteSchoolAdd,
  saveSchoolAdd,
  saveSchoolAddress,
  saveSchoolStreetAddress,
  searchSchoolCity,
  selectSchoolType,
  schoolAddTextField,
  schoolPanelTextField,
} from "./support/school-add";

test.describe.configure({ mode: "parallel" });

async function recordRetainedSchool(scenario: Scenario, schoolId: string, number: string) {
  await scenario.record("schoolId", schoolId);
  await scenario.record("schoolAddress", `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`);
  await scenario.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
}

function schoolDetails(page: Page) {
  return page
    .getByRole("heading", { name: "Dane podstawowe szkoły", exact: true })
    .locator("xpath=ancestor::*[.//input][1]");
}

function validRegon(seed: number) {
  const weights = [8, 9, 2, 3, 4, 5, 6, 7];
  const body = String(seed).padStart(8, "0").slice(-8);
  const checksum =
    body.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0) % 11;
  return `${body}${checksum === 10 ? 0 : checksum}`;
}

function validNip(seed: number) {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

  for (let offset = 0; offset < 100; offset += 1) {
    const body = String(seed + offset)
      .padStart(9, "0")
      .slice(-9);
    const checksum =
      body.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0) % 11;
    if (checksum < 10) return `${body}${checksum}`;
  }

  throw new Error("Nie udało się wygenerować poprawnego numeru NIP");
}

const additionalSchoolTypeCases = [
  { id: "SCH-21", formType: "Technikum", panelLevel: "Szkoła Średnia" },
  {
    id: "SCH-22",
    formType: "Placówka doskonalenia nauczycieli",
    panelLevel: "Inny",
  },
  { id: "SCH-23", formType: "Zespół szkół", panelLevel: "Zespół Szkół" },
  { id: "SCH-24", formType: "Szkoła NPC", panelLevel: "Szkoła Podstawowa" },
  { id: "SCH-25", formType: "Przedszkole", panelLevel: "Przedszkole" },
] as const;

// =============================================================================
// PODSTAWOWY PRZEPŁYW I ZAPIS
// =============================================================================

test("SCH-03: minimalny poprawny formularz tworzy szkołę @school @school-add @positive", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId, saveRequestCount } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
  );
  await expect(s.app.detail("level")).toHaveValue("Szkoła Podstawowa");
  await expect(page.getByRole("checkbox", { name: "Testowy", exact: true })).toBeChecked();
  expect(saveRequestCount).toBe(1);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-04: brak nazwy blokuje zapis szkoły @school @school-add @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, String(Date.now()));

  await expectSchoolSaveBlocked(page, form);
  await cancelSchoolAdd(form);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-05: brak typu blokuje zapis szkoły @school @school-add @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, String(Date.now()));

  await expectSchoolSaveBlocked(page, form);
  await cancelSchoolAdd(form);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-06: brak adresu blokuje zapis szkoły @school @school-add @validation @address", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);

  await expectSchoolSaveBlocked(page, form);
  await cancelSchoolAdd(form);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-09: anulowanie adresu nie przenosi danych do formularza szkoły @school @school-add @address @cancel", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  const city = await searchSchoolCity(address, DEFAULT_POSTAL_CODE);
  await expect(city).toHaveCount(1);
  await city.click();
  await address.locator('input[id="number"]').fill(number);
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);

  await expect
    .poll(async () => {
      const values = await form
        .locator("input")
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

      return [DEFAULT_POSTAL_CODE, DEFAULT_CITY, number].some((value) => values.includes(value));
    })
    .toBe(false);
  await expectSchoolSaveBlocked(page, form);
  await cancelSchoolAdd(form);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-10: dwa szybkie kliknięcia Zapisz tworzą tylko jedną szkołę @school @school-add @concurrency", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId, saveRequestCount } = await saveSchoolAdd(page, form, {
    clickCount: 2,
    delay: 100,
  });
  await s.app.markTestRecord();

  expect(saveRequestCount).toBe(1);
  await s.app.searchSchool(s.schoolName, schoolId);
  await expect(page.getByRole("heading", { name: "Rekordów: 1", exact: true })).toBeVisible();
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-11: dane szkoły są trwałe po ponownym otwarciu @school @school-add @positive", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await s.app.openPanel("school", schoolId);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
  );
  await expect(page.getByRole("checkbox", { name: "Testowy", exact: true })).toBeChecked();
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-12: nową szkołę można znaleźć po nazwie i zidentyfikować po ID @school @school-add @search", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await s.app.searchSchool(s.schoolName, schoolId);
  const row = s.app
    .results("school")
    .getByRole("row")
    .filter({ has: page.getByRole("gridcell", { name: schoolId, exact: true }) });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(s.schoolName);
  await expect(page.getByRole("heading", { name: "Rekordów: 1", exact: true })).toBeVisible();
  await recordRetainedSchool(s, schoolId, number);
});

// =============================================================================
// TYPY SZKÓŁ
// =============================================================================

test("SCH-13: słownik zawiera wszystkie obsługiwane typy szkół @school @school-add @dictionary", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await form.getByRole("combobox").first().click();

  await expect(page.getByRole("option")).toHaveCount(SUPPORTED_SCHOOL_TYPES.length);
  const schoolTypes = (await page.getByRole("option").allTextContents()).map((type) => type.trim());
  expect(schoolTypes).toEqual(SUPPORTED_SCHOOL_TYPES);
  await s.record("schoolTypes", JSON.stringify(schoolTypes));

  await page.getByRole("option", { name: "Szkoła podstawowa", exact: true }).click();
  await cancelSchoolAdd(form);
});

test("SCH-14: formularz tworzy liceum z właściwym typem @school @school-add @positive @school-type", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number, "Liceum");
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();
  await s.app.openPanel("school", schoolId);

  await expect(s.app.detail("level")).toHaveValue("Szkoła Średnia");
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolType", "Liceum");
  await recordRetainedSchool(s, schoolId, number);
});

for (const { id, formType, panelLevel } of additionalSchoolTypeCases) {
  test(`${id}: formularz tworzy szkołę typu ${formType} @school @school-add @positive @school-type`, async ({
    page,
    scenario: s,
  }) => {
    const number = String(Date.now());
    const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number, formType);
    const { schoolId } = await saveSchoolAdd(page, form);
    await s.app.markTestRecord();
    await s.app.openPanel("school", schoolId);

    await expect(s.app.detail("name")).toHaveValue(s.schoolName);
    await expect(s.app.detail("address")).toHaveValue(
      `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
    );
    await expect(s.app.detail("level")).toHaveValue(new RegExp(`^${panelLevel}$`, "i"));
    await s.record("schoolType", formType);
    await s.record("displayedSchoolLevel", await s.app.detail("level").inputValue());
    await recordRetainedSchool(s, schoolId, number);
  });
}

// =============================================================================
// NAZWA I DUPLIKATY
// =============================================================================

test("SCH-17: nazwa złożona wyłącznie ze spacji nie pozwala utworzyć szkoły @school @school-add @validation", async ({
  page,
  scenario: s,
}) => {
  let saveAttempts = 0;
  await page.route("**/api/Institution/AddNewInstitution", async (route) => {
    saveAttempts += 1;
    await route.fulfill({ status: 422, contentType: "application/json", body: "{}" });
  });

  const form = await openSchoolAddForm(s.app);
  const name = s.app.field(form, "* Nazwa");
  await name.fill("   ");
  await name.press("Tab");
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, String(Date.now()));

  await expectSchoolSaveBlocked(page, form);
  expect(saveAttempts).toBe(0);
});

test("SCH-18: nazwa z polskimi znakami i interpunkcją jest zachowana @school @school-add @positive @name", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const schoolName = `${s.id} Szkoła Łódź – nr 1`;
  const form = await prepareCompleteSchoolAdd(page, s.app, schoolName, number);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("name")).toHaveValue(schoolName);
  await s.record("createdSchoolName", schoolName);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-27: spacje na brzegach nazwy są usuwane przy zapisie @school @school-add @positive @name", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const nameWithSpaces = `  ${s.schoolName}  `;
  const form = await prepareCompleteSchoolAdd(page, s.app, nameWithSpaces, number);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("submittedSchoolName", nameWithSpaces);
  await s.record("createdSchoolName", await s.app.detail("name").inputValue());
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-28: identyczna nazwa i adres mogą utworzyć dwa różne rekordy @school @school-add @positive @duplicate", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const firstForm = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId: firstSchoolId } = await saveSchoolAdd(page, firstForm);
  await s.app.markTestRecord();

  const secondForm = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId: secondSchoolId } = await saveSchoolAdd(page, secondForm);
  await s.app.markTestRecord();

  expect(secondSchoolId).not.toBe(firstSchoolId);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
  );
  await s.app.searchSchool(s.schoolName, secondSchoolId, 2);
  await s.record("schoolIds", JSON.stringify([firstSchoolId, secondSchoolId]));
  await s.record("schoolAddress", `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`);
  await s.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
});

test("SCH-29: identyczna nazwa pod różnymi adresami tworzy dwa różne rekordy @school @school-add @positive @duplicate", async ({
  page,
  scenario: s,
}) => {
  const firstNumber = String(Date.now());
  const secondNumber = String(Number(firstNumber) + 1);
  const firstForm = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, firstNumber);
  const { schoolId: firstSchoolId } = await saveSchoolAdd(page, firstForm);
  await s.app.markTestRecord();

  const secondForm = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, secondNumber);
  const { schoolId: secondSchoolId } = await saveSchoolAdd(page, secondForm);
  await s.app.markTestRecord();

  expect(secondSchoolId).not.toBe(firstSchoolId);
  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${secondNumber}`,
  );
  await s.app.searchSchool(s.schoolName, secondSchoolId, 2);
  await s.record("schoolIds", JSON.stringify([firstSchoolId, secondSchoolId]));
  await s.record(
    "schoolAddresses",
    JSON.stringify([
      `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${firstNumber}`,
      `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${secondNumber}`,
    ]),
  );
  await s.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
});

// =============================================================================
// ADRES
// =============================================================================

test("SCH-07: poprawny kod pocztowy pozwala wybrać miejscowość i zapisać adres @school @school-add @address", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, number);

  const expectedAddress = `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`;
  await expect
    .poll(() =>
      form
        .locator("input")
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    )
    .toEqual(expect.arrayContaining([DEFAULT_POSTAL_CODE, DEFAULT_CITY, number]));
  await s.record("schoolAddress", expectedAddress);
  await cancelSchoolAdd(form);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-08: nieznany kod pocztowy blokuje zapis adresu i szkoły @school @school-add @validation @address", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  const unknownPostalCode = "00-000";
  const city = await searchSchoolCity(address, unknownPostalCode);

  await expect(city).toHaveCount(0);
  await address.getByRole("button", { name: "Zapisz", exact: true }).click();
  const missingAddress = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Zapisywanie adresu", exact: true }),
  });
  await expect(missingAddress).toContainText("Brak wpisanego adresu");
  await missingAddress.getByRole("button", { name: "OK", exact: true }).click();
  await expect(missingAddress).toHaveCount(0);
  await expect(address).toBeVisible();
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);

  await expect
    .poll(async () => {
      const values = await form
        .locator("input")
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

      return values.includes(unknownPostalCode);
    })
    .toBe(false);
  await expectSchoolSaveBlocked(page, form);
  await cancelSchoolAdd(form);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-19: numer budynku z literą jest zachowany w adresie @school @school-add @address", async ({
  page,
  scenario: s,
}) => {
  const number = "12A";
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, number);

  await expect
    .poll(() =>
      form
        .locator("input")
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    )
    .toEqual(expect.arrayContaining([DEFAULT_POSTAL_CODE, DEFAULT_CITY, number]));
  await cancelSchoolAdd(form);
});

test("SCH-20: wyczyszczenie wyszukiwania adresu usuwa wpisane kryteria @school @school-add @address @clear", async ({
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  const address = await openSchoolAddressForm(s.app.page, form);
  const postalCode = address.locator('input[id="zip_code_input"]');
  const city = address.getByRole("combobox").nth(1);
  const street = address.getByRole("textbox", { name: "Assignee", exact: true });

  await postalCode.fill(DEFAULT_POSTAL_CODE);
  await city.fill(DEFAULT_CITY);
  await street.fill("Testowa");
  await address.getByRole("button", { name: "Wyczyść pola", exact: true }).click();

  await expect(postalCode).toHaveValue("");
  await expect(city).toHaveValue("");
  await expect(street).toHaveValue("");
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);
  await cancelSchoolAdd(form);
});

test("SCH-26: numer budynku z separatorem jest zachowany po utworzeniu szkoły @school @school-add @positive @address", async ({
  page,
  scenario: s,
}) => {
  const number = "12/3";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
  );
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-41: brak numeru budynku blokuje zapis adresu i szkoły @school @school-add @validation @address", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  const city = await searchSchoolCity(address, DEFAULT_POSTAL_CODE);
  await expect(city).toHaveCount(1);
  await city.click();

  await address.getByRole("button", { name: "Zapisz", exact: true }).click();
  const missingAddress = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Zapisywanie adresu", exact: true }),
  });
  await expect(missingAddress).toContainText("Brak wprowadzonego numeru");
  await missingAddress.getByRole("button", { name: "OK", exact: true }).click();
  await expect(missingAddress).toHaveCount(0);
  await expect(address).toBeVisible();
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);
  await expectSchoolSaveBlocked(page, form);
});

test("SCH-43: pełny adres z ulicą jest zachowany po utworzeniu szkoły @school @school-add @positive @address", async ({
  page,
  scenario: s,
}) => {
  const addressData = {
    postalCode: "18-312",
    city: "Górskie Ponikły-Stok",
    street: "Kartuska",
    number: "123",
  };
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolStreetAddress(
    address,
    addressData.postalCode,
    addressData.city,
    addressData.street,
    addressData.number,
  );
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  for (const value of Object.values(addressData))
    await expect(s.app.detail("address")).toHaveValue(new RegExp(value, "i"));
  await s.record("schoolAddress", JSON.stringify(addressData));
  await s.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
  await s.record("schoolId", schoolId);
});

test("SCH-44: wyczyszczenie wybranego adresu usuwa utworzony adres @school @school-add @validation @address @clear", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, s.schoolName);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);
  const city = await searchSchoolCity(address, DEFAULT_POSTAL_CODE);
  await expect(city).toHaveCount(1);
  await city.click();
  await address.locator('input[id="number"]').fill("123");
  await address.getByRole("button", { name: "Wyczyść pola", exact: true }).click();
  await expect(address.locator('input[id="number"]')).toHaveValue("");

  await address.getByRole("button", { name: "Zapisz", exact: true }).click();
  const missingAddress = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Zapisywanie adresu", exact: true }),
  });
  await expect(missingAddress).toContainText("Brak wpisanego adresu");
  await missingAddress.getByRole("button", { name: "OK", exact: true }).click();
  await expect(missingAddress).toHaveCount(0);
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);
  await expectSchoolSaveBlocked(page, form);
});

test("SCH-45: ponowne dodanie adresu zastępuje adres przed utworzeniem szkoły @school @school-add @positive @address", async ({
  page,
  scenario: s,
}) => {
  const firstNumber = String(Date.now());
  const replacement = {
    postalCode: "18-312",
    city: "Górskie Ponikły-Stok",
    street: "Kartuska",
    number: "456",
  };
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, firstNumber);
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolStreetAddress(
    address,
    replacement.postalCode,
    replacement.city,
    replacement.street,
    replacement.number,
  );
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("address")).not.toHaveValue(new RegExp(firstNumber));
  for (const value of Object.values(replacement))
    await expect(s.app.detail("address")).toHaveValue(new RegExp(value, "i"));
  await s.record("replacedSchoolAddress", JSON.stringify(replacement));
  await s.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
  await s.record("schoolId", schoolId);
});

test("SCH-46: anulowanie zmiany adresu zachowuje poprzedni adres @school @school-add @positive @address @cancel", async ({
  page,
  scenario: s,
}) => {
  const originalNumber = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, originalNumber);
  const address = await openSchoolAddressForm(page, form);
  const replacementCity = await searchSchoolCity(address, "18-312", "Górskie Ponikły-Stok");
  await expect(replacementCity).toHaveCount(1);
  await replacementCity.click();
  await address.locator('input[id="number"]').fill("456");
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);

  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${originalNumber}`,
  );
  await s.record("cancelledReplacementAddress", "18-312 Górskie Ponikły-Stok 456");
  await recordRetainedSchool(s, schoolId, originalNumber);
});

test("SCH-47: wyczyszczenie adresu i anulowanie zachowuje poprzedni adres @school @school-add @positive @address @cancel @clear", async ({
  page,
  scenario: s,
}) => {
  const originalNumber = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, originalNumber);
  const address = await openSchoolAddressForm(page, form);
  await address.getByRole("button", { name: "Wyczyść pola", exact: true }).click();
  await expect(address.locator('input[id="zip_code_input"]')).toHaveValue("");
  await expect(address.locator('input[id="number"]')).toHaveValue("");
  await address.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(address).toHaveCount(0);

  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${originalNumber}`,
  );
  await recordRetainedSchool(s, schoolId, originalNumber);
});

test("SCH-15: usunięcie dodanego adresu ponownie blokuje zapis szkoły @school @school-add @address @validation", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);

  await form.getByRole("button", { name: "Usuń adres szkoły", exact: true }).click();
  await expect
    .poll(async () => {
      const values = await form
        .locator("input")
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

      return [DEFAULT_POSTAL_CODE, DEFAULT_CITY, number].some((value) => values.includes(value));
    })
    .toBe(false);
  await expectSchoolSaveBlocked(page, form);
  await cancelSchoolAdd(form);
});

// =============================================================================
// DANE OPCJONALNE I IDENTYFIKATORY
// =============================================================================

test("SCH-30: nazwa z SIO jest zachowana po utworzeniu szkoły @school @school-add @positive @optional-data", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const sioName = `${s.id} Nazwa SIO`;
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "Nazwa z SIO", sioName);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(sioName);
  await s.record("schoolSioName", sioName);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-32: liczba uczniów jest zachowana po utworzeniu szkoły @school @school-add @positive @optional-data", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const studentCount = "123";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "Liczba uczniów", studentCount);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(schoolPanelTextField(schoolDetails(page), "Liczba uczniów")).toHaveValue(
    studentCount,
  );
  await s.record("schoolStudentCount", studentCount);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-33: numer RSPO jest przekazywany podczas tworzenia szkoły @school @school-add @positive @identifier", async ({
  page,
  scenario: s,
}) => {
  const timestamp = Date.now();
  const number = String(timestamp);
  const rspo = String((timestamp % 900_000) + 100_000);
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "Nr RSPO", rspo);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(rspo);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolRspo", rspo);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-34: numer REGON jest przekazywany podczas tworzenia szkoły @school @school-add @positive @identifier", async ({
  page,
  scenario: s,
}) => {
  const timestamp = Date.now();
  const number = String(timestamp);
  const regon = validRegon(timestamp);
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "REGON", regon);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(regon);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolRegon", regon);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-35: numer NIP jest przekazywany podczas tworzenia szkoły @school @school-add @positive @identifier", async ({
  page,
  scenario: s,
}) => {
  const timestamp = Date.now();
  const number = String(timestamp);
  const nip = validNip(timestamp);
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "NIP", nip);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(nip);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolNip", nip);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-51: REGON z wiodącymi zerami zachowuje pełną długość @school @school-add @positive @identifier", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const regon = validRegon(1);
  expect(regon).toBe("000000017");
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "REGON", regon);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(`"${regon}"`);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolRegon", regon);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-52: NIP z wiodącymi zerami zachowuje pełną długość @school @school-add @positive @identifier", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const nip = validNip(1);
  expect(nip).toBe("0000000017");
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "NIP", nip);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(`"${nip}"`);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolNip", nip);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-49: zerowa liczba uczniów jest zachowana @school @school-add @positive @optional-data", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const studentCount = "0";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "Liczba uczniów", studentCount);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(schoolPanelTextField(schoolDetails(page), "Liczba uczniów")).toHaveValue(
    studentCount,
  );
  await s.record("schoolStudentCount", studentCount);
  await recordRetainedSchool(s, schoolId, number);
});

// =============================================================================
// DANE KONTAKTOWE
// =============================================================================

test("SCH-31: WWW i e-mail są zachowane po utworzeniu szkoły @school @school-add @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const website = `https://school-${number}.example.com`;
  const email = `school_${number}@example.com`;
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "WWW", website);
  await fillSchoolAddTextField(form, "E-mail", email);
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(website);
  await expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(email);
  await s.record("schoolWebsite", website);
  await s.record("schoolEmail", email);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-53: pełny adres WWW ze ścieżką i parametrami jest zachowany @school @school-add @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const website = `https://qa.example.com/school/${number}?source=regression&active=1`;
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "WWW", website);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(website);
  await expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(website);
  await s.record("schoolWebsite", website);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-54: e-mail z wielkimi literami jest normalizowany do małych liter @school @school-add @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const email = `School.${number}@QA.Example.com`;
  const normalizedEmail = email.toLowerCase();
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "E-mail", email);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(email);
  await expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(normalizedEmail);
  await s.record("submittedSchoolEmail", email);
  await s.record("schoolEmail", normalizedEmail);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-36: przełącznik komórka ustawia format numeru i resetuje się po zapisie @school @school-add @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const phone = "501234567";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const mobile = form.getByRole("checkbox", { name: "komórka", exact: true });
  await expect(mobile).not.toBeChecked();
  await mobile.check();
  const phoneInput = await fillSchoolPhone(form, phone);
  await expect(phoneInput).toHaveValue(/^\d{3}-\d{3}-\d{3}$/);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody.replace(/\D/g, "")).toContain(phone);
  await expect(schoolPanelTextField(schoolDetails(page), "Telefon")).toHaveValue(/501\D*234\D*567/);
  await expect(
    schoolDetails(page).getByRole("checkbox", { name: "komórka", exact: true }),
  ).not.toBeChecked();
  await s.record("schoolPhone", phone);
  await s.record("schoolPhoneFormat", "mobile");
  await s.record("schoolPhoneTypeSelectorAfterSave", "unchecked");
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-37: telefon stacjonarny zachowuje właściwy format po utworzeniu szkoły @school @school-add @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const phone = "312321412";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const mobile = form.getByRole("checkbox", { name: "komórka", exact: true });
  await expect(mobile).not.toBeChecked();
  const phoneInput = await fillSchoolPhone(form, phone);
  await expect(phoneInput).toHaveValue(/^\(\d{2}\)\s*-\s*\d{3}\s*-\s*\d{2}\s*-\s*\d{2}$/);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody.replace(/\D/g, "")).toContain(phone);
  await expect(schoolPanelTextField(schoolDetails(page), "Telefon")).toHaveValue(
    /\(31\)\D*232\D*14\D*12/,
  );
  await expect(
    schoolDetails(page).getByRole("checkbox", { name: "komórka", exact: true }),
  ).not.toBeChecked();
  await s.record("schoolPhone", phone);
  await s.record("schoolPhoneFormat", "landline");
  await s.record("schoolPhoneTypeSelectorAfterSave", "unchecked");
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-38: niepoprawny e-mail blokuje utworzenie szkoły @school @school-add @validation @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  let saveAttempts = 0;
  await page.route("**/api/Institution/AddNewInstitution", async (route) => {
    saveAttempts += 1;
    await route.fulfill({ status: 422, contentType: "application/json", body: "{}" });
  });
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "E-mail", "niepoprawny-email");

  await expectSchoolSaveBlocked(page, form);
  expect(saveAttempts).toBe(0);
});

test("SCH-39: niepełny telefon blokuje utworzenie szkoły @school @school-add @validation @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  let saveAttempts = 0;
  await page.route("**/api/Institution/AddNewInstitution", async (route) => {
    saveAttempts += 1;
    await route.fulfill({ status: 422, contentType: "application/json", body: "{}" });
  });
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const phone = schoolAddTextField(form, "Nr telefonu");
  await expect(phone).toHaveCount(1);
  await phone.fill("50123");
  await phone.press("Tab");

  await expectSchoolSaveBlocked(page, form);
  expect(saveAttempts).toBe(0);
});

test("SCH-40: przełączenie komórka zmienia maskę bez utraty cyfr @school @school-add @contact @format", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const phone = "312321412";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const mobile = form.getByRole("checkbox", { name: "komórka", exact: true });

  await mobile.check();
  const phoneInput = await fillSchoolPhone(form, phone);
  await expect(phoneInput).toHaveValue(/^\d{3}-\d{3}-\d{3}$/);
  await mobile.uncheck();
  await expect(phoneInput).toHaveValue(/^\(\d{2}\)\s*-\s*\d{3}\s*-\s*\d{2}\s*-\s*\d{2}$/);
  await expect.poll(async () => (await phoneInput.inputValue()).replace(/\D/g, "")).toBe(phone);

  await cancelSchoolAdd(form);
});

test("SCH-48: e-mail z subdomeną jest zachowany @school @school-add @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const email = `school_${number}@qa.example.com`;
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "E-mail", email);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  expect(saveRequestBody).toContain(email);
  await expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(email);
  await s.record("schoolEmail", email);
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-50: e-mail z aliasem plus jest odrzucany przez backend @school @school-add @validation @contact", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const email = `school+${number}@qa.example.com`;
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "E-mail", email);
  const failedSave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/Institution/AddNewInstitution",
  );

  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  const response = await failedSave;
  expect(response.ok()).toBe(false);
  await response.finished();

  const warning = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Uwaga", exact: true }),
  });
  await expect(warning).toContainText("Email jest źle podany");
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);
  await expect(form).toHaveCount(0);
  await expect(page).toHaveURL(/\/school\/school-panel$/);
  await expect(s.app.detail("name")).toHaveValue("");
  await s.record("rejectedSchoolEmail", email);
  await s.record("schoolCreationStatus", "REJECTED_BY_EMAIL_VALIDATION");
});

// =============================================================================
// ODPORNOŚĆ TECHNICZNA
// =============================================================================

test("SCH-16: błąd serwera nie otwiera nieistniejącej szkoły @school @school-add @error-handling", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  let saveAttempts = 0;

  await page.route("**/api/Institution/AddNewInstitution", async (route) => {
    saveAttempts += 1;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Kontrolowany błąd testowy" }),
    });
  });
  const failedSave = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/Institution/AddNewInstitution",
  );

  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  const response = await failedSave;
  expect(response.status()).toBe(500);
  await response.finished();
  await expect(form).toHaveCount(0);
  expect(saveAttempts).toBe(1);
  await expect(page).toHaveURL(/\/school\/school-panel$/);
  await expect(s.app.detail("name")).toHaveValue("");
  await expect(s.app.detail("address")).toHaveValue("");
});

// =============================================================================
// PEŁNY PRZEPŁYW REGRESYJNY
// =============================================================================

test("SCH-42: pełny formularz zachowuje wszystkie dane opcjonalne @school @school-add @positive @optional-data @contact @identifier", async ({
  page,
  scenario: s,
}) => {
  const timestamp = Date.now();
  const number = String(timestamp);
  const sioName = `${s.id} Pełna nazwa SIO`;
  const website = `https://school-${timestamp}.example.com`;
  const email = `school_${timestamp}@example.com`;
  const studentCount = "321";
  const rspo = String((timestamp % 900_000) + 100_000);
  const regon = validRegon(timestamp);
  const nip = validNip(timestamp);
  const phone = "501234567";
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);

  await fillSchoolAddTextField(form, "Nazwa z SIO", sioName);
  await fillSchoolAddTextField(form, "WWW", website);
  await fillSchoolAddTextField(form, "E-mail", email);
  await fillSchoolAddTextField(form, "Liczba uczniów", studentCount);
  await fillSchoolAddTextField(form, "Nr RSPO", rspo);
  await fillSchoolAddTextField(form, "REGON", regon);
  await fillSchoolAddTextField(form, "NIP", nip);
  await form.getByRole("checkbox", { name: "komórka", exact: true }).check();
  await fillSchoolPhone(form, phone);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  for (const value of [sioName, website, email, studentCount, rspo, regon, nip])
    expect(saveRequestBody).toContain(value);
  expect(saveRequestBody.replace(/\D/g, "")).toContain(phone);

  // Kluczowe pola sprawdzamy po ponownym otwarciu rekordu, a nie tylko
  // bezpośrednio po odpowiedzi POST AddNewInstitution.
  await s.app.openPanel("school", schoolId);
  await expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(sioName);
  await expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(website);
  await expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(email);
  await expect(schoolPanelTextField(schoolDetails(page), "Liczba uczniów")).toHaveValue(
    studentCount,
  );
  await expect(schoolPanelTextField(schoolDetails(page), "Telefon")).toHaveValue(/501\D*234\D*567/);
  await expect(
    schoolDetails(page).getByRole("checkbox", { name: "komórka", exact: true }),
  ).not.toBeChecked();
  await s.record(
    "schoolOptionalData",
    JSON.stringify({ sioName, website, email, studentCount, rspo, regon, nip, phone }),
  );
  await recordRetainedSchool(s, schoolId, number);
});


// =============================================================================
// DODATKOWE SCENARIUSZE REGRESYJNE
// =============================================================================

test("SCH-55: pola opcjonalne mogą pozostać puste i szkoła nadal jest trwała @school @school-add @positive @optional-data", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  const { schoolId, saveRequestBody } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  const body = JSON.parse(saveRequestBody) as Record<string, unknown>;
  expect(body.fullName ?? "").toBe("");
  expect(body.email ?? "").toBe("");
  expect(body.www ?? "").toBe("");
  expect(body.regon ?? "").toBe("");
  expect(body.nip ?? "").toBe("");
  expect(body.rspo ?? "").toBe("");

  await s.app.openPanel("school", schoolId);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
  );
  await recordRetainedSchool(s, schoolId, number);
});

test("SCH-56: anulowanie kompletnego formularza po uzupełnieniu danych opcjonalnych nie tworzy szkoły @school @school-add @cancel @optional-data", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number);
  await fillSchoolAddTextField(form, "Nazwa z SIO", `${s.id} anulowane SIO`);
  await fillSchoolAddTextField(form, "WWW", "https://cancelled.example.com");
  await fillSchoolAddTextField(form, "E-mail", `cancelled_${number}@example.com`);
  await fillSchoolAddTextField(form, "Liczba uczniów", "123");

  await cancelSchoolAdd(form);
  await expect(page).toHaveURL(/\/school\/school-panel$/);
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("SCH-57: ponowne otwarcie szkoły zachowuje typ, poziom i adres @school @school-add @positive @persistence", async ({
  page,
  scenario: s,
}) => {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number, "Technikum");
  const { schoolId } = await saveSchoolAdd(page, form);
  await s.app.markTestRecord();

  await s.app.openPanel("school", schoolId);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await expect(s.app.detail("address")).toHaveValue(
    `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`,
  );
  await expect(s.app.detail("level")).toHaveValue(/Szkoła Średnia/i);
  await recordRetainedSchool(s, schoolId, number);
});
