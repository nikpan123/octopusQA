import { test, expect, type Scenario } from "./support/scenario";
import {
  DEFAULT_CITY,
  DEFAULT_POSTAL_CODE,
  SUPPORTED_SCHOOL_TYPES,
  cancelSchoolAdd,
  expectSchoolSaveBlocked,
  fillSchoolName,
  openSchoolAddForm,
  openSchoolAddressForm,
  prepareCompleteSchoolAdd,
  saveSchoolAdd,
  saveSchoolAddress,
  searchSchoolCity,
  selectSchoolType,
} from "./support/school-add";

test.describe.configure({ mode: "parallel" });

async function recordRetainedSchool(scenario: Scenario, schoolId: string, number: string) {
  await scenario.record("schoolId", schoolId);
  await scenario.record("schoolAddress", `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`);
  await scenario.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
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

  await expect(s.app.detail("level")).toHaveValue("Szkoła Średnia");
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.record("schoolType", "Liceum");
  await recordRetainedSchool(s, schoolId, number);
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

for (const { id, formType, panelLevel } of additionalSchoolTypeCases) {
  test(`${id}: formularz tworzy szkołę typu ${formType} @school @school-add @positive @school-type`, async ({
    page,
    scenario: s,
  }) => {
    const number = String(Date.now());
    const form = await prepareCompleteSchoolAdd(page, s.app, s.schoolName, number, formType);
    const { schoolId } = await saveSchoolAdd(page, form);
    await s.app.markTestRecord();

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
