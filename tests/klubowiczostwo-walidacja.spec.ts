import { test, expect } from "./support/club-fixtures";

import {
  MATH_SECONDARY_FOREIGN_CLASSES,
  MATH_SECONDARY_OWN_CLASSES,
  PHYSICS_SP_FOREIGN_CLASSES,
  PHYSICS_SP_OWN_CLASSES,
  cancelClubForm,
  confirmDeleteIfShown,
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
  selectClubSubject,
  selectForeignPublisher,
  selectSchool,
  selectSchoolYear,
  teacherSchoolPublisherCell,
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

// Każdy scenariusz tworzy własnego nauczyciela i własne potwierdzenia.
// Współdzielone szkoły są tylko odczytywane, więc testy CLUB mogą bezpiecznie
// wykorzystywać wszystkie workery mimo globalnego fullyParallel: false.
test.describe.configure({ mode: "parallel" });

test("CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia @teacher @club @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await test.step("Przygotowanie: utworzenie szkoły testowej", async () =>
    s.createSchool());
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(schoolId));

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  await cancelClubForm(form);

  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: liczba elementów w widoku — confirmations(page) .getByRole("row") .filter({ has: page.getByRole("cell", { name: "Matematyka", exact: true, }),…; oczekiwane: 0', async () =>
    expect(
      confirmations(page)
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", {
            name: "Matematyka",
            exact: true,
          }),
        }),
    ).toHaveCount(0));
});

test("CLUB-10: anulowanie edycji zachowuje klasę 4 @teacher @club @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await test.step("Przygotowanie: utworzenie szkoły testowej", async () =>
    s.createSchool());
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(schoolId));

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await ownClass(editForm, "4").uncheck();
  await ownClass(editForm, "5").check();

  await test.step('Sprawdzenie: negacja — zaznaczenie opcji — ownClass(editForm, "4")', async () =>
    expect(ownClass(editForm, "4")).not.toBeChecked());
  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(editForm, "5")', async () =>
    expect(ownClass(editForm, "5")).toBeChecked());

  /*
   * Nie zapisujemy.
   */
  await cancelClubForm(editForm);

  await s.app.openPanel("teacher", teacherId);

  const verifyForm = await openClubEdit(page, confirmationId);

  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(verifyForm, "4")', async () =>
    expect(ownClass(verifyForm, "4")).toBeChecked());
  await test.step('Sprawdzenie: negacja — zaznaczenie opcji — ownClass(verifyForm, "5")', async () =>
    expect(ownClass(verifyForm, "5")).not.toBeChecked());

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

  const schoolId = await test.step("Przygotowanie: utworzenie szkoły testowej", async () =>
    s.createSchool());

  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(schoolId));

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

  await test.step("Sprawdzenie: widoczność elementu — class4", async () =>
    expect(class4).toBeVisible());

  await class4.check();

  await test.step("Sprawdzenie: zaznaczenie opcji — class4", async () =>
    expect(class4).toBeChecked());

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

  const schoolId = await test.step("Przygotowanie: utworzenie szkoły testowej", async () =>
    s.createSchool());
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(schoolId));

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

  await test.step("Sprawdzenie: liczba elementów w widoku — mathConfirmations; oczekiwane: 0", async () =>
    expect(mathConfirmations).toHaveCount(0));

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

  await test.step("Sprawdzenie: widoczność elementu — schoolRow", async () =>
    expect(schoolRow).toBeVisible());

  const schoolCheckbox = schoolRow.getByRole("checkbox");

  await test.step("Sprawdzenie: negacja — zaznaczenie opcji — schoolCheckbox", async () =>
    expect(schoolCheckbox).not.toBeChecked());

  /*
   * Przycisk Zapisz jest aktywny mimo braku szkoły.
   * To potwierdziliśmy wykonaniem testu.
   */
  const saveButton = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await test.step("Sprawdzenie: dostępność działania — saveButton", async () =>
    expect(saveButton).toBeEnabled());

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
  await test.step("Sprawdzenie: widoczność elementu — form", async () =>
    expect(form).toBeVisible());

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

  await test.step("Sprawdzenie: liczba elementów w widoku — afterSaveAttempt; oczekiwane: 0", async () =>
    expect(afterSaveAttempt).toHaveCount(0));

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

  const schoolId = await test.step("Przygotowanie: utworzenie szkoły testowej", async () =>
    s.createSchool());
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(schoolId));

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

  await test.step("Sprawdzenie: liczba elementów w widoku — mathConfirmations; oczekiwane: 0", async () =>
    expect(mathConfirmations).toHaveCount(0));

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

    await test.step("Sprawdzenie: widoczność elementu — checkbox", async () =>
      expect(checkbox).toBeVisible());

    await test.step("Sprawdzenie: negacja — zaznaczenie opcji — checkbox", async () =>
      expect(checkbox).not.toBeChecked());
  }

  /*
   * Przycisk jest aktywny mimo braku klasy.
   */
  const saveButton = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await test.step("Sprawdzenie: dostępność działania — saveButton", async () =>
    expect(saveButton).toBeEnabled());

  /*
   * =====================================================
   * PRÓBA ZAPISU
   * =====================================================
   */

  await saveButton.click();

  /*
   * Brak klasy powinien zablokować faktyczne zapisanie.
   */
  await test.step("Sprawdzenie: widoczność elementu — form", async () =>
    expect(form).toBeVisible());

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

  await test.step("Sprawdzenie: liczba elementów w widoku — afterSaveAttempt; oczekiwane: 0", async () =>
    expect(afterSaveAttempt).toHaveCount(0));

  await s.record("clubCreated", "false");
});

