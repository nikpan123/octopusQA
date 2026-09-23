import { test, expect } from "./support/shared-school";

import { typeValue } from "./support/octopus";

import {
  addTeacherNote,
  archiveTeacherNote,
  cancelTeacherDialog,
  cancelTeacherNotesEdit,
  cancelTeacherPhoneDelete,
  cancelTeacherRodoEdit,
  confirmTeacherEmailDelete,
  confirmTeacherMarketingWarning,
  confirmTeacherMinimalRecordWarning,
  confirmTeacherNoConsentWarning,
  confirmTeacherPhoneDelete,
  deleteTeacherPrivateAddress,
  expectSavedTeacherPhone,
  expectSavedTeacherPhones,
  expectTeacherHistoryChange,
  expectTeacherHistorySnapshot,
  expectTeacherMarketingWarning,
  expectTeacherNoConsentWarning,
  expectTeacherNoteMissing,
  expectTeacherPhoneHistoryChange,
  expectTeacherPhoneHistoryMissing,
  expectTeacherPhoneNotSaved,
  expectTeacherPrivateAddressHistoryChange,
  expectTeacherRodoHistoryChange,
  expectTeacherRodoOnCard,
  fillTeacherPrivateAddress,
  getSavedTeacherPhones,
  normalizeTeacherName,
  openBasicTeacherEdit,
  openTeacherEmailDeleteConfirmation,
  openTeacherEmailEdit,
  openTeacherHistory,
  openTeacherMinimalRecordWarning,
  cancelTeacherMinimalRecordWarning,
  openTeacherNotesEdit,
  openTeacherPhoneDeleteConfirmation,
  openTeacherPrivateAddressEdit,
  openTeacherRodoEdit,
  saveBasicTeacherEdit,
  saveTeacherDialog,
  saveTeacherNotesEdit,
  saveTeacherPrivateAddress,
  saveTeacherRodoEdit,
  setTeacherRodoConsent,
  teacherBirthDateInput,
  teacherHistorySnapshot,
  teacherNewPhoneInput,
  teacherNoteInput,
  teacherNoteRow,
  teacherNoteRows,
  teacherNotesInput,
  teacherPhoneAddButton,
  teacherPhoneDeleteButtons,
  teacherRodoCheckbox,
  teacherRodoSourceSelect,
} from "./support/teacher-edit";

/*
 * =========================================================
 * EDIT-04
 * ZMIANA IMIENIA
 * =========================================================
 */

test("EDIT-04: zmiana imienia jest trwała i widoczna w historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const newFirstName = "Adam";

  /*
   * Nazwisko zostanie znormalizowane
   * podczas zapisu formularza.
   */
  const expectedLastName = normalizeTeacherName(s.id);

  const form = await openBasicTeacherEdit(page, s.app);

  await expect(form.locator("#firstName")).toHaveValue("Testowy");

  await typeValue(form.locator("#firstName"), newFirstName);

  await saveBasicTeacherEdit(form);

  /*
   * Od razu po zapisie.
   */
  await expect(s.app.detail("firstName")).toHaveValue(newFirstName);

  /*
   * Ponowne otwarcie.
   */
  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(newFirstName);

  /*
   * Nazwisko zostało automatycznie
   * znormalizowane przez Octopusa.
   */
  await expect(s.app.detail("lastName")).toHaveValue(expectedLastName);

  /*
   * E-mail pozostaje bez zmian.
   */
  await expect(s.app.detail("email")).toHaveValue(s.email);

  /*
   * Relacja ze szkołą pozostaje.
   */
  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  /*
   * Historia zmiany imienia.
   */
  await expectTeacherHistoryChange(page, "Imię", newFirstName);
});

/*
 * =========================================================
 * EDIT-05
 * ZMIANA NAZWISKA
 * =========================================================
 */

test("EDIT-05: zmiana nazwiska jest trwała i widoczna w historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const inputLastName = "Nowak";

  const expectedLastName = normalizeTeacherName(inputLastName);

  const form = await openBasicTeacherEdit(page, s.app);

  await expect(form.locator("#lastName")).toHaveValue(s.id);

  await typeValue(form.locator("#lastName"), inputLastName);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("lastName")).toHaveValue(expectedLastName);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expectTeacherHistoryChange(page, "Nazwisko", expectedLastName);
});

/*
 * =========================================================
 * EDIT-06
 * IMIĘ + NAZWISKO
 * =========================================================
 */

test("EDIT-06: jednoczesna zmiana imienia i nazwiska zapisuje oba pola @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const inputFirstName = "Adam";

  const inputLastName = "Nowak";

  const expectedFirstName = normalizeTeacherName(inputFirstName);

  const expectedLastName = normalizeTeacherName(inputLastName);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), inputFirstName);

  await typeValue(form.locator("#lastName"), inputLastName);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(expectedFirstName);

  await expect(s.app.detail("lastName")).toHaveValue(expectedLastName);

  await expectTeacherHistoryChange(page, "Imię", expectedFirstName);

  /*
   * Ponowne wejście,
   * żeby wrócić z historii
   * do standardowego panelu.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectTeacherHistoryChange(page, "Nazwisko", expectedLastName);
});

/*
 * =========================================================
 * EDIT-07
 * NORMALIZACJA IMIENIA
 * =========================================================
 */

test("EDIT-07: wielkość liter imienia jest normalizowana @teacher @edit @normalization", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const input = "BoŻeNa";

  const expected = normalizeTeacherName(input);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), input);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(expected);

  /*
   * Nazwisko również może zostać
   * znormalizowane przy tym samym zapisie.
   */
  await expect(s.app.detail("lastName")).toHaveValue(normalizeTeacherName(s.id));
});

/*
 * =========================================================
 * EDIT-08
 * NORMALIZACJA NAZWISKA
 * =========================================================
 */

test("EDIT-08: wielkość liter nazwiska jest normalizowana @teacher @edit @normalization", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const input = "nOWAK";

  const expected = normalizeTeacherName(input);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#lastName"), input);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("lastName")).toHaveValue(expected);
});

/*
 * =========================================================
 * EDIT-09
 * NAZWISKO Z ŁĄCZNIKIEM
 * =========================================================
 */

test("EDIT-09: nazwisko z łącznikiem można zapisać @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const lastName = "Nowak-Kowalska";

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#lastName"), lastName);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Nie narzucamy jeszcze sposobu
   * kapitalizacji nazwiska złożonego.
   *
   * Dokumentacja tego nie potwierdza.
   * Sprawdzamy wartość bez rozróżniania
   * wielkości liter.
   */
  await expect(s.app.detail("lastName")).toHaveValue(/^nowak-kowalska$/i);
});

/*
 * =========================================================
 * EDIT-10
 * PUSTE IMIĘ
 * =========================================================
 */

test("EDIT-10: puste imię blokuje zapis @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const form = await openBasicTeacherEdit(page, s.app);

  const firstName = form.locator("#firstName");

  await firstName.fill("");
  await firstName.press("Tab");

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toBeVisible();

  await cancelTeacherDialog(form);

  /*
   * Anulowaliśmy formularz,
   * więc normalizacja nie powinna
   * zostać zapisana.
   */
  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);
});

/*
 * =========================================================
 * EDIT-11
 * PUSTE NAZWISKO
 * =========================================================
 */

test("EDIT-11: puste nazwisko blokuje zapis @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const form = await openBasicTeacherEdit(page, s.app);

  const lastName = form.locator("#lastName");

  await lastName.fill("");
  await lastName.press("Tab");

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toBeVisible();

  await cancelTeacherDialog(form);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Nie było poprawnego zapisu,
   * więc nazwisko powinno zostać
   * takie jak przed edycją.
   */
  await expect(s.app.detail("lastName")).toHaveValue(s.id);
});

/*
 * =========================================================
 * EDIT-12
 * POPRAWNY E-MAIL
 * =========================================================
 */

