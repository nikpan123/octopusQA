import { expect, type Locator, type Page } from "@playwright/test";

import { typeValue } from "./octopus";

export const SCHOOL_SIMPLE_UPDATE_ENDPOINT = "**/api/School/UpdateSchoolSimpleData";

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

export async function openSchoolAddressEdit(page: Page) {
  const addressRow = page
    .getByText("Adres", { exact: true })
    .locator('xpath=ancestor::*[.//mat-icon[normalize-space()="edit"]][1]');
  const edit = addressRow.locator("mat-icon").filter({ hasText: /^edit$/ });

  await expect(edit, "Adres szkoły powinien mieć jedną akcję edycji").toHaveCount(1);
  await edit.click();

  const dialog = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: "Edycja adresu", exact: true }),
  });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function openSchoolSioForm(page: Page) {
  await page.getByRole("button", { name: "Akcja SIO", exact: true }).click();

  const form = page.locator("mat-dialog-container").filter({
    has: page.getByText("Dane do akcji SIO", { exact: true }),
  });
  await expect(form).toBeVisible();
  return form;
}

export function schoolSioInput(
  form: Locator,
  id: "rspoNumber" | "nip" | "regon" | "quantityOfStudents",
) {
  return form.locator(`input[id="${id}"]`);
}

export async function saveSchoolSioEdit(form: Locator) {
  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toHaveCount(0);
}

export function schoolPhoneMobileCheckbox(schoolDetails: Locator) {
  return schoolDetails
    .getByText("komórka", { exact: true })
    .locator('xpath=preceding::input[@type="checkbox" and not(@disabled)][1]');
}

export async function addSchoolPhone(schoolDetails: Locator, digits: string, mobile: boolean) {
  const input = schoolDetails.locator(
    'input:not([disabled]):not([readonly]):not([type="checkbox"])',
  );
  await expect(input, "Na karcie szkoły powinno być jedno pole dodawania telefonu").toHaveCount(1);

  const mobileCheckbox = schoolPhoneMobileCheckbox(schoolDetails);
  await expect(
    mobileCheckbox,
    "Przełącznik typu dodawanego telefonu powinien być dostępny",
  ).toHaveCount(1);
  await mobileCheckbox.setChecked(mobile);
  await input.fill(digits);
  await input.press("Tab");
  await expect.poll(async () => (await input.inputValue()).replace(/\D/g, "")).toBe(digits);

  await schoolDetails.getByRole("button", { name: "Dodaj", exact: true }).click();
  await expect
    .poll(async () => {
      const values = await schoolDetails
        .locator('input[disabled][type="text"]')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
      return values.some((value) => value.replace(/\D/g, "") === digits);
    })
    .toBeTruthy();
}

export async function openSchoolHistory(page: Page) {
  await page.getByRole("tab", { name: "Historia zmian", exact: true }).click();
  const history = page.getByRole("tabpanel", { name: "Historia zmian", exact: true });
  await expect(history).toBeVisible();
  await expect(history.getByRole("gridcell").first()).toBeVisible({ timeout: 20_000 });
  return history;
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