test("CLUB-13: formularz klubowy poprawnie prezentuje wszystkie OBCE wydawnictwa @teacher @club @publisher", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } =
    await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
      prepareClubTeacher(page, s, { subject: "Język polski" }));

  const { form } = await openNewClubForm(page, null);
  await selectClubSubject(page, form, "Język polski");

  await selectSchool(form, s.schoolName);

  /*
   * Czerwona sekcja = obce.
   */
  await foreignClass(form, "5").check();

  await test.step('Sprawdzenie: zaznaczenie opcji — foreignClass(form, "5")', async () =>
    expect(foreignClass(form, "5")).toBeChecked());

  await test.step('Sprawdzenie: negacja — zaznaczenie opcji — ownClass(form, "5")', async () =>
    expect(ownClass(form, "5")).not.toBeChecked());

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
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

  const { form, schoolYear } = await openNewClubForm(page);
  const now = new Date();
  const firstYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

  await test.step("Sprawdzenie: zgodność wartości — schoolYear; oczekiwane: `${firstYear}/${firstYear + 1}`", async () => {
    expect(schoolYear).toBe(`${firstYear}/${firstYear + 1}`);
  });
  await test.step('Sprawdzenie: liczba elementów w widoku — form.getByRole("radio", { checked: true }); oczekiwane: 1', async () =>
    expect(form.getByRole("radio", { checked: true })).toHaveCount(1));

  await cancelClubForm(form);
});

test("CLUB-15: formularz pokazuje wszystkie szkoły i przedmioto-poziomy nauczyciela @teacher @club @defaults", async ({
  clubSchools,
  page,
  scenario: s,
}) => {
  const { id: secondSchoolId, name: secondSchoolName } = clubSchools.spB;
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s, {
      additionalSchoolIds: [secondSchoolId],
      additionalSubjectLevels: [{ subject: "Fizyka", level: "Szkoła Podstawowa" }],
    }));

  await s.record("secondSchoolId", secondSchoolId);

  const { form } = await openNewClubForm(page, null);

  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("row").filter({ hasText: s.schoolName })', async () =>
    expect(form.getByRole("row").filter({ hasText: s.schoolName })).toBeVisible());
  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("row").filter({ hasText: secondSchoolName })', async () =>
    expect(form.getByRole("row").filter({ hasText: secondSchoolName })).toBeVisible());

  const subject = form.getByRole("combobox").first();
  await subject.click();
  await test.step('Sprawdzenie: widoczność elementu — page.getByRole("option", { name: "Matematyka", exact: true })', async () =>
    expect(page.getByRole("option", { name: "Matematyka", exact: true })).toBeVisible());
  await test.step('Sprawdzenie: widoczność elementu — page.getByRole("option", { name: "Fizyka", exact: true })', async () =>
    expect(page.getByRole("option", { name: "Fizyka", exact: true })).toBeVisible());
  await page.keyboard.press("Escape");

  await cancelClubForm(form);
});