test("EDIT-12: poprawny e-mail można zmienić i zmiana jest widoczna w historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const oldEmail = s.email;

  const newEmail = `edited_${s.email}`;

  /*
   * =====================================================
   * STAN POCZĄTKOWY
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue(oldEmail);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  /*
   * =====================================================
   * OTWARCIE EDYCJI E-MAILA
   * =====================================================
   */

  const dialog = await openTeacherEmailEdit(page);

  await expect(
    dialog.getByText("Stary adres", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    dialog.getByText("Nowy adres", {
      exact: true,
    }),
  ).toBeVisible();

  /*
   * =====================================================
   * POLA E-MAIL
   * =====================================================
   */

  const inputs = dialog.locator('input:not([type="checkbox"])');

  await expect(inputs).toHaveCount(2);

  const oldEmailInput = inputs.nth(0);

  const newEmailInput = inputs.nth(1);

  /*
   * Stary adres.
   */
  await expect(oldEmailInput).toHaveValue(oldEmail);

  /*
   * Nowy adres.
   */
  await expect(newEmailInput).toBeEnabled();

  await expect(newEmailInput).toHaveValue("");

  /*
   * =====================================================
   * WPROWADZENIE NOWEGO E-MAILA
   * =====================================================
   */

  await typeValue(newEmailInput, newEmail);

  await expect(newEmailInput).toHaveValue(newEmail);

  /*
   * =====================================================
   * ZAPIS
   * =====================================================
   */

  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeVisible();

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await expect(dialog).toHaveCount(0);

  /*
   * =====================================================
   * WERYFIKACJA OD RAZU PO ZAPISIE
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue(newEmail);

  /*
   * =====================================================
   * WERYFIKACJA PO PONOWNYM OTWARCIU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue(newEmail);

  /*
   * Edycja e-maila jest osobną operacją.
   * Dane podstawowe nie powinny się zmienić.
   */

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  /*
   * Relacja ze szkołą pozostaje.
   */

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  /*
   * =====================================================
   * HISTORIA ZMIAN
   * =====================================================
   *
   * Na podstawie faktycznego UI:
   *
   * Pole: Email
   * Wartość: nowy adres
   * Autor: użytkownik wykonujący zmianę
   * Źródło: Edycja danych
   * Data: YYYY-MM-DD HH:mm
   */

  await expectTeacherHistoryChange(page, "Email", newEmail);

  /*
   * =====================================================
   * DANE SCENARIUSZA
   * =====================================================
   */

  await s.record("oldEmail", oldEmail);

  await s.record("editedEmail", newEmail);

  await s.record("teacherEmail", newEmail);

  await s.record("teacherLastName", s.id);
});

/*
 * =========================================================
 * EDIT-13
 * NIEPOPRAWNY E-MAIL
 * =========================================================
 */

test("EDIT-13: niepoprawny e-mail blokuje zapis @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const oldEmail = s.email;

  /*
   * =====================================================
   * STAN POCZĄTKOWY
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue(oldEmail);

  /*
   * =====================================================
   * OTWARCIE EDYCJI E-MAILA
   * =====================================================
   */

  const dialog = await openTeacherEmailEdit(page);

  await expect(dialog).toBeVisible();

  await expect(
    dialog.getByText("Stary adres", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    dialog.getByText("Nowy adres", {
      exact: true,
    }),
  ).toBeVisible();

  /*
   * =====================================================
   * POLA
   * =====================================================
   */

  const inputs = dialog.locator('input:not([type="checkbox"])');

  await expect(inputs).toHaveCount(2);

  const oldEmailInput = inputs.nth(0);

  const newEmailInput = inputs.nth(1);

  /*
   * Stary adres.
   */
  await expect(oldEmailInput).toHaveValue(oldEmail);

  /*
   * Nowy adres początkowo pusty.
   */
  await expect(newEmailInput).toBeEnabled();

  await expect(newEmailInput).toHaveValue("");

  /*
   * =====================================================
   * NIEPOPRAWNY E-MAIL
   * =====================================================
   */

  await newEmailInput.fill("invalid-email");

  await newEmailInput.press("Tab");

  await expect(newEmailInput).toHaveValue("invalid-email");

  /*
   * Angular oznacza pole jako niepoprawne.
   */
  await expect(newEmailInput).toHaveAttribute("aria-invalid", "true");

  /*
   * =====================================================
   * PRÓBA ZAPISU
   * =====================================================
   */

  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeVisible();

  await saveButton.click();

  /*
   * Niepoprawna wartość nie może zamknąć dialogu.
   */
  await expect(dialog).toBeVisible();

  /*
   * Pole nadal ma być oznaczone jako błędne.
   */
  await expect(newEmailInput).toHaveAttribute("aria-invalid", "true");

  /*
   * =====================================================
   * ANULOWANIE
   * =====================================================
   */

  await cancelTeacherDialog(dialog);

  /*
   * =====================================================
   * WERYFIKACJA PO PONOWNYM OTWARCIU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * Niepoprawny e-mail nie został zapisany.
   */
  await expect(s.app.detail("email")).toHaveValue(oldEmail);

  /*
   * Pozostałe dane również bez zmian.
   */
  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  /*
   * Relacja ze szkołą pozostaje.
   */
  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  await s.record("invalidEmail", "invalid-email");

  await s.record("emailAfterFailedEdit", oldEmail);
});

/*
 * =========================================================
 * EDIT-14
 * DODANIE TELEFONU
 * =========================================================
 */

test("EDIT-14: poprawny telefon można dodać @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const phone = "500500500";

  /*
   * =====================================================
   * STAN POCZĄTKOWY
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expectTeacherPhoneNotSaved(page, phone);

  /*
   * =====================================================
   * WPISANIE TELEFONU
   * =====================================================
   */

  const newPhoneInput = teacherNewPhoneInput(page);

  await expect(newPhoneInput).toBeVisible();

  await expect(newPhoneInput).toBeEnabled();

  await newPhoneInput.fill(phone);

  await newPhoneInput.press("Tab");

  /*
   * Sprawdzamy tylko, że wpisanie numeru
   * faktycznie zmieniło wartość pola.
   *
   * Nie uzależniamy testu od sposobu
   * formatowania maski.
   */
  const typedValue = await newPhoneInput.inputValue();

  expect(typedValue.replace(/\D/g, "")).toBe(phone);

  /*
   * =====================================================
   * DODANIE
   * =====================================================
   */

  const addButton = teacherPhoneAddButton(page);

  await expect(addButton).toBeVisible();

  await expect(addButton).toBeEnabled();

  await addButton.click();

  /*
   * =====================================================
   * WERYFIKACJA PO DODANIU
   * =====================================================
   *
   * Nie interesuje nas już:
   *
   * - czy numer jest w pierwszym inpucie,
   * - czy jest w drugim,
   * - czy input jest disabled,
   * - czy ma value jako HTML attribute,
   * - czy numer posiada spacje.
   *
   * Sprawdzamy rzeczywistą wartość inputów.
   */
  await expectSavedTeacherPhone(page, phone);

  /*
   * =====================================================
   * PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * Telefon nadal musi istnieć
   * po ponownym pobraniu danych.
   */
  await expectSavedTeacherPhone(page, phone);

  /*
   * =====================================================
   * POZOSTAŁE DANE
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  await s.record("addedPhone", phone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", phone);
});

test("EDIT-15: można dodać drugi numer telefonu @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const firstPhone = "500500500";

  const secondPhone = "444444444";

  /*
   * Pierwszy numer.
   */
  let newPhoneInput = teacherNewPhoneInput(page);

  await newPhoneInput.fill(firstPhone);

  await newPhoneInput.press("Tab");

  let addButton = teacherPhoneAddButton(page);

  await expect(addButton).toBeEnabled();

  await addButton.click();

  await expectSavedTeacherPhones(page, [firstPhone]);

  /*
   * Drugi numer.
   */
  newPhoneInput = teacherNewPhoneInput(page);

  await expect(newPhoneInput).toBeEnabled();

  await newPhoneInput.fill(secondPhone);

  await newPhoneInput.press("Tab");

  addButton = teacherPhoneAddButton(page);

  await expect(addButton).toBeEnabled();

  await addButton.click();

  /*
   * Powinny istnieć dwa numery.
   */
  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * Ponowne otwarcie — oba numery
   * muszą być trwałe.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  await s.record("firstPhone", firstPhone);

  await s.record("secondPhone", secondPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", firstPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", secondPhone);
});

