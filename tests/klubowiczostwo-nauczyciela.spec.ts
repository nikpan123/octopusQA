import { test, expect } from "./support/club-fixtures";
import type { Locator } from "@playwright/test";
import {
  MATH_SECONDARY_FOREIGN_CLASSES,
  MATH_SECONDARY_OWN_CLASSES,
  MATH_SP_CLASSES,
  PHYSICS_SP_FOREIGN_CLASSES,
  PHYSICS_SP_OWN_CLASSES,
  cancelClubForm,
  clubHistoryEntry,
  confirmDeleteIfShown,
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
  ownClasses,
  ownSelectAll,
  saveClubEdit,
  saveClubForm,
  saveSupportingClubForm,
  schoolYears,
  selectClubSubject,
  selectDifferentForeignPublisher,
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
  requestClubRestore,
  restoreClubConfirmation,
} from "./support/club";
import { prepareClubTeacher } from "./support/club-scenario";

const REGULAR_FOREIGN_PUBLISHERS = [
  { option: "WIKING", school: "WIKING" },
  { option: "OPERON", school: "OPERON" },
  { option: "MAC", school: "MAC" },
  { option: "NOWA ERA", school: "NOWA ERA" },
  { option: "WSiP", school: "WSiP" },
  { option: "INNE", school: "INNE" },
] as const;

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

// Podstawowy cykl formularza: tworzenie, edycja, szkoły, anulowanie i usunięcie.
test("CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe @teacher @club @history", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId, undefined, { subjectLevels: [] });
  const subjects = page.locator("app-teacher-subjects");
  const subjectRow = subjects.getByRole("row").filter({
    has: page.getByRole("cell", { name: "Matematyka", exact: true }),
  });
  const confirmations = page.getByRole("tabpanel", {
    name: "Potwierdzenia",
    exact: true,
  });
  let schoolYear = "";
  let confirmationId = "";
  await test.step("Dodaj matematykę na poziomie szkoły podstawowej", async () => {
    await subjects.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Matematyka", exact: true }).click();
    await subjects.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Szkoła Podstawowa", exact: true }).click();
    await subjects.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect(subjectRow.getByRole("cell", { name: "SP", exact: true })).toBeVisible();
    await s.app.openPanel("teacher", teacherId);
    await expect(subjectRow.getByRole("cell", { name: "SP", exact: true })).toBeVisible();
  });
  await test.step("Dodaj formularz klubowy dla klasy 4 bez wysyłki e-maila", async () => {
    await confirmations.getByRole("button", { name: "Dodaj formularz", exact: true }).click();
    const form = s.app.dialog("Formularz klubowy");
    schoolYear = (
      await form
        .locator("mat-radio-button")
        .filter({ has: page.getByRole("radio", { checked: true }) })
        .innerText()
    ).trim();
    expect(schoolYear).toMatch(/^\d{4}\/\d{4}$/);
    await s.record("schoolYear", schoolYear);
    await s.record("subject", "Matematyka");
    await s.record("level", "SP");
    await s.record("class", "4");
    await expect(form.getByRole("combobox")).toHaveText("Matematyka");
    await form.getByRole("row").filter({ hasText: s.schoolName }).getByRole("checkbox").check();
    await form.locator(".green-box").getByRole("checkbox", { name: "4", exact: true }).check();
    const email = form.getByRole("checkbox", {
      name: "Wysłać maila do nauczyciela",
      exact: true,
    });
    await email.uncheck();
    await expect(email).not.toBeChecked();
    await s.record("sendEmail", "false");
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", { name: "Matematyka", exact: true }),
    });
    await expect(row).toHaveCount(1);
    confirmationId = (await row.getByRole("cell").nth(1).innerText()).trim();
    expect(confirmationId).toMatch(/^\d+$/);
    await s.record("confirmationId", confirmationId);
  });
  await test.step("Sprawdź zapisany formularz, szkołę, klasę i status Nasz", async () => {
    await s.app.openPanel("teacher", teacherId);
    await expect(subjectRow.getByRole("cell", { name: "Nasz", exact: true })).toBeVisible();
    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", { name: confirmationId, exact: true }),
    });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("cell", { name: "Matematyka", exact: true })).toBeVisible();
    await expect(row.getByRole("cell", { name: "SP", exact: true })).toBeVisible();
    await expect(row.getByRole("cell", { name: schoolYear, exact: true })).toBeVisible();
    await row.locator("mat-icon").filter({ hasText: "keyboard_arrow_down" }).click();
    const details = confirmations.locator("app-form-clubs-inner-table");
    const detail = details.getByRole("row").filter({ has: page.getByRole("cell") });
    await expect(detail).toHaveCount(1);
    await expect(detail.getByRole("cell").nth(1)).toContainText(s.schoolName);
    await expect(detail.getByRole("cell", { name: "SP", exact: true })).toBeVisible();
    await expect(detail.getByRole("cell", { name: "4", exact: true })).toBeVisible();
    await expect(detail.getByRole("cell").last().locator("mat-icon")).toHaveText(
      "check_circle_outline",
    );
  });

  await test.step("Sprawdź historię utworzenia klasy NASZEJ", async () => {
    const history = await openClubHistory(page, confirmationId);
    await expect(history.getByRole("heading")).toContainText(`Matematyka ${schoolYear}`);

    const addedRow = clubHistoryEntry(page, history, {
      className: "4",
      modification: "Dodane",
    });

    await expect(addedRow).toHaveCount(1);
    await expect(addedRow.getByRole("gridcell").nth(4).locator("mat-icon")).toHaveCount(1);
    await expect(addedRow.getByRole("gridcell").nth(6)).not.toHaveText("");
    await expect(addedRow.getByRole("gridcell").nth(7)).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
  });
});

