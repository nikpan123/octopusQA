import type { Page } from "@playwright/test";

import { test, expect, type Scenario } from "./support/scenario";

import type { CreateSchoolApiOptions } from "./support/octopus";

import {
  DEFAULT_CITY,
  DEFAULT_POSTAL_CODE,
  saveSchoolAddress,
  schoolPanelTextField,
} from "./support/school-add";

import {
  cancelSchoolEdit,
  cancelSchoolFieldDelete,
  confirmSchoolFieldDelete,
  addSchoolPhone,
  openSchoolAddressEdit,
  openSchoolEditForm,
  openSchoolFieldDeleteConfirmation,
  openSchoolFieldEdit,
  openSchoolHistory,
  openSchoolSioForm,
  replaceSchoolEditValue,
  saveSchoolSioEdit,
  saveSchoolEdit,
  SCHOOL_SIMPLE_UPDATE_ENDPOINT,
  schoolEditInput,
  schoolFieldEditInputs,
  schoolPhoneMobileCheckbox,
  schoolSioInput,
} from "./support/school-edit";

test.describe.configure({
  mode: "parallel",
});

function schoolDetails(page: Page) {
  return page
    .getByRole("heading", {
      name: "Dane podstawowe szkoły",
      exact: true,
    })
    .locator("xpath=ancestor::*[.//input][1]");
}

async function createSchoolForEdit(
  scenario: Scenario,
  options: CreateSchoolApiOptions = {},
  schoolType = "Szkoła podstawowa",
) {
  const number = String(Date.now());

  const schoolId = await test.step("Przygotowanie: utworzenie szkoły testowej", async () =>
    scenario.app.createSchool(scenario.schoolName, number, schoolType, options));

  await scenario.app.markTestRecord();

  await scenario.record("schoolId", schoolId);

  /*
   * Nie zakładamy konkretnego miasta ani kodu.
   * Odczytujemy faktyczny adres utworzonej szkoły.
   */
  const schoolAddress = await scenario.app.detail("address").inputValue();

  await scenario.record("schoolAddress", schoolAddress);

  await scenario.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");

  return schoolId;
}

// =============================================================================
// PODSTAWOWA EDYCJA
// =============================================================================

test("SCH-EDIT-01: formularz edycji wczytuje nazwę szkoły @school @school-edit @smoke", async ({
  page,
  scenario: s,
}) => {
  await createSchoolForEdit(s);

  const form = await openSchoolEditForm(page);

  await schoolEditInput(form, s.schoolName);

  await cancelSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: s.schoolName', async () =>
    expect(s.app.detail("name")).toHaveValue(s.schoolName));
});

test("SCH-EDIT-02: anulowanie zmiany nazwy zachowuje poprzednią wartość @school @school-edit @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);

  const discardedName = `${s.schoolName} anulowana zmiana`;

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, s.schoolName, discardedName);

  await cancelSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: s.schoolName', async () =>
    expect(s.app.detail("name")).toHaveValue(s.schoolName));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: s.schoolName', async () =>
    expect(s.app.detail("name")).toHaveValue(s.schoolName));
});

test("SCH-EDIT-03: zmiana nazwy jest trwała po ponownym otwarciu szkoły @school @school-edit @positive", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);

  const updatedName = `${s.schoolName} po edycji`;

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, s.schoolName, updatedName);

  await saveSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: updatedName', async () =>
    expect(s.app.detail("name")).toHaveValue(updatedName));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: updatedName', async () =>
    expect(s.app.detail("name")).toHaveValue(updatedName));

  await s.record("updatedSchoolName", updatedName);
});