test("EDIT-16: przy dwóch telefonach nie można dodać trzeciego @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  await s.createTeacher(school.id, school.name);

  const firstPhone = "500500500";

  const secondPhone = "444444444";

  const thirdPhone = "324322342";

  /*
   * =====================================================
   * PIERWSZY TELEFON
   * =====================================================
   */

  let input = teacherNewPhoneInput(page);

  await input.fill(firstPhone);

  await input.press("Tab");

  let addButton = teacherPhoneAddButton(page);

  await expect(addButton).toBeEnabled();

  await addButton.click();

  /*
   * =====================================================
   * DRUGI TELEFON
   * =====================================================
   */

  input = teacherNewPhoneInput(page);

  await input.fill(secondPhone);

  await input.press("Tab");

  addButton = teacherPhoneAddButton(page);

  await expect(addButton).toBeEnabled();

  await addButton.click();

  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * Trzeci numer wpisujemy do pola,
   * ale nie powinien dać się zapisać.
   */
  input = teacherNewPhoneInput(page);

  await input.fill(thirdPhone);

  await input.press("Tab");

  const inputValue = await input.inputValue();

  expect(inputValue.replace(/\D/g, "")).toBe(thirdPhone);

  addButton = teacherPhoneAddButton(page);

  /*
   * Limit dwóch numerów został osiągnięty.
   */
  await expect(addButton).toBeDisabled();

  /*
   * Nadal zapisane są tylko dwa numery.
   *
   * Trzeci numer jest jedynie wpisany
   * w prawym polu.
   */
  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * Trzeci numer NIE został zapisany.
   */
  await expectTeacherPhoneNotSaved(page, thirdPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", firstPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", secondPhone);

  await expectTeacherPhoneHistoryMissing(page, "Dodany numer", thirdPhone);
});

test("EDIT-17: można usunąć zapisany numer telefonu @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const firstPhone = "500500500";
  const secondPhone = "444444444";
  const thirdPhone = "324322342";

  /*
   * =====================================================
   * DODANIE PIERWSZEGO NUMERU
   * =====================================================
   */

  let input = teacherNewPhoneInput(page);

  await input.fill(firstPhone);
  await input.press("Tab");

  await expect(teacherPhoneAddButton(page)).toBeEnabled();

  await teacherPhoneAddButton(page).click();

  /*
   * =====================================================
   * DODANIE DRUGIEGO NUMERU
   * =====================================================
   */

  input = teacherNewPhoneInput(page);

  await input.fill(secondPhone);
  await input.press("Tab");

  await expect(teacherPhoneAddButton(page)).toBeEnabled();

  await teacherPhoneAddButton(page).click();

  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * =====================================================
   * USUNIĘCIE PIERWSZEGO NUMERU
   * =====================================================
   */

  const deleteButtons = teacherPhoneDeleteButtons(page);

  await expect(deleteButtons).toHaveCount(2);

  /*
   * Helper sam klika ikonę kosza
   * i zwraca dialog potwierdzenia.
   */
  const deleteDialog = await openTeacherPhoneDeleteConfirmation(page, 0);

  await confirmTeacherPhoneDelete(deleteDialog);

  /*
   * Pierwszy numer został usunięty,
   * drugi nadal istnieje.
   */
  await expectSavedTeacherPhones(page, [secondPhone]);

  await expectTeacherPhoneNotSaved(page, firstPhone);

  /*
   * =====================================================
   * DODANIE NOWEGO NUMERU PO USUNIĘCIU
   * =====================================================
   */

  input = teacherNewPhoneInput(page);

  await input.fill(thirdPhone);
  await input.press("Tab");

  /*
   * Po usunięciu jednego numeru
   * powinno ponownie zwolnić się miejsce.
   */
  await expect(teacherPhoneAddButton(page)).toBeEnabled();

  await teacherPhoneAddButton(page).click();

  /*
   * Powinny być zapisane:
   *
   * 444-444-444
   * 324-322-342
   */
  await expectSavedTeacherPhones(page, [secondPhone, thirdPhone]);

  /*
   * =====================================================
   * TRWAŁOŚĆ ZMIAN
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expectSavedTeacherPhones(page, [secondPhone, thirdPhone]);

  await expectTeacherPhoneNotSaved(page, firstPhone);

  /*
   * =====================================================
   * HISTORIA ZMIAN
   * =====================================================
   */

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", firstPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", secondPhone);

  await expectTeacherPhoneHistoryChange(page, "Usunięty numer", firstPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", thirdPhone);

  /*
   * =====================================================
   * POZOSTAŁE DANE
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  await s.record("removedPhone", firstPhone);

  await s.record("remainingPhone", secondPhone);

  await s.record("addedAfterDeletePhone", thirdPhone);
});

test("EDIT-18: anulowanie usunięcia telefonu nie zmienia danych @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const firstPhone = "500500500";

  const secondPhone = "444444444";

  /*
   * =====================================================
   * DODANIE PIERWSZEGO TELEFONU
   * =====================================================
   */

  let input = teacherNewPhoneInput(page);

  await input.fill(firstPhone);

  await input.press("Tab");

  await expect(teacherPhoneAddButton(page)).toBeEnabled();

  await teacherPhoneAddButton(page).click();

  /*
   * =====================================================
   * DODANIE DRUGIEGO TELEFONU
   * =====================================================
   */

  input = teacherNewPhoneInput(page);

  await input.fill(secondPhone);

  await input.press("Tab");

  await expect(teacherPhoneAddButton(page)).toBeEnabled();

  await teacherPhoneAddButton(page).click();

  /*
   * Oba numery są zapisane.
   */
  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * =====================================================
   * PRÓBA USUNIĘCIA PIERWSZEGO NUMERU
   * =====================================================
   */

  const deleteDialog = await openTeacherPhoneDeleteConfirmation(page, 0);

  /*
   * Zamiast "Tak" klikamy "Nie".
   */
  await cancelTeacherPhoneDelete(deleteDialog);

  /*
   * =====================================================
   * WERYFIKACJA
   * =====================================================
   *
   * Nic nie powinno się zmienić.
   */

  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * Oba numery nadal istnieją.
   */
  await expectSavedTeacherPhone(page, firstPhone);

  await expectSavedTeacherPhone(page, secondPhone);

  /*
   * =====================================================
   * PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   *
   * Sprawdzamy trwałość stanu po anulowaniu.
   */

  await s.app.openPanel("teacher", teacherId);

  await expectSavedTeacherPhones(page, [firstPhone, secondPhone]);

  /*
   * Pozostałe dane nauczyciela
   * również bez zmian.
   */
  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  await s.record("phoneDeleteCancelled", firstPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", firstPhone);

  await expectTeacherPhoneHistoryChange(page, "Dodany numer", secondPhone);

  await expectTeacherPhoneHistoryMissing(page, "Usunięty numer", firstPhone);
});

/*
 * =========================================================
 * EDIT-19
 * NIEPOPRAWNY TELEFON
 * =========================================================
 */

test("EDIT-19: niepoprawny telefon blokuje dodanie @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const invalidPhone = "123";

  const phone = teacherNewPhoneInput(page);

  await expect(phone).toBeVisible();

  await expect(phone).toBeEnabled();

  /*
   * =====================================================
   * WPISANIE NIEPOPRAWNEGO NUMERU
   * =====================================================
   */

  await phone.fill(invalidPhone);

  await phone.press("Tab");

  /*
   * Pole jest oznaczone jako niepoprawne.
   */
  await expect(phone).toHaveAttribute("aria-invalid", "true");

  /*
   * Octopus pokazuje komunikat walidacyjny.
   */
  await expect(
    page.getByText("Wprowadź poprawny numer telefonu", {
      exact: true,
    }),
  ).toBeVisible();

  /*
   * =====================================================
   * PRÓBA DODANIA
   * =====================================================
   *
   * Przycisk Dodaj pozostaje aktywny,
   * mimo błędnego numeru.
   */

  const addButton = teacherPhoneAddButton(page);

  await expect(addButton).toBeVisible();

  await expect(addButton).toBeEnabled();

  await addButton.click();

  /*
   * Po kliknięciu numer nadal nie może
   * zostać zapisany.
   */
  await expectTeacherPhoneNotSaved(page, invalidPhone);

  /*
   * Komunikat walidacyjny nadal powinien
   * być widoczny.
   */
  await expect(
    page.getByText("Wprowadź poprawny numer telefonu", {
      exact: true,
    }),
  ).toBeVisible();

  /*
   * Pole nadal powinno być niepoprawne.
   */
  await expect(phone).toHaveAttribute("aria-invalid", "true");

  /*
   * =====================================================
   * PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * Numer 123 nie został zapisany.
   */
  await expectTeacherPhoneNotSaved(page, invalidPhone);

  /*
   * Nieudana próba dodania
   * nie powinna tworzyć wpisu historii.
   */
  await expectTeacherPhoneHistoryMissing(page, "Dodany numer", invalidPhone);
});

