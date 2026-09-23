import { expect, type Locator, type Page } from "@playwright/test";

type AppWithDialog = {
  dialog(title: string): Locator;
};

/*
 * =========================================================
 * EDYCJA DANYCH PODSTAWOWYCH
 * =========================================================
 */

export function normalizeTeacherName(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export async function openBasicTeacherEdit(page: Page, app: AppWithDialog) {
  await page
    .getByRole("button", {
      name: "Edycja danych",
      exact: true,
    })
    .click();

  const form = app.dialog("Edycja danych podstawowych");

  await expect(form).toBeVisible();

  return form;
}

export async function saveBasicTeacherEdit(form: Locator) {
  const save = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(save).toBeVisible();

  await expect(save).toBeEnabled();

  await save.click();

  await expect(form).toHaveCount(0);
}

export async function cancelTeacherDialog(dialog: Locator) {
  const cancel = dialog.getByRole("button", {
    name: "Anuluj",
    exact: true,
  });

  await expect(cancel).toBeVisible();

  await cancel.click();

  await expect(dialog).toHaveCount(0);
}

export async function saveTeacherDialog(dialog: Locator) {
  const save = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(save).toBeVisible();

  await expect(save).toBeEnabled();

  await save.click();

  await expect(dialog).toHaveCount(0);
}

/*
 * =========================================================
 * OGÓLNE POLA EDYTOWANE IKONĄ
 * =========================================================
 */

export async function openTeacherFieldEdit(page: Page, label: string) {
  const labelElement = page.getByText(label, {
    exact: true,
  });

  await expect(labelElement).toBeVisible();

  const row = labelElement.locator('xpath=ancestor::*[contains(@class,"info-row")][1]');

  await expect(row).toBeVisible();

  const editIcon = row.locator("mat-icon").filter({
    hasText: /^edit$/,
  });

  await expect(editIcon).toHaveCount(1);

  await expect(editIcon).toBeVisible();

  await editIcon.evaluate((element) => {
    (element as HTMLElement).click();
  });

  const dialog = page.locator("mat-dialog-container").last();

  await expect(dialog).toBeVisible();

  return dialog;
}

export function firstEditableTeacherInput(dialog: Locator) {
  return dialog
    .locator(['input:not([type="checkbox"])', ":not([readonly])", ":not([disabled])"].join(""))
    .first();
}

/*
 * =========================================================
 * DATA URODZENIA
 * =========================================================
 */

export function teacherBirthDateInput(form: Locator) {
  return form
    .getByText("Data urodzenia", {
      exact: true,
    })
    .locator("xpath=ancestor::*[.//input][1]")
    .locator("input")
    .first();
}
