import { expect, type Locator, type Page } from "@playwright/test";

export type TeacherSource =
  | "Formularz klubowy"
  | "Karta LS"
  | "Karta nauczyciela";

export type TeacherConsent = "Marketing" | "E-mail" | "Telefon";

/*
 * =========================================================
 * FORMULARZ DODAWANIA NAUCZYCIELA
 * =========================================================
 */

export async function openNewTeacherForm(page: Page) {
  await page
    .getByRole("button", {
      name: "Dodaj",
      exact: true,
    })
    .click();

  const form = page
    .locator("mat-dialog-container")
    .filter({
      has: page.getByRole("heading", {
        name: "Dodaj nowego nauczyciela",
        exact: true,
      }),
    })
    .last();

  await expect(form).toBeVisible();

  return form;
}

/*
 * =========================================================
 * POLA PODSTAWOWE
 * =========================================================
 */

function inputNearLabel(form: Locator, label: string) {
  return form
    .getByText(label, {
      exact: true,
    })
    .locator('xpath=ancestor::*[.//input[not(@type="checkbox")]][1]')
    .locator('input:not([type="checkbox"])')
    .first();
}

export function newTeacherLastNameInput(form: Locator) {
  return inputNearLabel(form, "*Nazwisko");
}

export function newTeacherFirstNameInput(form: Locator) {
  return inputNearLabel(form, "*Imię");
}

export function newTeacherEmailInput(form: Locator) {
  return form
    .locator(".new-teacher__personal-input")
    .filter({
      hasText: "E-mail",
    })
    .locator("input")
    .first();
}

export function newTeacherPhoneInput(form: Locator) {
  return form.getByPlaceholder("___-___-___", {
    exact: true,
  });
}

export function newTeacherBirthDateInput(form: Locator) {
  /*
   * W formularzu dodawania nauczyciela
   * pole daty ma przycisk datepickera.
   *
   * Szukamy najpierw datepicker-toggle
   * WEWNĄTRZ modala, a następnie jego
   * najbliższego kontenera zawierającego input.
   *
   * Dzięki temu nie trafimy w:
   * - Nazwisko,
   * - checkbox AG Grid,
   * - pole daty z kartoteki w tle.
   */

  const datePickerToggle = form.locator("mat-datepicker-toggle").first();

  return datePickerToggle
    .locator('xpath=ancestor::*[.//input[not(@type="checkbox")]][1]')
    .locator('input:not([type="checkbox"]):not([disabled])')
    .first();
}

/*
 * =========================================================
 * ŹRÓDŁO
 * =========================================================
 */

export function newTeacherSourceSelect(form: Locator) {
  const label = form.getByText(/Źródło danych nauczyciela/).first();

  return label.locator('xpath=following::*[@role="combobox"][1]');
}

export async function selectNewTeacherSource(
  page: Page,
  form: Locator,
  source: TeacherSource,
) {
  const select = newTeacherSourceSelect(form);

  await expect(select).toBeVisible();

  await select.click();

  const option = page.getByRole("option", {
    name: source,
    exact: true,
  });

  await expect(option).toBeVisible();

  await option.click();

  await expect(select).toContainText(source);
}

/*
 * =========================================================
 * RODO
 * =========================================================
 */

export function newTeacherConsentCheckbox(form: Locator, name: TeacherConsent) {
  return form.getByRole("checkbox", {
    name,
    exact: true,
  });
}

export async function setNewTeacherConsent(
  form: Locator,
  name: TeacherConsent,
  checked: boolean,
) {
  const checkbox = newTeacherConsentCheckbox(form, name);

  await expect(checkbox).toBeVisible();

  if (checked) {
    await checkbox.check();

    await expect(checkbox).toBeChecked();
  } else {
    await checkbox.uncheck();

    await expect(checkbox).not.toBeChecked();
  }
}

/*
 * =========================================================
 * PRZEDMIOTO-POZIOMY
 * =========================================================
 */

export function newTeacherSubjectSelect(form: Locator) {
  return form
    .getByText("Przedmiot:", {
      exact: true,
    })
    .locator('xpath=following::*[@role="combobox"][1]');
}

export function newTeacherLevelSelect(form: Locator) {
  return form
    .getByText("Poziom:", {
      exact: true,
    })
    .locator('xpath=following::*[@role="combobox"][1]');
}

export function newTeacherSubjectAddButton(form: Locator) {
  return form.getByRole("button", {
    name: "Dodaj",
    exact: true,
  });
}

export function newTeacherSubjectLevelRow(
  form: Locator,
  subject: string,
  level: string,
) {
  return form
    .getByRole("row")
    .filter({
      hasText: subject,
    })
    .filter({
      hasText: level,
    });
}

