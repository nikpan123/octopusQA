import { expect, type Locator, type Page } from "@playwright/test";

import { typeValue } from "./octopus";

type AppWithDialog = {
  dialog: (title: string) => Locator;
};

/*
 * =========================================================
 * NORMALIZACJA IMIENIA / NAZWISKA
 * =========================================================
 */

export function normalizeTeacherName(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/*
 * =========================================================
 * HISTORIA ZMIAN
 * =========================================================
 */

export function teacherHistory(page: Page) {
  return page.getByRole("tabpanel", {
    name: "Historia zmian",
    exact: true,
  });
}

export async function openTeacherHistory(page: Page) {
  await page
    .getByRole("tab", {
      name: "Historia zmian",
      exact: true,
    })
    .click();

  const history = teacherHistory(page);

  await expect(history).toBeVisible();

  return history;
}

export async function expectTeacherHistoryChange(
  page: Page,
  field: string,
  value: string,
) {
  const history = await openTeacherHistory(page);

  const row = history
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: field,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: value,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: "Edycja danych",
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  await expect(row).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  await expect(row.getByRole("gridcell").nth(2)).not.toHaveText("");

  return row;
}

export async function teacherHistorySnapshot(page: Page) {
  const history = await openTeacherHistory(page);

  return history.getByRole("row").allTextContents();
}

export async function expectTeacherHistorySnapshot(
  page: Page,
  expectedRows: string[],
) {
  const history = await openTeacherHistory(page);

  await expect(history.getByRole("row")).toHaveText(expectedRows);
}

/*
 * =========================================================
 * EDYCJA DANYCH PODSTAWOWYCH
 * =========================================================
 */

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

  const row = labelElement.locator(
    'xpath=ancestor::*[contains(@class,"info-row")][1]',
  );

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
    .locator(
      [
        'input:not([type="checkbox"])',
        ":not([readonly])",
        ":not([disabled])",
      ].join(""),
    )
    .first();
}

/*
 * =========================================================
 * E-MAIL
 * =========================================================
 */

export async function openTeacherEmailEdit(page: Page) {
  const spinner = page.locator("#spinner");

  await spinner
    .waitFor({
      state: "hidden",
      timeout: 20_000,
    })
    .catch(() => {
      // spinner może nie istnieć
    });

  const emailField = page.locator("mat-form-field#email");

  await expect(emailField).toBeVisible();

  const row = emailField.locator(
    'xpath=ancestor::*[contains(@class,"info-row")][1]',
  );

  await expect(row).toBeVisible();

  const editIcon = row.locator("mat-icon").filter({
    hasText: /^edit$/,
  });

  await expect(editIcon).toHaveCount(1);

  await expect(editIcon).toBeVisible();

  await editIcon.evaluate((element) => {
    (element as HTMLElement).click();
  });

  const dialog = page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: "Edycja e-mail",
      exact: true,
    }),
  });

  await expect(dialog).toBeVisible();

  return dialog;
}

export function teacherNewEmailInput(dialog: Locator) {
  return dialog.locator('input:not([type="checkbox"])').nth(1);
}

/*
 * =========================================================
 * TELEFON
 * =========================================================
 */

export function teacherContactDetails(page: Page) {
  return page.locator("app-contact-details");
}

/**
 * Pole po prawej stronie,
 * służące do wpisania nowego numeru.
 *
 * Potwierdzony DOM:
 * mask="000 - 000 - 000"
 */
export function teacherNewPhoneInput(page: Page) {
  return teacherContactDetails(page)
    .locator('input[mask="000 - 000 - 000"]')
    .last();
}

/**
 * Przycisk Dodaj telefonu.
 */
export function teacherPhoneAddButton(page: Page) {
  return teacherContactDetails(page).getByRole("button", {
    name: "Dodaj",
    exact: true,
  });
}

/**
 * Normalizuje telefon do samych cyfr.
 *
 * 500500500
 * 500-500-500
 * 500 - 500 - 500
 *
 * =>
 *
 * 500500500
 */
export function normalizeTeacherPhone(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Zwraca wyłącznie ZAPISANE numery telefonu.
 *
 * Bardzo ważne:
 *
 * pole dodawania nowego numeru posiada atrybut:
 *
 * mask="000 - 000 - 000"
 *
 * dlatego je wykluczamy przez:
 *
 * input:not([mask])
 *
 * Dzięki temu numer wpisany po prawej stronie,
 * ale jeszcze niezapisany, nie zostanie
 * potraktowany jako zapisany telefon.
 */
export async function getSavedTeacherPhones(page: Page) {
  const values = await teacherContactDetails(page)
    .locator("input:not([mask])")
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );

  return values
    .map((value) => normalizeTeacherPhone(value))
    .filter((value) => value.length === 9);
}