test("SCH-EDIT-04: zmiana WWW i e-maila jest trwała @school @school-edit @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const hostId = s.id.toLowerCase().replaceAll("_", "-");

  const originalWebsite = `https://old-${hostId}.example.com`;

  const originalEmail = `old-${s.email}`;

  const updatedWebsite = `https://new-${hostId}.example.com/path`;

  const updatedEmail = `new-${s.email}`;

  const schoolId = await createSchoolForEdit(s, {
    www: originalWebsite,
    email: originalEmail,
  });

  // ---------------------------------------------------------------------------
  // WWW
  // ---------------------------------------------------------------------------

  const websiteDialog = await openSchoolFieldEdit(page, "WWW");

  const { currentInput: currentWebsiteInput, newInput: newWebsiteInput } =
    await schoolFieldEditInputs(websiteDialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentWebsiteInput; oczekiwane: originalWebsite", async () =>
    expect(currentWebsiteInput).toHaveValue(originalWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — newWebsiteInput; oczekiwane: ""', async () =>
    expect(newWebsiteInput).toHaveValue(""));

  await newWebsiteInput.fill(updatedWebsite);

  await test.step("Sprawdzenie: wartość pola w widoku — newWebsiteInput; oczekiwane: updatedWebsite", async () =>
    expect(newWebsiteInput).toHaveValue(updatedWebsite));

  await saveSchoolEdit(websiteDialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: updatedWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(updatedWebsite));

  // ---------------------------------------------------------------------------
  // E-MAIL
  // ---------------------------------------------------------------------------

  const emailDialog = await openSchoolFieldEdit(page, "E-Mail");

  const { currentInput: currentEmailInput, newInput: newEmailInput } =
    await schoolFieldEditInputs(emailDialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentEmailInput; oczekiwane: originalEmail", async () =>
    expect(currentEmailInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newEmailInput; oczekiwane: ""', async () =>
    expect(newEmailInput).toHaveValue(""));

  await newEmailInput.fill(updatedEmail);

  await test.step("Sprawdzenie: wartość pola w widoku — newEmailInput; oczekiwane: updatedEmail", async () =>
    expect(newEmailInput).toHaveValue(updatedEmail));

  await saveSchoolEdit(emailDialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: updatedEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(updatedEmail));

  // ---------------------------------------------------------------------------
  // TRWAŁOŚĆ
  // ---------------------------------------------------------------------------

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: updatedWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(updatedWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: updatedEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(updatedEmail));

  await s.record("updatedSchoolWebsite", updatedWebsite);

  await s.record("updatedSchoolEmail", updatedEmail);
});

test("SCH-EDIT-05: zmiana nazwy z SIO jest trwała @school @school-edit @positive @sio", async ({
  page,
  scenario: s,
}) => {
  const originalSioName = `SIO ${s.id}`;

  const updatedSioName = `${originalSioName} po edycji`;

  const schoolId = await createSchoolForEdit(s, {
    fullName: originalSioName,
  });

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, originalSioName, updatedSioName);

  await saveSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Nazwa z SIO"); oczekiwane: updatedSioName', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(updatedSioName));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Nazwa z SIO"); oczekiwane: updatedSioName', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(updatedSioName));

  await s.record("updatedSchoolSioName", updatedSioName);
});

test("SCH-EDIT-06: anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość @school @school-edit @cancel @sio", async ({
  page,
  scenario: s,
}) => {
  const originalSioName = `SIO ${s.id}`;

  const schoolId = await createSchoolForEdit(s, {
    fullName: originalSioName,
  });

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, originalSioName, `${originalSioName} anulowana zmiana`);

  await cancelSchoolEdit(form);

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Nazwa z SIO"); oczekiwane: originalSioName', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(originalSioName));
});

test("SCH-EDIT-07: pusta nazwa nie pozwala zapisać edycji @school @school-edit @validation", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);

  const form = await openSchoolEditForm(page);

  const nameInput = await schoolEditInput(form, s.schoolName);

  await nameInput.fill("");

  const save = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  if (await save.isEnabled()) {
    await save.click();
  }

  await test.step("Sprawdzenie: widoczność elementu — form", async () =>
    expect(form).toBeVisible());

  await cancelSchoolEdit(form);

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: s.schoolName', async () =>
    expect(s.app.detail("name")).toHaveValue(s.schoolName));
});

test("SCH-EDIT-08: typ i poziom szkoły są nieedytowalne w edycji danych @school @school-edit @readonly", async ({
  page,
  scenario: s,
}) => {
  await createSchoolForEdit(s);

  const form = await openSchoolEditForm(page);

  const disabledValues = await form
    .locator("input[disabled]")
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

  await test.step('Sprawdzenie: obecność oczekiwanego elementu — disabledValues; oczekiwane: "Szkoła podstawowa"', async () => {
    expect(disabledValues).toContain("Szkoła podstawowa");
  });

  await test.step('Sprawdzenie: obecność oczekiwanego elementu — disabledValues; oczekiwane: "Szkoła Podstawowa"', async () => {
    expect(disabledValues).toContain("Szkoła Podstawowa");
  });

  await cancelSchoolEdit(form);
});