/*
 * =========================================================
 * EDIT-20
 * TELEFON TAK / E-MAIL NIE
 * =========================================================
 */

test("EDIT-20: nauczyciel może pozostać bez e-maila jeśli posiada telefon @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const phone = "500500500";

  /*
   * =====================================================
   * DODANIE TELEFONU
   * =====================================================
   */

  const phoneInput = teacherNewPhoneInput(page);

  await phoneInput.fill(phone);

  await phoneInput.press("Tab");

  await expect(teacherPhoneAddButton(page)).toBeEnabled();

  await teacherPhoneAddButton(page).click();

  await expectSavedTeacherPhone(page, phone);

  /*
   * =====================================================
   * USUNIĘCIE E-MAILA
   * =====================================================
   */

  const emailDialog = await openTeacherEmailEdit(page);

  const confirmDialog = await openTeacherEmailDeleteConfirmation(page, emailDialog);

  await confirmTeacherEmailDelete(confirmDialog);

  /*
   * Dialog edycji e-maila powinien
   * również zostać zamknięty.
   */
  await expect(emailDialog).toHaveCount(0);

  /*
   * =====================================================
   * WERYFIKACJA
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue("");

  await expectSavedTeacherPhone(page, phone);

  /*
   * =====================================================
   * PONOWNE OTWARCIE
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue("");

  await expectSavedTeacherPhone(page, phone);

  /*
   * Telefon nadal powinien być
   * zapisany w historii.
   */
  await expectTeacherPhoneHistoryChange(page, "Dodany numer", phone);

  await s.record("teacherEmail", "");

  await s.record("teacherLastName", s.id);
});

/*
 * =========================================================
 * EDIT-21
 * E-MAIL TAK / TELEFON NIE
 * =========================================================
 */

test("EDIT-21: nauczyciel może istnieć bez telefonu jeśli posiada e-mail @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  /*
   * Fixture tworzy nauczyciela
   * z e-mailem i bez telefonu.
   */
  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("email")).not.toHaveValue("");

  /*
   * Żaden numer nie został zapisany.
   */
  const savedPhones = await getSavedTeacherPhones(page);

  expect(savedPhones).toEqual([]);

  /*
   * Ponowne otwarcie.
   */
  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  expect(await getSavedTeacherPhones(page)).toEqual([]);
});

/*
 * =========================================================
 * EDIT-22
 * BRAK E-MAILA I TELEFONU
 * =========================================================
 */

test("EDIT-22: brak e-maila i telefonu wymaga dodatkowego potwierdzenia @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const oldEmail = s.email;

  /*
   * Brak telefonów.
   */
  expect(await getSavedTeacherPhones(page)).toEqual([]);

  /*
   * Otwieramy edycję e-maila.
   */
  const emailDialog = await openTeacherEmailEdit(page);

  /*
   * Klikamy Usuń e-mail.
   */
  const emailDeleteDialog = await openTeacherEmailDeleteConfirmation(page, emailDialog);

  /*
   * Pierwsze potwierdzenie usunięcia.
   */
  await confirmTeacherEmailDelete(emailDeleteDialog);

  /*
   * Ponieważ nauczyciel nie ma telefonu,
   * pojawia się drugie ostrzeżenie
   * o niespełnieniu rekordu minimalnego.
   */
  const minimalRecordWarning = await openTeacherMinimalRecordWarning(page);

  await expect(minimalRecordWarning).toContainText("Czy na pewno usunąć?");

  /*
   * W tym teście wybieramy "Nie",
   * aby sprawdzić, że dane pozostają bez zmian.
   */
  await cancelTeacherMinimalRecordWarning(minimalRecordWarning);

  /*
   * E-mail powinien nadal istnieć.
   */
  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue(oldEmail);

  /*
   * Nadal brak telefonów.
   */
  expect(await getSavedTeacherPhones(page)).toEqual([]);
});

test("EDIT-23: można usunąć e-mail bez telefonu po potwierdzeniu ostrzeżenia o rekordzie minimalnym @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const oldEmail = s.email;

  /*
   * =====================================================
   * STAN POCZĄTKOWY
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue(oldEmail);

  /*
   * Nauczyciel nie posiada telefonu.
   */
  expect(await getSavedTeacherPhones(page)).toEqual([]);

  /*
   * =====================================================
   * OTWARCIE EDYCJI E-MAILA
   * =====================================================
   */

  const emailDialog = await openTeacherEmailEdit(page);

  /*
   * =====================================================
   * PIERWSZE POTWIERDZENIE
   * =====================================================
   *
   * "Czy na pewno chcesz usunąć adres e-mail?"
   */

  const emailDeleteDialog = await openTeacherEmailDeleteConfirmation(page, emailDialog);

  await confirmTeacherEmailDelete(emailDeleteDialog);

  /*
   * =====================================================
   * DRUGIE POTWIERDZENIE
   * =====================================================
   *
   * Brak telefonu powoduje ostrzeżenie:
   *
   * "Rekord nie będzie spełniał wymagań
   * rekordu minimalnego..."
   */

  const minimalRecordWarning = await openTeacherMinimalRecordWarning(page);

  await expect(minimalRecordWarning).toContainText(
    "Rekord nie będzie spełniał wymagań rekordu minimalnego",
  );

  await expect(minimalRecordWarning).toContainText("Czy na pewno usunąć?");

  /*
   * Tym razem potwierdzamy operację.
   */
  await confirmTeacherMinimalRecordWarning(minimalRecordWarning);

  /*
   * =====================================================
   * WERYFIKACJA BEZPOŚREDNIO PO OPERACJI
   * =====================================================
   */

  await expect(s.app.detail("email")).toHaveValue("");

  expect(await getSavedTeacherPhones(page)).toEqual([]);

  /*
   * =====================================================
   * TRWAŁOŚĆ ZMIANY
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * E-mail nadal jest usunięty.
   */
  await expect(s.app.detail("email")).toHaveValue("");

  /*
   * Nadal brak telefonu.
   */
  expect(await getSavedTeacherPhones(page)).toEqual([]);

  /*
   * =====================================================
   * POZOSTAŁE DANE
   * =====================================================
   */

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(s.id);

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  /*
   * Zapisujemy informację do danych przebiegu.
   */
  await s.record("removedEmail", oldEmail);

  await s.record("removedEmailWithoutPhone", "true");

  await s.record("teacherEmail", "");

  await s.record("teacherLastName", s.id);
});

/*
 * =========================================================
 * EDIT-23
 * DATA URODZENIA
 * =========================================================
 */

test("EDIT-24: poprawna data urodzenia jest trwała @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const form = await openBasicTeacherEdit(page, s.app);

  const birthDate = teacherBirthDateInput(form);

  await expect(birthDate).toBeVisible();

  await birthDate.fill("15-05-1990");

  await birthDate.press("Tab");

  await expect(birthDate).toHaveValue("15-05-1990");

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Przy zapisie danych podstawowych
   * nazwisko zostaje znormalizowane.
   */
  await expect(s.app.detail("lastName")).toHaveValue(normalizeTeacherName(s.id));

  /*
   * Data powinna być trwała
   * i prezentowana jako dd-mm-yyyy.
   */
  await expect(s.app.detail("dateOfBirth")).toHaveValue("15-05-1990");
});

/*
 * =========================================================
 * EDIT-24
 * NIEPOPRAWNA DATA URODZENIA
 * =========================================================
 */

test("EDIT-25: niepoprawna data urodzenia blokuje zapis @teacher @edit @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const form = await openBasicTeacherEdit(page, s.app);

  const birthDate = teacherBirthDateInput(form);

  await birthDate.fill("2026-99-99");

  await birthDate.press("Tab");

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  /*
   * Formularz nie może się zamknąć.
   */
  await expect(form).toBeVisible();

  await cancelTeacherDialog(form);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Nie było zapisu,
   * więc nazwisko również nie powinno
   * zostać znormalizowane.
   */
  await expect(s.app.detail("lastName")).toHaveValue(s.id);
});

/*
 * =========================================================
 * EDIT-25
 * ADRES PRYWATNY
 * =========================================================
 */

