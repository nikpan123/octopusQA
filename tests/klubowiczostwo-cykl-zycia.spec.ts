import { test, expect } from "./support/club-fixtures";

import {
  MATH_SP_CLASSES,
  PHYSICS_SP_OWN_CLASSES,
  cancelClubForm,
  clubHistoryEntry,
  confirmDeleteIfShown,
  confirmationRow,
  confirmations,
  deleteClubConfirmation,
  deletedConfirmationIcon,
  disableTeacherEmail,
  foreignClass,
  foreignClasses,
  foreignSelectAll,
  negativelyVerifyClubConfirmation,
  openClubEdit,
  openClubHistory,
  openNewClubForm,
  ownClass,
  ownSelectAll,
  saveClubEdit,
  saveClubForm,
  selectClubSubject,
  selectDifferentForeignPublisher,
  selectForeignPublisher,
  selectSchool,
  selectSchoolYear,
  subjectLevelRow,
  requestClubRestore,
  restoreClubConfirmation,
} from "./support/club";

import { prepareClubTeacher } from "./support/club-scenario";

// Każdy scenariusz tworzy własnego nauczyciela i własne potwierdzenia.
// Współdzielone szkoły są tylko odczytywane, więc testy CLUB mogą bezpiecznie
// wykorzystywać wszystkie workery mimo globalnego fullyParallel: false.
test.describe.configure({ mode: "parallel" });

test("CLUB-30: odznaczenie opcji wszystkich klas NASZYCH czyści cały wybór @teacher @club @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownSelectAll(form).check();
  for (const className of MATH_SP_CLASSES) await expect(ownClass(form, className)).toBeChecked();

  await ownSelectAll(form).uncheck();
  for (const className of MATH_SP_CLASSES) {
    await expect(ownClass(form, className)).not.toBeChecked();
    await expect(foreignClass(form, className)).toBeEnabled();
  }

  await cancelClubForm(form);
});

test("CLUB-31: odznaczenie opcji wszystkich klas OBCYCH czyści cały wybór @teacher @club @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await foreignSelectAll(form).check();
  for (const className of MATH_SP_CLASSES) {
    await expect(foreignClass(form, className)).toBeChecked();
  }

  await foreignSelectAll(form).uncheck();
  for (const className of MATH_SP_CLASSES) {
    await expect(foreignClass(form, className)).not.toBeChecked();
    await expect(ownClass(form, className)).toBeEnabled();
  }

  await cancelClubForm(form);
});

test("CLUB-32: edycja zmienia klasę NASZĄ na OBCĄ i zachowuje wydawnictwo @teacher @club @edit", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  const editForm = await openClubEdit(page, confirmationId);
  await ownClass(editForm, "4").uncheck();
  await foreignClass(editForm, "4").check();
  const publisher = await selectForeignPublisher(page, editForm);
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4")).not.toBeChecked();
  await expect(foreignClass(verifyForm, "4")).toBeChecked();
  await expect(foreignClasses(verifyForm).getByRole("combobox")).toContainText(publisher);
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
  await s.record("foreignPublisher", publisher);
});

test("CLUB-33: klasa OBCA bez wydawnictwa blokuje utworzenie formularza @teacher @club @publisher @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await foreignClass(form, "4").check();
  await disableTeacherEmail(form);

  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toBeVisible();

  await s.app.openPanel("teacher", teacherId);
  await expect(
    confirmations(page)
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: "Matematyka", exact: true }) }),
  ).toHaveCount(0);

  await s.record("validationCase", "foreign-class-without-publisher");
  await s.record("clubCreated", "false");
});

test("CLUB-34: zmianę wydawnictwa klasy OBCEJ można zapisać podczas edycji @teacher @club @publisher @edit", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await foreignClass(form, "4").check();
  const firstPublisher = await selectForeignPublisher(page, form);
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  const editForm = await openClubEdit(page, confirmationId);
  const secondPublisher = await selectDifferentForeignPublisher(page, editForm, firstPublisher);
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(foreignClass(verifyForm, "4")).toBeChecked();
  await expect(foreignClasses(verifyForm).getByRole("combobox")).toContainText(secondPublisher);
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
  await s.record("firstForeignPublisher", firstPublisher);
  await s.record("secondForeignPublisher", secondPublisher);
});

