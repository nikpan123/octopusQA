import { test, expect } from "./support/shared-school";

import { typeValue } from "./support/octopus";

import {
  cancelTeacherDialog,
  expectTeacherHistoryChange,
  normalizeTeacherName,
  openBasicTeacherEdit,
  saveBasicTeacherEdit,
} from "./support/teacher-edit";

test("EDIT-04: zmiana imienia jest trwała i widoczna w historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const newFirstName = "Adam";

  /*
   * Nazwisko zostanie znormalizowane
   * podczas zapisu formularza.
   */
  const expectedLastName = normalizeTeacherName(s.id);

  const form = await openBasicTeacherEdit(page, s.app);

  await test.step('Sprawdzenie: wartość pola w widoku — form.locator("#firstName"); oczekiwane: "Testowy"', async () =>
    expect(form.locator("#firstName")).toHaveValue("Testowy"));

  await typeValue(form.locator("#firstName"), newFirstName);

  await saveBasicTeacherEdit(form);

  /*
   * Od razu po zapisie.
   */
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: newFirstName', async () =>
    expect(s.app.detail("firstName")).toHaveValue(newFirstName));

  /*
   * Ponowne otwarcie.
   */
  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: newFirstName', async () =>
    expect(s.app.detail("firstName")).toHaveValue(newFirstName));

  /*
   * Nazwisko zostało automatycznie
   * znormalizowane przez Octopusa.
   */
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: expectedLastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(expectedLastName));

  /*
   * E-mail pozostaje bez zmian.
   */
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: s.email', async () =>
    expect(s.app.detail("email")).toHaveValue(s.email));

  /*
   * Relacja ze szkołą pozostaje.
   */
  await test.step('Sprawdzenie: liczba elementów w widoku — page.getByRole("row").filter({ hasText: school.name, }); oczekiwane: 1', async () =>
    expect(
      page.getByRole("row").filter({
        hasText: school.name,
      }),
    ).toHaveCount(1));

  /*
   * Historia zmiany imienia.
   */
  await test.step("Sprawdzenie: expectTeacherHistoryChange", async () =>
    expectTeacherHistoryChange(page, "Imię", newFirstName));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const inputLastName = "Nowak";

  const expectedLastName = normalizeTeacherName(inputLastName);

  const form = await openBasicTeacherEdit(page, s.app);

  await test.step('Sprawdzenie: wartość pola w widoku — form.locator("#lastName"); oczekiwane: s.id', async () =>
    expect(form.locator("#lastName")).toHaveValue(s.id));

  await typeValue(form.locator("#lastName"), inputLastName);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: expectedLastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(expectedLastName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: "Testowy"', async () =>
    expect(s.app.detail("firstName")).toHaveValue("Testowy"));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: s.email', async () =>
    expect(s.app.detail("email")).toHaveValue(s.email));

  await test.step("Sprawdzenie: expectTeacherHistoryChange", async () =>
    expectTeacherHistoryChange(page, "Nazwisko", expectedLastName));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const inputFirstName = "Adam";

  const inputLastName = "Nowak";

  const expectedFirstName = normalizeTeacherName(inputFirstName);

  const expectedLastName = normalizeTeacherName(inputLastName);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), inputFirstName);

  await typeValue(form.locator("#lastName"), inputLastName);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: expectedFirstName', async () =>
    expect(s.app.detail("firstName")).toHaveValue(expectedFirstName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: expectedLastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(expectedLastName));

  await test.step("Sprawdzenie: expectTeacherHistoryChange", async () =>
    expectTeacherHistoryChange(page, "Imię", expectedFirstName));

  /*
   * Ponowne wejście,
   * żeby wrócić z historii
   * do standardowego panelu.
   */
  await s.app.openPanel("teacher", teacherId);

  await test.step("Sprawdzenie: expectTeacherHistoryChange", async () =>
    expectTeacherHistoryChange(page, "Nazwisko", expectedLastName));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const input = "BoŻeNa";

  const expected = normalizeTeacherName(input);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), input);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: expected', async () =>
    expect(s.app.detail("firstName")).toHaveValue(expected));

  /*
   * Nazwisko również może zostać
   * znormalizowane przy tym samym zapisie.
   */
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: normalizeTeacherName(s.id)', async () =>
    expect(s.app.detail("lastName")).toHaveValue(normalizeTeacherName(s.id)));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const input = "nOWAK";

  const expected = normalizeTeacherName(input);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#lastName"), input);

  await saveBasicTeacherEdit(form);

  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: expected', async () =>
    expect(s.app.detail("lastName")).toHaveValue(expected));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: /^nowak-kowalska$/i', async () =>
    expect(s.app.detail("lastName")).toHaveValue(/^nowak-kowalska$/i));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: widoczność elementu — form", async () =>
    expect(form).toBeVisible());

  await cancelTeacherDialog(form);

  /*
   * Anulowaliśmy formularz,
   * więc normalizacja nie powinna
   * zostać zapisana.
   */
  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: "Testowy"', async () =>
    expect(s.app.detail("firstName")).toHaveValue("Testowy"));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: s.id', async () =>
    expect(s.app.detail("lastName")).toHaveValue(s.id));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: widoczność elementu — form", async () =>
    expect(form).toBeVisible());

  await cancelTeacherDialog(form);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Nie było poprawnego zapisu,
   * więc nazwisko powinno zostać
   * takie jak przed edycją.
   */
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: s.id', async () =>
    expect(s.app.detail("lastName")).toHaveValue(s.id));
});

/*
 * =========================================================
 * EDIT-12
 * POPRAWNY E-MAIL
 * =========================================================
 */