/**
 * Sprawdza dokładny zestaw zapisanych
 * numerów telefonu.
 *
 * Kolejność nie ma znaczenia.
 */
export async function expectSavedTeacherPhones(
  page: Page,
  expectedPhones: string[],
) {
  const expected = expectedPhones
    .map((phone) => normalizeTeacherPhone(phone))
    .sort();

  await expect
    .poll(
      async () => {
        const actual = await getSavedTeacherPhones(page);

        return actual.sort();
      },
      {
        timeout: 20_000,
      },
    )
    .toEqual(expected);
}

/**
 * Sprawdza, że konkretny numer
 * znajduje się w zapisanych telefonach.
 */
export async function expectSavedTeacherPhone(page: Page, phone: string) {
  const expected = normalizeTeacherPhone(phone);

  await expect
    .poll(
      async () => {
        const phones = await getSavedTeacherPhones(page);

        return phones.includes(expected);
      },
      {
        timeout: 20_000,
      },
    )
    .toBe(true);
}

/**
 * Sprawdza, że konkretnego numeru
 * NIE MA w zapisanych telefonach.
 *
 * Numer może być jednocześnie wpisany
 * w prawym polu dodawania.
 *
 * To nadal oznacza, że NIE został zapisany.
 */
export async function expectTeacherPhoneNotSaved(page: Page, phone: string) {
  const expected = normalizeTeacherPhone(phone);

  await expect
    .poll(
      async () => {
        const phones = await getSavedTeacherPhones(page);

        return phones.includes(expected);
      },
      {
        timeout: 20_000,
      },
    )
    .toBe(false);
}

export async function openTeacherPhoneDeleteConfirmation(
  page: Page,
  index = 0,
) {
  const dialog = page.locator("mat-dialog-container").filter({
    hasText: "Czy na pewno chcesz usunąć telefon?",
  });

  /*
   * Jeżeli dialog z jakiegoś powodu
   * jest już otwarty, po prostu go zwracamy.
   */
  if (await dialog.isVisible().catch(() => false)) {
    return dialog;
  }

  const deleteButtons = teacherPhoneDeleteButtons(page);

  await expect(deleteButtons).toHaveCount(2);

  const deleteButton = deleteButtons.nth(index);

  await expect(deleteButton).toBeVisible();

  /*
   * Standardowe click() może być przechwytywane
   * przez Angular CDK overlay.
   *
   * Dlatego wykonujemy natywne kliknięcie DOM,
   * tak samo jak przy edycji e-maila.
   */
  await deleteButton.evaluate((element) => {
    (element as HTMLElement).click();
  });

  await expect(dialog).toBeVisible();

  await expect(dialog).toContainText("Czy na pewno chcesz usunąć telefon?");

  return dialog;
}