test("CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała @teacher @club @history", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const { form, schoolYear } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);
  await s.record("schoolYear", schoolYear);
  await s.record("initialClass", "4");
  await s.record("editedClass", "5");

  await test.step("Edytuj klasę 4 na 5", async () => {
    await s.app.openPanel("teacher", teacherId);

    const editForm = await openClubEdit(page, confirmationId);

    await expect(ownClass(editForm, "4")).toBeChecked();
    await expect(ownClass(editForm, "5")).not.toBeChecked();

    await ownClass(editForm, "4").uncheck();
    await ownClass(editForm, "5").check();

    await saveClubEdit(editForm);
  });

  await test.step("Sprawdź trwałość klasy 5 po ponownym otwarciu", async () => {
    await s.app.openPanel("teacher", teacherId);

    await expect(confirmationRow(page, confirmationId)).toHaveCount(1);

    const detail = await confirmationDetails(page, confirmationId);

    await expect(
      detail.getByRole("cell", {
        name: "5",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      detail.getByRole("cell", {
        name: "4",
        exact: true,
      }),
    ).toHaveCount(0);
  });

  await test.step("Sprawdź historię zmiany klasy 4 na 5", async () => {
    const history = await openClubHistory(page, confirmationId);

    await expect(
      clubHistoryEntry(page, history, { className: "4", modification: "Usunięto" }),
    ).toHaveCount(1);
    await expect(
      clubHistoryEntry(page, history, { className: "5", modification: "Dodane" }),
    ).toHaveCount(1);
  });
});

test("CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  await s.createTeacher(schoolId);

  const { form } = await openNewClubForm(page);

  /*
   * Klasy pojawiają się dopiero po wybraniu szkoły.
   */
  await selectSchool(form, s.schoolName);

  await expect(form.locator(".green-box")).toBeVisible();

  await test.step("Sprawdź klasy 4-8", async () => {
    for (const classNumber of MATH_SP_CLASSES) {
      await expect(ownClass(form, classNumber)).toBeVisible();
    }
  });

  await test.step("Sprawdź brak klas 0-3", async () => {
    for (const classNumber of ["0", "1", "2", "3"]) {
      await expect(ownClass(form, classNumber)).toHaveCount(0);
    }
  });

  await cancelClubForm(form);
});

test("CLUB-04: formularz klubowy zachowuje kilka klas 4,5,6 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  for (const classNumber of ["4", "5", "6"]) {
    await ownClass(form, classNumber).check();
  }

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);
  await s.record("classes", "4,5,6");

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const classNumber of ["4", "5", "6"]) {
    await expect(ownClass(editForm, classNumber)).toBeChecked();
  }

  for (const classNumber of ["7", "8"]) {
    await expect(ownClass(editForm, classNumber)).not.toBeChecked();
  }

  await cancelClubForm(editForm);
});

test("CLUB-05: zaznaczenie wszystkich klas Matematyka/SP wybiera 4-8 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  const selectAll = ownClasses(form).getByRole("checkbox", {
    name: "Zaznacz wszystkie możliwe (nasze)",
    exact: true,
  });

  await selectAll.check();

  for (const classNumber of MATH_SP_CLASSES) {
    await expect(ownClass(form, classNumber)).toBeChecked();
  }

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);
  await s.record("classes", "4,5,6,7,8");

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const classNumber of MATH_SP_CLASSES) {
    await expect(ownClass(editForm, classNumber)).toBeChecked();
  }

  await cancelClubForm(editForm);
});

test("CLUB-06: edycja usuwa tylko wskazaną klasę 5 z zestawu 4,5,6 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  for (const classNumber of ["4", "5", "6"]) {
    await ownClass(form, classNumber).check();
  }

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await ownClass(editForm, "5").uncheck();

  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);

  const verifyForm = await openClubEdit(page, confirmationId);

  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(ownClass(verifyForm, "5")).not.toBeChecked();
  await expect(ownClass(verifyForm, "6")).toBeChecked();

  await cancelClubForm(verifyForm);
});

test("CLUB-07: formularz klubowy dotyczy tylko wybranej szkoły nauczyciela @teacher @club", async ({
  clubSchools,
  page,
  scenario: s,
}) => {
  const firstSchoolId = await s.createSchool();
  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;

  await s.record("secondSchoolId", secondSchoolId);
  await s.record("secondSchoolName", secondSchoolName);

  const teacherId = await s.createTeacher(firstSchoolId, undefined, {
    additionalSchoolIds: [secondSchoolId],
  });

  const { form } = await openNewClubForm(page);

  const firstSchool = form.getByRole("row").filter({
    hasText: s.schoolName,
  });

  const secondSchool = form.getByRole("row").filter({
    hasText: secondSchoolName,
  });

  await expect(firstSchool).toBeVisible();
  await expect(secondSchool).toBeVisible();

  await firstSchool.getByRole("checkbox").check();

  await expect(secondSchool.getByRole("checkbox")).not.toBeChecked();

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const detail = await confirmationDetails(page, confirmationId);

  await expect(detail).toContainText(s.schoolName);

  await expect(detail).not.toContainText(secondSchoolName);
});

