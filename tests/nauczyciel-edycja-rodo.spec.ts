import { test, expect } from "./support/shared-school";

import {
  cancelTeacherRodoEdit,
  confirmTeacherMarketingWarning,
  confirmTeacherNoConsentWarning,
  expectTeacherMarketingWarning,
  expectTeacherNoConsentWarning,
  expectTeacherRodoHistoryChange,
  expectTeacherRodoOnCard,
  openTeacherHistory,
  openTeacherRodoEdit,
  saveTeacherRodoEdit,
  setTeacherRodoConsent,
  teacherRodoCheckbox,
  teacherRodoSourceSelect,
} from "./support/teacher-edit";

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
