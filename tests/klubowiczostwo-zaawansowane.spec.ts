import { test, expect } from "./support/club-fixtures";

import type { Locator } from "@playwright/test";

import {
  MATH_SP_CLASSES,
  PHYSICS_SP_FOREIGN_CLASSES,
  cancelClubForm,
  clubHistoryEntry,
  confirmationDetails,
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
  openNewSupportingClubForm,
  openSupportingClubEdit,
  ownClass,
  ownSelectAll,
  saveClubEdit,
  saveClubForm,
  saveSupportingClubForm,
  selectClubSubject,
  selectForeignPublisher,
  selectSchool,
  selectSchoolYear,
  selectSupportingSchool,
  subjectLevelRow,
  supportingForeignClasses,
  supportingForeignClass,
  supportingOwnClass,
  supportingOwnClasses,
  supportingSubject,
  selectSupportingForeignPublisher,
  teacherSchoolFunctionCell,
  teacherSchoolPublisherCell,
  restoreClubConfirmation,
} from "./support/club";

import { prepareClubTeacher } from "./support/club-scenario";

const SUPPORTING_FOREIGN_PUBLISHERS = [
  { option: "GWO „Między nami”", school: "GWO MN" },
  { option: "GWO „Moim zdaniem”", school: "GWO MZ" },
  { option: "WIKING", school: "WIKING" },
  { option: "OPERON", school: "OPERON" },
  { option: "MAC", school: "MAC" },
  { option: "NOWA ERA", school: "NOWA ERA" },
  { option: "WSIP", school: "WSIP" },
  { option: "INNE", school: "INNE" },
] as const;

// Każdy scenariusz tworzy własnego nauczyciela i własne potwierdzenia.
// Współdzielone szkoły są tylko odczytywane, więc testy CLUB mogą bezpiecznie
// wykorzystywać wszystkie workery mimo globalnego fullyParallel: false.
test.describe.configure({ mode: "parallel" });

test("CLUB-53: potwierdzenie zweryfikowane negatywnie można usunąć @teacher @club @negative-verification @delete @history", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await negativelyVerifyClubConfirmation(page, confirmationId);
  await deleteClubConfirmation(page, confirmationId);

  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveText("backspace");

  const history = await openClubHistory(page, confirmationId);
  await expect(clubHistoryEntry(page, history, { modification: /^Usunięto potwie/i })).toHaveCount(
    1,
  );

  await s.record("confirmationId", confirmationId);
  await s.record("negativeConfirmationDeleted", "true");
});

