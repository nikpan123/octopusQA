import { test, expect } from "./support/shared-school";

import {
  addTeacherNote,
  archiveTeacherNote,
  cancelTeacherNotesEdit,
  expectTeacherNoteMissing,
  openTeacherNotesEdit,
  saveTeacherDialog,
  saveTeacherNotesEdit,
  teacherNoteInput,
  teacherNoteRow,
  teacherNoteRows,
  teacherNotesInput,
} from "./support/teacher-edit";

test("EDIT-28: uwagi nauczyciela są trwałe @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: widoczność elementu — noteField", async () =>
    expect(noteField).toBeVisible());

  /*
   * =====================================================
   * 4. WPISANIE UWAGI
   * =====================================================
   */

  await noteField.fill(note);

  await noteField.press("Tab");

  await test.step("Sprawdzenie: wartość pola w widoku — noteField; oczekiwane: note", async () =>
    expect(noteField).toHaveValue(note));

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

  await test.step("Sprawdzenie: wartość pola w widoku — teacherNotesInput(page); oczekiwane: note", async () =>
    expect(teacherNotesInput(page)).toHaveValue(note));

  /*
   * =====================================================
   * 7. TRWAŁOŚĆ PO PONOWNYM OTWARCIU REKORDU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await test.step("Sprawdzenie: wartość pola w widoku — teacherNotesInput(page); oczekiwane: note", async () =>
    expect(teacherNotesInput(page)).toHaveValue(note));

  /*
   * =====================================================
   * 8. POZOSTAŁE DANE NAUCZYCIELA
   * =====================================================
   *
   * Edycja uwag nie może zmienić
   * pozostałych podstawowych danych.
   */

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("email"); oczekiwane: s.email', async () =>
    expect(s.app.detail("email")).toHaveValue(s.email));

  await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("firstName"); oczekiwane: "Auto"', async () =>
    expect(s.app.detail("firstName")).toHaveValue("Auto"));

  /*
   * Relacja ze szkołą również musi pozostać.
   */

  await test.step('Sprawdzenie: liczba elementów w widoku — page.getByRole("row").filter({ hasText: school.name, }); oczekiwane: 1', async () =>
    expect(
      page.getByRole("row").filter({
        hasText: school.name,
      }),
    ).toHaveCount(1));

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
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: wartość pola w widoku — teacherNotesInput(page); oczekiwane: secondNote", async () =>
    expect(teacherNotesInput(page)).toHaveValue(secondNote));

  /*
   * =====================================================
   * 4. OBIE NOTATKI W TABELI
   * =====================================================
   */

  const dialog = await openTeacherNotesEdit(page);

  await test.step("Sprawdzenie: liczba elementów w widoku — teacherNoteRow(dialog, firstNote); oczekiwane: 1", async () =>
    expect(teacherNoteRow(dialog, firstNote)).toHaveCount(1));

  await test.step("Sprawdzenie: liczba elementów w widoku — teacherNoteRow(dialog, secondNote); oczekiwane: 1", async () =>
    expect(teacherNoteRow(dialog, secondNote)).toHaveCount(1));

  await cancelTeacherNotesEdit(dialog);

  await s.record("teacherNote1", firstNote);

  await s.record("teacherNote2", secondNote);
});

test("EDIT-30: notatkę nauczyciela można zarchiwizować @teacher @edit @notes", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: liczba elementów w widoku — row; oczekiwane: 1", async () =>
    expect(row).toHaveCount(1));

  const checkbox = row.getByRole("checkbox");

  await test.step("Sprawdzenie: zaznaczenie opcji — checkbox", async () =>
    expect(checkbox).toBeChecked());

  /*
   * Zarchiwizowana notatka nadal istnieje
   * w historii notatek.
   */

  await test.step('Sprawdzenie: widoczność elementu — row.getByRole("cell", { name: note, exact: true, })', async () =>
    expect(
      row.getByRole("cell", {
        name: note,
        exact: true,
      }),
    ).toBeVisible());

  await cancelTeacherNotesEdit(dialog);

  await s.record("archivedTeacherNote", note);
});

test("EDIT-31: anulowanie nie zapisuje nowej notatki nauczyciela @teacher @edit @notes @cancel", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: wartość pola w widoku — input; oczekiwane: cancelledNote", async () =>
    expect(input).toHaveValue(cancelledNote));

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

  await test.step("Sprawdzenie: liczba elementów w widoku — teacherNoteRow(checkDialog, existingNote); oczekiwane: 1", async () =>
    expect(teacherNoteRow(checkDialog, existingNote)).toHaveCount(1));

  /*
   * Anulowana notatka nie powstała.
   */

  await test.step("Sprawdzenie: expectTeacherNoteMissing", async () =>
    expectTeacherNoteMissing(checkDialog, cancelledNote));

  await cancelTeacherNotesEdit(checkDialog);
});