/*
 * Tekst widoczny w tabeli po zapisie
 * nie zawsze jest identyczny z nazwą
 * opcji w dropdownie.
 *
 * Przykład:
 *
 * dropdown:
 * Szkoła Podstawowa
 *
 * tabela:
 * SP
 */
function newTeacherLevelOptionName(level: string) {
  switch (level) {
    case "SP":
      return "Szkoła Podstawowa";

    case "SŚ":
      return "Szkoła Średnia";

    default:
      return level;
  }
}

export async function selectNewTeacherSubject(
  page: Page,
  form: Locator,
  subject: string,
) {
  const select = newTeacherSubjectSelect(form);

  await expect(select).toBeVisible();

  await select.click();

  const option = page.getByRole("option", {
    name: subject,
    exact: true,
  });

  await expect(option).toBeVisible();

  await option.click();
}

export async function selectNewTeacherLevel(
  page: Page,
  form: Locator,
  level: string,
) {
  const select = newTeacherLevelSelect(form);

  await expect(select).toBeVisible();

  await select.click();

  const optionName = newTeacherLevelOptionName(level);

  const option = page.getByRole("option", {
    name: optionName,
    exact: true,
  });

  await expect(option).toBeVisible();

  await option.click();
}

export async function addNewTeacherSubjectLevel(
  page: Page,
  form: Locator,
  subject: string,
  level: string,
) {
  await selectNewTeacherSubject(page, form, subject);

  await selectNewTeacherLevel(page, form, level);

  const add = newTeacherSubjectAddButton(form);

  await expect(add).toBeVisible();

  await expect(add).toBeEnabled();

  await add.click();

  /*
   * W tabeli sprawdzamy skrót poziomu,
   * np. SP.
   */
  await expect(newTeacherSubjectLevelRow(form, subject, level)).toHaveCount(1);
}

/*
 * =========================================================
 * SZKOŁY
 * =========================================================
 */

export function newTeacherSchoolRow(form: Locator, schoolName: string) {
  return form.getByRole("row").filter({
    hasText: schoolName,
  });
}

export async function removeSchoolFromNewTeacher(
  form: Locator,
  schoolName: string,
) {
  const row = newTeacherSchoolRow(form, schoolName);

  await expect(row).toHaveCount(1);

  const deleteAction = row.getByText("Usuń", {
    exact: true,
  });

  if ((await deleteAction.count()) > 0) {
    await deleteAction.click();
  } else {
    await row.getByRole("gridcell").first().click();
  }

  await expect(newTeacherSchoolRow(form, schoolName)).toHaveCount(0);
}

/*
 * =========================================================
 * ZAPIS / OSTRZEŻENIA
 * =========================================================
 */

export function newTeacherSaveButton(form: Locator) {
  return form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });
}

export function newTeacherCancelButton(form: Locator) {
  return form.getByRole("button", {
    name: "Anuluj",
    exact: true,
  });
}

export async function openNoSubjectLevelWarning(page: Page) {
  const warning = page
    .locator("mat-dialog-container")
    .filter({
      hasText:
        "Nie dodałeś przedmioto-poziomu, czy mimo to chcesz zapisać rekord?",
    })
    .last();

  await expect(warning).toBeVisible();

  return warning;
}

export async function confirmNoSubjectLevelWarning(warning: Locator) {
  await warning
    .getByRole("button", {
      name: "Tak",
      exact: true,
    })
    .click();

  await expect(warning).toHaveCount(0);
}

export async function cancelNoSubjectLevelWarning(warning: Locator) {
  await warning
    .getByRole("button", {
      name: "Nie",
      exact: true,
    })
    .click();

  await expect(warning).toHaveCount(0);
}

export async function expectContactRequiredWarning(page: Page) {
  const warning = page
    .locator("mat-dialog-container")
    .filter({
      hasText:
        "Email lub numer telefonu jest obowiązkowym polem podczas rejestracji rekordu nauczyciela.",
    })
    .last();

  await expect(warning).toBeVisible();

  await expect(warning).toContainText("Proszę uzupełnić wybrane pole.");

  return warning;
}

export async function closeContactRequiredWarning(warning: Locator) {
  await warning
    .getByRole("button", {
      name: "OK",
      exact: true,
    })
    .click();

  await expect(warning).toHaveCount(0);
}

