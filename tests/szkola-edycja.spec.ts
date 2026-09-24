import type { Page } from "@playwright/test";

import { test, expect, type Scenario } from "./support/scenario";
import type { CreateSchoolOptions } from "./support/api-factory";
import {
  DEFAULT_CITY,
  DEFAULT_POSTAL_CODE,
  fillSchoolAddTextField,
  prepareCompleteSchoolAdd,
  saveSchoolAdd,
  schoolPanelTextField,
} from "./support/school-add";
import {
  cancelSchoolEdit,
  openSchoolEditForm,
  openSchoolFieldEdit,
  replaceSchoolEditValue,
  saveSchoolEdit,
  schoolEditInput,
  schoolFieldEditInput,
} from "./support/school-edit";

test.describe.configure({ mode: "parallel" });

function schoolDetails(page: Page) {
  return page
    .getByRole("heading", { name: "Dane podstawowe szkoły", exact: true })
    .locator("xpath=ancestor::*[.//input][1]");
}

/*
 * Te testy weryfikują EDYCJĘ danych szkoły, nie sam formularz
 * dodawania (ten zostaje przy UI w szkola-dodawanie.spec.ts) - istnienie
 * szkoły jest tu tylko warunkiem wstępnym, więc tworzymy ją przez
 * scenario.createSchoolViaApi() (jedno żądanie POST zamiast pełnego
 * formularza UI). "WWW"/"E-mail" to dosłowne nazwy pól z tego samego,
 * już potwierdzonego z Network payloadu AddNewInstitution
 * (patrz OctopusApiFactory.createSchool) - bezpieczne do podstawienia.
 */
async function createSchoolForEdit(scenario: Scenario, options: CreateSchoolOptions = {}) {
  const number = String(Date.now());
  const schoolId = await scenario.createSchoolViaApi({ number, ...options });
  await scenario.record("schoolAddress", `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`);
  await scenario.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
  return schoolId;
}

/*
 * SCH-EDIT-05/06 testują konkretnie pole "Nazwa z SIO" - w odróżnieniu
 * od WWW/E-mail, jego mapowanie na pole `fullName` z API AddNewInstitution
 * NIE zostało potwierdzone realnym żądaniem z Network (tylko domysł po
 * nazwie), więc te dwa testy celowo zostają przy tworzeniu przez pełny
 * formularz UI, żeby nie ryzykować cichego fałszywego PASS-a na
 * niesprawdzonym mapowaniu pola.
 */
async function createSchoolForEditWithSioName(page: Page, scenario: Scenario, sioName: string) {
  const number = String(Date.now());
  const form = await prepareCompleteSchoolAdd(page, scenario.app, scenario.schoolName, number);
  await fillSchoolAddTextField(form, "Nazwa z SIO", sioName);
  const { schoolId } = await saveSchoolAdd(page, form);
  await scenario.app.markTestRecord();
  await scenario.record("schoolId", schoolId);
  await scenario.record("schoolAddress", `${DEFAULT_POSTAL_CODE} ${DEFAULT_CITY} ${number}`);
  await scenario.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
  return schoolId;
}

test("SCH-EDIT-01: formularz edycji wczytuje nazwę szkoły @school @school-edit @smoke", async ({
  page,
  scenario: s,
}) => {
  await createSchoolForEdit(s);

  const form = await openSchoolEditForm(page);
  await schoolEditInput(form, s.schoolName);
  await cancelSchoolEdit(form);

  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
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

  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
  await s.app.openPanel("school", schoolId);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
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

  await expect(s.app.detail("name")).toHaveValue(updatedName);
  await s.app.openPanel("school", schoolId);
  await expect(s.app.detail("name")).toHaveValue(updatedName);
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
  const schoolId = await createSchoolForEdit(s, { www: originalWebsite, email: originalEmail });

  const websiteDialog = await openSchoolFieldEdit(page, "WWW");
  const websiteInput = await schoolFieldEditInput(websiteDialog);
  await expect(websiteDialog.locator("input[readonly], input[disabled]").first()).toHaveValue(
    originalWebsite,
  );
  await websiteInput.fill(updatedWebsite);
  await saveSchoolEdit(websiteDialog);

  const emailDialog = await openSchoolFieldEdit(page, "E-Mail");
  const emailInput = await schoolFieldEditInput(emailDialog);
  await expect(emailDialog.locator("input[readonly], input[disabled]").first()).toHaveValue(
    originalEmail,
  );
  await emailInput.fill(updatedEmail);
  await saveSchoolEdit(emailDialog);

  await expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(updatedWebsite);
  await expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(updatedEmail);
  await s.app.openPanel("school", schoolId);
  await expect(schoolPanelTextField(schoolDetails(page), "WWW")).toHaveValue(updatedWebsite);
  await expect(schoolPanelTextField(schoolDetails(page), "E-Mail")).toHaveValue(updatedEmail);
  await s.record("updatedSchoolWebsite", updatedWebsite);
  await s.record("updatedSchoolEmail", updatedEmail);
});

test("SCH-EDIT-05: zmiana nazwy z SIO jest trwała @school @school-edit @positive @sio", async ({
  page,
  scenario: s,
}) => {
  const originalSioName = `SIO ${s.id}`;
  const updatedSioName = `${originalSioName} po edycji`;
  const schoolId = await createSchoolForEditWithSioName(page, s, originalSioName);

  const form = await openSchoolEditForm(page);
  await replaceSchoolEditValue(form, originalSioName, updatedSioName);
  await saveSchoolEdit(form);

  await expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(
    updatedSioName,
  );
  await s.app.openPanel("school", schoolId);
  await expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(
    updatedSioName,
  );
  await s.record("updatedSchoolSioName", updatedSioName);
});

test("SCH-EDIT-06: anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość @school @school-edit @cancel @sio", async ({
  page,
  scenario: s,
}) => {
  const originalSioName = `SIO ${s.id}`;
  const schoolId = await createSchoolForEditWithSioName(page, s, originalSioName);

  const form = await openSchoolEditForm(page);
  await replaceSchoolEditValue(form, originalSioName, `${originalSioName} anulowana zmiana`);
  await cancelSchoolEdit(form);

  await s.app.openPanel("school", schoolId);
  await expect(schoolPanelTextField(schoolDetails(page), "Nazwa z SIO")).toHaveValue(
    originalSioName,
  );
});

test("SCH-EDIT-07: pusta nazwa nie pozwala zapisać edycji @school @school-edit @validation", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await createSchoolForEdit(s);
  const form = await openSchoolEditForm(page);
  const nameInput = await schoolEditInput(form, s.schoolName);
  await nameInput.fill("");

  const save = form.getByRole("button", { name: "Zapisz", exact: true });
  if (await save.isEnabled()) await save.click();
  await expect(form).toBeVisible();
  await cancelSchoolEdit(form);

  await s.app.openPanel("school", schoolId);
  await expect(s.app.detail("name")).toHaveValue(s.schoolName);
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
  expect(disabledValues).toContain("Szkoła podstawowa");
  expect(disabledValues).toContain("Szkoła Podstawowa");
  await cancelSchoolEdit(form);
});