test("EDIT-26: pełny adres prywatny można dodać i jest zapisany w historii @teacher @edit @history", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const address = {
    zipCode: "18-312",
    city: "Górskie Ponikły-Stok",
    street: "Kartuska",
    number: "123",
  };

  /*
   * =====================================================
   * 1. DODANIE ADRESU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const dialog = await openTeacherPrivateAddressEdit(page);

  await fillTeacherPrivateAddress(
    page,
    dialog,
    address.zipCode,
    address.city,
    address.street,
    address.number,
  );

  await saveTeacherPrivateAddress(dialog);

  /*
   * =====================================================
   * 2. PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   *
   * Po zapisaniu adresu karta nauczyciela
   * nie odświeża pola adresu automatycznie.
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * 3. WERYFIKACJA ZAPISANEGO ADRESU
   * =====================================================
   */

  const addressInput = page.locator("mat-form-field#address input");

  await expect(addressInput).toHaveValue(new RegExp(address.zipCode));

  await expect(addressInput).toHaveValue(new RegExp(address.city, "i"));

  await expect(addressInput).toHaveValue(new RegExp(address.street, "i"));

  await expect(addressInput).toHaveValue(new RegExp(address.number));

  /*
   * =====================================================
   * 4. TRWAŁOŚĆ PO KOLEJNYM OTWARCIU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const addressAfterReload = page.locator("mat-form-field#address input");

  await expect(addressAfterReload).toHaveValue(new RegExp(address.zipCode));

  await expect(addressAfterReload).toHaveValue(new RegExp(address.city, "i"));

  await expect(addressAfterReload).toHaveValue(new RegExp(address.street, "i"));

  await expect(addressAfterReload).toHaveValue(new RegExp(address.number));

  /*
   * =====================================================
   * 5. HISTORIA ZMIAN
   * =====================================================
   */

  const history = await openTeacherHistory(page);

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Numer adres prywatny",
    address.number,
  );

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Miasto adres prywatny",
    `${address.city} ${address.zipCode}`,
  );

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Ulica adres prywatny",
    address.street,
  );

  /*
   * =====================================================
   * 6. DANE SCENARIUSZA
   * =====================================================
   */

  await s.record(
    "privateAddress",
    `${address.zipCode} ${address.city}, ${address.street} ${address.number}`,
  );
});

test("EDIT-27: wszystkie dane istniejącego adresu prywatnego można zmienić @teacher @edit @history", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const firstAddress = {
    zipCode: "18-312",
    city: "Górskie Ponikły-Stok",
    street: "Kartuska",
    number: "123",
  };

  const secondAddress = {
    zipCode: "80-395",
    city: "Gdańsk",
    street: "Grunwaldzka",
    number: "567",
  };

  /*
   * =====================================================
   * 1. DODANIE PIERWSZEGO ADRESU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  let dialog = await openTeacherPrivateAddressEdit(page);

  await fillTeacherPrivateAddress(
    page,
    dialog,
    firstAddress.zipCode,
    firstAddress.city,
    firstAddress.street,
    firstAddress.number,
  );

  await saveTeacherPrivateAddress(dialog);

  /*
   * =====================================================
   * 2. WERYFIKACJA PIERWSZEGO ADRESU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  let addressInput = page.locator("mat-form-field#address input");

  await expect(addressInput).toHaveValue(/18-312/);

  await expect(addressInput).toHaveValue(/Górskie Ponikły-Stok/i);

  await expect(addressInput).toHaveValue(/Kartuska/i);

  await expect(addressInput).toHaveValue(/123/);

  /*
   * =====================================================
   * 3. USUNIĘCIE PIERWSZEGO ADRESU
   * =====================================================
   */

  dialog = await openTeacherPrivateAddressEdit(page);

  await deleteTeacherPrivateAddress(page, dialog);

  /*
   * =====================================================
   * 4. SPRAWDZENIE, ŻE ADRES ZOSTAŁ USUNIĘTY
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  addressInput = page.locator("mat-form-field#address input");

  await expect(addressInput).toHaveValue("");

  /*
   * =====================================================
   * 5. DODANIE DRUGIEGO ADRESU
   * =====================================================
   */

  dialog = await openTeacherPrivateAddressEdit(page);

  await fillTeacherPrivateAddress(
    page,
    dialog,
    secondAddress.zipCode,
    secondAddress.city,
    secondAddress.street,
    secondAddress.number,
  );

  await saveTeacherPrivateAddress(dialog);

  /*
   * =====================================================
   * 6. WERYFIKACJA DRUGIEGO ADRESU
   * =====================================================
   */

  addressInput = page.locator("mat-form-field#address input");

  await expect(addressInput).toHaveValue(/80-395/);

  await expect(addressInput).toHaveValue(/Gdańsk/i);

  await expect(addressInput).toHaveValue(/Grunwaldzka/i);

  await expect(addressInput).toHaveValue(/567/);

  /*
   * =====================================================
   * 7. STARY ADRES NIE MOŻE POZOSTAĆ
   * =====================================================
   */

  await expect(addressInput).not.toHaveValue(/18-312/);

  await expect(addressInput).not.toHaveValue(/Górskie Ponikły-Stok/i);

  await expect(addressInput).not.toHaveValue(/Kartuska/i);

  await expect(addressInput).not.toHaveValue(/123/);

  /*
   * =====================================================
   * 8. TRWAŁOŚĆ PO PONOWNYM OTWARCIU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const addressAfterReload = page.locator("mat-form-field#address input");

  await expect(addressAfterReload).toHaveValue(/80-395/);

  await expect(addressAfterReload).toHaveValue(/Gdańsk/i);

  await expect(addressAfterReload).toHaveValue(/Grunwaldzka/i);

  await expect(addressAfterReload).toHaveValue(/567/);

  /*
   * =====================================================
   * 9. HISTORIA ZMIAN - OTWIERAMY TYLKO RAZ
   * =====================================================
   */

  const history = await openTeacherHistory(page);

  /*
   * Drugi adres
   */

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Numer adres prywatny",
    secondAddress.number,
  );

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Miasto adres prywatny",
    `${secondAddress.city} ${secondAddress.zipCode}`,
  );

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Ulica adres prywatny",
    secondAddress.street,
  );

  /*
   * Pierwszy adres
   */

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Numer adres prywatny",
    firstAddress.number,
  );

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Miasto adres prywatny",
    `${firstAddress.city} ${firstAddress.zipCode}`,
  );

  await expectTeacherPrivateAddressHistoryChange(
    page,
    history,
    "Ulica adres prywatny",
    firstAddress.street,
  );

  /*
   * =====================================================
   * 10. POZOSTAŁE DANE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  /*
   * =====================================================
   * 11. DANE SCENARIUSZA
   * =====================================================
   */

  await s.record(
    "privateAddressBeforeEdit",
    `${firstAddress.zipCode} ${firstAddress.city}, ${firstAddress.street} ${firstAddress.number}`,
  );

  await s.record(
    "privateAddressAfterEdit",
    `${secondAddress.zipCode} ${secondAddress.city}, ${secondAddress.street} ${secondAddress.number}`,
  );
});

/*
 * =========================================================
 * EDIT-28
 * UWAGI
 * =========================================================
 */

test("EDIT-28: uwagi nauczyciela są trwałe @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const note = "Test automatyczny - uwaga nauczyciela";

  /*
   * =====================================================
   * 1. OTWARCIE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * 2. OTWARCIE EDYCJI UWAG
   * =====================================================
   */

  const dialog = await openTeacherNotesEdit(page);

  /*
   * =====================================================
   * 3. POLE UWAG
   * =====================================================
   *
   * W zależności od implementacji dialog może
   * używać textarea albo input.
   */

  const textarea = dialog.locator("textarea:not([readonly]):not([disabled])");

  const editableInput = dialog.locator(
    'input:not([type="checkbox"]):not([readonly]):not([disabled])',
  );

  const noteField = (await textarea.count()) > 0 ? textarea.first() : editableInput.first();

  await expect(noteField).toBeVisible();

  /*
   * =====================================================
   * 4. WPISANIE UWAGI
   * =====================================================
   */

  await noteField.fill(note);

  await noteField.press("Tab");

  await expect(noteField).toHaveValue(note);

  /*
   * =====================================================
   * 5. ZAPIS
   * =====================================================
   */

  await saveTeacherDialog(dialog);

  /*
   * =====================================================
   * 6. WERYFIKACJA OD RAZU PO ZAPISIE
   * =====================================================
   *
   * Nie używamy:
   *
   * page.getByText(note)
   *
   * ponieważ ta sama treść występuje także
   * w tooltipach Angular Material.
   */

  await expect(teacherNotesInput(page)).toHaveValue(note);

  /*
   * =====================================================
   * 7. TRWAŁOŚĆ PO PONOWNYM OTWARCIU REKORDU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(teacherNotesInput(page)).toHaveValue(note);

  /*
   * =====================================================
   * 8. POZOSTAŁE DANE NAUCZYCIELA
   * =====================================================
   *
   * Edycja uwag nie może zmienić
   * pozostałych podstawowych danych.
   */

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  /*
   * Relacja ze szkołą również musi pozostać.
   */

  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  /*
   * =====================================================
   * 9. ZAPIS DO DANYCH SCENARIUSZA
   * =====================================================
   */

  await s.record("teacherNote", note);
});

