import { expect, type Locator, type Page } from "@playwright/test";

/*
 * =========================================================
 * ZGODY RODO
 * =========================================================
 */

export function teacherConsent(page: Page, name: "Marketing" | "E-mail" | "Telefon") {
  return page.getByRole("checkbox", {
    name,
    exact: true,
  });
}

export async function openTeacherRodoEdit(page: Page) {
  const rodoLabel = page.getByText("Zgody RODO", {
    exact: true,
  });

  await expect(rodoLabel).toBeVisible();

  /*
   * Zgody RODO mają inny układ DOM niż standardowe
   * pola info-row.
   *
   * Szukamy najbliższego kontenera zawierającego
   * ikonę edit.
   */
  const container = rodoLabel.locator(
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
      has: page.getByText("Edycja Zgód RODO", {
        exact: true,
      }),
    })
    .last();

  await expect(dialog).toBeVisible();

  return dialog;
}

/*
 * Checkbox zgody wewnątrz okna edycji RODO.
 */

export function teacherRodoCheckbox(dialog: Locator, name: "Marketing" | "E-mail" | "Telefon") {
  return dialog.getByRole("checkbox", {
    name,
    exact: true,
  });
}

/*
 * Checkbox zgody widoczny na głównej kartotece.
 */

export function teacherRodoCheckboxOnCard(page: Page, name: "Marketing" | "E-mail" | "Telefon") {
  return page.getByRole("checkbox", {
    name,
    exact: true,
  });
}

/*
 * Zapisuje okno RODO.
 */

export async function saveTeacherRodoEdit(dialog: Locator) {
  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeVisible();

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherRodoEdit(dialog: Locator) {
  const cancelButton = dialog.getByRole("button", {
    name: "Anuluj",
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await cancelButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function expectTeacherMarketingWarning(page: Page) {
  const warning = page
    .locator("mat-dialog-container")
    .filter({
      has: page.getByText("Zgoda marketingowa nie jest zaznaczona", {
        exact: true,
      }),
    })
    .last();

  await expect(warning).toBeVisible();

  await expect(warning).toContainText("Zgoda marketingowa nie jest zaznaczona");

  return warning;
}

export async function confirmTeacherMarketingWarning(warning: Locator) {
  const okButton = warning.getByRole("button", {
    name: /^ok$/i,
  });

  await expect(okButton).toBeVisible();

  await okButton.click();

  await expect(warning).toHaveCount(0);
}

export async function setTeacherRodoConsent(
  dialog: Locator,
  name: "Marketing" | "E-mail" | "Telefon",
  checked: boolean,
) {
  const checkbox = teacherRodoCheckbox(dialog, name);

  await expect(checkbox).toBeVisible();

  if (checked) {
    await checkbox.check();

    await expect(checkbox).toBeChecked();
  } else {
    await checkbox.uncheck();

    await expect(checkbox).not.toBeChecked();
  }
}

export async function expectTeacherRodoOnCard(
  page: Page,
  expected: {
    marketing: boolean;
    email: boolean;
    phone: boolean;
  },
) {
  const marketing = teacherRodoCheckboxOnCard(page, "Marketing");

  const email = teacherRodoCheckboxOnCard(page, "E-mail");

  const phone = teacherRodoCheckboxOnCard(page, "Telefon");

  if (expected.marketing) {
    await expect(marketing).toBeChecked();
  } else {
    await expect(marketing).not.toBeChecked();
  }

  if (expected.email) {
    await expect(email).toBeChecked();
  } else {
    await expect(email).not.toBeChecked();
  }

  if (expected.phone) {
    await expect(phone).toBeChecked();
  } else {
    await expect(phone).not.toBeChecked();
  }
}

export async function expectTeacherNoConsentWarning(page: Page) {
  const warning = page
    .locator("mat-dialog-container")
    .filter({
      has: page.getByText(
        "Dla źródeł danych innych niż karta LS oczekuje się minimum jednej zgody rodo",
        {
          exact: true,
        },
      ),
    })
    .last();

  await expect(warning).toBeVisible();

  return warning;
}

export async function confirmTeacherNoConsentWarning(warning: Locator) {
  const okButton = warning.getByRole("button", {
    name: /^ok$/i,
  });

  await expect(okButton).toBeVisible();

  await okButton.click();

  await expect(warning).toHaveCount(0);
}

export function teacherRodoSourceSelect(dialog: Locator) {
  return dialog.getByRole("combobox");
}

export async function teacherRodoSourceOptions(page: Page) {
  return page.getByRole("option");
}