// =============================================================================
// WWW
// =============================================================================

test("SCH-EDIT-09: anulowanie edycji WWW zachowuje poprzednią wartość @school @school-edit @cancel @contact", async ({
  page,
  scenario: s,
}) => {
  const originalWebsite = `https://original-${s.id.toLowerCase()}.example.com`;

  const discardedWebsite = "https://discarded.example.com";

  const schoolId = await createSchoolForEdit(s, {
    www: originalWebsite,
  });

  const dialog = await openSchoolFieldEdit(page, "WWW");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalWebsite", async () =>
    expect(currentInput).toHaveValue(originalWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  await newInput.fill(discardedWebsite);

  await test.step("Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: discardedWebsite", async () =>
    expect(newInput).toHaveValue(discardedWebsite));

  await cancelSchoolEdit(dialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: originalWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(originalWebsite));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: originalWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(originalWebsite));
});

test("SCH-EDIT-10: WWW można usunąć i pusta wartość jest trwała @school @school-edit @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const originalWebsite = `https://clear-${s.id.toLowerCase()}.example.com`;

  const schoolId = await createSchoolForEdit(s, {
    www: originalWebsite,
  });

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: originalWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(originalWebsite));

  const dialog = await openSchoolFieldEdit(page, "WWW");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalWebsite", async () =>
    expect(currentInput).toHaveValue(originalWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  const confirmation = await openSchoolFieldDeleteConfirmation(page, dialog, "WWW");

  await confirmSchoolFieldDelete(confirmation);

  await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
    expect(dialog).toHaveCount(0));

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: ""', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(""));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: ""', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(""));

  await s.record("removedSchoolWebsite", originalWebsite);
});

test("SCH-EDIT-10A: rezygnacja z usunięcia WWW zachowuje poprzedni adres @school @school-edit @cancel @contact", async ({
  page,
  scenario: s,
}) => {
  const originalWebsite = `https://keep-${s.id.toLowerCase()}.example.com`;

  const schoolId = await createSchoolForEdit(s, {
    www: originalWebsite,
  });

  const dialog = await openSchoolFieldEdit(page, "WWW");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalWebsite", async () =>
    expect(currentInput).toHaveValue(originalWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  const confirmation = await openSchoolFieldDeleteConfirmation(page, dialog, "WWW");

  await cancelSchoolFieldDelete(confirmation);

  // Po wybraniu "Nie" wracamy
  // do dialogu edycji WWW.
  await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
    expect(dialog).toBeVisible());

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalWebsite", async () =>
    expect(currentInput).toHaveValue(originalWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  await cancelSchoolEdit(dialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: originalWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(originalWebsite));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: originalWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(originalWebsite));
});

// =============================================================================
// E-MAIL
// =============================================================================

test("SCH-EDIT-11: e-mail można usunąć i pusta wartość jest trwała @school @school-edit @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const originalEmail = `school_${Date.now()}@example.com`;

  const schoolId = await createSchoolForEdit(s, {
    email: originalEmail,
  });

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: originalEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(originalEmail));

  const dialog = await openSchoolFieldEdit(page, "E-Mail");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalEmail", async () =>
    expect(currentInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  const confirmation = await openSchoolFieldDeleteConfirmation(page, dialog, "E-Mail");

  await confirmSchoolFieldDelete(confirmation);

  await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
    expect(dialog).toHaveCount(0));

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: ""', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(""));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: ""', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(""));

  await s.record("removedSchoolEmail", originalEmail);
});

test("SCH-EDIT-11A: anulowanie edycji e-maila zachowuje poprzedni adres @school @school-edit @cancel @contact", async ({
  page,
  scenario: s,
}) => {
  const originalEmail = `original_${Date.now()}@example.com`;

  const discardedEmail = `discarded_${Date.now()}@example.com`;

  const schoolId = await createSchoolForEdit(s, {
    email: originalEmail,
  });

  const dialog = await openSchoolFieldEdit(page, "E-Mail");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalEmail", async () =>
    expect(currentInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  await newInput.fill(discardedEmail);

  await test.step("Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: discardedEmail", async () =>
    expect(newInput).toHaveValue(discardedEmail));

  await cancelSchoolEdit(dialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: originalEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(originalEmail));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: originalEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(originalEmail));
});