// Złożone kombinacje wielu przedmiotów, szkół i lat.
test("CLUB-54: edycja Matematyki nie zmienia potwierdzenia Fizyki @teacher @club @multi-subject @edit", async ({
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

  const { form: physicsForm } = await openNewClubForm(page, null);
  await selectClubSubject(page, physicsForm, "Fizyka");
  await selectSchool(physicsForm, s.schoolName);
  await ownClass(physicsForm, "7").check();
  await ownClass(physicsForm, "7TNŚ").check();
  await disableTeacherEmail(physicsForm);
  const physicsConfirmationId = await saveClubForm(page, physicsForm, "Fizyka");

  const mathEditForm = await openClubEdit(page, mathConfirmationId);
  await ownClass(mathEditForm, "4").uncheck();
  await ownClass(mathEditForm, "5").check();
  await saveClubEdit(mathEditForm);

  await s.app.openPanel("teacher", teacherId);

  const mathVerifyForm = await openClubEdit(page, mathConfirmationId);
  await expect(ownClass(mathVerifyForm, "4")).not.toBeChecked();
  await expect(ownClass(mathVerifyForm, "5")).toBeChecked();
  await cancelClubForm(mathVerifyForm);

  const physicsVerifyForm = await openClubEdit(page, physicsConfirmationId);
  await expect(ownClass(physicsVerifyForm, "7")).toBeChecked();
  await expect(ownClass(physicsVerifyForm, "7TNŚ")).toBeChecked();
  await expect(ownClass(physicsVerifyForm, "8")).not.toBeChecked();
  await expect(ownClass(physicsVerifyForm, "8TNŚ")).not.toBeChecked();
  await cancelClubForm(physicsVerifyForm);

  await s.record("mathConfirmationId", mathConfirmationId);
  await s.record("physicsConfirmationId", physicsConfirmationId);
});

test("CLUB-55: weryfikacja negatywna Matematyki nie zmienia Fizyki @teacher @club @multi-subject @negative-verification", async ({
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

  const { form: physicsForm } = await openNewClubForm(page, null);
  await selectClubSubject(page, physicsForm, "Fizyka");
  await selectSchool(physicsForm, s.schoolName);
  await ownClass(physicsForm, "7").check();
  await disableTeacherEmail(physicsForm);
  const physicsConfirmationId = await saveClubForm(page, physicsForm, "Fizyka");

  await negativelyVerifyClubConfirmation(page, mathConfirmationId);

  await expect(
    subjectLevelRow(page, "Matematyka").getByRole("cell", { name: "Obcy", exact: true }),
  ).toBeVisible();
  await expect(
    subjectLevelRow(page, "Fizyka").getByRole("cell", { name: "Nasz", exact: true }),
  ).toBeVisible();

  const mathEditForm = await openClubEdit(page, mathConfirmationId);
  await expect(foreignClass(mathEditForm, "4")).toBeChecked();
  await expect(foreignClasses(mathEditForm).getByRole("combobox")).toContainText("INNE");
  await cancelClubForm(mathEditForm);

  const physicsEditForm = await openClubEdit(page, physicsConfirmationId);
  await expect(ownClass(physicsEditForm, "7")).toBeChecked();
  await expect(foreignClass(physicsEditForm, "7")).not.toBeChecked();
  await cancelClubForm(physicsEditForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(deletedConfirmationIcon(page, physicsConfirmationId)).toHaveCount(0);

  await s.record("negativeMathConfirmationId", mathConfirmationId);
  await s.record("unchangedPhysicsConfirmationId", physicsConfirmationId);
});

test("CLUB-56: usunięcie i przywrócenie Matematyki nie zmienia aktywnej Fizyki @teacher @club @multi-subject @delete @restore", async ({
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

  const { form: physicsForm } = await openNewClubForm(page, null);
  await selectClubSubject(page, physicsForm, "Fizyka");
  await selectSchool(physicsForm, s.schoolName);
  await ownClass(physicsForm, "8").check();
  await disableTeacherEmail(physicsForm);
  const physicsConfirmationId = await saveClubForm(page, physicsForm, "Fizyka");

  await deleteClubConfirmation(page, mathConfirmationId);
  await expect(deletedConfirmationIcon(page, mathConfirmationId)).toHaveText("backspace");
  await expect(deletedConfirmationIcon(page, physicsConfirmationId)).toHaveCount(0);

  const activePhysicsForm = await openClubEdit(page, physicsConfirmationId);
  await expect(ownClass(activePhysicsForm, "8")).toBeChecked();
  await cancelClubForm(activePhysicsForm);

  await restoreClubConfirmation(page, mathConfirmationId);
  await expect(deletedConfirmationIcon(page, mathConfirmationId)).toHaveCount(0);
  await expect(deletedConfirmationIcon(page, physicsConfirmationId)).toHaveCount(0);

  const restoredMathForm = await openClubEdit(page, mathConfirmationId);
  await expect(ownClass(restoredMathForm, "4")).toBeChecked();
  await cancelClubForm(restoredMathForm);

  const unchangedPhysicsForm = await openClubEdit(page, physicsConfirmationId);
  await expect(ownClass(unchangedPhysicsForm, "8")).toBeChecked();
  await cancelClubForm(unchangedPhysicsForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(subjectLevelRow(page, "Matematyka")).toContainText("Nasz");
  await expect(subjectLevelRow(page, "Fizyka")).toContainText("Nasz");

  await s.record("restoredMathConfirmationId", mathConfirmationId);
  await s.record("activePhysicsConfirmationId", physicsConfirmationId);
});

test("CLUB-57: dwie szkoły i dwa przedmioty tworzą cztery niezależne potwierdzenia @teacher @club @multi-subject @multi-school", async ({
  clubSchools,
  page,
  scenario: s,
}) => {
  const firstSchoolId = await s.createSchool();
  const firstSchoolName = s.schoolName;
  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;
  const teacherId = await s.createTeacher(firstSchoolId, firstSchoolName, {
    additionalSchoolIds: [secondSchoolId],
    subjectLevels: [
      { subject: "Matematyka", level: "Szkoła Podstawowa" },
      { subject: "Fizyka", level: "Szkoła Podstawowa" },
    ],
  });

  const createConfirmation = async (subject: string, schoolName: string, className: string) => {
    const { form, schoolYear } = await openNewClubForm(page, null);
    await selectClubSubject(page, form, subject);
    await selectSchool(form, schoolName);
    await ownClass(form, className).check();
    await disableTeacherEmail(form);
    const confirmationId = await saveClubForm(page, form, subject);
    return { className, confirmationId, schoolName, schoolYear, subject };
  };

  const expectedConfirmations = [
    await createConfirmation("Matematyka", firstSchoolName, "4"),
    await createConfirmation("Matematyka", secondSchoolName, "5"),
    await createConfirmation("Fizyka", firstSchoolName, "7"),
    await createConfirmation("Fizyka", secondSchoolName, "8"),
  ];

  expect(new Set(expectedConfirmations.map(({ confirmationId }) => confirmationId)).size).toBe(4);

  await s.app.openPanel("teacher", teacherId);

  for (const expected of expectedConfirmations) {
    const row = confirmationRow(page, expected.confirmationId);
    await expect(row).toContainText(expected.subject);
    await expect(row).toContainText(expected.schoolYear);

    const details = await confirmationDetails(page, expected.confirmationId);
    await expect(details).toHaveCount(1);
    await expect(details).toContainText(expected.schoolName);
    await expect(
      details.getByRole("cell", { name: expected.className, exact: true }),
    ).toBeVisible();

    await row.locator("mat-icon").filter({ hasText: "keyboard_arrow_up" }).click();
  }

  await s.record(
    "matrixConfirmationIds",
    expectedConfirmations.map(({ confirmationId }) => confirmationId).join(","),
  );
});

test("CLUB-58: Matematyka i Fizyka zachowują niezależne potwierdzenia dla dwóch lat szkolnych @teacher @club @multi-subject @school-year", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, {
    additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
  });

  const { form: firstForm, schoolYear: currentSchoolYear } = await openNewClubForm(page, null);
  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;

  const saveForYear = async (
    form: typeof firstForm,
    subject: string,
    schoolYear: string,
    className: string,
  ) => {
    await selectClubSubject(page, form, subject);
    await selectSchoolYear(form, schoolYear);
    await selectSchool(form, s.schoolName);
    await ownClass(form, className).check();
    await disableTeacherEmail(form);
    const confirmationId = await saveClubForm(page, form, subject);
    return { className, confirmationId, schoolYear, subject };
  };

  // Octopus nie pozwala dodać starszego potwierdzenia, jeżeli dla tej samej
  // szkoły, poziomu i przedmiotu istnieje już nowsze. Dlatego dla każdego
  // przedmiotu zapisujemy najpierw poprzedni, a potem bieżący rok.
  const expectedConfirmations = [
    await saveForYear(firstForm, "Matematyka", previousSchoolYear, "5"),
  ];

  for (const [subject, schoolYear, className] of [
    ["Fizyka", previousSchoolYear, "8"],
    ["Matematyka", currentSchoolYear, "4"],
    ["Fizyka", currentSchoolYear, "7"],
  ] as const) {
    const { form } = await openNewClubForm(page, null);
    expectedConfirmations.push(await saveForYear(form, subject, schoolYear, className));
  }

  expect(new Set(expectedConfirmations.map(({ confirmationId }) => confirmationId)).size).toBe(4);

  await s.app.openPanel("teacher", teacherId);

  for (const expected of expectedConfirmations) {
    const row = confirmationRow(page, expected.confirmationId);
    await expect(row).toContainText(expected.subject);
    await expect(row).toContainText(expected.schoolYear);

    const editForm = await openClubEdit(page, expected.confirmationId);
    await expect(ownClass(editForm, expected.className)).toBeChecked();
    await cancelClubForm(editForm);
  }

  await s.record("currentSchoolYear", currentSchoolYear);
  await s.record("previousSchoolYear", previousSchoolYear);
  await s.record(
    "multiYearConfirmationIds",
    expectedConfirmations.map(({ confirmationId }) => confirmationId).join(","),
  );
});

test("CLUB-59: mieszany cykl życia Matematyki i Fizyki zachowuje niezależne statusy i historie @teacher @club @multi-subject @negative-verification @delete @restore @history", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s, {
    additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
  });

  const { form: mathForm } = await openNewClubForm(page, null);
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

  await negativelyVerifyClubConfirmation(page, physicsConfirmationId, "Fizyka");
  await deleteClubConfirmation(page, mathConfirmationId);
  await restoreClubConfirmation(page, mathConfirmationId);

  await expect(
    subjectLevelRow(page, "Matematyka").getByRole("cell", { name: "Nasz", exact: true }),
  ).toBeVisible();
  await expect(
    subjectLevelRow(page, "Fizyka").getByRole("cell", { name: "Obcy", exact: true }),
  ).toBeVisible();

  const mathEditForm = await openClubEdit(page, mathConfirmationId);
  await expect(ownClass(mathEditForm, "4")).toBeChecked();
  await cancelClubForm(mathEditForm);

  const physicsEditForm = await openClubEdit(page, physicsConfirmationId);
  await expect(foreignClass(physicsEditForm, "7")).toBeChecked();
  await expect(foreignClasses(physicsEditForm).getByRole("combobox")).toContainText("INNE");
  await cancelClubForm(physicsEditForm);

  const mathHistory = await openClubHistory(page, mathConfirmationId);
  await expect(
    clubHistoryEntry(page, mathHistory, { modification: /^Przywrócono po/i }),
  ).toHaveCount(1);
  await mathHistory.getByRole("button", { name: "Zamknij", exact: true }).click();
  await expect(mathHistory).toHaveCount(0);

  const physicsHistory = await openClubHistory(page, physicsConfirmationId);
  await expect(
    clubHistoryEntry(page, physicsHistory, {
      className: "7",
      modification: /^Weryfikacja neg/i,
    }),
  ).toHaveCount(1);

  await s.record("restoredMathConfirmationId", mathConfirmationId);
  await s.record("negativePhysicsConfirmationId", physicsConfirmationId);
});

test("CLUB-60: nowsze potwierdzenie blokuje późniejsze dodanie starszego dla tej samej szkoły i przedmiotu @teacher @club @school-year @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form: currentForm, schoolYear: currentSchoolYear } = await openNewClubForm(page);
  await selectSchool(currentForm, s.schoolName);
  await ownClass(currentForm, "4").check();
  await disableTeacherEmail(currentForm);
  const currentConfirmationId = await saveClubForm(page, currentForm);

  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;
  const { form: previousForm } = await openNewClubForm(page);
  await selectSchoolYear(previousForm, previousSchoolYear);
  await selectSchool(previousForm, s.schoolName);
  await ownClass(previousForm, "5").check();
  await disableTeacherEmail(previousForm);
  await previousForm.getByRole("button", { name: "Zapisz", exact: true }).click();

  const warning = page.locator("mat-dialog-container").filter({
    hasText: "Na ten przedmiot/poziom/szkołę istnieje nowsze potwierdzenie.",
  });
  await expect(warning).toBeVisible();
  await expect(warning).toContainText(`ID potwierdzenia: ${currentConfirmationId}`);
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);

  await s.app.openPanel("teacher", teacherId);
  await expect(confirmationRow(page, currentConfirmationId)).toContainText(currentSchoolYear);
  await expect(
    confirmations(page)
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: previousSchoolYear, exact: true }) }),
  ).toHaveCount(0);

  await s.record("blockingConfirmationId", currentConfirmationId);
  await s.record("blockedSchoolYear", previousSchoolYear);
});

