import { expect, type Locator, type Page } from "@playwright/test";

/*
 * =========================================================
 * UWAGI / NOTATKI NAUCZYCIELA
 * =========================================================
 */

export async function openTeacherNotesEdit(page: Page) {
  const notesLabel = page.getByText("Uwagi", {
    exact: true,
  });

  await expect(notesLabel).toBeVisible();

  /*
   * Szukamy najbliższego kontenera,
   * który zawiera ikonę edycji.
   */
  const container = notesLabel.locator(
    'xpath=ancestor::*[.//mat-icon[normalize-space()="edit"]][1]',
  );

  await expect(container).toBeVisible();

  const editIcon = container
    .locator("mat-icon")
    .filter({
      hasText: /^edit$/,
    })
    .last();

  await expect(editIcon).toBeVisible();

  await editIcon.evaluate((element) => {
    (element as HTMLElement).click();
  });

  const dialog = page
    .locator("mat-dialog-container")
    .filter({
      has: page.getByText("Edycja Uwag", {
        exact: true,
      }),
    })
    .last();

  await expect(dialog).toBeVisible();

  return dialog;
}

/**
 * Pole do wpisania nowej notatki.
 *
 * Na podstawie UI:
 * "Wprowadź notatkę (maksymalnie 220 znaków)"
 */

export function teacherNoteInput(dialog: Locator) {
  return dialog.getByPlaceholder(/Wprowadź notatkę/).first();
}

/**
 * Pole "Uwagi" widoczne na kartotece nauczyciela.
 */

export function teacherNotesInput(page: Page) {
  return page
    .getByText("Uwagi", {
      exact: true,
    })
    .locator("xpath=following::input[1]");
}

/**
 * Wiersz konkretnej notatki w oknie "Edycja Uwag".
 */

export function teacherNoteRow(dialog: Locator, note: string) {
  return dialog
    .getByText(note, {
      exact: true,
    })
    .locator("xpath=ancestor::tr[1]");
}

/**
 * Wszystkie zapisane notatki.
 *
 * Każdy wiersz danych posiada checkbox Arch.
 */

export function teacherNoteRows(dialog: Locator) {
  return dialog.locator("tbody tr");
}

/**
 * Zapisuje okno notatek.
 */

export async function saveTeacherNotesEdit(dialog: Locator) {
  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeVisible();

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await expect(dialog).toHaveCount(0);
}

/**
 * Anuluje zmiany w oknie notatek.
 */

export async function cancelTeacherNotesEdit(dialog: Locator) {
  /*
   * Dialog mógł już zostać zamknięty
   * przez poprzednią operację.
   */
  if ((await dialog.count()) === 0) {
    return;
  }

  const cancelButton = dialog.getByRole("button", {
    name: "Anuluj",
    exact: true,
  });

  /*
   * Angular może być właśnie w trakcie
   * zamykania dialogu.
   */
  try {
    await expect(cancelButton).toBeVisible({
      timeout: 2_000,
    });

    await cancelButton.click();
  } catch (error) {
    /*
     * Jeśli dialog w międzyczasie zniknął,
     * wszystko jest OK.
     *
     * Jeżeli nadal istnieje, wtedy rzeczywiście
     * mamy problem i rzucamy pierwotny błąd.
     */
    if ((await dialog.count()) === 0) {
      return;
    }

    throw error;
  }

  await expect(dialog).toHaveCount(0);
}

/**
 * Dodaje nową notatkę.
 */

export async function addTeacherNote(page: Page, note: string) {
  const dialog = await openTeacherNotesEdit(page);

  const input = teacherNoteInput(dialog);

  await expect(input).toBeVisible();

  await input.fill(note);

  await expect(input).toHaveValue(note);

  await saveTeacherNotesEdit(dialog);
}

/**
 * Sprawdza, że konkretna notatka
 * znajduje się w tabeli notatek.
 */

export async function expectTeacherNote(page: Page, note: string) {
  const dialog = await openTeacherNotesEdit(page);

  const row = teacherNoteRow(dialog, note);

  await expect(row).toHaveCount(1);

  return {
    dialog,
    row,
  };
}

/**
 * Sprawdza, że konkretnej notatki
 * nie ma w tabeli.
 */

export async function expectTeacherNoteMissing(dialog: Locator, note: string) {
  await expect(teacherNoteRow(dialog, note)).toHaveCount(0);
}

/**
 * Archiwizuje konkretną notatkę.
 */

export async function archiveTeacherNote(page: Page, note: string) {
  const dialog = await openTeacherNotesEdit(page);

  const row = teacherNoteRow(dialog, note);

  await expect(row).toHaveCount(1);

  const checkbox = row.getByRole("checkbox");

  await expect(checkbox).toBeVisible();

  await checkbox.check();

  await expect(checkbox).toBeChecked();

  await saveTeacherNotesEdit(dialog);
}