test("EDIT-29: nauczyciel może posiadać wiele notatek @teacher @edit @notes", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const firstNote = "Pierwsza notatka testowa";

  const secondNote = "Druga notatka testowa";

  /*
   * =====================================================
   * 1. PIERWSZA NOTATKA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await addTeacherNote(page, firstNote);

  /*
   * =====================================================
   * 2. DRUGA NOTATKA
   * =====================================================
   */

  await addTeacherNote(page, secondNote);

  /*
   * =====================================================
   * 3. PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * Pole na kartotece powinno prezentować
   * ostatnią dodaną uwagę.
   */

  await expect(teacherNotesInput(page)).toHaveValue(secondNote);

  /*
   * =====================================================
   * 4. OBIE NOTATKI W TABELI
   * =====================================================
   */

  const dialog = await openTeacherNotesEdit(page);

  await expect(teacherNoteRow(dialog, firstNote)).toHaveCount(1);

  await expect(teacherNoteRow(dialog, secondNote)).toHaveCount(1);

  await cancelTeacherNotesEdit(dialog);

  await s.record("teacherNote1", firstNote);

  await s.record("teacherNote2", secondNote);
});

test("EDIT-30: notatkę nauczyciela można zarchiwizować @teacher @edit @notes", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const note = "Notatka przeznaczona do archiwizacji";

  /*
   * =====================================================
   * 1. DODANIE NOTATKI
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await addTeacherNote(page, note);

  /*
   * =====================================================
   * 2. ARCHIWIZACJA
   * =====================================================
   */

  await archiveTeacherNote(page, note);

  /*
   * =====================================================
   * 3. TRWAŁOŚĆ
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const dialog = await openTeacherNotesEdit(page);

  const row = teacherNoteRow(dialog, note);

  await expect(row).toHaveCount(1);

  const checkbox = row.getByRole("checkbox");

  await expect(checkbox).toBeChecked();

  /*
   * Zarchiwizowana notatka nadal istnieje
   * w historii notatek.
   */

  await expect(
    row.getByRole("cell", {
      name: note,
      exact: true,
    }),
  ).toBeVisible();

  await cancelTeacherNotesEdit(dialog);

  await s.record("archivedTeacherNote", note);
});

test("EDIT-31: anulowanie nie zapisuje nowej notatki nauczyciela @teacher @edit @notes @cancel", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const existingNote = "Notatka istniejąca";

  const cancelledNote = "Ta notatka nie powinna zostać zapisana";

  /*
   * =====================================================
   * 1. DODANIE NOTATKI BAZOWEJ
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await addTeacherNote(page, existingNote);

  /*
   * =====================================================
   * 2. WPISANIE DRUGIEJ NOTATKI
   * =====================================================
   */

  const dialog = await openTeacherNotesEdit(page);

  const input = teacherNoteInput(dialog);

  await input.fill(cancelledNote);

  await expect(input).toHaveValue(cancelledNote);

  /*
   * =====================================================
   * 3. ANULUJ
   * =====================================================
   */

  await cancelTeacherNotesEdit(dialog);

  /*
   * =====================================================
   * 4. PONOWNE OTWARCIE
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const checkDialog = await openTeacherNotesEdit(page);

  /*
   * Stara notatka nadal istnieje.
   */

  await expect(teacherNoteRow(checkDialog, existingNote)).toHaveCount(1);

  /*
   * Anulowana notatka nie powstała.
   */

  await expectTeacherNoteMissing(checkDialog, cancelledNote);

  await cancelTeacherNotesEdit(checkDialog);
});

test("EDIT-32: zapisana notatka posiada autora i datę @teacher @edit @notes", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const note = "Notatka sprawdzająca autora i datę";

  /*
   * =====================================================
   * 1. DODANIE NOTATKI
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await addTeacherNote(page, note);

  /*
   * =====================================================
   * 2. OTWARCIE TABELI
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const dialog = await openTeacherNotesEdit(page);

  const row = teacherNoteRow(dialog, note);

  await expect(row).toHaveCount(1);

  const cells = row.locator("td");

  /*
   * Kolumny:
   *
   * 0 - Arch.
   * 1 - Treść
   * 2 - Data
   * 3 - Autor
   */

  await expect(cells.nth(1)).toHaveText(note);

  /*
   * Data w UI:
   * YYYY-MM-DD
   *
   * Komórka może zawierać dodatkowe
   * białe znaki na początku i końcu.
   */
  await expect(cells.nth(2)).toHaveText(/^\s*\d{4}-\d{2}-\d{2}\s*$/);

  /*
   * Autor nie może być pusty.
   */
  await expect(cells.nth(3)).not.toHaveText(/^\s*$/);

  await cancelTeacherNotesEdit(dialog);
});

test("EDIT-33: notatka nauczyciela ma limit 220 znaków @teacher @edit @notes @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const maxLengthNote = "A".repeat(220);

  const tooLongNote = "B".repeat(221);

  /*
   * =====================================================
   * 1. DOKŁADNIE 220 ZNAKÓW
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  let dialog = await openTeacherNotesEdit(page);

  let input = teacherNoteInput(dialog);

  await input.fill(maxLengthNote);

  await expect(input).toHaveValue(maxLengthNote);

  await saveTeacherNotesEdit(dialog);

  /*
   * 220 znaków powinno się zapisać.
   */

  await s.app.openPanel("teacher", teacherId);

  dialog = await openTeacherNotesEdit(page);

  await expect(teacherNoteRow(dialog, maxLengthNote)).toHaveCount(1);

  await cancelTeacherNotesEdit(dialog);

  /*
   * =====================================================
   * 2. PRÓBA WPISANIA 221 ZNAKÓW
   * =====================================================
   */

  dialog = await openTeacherNotesEdit(page);

  input = teacherNoteInput(dialog);

  await input.fill(tooLongNote);

  /*
   * UI deklaruje maksimum 220 znaków.
   *
   * Pole nie powinno pozwolić zachować
   * wartości dłuższej niż 220.
   */
  await expect.poll(async () => (await input.inputValue()).length).toBeLessThanOrEqual(220);

  const actualValue = await input.inputValue();

  expect(actualValue.length).toBe(220);

  await cancelTeacherNotesEdit(dialog);
});

test("EDIT-34: pusta notatka nauczyciela nie jest zapisywana @teacher @edit @notes @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const existingNote = "Notatka kontrolna";

  /*
   * =====================================================
   * 1. DODAJ POPRAWNĄ NOTATKĘ
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await addTeacherNote(page, existingNote);

  /*
   * =====================================================
   * 2. ZAPAMIĘTAJ LICZBĘ NOTATEK
   * =====================================================
   */

  let dialog = await openTeacherNotesEdit(page);

  const beforeCount = await teacherNoteRows(dialog).count();

  expect(beforeCount).toBeGreaterThan(0);

  await cancelTeacherNotesEdit(dialog);

  /*
   * =====================================================
   * 3. PRÓBA ZAPISANIA PUSTEJ NOTATKI
   * =====================================================
   */

  dialog = await openTeacherNotesEdit(page);

  const input = teacherNoteInput(dialog);

  await expect(input).toBeVisible();

  await input.fill("");

  await expect(input).toHaveValue("");

  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeVisible();

  await saveButton.click();

  /*
   * Aplikacja może zamknąć dialog
   * automatycznie po kliknięciu Zapisz.
   *
   * Dajemy jej chwilę na zakończenie
   * animacji zamykania.
   */
  await dialog
    .waitFor({
      state: "detached",
      timeout: 2_000,
    })
    .catch(() => {
      /*
       * Jeżeli dialog nie został zamknięty,
       * przechodzimy dalej i zamkniemy go
       * przez helper.
       */
    });

  if ((await dialog.count()) > 0) {
    await cancelTeacherNotesEdit(dialog);
  }

  /*
   * =====================================================
   * 4. PONOWNE OTWARCIE
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const checkDialog = await openTeacherNotesEdit(page);

  /*
   * =====================================================
   * 5. LICZBA NOTATEK NIE WZROSŁA
   * =====================================================
   */

  const afterCount = await teacherNoteRows(checkDialog).count();

  expect(afterCount).toBe(beforeCount);

  /*
   * Istniejąca poprawna notatka
   * nadal musi być obecna.
   */
  await expect(teacherNoteRow(checkDialog, existingNote)).toHaveCount(1);

  /*
   * =====================================================
   * 6. ZAMKNIĘCIE
   * =====================================================
   */

  await cancelTeacherNotesEdit(checkDialog);
});