// Reguły szczególne Języka polskiego, zabezpieczenia zapisu i formularze WSPOM.
test("CLUB-61: Język polski pozwala zapisać tylko jedną NASZĄ serię klasy 4 @teacher @club @polish @classes @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, { subject: "Język polski" });

  const { form } = await openNewClubForm(page, null);
  await selectClubSubject(page, form, "Język polski");
  await selectSchool(form, s.schoolName);

  const betweenUsSeries = ownClass(form, "4 Między N");
  const inMyOpinionSeries = ownClass(form, "4 Moim Z");

  await expect(betweenUsSeries).toBeEnabled();
  await expect(inMyOpinionSeries).toBeEnabled();

  await betweenUsSeries.check();
  await expect(betweenUsSeries).toBeChecked();
  await expect(inMyOpinionSeries).not.toBeChecked();
  await expect(inMyOpinionSeries).toBeDisabled();

  await betweenUsSeries.uncheck();
  await expect(inMyOpinionSeries).toBeEnabled();
  await inMyOpinionSeries.check();
  await expect(inMyOpinionSeries).toBeChecked();
  await expect(betweenUsSeries).not.toBeChecked();
  await expect(betweenUsSeries).toBeDisabled();
  await ownClass(form, "5").check();

  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form, "Język polski");

  await s.app.openPanel("teacher", teacherId);
  await expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText("GWO MN / MZ");
  const editForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(editForm, "4 Moim Z")).toBeChecked();
  await expect(ownClass(editForm, "5")).toBeChecked();
  await expect(ownClass(editForm, "4 Między N")).not.toBeChecked();
  await expect(ownClass(editForm, "4 Między N")).toBeDisabled();
  await cancelClubForm(editForm);

  await s.record("confirmationId", confirmationId);
  await s.record("polishClassFourSeries", "4 Moim Z");
});

