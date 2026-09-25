import { expect, type Locator, type Page } from "@playwright/test";

import { typeValue } from "./octopus";

export async function openSchoolEditForm(page: Page) {
  await page.getByRole("button", { name: "Edycja danych", exact: true }).click();

  const form = page
    .locator("mat-dialog-container")
    .filter({ has: page.getByRole("button", { name: "Zapisz", exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Anuluj", exact: true }) });
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
  await form.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(form).toHaveCount(0);
}

export async function saveSchoolEdit(form: Locator) {
  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toHaveCount(0);
}

export async function openSchoolFieldEdit(page: Page, label: "WWW" | "E-Mail") {
  const labelElement = page.getByText(label, { exact: true });
  await expect(labelElement).toBeVisible();

  const container = labelElement.locator(
    'xpath=ancestor::*[.//mat-icon[normalize-space()="edit"]][1]',
  );
  const editIcon = container.locator("mat-icon").filter({ hasText: /^edit$/ });
  await expect(editIcon, `Pole „${label}” powinno mieć jedną akcję edycji`).toHaveCount(1);
  await expect(editIcon).toBeVisible();
  await editIcon.evaluate((element) => (element as HTMLElement).click());

  const dialog = page.locator("mat-dialog-container").last();
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function schoolFieldEditInput(dialog: Locator) {
  const input = dialog
    .locator('input:not([type="checkbox"]):not([readonly]):not([disabled])')
    .first();
  await expect(input).toBeEditable();
  return input;
}