/*
 * =========================================================
 * EDIT-35
 * ZGODY RODO
 * =========================================================
 */

test("EDIT-35: zgoda Marketing jest trwała @teacher @edit @rodo", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: false,
  });

  const dialog = await openTeacherRodoEdit(page);

  await setTeacherRodoConsent(dialog, "Marketing", true);

  await saveTeacherRodoEdit(dialog);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: false,
    phone: false,
  });

  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: false,
    phone: false,
  });

  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Email", "Nie");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Nie");
});

test("EDIT-36: zaznaczenie zgody E-mail automatycznie zaznacza Marketing @teacher @edit @rodo", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: false,
  });

  const dialog = await openTeacherRodoEdit(page);

  const email = teacherRodoCheckbox(dialog, "E-mail");

  const marketing = teacherRodoCheckbox(dialog, "Marketing");

  const phone = teacherRodoCheckbox(dialog, "Telefon");

  await email.check();

  await expect(email).toBeChecked();

  /*
   * Reguła biznesowa:
   * E-mail wymusza Marketing.
   */
  await expect(marketing).toBeChecked();

  await expect(phone).not.toBeChecked();

  await saveTeacherRodoEdit(dialog);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: false,
  });

  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: false,
  });

  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Email", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Nie");
});

test("EDIT-37: zaznaczenie zgody Telefon automatycznie zaznacza Marketing @teacher @edit @rodo", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: false,
  });

  const dialog = await openTeacherRodoEdit(page);

  const marketing = teacherRodoCheckbox(dialog, "Marketing");

  const email = teacherRodoCheckbox(dialog, "E-mail");

  const phone = teacherRodoCheckbox(dialog, "Telefon");

  await phone.check();

  await expect(phone).toBeChecked();

  /*
   * Reguła biznesowa:
   * Telefon wymusza Marketing.
   */
  await expect(marketing).toBeChecked();

  await expect(email).not.toBeChecked();

  await saveTeacherRodoEdit(dialog);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: false,
    phone: true,
  });

  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: false,
    phone: true,
  });

  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Tak");
});

test("EDIT-38: wszystkie zgody RODO można zapisać jednocześnie @teacher @edit @rodo", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const dialog = await openTeacherRodoEdit(page);

  await setTeacherRodoConsent(dialog, "Marketing", true);

  await setTeacherRodoConsent(dialog, "E-mail", true);

  await setTeacherRodoConsent(dialog, "Telefon", true);

  await saveTeacherRodoEdit(dialog);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: true,
  });

  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: true,
  });

  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Email", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Tak");
});

test("EDIT-39: odznaczenie zgody Marketing pokazuje ostrzeżenie @teacher @edit @rodo @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  /*
   * =====================================================
   * 1. ZAPISZ MARKETING
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  let dialog = await openTeacherRodoEdit(page);

  await setTeacherRodoConsent(dialog, "Marketing", true);

  await saveTeacherRodoEdit(dialog);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: false,
    phone: false,
  });

  /*
   * =====================================================
   * 2. OTWÓRZ EDYCJĘ PONOWNIE
   * =====================================================
   */

  dialog = await openTeacherRodoEdit(page);

  const marketing = teacherRodoCheckbox(dialog, "Marketing");

  await expect(marketing).toBeChecked();

  /*
   * =====================================================
   * 3. ODZNACZ MARKETING
   * =====================================================
   */

  await marketing.uncheck();

  await expect(marketing).not.toBeChecked();

  /*
   * Na podstawie UI komunikat pojawia się
   * po odznaczeniu Marketingu.
   */
  const warning = await expectTeacherMarketingWarning(page);

  await confirmTeacherMarketingWarning(warning);

  /*
   * Po zamknięciu ostrzeżenia wracamy
   * do dialogu RODO.
   */
  await expect(dialog).toBeVisible();

  /*
   * Sprawdzamy faktyczny stan po komunikacie.
   *
   * Na razie zakładamy, że Marketing
   * pozostaje odznaczony w formularzu.
   */
  await expect(marketing).not.toBeChecked();

  /*
   * Nie zapisujemy tej zmiany,
   * bo ten test dotyczy samego ostrzeżenia.
   */
  await cancelTeacherRodoEdit(dialog);

  /*
   * Po anulowaniu zapisany stan
   * nadal ma być Marketing = true.
   */
  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: false,
    phone: false,
  });
});

test("EDIT-40: odznaczenie Marketing automatycznie odznacza E-mail i Telefon @teacher @edit @rodo @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  /*
   * =====================================================
   * 1. USTAW WSZYSTKIE ZGODY
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  let dialog = await openTeacherRodoEdit(page);

  await setTeacherRodoConsent(dialog, "Marketing", true);

  await setTeacherRodoConsent(dialog, "E-mail", true);

  await setTeacherRodoConsent(dialog, "Telefon", true);

  await saveTeacherRodoEdit(dialog);

  /*
   * Wszystkie trzy zgody są zapisane.
   */
  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: true,
  });

  /*
   * =====================================================
   * 2. OTWÓRZ EDYCJĘ PONOWNIE
   * =====================================================
   */

  dialog = await openTeacherRodoEdit(page);

  const marketing = teacherRodoCheckbox(dialog, "Marketing");

  const email = teacherRodoCheckbox(dialog, "E-mail");

  const phone = teacherRodoCheckbox(dialog, "Telefon");

  await expect(marketing).toBeChecked();

  await expect(email).toBeChecked();

  await expect(phone).toBeChecked();

  /*
   * =====================================================
   * 3. ODZNACZ MARKETING
   * =====================================================
   */

  await marketing.uncheck();

  /*
   * Ostrzeżenie pojawia się od razu.
   */
  const warning = await expectTeacherMarketingWarning(page);

  await expect(warning).toContainText("Zgoda marketingowa nie jest zaznaczona");

  await confirmTeacherMarketingWarning(warning);

  /*
   * =====================================================
   * 4. SPRAWDŹ AUTOMATYCZNE ODZNACZENIE
   * =====================================================
   */

  await expect(dialog).toBeVisible();

  await expect(marketing).not.toBeChecked();

  await expect(email).not.toBeChecked();

  await expect(phone).not.toBeChecked();

  /*
   * =====================================================
   * 5. ANULUJ
   * =====================================================
   *
   * Nie próbujemy tutaj zapisywać stanu
   * bez żadnej zgody.
   *
   * To jest osobny przypadek EDIT-41.
   */

  await cancelTeacherRodoEdit(dialog);

  /*
   * =====================================================
   * 6. ANULOWANIE NIE ZMIENIŁO ZAPISANYCH ZGÓD
   * =====================================================
   */

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: true,
  });

  /*
   * =====================================================
   * 7. TRWAŁOŚĆ ZAPISANEGO STANU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: true,
    email: true,
    phone: true,
  });
});

test("EDIT-41: zapis bez żadnej zgody RODO pokazuje ostrzeżenie @teacher @edit @rodo @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  await s.createTeacher(school.id, school.name);

  const dialog = await openTeacherRodoEdit(page);

  await expect(teacherRodoCheckbox(dialog, "Marketing")).not.toBeChecked();

  await expect(teacherRodoCheckbox(dialog, "E-mail")).not.toBeChecked();

  await expect(teacherRodoCheckbox(dialog, "Telefon")).not.toBeChecked();

  /*
   * Źródłem jest domyślnie Karta nauczyciela,
   * czyli źródło inne niż Karta LS.
   */

  await dialog
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  const warning = await expectTeacherNoConsentWarning(page);

  await confirmTeacherNoConsentWarning(warning);

  /*
   * Formularz nadal powinien być otwarty.
   */
  await expect(dialog).toBeVisible();

  await cancelTeacherRodoEdit(dialog);

  /*
   * Nic nie zostało zapisane.
   */
  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: false,
  });
});