test("SCH-EDIT-11B: rezygnacja z usunięcia e-maila zachowuje poprzedni adres @school @school-edit @cancel @contact", async ({
  page,
  scenario: s,
}) => {
  const originalEmail = `keep_${Date.now()}@example.com`;

  const schoolId = await createSchoolForEdit(s, {
    email: originalEmail,
  });

  const dialog = await openSchoolFieldEdit(page, "E-Mail");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalEmail", async () =>
    expect(currentInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  const confirmation = await openSchoolFieldDeleteConfirmation(page, dialog, "E-Mail");

  await cancelSchoolFieldDelete(confirmation);

  // Po wybraniu "Nie" wracamy
  // do dialogu edycji e-maila.
  await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
    expect(dialog).toBeVisible());

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalEmail", async () =>
    expect(currentInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  await cancelSchoolEdit(dialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: originalEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(originalEmail));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: originalEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(originalEmail));
});

test("SCH-EDIT-12: e-mail z wielkimi literami jest normalizowany po edycji @school @school-edit @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const originalEmail = `before_${Date.now()}@example.com`;

  const submittedEmail = `Edited.${Date.now()}@QA.Example.COM`;

  const normalizedEmail = submittedEmail.toLowerCase();

  const schoolId = await createSchoolForEdit(s, {
    email: originalEmail,
  });

  const dialog = await openSchoolFieldEdit(page, "E-Mail");

  const { currentInput, newInput } = await schoolFieldEditInputs(dialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentInput; oczekiwane: originalEmail", async () =>
    expect(currentInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: ""', async () =>
    expect(newInput).toHaveValue(""));

  await newInput.fill(submittedEmail);

  await test.step("Sprawdzenie: wartość pola w widoku — newInput; oczekiwane: submittedEmail", async () =>
    expect(newInput).toHaveValue(submittedEmail));

  await saveSchoolEdit(dialog);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: normalizedEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(normalizedEmail));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: normalizedEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(normalizedEmail));

  await s.record("submittedSchoolEmail", submittedEmail);

  await s.record("updatedSchoolEmail", normalizedEmail);
});

// =============================================================================
// POZOSTAŁE POLA
// =============================================================================

test("SCH-EDIT-13: nazwa z polskimi znakami i interpunkcją jest trwała po edycji @school @school-edit @positive @name", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);

  const updatedName = `${s.id} Szkoła Łódź – filia nr 2`;

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, s.schoolName, updatedName);

  await saveSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: updatedName', async () =>
    expect(s.app.detail("name")).toHaveValue(updatedName));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: updatedName', async () =>
    expect(s.app.detail("name")).toHaveValue(updatedName));
});

test("SCH-EDIT-14: spacje na brzegach nazwy są usuwane po edycji @school @school-edit @positive @name", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);

  const submittedName = `  ${s.schoolName} po edycji  `;

  const expectedName = `${s.schoolName} po edycji`;

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, s.schoolName, submittedName);

  await saveSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: expectedName', async () =>
    expect(s.app.detail("name")).toHaveValue(expectedName));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: expectedName', async () =>
    expect(s.app.detail("name")).toHaveValue(expectedName));
});

test("SCH-EDIT-15: nazwę z SIO można wyczyścić @school @school-edit @positive @sio", async ({
  page,
  scenario: s,
}) => {
  const originalSioName = `SIO ${s.id}`;

  const schoolId = await createSchoolForEdit(s, {
    fullName: originalSioName,
  });

  const form = await openSchoolEditForm(page);

  await replaceSchoolEditValue(form, originalSioName, "");

  await saveSchoolEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Nazwa z SIO"); oczekiwane: ""', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(""));

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Nazwa z SIO"); oczekiwane: ""', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(""));
});