test("CLUB-08: formularz klubowy obsługuje dwie szkoły nauczyciela @teacher @club", async ({
  clubSchools,
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE DWÓCH SZKÓŁ
   * =====================================================
   */

  const firstSchoolId = await s.createSchool();
  const firstSchoolName = s.schoolName;

  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;

  await s.record("firstSchoolId", firstSchoolId);
  await s.record("firstSchoolName", firstSchoolName);
  await s.record("secondSchoolId", secondSchoolId);
  await s.record("secondSchoolName", secondSchoolName);

  /*
   * =====================================================
   * NAUCZYCIEL
   * =====================================================
   */

  const teacherId = await s.createTeacher(firstSchoolId, firstSchoolName, {
    additionalSchoolIds: [secondSchoolId],
  });

  /*
   * =====================================================
   * MATEMATYKA / SP
   * =====================================================
   */

  /*
   * =====================================================
   * FORMULARZ KLUBOWY
   * =====================================================
   */

  const { form, schoolYear } = await openNewClubForm(page);

  await s.record("schoolYear", schoolYear);
  await s.record("subject", "Matematyka");
  await s.record("level", "SP");

  /*
   * Obie szkoły powinny być dostępne.
   */
  const firstSchoolRow = form.getByRole("row").filter({
    hasText: firstSchoolName,
  });

  const secondSchoolRow = form.getByRole("row").filter({
    hasText: secondSchoolName,
  });

  await expect(firstSchoolRow).toBeVisible();
  await expect(secondSchoolRow).toBeVisible();

  const firstSchoolCheckbox = firstSchoolRow.getByRole("checkbox");

  const secondSchoolCheckbox = secondSchoolRow.getByRole("checkbox");

  /*
   * =====================================================
   * NAJPIERW ZAZNACZAMY OBIE SZKOŁY
   * =====================================================
   *
   * Zaznaczenie kolejnej szkoły przebudowuje sekcje klas,
   * dlatego klasy ustawiamy dopiero później.
   */

  await expect(firstSchoolCheckbox).not.toBeChecked();

  await firstSchoolCheckbox.check();

  await expect(firstSchoolCheckbox).toBeChecked();

  await expect(secondSchoolCheckbox).not.toBeChecked();

  await secondSchoolCheckbox.check();

  await expect(secondSchoolCheckbox).toBeChecked();

  /*
   * Powinny istnieć dwa osobne zestawy klas.
   */
  const classBoxes = form.locator(".green-box");

  await expect(classBoxes).toHaveCount(2);

  const firstSchoolClasses = classBoxes.nth(0);
  const secondSchoolClasses = classBoxes.nth(1);

  /*
   * =====================================================
   * SPRAWDZENIE ZAKRESU KLAS
   * =====================================================
   */

  for (const classNumber of ["4", "5", "6", "7", "8"]) {
    await expect(
      firstSchoolClasses.getByRole("checkbox", {
        name: classNumber,
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      secondSchoolClasses.getByRole("checkbox", {
        name: classNumber,
        exact: true,
      }),
    ).toBeVisible();
  }

  /*
   * =====================================================
   * SZKOŁA 1 → KLASA 4
   * =====================================================
   */

  const firstSchoolClass4 = firstSchoolClasses.getByRole("checkbox", {
    name: "4",
    exact: true,
  });

  await expect(firstSchoolClass4).not.toBeChecked();

  await firstSchoolClass4.check();

  await expect(firstSchoolClass4).toBeChecked();

  /*
   * =====================================================
   * SZKOŁA 2 → KLASA 5
   * =====================================================
   */

  const secondSchoolClass5 = secondSchoolClasses.getByRole("checkbox", {
    name: "5",
    exact: true,
  });

  await expect(secondSchoolClass5).not.toBeChecked();

  await secondSchoolClass5.check();

  await expect(secondSchoolClass5).toBeChecked();

  /*
   * =====================================================
   * KONTROLA PRZED ZAPISEM
   * =====================================================
   */

  await expect(firstSchoolClass4).toBeChecked();
  await expect(secondSchoolClass5).toBeChecked();

  /*
   * Szkoła 1:
   * 4 = TAK
   * 5 = NIE
   */
  await expect(
    firstSchoolClasses.getByRole("checkbox", {
      name: "5",
      exact: true,
    }),
  ).not.toBeChecked();

  /*
   * Szkoła 2:
   * 4 = NIE
   * 5 = TAK
   */
  await expect(
    secondSchoolClasses.getByRole("checkbox", {
      name: "4",
      exact: true,
    }),
  ).not.toBeChecked();

  /*
   * Nie wysyłamy maila.
   */
  await disableTeacherEmail(form);

  /*
   * =====================================================
   * ZAPIS
   * =====================================================
   *
   * Dwie szkoły powodują utworzenie dwóch osobnych
   * potwierdzeń Matematyka.
   */

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);

  /*
   * Szukamy wszystkich zapisanych potwierdzeń
   * dla Matematyki.
   */
  const confirmationRows = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  /*
   * Dwie szkoły = dwa osobne potwierdzenia.
   */
  await expect(confirmationRows).toHaveCount(2);

  const confirmationIds: string[] = [];

  for (let i = 0; i < 2; i++) {
    const confirmationId = (
      await confirmationRows.nth(i).getByRole("cell").nth(1).innerText()
    ).trim();

    expect(confirmationId).toMatch(/^\d+$/);

    confirmationIds.push(confirmationId);
  }

  expect(confirmationIds).toHaveLength(2);

  /*
   * ID muszą być różne.
   */
  expect(confirmationIds[0]).not.toBe(confirmationIds[1]);

  await s.record("confirmationIds", confirmationIds.join(","));

  await s.record("firstSchoolClass", "4");

  await s.record("secondSchoolClass", "5");

  /*
   * =====================================================
   * PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * Oba potwierdzenia nadal istnieją.
   */
  for (const confirmationId of confirmationIds) {
    await expect(confirmationRow(page, confirmationId)).toHaveCount(1);
  }

  /*
   * =====================================================
   * IDENTYFIKACJA POTWIERDZEŃ PO SZKOLE
   * =====================================================
   *
   * Nie zakładamy:
   *
   * confirmationIds[0] = szkoła 1
   * confirmationIds[1] = szkoła 2
   *
   * Sprawdzamy faktyczne szczegóły.
   */

  let firstSchoolConfirmationId = "";
  let secondSchoolConfirmationId = "";

  for (const confirmationId of confirmationIds) {
    const row = confirmationRow(page, confirmationId);

    await expect(row).toHaveCount(1);

    /*
     * Główne dane potwierdzenia.
     */
    await expect(
      row.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: schoolYear,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Rozwijamy szczegóły konkretnego potwierdzenia.
     */
    const details = await confirmationDetails(page, confirmationId);

    await expect(details).toHaveCount(1);

    const detailsText = await details.innerText();

    /*
     * ===================================================
     * SZKOŁA 1
     * ===================================================
     */

    if (detailsText.includes(firstSchoolName)) {
      firstSchoolConfirmationId = confirmationId;

      await expect(details).toContainText(firstSchoolName);

      await expect(
        details.getByRole("cell", {
          name: "SP",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Powinna mieć klasę 4.
       */
      await expect(
        details.getByRole("cell", {
          name: "4",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Nie powinna mieć klasy 5.
       */
      await expect(
        details.getByRole("cell", {
          name: "5",
          exact: true,
        }),
      ).toHaveCount(0);
    }

    /*
     * ===================================================
     * SZKOŁA 2
     * ===================================================
     */

    if (detailsText.includes(secondSchoolName)) {
      secondSchoolConfirmationId = confirmationId;

      await expect(details).toContainText(secondSchoolName);

      await expect(
        details.getByRole("cell", {
          name: "SP",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Powinna mieć klasę 5.
       */
      await expect(
        details.getByRole("cell", {
          name: "5",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Nie powinna mieć klasy 4.
       */
      await expect(
        details.getByRole("cell", {
          name: "4",
          exact: true,
        }),
      ).toHaveCount(0);
    }

    /*
     * Zwijamy aktualny wiersz przed sprawdzeniem kolejnego.
     */
    const arrowUp = row.locator("mat-icon").filter({
      hasText: "keyboard_arrow_up",
    });

    if (await arrowUp.count()) {
      await arrowUp.click();
    }
  }

  /*
   * =====================================================
   * KOŃCOWA WERYFIKACJA
   * =====================================================
   */

  expect(firstSchoolConfirmationId, "Nie znaleziono potwierdzenia dla pierwszej szkoły").not.toBe(
    "",
  );

  expect(secondSchoolConfirmationId, "Nie znaleziono potwierdzenia dla drugiej szkoły").not.toBe(
    "",
  );

  /*
   * Każda szkoła ma własne potwierdzenie.
   */
  expect(firstSchoolConfirmationId).not.toBe(secondSchoolConfirmationId);

  await s.record("firstSchoolConfirmationId", firstSchoolConfirmationId);

  await s.record("secondSchoolConfirmationId", secondSchoolConfirmationId);
});

test("CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia @teacher @club @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  await cancelClubForm(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(
    confirmations(page)
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", {
          name: "Matematyka",
          exact: true,
        }),
      }),
  ).toHaveCount(0);
});

test("CLUB-10: anulowanie edycji zachowuje klasę 4 @teacher @club @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await ownClass(editForm, "4").uncheck();
  await ownClass(editForm, "5").check();

  await expect(ownClass(editForm, "4")).not.toBeChecked();
  await expect(ownClass(editForm, "5")).toBeChecked();

  /*
   * Nie zapisujemy.
   */
  await cancelClubForm(editForm);

  await s.app.openPanel("teacher", teacherId);

  const verifyForm = await openClubEdit(page, confirmationId);

  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(ownClass(verifyForm, "5")).not.toBeChecked();

  await cancelClubForm(verifyForm);
});

test("CLUB-11: formularz klubowy można usunąć @teacher @club @delete", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE DANYCH
   * =====================================================
   */

  const schoolId = await s.createSchool();

  const teacherId = await s.createTeacher(schoolId);

  await s.record("subject", "Matematyka");
  await s.record("level", "SP");
  await s.record("class", "4");

  /*
   * Dodajemy nauczycielowi przedmioto-poziom:
   * Matematyka / SP.
   */
  /*
   * Otwieramy nauczyciela ponownie,
   * żeby formularz klubowy tworzyć na świeżym widoku.
   */
  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * UTWORZENIE FORMULARZA KLUBOWEGO
   * =====================================================
   */

  const { form, schoolYear } = await openNewClubForm(page);

  await s.record("schoolYear", schoolYear);

  /*
   * Wybieramy szkołę nauczyciela.
   */
  await selectSchool(form, s.schoolName);

  /*
   * Matematyka / SP → klasa 4.
   */
  const class4 = ownClass(form, "4");

  await expect(class4).toBeVisible();

  await class4.check();

  await expect(class4).toBeChecked();

  /*
   * Nie wysyłamy maila w teście automatycznym.
   */
  await disableTeacherEmail(form);

  /*
   * Zapisujemy formularz.
   */
  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);

  /*
   * =====================================================
   * POTWIERDZENIE, ŻE FORMULARZ ISTNIEJE
   * =====================================================
   */

  await test.step("Sprawdź utworzony formularz przed usunięciem", async () => {
    await s.app.openPanel("teacher", teacherId);

    const row = confirmationRow(page, confirmationId);

    await expect(row).toHaveCount(1);

    await expect(
      row.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: schoolYear,
        exact: true,
      }),
    ).toBeVisible();
  });

  /*
   * =====================================================
   * USUNIĘCIE FORMULARZA
   * =====================================================
   */

  await test.step("Usuń formularz klubowy", async () => {
    await s.app.openPanel("teacher", teacherId);

    const row = confirmationRow(page, confirmationId);

    await expect(row).toHaveCount(1);

    /*
     * Najpierw zaznaczamy konkretny wiersz.
     * Dopiero wtedy przycisk Usuń jest aktywny.
     */
    await row.click();

    const deleteButton = confirmations(page).getByRole("button", {
      name: "Usuń",
      exact: true,
    });

    await expect(deleteButton).toBeEnabled();

    await deleteButton.click();

    /*
     * Jeśli aplikacja pokaże dialog potwierdzający,
     * helper go obsłuży.
     */
    await confirmDeleteIfShown(page);

    await s.record("deleteClicked", "true");
  });

  /*
   * =====================================================
   * WERYFIKACJA PO USUNIĘCIU
   * =====================================================
   */

  await test.step("Sprawdź oznaczenie formularza jako usunięty", async () => {
    await s.app.openPanel("teacher", teacherId);

    const deletedRow = confirmationRow(page, confirmationId);

    /*
     * Formularz pozostaje w tabeli.
     */
    await expect(deletedRow).toHaveCount(1);

    /*
     * Nadal jest to ten sam formularz.
     */
    await expect(
      deletedRow.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Kolumna:
     * 0 - rozwijanie
     * 1 - Potw. ID
     * 2 - Usunięte
     */
    const deletedCell = deletedRow.getByRole("cell").nth(2);

    await expect(deletedCell).toBeVisible();

    /*
     * Octopus oznacza usunięty formularz
     * ikoną Material "backspace".
     */
    const deletedIcon = deletedCell.locator("mat-icon");

    await expect(deletedIcon).toHaveCount(1);

    await expect(deletedIcon).toHaveText("backspace");

    await s.record("deletedStateIcon", "backspace");

    await s.record("clubDeleted", "true");
  });
});

test("CLUB-12A: brak szkoły blokuje utworzenie formularza klubowego @teacher @club @validation", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE
   * =====================================================
   */

  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  /*
   * Na początku nie może istnieć żadne potwierdzenie
   * Matematyki.
   */
  const mathConfirmations = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(mathConfirmations).toHaveCount(0);

  /*
   * =====================================================
   * OTWARCIE FORMULARZA
   * =====================================================
   */

  const { form } = await openNewClubForm(page);

  /*
   * Nie zaznaczamy szkoły.
   */

  const schoolRow = form.getByRole("row").filter({
    hasText: s.schoolName,
  });

  await expect(schoolRow).toBeVisible();

  const schoolCheckbox = schoolRow.getByRole("checkbox");

  await expect(schoolCheckbox).not.toBeChecked();

  /*
   * Przycisk Zapisz jest aktywny mimo braku szkoły.
   * To potwierdziliśmy wykonaniem testu.
   */
  const saveButton = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeEnabled();

  /*
   * =====================================================
   * PRÓBA ZAPISU
   * =====================================================
   */

  await saveButton.click();

  /*
   * Niepoprawny formularz nie powinien zostać zapisany,
   * więc główny formularz nadal powinien istnieć.
   */
  await expect(form).toBeVisible();

  await s.record("validationCase", "missing-school");

  /*
   * Nie próbujemy klikać Anuluj.
   *
   * Jeśli aplikacja wyświetla dodatkowy komunikat/modal
   * walidacyjny, mógłby blokować przycisk formularza.
   *
   * Pełne przejście do nauczyciela daje nam czysty stan.
   */
  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * WERYFIKACJA BRAKU REKORDU
   * =====================================================
   */

  const afterSaveAttempt = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(afterSaveAttempt).toHaveCount(0);

  await s.record("clubCreated", "false");
});

test("CLUB-12B: brak klasy blokuje utworzenie formularza klubowego @teacher @club @validation", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE
   * =====================================================
   */

  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  /*
   * Przed próbą zapisu nie ma żadnego formularza
   * Matematyki.
   */
  const mathConfirmations = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(mathConfirmations).toHaveCount(0);

  /*
   * =====================================================
   * OTWARCIE FORMULARZA
   * =====================================================
   */

  const { form } = await openNewClubForm(page);

  /*
   * Wybieramy szkołę.
   */
  await selectSchool(form, s.schoolName);

  /*
   * =====================================================
   * SPRAWDZENIE KLAS
   * =====================================================
   *
   * Matematyka / SP:
   * 4, 5, 6, 7, 8.
   *
   * Żadnej nie zaznaczamy.
   */

  for (const classNumber of ["4", "5", "6", "7", "8"]) {
    const checkbox = ownClass(form, classNumber);

    await expect(checkbox).toBeVisible();

    await expect(checkbox).not.toBeChecked();
  }

  /*
   * Przycisk jest aktywny mimo braku klasy.
   */
  const saveButton = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeEnabled();

  /*
   * =====================================================
   * PRÓBA ZAPISU
   * =====================================================
   */

  await saveButton.click();

  /*
   * Brak klasy powinien zablokować faktyczne zapisanie.
   */
  await expect(form).toBeVisible();

  await s.record("validationCase", "missing-class");

  /*
   * Pełne ponowne wejście zamiast Anuluj.
   * Dzięki temu test nie zależy od tego, czy aplikacja
   * pokazuje dodatkowy modal/komunikat walidacyjny.
   */
  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * WERYFIKACJA BRAKU REKORDU
   * =====================================================
   */

  const afterSaveAttempt = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(afterSaveAttempt).toHaveCount(0);

  await s.record("clubCreated", "false");
});

test("CLUB-13: formularz klubowy poprawnie prezentuje wszystkie OBCE wydawnictwa @teacher @club @publisher", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, { subject: "Język polski" });

  const { form } = await openNewClubForm(page, null);
  await selectClubSubject(page, form, "Język polski");

  await selectSchool(form, s.schoolName);

  /*
   * Czerwona sekcja = obce.
   */
  await foreignClass(form, "5").check();

  await expect(foreignClass(form, "5")).toBeChecked();

  await expect(ownClass(form, "5")).not.toBeChecked();

  await selectForeignPublisher(page, form, REGULAR_FOREIGN_PUBLISHERS[0].option);

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form, "Język polski");

  await s.record("confirmationId", confirmationId);

  for (let index = 0; index < REGULAR_FOREIGN_PUBLISHERS.length; index += 1) {
    const publisher = REGULAR_FOREIGN_PUBLISHERS[index];
    const nextPublisher = REGULAR_FOREIGN_PUBLISHERS[index + 1];

    await test.step(`Zwykłe potwierdzenie: ${publisher.option} → ${publisher.school}`, async () => {
      await s.app.openPanel("teacher", teacherId);
      await expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText(publisher.school);

      const editForm = await openClubEdit(page, confirmationId);
      await expect(foreignClass(editForm, "5")).toBeChecked();
      await expect(ownClass(editForm, "5")).not.toBeChecked();
      await expect(foreignClasses(editForm).getByRole("combobox")).toContainText(publisher.option);

      if (nextPublisher) {
        await selectForeignPublisher(page, editForm, nextPublisher.option);
        await saveClubEdit(editForm);
      } else {
        await cancelClubForm(editForm);
      }
    });
  }

  await s.record("foreignPublishers", JSON.stringify(REGULAR_FOREIGN_PUBLISHERS));
});

