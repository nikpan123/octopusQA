import { test, expect } from "./support/club-fixtures";

import {
  MATH_SP_CLASSES,
  cancelClubForm,
  clubHistoryEntry,
  confirmationDetails,
  confirmationRow,
  confirmations,
  disableTeacherEmail,
  openClubEdit,
  openClubHistory,
  openNewClubForm,
  ownClass,
  ownClasses,
  saveClubEdit,
  saveClubForm,
  selectSchool,
} from "./support/club";

// Każdy scenariusz tworzy własnego nauczyciela i własne potwierdzenia.
// Współdzielone szkoły są tylko odczytywane, więc testy CLUB mogą bezpiecznie
// wykorzystywać wszystkie workery mimo globalnego fullyParallel: false.
test.describe.configure({ mode: "parallel" });

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