test("CLUB-16: klasy można wybierać wyłącznie dla zaznaczonej szkoły @teacher @club @school", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

  const { form } = await openNewClubForm(page);

  await test.step("Sprawdzenie: liczba elementów w widoku — ownClasses(form); oczekiwane: 0", async () =>
    expect(ownClasses(form)).toHaveCount(0));
  await test.step("Sprawdzenie: liczba elementów w widoku — foreignClasses(form); oczekiwane: 0", async () =>
    expect(foreignClasses(form)).toHaveCount(0));

  await selectSchool(form, s.schoolName);

  await test.step("Sprawdzenie: liczba elementów w widoku — ownClasses(form); oczekiwane: 1", async () =>
    expect(ownClasses(form)).toHaveCount(1));
  await test.step("Sprawdzenie: liczba elementów w widoku — foreignClasses(form); oczekiwane: 1", async () =>
    expect(foreignClasses(form)).toHaveCount(1));
  await test.step('Sprawdzenie: dostępność działania — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).toBeEnabled());

  await cancelClubForm(form);
});

test("CLUB-17: odznaczenie szkoły usuwa wybrane dla niej klasy @teacher @club @school", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

  const { form } = await openNewClubForm(page);
  const school = await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();
  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).toBeChecked());

  await school.getByRole("checkbox").uncheck();
  await test.step("Sprawdzenie: liczba elementów w widoku — ownClasses(form); oczekiwane: 0", async () =>
    expect(ownClasses(form)).toHaveCount(0));

  await school.getByRole("checkbox").check();
  await test.step('Sprawdzenie: negacja — zaznaczenie opcji — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).not.toBeChecked());

  await cancelClubForm(form);
});

test("CLUB-18: standardowa klasa nie może być jednocześnie NASZA i OBCA @teacher @club @classes @validation", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).toBeChecked());
  await test.step('Sprawdzenie: negacja — zaznaczenie opcji — foreignClass(form, "4")', async () =>
    expect(foreignClass(form, "4")).not.toBeChecked());
  await test.step('Sprawdzenie: zablokowanie działania — foreignClass(form, "4")', async () =>
    expect(foreignClass(form, "4")).toBeDisabled());

  await cancelClubForm(form);
});

test("CLUB-19: zaznaczenie klasy OBCEJ blokuje tę samą klasę NASZĄ @teacher @club @classes", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await foreignClass(form, "4").check();

  await test.step('Sprawdzenie: zaznaczenie opcji — foreignClass(form, "4")', async () =>
    expect(foreignClass(form, "4")).toBeChecked());
  await test.step('Sprawdzenie: negacja — zaznaczenie opcji — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).not.toBeChecked());
  await test.step('Sprawdzenie: zablokowanie działania — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).toBeDisabled());

  await cancelClubForm(form);
});

test("CLUB-20: różne klasy mogą być jednocześnie NASZE i OBCE @teacher @club @classes", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();
  await foreignClass(form, "5").check();

  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(form, "4")', async () =>
    expect(ownClass(form, "4")).toBeChecked());
  await test.step('Sprawdzenie: zaznaczenie opcji — foreignClass(form, "5")', async () =>
    expect(foreignClass(form, "5")).toBeChecked());
  await test.step('Sprawdzenie: zablokowanie działania — foreignClass(form, "4")', async () =>
    expect(foreignClass(form, "4")).toBeDisabled());
  await test.step('Sprawdzenie: zablokowanie działania — ownClass(form, "5")', async () =>
    expect(ownClass(form, "5")).toBeDisabled());

  await cancelClubForm(form);
});