export async function saveNewTeacherWithoutSubjectLevel(
  page: Page,
  form: Locator,
) {
  await newTeacherSaveButton(form).click();

  const warning = await openNoSubjectLevelWarning(page);

  await confirmNoSubjectLevelWarning(warning);

  await expect(form).toHaveCount(0);

  await expect(page).toHaveURL(/\/teacher\/teacher-panel\/\d+$/);

  return page.url().split("/").pop()!;
}

export async function saveNewTeacherWithSubjectLevel(
  page: Page,
  form: Locator,
) {
  await newTeacherSaveButton(form).click();

  await expect(form).toHaveCount(0);

  await expect(page).toHaveURL(/\/teacher\/teacher-panel\/\d+$/);

  return page.url().split("/").pop()!;
}

export async function expectEmailAlreadyInUseWarning(page: Page) {
  const warning = page
    .locator("mat-dialog-container")
    .filter({
      hasText: "Email aktualnie w użyciu.",
    })
    .last();

  await expect(warning).toBeVisible();

  await expect(warning).toContainText("Email aktualnie w użyciu.");

  return warning;
}

export async function closeEmailAlreadyInUseWarning(warning: Locator) {
  const okButton = warning.getByRole("button", {
    name: "OK",
    exact: true,
  });

  await expect(okButton).toBeVisible();

  await okButton.click();

  await expect(warning).toHaveCount(0);
}

export async function expectDuplicateTeacherSubjectWarning(page: Page) {
  const warning = page
    .locator("mat-dialog-container")
    .filter({
      hasText: "Wybrany przedmiot istnieje na liście przedmiotów nauczyciela",
    })
    .last();

  await expect(warning).toBeVisible();

  await expect(warning).toContainText(
    "Wybrany przedmiot istnieje na liście przedmiotów nauczyciela",
  );

  return warning;
}

export async function closeDuplicateTeacherSubjectWarning(warning: Locator) {
  const okButton = warning.getByRole("button", {
    name: "OK",
    exact: true,
  });

  await expect(okButton).toBeVisible();

  await okButton.click();

  await expect(warning).toHaveCount(0);
}

/*
 * =========================================================
 * HISTORIA
 * =========================================================
 */

export async function expectTeacherCreationHistoryChange(
  page: Page,
  history: Locator,
  field: string,
  value: string,
  source?: string,
) {
  let row = history
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
    });

  if (source) {
    row = row.filter({
      has: page.getByRole("gridcell", {
        name: source,
        exact: true,
      }),
    });
  }

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

  await expect(cells.nth(2)).not.toHaveText(/^\s*$/);

  if (source) {
    await expect(cells.nth(3)).toHaveText(source);
  }

  await expect(cells.nth(4)).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  return row;
}

/*
 * =========================================================
 * PODOBNE OSOBY
 * =========================================================
 */

export function similarTeacherRow(form: Locator, teacherId: string) {
  const idCell = form.getByRole("gridcell", {
    name: teacherId,
    exact: true,
  });

  return idCell.locator('xpath=ancestor::*[@role="row"][1]');
}

export async function showSimilarTeacher(form: Locator, teacherId: string) {
  const row = similarTeacherRow(form, teacherId);

  await expect(row).toHaveCount(1);

  /*
   * Pierwsza komórka to akcja "Pokaż".
   * W UI nie ma tekstu "Pokaż",
   * tylko ikona person.
   */
  const showCell = row.getByRole("gridcell").first();

  await expect(showCell).toBeVisible();

  await showCell.click();

  /*
   * Formularz dodawania powinien się zamknąć.
   */
  await expect(form).toHaveCount(0);
}

/*
 * =========================================================
 * WERYFIKACJA PRZEDMIOTO-POZIOMU PO ZAPISIE
 * =========================================================
 */

export async function expectTeacherSubjectLevelOnCard(
  page: Page,
  subject: string,
  level: string,
) {
  /*
   * Sprawdzamy główną tabelę
   * "Przedmioto - poziomy".
   *
   * Nie korzystamy z zakładki
   * "Z czego uczy", ponieważ tam
   * przedmioty są prezentowane skrótami,
   * np.:
   *
   * Matematyka -> MAT
   */

  const container = page.locator("app-teacher-subjects");

  await expect(container).toBeVisible();

  const row = container.getByRole("row").filter({
    has: page.getByRole("cell", {
      name: subject,
      exact: true,
    }),
  });

  await expect(row).toHaveCount(1);

  await expect(
    row.getByRole("cell", {
      name: subject,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    row.getByRole("cell", {
      name: level,
      exact: true,
    }),
  ).toBeVisible();

  return row;
}

/*
 * =========================================================
 * DATY
 * =========================================================
 */

export function formatDateDDMMYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export function tomorrowDDMMYYYY() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return formatDateDDMMYYYY(date);
}
