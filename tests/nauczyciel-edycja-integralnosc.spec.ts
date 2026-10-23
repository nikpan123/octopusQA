import { test, expect } from "./support/shared-school";

import { typeValue } from "./support/octopus";

import {
  cancelTeacherDialog,
  expectTeacherHistoryChange,
  expectTeacherHistorySnapshot,
  normalizeTeacherName,
  openBasicTeacherEdit,
  saveBasicTeacherEdit,
  teacherHistorySnapshot,
} from "./support/teacher-edit";

test("EDIT-43: ponowny zapis już znormalizowanych danych bez zmian nie modyfikuje danych ani historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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
  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: "Auto"', async () =>
    expect(s.app.detail("firstName")).toHaveValue("Auto"));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: normalizedLastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(normalizedLastName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: s.email', async () =>
    expect(s.app.detail("email")).toHaveValue(s.email));

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
  await test.step('Sprawdzenie: wartość pola w widoku — form.locator("#firstName"); oczekiwane: before.firstName', async () =>
    expect(form.locator("#firstName")).toHaveValue(before.firstName));

  await test.step('Sprawdzenie: wartość pola w widoku — form.locator("#lastName"); oczekiwane: before.lastName', async () =>
    expect(form.locator("#lastName")).toHaveValue(before.lastName));

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

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: before.firstName', async () =>
    expect(s.app.detail("firstName")).toHaveValue(before.firstName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: before.lastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(before.lastName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: before.email', async () =>
    expect(s.app.detail("email")).toHaveValue(before.email));

  /*
   * =====================================================
   * 6. HISTORIA NIE ZMIENIŁA SIĘ
   * =====================================================
   */

  await test.step("Sprawdzenie: expectTeacherHistorySnapshot", async () =>
    expectTeacherHistorySnapshot(page, historyBefore));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: before.firstName', async () =>
    expect(s.app.detail("firstName")).toHaveValue(before.firstName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: before.lastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(before.lastName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: before.email', async () =>
    expect(s.app.detail("email")).toHaveValue(before.email));

  await test.step("Sprawdzenie: expectTeacherHistorySnapshot", async () =>
    expectTeacherHistorySnapshot(page, historyBefore));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const newFirstName = "Adam";

  const expectedLastName = normalizeTeacherName(s.id);

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), newFirstName);

  await saveBasicTeacherEdit(form);

  /*
   * Przejście do szkoły.
   */
  await s.app.openPanel("school", school.id);

  await test.step('Sprawdzenie: widoczność elementu — page.getByRole("heading", { name: "Dane podstawowe szkoły", exact: true, })', async () =>
    expect(
      page.getByRole("heading", {
        name: "Dane podstawowe szkoły",
        exact: true,
      }),
    ).toBeVisible());

  /*
   * Powrót do nauczyciela.
   */
  await s.app.openPanel("teacher", teacherId);

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: newFirstName', async () =>
    expect(s.app.detail("firstName")).toHaveValue(newFirstName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("lastName"); oczekiwane: expectedLastName', async () =>
    expect(s.app.detail("lastName")).toHaveValue(expectedLastName));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: s.email', async () =>
    expect(s.app.detail("email")).toHaveValue(s.email));
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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

  const newFirstName = "Adam";

  const form = await openBasicTeacherEdit(page, s.app);

  await typeValue(form.locator("#firstName"), newFirstName);

  await saveBasicTeacherEdit(form);

  /*
   * Relacja widoczna od strony nauczyciela.
   */
  await test.step('Sprawdzenie: liczba elementów w widoku — page.getByRole("row").filter({ hasText: school.name, }); oczekiwane: 1', async () =>
    expect(
      page.getByRole("row").filter({
        hasText: school.name,
      }),
    ).toHaveCount(1));

  /*
   * Relacja widoczna od strony szkoły.
   */
  await s.app.openPanel("school", school.id);

  const teacherRow = await s.app.schoolTeacherRow(teacherId);

  await test.step("Sprawdzenie: liczba elementów w widoku — teacherRow; oczekiwane: 1", async () =>
    expect(teacherRow).toHaveCount(1));

  await test.step("Sprawdzenie: obecność tekstu w widoku — teacherRow; oczekiwane: newFirstName", async () =>
    expect(teacherRow).toContainText(newFirstName));

  await test.step("Sprawdzenie: obecność tekstu w widoku — teacherRow; oczekiwane: normalizeTeacherName(s.id)", async () =>
    expect(teacherRow).toContainText(normalizeTeacherName(s.id)));
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

  /*
   * Korzystamy z istniejącego helpera
   * zamiast ręcznie powielać selektory historii.
   */
  await test.step("Sprawdzenie: expectTeacherHistoryChange", async () =>
    expectTeacherHistoryChange(page, "Imię", expectedFirstName));

  /*
   * Helper ponownie otworzy tab historii,
   * dlatego przed kolejnym wywołaniem
   * wracamy do panelu nauczyciela.
   */
  await s.app.openPanel("teacher", teacherId);

  await test.step("Sprawdzenie: expectTeacherHistoryChange", async () =>
    expectTeacherHistoryChange(page, "Nazwisko", expectedLastName));
});