test("EDIT-32: zapisana notatka posiada autora i datę @teacher @edit @notes", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: liczba elementów w widoku — row; oczekiwane: 1", async () =>
    expect(row).toHaveCount(1));

  const cells = row.locator("td");

  /*
   * Kolumny:
   *
   * 0 - Arch.
   * 1 - Treść
   * 2 - Data
   * 3 - Autor
   */

  await test.step("Sprawdzenie: tekst w widoku — cells.nth(1); oczekiwane: note", async () =>
    expect(cells.nth(1)).toHaveText(note));

  /*
   * Data w UI:
   * YYYY-MM-DD
   *
   * Komórka może zawierać dodatkowe
   * białe znaki na początku i końcu.
   */
  await test.step("Sprawdzenie: tekst w widoku — cells.nth(2); oczekiwane: /^\\s*\\d{4}-\\d{2}-\\d{2}\\s*$/", async () =>
    expect(cells.nth(2)).toHaveText(/^\s*\d{4}-\d{2}-\d{2}\s*$/));

  /*
   * Autor nie może być pusty.
   */
  await test.step("Sprawdzenie: negacja — tekst w widoku — cells.nth(3); oczekiwane: /^\\s*$/", async () =>
    expect(cells.nth(3)).not.toHaveText(/^\s*$/));

  await cancelTeacherNotesEdit(dialog);
});

test("EDIT-33: notatka nauczyciela ma limit 220 znaków @teacher @edit @notes @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: wartość pola w widoku — input; oczekiwane: maxLengthNote", async () =>
    expect(input).toHaveValue(maxLengthNote));

  await saveTeacherNotesEdit(dialog);

  /*
   * 220 znaków powinno się zapisać.
   */

  await s.app.openPanel("teacher", teacherId);

  dialog = await openTeacherNotesEdit(page);

  await test.step("Sprawdzenie: liczba elementów w widoku — teacherNoteRow(dialog, maxLengthNote); oczekiwane: 1", async () =>
    expect(teacherNoteRow(dialog, maxLengthNote)).toHaveCount(1));

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
  await test.step("Sprawdzenie: wartość nie większa od granicy — async () => (await input.inputValue()).length; granica: 220", async () =>
    expect.poll(async () => (await input.inputValue()).length).toBeLessThanOrEqual(220));

  const actualValue = await input.inputValue();

  await test.step("Sprawdzenie: zgodność wartości — actualValue.length; oczekiwane: 220", async () => {
    expect(actualValue.length).toBe(220);
  });

  await cancelTeacherNotesEdit(dialog);
});

test("EDIT-34: pusta notatka nauczyciela nie jest zapisywana @teacher @edit @notes @validation", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await test.step("Przygotowanie: utworzenie nauczyciela testowego", async () =>
    s.createTeacher(school.id, school.name));

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

  await test.step("Sprawdzenie: wartość powyżej granicy — beforeCount; granica: 0", async () => {
    expect(beforeCount).toBeGreaterThan(0);
  });

  await cancelTeacherNotesEdit(dialog);

  /*
   * =====================================================
   * 3. PRÓBA ZAPISANIA PUSTEJ NOTATKI
   * =====================================================
   */

  dialog = await openTeacherNotesEdit(page);

  const input = teacherNoteInput(dialog);

  await test.step("Sprawdzenie: widoczność elementu — input", async () =>
    expect(input).toBeVisible());

  await input.fill("");

  await test.step('Sprawdzenie: wartość pola w widoku — input; oczekiwane: ""', async () =>
    expect(input).toHaveValue(""));

  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await test.step("Sprawdzenie: widoczność elementu — saveButton", async () =>
    expect(saveButton).toBeVisible());

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

  await test.step("Sprawdzenie: zgodność wartości — afterCount; oczekiwane: beforeCount", async () => {
    expect(afterCount).toBe(beforeCount);
  });

  /*
   * Istniejąca poprawna notatka
   * nadal musi być obecna.
   */
  await test.step("Sprawdzenie: liczba elementów w widoku — teacherNoteRow(checkDialog, existingNote); oczekiwane: 1", async () =>
    expect(teacherNoteRow(checkDialog, existingNote)).toHaveCount(1));

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
