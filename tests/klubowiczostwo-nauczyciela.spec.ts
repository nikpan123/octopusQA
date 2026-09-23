import { test, expect } from "./support/club-fixtures";
import {
  MATH_SECONDARY_FOREIGN_CLASSES,
  MATH_SECONDARY_OWN_CLASSES,
  MATH_SP_CLASSES,
  PHYSICS_SP_FOREIGN_CLASSES,
  PHYSICS_SP_OWN_CLASSES,
  addMathSp,
  addTeacherSubjectLevel,
  cancelClubForm,
  confirmDeleteIfShown,
  confirmationDetails,
  confirmationRow,
  confirmations,
  disableTeacherEmail,
  foreignClass,
  foreignClasses,
  foreignSelectAll,
  openClubEdit,
  openNewClubForm,
  ownClass,
  ownClasses,
  ownSelectAll,
  saveClubEdit,
  saveClubForm,
  schoolYears,
  selectForeignPublisher,
  selectSchool,
  selectSchoolYear,
} from "./support/club";
import { prepareClubTeacher } from "./support/club-scenario";

test("CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);
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
});

test("CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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
});

test("CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  const teacherId = await s.createTeacher(firstSchoolId);

  await s.app.attachSchool(page.locator("body"), secondSchoolId, secondSchoolName);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  const teacherId = await s.createTeacher(firstSchoolId, firstSchoolName);

  /*
   * Dodajemy drugą szkołę.
   */
  await s.app.attachSchool(page.locator("body"), secondSchoolId, secondSchoolName);

  /*
   * =====================================================
   * MATEMATYKA / SP
   * =====================================================
   */

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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
  await addMathSp(page);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

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

test("CLUB-13: formularz klubowy zachowuje klasę obcą i wydawnictwo @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  /*
   * Czerwona sekcja = obce.
   */
  await foreignClass(form, "4").check();

  await expect(foreignClass(form, "4")).toBeChecked();

  await expect(ownClass(form, "4")).not.toBeChecked();

  const foreign = foreignClasses(form);

  const publisher = foreign.getByRole("combobox");

  await publisher.click();

  const option = page
    .getByRole("option")
    .filter({
      hasNotText: /^wybierz$/i,
    })
    .first();

  await expect(option).toBeVisible();

  const publisherName = (await option.innerText()).trim();

  expect(publisherName).not.toBe("");

  await option.click();

  await s.record("foreignPublisher", publisherName);

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);

  /*
   * Pełne ponowne wejście.
   */
  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await expect(foreignClass(editForm, "4")).toBeChecked();

  await expect(ownClass(editForm, "4")).not.toBeChecked();

  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText(publisherName);

  await cancelClubForm(editForm);
});

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
  const { teacherId } = await prepareClubTeacher(page, s);

  await addTeacherSubjectLevel(page, "Fizyka", "Szkoła Podstawowa", "SP");

  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;

  await s.record("secondSchoolId", secondSchoolId);
  await s.app.openPanel("teacher", teacherId);
  await s.app.attachSchool(page.locator("body"), secondSchoolId, secondSchoolName);

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
});

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
  await prepareClubTeacher(page, s);

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