test("CLUB-62: formularz WSPOM tworzy potwierdzenie i funkcję nauczyciela wspomagającego @teacher @club @supporting", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form, schoolYear } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, form, s.schoolName);
  await supportingSubject(form, "Język polski").check();
  await (await supportingOwnClass(form, "Język polski", "6")).check();
  const confirmationId = await saveSupportingClubForm(page, form, "Język polski");

  await s.app.openPanel("teacher", teacherId);
  const confirmation = confirmationRow(page, confirmationId);
  await expect(confirmation).toContainText("Język polski - WSPOM");
  await expect(confirmation).toContainText(schoolYear);

  await expect(teacherSchoolFunctionCell(page, s.schoolName)).toContainText(
    "Nauczyciel wspomagający",
  );
  await expect(subjectLevelRow(page, "Język polski")).toContainText("Nasz");

  await s.record("supportingConfirmationId", confirmationId);
  await s.record("supportingFunction", "Nauczyciel wspomagający");
});

test("CLUB-63: jeden formularz WSPOM zapisuje Język polski i Matematykę niezależnie @teacher @club @supporting @multi-subject", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form, schoolYear } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, form, s.schoolName);
  await supportingSubject(form, "Język polski").check();
  await supportingSubject(form, "Matematyka").check();

  await expect(form.locator(".green-box")).toHaveCount(2);
  await (await supportingOwnClass(form, "Język polski", "6")).check();
  await (await supportingOwnClass(form, "Matematyka", "5")).check();

  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toHaveCount(0);

  await s.app.openPanel("teacher", teacherId);
  const polishRow = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", { name: "Język polski - WSPOM", exact: true }),
    });
  const mathRow = confirmations(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "Matematyka - WSPOM", exact: true }) });

  await expect(polishRow).toHaveCount(1);
  await expect(mathRow).toHaveCount(1);
  await expect(polishRow).toContainText(schoolYear);
  await expect(mathRow).toContainText(schoolYear);

  const polishConfirmationId = (await polishRow.getByRole("cell").nth(1).innerText()).trim();
  const mathConfirmationId = (await mathRow.getByRole("cell").nth(1).innerText()).trim();
  expect(polishConfirmationId).toMatch(/^\d+$/);
  expect(mathConfirmationId).toMatch(/^\d+$/);
  expect(polishConfirmationId).not.toBe(mathConfirmationId);

  await expect(teacherSchoolFunctionCell(page, s.schoolName)).toContainText(
    "Nauczyciel wspomagający",
  );

  await s.record("supportingPolishConfirmationId", polishConfirmationId);
  await s.record("supportingMathConfirmationId", mathConfirmationId);
});