test("CLUB-35: usunięcie ostatniej klasy OBCEJ zachowuje klasę NASZĄ @teacher @club @publisher @edit", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await foreignClass(form, "5").check();
  await selectForeignPublisher(page, form);
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  const editForm = await openClubEdit(page, confirmationId);
  await foreignClass(editForm, "5").uncheck();
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(foreignClass(verifyForm, "5")).not.toBeChecked();
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
});

test("CLUB-36: edycja może dodać kolejną klasę NASZĄ bez utraty poprzedniej @teacher @club @classes @edit", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  const editForm = await openClubEdit(page, confirmationId);
  await ownClass(editForm, "5").check();
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(ownClass(verifyForm, "5")).toBeChecked();
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
});

test("CLUB-37: zmiana przedmiotu nie przenosi klas wybranych dla Matematyki do Fizyki @teacher @club @subject @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s, {
    additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
  });

  const { form } = await openNewClubForm(page, null);
  await selectClubSubject(page, form, "Matematyka");
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await selectClubSubject(page, form, "Fizyka");
  // Zmiana przedmiotu może przebudować również wybór szkoły. Ponowne
  // wskazanie tej samej szkoły pozwala sprawdzić wyłącznie stan klas Fizyki.
  await selectSchool(form, s.schoolName);

  await expect(ownClass(form, "4")).toHaveCount(0);
  for (const className of PHYSICS_SP_OWN_CLASSES) {
    await expect(ownClass(form, className)).not.toBeChecked();
  }

  await cancelClubForm(form);
});

test("CLUB-38: ta sama szkoła i rok mogą mieć osobne potwierdzenia Matematyki i Fizyki @teacher @club @subject", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, {
    additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
  });

  const { form: mathForm, schoolYear } = await openNewClubForm(page, null);
  await selectClubSubject(page, mathForm, "Matematyka");
  await selectSchool(mathForm, s.schoolName);
  await ownClass(mathForm, "4").check();
  await disableTeacherEmail(mathForm);
  const mathConfirmationId = await saveClubForm(page, mathForm);

  const { form: physicsForm } = await openNewClubForm(page, null);
  await selectClubSubject(page, physicsForm, "Fizyka");
  await selectSchool(physicsForm, s.schoolName);
  await ownClass(physicsForm, "7").check();
  await disableTeacherEmail(physicsForm);
  const physicsConfirmationId = await saveClubForm(page, physicsForm, "Fizyka");

  await s.app.openPanel("teacher", teacherId);
  await expect(confirmationRow(page, mathConfirmationId)).toContainText("Matematyka");
  await expect(confirmationRow(page, mathConfirmationId)).toContainText(schoolYear);
  await expect(confirmationRow(page, physicsConfirmationId)).toContainText("Fizyka");
  await expect(confirmationRow(page, physicsConfirmationId)).toContainText(schoolYear);
  expect(mathConfirmationId).not.toBe(physicsConfirmationId);

  await s.record("schoolYear", schoolYear);
  await s.record("mathConfirmationId", mathConfirmationId);
  await s.record("physicsConfirmationId", physicsConfirmationId);
});

// Usuwanie oraz przywracanie potwierdzeń.
test("CLUB-39: usuniętego formularza klubowego nie można edytować @teacher @club @delete @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  const row = confirmationRow(page, confirmationId);
  await row.click();
  await confirmations(page).getByRole("button", { name: "Usuń", exact: true }).click();
  await confirmDeleteIfShown(page);

  await s.app.openPanel("teacher", teacherId);
  const deletedRow = confirmationRow(page, confirmationId);
  await expect(deletedRow.getByRole("cell").nth(2).locator("mat-icon")).toHaveText("backspace");
  await deletedRow.click();
  await expect(
    confirmations(page).getByRole("button", { name: "Edytuj", exact: true }),
  ).toBeDisabled();

  await s.record("confirmationId", confirmationId);
  await s.record("clubDeleted", "true");
});