// Zachowanie formularza: wartości domyślne, klasy, serie i poziomy szkół.
test("CLUB-14: nowy formularz ma domyślnie wybrany bieżący rok szkolny @teacher @club @defaults", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form, schoolYear } = await openNewClubForm(page);
  const now = new Date();
  const firstYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

  expect(schoolYear).toBe(`${firstYear}/${firstYear + 1}`);
  await expect(form.getByRole("radio", { checked: true })).toHaveCount(1);

  await cancelClubForm(form);
});

test("CLUB-15: formularz pokazuje wszystkie szkoły i przedmioto-poziomy nauczyciela @teacher @club @defaults", async ({
  clubSchools,
  page,
  scenario: s,
}) => {
  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;
  await prepareClubTeacher(page, s, {
    additionalSchoolIds: [secondSchoolId],
    additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
  });

  await s.record("secondSchoolId", secondSchoolId);

  const { form } = await openNewClubForm(page, null);

  await expect(form.getByRole("row").filter({ hasText: s.schoolName })).toBeVisible();
  await expect(form.getByRole("row").filter({ hasText: secondSchoolName })).toBeVisible();

  const subject = form.getByRole("combobox").first();
  await subject.click();
  await expect(page.getByRole("option", { name: "Matematyka", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Fizyka", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await cancelClubForm(form);
});

test("CLUB-16: klasy można wybierać wyłącznie dla zaznaczonej szkoły @teacher @club @school", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);

  await expect(ownClasses(form)).toHaveCount(0);
  await expect(foreignClasses(form)).toHaveCount(0);

  await selectSchool(form, s.schoolName);

  await expect(ownClasses(form)).toHaveCount(1);
  await expect(foreignClasses(form)).toHaveCount(1);
  await expect(ownClass(form, "4")).toBeEnabled();

  await cancelClubForm(form);
});

test("CLUB-17: odznaczenie szkoły usuwa wybrane dla niej klasy @teacher @club @school", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  const school = await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();
  await expect(ownClass(form, "4")).toBeChecked();

  await school.getByRole("checkbox").uncheck();
  await expect(ownClasses(form)).toHaveCount(0);

  await school.getByRole("checkbox").check();
  await expect(ownClass(form, "4")).not.toBeChecked();

  await cancelClubForm(form);
});