export async function confirmTeacherPhoneDelete(dialog: Locator) {
  const confirmButton = dialog.getByRole("button", {
    name: "Tak",
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherPhoneDelete(dialog: Locator) {
  const cancelButton = dialog.getByRole("button", {
    name: "Nie",
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await expect(cancelButton).toBeEnabled();

  await cancelButton.click();

  await expect(dialog).toHaveCount(0);
}

/**
 * Zwraca ikonki/przyciski usunięcia
 * zapisanych telefonów.
 *
 * Ten locator może wymagać doprecyzowania,
 * jeżeli Octopus używa innej nazwy ikony.
 */
export function teacherPhoneDeleteButtons(page: Page) {
  return teacherContactDetails(page)
    .locator("mat-icon")
    .filter({
      hasText: /^delete_outline$/,
    });
}

export async function expectTeacherPhoneHistoryChange(
  page: Page,
  action: "Dodany numer" | "Usunięty numer",
  phone: string,
) {
  const history = await openTeacherHistory(page);

  const normalizedPhone = normalizeTeacherPhone(phone);

  const row = history
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: action,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: normalizedPhone,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: "Edycja danych",
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  await expect(row).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  await expect(row.getByRole("gridcell").nth(2)).not.toHaveText("");

  return row;
}

export async function expectTeacherPhoneHistoryMissing(
  page: Page,
  action: "Dodany numer" | "Usunięty numer",
  phone: string,
) {
  const history = await openTeacherHistory(page);

  const normalizedPhone = normalizeTeacherPhone(phone);

  const row = history
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: action,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: normalizedPhone,
        exact: true,
      }),
    });

  await expect(row).toHaveCount(0);
}

export async function openTeacherEmailDeleteConfirmation(
  page: Page,
  emailDialog: Locator,
) {
  const deleteButton = emailDialog.getByRole("button", {
    name: "Usuń e-mail",
    exact: true,
  });

  await expect(deleteButton).toBeVisible();

  await expect(deleteButton).toBeEnabled();

  await deleteButton.click();

  const confirmDialog = page.locator("mat-dialog-container").filter({
    hasText: "Czy na pewno chcesz usunąć adres e-mail?",
  });

  await expect(confirmDialog).toBeVisible();

  return confirmDialog;
}

export async function confirmTeacherEmailDelete(dialog: Locator) {
  const confirmButton = dialog.getByRole("button", {
    name: "Tak",
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherEmailDelete(dialog: Locator) {
  const cancelButton = dialog.getByRole("button", {
    name: "Nie",
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await cancelButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function openTeacherMinimalRecordWarning(page: Page) {
  const dialog = page.locator("mat-dialog-container").filter({
    hasText: "Rekord nie będzie spełniał wymagań rekordu minimalnego",
  });

  await expect(dialog).toBeVisible();

  return dialog;
}

export async function confirmTeacherMinimalRecordWarning(dialog: Locator) {
  const confirmButton = dialog.getByRole("button", {
    name: "Tak",
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherMinimalRecordWarning(dialog: Locator) {
  const cancelButton = dialog.getByRole("button", {
    name: "Nie",
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await cancelButton.click();

  await expect(dialog).toHaveCount(0);
}

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

  const row = addressField.locator(
    'xpath=ancestor::*[contains(@class,"info-row")][1]',
  );

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

  await expect(confirmDialog).toContainText(
    "Czy na pewno chcesz usunąć adres szkoły?",
  );

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

/*
 * =========================================================
 * UWAGI / NOTATKI NAUCZYCIELA
 * =========================================================
 */

/**
 * Otwiera okno "Edycja Uwag".
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
  const cancelButton = dialog.getByRole("button", {
    name: "Anuluj",
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await cancelButton.click();

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

/*
 * =====================================================
 * HISTORIA ZMIAN
 * =====================================================
 */

export async function expectTeacherPrivateAddressHistoryChange(
  page: Page,
  history: Locator,
  field:
    | "Miasto adres prywatny"
    | "Numer adres prywatny"
    | "Ulica adres prywatny",
  value: string,
) {
  const row = history
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: field,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: value,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: "Edycja danych",
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  const cells = row.getByRole("gridcell");

  /*
   * 0 - Pole
   * 1 - Wartość
   * 2 - Autor
   * 3 - Źródło
   * 4 - Data
   */

  await expect(cells.nth(1)).toHaveText(value);

  await expect(cells.nth(2)).not.toHaveText("");

  await expect(cells.nth(3)).toHaveText("Edycja danych");

  await expect(cells.nth(4)).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  return row;
}

/*
 * =========================================================
 * ZGODY RODO
 * =========================================================
 */

export function teacherConsent(
  page: Page,
  name: "Marketing" | "E-mail" | "Telefon",
) {
  return page.getByRole("checkbox", {
    name,
    exact: true,
  });
}

/*
 * =========================================================
 * ZGODY RODO
 * =========================================================
 */

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
export function teacherRodoCheckbox(
  dialog: Locator,
  name: "Marketing" | "E-mail" | "Telefon",
) {
  return dialog.getByRole("checkbox", {
    name,
    exact: true,
  });
}

/*
 * Checkbox zgody widoczny na głównej kartotece.
 */
export function teacherRodoCheckboxOnCard(
  page: Page,
  name: "Marketing" | "E-mail" | "Telefon",
) {
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

export async function expectTeacherRodoHistoryChange(
  page: Page,
  history: Locator,
  field: "Zgoda Marketing" | "Zgoda Email" | "Zgoda Telefon",
  value: "Tak" | "Nie",
  source = "Karta nauczyciela",
) {
  const row = history
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: field,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: value,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("gridcell", {
        name: source,
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  const cells = row.getByRole("gridcell");

  /*
   * 0 - Pole
   * 1 - Wartość
   * 2 - Autor
   * 3 - Źródło
   * 4 - Data
   */

  await expect(cells.nth(0)).toHaveText(field);

  await expect(cells.nth(1)).toHaveText(value);

  await expect(cells.nth(2)).not.toHaveText("");

  await expect(cells.nth(3)).toHaveText(source);

  await expect(cells.nth(4)).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  return row;
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