test("CLUB-40: po usunięciu można utworzyć nowe potwierdzenie dla tej samej szkoły, roku i przedmiotu @teacher @club @delete", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form: firstForm, schoolYear } = await openNewClubForm(page);
  await selectSchool(firstForm, s.schoolName);
  await ownClass(firstForm, "4").check();
  await disableTeacherEmail(firstForm);
  const deletedConfirmationId = await saveClubForm(page, firstForm);

  const firstRow = confirmationRow(page, deletedConfirmationId);
  await firstRow.click();
  await confirmations(page).getByRole("button", { name: "Usuń", exact: true }).click();
  await confirmDeleteIfShown(page);

  await s.app.openPanel("teacher", teacherId);
  await expect(
    confirmationRow(page, deletedConfirmationId).getByRole("cell").nth(2).locator("mat-icon"),
  ).toHaveText("backspace");

  const { form: replacementForm, schoolYear: replacementSchoolYear } = await openNewClubForm(page);
  expect(replacementSchoolYear).toBe(schoolYear);
  await selectSchool(replacementForm, s.schoolName);
  const replacementClass = "5";
  await ownClass(replacementForm, replacementClass).check();
  await disableTeacherEmail(replacementForm);
  const replacementConfirmationId = await saveClubForm(page, replacementForm);

  expect(replacementConfirmationId).not.toBe(deletedConfirmationId);
  await expect(deletedConfirmationIcon(page, deletedConfirmationId)).toHaveText("backspace");
  await expect(confirmationRow(page, replacementConfirmationId)).toHaveCount(1);
  await expect(
    confirmationRow(page, replacementConfirmationId).getByRole("cell").nth(2).locator("mat-icon"),
  ).toHaveCount(0);

  const verifyForm = await openClubEdit(page, replacementConfirmationId);
  await expect(ownClass(verifyForm, replacementClass)).toBeChecked();
  await cancelClubForm(verifyForm);

  await s.record("deletedConfirmationId", deletedConfirmationId);
  await s.record("replacementConfirmationId", replacementConfirmationId);
  await s.record("replacementClass", replacementClass);
});

test("CLUB-41: usunięte potwierdzenie można przywrócić, gdy nie istnieje inne aktywne potwierdzenie @teacher @club @restore @history", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await deleteClubConfirmation(page, confirmationId);

  await restoreClubConfirmation(page, confirmationId);

  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveCount(0);

  const editForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(editForm, "4")).toBeChecked();
  await cancelClubForm(editForm);

  const history = await openClubHistory(page, confirmationId);
  await expect(clubHistoryEntry(page, history, { modification: /^Przywrócono po/i })).toHaveCount(
    1,
  );

  await s.record("confirmationId", confirmationId);
  await s.record("restoredClass", "4");
});

test("CLUB-42: aktywne potwierdzenie dla tego samego roku, przedmiotu i szkoły blokuje przywrócenie @teacher @club @restore @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form: deletedForm } = await openNewClubForm(page);
  await selectSchool(deletedForm, s.schoolName);
  await ownClass(deletedForm, "4").check();
  await disableTeacherEmail(deletedForm);
  const deletedConfirmationId = await saveClubForm(page, deletedForm);
  await deleteClubConfirmation(page, deletedConfirmationId);

  const { form: activeForm } = await openNewClubForm(page);
  await selectSchool(activeForm, s.schoolName);
  await ownClass(activeForm, "5").check();
  await disableTeacherEmail(activeForm);
  const activeConfirmationId = await saveClubForm(page, activeForm);

  await requestClubRestore(page, deletedConfirmationId);

  const warning = page.locator("mat-dialog-container").filter({
    hasText:
      "Nie można przywrócić formularza, ponieważ na ten rok/przedmiot/szkołę istnieje już potwierdzenie.",
  });

  await expect(warning).toBeVisible();
  await expect(warning).toContainText(`ID potwierdzenia: ${activeConfirmationId}`);
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);

  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, deletedConfirmationId)).toHaveText("backspace");
  await expect(deletedConfirmationIcon(page, activeConfirmationId)).toHaveCount(0);

  const activeEditForm = await openClubEdit(page, activeConfirmationId);
  await expect(ownClass(activeEditForm, "5")).toBeChecked();
  await cancelClubForm(activeEditForm);

  await s.record("deletedConfirmationId", deletedConfirmationId);
  await s.record("blockingConfirmationId", activeConfirmationId);
});