test("CLUB-21: Fizyka pozwala zaznaczyć dwie NASZE serie tej samej klasy @teacher @club @physics", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s, {
      subject: "Fizyka",
    }));

  const { form } = await openNewClubForm(page, "Fizyka");
  await selectSchool(form, s.schoolName);

  await ownClass(form, "7").check();
  await ownClass(form, "7TNŚ").check();

  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(form, "7")', async () =>
    expect(ownClass(form, "7")).toBeChecked());
  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(form, "7TNŚ")', async () =>
    expect(ownClass(form, "7TNŚ")).toBeChecked());
  await test.step('Sprawdzenie: zablokowanie działania — foreignClass(form, "7")', async () =>
    expect(foreignClass(form, "7")).toBeDisabled());

  await cancelClubForm(form);
});

test("CLUB-22: zaznaczenie wszystkich NASZYCH klas Fizyki obejmuje obie serie @teacher @club @physics", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s, {
      subject: "Fizyka",
    }));

  const { form } = await openNewClubForm(page, "Fizyka");
  await selectSchool(form, s.schoolName);

  await ownSelectAll(form).check();

  for (const className of PHYSICS_SP_OWN_CLASSES) {
    await test.step("Sprawdzenie: zaznaczenie opcji — ownClass(form, className)", async () =>
      expect(ownClass(form, className)).toBeChecked());
  }

  for (const className of PHYSICS_SP_FOREIGN_CLASSES) {
    await test.step("Sprawdzenie: zablokowanie działania — foreignClass(form, className)", async () =>
      expect(foreignClass(form, className)).toBeDisabled());
  }

  await cancelClubForm(form);
});

test("CLUB-23: Matematyka SŚ pozwala zaznaczyć równocześnie wszystkie klasy NASZE i OBCE @teacher @club @math-secondary", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s, {
      schoolType: "Liceum",
      levelOption: "Szkoła Średnia",
      levelCode: "SŚ",
    }));

  const { form } = await openNewClubForm(page);
  await selectSchool(form, s.schoolName);

  await ownSelectAll(form).check();
  await foreignSelectAll(form).check();

  for (const className of MATH_SECONDARY_OWN_CLASSES) {
    await test.step("Sprawdzenie: zaznaczenie opcji — ownClass(form, className)", async () =>
      expect(ownClass(form, className)).toBeChecked());
  }

  for (const className of MATH_SECONDARY_FOREIGN_CLASSES) {
    await test.step("Sprawdzenie: zaznaczenie opcji — foreignClass(form, className)", async () =>
      expect(foreignClass(form, className)).toBeChecked());
  }

  await cancelClubForm(form);
});

test("CLUB-24: wszystkie klasy Matematyki SŚ są trwałe po ponownym otwarciu @teacher @club @math-secondary", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } =
    await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
      prepareClubTeacher(page, s, {
        schoolType: "Liceum",
        levelOption: "Szkoła Średnia",
        levelCode: "SŚ",
      }));

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
    await test.step("Sprawdzenie: zaznaczenie opcji — ownClass(editForm, className)", async () =>
      expect(ownClass(editForm, className)).toBeChecked());
  }

  for (const className of MATH_SECONDARY_FOREIGN_CLASSES) {
    await test.step("Sprawdzenie: zaznaczenie opcji — foreignClass(editForm, className)", async () =>
      expect(foreignClass(editForm, className)).toBeChecked());
  }

  await test.step('Sprawdzenie: obecność tekstu w widoku — foreignClasses(editForm).getByRole("combobox"); oczekiwane: publisher', async () =>
    expect(foreignClasses(editForm).getByRole("combobox")).toContainText(publisher));
  await cancelClubForm(editForm);
});