const readonlySchoolTypeCases = [
  {
    type: "Szkoła podstawowa",
    level: "Szkoła Podstawowa",
  },
  {
    type: "Liceum",
    level: "Szkoła Średnia",
  },
  {
    type: "Technikum",
    level: "Szkoła Średnia",
  },
  {
    type: "Placówka doskonalenia nauczycieli",
    level: "Inny",
  },
  {
    type: "Zespół szkół",
    level: "Zespół Szkół",
  },
  {
    type: "Szkoła NPC",
    level: "Szkoła Podstawowa",
  },
  {
    type: "Przedszkole",
    level: "Przedszkole",
  },
] as const;

for (const { type, level } of readonlySchoolTypeCases) {
  test(`SCH-EDIT-16: typ ${type} i poziom ${level} są tylko do odczytu @school @school-edit @readonly @school-type`, async ({
    page,
    scenario: s,
  }) => {
    await createSchoolForEdit(s, {}, type);

    const form = await openSchoolEditForm(page);

    const disabledValues = await form
      .locator("input[disabled]")
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

    await test.step("Sprawdzenie: obecność oczekiwanego elementu — disabledValues; oczekiwane: type", async () => {
      expect(disabledValues).toContain(type);
    });

    await test.step("Sprawdzenie: obecność oczekiwanego elementu — disabledValues; oczekiwane: level", async () => {
      expect(disabledValues).toContain(level);
    });

    await cancelSchoolEdit(form);
  });
}

test("SCH-EDIT-17: kolejne edycje różnych pól nie nadpisują wcześniejszych zmian @school @school-edit @positive @regression", async ({
  page,
  scenario: s,
}) => {
  const originalWebsite = `https://before-${s.id.toLowerCase()}.example.com`;

  const originalEmail = `before-${s.email}`;

  const originalSioName = `SIO ${s.id}`;

  const schoolId = await createSchoolForEdit(s, {
    www: originalWebsite,
    email: originalEmail,
    fullName: originalSioName,
  });

  const updatedName = `${s.schoolName} wielokrotna edycja`;

  const updatedWebsite = `https://after-${s.id.toLowerCase()}.example.com/path`;

  const updatedEmail = `after-${s.email}`;

  const updatedSioName = `${originalSioName} po zmianie`;

  // ---------------------------------------------------------------------------
  // DANE PODSTAWOWE
  // ---------------------------------------------------------------------------

  const basic = await openSchoolEditForm(page);

  await replaceSchoolEditValue(basic, s.schoolName, updatedName);

  await replaceSchoolEditValue(basic, originalSioName, updatedSioName);

  await saveSchoolEdit(basic);

  // ---------------------------------------------------------------------------
  // WWW
  // ---------------------------------------------------------------------------

  const websiteDialog = await openSchoolFieldEdit(page, "WWW");

  const { currentInput: currentWebsiteInput, newInput: newWebsiteInput } =
    await schoolFieldEditInputs(websiteDialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentWebsiteInput; oczekiwane: originalWebsite", async () =>
    expect(currentWebsiteInput).toHaveValue(originalWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — newWebsiteInput; oczekiwane: ""', async () =>
    expect(newWebsiteInput).toHaveValue(""));

  await newWebsiteInput.fill(updatedWebsite);

  await saveSchoolEdit(websiteDialog);

  // ---------------------------------------------------------------------------
  // E-MAIL
  // ---------------------------------------------------------------------------

  const emailDialog = await openSchoolFieldEdit(page, "E-Mail");

  const { currentInput: currentEmailInput, newInput: newEmailInput } =
    await schoolFieldEditInputs(emailDialog);

  await test.step("Sprawdzenie: wartość pola w widoku — currentEmailInput; oczekiwane: originalEmail", async () =>
    expect(currentEmailInput).toHaveValue(originalEmail));

  await test.step('Sprawdzenie: wartość pola w widoku — newEmailInput; oczekiwane: ""', async () =>
    expect(newEmailInput).toHaveValue(""));

  await newEmailInput.fill(updatedEmail);

  await saveSchoolEdit(emailDialog);

  // ---------------------------------------------------------------------------
  // WERYFIKACJA WSZYSTKICH ZMIAN
  // ---------------------------------------------------------------------------

  await s.app.openPanel("school", schoolId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: updatedName', async () =>
    expect(s.app.detail("name")).toHaveValue(updatedName));

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Nazwa z SIO"); oczekiwane: updatedSioName', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(updatedSioName));

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "WWW"); oczekiwane: updatedWebsite', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(updatedWebsite));

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "E-Mail"); oczekiwane: updatedEmail', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(updatedEmail));
});