test("CLUB-18: standardowa klasa nie może być jednocześnie NASZA i OBCA @teacher @club @classes @validation", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await expect(ownClass(form, "4")).toBeChecked();
  await expect(foreignClass(form, "4")).not.toBeChecked();
  await expect(foreignClass(form, "4")).toBeDisabled();

  await cancelClubForm(form);
});

test("CLUB-19: zaznaczenie klasy OBCEJ blokuje tę samą klasę NASZĄ @teacher @club @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await foreignClass(form, "4").check();

  await expect(foreignClass(form, "4")).toBeChecked();
  await expect(ownClass(form, "4")).not.toBeChecked();
  await expect(ownClass(form, "4")).toBeDisabled();

  await cancelClubForm(form);
});

test("CLUB-20: różne klasy mogą być jednocześnie NASZE i OBCE @teacher @club @classes", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();
  await foreignClass(form, "5").check();

  await expect(ownClass(form, "4")).toBeChecked();
  await expect(foreignClass(form, "5")).toBeChecked();
  await expect(foreignClass(form, "4")).toBeDisabled();
  await expect(ownClass(form, "5")).toBeDisabled();

  await cancelClubForm(form);
});

test("CLUB-21: Fizyka pozwala zaznaczyć dwie NASZE serie tej samej klasy @teacher @club @physics", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s, {
    subject: "Fizyka",
  });

  const { form } = await openNewClubForm(page, "Fizyka");
  await selectSchool(form, s.schoolName);

  await ownClass(form, "7").check();
  await ownClass(form, "7TNŚ").check();

  await expect(ownClass(form, "7")).toBeChecked();
  await expect(ownClass(form, "7TNŚ")).toBeChecked();
  await expect(foreignClass(form, "7")).toBeDisabled();

  await cancelClubForm(form);
});

