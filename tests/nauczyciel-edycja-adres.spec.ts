import { test, expect } from "./support/shared-school";

import {
  cancelTeacherDialog,
  deleteTeacherPrivateAddress,
  expectTeacherPrivateAddressHistoryChange,
  fillTeacherPrivateAddress,
  normalizeTeacherName,
  openBasicTeacherEdit,
  openTeacherHistory,
  openTeacherPrivateAddressEdit,
  saveBasicTeacherEdit,
  saveTeacherPrivateAddress,
  teacherBirthDateInput,
} from "./support/teacher-edit";

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