test("CLUB-43: przywrócenie zachowuje wszystkie wcześniej wybrane klasy NASZE @teacher @club @restore @classes", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  for (const className of ["4", "6", "8"]) await ownClass(form, className).check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await deleteClubConfirmation(page, confirmationId);
  await restoreClubConfirmation(page, confirmationId);

  const restoreEditForm = await openClubEdit(page, confirmationId);

  for (const className of MATH_SP_CLASSES) {
    if (["4", "6", "8"].includes(className)) {
      await expect(ownClass(restoreEditForm, className)).toBeChecked();
    } else {
      await expect(ownClass(restoreEditForm, className)).not.toBeChecked();
    }
  }

  await cancelClubForm(restoreEditForm);
  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveCount(0);

  await s.record("confirmationId", confirmationId);
  await s.record("restoredClasses", "4,6,8");
});

test("CLUB-44: przywrócenie zachowuje klasę OBCĄ i wydawnictwo @teacher @club @restore @publisher", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await foreignClass(form, "4").check();
  const publisher = await selectForeignPublisher(page, form);
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await deleteClubConfirmation(page, confirmationId);
  await restoreClubConfirmation(page, confirmationId);

  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveCount(0);

  const editForm = await openClubEdit(page, confirmationId);
  await expect(foreignClass(editForm, "4")).toBeChecked();
  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText(publisher);
  await cancelClubForm(editForm);

  await s.record("confirmationId", confirmationId);
  await s.record("foreignPublisher", publisher);
});

test("CLUB-45: aktywne potwierdzenie innego przedmiotu nie blokuje przywrócenia @teacher @club @restore @subject", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, {
    additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
  });

  const { form: mathForm } = await openNewClubForm(page, null);
  await selectClubSubject(page, mathForm, "Matematyka");
  await selectSchool(mathForm, s.schoolName);
  await ownClass(mathForm, "4").check();
  await disableTeacherEmail(mathForm);
  const mathConfirmationId = await saveClubForm(page, mathForm);
  await deleteClubConfirmation(page, mathConfirmationId);

  const { form: physicsForm } = await openNewClubForm(page, null);
  await selectClubSubject(page, physicsForm, "Fizyka");
  await selectSchool(physicsForm, s.schoolName);
  await ownClass(physicsForm, "7").check();
  await disableTeacherEmail(physicsForm);
  const physicsConfirmationId = await saveClubForm(page, physicsForm, "Fizyka");

  await restoreClubConfirmation(page, mathConfirmationId);

  const mathEditForm = await openClubEdit(page, mathConfirmationId);
  await expect(ownClass(mathEditForm, "4")).toBeChecked();
  await cancelClubForm(mathEditForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, mathConfirmationId)).toHaveCount(0);
  await expect(deletedConfirmationIcon(page, physicsConfirmationId)).toHaveCount(0);

  await s.record("restoredMathConfirmationId", mathConfirmationId);
  await s.record("activePhysicsConfirmationId", physicsConfirmationId);
});