test("CLUB-64: dwa szybkie kliknięcia Zapisz nie tworzą dwóch potwierdzeń @teacher @club @concurrency", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);

  const save = form.getByRole("button", { name: "Zapisz", exact: true });
  await expect(save).toBeEnabled();
  await save.click({ clickCount: 2, delay: 100 });
  await expect(form).toHaveCount(0);

  const mathRows = confirmations(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "Matematyka", exact: true }) });
  await expect(mathRows).toHaveCount(1);

  const confirmationId = (await mathRows.getByRole("cell").nth(1).innerText()).trim();
  expect(confirmationId).toMatch(/^\d+$/);
  await s.record("confirmationId", confirmationId);
  await s.record("rapidSaveClicks", "2");
  await s.record("rapidSaveClickDelayMs", "100");
});

test("CLUB-65: zaznaczenie wszystkich klas OBCYCH Matematyki SP jest trwałe @teacher @club @classes @publisher @select-all", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await foreignSelectAll(form).check();

  for (const className of MATH_SP_CLASSES) {
    await expect(foreignClass(form, className)).toBeChecked();
    await expect(ownClass(form, className)).toBeDisabled();
  }

  const publisher = await selectForeignPublisher(page, form);
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);
  const editForm = await openClubEdit(page, confirmationId);

  for (const className of MATH_SP_CLASSES) {
    await expect(foreignClass(editForm, className)).toBeChecked();
    await expect(ownClass(editForm, className)).toBeDisabled();
  }

  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText(publisher);
  await cancelClubForm(editForm);

  await s.record("confirmationId", confirmationId);
  await s.record("foreignPublisher", publisher);
  await s.record("foreignClasses", MATH_SP_CLASSES.join(","));
});

