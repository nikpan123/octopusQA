import { expect, type Locator, type Page } from "@playwright/test";

export const MATH_SP_CLASSES = ["4", "5", "6", "7", "8"] as const;
export const PHYSICS_SP_OWN_CLASSES = ["7", "8", "7TNŚ", "8TNŚ"] as const;
export const PHYSICS_SP_FOREIGN_CLASSES = ["7", "8"] as const;
export const MATH_SECONDARY_OWN_CLASSES = [
  "1P",
  "2P",
  "3P",
  "4P",
  "5P",
  "1R",
  "2R",
  "3R",
  "4R",
  "5R",
] as const;
export const MATH_SECONDARY_FOREIGN_CLASSES = ["1", "2", "3", "4", "5"] as const;

export function confirmations(page: Page) {
  return page.getByRole("tabpanel", {
    name: "Potwierdzenia",
    exact: true,
  });
}

export function subjects(page: Page) {
  return page.locator("app-teacher-subjects");
}

export function clubForm(page: Page) {
  return page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: "Formularz klubowy",
      exact: true,
    }),
  });
}

export function ownClasses(form: Locator) {
  return form.locator(".green-box");
}

export function foreignClasses(form: Locator) {
  return form.locator(".red-box");
}

export function ownClass(form: Locator, classNumber: string) {
  return ownClasses(form).getByRole("checkbox", {
    name: classNumber,
    exact: true,
  });
}

export function foreignClass(form: Locator, classNumber: string) {
  return foreignClasses(form).getByRole("checkbox", {
    name: classNumber,
    exact: true,
  });
}

export function ownSelectAll(form: Locator) {
  return ownClasses(form).getByRole("checkbox", {
    name: "Zaznacz wszystkie możliwe (nasze)",
    exact: true,
  });
}

export function foreignSelectAll(form: Locator) {
  return foreignClasses(form).getByRole("checkbox", {
    name: "Zaznacz wszystkie możliwe (obce)",
    exact: true,
  });
}

export function schoolYears(form: Locator) {
  return form.locator("mat-radio-button");
}

export async function selectedSchoolYear(form: Locator) {
  const checkedRadio = form.getByRole("radio", { checked: true });

  await expect(checkedRadio).toHaveCount(1);

  return (await checkedRadio.locator("xpath=ancestor::mat-radio-button[1]").innerText()).trim();
}

export async function selectSchoolYear(form: Locator, schoolYear: string) {
  const option = schoolYears(form).filter({ hasText: schoolYear });

  await expect(option).toHaveCount(1);
  await option.getByRole("radio").check();
  expect(await selectedSchoolYear(form)).toBe(schoolYear);
}

export function confirmationRow(page: Page, confirmationId: string) {
  return confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    });
}

export async function addTeacherSubjectLevel(
  page: Page,
  subject: string,
  levelOption: string,
  levelCode: string,
) {
  const container = subjects(page);

  const row = container.getByRole("row").filter({
    has: page.getByRole("cell", {
      name: subject,
      exact: true,
    }),
  });

  await container.getByRole("combobox").nth(0).click();

  await page
    .getByRole("option", {
      name: subject,
      exact: true,
    })
    .click();

  await container.getByRole("combobox").nth(1).click();

  await page
    .getByRole("option", {
      name: levelOption,
      exact: true,
    })
    .click();

  await container
    .getByRole("button", {
      name: "Dodaj",
      exact: true,
    })
    .click();

  await expect(
    row.getByRole("cell", {
      name: levelCode,
      exact: true,
    }),
  ).toBeVisible();

  return row;
}

export async function addMathSp(page: Page) {
  return addTeacherSubjectLevel(page, "Matematyka", "Szkoła Podstawowa", "SP");
}

export async function openNewClubForm(page: Page, expectedSubject: string | null = "Matematyka") {
  await confirmations(page)
    .getByRole("button", {
      name: "Dodaj formularz",
      exact: true,
    })
    .click();

  const form = clubForm(page);

  await expect(form).toBeVisible();

  const schoolYear = await selectedSchoolYear(form);

  expect(schoolYear).toMatch(/^\d{4}\/\d{4}$/);

  if (expectedSubject) {
    await expect(form.getByRole("combobox").first()).toHaveText(expectedSubject);
  }

  return {
    form,
    schoolYear,
  };
}

