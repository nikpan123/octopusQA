import { expect, type Locator, type Page } from "@playwright/test";

export const MATH_SP_CLASSES = ["4", "5", "6", "7", "8"] as const;

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

export async function addMathSp(page: Page) {
  const container = subjects(page);

  const row = container.getByRole("row").filter({
    has: page.getByRole("cell", {
      name: "Matematyka",
      exact: true,
    }),
  });

  await container.getByRole("combobox").nth(0).click();

  await page
    .getByRole("option", {
      name: "Matematyka",
      exact: true,
    })
    .click();

  await container.getByRole("combobox").nth(1).click();

  await page
    .getByRole("option", {
      name: "Szkoła Podstawowa",
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
      name: "SP",
      exact: true,
    }),
  ).toBeVisible();

  return row;
}

export async function openNewClubForm(page: Page) {
  await confirmations(page)
    .getByRole("button", {
      name: "Dodaj formularz",
      exact: true,
    })
    .click();

  const form = clubForm(page);

  await expect(form).toBeVisible();

  const schoolYear = (
    await form
      .locator("mat-radio-button")
      .filter({
        has: page.getByRole("radio", {
          checked: true,
        }),
      })
      .innerText()
  ).trim();

  expect(schoolYear).toMatch(/^\d{4}\/\d{4}$/);

  await expect(form.getByRole("combobox").first()).toHaveText("Matematyka");

  return {
    form,
    schoolYear,
  };
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

export async function saveClubForm(page: Page, form: Locator) {
  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);

  const row = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  const confirmationId = (await row.getByRole("cell").nth(1).innerText()).trim();

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