test("CLUB-22: zaznaczenie wszystkich NASZYCH klas Fizyki obejmuje obie serie @teacher @club @physics", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s, {
    subject: "Fizyka",
  });

  const { form } = await openNewClubForm(page, "Fizyka");
  await selectSchool(form, s.schoolName);

  await ownSelectAll(form).check();

  for (const className of PHYSICS_SP_OWN_CLASSES) {
    await expect(ownClass(form, className)).toBeChecked();
  }

  for (const className of PHYSICS_SP_FOREIGN_CLASSES) {
    await expect(foreignClass(form, className)).toBeDisabled();
  }

  await cancelClubForm(form);
});

test("CLUB-23: Matematyka SŚ pozwala zaznaczyć równocześnie wszystkie klasy NASZE i OBCE @teacher @club @math-secondary", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s, {
    schoolType: "Liceum",
    levelOption: "Szkoła Średnia",
    levelCode: "SŚ",
  });

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownSelectAll(form).check();
  await foreignSelectAll(form).check();

  for (const className of MATH_SECONDARY_OWN_CLASSES) {
    await expect(ownClass(form, className)).toBeChecked();
  }

  for (const className of MATH_SECONDARY_FOREIGN_CLASSES) {
    await expect(foreignClass(form, className)).toBeChecked();
  }

  await cancelClubForm(form);
});

