import { expect, type Locator, type Page } from "@playwright/test";

import { typeValue } from "./octopus";

export async function openSchoolEditForm(page: Page) {
  await page
    .getByRole("button", {
      name: "Edycja danych",
      exact: true,
    })
    .click();

  const form = page
    .locator("mat-dialog-container")
    .filter({
      has: page.getByRole("button", {
        name: "Zapisz",
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("button", {
        name: "Anuluj",
        exact: true,
      }),
    });

  await expect(form, "Formularz edycji szkoły powinien być otwarty").toHaveCount(1);

  await expect(form).toBeVisible();

  return form;
}

export async function schoolEditInput(form: Locator, currentValue: string) {
  const inputs = form.locator('input:not([type="checkbox"]):not([disabled])');

  const findMatchingIndexes = () =>
    inputs.evaluateAll(
      (elements, expectedValue) =>
        elements.flatMap((element, index) =>
          (element as HTMLInputElement).value === expectedValue ? [index] : [],
        ),
      currentValue,
    );

  await expect
    .poll(findMatchingIndexes, {
      message: `Formularz edycji powinien zawierać jedno pole z wartością „${currentValue}”`,
    })
    .toHaveLength(1);

  const matchingIndexes = await findMatchingIndexes();
  const input = inputs.nth(matchingIndexes[0]);

  await expect(input).toBeEditable();

  return input;
}

export async function replaceSchoolEditValue(
  form: Locator,
  currentValue: string,
  newValue: string,
) {
  const input = await schoolEditInput(form, currentValue);

  await typeValue(input, newValue);

  return input;
}

export async function cancelSchoolEdit(form: Locator) {
  await form
    .getByRole("button", {
      name: "Anuluj",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);
}

export async function saveSchoolEdit(form: Locator) {
  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);
}

export type SchoolContactField = "WWW" | "E-Mail";

export async function openSchoolFieldEdit(page: Page, label: SchoolContactField) {
  const labelElement = page.getByText(label, {
    exact: true,
  });

  await expect(labelElement).toBeVisible();

  const container = labelElement.locator(
    'xpath=ancestor::*[.//mat-icon[normalize-space()="edit"]][1]',
  );

  const editIcon = container.locator("mat-icon").filter({
    hasText: /^edit$/,
  });

  await expect(editIcon, `Pole „${label}” powinno mieć jedną akcję edycji`).toHaveCount(1);

  await expect(editIcon).toBeVisible();

  await editIcon.evaluate((element) => (element as HTMLElement).click());

  const dialog = page.locator("mat-dialog-container").last();

  await expect(dialog).toBeVisible();

  return dialog;
}

/**
 * Dialog WWW i E-Mail zawiera dwa pola:
 *
 * - currentInput - aktualna wartość, tylko do odczytu
 * - newInput     - puste pole, do którego wpisujemy nową wartość
 */
export async function schoolFieldEditInputs(dialog: Locator) {
  const currentInput = dialog
    .locator('input:not([type="checkbox"])[readonly], ' + 'input:not([type="checkbox"])[disabled]')
    .first();

  const newInput = dialog
    .locator('input:not([type="checkbox"]):not([readonly]):not([disabled])')
    .first();

  await expect(
    currentInput,
    "Dialog edycji powinien zawierać aktualną, nieedytowalną wartość",
  ).toBeVisible();

  await expect(newInput, "Dialog edycji powinien zawierać pole na nową wartość").toBeEditable();

  return {
    currentInput,
    newInput,
  };
}

/**
 * Zachowane dla kompatybilności z innymi testami.
 *
 * Zwraca pole NOWEJ wartości, a nie aktualnej.
 */
export async function schoolFieldEditInput(dialog: Locator) {
  return (await schoolFieldEditInputs(dialog)).newInput;
}

/**
 * Kliknięcie:
 *
 * WWW    -> Usuń www
 * E-Mail -> Usuń e-mail
 *
 * oraz oczekiwanie na modal potwierdzenia.
 */
export async function openSchoolFieldDeleteConfirmation(
  page: Page,
  editDialog: Locator,
  field: SchoolContactField,
) {
  const deleteButtonName = field === "WWW" ? "Usuń www" : "Usuń e-mail";

  const confirmationText =
    field === "WWW"
      ? "Czy na pewno chcesz usunąć adres www?"
      : "Czy na pewno chcesz usunąć adres e-mail?";

  const deleteButton = editDialog.getByRole("button", {
    name: deleteButtonName,
    exact: true,
  });

  await expect(deleteButton).toBeVisible();
  await expect(deleteButton).toBeEnabled();

  await deleteButton.click();

  const confirmation = page.locator("mat-dialog-container").filter({
    hasText: confirmationText,
  });

  await expect(
    confirmation,
    `Po kliknięciu „${deleteButtonName}” powinno pojawić się potwierdzenie`,
  ).toHaveCount(1);

  await expect(confirmation).toBeVisible();

  await expect(
    confirmation.getByText(confirmationText, {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    confirmation.getByRole("button", {
      name: "Nie",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    confirmation.getByRole("button", {
      name: "Tak",
      exact: true,
    }),
  ).toBeVisible();

  return confirmation;
}

/**
 * Potwierdzenie usunięcia WWW / e-maila.
 */
export async function confirmSchoolFieldDelete(confirmation: Locator) {
  const yes = confirmation.getByRole("button", {
    name: "Tak",
    exact: true,
  });

  await expect(yes).toBeVisible();
  await expect(yes).toBeEnabled();

  await yes.click();

  await expect(confirmation).toHaveCount(0);
}

/**
 * Rezygnacja z usunięcia WWW / e-maila.
 */
export async function cancelSchoolFieldDelete(confirmation: Locator) {
  const no = confirmation.getByRole("button", {
    name: "Nie",
    exact: true,
  });

  await expect(no).toBeVisible();
  await expect(no).toBeEnabled();

  await no.click();

  await expect(confirmation).toHaveCount(0);
}