test("CLUB-46: nowsze potwierdzenie blokuje przywrócenie starszego dla tego samego przedmiotu, poziomu i szkoły @teacher @club @restore @school-year @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form: previousForm, schoolYear: currentSchoolYear } = await openNewClubForm(page);
  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;
  await selectSchoolYear(previousForm, previousSchoolYear);
  await selectSchool(previousForm, s.schoolName);
  await ownClass(previousForm, "4").check();
  await disableTeacherEmail(previousForm);
  const previousConfirmationId = await saveClubForm(page, previousForm);
  await deleteClubConfirmation(page, previousConfirmationId);

  const { form: currentForm } = await openNewClubForm(page);
  await selectSchool(currentForm, s.schoolName);
  await ownClass(currentForm, "5").check();
  await disableTeacherEmail(currentForm);
  const currentConfirmationId = await saveClubForm(page, currentForm);

  await requestClubRestore(page, previousConfirmationId);

  const warning = page.locator("mat-dialog-container").filter({
    hasText: "Na ten przedmiot/poziom/szkołę istnieje nowsze potwierdzenie.",
  });

  await expect(warning).toBeVisible();
  await expect(warning).toContainText(`ID potwierdzenia: ${currentConfirmationId}`);
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);

  await s.app.openPanel("teacher", teacherId);
  await expect(confirmationRow(page, previousConfirmationId)).toContainText(previousSchoolYear);
  await expect(confirmationRow(page, currentConfirmationId)).toContainText(currentSchoolYear);
  await expect(deletedConfirmationIcon(page, previousConfirmationId)).toHaveText("backspace");
  await expect(deletedConfirmationIcon(page, currentConfirmationId)).toHaveCount(0);

  const currentEditForm = await openClubEdit(page, currentConfirmationId);
  await expect(ownClass(currentEditForm, "5")).toBeChecked();
  await cancelClubForm(currentEditForm);

  await s.record("blockedPreviousConfirmationId", previousConfirmationId);
  await s.record("blockingCurrentConfirmationId", currentConfirmationId);
});

test("CLUB-47: aktywne potwierdzenie innej szkoły nie blokuje przywrócenia @teacher @club @restore @school", async ({
  clubSchools,
  page,
  scenario: s,
}) => {
  const firstSchoolId = await s.createSchool();
  const firstSchoolName = s.schoolName;
  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;
  const teacherId = await s.createTeacher(firstSchoolId, firstSchoolName, {
    additionalSchoolIds: [secondSchoolId],
  });

  const { form: firstSchoolForm } = await openNewClubForm(page);
  await selectSchool(firstSchoolForm, firstSchoolName);
  await ownClass(firstSchoolForm, "4").check();
  await disableTeacherEmail(firstSchoolForm);
  const firstSchoolConfirmationId = await saveClubForm(page, firstSchoolForm);
  await deleteClubConfirmation(page, firstSchoolConfirmationId);

  const { form: secondSchoolForm } = await openNewClubForm(page);
  await selectSchool(secondSchoolForm, secondSchoolName);
  await ownClass(secondSchoolForm, "5").check();
  await disableTeacherEmail(secondSchoolForm);
  const secondSchoolConfirmationId = await saveClubForm(page, secondSchoolForm);

  await restoreClubConfirmation(page, firstSchoolConfirmationId);

  const firstSchoolEditForm = await openClubEdit(page, firstSchoolConfirmationId);
  await expect(firstSchoolEditForm).toContainText(firstSchoolName);
  await expect(firstSchoolEditForm).toContainText(secondSchoolName);
  await expect(ownClass(firstSchoolEditForm, "4")).toBeChecked();
  await cancelClubForm(firstSchoolEditForm);

  const secondSchoolEditForm = await openClubEdit(page, secondSchoolConfirmationId);
  await expect(ownClass(secondSchoolEditForm, "5")).toBeChecked();
  await cancelClubForm(secondSchoolEditForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, firstSchoolConfirmationId)).toHaveCount(0);
  await expect(deletedConfirmationIcon(page, secondSchoolConfirmationId)).toHaveCount(0);

  await s.record("restoredFirstSchoolConfirmationId", firstSchoolConfirmationId);
  await s.record("activeSecondSchoolConfirmationId", secondSchoolConfirmationId);
});