test("CLUB-24: wszystkie klasy Matematyki SŚ są trwałe po ponownym otwarciu @teacher @club @math-secondary", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, {
    schoolType: "Liceum",
    levelOption: "Szkoła Średnia",
    levelCode: "SŚ",
  });

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownSelectAll(form).check();
  await foreignSelectAll(form).check();

  const publisher = await selectForeignPublisher(page, form);
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);
  await s.record("confirmationId", confirmationId);
  await s.record("foreignPublisher", publisher);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const className of MATH_SECONDARY_OWN_CLASSES) {
    await expect(ownClass(editForm, className)).toBeChecked();
  }

  for (const className of MATH_SECONDARY_FOREIGN_CLASSES) {
    await expect(foreignClass(editForm, className)).toBeChecked();
  }

  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText(publisher);
  await cancelClubForm(editForm);
});

test("CLUB-25: Fizyka zapisuje wszystkie NASZE klasy obu serii @teacher @club @physics", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s, {
    subject: "Fizyka",
  });

  const { form } = await openNewClubForm(page, "Fizyka");
  await selectSchool(form, s.schoolName);
  await ownSelectAll(form).check();
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form, "Fizyka");
  await s.record("confirmationId", confirmationId);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const className of PHYSICS_SP_OWN_CLASSES) {
    await expect(ownClass(editForm, className)).toBeChecked();
  }

  await cancelClubForm(editForm);
  await expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText("GWO F+ / TNŚ");
});