test("CLUB-25: Fizyka zapisuje wszystkie NASZE klasy obu serii @teacher @club @physics", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } =
    await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
      prepareClubTeacher(page, s, {
        subject: "Fizyka",
      }));

  const { form } = await openNewClubForm(page, "Fizyka");
  await selectSchool(form, s.schoolName);
  await ownSelectAll(form).check();
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form, "Fizyka");
  await s.record("confirmationId", confirmationId);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const className of PHYSICS_SP_OWN_CLASSES) {
    await test.step("Sprawdzenie: zaznaczenie opcji — ownClass(editForm, className)", async () =>
      expect(ownClass(editForm, className)).toBeChecked());
  }

  await cancelClubForm(editForm);
  await test.step('Sprawdzenie: tekst w widoku — teacherSchoolPublisherCell(page, s.schoolName); oczekiwane: "GWO F+ / TNŚ"', async () =>
    expect(teacherSchoolPublisherCell(page, s.schoolName)).toHaveText("GWO F+ / TNŚ"));
});

// Walidacje zapisu, edycja, wydawnictwa, przedmioty i lata szkolne.
test("CLUB-26: usunięcie wszystkich klas podczas edycji blokuje zapis @teacher @club @edit @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } =
    await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
      prepareClubTeacher(page, s));

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

  await test.step('Sprawdzenie: obecność tekstu w widoku — warning; oczekiwane: "Nie można dodać/edytować pustego formularza"', async () =>
    expect(warning).toContainText("Nie można dodać/edytować pustego formularza"));
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await test.step("Sprawdzenie: liczba elementów w widoku — warning; oczekiwane: 0", async () =>
    expect(warning).toHaveCount(0));
  await test.step("Sprawdzenie: liczba elementów w widoku — editForm; oczekiwane: 0", async () =>
    expect(editForm).toHaveCount(0));

  await s.app.openPanel("teacher", teacherId);
  const verifyForm = await openClubEdit(page, confirmationId);
  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(verifyForm, "4")', async () =>
    expect(ownClass(verifyForm, "4")).toBeChecked());
  await cancelClubForm(verifyForm);
});

test("CLUB-27: istniejące potwierdzenie blokuje duplikat dla tego samego roku, przedmiotu i szkoły @teacher @club @duplicate @validation", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } =
    await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
      prepareClubTeacher(page, s));

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

  await test.step('Sprawdzenie: obecność tekstu w widoku — warning; oczekiwane: "Nie można dodać/edytować formularza, ponieważ na ten rok/przedmiot/szkołę istnieje już potwierdzenie."', async () =>
    expect(warning).toContainText(
      "Nie można dodać/edytować formularza, ponieważ na ten rok/przedmiot/szkołę istnieje już potwierdzenie.",
    ));
  await test.step("Sprawdzenie: obecność tekstu w widoku — warning; oczekiwane: `ID potwierdzenia: ${confirmationId}`", async () =>
    expect(warning).toContainText(`ID potwierdzenia: ${confirmationId}`));
  await warning.getByRole("button", { name: "OK", exact: true }).click();
  await test.step("Sprawdzenie: liczba elementów w widoku — warning; oczekiwane: 0", async () =>
    expect(warning).toHaveCount(0));
  if (await duplicateForm.count()) await cancelClubForm(duplicateForm);

  // Po zamknięciu ostrzeżenia aplikacja potrafi przeładować sekcję
  // potwierdzeń. Otwieramy nauczyciela ponownie i sprawdzamy stan trwały,
  // zamiast opierać się na chwilowym stanie tabeli sprzed próby duplikatu.
  await s.app.openPanel("teacher", teacherId);
  await test.step("Sprawdzenie: liczba elementów w widoku — confirmationRow(page, confirmationId); oczekiwane: 1", async () =>
    expect(confirmationRow(page, confirmationId)).toHaveCount(1));
});