// =============================================================================
// ADRES, TELEFON, DANE SIO I HISTORIA
// =============================================================================

test("SCH-EDIT-18: zmiana adresu szkoły jest trwała @school @school-edit @positive @address", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);
  const updatedNumber = `E${Date.now()}`;

  const address = await openSchoolAddressEdit(page);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, updatedNumber);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("address"); oczekiwane: new RegExp(updatedNumber)', async () =>
    expect(s.app.detail("address")).toHaveValue(new RegExp(updatedNumber)));
  await s.app.openPanel("school", schoolId);
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("address"); oczekiwane: new RegExp(updatedNumber)', async () =>
    expect(s.app.detail("address")).toHaveValue(new RegExp(updatedNumber)));
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("address"); oczekiwane: new RegExp(DEFAULT_CITY, "i")', async () =>
    expect(s.app.detail("address")).toHaveValue(new RegExp(DEFAULT_CITY, "i")));
  await s.record("updatedSchoolAddress", await s.app.detail("address").inputValue());
});

test("SCH-EDIT-19: dane SIO i liczba uczniów można zmienić i ponownie odczytać @school @school-edit @positive @sio @identifier", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s, {
    quantityOfStudents: 123,
    rspo: "123456",
    regon: "123456785",
    nip: "1234563218",
  });
  const updated = {
    quantityOfStudents: "456",
    rspo: "654321",
    regon: "590096454",
    nip: "5260250995",
  };

  const form = await openSchoolSioForm(page);
  await schoolSioInput(form, "quantityOfStudents").fill(updated.quantityOfStudents);
  await schoolSioInput(form, "rspoNumber").fill(updated.rspo);
  await schoolSioInput(form, "regon").fill(updated.regon);
  await schoolSioInput(form, "nip").fill(updated.nip);
  await saveSchoolSioEdit(form);

  await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(schoolDetails(page), "Liczba uczniów"); oczekiwane: updated.quantityOfStudents', async () =>
    expect(schoolPanelTextField(schoolDetails(page), "Liczba uczniów")).toHaveValue(
      updated.quantityOfStudents,
    ));
  await s.app.openPanel("school", schoolId);
  const persisted = await openSchoolSioForm(page);
  await test.step('Sprawdzenie: wartość pola w widoku — schoolSioInput(persisted, "quantityOfStudents"); oczekiwane: updated.quantityOfStudents', async () =>
    expect(schoolSioInput(persisted, "quantityOfStudents")).toHaveValue(
      updated.quantityOfStudents,
    ));
  await test.step('Sprawdzenie: wartość pola w widoku — schoolSioInput(persisted, "rspoNumber"); oczekiwane: updated.rspo', async () =>
    expect(schoolSioInput(persisted, "rspoNumber")).toHaveValue(updated.rspo));
  await test.step('Sprawdzenie: wartość pola w widoku — schoolSioInput(persisted, "regon"); oczekiwane: updated.regon', async () =>
    expect(schoolSioInput(persisted, "regon")).toHaveValue(updated.regon));
  await test.step('Sprawdzenie: wartość pola w widoku — schoolSioInput(persisted, "nip"); oczekiwane: updated.nip', async () =>
    expect(schoolSioInput(persisted, "nip")).toHaveValue(updated.nip));
  await cancelSchoolEdit(persisted);
  await s.record("updatedSchoolSioData", JSON.stringify(updated));
});

test("SCH-EDIT-20: drugi telefon stacjonarny można dodać po przełączeniu typu @school @school-edit @positive @contact", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s, {
    phoneNumber: "501234567",
    phoneIsMobile: true,
  });
  const landline = "312321412";

  const details = schoolDetails(page);
  const mobile = schoolPhoneMobileCheckbox(details);
  await mobile.check();
  await mobile.uncheck();
  await addSchoolPhone(details, landline, false);

  await s.app.openPanel("school", schoolId);
  const storedPhones = await schoolDetails(page)
    .locator('input[disabled][type="text"]')
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
  await test.step('Sprawdzenie: spełnienie warunku — storedPhones.some((value) => value.replace(/\\D/g, "") === "501234567")', async () => {
    expect(storedPhones.some((value) => value.replace(/\D/g, "") === "501234567")).toBeTruthy();
  });
  await test.step('Sprawdzenie: spełnienie warunku — storedPhones.some((value) => value.replace(/\\D/g, "") === landline)', async () => {
    expect(storedPhones.some((value) => value.replace(/\D/g, "") === landline)).toBeTruthy();
  });
  await s.record("addedSchoolPhone", landline);
});