test("CLUB-66: edycja Języka polskiego nie pozwala zapisać dwóch NASZYCH serii klasy 4 @teacher @club @polish @edit @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, { subject: "Język polski" });

  const { form } = await openNewClubForm(page, null);
  await selectClubSubject(page, form, "Język polski");
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4 Między N").check();
  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form, "Język polski");

  await expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText("GWO MN");

  const editForm = await openClubEdit(page, confirmationId);
  const betweenUsSeries = ownClass(editForm, "4 Między N");
  const inMyOpinionSeries = ownClass(editForm, "4 Moim Z");

  await expect(betweenUsSeries).toBeChecked();
  await expect(inMyOpinionSeries).not.toBeChecked();
  await expect(inMyOpinionSeries).toBeDisabled();

  await betweenUsSeries.uncheck();
  await expect(inMyOpinionSeries).toBeEnabled();
  await inMyOpinionSeries.check();
  await expect(inMyOpinionSeries).toBeChecked();
  await expect(betweenUsSeries).not.toBeChecked();
  await expect(betweenUsSeries).toBeDisabled();
  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);
  await expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText("GWO MZ");
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4 Moim Z")).toBeChecked();
  await expect(ownClass(verifyForm, "4 Między N")).not.toBeChecked();
  await expect(ownClass(verifyForm, "4 Między N")).toBeDisabled();
  await cancelClubForm(verifyForm);

  await s.record("confirmationId", confirmationId);
  await s.record("initialPolishSeries", "4 Między N");
  await s.record("editedPolishSeries", "4 Moim Z");
});