test("CLUB-28: formularz dla poprzedniego roku szkolnego jest trwały @teacher @club @school-year", async ({
  page,
  scenario: s,
}) => {
  const { teacherId } =
    await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
      prepareClubTeacher(page, s));

  const { form, schoolYear: currentSchoolYear } = await openNewClubForm(page);
  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;

  await test.step("Sprawdzenie: liczba elementów w widoku — schoolYears(form); oczekiwane: 2", async () =>
    expect(schoolYears(form)).toHaveCount(2));
  await selectSchoolYear(form, previousSchoolYear);
  await selectSchool(form, s.schoolName);
  await ownClass(form, "4").check();
  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);
  await s.record("confirmationId", confirmationId);
  await s.record("schoolYear", previousSchoolYear);

  await s.app.openPanel("teacher", teacherId);
  await test.step("Sprawdzenie: obecność tekstu w widoku — confirmationRow(page, confirmationId); oczekiwane: previousSchoolYear", async () =>
    expect(confirmationRow(page, confirmationId)).toContainText(previousSchoolYear));

  const editForm = await openClubEdit(page, confirmationId);
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.field(editForm, "Rok szkolny"); oczekiwane: previousSchoolYear.slice(0, 4)', async () =>
    expect(s.app.field(editForm, "Rok szkolny")).toHaveValue(previousSchoolYear.slice(0, 4)));
  await test.step('Sprawdzenie: zaznaczenie opcji — ownClass(editForm, "4")', async () =>
    expect(ownClass(editForm, "4")).toBeChecked());
  await cancelClubForm(editForm);
});

test("CLUB-29: potwierdzenia dla tej samej szkoły i przedmiotu mogą dotyczyć dwóch różnych lat @teacher @club @school-year", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: nauczyciel i szkoły do potwierdzeń klubowych", async () =>
    prepareClubTeacher(page, s));

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
  await test.step("Sprawdzenie: zgodność wartości — schoolYear; oczekiwane: currentSchoolYear", async () => {
    expect(schoolYear).toBe(currentSchoolYear);
  });
  await selectSchool(currentForm, s.schoolName);
  await ownClass(currentForm, "5").check();
  await disableTeacherEmail(currentForm);

  await currentForm.getByRole("button", { name: "Zapisz", exact: true }).click();
  await test.step("Sprawdzenie: liczba elementów w widoku — currentForm; oczekiwane: 0", async () =>
    expect(currentForm).toHaveCount(0));

  const mathRows = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", { name: "Matematyka", exact: true }),
    });

  await test.step("Sprawdzenie: liczba elementów w widoku — mathRows; oczekiwane: 2", async () =>
    expect(mathRows).toHaveCount(2));

  const confirmationIds: string[] = [];
  for (let index = 0; index < (await mathRows.count()); index += 1) {
    confirmationIds.push((await mathRows.nth(index).getByRole("cell").nth(1).innerText()).trim());
  }

  const currentConfirmationId = confirmationIds.find((id) => id !== previousConfirmationId) ?? "";

  await test.step("Sprawdzenie: zgodność ze wzorcem — currentConfirmationId; oczekiwane: /^\\d+$/", async () => {
    expect(currentConfirmationId).toMatch(/^\d+$/);
  });
  await test.step("Sprawdzenie: obecność tekstu w widoku — confirmationRow(page, previousConfirmationId); oczekiwane: previousSchoolYear", async () =>
    expect(confirmationRow(page, previousConfirmationId)).toContainText(previousSchoolYear));
  await test.step("Sprawdzenie: obecność tekstu w widoku — confirmationRow(page, currentConfirmationId); oczekiwane: currentSchoolYear", async () =>
    expect(confirmationRow(page, currentConfirmationId)).toContainText(currentSchoolYear));

  await s.record("previousConfirmationId", previousConfirmationId);
  await s.record("currentConfirmationId", currentConfirmationId);
});