export async function selectClubSubject(page: Page, form: Locator, subject: string) {
  const select = form.getByRole("combobox").first();

  await select.click();
  await page.getByRole("option", { name: subject, exact: true }).click();
  await expect(select).toHaveText(subject);
}

export async function selectSchool(form: Locator, schoolName: string) {
  const row = form.getByRole("row").filter({
    hasText: schoolName,
  });

  await expect(row).toBeVisible();

  const checkbox = row.getByRole("checkbox");

  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }

  return row;
}

export async function disableTeacherEmail(form: Locator) {
  const email = form.getByRole("checkbox", {
    name: "Wysłać maila do nauczyciela",
    exact: true,
  });

  if (await email.isChecked()) {
    await email.uncheck();
  }

  await expect(email).not.toBeChecked();
}

export async function selectForeignPublisher(page: Page, form: Locator) {
  const publisher = foreignClasses(form).getByRole("combobox");

  await publisher.click();

  const option = page
    .getByRole("option")
    .filter({
      hasNotText: /^wybierz$/i,
    })
    .first();

  await expect(option).toBeVisible();

  const publisherName = (await option.innerText()).trim();

  expect(publisherName).not.toBe("");

  await option.click();

  return publisherName;
}

export async function saveClubForm(page: Page, form: Locator, subject = "Matematyka") {
  const rows = confirmations(page)
    .getByRole("row", { includeHidden: true })
    .filter({
      has: page.getByRole("cell", {
        name: subject,
        exact: true,
        includeHidden: true,
      }),
    });
  const previousIds = new Set<string>();

  for (let index = 0; index < (await rows.count()); index += 1) {
    previousIds.add((await rows.nth(index).getByRole("cell").nth(1).innerText()).trim());
  }

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);

  await expect(rows).toHaveCount(previousIds.size + 1);

  let confirmationId = "";
  for (let index = 0; index < (await rows.count()); index += 1) {
    const id = (await rows.nth(index).getByRole("cell").nth(1).innerText()).trim();
    if (!previousIds.has(id)) confirmationId = id;
  }

  expect(confirmationId).toMatch(/^\d+$/);

  return confirmationId;
}

export async function openClubEdit(page: Page, confirmationId: string) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);

  // Najpierw trzeba zaznaczyć wiersz,
  // żeby przycisk Edytuj został aktywowany.
  await row.click();

  const editButton = confirmations(page).getByRole("button", {
    name: "Edytuj",
    exact: true,
  });

  await expect(editButton).toBeEnabled();

  await editButton.click();

  const form = clubForm(page);

  await expect(form).toBeVisible();

  return form;
}

export async function saveClubEdit(form: Locator) {
  const save = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(save).toBeEnabled();

  await save.click();

  await expect(form).toHaveCount(0);
}

export async function cancelClubForm(form: Locator) {
  await form
    .getByRole("button", {
      name: "Anuluj",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);
}

export async function confirmationDetails(page: Page, confirmationId: string) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);

  await row
    .locator("mat-icon")
    .filter({
      hasText: "keyboard_arrow_down",
    })
    .click();

  return confirmations(page)
    .locator("app-form-clubs-inner-table")
    .getByRole("row")
    .filter({
      has: page.getByRole("cell"),
    });
}

export async function confirmDeleteIfShown(page: Page) {
  const dialog = page.locator("mat-dialog-container").last();

  const appeared = await dialog
    .waitFor({
      state: "visible",
      timeout: 1500,
    })
    .then(() => true)
    .catch(() => false);

  if (!appeared) {
    return;
  }

  const confirm = dialog.getByRole("button", {
    name: /^(Tak|Usuń|OK)$/,
  });

  await expect(confirm).toBeVisible();

  await confirm.click();

  await expect(dialog).toHaveCount(0);
}