test("CLUB-67: zaznaczenie wszystkich NASZYCH klas Języka polskiego wybiera tylko jedną serię klasy 4 @teacher @club @polish @classes @select-all", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, { subject: "Język polski" });

  const { form } = await openNewClubForm(page, null);
  await selectClubSubject(page, form, "Język polski");
  await selectSchool(form, s.schoolName);
  await ownSelectAll(form).check();

  const series = ["4 Między N", "4 Moim Z"] as const;
  await expect
    .poll(async () => {
      const selected = await Promise.all(series.map((name) => ownClass(form, name).isChecked()));
      return selected.filter(Boolean).length;
    })
    .toBe(1);

  for (const className of ["5", "6", "7", "8"]) {
    await expect(ownClass(form, className)).toBeChecked();
  }

  const selectedSeries = (await ownClass(form, series[0]).isChecked()) ? series[0] : series[1];
  const blockedSeries = selectedSeries === series[0] ? series[1] : series[0];
  await expect(ownClass(form, blockedSeries)).toBeDisabled();
  await expect(foreignClass(form, "4")).toBeDisabled();

  await disableTeacherEmail(form);
  const confirmationId = await saveClubForm(page, form, "Język polski");

  await s.app.openPanel("teacher", teacherId);
  const editForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(editForm, selectedSeries)).toBeChecked();
  await expect(ownClass(editForm, blockedSeries)).not.toBeChecked();
  await expect(ownClass(editForm, blockedSeries)).toBeDisabled();
  for (const className of ["5", "6", "7", "8"]) {
    await expect(ownClass(editForm, className)).toBeChecked();
  }
  await cancelClubForm(editForm);

  await s.record("confirmationId", confirmationId);
  await s.record("selectedPolishSeries", selectedSeries);
  await s.record("ownClasses", `${selectedSeries},5,6,7,8`);
});

test("CLUB-68: formularz WSPOM nie pokazuje serii Języka polskiego ani Fizyki @teacher @club @supporting @polish @physics @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, form, s.schoolName);
  await supportingSubject(form, "Język polski").check();
  await supportingSubject(form, "Fizyka").check();

  const polishOwn = await supportingOwnClasses(form, "Język polski");
  const polishForeign = await supportingForeignClasses(form, "Język polski");
  for (const className of MATH_SP_CLASSES) {
    await expect(polishOwn.getByRole("checkbox", { name: className, exact: true })).toHaveCount(1);
    await expect(polishForeign.getByRole("checkbox", { name: className, exact: true })).toHaveCount(
      1,
    );
  }
  await expect(polishOwn.getByRole("checkbox")).toHaveCount(MATH_SP_CLASSES.length);
  await expect(polishForeign.getByRole("checkbox")).toHaveCount(MATH_SP_CLASSES.length);
  await expect(polishOwn.getByRole("checkbox", { name: "4 Między N", exact: true })).toHaveCount(0);
  await expect(polishOwn.getByRole("checkbox", { name: "4 Moim Z", exact: true })).toHaveCount(0);

  const physicsOwn = await supportingOwnClasses(form, "Fizyka");
  const physicsForeign = await supportingForeignClasses(form, "Fizyka");
  for (const className of PHYSICS_SP_FOREIGN_CLASSES) {
    await expect(physicsOwn.getByRole("checkbox", { name: className, exact: true })).toHaveCount(1);
    await expect(
      physicsForeign.getByRole("checkbox", { name: className, exact: true }),
    ).toHaveCount(1);
  }
  await expect(physicsOwn.getByRole("checkbox")).toHaveCount(PHYSICS_SP_FOREIGN_CLASSES.length);
  await expect(physicsForeign.getByRole("checkbox")).toHaveCount(PHYSICS_SP_FOREIGN_CLASSES.length);
  await expect(physicsOwn.getByRole("checkbox", { name: "7TNŚ", exact: true })).toHaveCount(0);
  await expect(physicsOwn.getByRole("checkbox", { name: "8TNŚ", exact: true })).toHaveCount(0);

  await cancelClubForm(form);
});

