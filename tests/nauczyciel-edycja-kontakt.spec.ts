import { test, expect } from "./support/shared-school";

import { typeValue } from "./support/octopus";

import {
  cancelTeacherDialog,
  cancelTeacherPhoneDelete,
  confirmTeacherEmailDelete,
  confirmTeacherMinimalRecordWarning,
  confirmTeacherPhoneDelete,
  expectSavedTeacherPhone,
  expectSavedTeacherPhones,
  expectTeacherHistoryChange,
  expectTeacherPhoneHistoryChange,
  expectTeacherPhoneHistoryMissing,
  expectTeacherPhoneNotSaved,
  getSavedTeacherPhones,
  openTeacherEmailDeleteConfirmation,
  openTeacherEmailEdit,
  openTeacherMinimalRecordWarning,
  cancelTeacherMinimalRecordWarning,
  openTeacherPhoneDeleteConfirmation,
  teacherNewPhoneInput,
  teacherPhoneAddButton,
  teacherPhoneDeleteButtons,
} from "./support/teacher-edit";

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