test("CLUB-48: przywrócone potwierdzenie można edytować @teacher @club @restore @edit", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await deleteClubConfirmation(page, confirmationId);
  await restoreClubConfirmation(page, confirmationId);

  await s.app.openPanel("teacher", teacherId);
  const editForm = await openClubEdit(page, confirmationId);
  await ownClass(editForm, "4").uncheck();
  await ownClass(editForm, "5").check();
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4")).not.toBeChecked();
  await expect(ownClass(verifyForm, "5")).toBeChecked();
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
  await s.record("editedRestoredClass", "5");
});

// Akcje potwierdzenia, weryfikacja negatywna i historia.
test("CLUB-49: edycja, weryfikacja negatywna, usunięcie i historia wymagają wybranego potwierdzenia @teacher @club @actions", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const actionButtons = [
    confirmations(page).getByRole("button", { name: "Edytuj", exact: true }),
    confirmations(page).getByRole("button", { name: "Weryfikuj neg.", exact: true }),
    confirmations(page).getByRole("button", { name: "Usuń", exact: true }),
    confirmations(page).getByRole("button", { name: "Historia", exact: true }),
  ];

  for (const button of actionButtons) await expect(button).toBeDisabled();

  await confirmationRow(page, confirmationId).click();

  for (const button of actionButtons) await expect(button).toBeEnabled();

  await s.record("confirmationId", confirmationId);
});

test("CLUB-50: weryfikacja negatywna zmienia klasę NASZĄ na OBCĄ z wydawnictwem INNE @teacher @club @negative-verification @history", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await negativelyVerifyClubConfirmation(page, confirmationId);
  await expect(
    subjectLevelRow(page).getByRole("cell", { name: "Obcy", exact: true }),
  ).toBeVisible();

  const history = await openClubHistory(page, confirmationId);
  await expect(
    clubHistoryEntry(page, history, {
      className: "4",
      modification: /^Weryfikacja neg/i,
    }),
  ).toHaveCount(1);
  await history.getByRole("button", { name: "Zamknij", exact: true }).click();
  await expect(history).toHaveCount(0);

  const editForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(editForm, "4")).not.toBeChecked();
  await expect(foreignClass(editForm, "4")).toBeChecked();
  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText("INNE");
  await cancelClubForm(editForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(
    subjectLevelRow(page).getByRole("cell", { name: "Obcy", exact: true }),
  ).toBeVisible();

  await s.record("confirmationId", confirmationId);
  await s.record("negativePublisher", "INNE");
});

test("CLUB-51: weryfikacja negatywna zmienia wszystkie klasy NASZE na OBCE @teacher @club @negative-verification @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const verifiedClasses = ["4", "6", "8"];
  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  for (const className of verifiedClasses) await ownClass(form, className).check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await negativelyVerifyClubConfirmation(page, confirmationId);

  const editForm = await openClubEdit(page, confirmationId);
  for (const className of verifiedClasses) {
    await expect(ownClass(editForm, className)).not.toBeChecked();
    await expect(foreignClass(editForm, className)).toBeChecked();
  }
  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText("INNE");
  await cancelClubForm(editForm);

  await s.record("confirmationId", confirmationId);
  await s.record("negativeClasses", verifiedClasses.join(","));
});

test("CLUB-52: potwierdzenie zweryfikowane negatywnie można zmienić z powrotem na NASZE @teacher @club @negative-verification @edit", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await negativelyVerifyClubConfirmation(page, confirmationId);

  const editForm = await openClubEdit(page, confirmationId);
  await foreignClass(editForm, "4").uncheck();
  await ownClass(editForm, "4").check();
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(
    subjectLevelRow(page).getByRole("cell", { name: "Nasz", exact: true }),
  ).toBeVisible();

  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(foreignClass(verifyForm, "4")).not.toBeChecked();
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
  await s.record("restoredTeacherStatus", "Nasz");
});