// Walidacje zapisu, edycja, wydawnictwa, przedmioty i lata szkolne.
test("CLUB-26: usunięcie wszystkich klas podczas edycji blokuje zapis @teacher @club @edit @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);
  await s.record("confirmationId", confirmationId);

  const editForm = await openClubEdit(page, confirmationId);
  await ownClass(editForm, "4").uncheck();
  await editForm.getByRole("button", { name: "Zapisz", exact: true }).click();

  const warning = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Uwaga", exact: true }),
  });

  await expect(warning).toContainText("Nie można dodać/edytować pustego formularza");
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);
  await expect(editForm).toHaveCount(0);

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await cancelClubForm(verifyForm);
});

test("CLUB-27: istniejące potwierdzenie blokuje duplikat dla tego samego roku, przedmiotu i szkoły @teacher @club @duplicate @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);
  await s.record("confirmationId", confirmationId);

  const { form: duplicateForm } = await openNewClubForm(page);
  await selectSchool(duplicateForm, s.schoolName);
  await ownClass(duplicateForm, "5").check();
  await disableTeacherEmail(duplicateForm);
  await duplicateForm.getByRole("button", { name: "Zapisz", exact: true }).click();

  const warning = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Uwaga", exact: true }),
  });

  await expect(warning).toContainText(
    "Nie można dodać/edytować formularza, ponieważ na ten rok/przedmiot/szkołę istnieje już potwierdzenie.",
  );
  await expect(warning).toContainText(`ID potwierdzenia: ${confirmationId}`);
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await expect(warning).toHaveCount(0);
  if (await duplicateForm.count()) await cancelClubForm(duplicateForm);

  // Po zamknięciu ostrzeżenia aplikacja potrafi przeładować sekcję
  // potwierdzeń. Otwieramy nauczyciela ponownie i sprawdzamy stan trwały,
  // zamiast opierać się na chwilowym stanie tabeli sprzed próby duplikatu.
  await s.app.openPanel("teacher", teacherId);
  await expect(confirmationRow(page, confirmationId)).toHaveCount(1);
});

test("CLUB-28: formularz dla poprzedniego roku szkolnego jest trwały @teacher @club @school-year", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } = await prepareClubTeacher(page, s);

  const { form, schoolYear: currentSchoolYear } = await openNewClubForm(page);
  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;

  await expect(schoolYears(form)).toHaveCount(2);
  await selectSchoolYear(form, previousSchoolYear);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);
  await s.record("confirmationId", confirmationId);
  await s.record("schoolYear", previousSchoolYear);

  await s.app.openPanel("teacher", teacherId);
  await expect(confirmationRow(page, confirmationId)).toContainText(previousSchoolYear);

  const editForm = await openClubEdit(page, confirmationId);
  await expect(s.app.field(editForm, "Rok szkolny")).toHaveValue(previousSchoolYear.slice(0, 4));
  await expect(ownClass(editForm, "4")).toBeChecked();
  await cancelClubForm(editForm);
});

test("CLUB-29: potwierdzenia dla tej samej szkoły i przedmiotu mogą dotyczyć dwóch różnych lat @teacher @club @school-year", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form: previousForm, schoolYear: currentSchoolYear } = await openNewClubForm(page);
  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;

  await selectSchoolYear(previousForm, previousSchoolYear);
  await selectSchool(previousForm, s.schoolName);
  await ownClass(previousForm, "4").check();
  await disableTeacherEmail(previousForm);
  const previousConfirmationId = await saveClubForm(page, previousForm);

  const { form: currentForm, schoolYear } = await openNewClubForm(page);
  expect(schoolYear).toBe(currentSchoolYear);
  await selectSchool(currentForm, s.schoolName);
  await ownClass(currentForm, "5").check();
  await disableTeacherEmail(currentForm);

  await currentForm.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(currentForm).toHaveCount(0);

  const mathRows = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", { name: "Matematyka", exact: true }),
    });

  await expect(mathRows).toHaveCount(2);

  const confirmationIds: string[] = [];
  for (let index = 0; index < (await mathRows.count()); index += 1) {
    confirmationIds.push((await mathRows.nth(index).getByRole("cell").nth(1).innerText()).trim());
  }

  const currentConfirmationId = confirmationIds.find((id) => id !== previousConfirmationId) ?? "";

  expect(currentConfirmationId).toMatch(/^\d+$/);
  await expect(confirmationRow(page, previousConfirmationId)).toContainText(previousSchoolYear);
  await expect(confirmationRow(page, currentConfirmationId)).toContainText(currentSchoolYear);

  await s.record("previousConfirmationId", previousConfirmationId);
  await s.record("currentConfirmationId", currentConfirmationId);
});

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
