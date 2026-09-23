import { expect, type Locator, type Page } from "@playwright/test";
import { typeValue } from "./octopus";

/*
 * =========================================================
 * ADRES PRYWATNY
 * =========================================================
 */

export async function openTeacherPrivateAddressEdit(page: Page) {
  /*
   * Jeżeli jakiś stary dialog adresu jeszcze
   * istnieje, nie klikamy ponownie ikony przez
   * evaluate(), bo moglibyśmy otworzyć drugi.
   */
  const existingDialogs = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: "Edycja adresu",
      exact: true,
    }),
  });

  const existingCount = await existingDialogs.count();

  if (existingCount > 0) {
    const existingDialog = existingDialogs.last();

    if (await existingDialog.isVisible().catch(() => false)) {
      return existingDialog;
    }
  }

  const addressField = page.locator("mat-form-field#address");

  await expect(addressField).toBeVisible();

  const row = addressField.locator('xpath=ancestor::*[contains(@class,"info-row")][1]');

  const editIcon = row.locator("mat-icon").filter({
    hasText: /^edit$/,
  });

  await expect(editIcon).toHaveCount(1);

  await expect(editIcon).toBeVisible();

  await editIcon.evaluate((element) => {
    (element as HTMLElement).click();
  });

  /*
   * Używamy last(), żeby podczas animacji Angulara
   * nie dostać strict mode violation.
   */
  const dialog = page
    .locator("mat-dialog-container")
    .filter({
      has: page.getByRole("heading", {
        name: "Edycja adresu",
        exact: true,
      }),
    })
    .last();

  await expect(dialog).toBeVisible();

  return dialog;
}

export function teacherAddressStreetResults(dialog: Locator) {
  return dialog.locator("table.mat-mdc-table");
}

export function teacherAddressStreetRow(dialog: Locator, street: string) {
  return dialog
    .locator("td.mat-column-street")
    .filter({
      hasText: new RegExp(`^${street}$`, "i"),
    })
    .locator("xpath=ancestor::tr[1]");
}

export async function fillTeacherPrivateAddress(
  page: Page,
  dialog: Locator,
  zipCode: string,
  cityName: string,
  streetName: string,
  number: string,
) {
  const zipCodeInput = dialog.locator('input[id="zip_code_input"]');

  await expect(zipCodeInput).toBeVisible();

  await zipCodeInput.click();

  await zipCodeInput.press("Control+A");

  await zipCodeInput.press("Backspace");

  const zipDigits = zipCode.replace(/\D/g, "");

  await zipCodeInput.pressSequentially(zipDigits, {
    delay: 150,
  });

  await expect(zipCodeInput).toHaveValue(zipCode);

  /*
   * Wybieramy podpowiedź kodu.
   */
  const zipOption = page.getByRole("option", {
    name: zipCode,
    exact: true,
  });

  await expect(zipOption).toBeVisible();

  await zipOption.click();

  /*
   * Miasto
   */
  const cityRow = dialog
    .getByRole("row")
    .filter({
      hasText: zipCode,
    })
    .filter({
      hasText: cityName,
    });

  await expect(cityRow).toHaveCount(1);

  await cityRow.click();

  /*
   * Ulica
   */
  const streetSearch = dialog
    .getByText("Ulica:", {
      exact: true,
    })
    .locator("xpath=ancestor::*[.//input][1]")
    .locator("input")
    .first();

  await expect(streetSearch).toBeVisible();

  await streetSearch.fill(streetName);

  await streetSearch.press("End");

  await streetSearch.press("Tab");

  const streetCell = dialog.getByRole("cell", {
    name: streetName,
    exact: true,
  });

  await expect(streetCell).toHaveCount(1);

  await streetCell.locator("xpath=ancestor::tr[1]").click();

  /*
   * Numer
   */
  const numberInput = dialog.locator('input[id="number"]');

  await expect(numberInput).toBeVisible();

  await typeValue(numberInput, number);
}

export async function saveTeacherPrivateAddress(dialog: Locator) {
  const saveButton = dialog.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeVisible();

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function deleteTeacherPrivateAddress(page: Page, dialog: Locator) {
  const deleteButton = dialog.getByRole("button", {
    name: "Usuń adres",
    exact: true,
  });

  await expect(deleteButton).toBeVisible();

  await expect(deleteButton).toBeEnabled();

  await deleteButton.click();

  const confirmDialog = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: "Usuwanie adresu",
      exact: true,
    }),
  });

  await expect(confirmDialog).toBeVisible();

  await expect(confirmDialog).toContainText("Czy na pewno chcesz usunąć adres szkoły?");

  const confirmButton = confirmDialog.getByRole("button", {
    name: "Tak",
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(confirmDialog).toHaveCount(0);

  await expect(dialog).toHaveCount(0);
}

export async function fillTeacherPrivateAddressFromZip(
  dialog: Locator,
  zipCode: string,
  streetName: string,
  number: string,
) {
  const zipCodeInput = dialog.locator('input[id="zip_code_input"]');

  await expect(zipCodeInput).toBeVisible();

  await zipCodeInput.fill(zipCode);

  await zipCodeInput.press("End");
  await zipCodeInput.press("Tab");

  /*
   * Pierwszy wynik miejscowości
   * dla podanego kodu.
   */
  const cityRow = dialog
    .getByRole("row")
    .filter({
      hasText: zipCode,
    })
    .first();

  await expect(cityRow).toBeVisible();

  const cityCells = cityRow.getByRole("cell");

  /*
   * Zakładamy układ:
   * Kod | Miasto | Poczta | Województwo
   */
  const cityName = (await cityCells.nth(1).innerText()).trim();

  await cityRow.click();

  const streetSearch = dialog
    .getByText("Ulica:", {
      exact: true,
    })
    .locator("xpath=ancestor::*[.//input][1]")
    .locator("input")
    .first();

  await streetSearch.fill(streetName.toLowerCase());

  await streetSearch.press("End");
  await streetSearch.press("Tab");

  const streetCell = dialog.getByRole("cell", {
    name: streetName,
    exact: true,
  });

  await expect(streetCell).toBeVisible();

  await streetCell.locator("xpath=ancestor::tr[1]").click();

  const numberInput = dialog.locator('input[id="number"]');

  await numberInput.fill(number);

  await numberInput.press("End");
  await numberInput.press("Tab");

  return {
    zipCode,
    city: cityName,
    street: streetName,
    number,
  };
}