test("EDIT-42: dropdown Źródło RODO zawiera oczekiwane wartości @teacher @edit @rodo", async ({
  page,
  scenario: s,
  school,
}) => {
  await s.createTeacher(school.id, school.name);

  const dialog = await openTeacherRodoEdit(page);

  const sourceSelect = teacherRodoSourceSelect(dialog);

  await expect(sourceSelect).toBeVisible();

  /*
   * Domyślna wartość.
   */
  await expect(sourceSelect).toContainText("Karta nauczyciela");

  await sourceSelect.click();

  const expectedSources = [
    "Formularz klubowy",
    "Kontakt BOK",
    "Karta LS",
    "Karta nauczyciela",
    "Kontakt CC",
    "Kontakt promotor",
    "Akcja promocyjna",
    "Strona www",
    "Dział wysyłkowy",
    "Karta obecności",
  ];

  for (const source of expectedSources) {
    await expect(
      page.getByRole("option", {
        name: source,
        exact: true,
      }),
    ).toBeVisible();
  }

  /*
   * Dodatkowo liczba opcji.
   */
  await expect(page.getByRole("option")).toHaveCount(expectedSources.length);

  /*
   * Zamykamy dropdown przez wybór
   * aktualnej wartości.
   */
  await page
    .getByRole("option", {
      name: "Karta nauczyciela",
      exact: true,
    })
    .click();

  await cancelTeacherRodoEdit(dialog);
});

/*
 * =========================================================
 * EDIT-43
 * ZAPIS BEZ ZMIAN
 * =========================================================
 */

test("EDIT-43: ponowny zapis już znormalizowanych danych bez zmian nie modyfikuje danych ani historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const inputLastName = "nOWAK";

  const normalizedLastName = normalizeTeacherName(inputLastName);

  /*
   * =====================================================
   * 1. DOPROWADZENIE DANYCH DO STANU ZNORMALIZOWANEGO
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  let form = await openBasicTeacherEdit(page, s.app);

  /*
   * Wprowadzamy wartość wymagającą normalizacji:
   *
   * nOWAK -> Nowak
   */
  await typeValue(form.locator("#lastName"), inputLastName);

  await saveBasicTeacherEdit(form);

  /*
   * =====================================================
   * 2. SPRAWDZENIE NORMALIZACJI I ZAŁADOWANIA DANYCH
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * openPanel() potwierdza otwarcie właściwego rekordu,
   * ale wartości pól mogą doczytać się chwilę później.
   *
   * Dlatego przed wykonaniem snapshotu czekamy na
   * konkretne oczekiwane wartości.
   */
  await expect(s.app.detail("firstName")).toHaveValue("Testowy");

  await expect(s.app.detail("lastName")).toHaveValue(normalizedLastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  /*
   * Zapamiętujemy stan po pierwszym,
   * rzeczywistym zapisie.
   */
  const before = {
    firstName: await s.app.detail("firstName").inputValue(),

    lastName: await s.app.detail("lastName").inputValue(),

    email: await s.app.detail("email").inputValue(),
  };

  /*
   * =====================================================
   * 3. SNAPSHOT HISTORII
   * =====================================================
   */

  const historyBefore = await teacherHistorySnapshot(page);

  /*
   * =====================================================
   * 4. DRUGI ZAPIS - BEZ ŻADNEJ ZMIANY
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  form = await openBasicTeacherEdit(page, s.app);

  /*
   * Formularz już powinien zawierać
   * znormalizowane dane.
   */
  await expect(form.locator("#firstName")).toHaveValue(before.firstName);

  await expect(form.locator("#lastName")).toHaveValue(before.lastName);

  /*
   * Nie dotykamy żadnego pola.
   */
  await saveBasicTeacherEdit(form);

  /*
   * =====================================================
   * 5. DANE NIE ZMIENIŁY SIĘ
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(before.firstName);

  await expect(s.app.detail("lastName")).toHaveValue(before.lastName);

  await expect(s.app.detail("email")).toHaveValue(before.email);

  /*
   * =====================================================
   * 6. HISTORIA NIE ZMIENIŁA SIĘ
   * =====================================================
   */

  await expectTeacherHistorySnapshot(page, historyBefore);
});

/*
 * =========================================================
 * EDIT-44
 * ANULOWANIE WIELU ZMIAN
 * =========================================================
 */

test("EDIT-44: anulowanie wielu zmian zachowuje poprzednie dane i historię @teacher @edit @cancel", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const before = {
    firstName: await s.app.detail("firstName").inputValue(),

    lastName: await s.app.detail("lastName").inputValue(),

    email: await s.app.detail("email").inputValue(),
  };

  const historyBefore = await teacherHistorySnapshot(page);

  await s.app.openPanel("teacher", teacherId);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), "Adam");

  await typeValue(form.locator("#lastName"), "Anulowany");

  await cancelTeacherDialog(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(before.firstName);

  await expect(s.app.detail("lastName")).toHaveValue(before.lastName);

  await expect(s.app.detail("email")).toHaveValue(before.email);

  await expectTeacherHistorySnapshot(page, historyBefore);
});

/*
 * =========================================================
 * EDIT-45
 * PEŁNA NAWIGACJA
 * =========================================================
 */

test("EDIT-45: zmienione dane są trwałe po przejściu do szkoły i powrocie @teacher @edit @navigation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const newFirstName = "Adam";

  const expectedLastName = normalizeTeacherName(s.id);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), newFirstName);

  await saveBasicTeacherEdit(form);

  /*
   * Przejście do szkoły.
   */
  await s.app.openPanel("school", school.id);

  await expect(
    page.getByRole("heading", {
      name: "Dane podstawowe szkoły",
      exact: true,
    }),
  ).toBeVisible();

  /*
   * Powrót do nauczyciela.
   */
  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(newFirstName);

  await expect(s.app.detail("lastName")).toHaveValue(expectedLastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);
});

/*
 * =========================================================
 * EDIT-46
 * RELACJA ZE SZKOŁĄ
 * =========================================================
 */

test("EDIT-46: edycja danych nauczyciela nie usuwa relacji ze szkołą @teacher @edit @relation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const newFirstName = "Adam";

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), newFirstName);

  await saveBasicTeacherEdit(form);

  /*
   * Relacja widoczna od strony nauczyciela.
   */
  await expect(
    page.getByRole("row").filter({
      hasText: school.name,
    }),
  ).toHaveCount(1);

  /*
   * Relacja widoczna od strony szkoły.
   */
  await s.app.openPanel("school", school.id);

  const teacherRow = await s.app.schoolTeacherRow(teacherId);

  await expect(teacherRow).toHaveCount(1);

  await expect(teacherRow).toContainText(newFirstName);

  await expect(teacherRow).toContainText(normalizeTeacherName(s.id));
});

/*
 * =========================================================
 * EDIT-47
 * HISTORIA WIELU PÓL
 * =========================================================
 */

test("EDIT-47: jednoczesna zmiana wielu pól tworzy komplet wpisów historii @teacher @edit @history", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);

  const inputFirstName = "Adam";

  const inputLastName = "Nowak";

  const expectedFirstName = normalizeTeacherName(inputFirstName);

  const expectedLastName = normalizeTeacherName(inputLastName);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), inputFirstName);

  await typeValue(form.locator("#lastName"), inputLastName);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(expectedFirstName);

  await expect(s.app.detail("lastName")).toHaveValue(expectedLastName);

  /*
   * Korzystamy z istniejącego helpera
   * zamiast ręcznie powielać selektory historii.
   */
  await expectTeacherHistoryChange(page, "Imię", expectedFirstName);

  /*
   * Helper ponownie otworzy tab historii,
   * dlatego przed kolejnym wywołaniem
   * wracamy do panelu nauczyciela.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectTeacherHistoryChange(page, "Nazwisko", expectedLastName);
});