test("CLUB-69: formularz WSPOM poprawnie prezentuje wszystkie OBCE wydawnictwa @teacher @club @supporting @publisher", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form, schoolYear } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, form, s.schoolName);
  await supportingSubject(form, "Język polski").check();
  await (await supportingForeignClass(form, "Język polski", "6")).check();
  await expect(await supportingOwnClass(form, "Język polski", "6")).toBeDisabled();
  await selectSupportingForeignPublisher(
    page,
    form,
    "Język polski",
    SUPPORTING_FOREIGN_PUBLISHERS[0].option,
  );
  const confirmationId = await saveSupportingClubForm(page, form, "Język polski");

  for (let index = 0; index < SUPPORTING_FOREIGN_PUBLISHERS.length; index += 1) {
    const publisher = SUPPORTING_FOREIGN_PUBLISHERS[index];
    const nextPublisher = SUPPORTING_FOREIGN_PUBLISHERS[index + 1];

    await test.step(`WSPOM: ${publisher.option} → ${publisher.school}`, async () => {
      await s.app.openPanel("teacher", teacherId);
      const confirmation = confirmationRow(page, confirmationId);
      await expect(confirmation).toContainText("Język polski - WSPOM");
      await expect(confirmation).toContainText(schoolYear);
      await expect(subjectLevelRow(page, "Język polski")).toContainText("Obcy");
      await expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText(publisher.school);
      await expect(teacherSchoolFunctionCell(page, s.schoolName)).toContainText(
        "Nauczyciel wspomagający",
      );

      const editForm = await openSupportingClubEdit(page, confirmationId);
      await expect(await supportingForeignClass(editForm, "Język polski", "6")).toBeChecked();
      await expect(
        (await supportingForeignClasses(editForm, "Język polski")).getByRole("combobox"),
      ).toContainText(publisher.option);

      if (nextPublisher) {
        await selectSupportingForeignPublisher(
          page,
          editForm,
          "Język polski",
          nextPublisher.option,
        );
        await saveClubEdit(editForm);
      } else {
        await cancelClubForm(editForm);
      }
    });
  }

  await s.record("supportingConfirmationId", confirmationId);
  await s.record("supportingForeignPublishers", JSON.stringify(SUPPORTING_FOREIGN_PUBLISHERS));
});

test("CLUB-70: formularz WSPOM wymaga szkoły, przedmiotu i klasy @teacher @club @supporting @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const expectRejectedSave = async (form: Locator) => {
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toBeVisible();
    await s.app.openPanel("teacher", teacherId);
  };

  const { form: withoutSchool } = await openNewSupportingClubForm(page);
  await expectRejectedSave(withoutSchool);

  const { form: withoutSubject } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, withoutSubject, s.schoolName);
  await expectRejectedSave(withoutSubject);

  const { form: withoutClass } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, withoutClass, s.schoolName);
  await supportingSubject(withoutClass, "Język polski").check();
  await expectRejectedSave(withoutClass);

  await expect(
    confirmations(page)
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: / - WSPOM$/ }) }),
  ).toHaveCount(0);

  await s.record("supportingValidationCases", "missing-school,missing-subject,missing-class");
});

test("CLUB-71: zwykłe potwierdzenie i WSPOM współistnieją dla tego samego przedmiotu, szkoły i roku @teacher @club @supporting @duplicate", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, { subject: "Język polski" });

  const { form: regularForm, schoolYear } = await openNewClubForm(page, null);
  await selectClubSubject(page, regularForm, "Język polski");
  await selectSchool(regularForm, s.schoolName);
  await ownClass(regularForm, "5").check();
  await disableTeacherEmail(regularForm);
  const regularConfirmationId = await saveClubForm(page, regularForm, "Język polski");

  const { form: supportingForm } = await openNewSupportingClubForm(page);
  await selectSupportingSchool(page, supportingForm, s.schoolName);
  await supportingSubject(supportingForm, "Język polski").check();
  await (await supportingOwnClass(supportingForm, "Język polski", "6")).check();
  const supportingConfirmationId = await saveSupportingClubForm(
    page,
    supportingForm,
    "Język polski",
  );

  expect(supportingConfirmationId).not.toBe(regularConfirmationId);

  await s.app.openPanel("teacher", teacherId);
  await expect(confirmationRow(page, regularConfirmationId)).toContainText("Język polski");
  await expect(confirmationRow(page, regularConfirmationId)).toContainText(schoolYear);
  await expect(confirmationRow(page, supportingConfirmationId)).toContainText(
    "Język polski - WSPOM",
  );
  await expect(confirmationRow(page, supportingConfirmationId)).toContainText(schoolYear);
  await expect(teacherSchoolFunctionCell(page, s.schoolName)).toContainText(
    "Nauczyciel wspomagający",
  );

  await s.record("regularPolishConfirmationId", regularConfirmationId);
  await s.record("supportingPolishConfirmationId", supportingConfirmationId);
});
