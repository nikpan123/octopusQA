import { expect, type Locator, type Page } from '@playwright/test';

import { openTeacherHistory } from './teacher-history';

/*
 * =========================================================
 * E-MAIL
 * =========================================================
 */

export async function openTeacherEmailEdit(page: Page) {
  const spinner = page.locator('#spinner');

  await spinner
    .waitFor({
      state: 'hidden',
      timeout: 20_000,
    })
    .catch(() => {
      // spinner może nie istnieć
    });

  const emailField = page.locator('mat-form-field#email');

  await expect(emailField).toBeVisible();

  const row = emailField.locator('xpath=ancestor::*[contains(@class,"info-row")][1]');

  await expect(row).toBeVisible();

  const editIcon = row.locator('mat-icon').filter({
    hasText: /^edit$/,
  });

  await expect(editIcon).toHaveCount(1);

  await expect(editIcon).toBeVisible();

  await editIcon.evaluate((element) => {
    (element as HTMLElement).click();
  });

  const dialog = page.locator('mat-dialog-container').filter({
    has: page.getByRole('heading', {
      name: 'Edycja e-mail',
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
  return page.locator('app-contact-details');
}

/**
 * Pole po prawej stronie,
 * służące do wpisania nowego numeru.
 *
 * Potwierdzony DOM:
 * mask="000 - 000 - 000"
 */
export function teacherNewPhoneInput(page: Page) {
  return teacherContactDetails(page).locator('input[mask="000 - 000 - 000"]').last();
}

/**
 * Przycisk Dodaj telefonu.
 */
export function teacherPhoneAddButton(page: Page) {
  return teacherContactDetails(page).getByRole('button', {
    name: 'Dodaj',
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
  return value.replace(/\D/g, '');
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
    .locator('input:not([mask])')
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

  return values.map((value) => normalizeTeacherPhone(value)).filter((value) => value.length === 9);
}

/**
 * Sprawdza dokładny zestaw zapisanych
 * numerów telefonu.
 *
 * Kolejność nie ma znaczenia.
 */
export async function expectSavedTeacherPhones(page: Page, expectedPhones: string[]) {
  const expected = expectedPhones.map((phone) => normalizeTeacherPhone(phone)).sort();

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

export async function openTeacherPhoneDeleteConfirmation(page: Page, index = 0) {
  const dialog = page.locator('mat-dialog-container').filter({
    hasText: 'Czy na pewno chcesz usunąć telefon?',
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

  await expect(dialog).toContainText('Czy na pewno chcesz usunąć telefon?');

  return dialog;
}

export async function confirmTeacherPhoneDelete(dialog: Locator) {
  const confirmButton = dialog.getByRole('button', {
    name: 'Tak',
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherPhoneDelete(dialog: Locator) {
  const cancelButton = dialog.getByRole('button', {
    name: 'Nie',
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
    .locator('mat-icon')
    .filter({
      hasText: /^delete_outline$/,
    });
}

export async function expectTeacherPhoneHistoryChange(
  page: Page,
  action: 'Dodany numer' | 'Usunięty numer',
  phone: string,
) {
  const history = await openTeacherHistory(page);

  const normalizedPhone = normalizeTeacherPhone(phone);

  const row = history
    .getByRole('row')
    .filter({
      has: page.getByRole('gridcell', {
        name: action,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole('gridcell', {
        name: normalizedPhone,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole('gridcell', {
        name: 'Edycja danych',
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  await expect(row).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  await expect(row.getByRole('gridcell').nth(2)).not.toHaveText('');

  return row;
}

export async function expectTeacherPhoneHistoryMissing(
  page: Page,
  action: 'Dodany numer' | 'Usunięty numer',
  phone: string,
) {
  const history = await openTeacherHistory(page);

  const normalizedPhone = normalizeTeacherPhone(phone);

  const row = history
    .getByRole('row')
    .filter({
      has: page.getByRole('gridcell', {
        name: action,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole('gridcell', {
        name: normalizedPhone,
        exact: true,
      }),
    });

  await expect(row).toHaveCount(0);
}

export async function openTeacherEmailDeleteConfirmation(page: Page, emailDialog: Locator) {
  const deleteButton = emailDialog.getByRole('button', {
    name: 'Usuń e-mail',
    exact: true,
  });

  await expect(deleteButton).toBeVisible();

  await expect(deleteButton).toBeEnabled();

  await deleteButton.click();

  const confirmDialog = page.locator('mat-dialog-container').filter({
    hasText: 'Czy na pewno chcesz usunąć adres e-mail?',
  });

  await expect(confirmDialog).toBeVisible();

  return confirmDialog;
}

export async function confirmTeacherEmailDelete(dialog: Locator) {
  const confirmButton = dialog.getByRole('button', {
    name: 'Tak',
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherEmailDelete(dialog: Locator) {
  const cancelButton = dialog.getByRole('button', {
    name: 'Nie',
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await cancelButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function openTeacherMinimalRecordWarning(page: Page) {
  const dialog = page.locator('mat-dialog-container').filter({
    hasText: 'Rekord nie będzie spełniał wymagań rekordu minimalnego',
  });

  await expect(dialog).toBeVisible();

  return dialog;
}

export async function confirmTeacherMinimalRecordWarning(dialog: Locator) {
  const confirmButton = dialog.getByRole('button', {
    name: 'Tak',
    exact: true,
  });

  await expect(confirmButton).toBeVisible();

  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();

  await expect(dialog).toHaveCount(0);
}

export async function cancelTeacherMinimalRecordWarning(dialog: Locator) {
  const cancelButton = dialog.getByRole('button', {
    name: 'Nie',
    exact: true,
  });

  await expect(cancelButton).toBeVisible();

  await cancelButton.click();

  await expect(dialog).toHaveCount(0);
}
