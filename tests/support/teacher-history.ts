import { expect, type Locator, type Page } from "@playwright/test";
import { normalizeTeacherPhone } from "./teacher-contact";

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

export async function expectTeacherHistoryChange(page: Page, field: string, value: string) {
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

export async function expectTeacherHistorySnapshot(page: Page, expectedRows: string[]) {
  const history = await openTeacherHistory(page);

  await expect(history.getByRole("row")).toHaveText(expectedRows);
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

export async function expectTeacherPrivateAddressHistoryChange(
  page: Page,
  history: Locator,
  field: "Miasto adres prywatny" | "Numer adres prywatny" | "Ulica adres prywatny",
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