test("SCH-EDIT-21: zmiana nazwy tworzy kompletny wpis historii szkoły @school @school-edit @history", async ({
  page,
  scenario: s,
}) => {
  await createSchoolForEdit(s);
  const updatedName = `${s.schoolName} historia`;
  const form = await openSchoolEditForm(page);
  await replaceSchoolEditValue(form, s.schoolName, updatedName);
  await saveSchoolEdit(form);

  const history = await openSchoolHistory(page);
  const valueCell = history.getByRole("gridcell", { name: updatedName, exact: true });
  await test.step("Sprawdzenie: widoczność elementu — valueCell", async () =>
    expect(valueCell).toBeVisible());
  const row = valueCell.locator('xpath=ancestor::*[@role="row"][1]');
  const cells = row.getByRole("gridcell");
  await test.step("Sprawdzenie: liczba elementów w widoku — cells; oczekiwane: 5", async () =>
    expect(cells).toHaveCount(5));
  await test.step("Sprawdzenie: obecność tekstu w widoku — cells.nth(0); oczekiwane: /Nazwa/i", async () =>
    expect(cells.nth(0)).toContainText(/Nazwa/i));
  await test.step("Sprawdzenie: tekst w widoku — cells.nth(1); oczekiwane: updatedName", async () =>
    expect(cells.nth(1)).toHaveText(updatedName));
  await test.step('Sprawdzenie: negacja — tekst w widoku — cells.nth(2); oczekiwane: ""', async () =>
    expect(cells.nth(2)).not.toHaveText(""));
  await test.step('Sprawdzenie: negacja — tekst w widoku — cells.nth(3); oczekiwane: ""', async () =>
    expect(cells.nth(3)).not.toHaveText(""));
  await test.step('Sprawdzenie: negacja — tekst w widoku — cells.nth(4); oczekiwane: ""', async () =>
    expect(cells.nth(4)).not.toHaveText(""));
});

// =============================================================================
// ODPORNOŚĆ TECHNICZNA ZAPISU
// =============================================================================

const schoolEditFailureCases = [
  { id: "SCH-EDIT-22", label: "HTTP 422", status: 422 },
  { id: "SCH-EDIT-23", label: "HTTP 500", status: 500 },
  { id: "SCH-EDIT-24", label: "timeout sieci", abort: "timedout" as const },
] as const;

for (const failure of schoolEditFailureCases) {
  test(`${failure.id}: ${failure.label} nie utrwala zmiany nazwy @school @school-edit @error-handling`, async ({
    page,
    scenario: s,
  }) => {
    const schoolId = await createSchoolForEdit(s);
    const rejectedName = `${s.schoolName} odrzucona`;
    let saveAttempts = 0;

    await page.route(SCHOOL_SIMPLE_UPDATE_ENDPOINT, async (route) => {
      saveAttempts += 1;
      if ("abort" in failure) {
        await route.abort(failure.abort);
        return;
      }
      await route.fulfill({
        status: failure.status,
        contentType: "application/json",
        body: JSON.stringify({ message: `Kontrolowany ${failure.label}` }),
      });
    });

    const form = await openSchoolEditForm(page);
    await replaceSchoolEditValue(form, s.schoolName, rejectedName);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await test.step("Sprawdzenie: zgodność wartości — () => saveAttempts; oczekiwane: 1", async () =>
      expect.poll(() => saveAttempts).toBe(1));

    await s.app.openPanel("school", schoolId);
    await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: s.schoolName', async () =>
      expect(s.app.detail("name")).toHaveValue(s.schoolName));
    await test.step('Sprawdzenie: negacja — wartość pola w widoku — s.app.detail("name"); oczekiwane: rejectedName', async () =>
      expect(s.app.detail("name")).not.toHaveValue(rejectedName));
    await s.record("rejectedSchoolEdit", failure.label);
  });
}
