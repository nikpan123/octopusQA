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
const SUPPORTING_SUBJECTS = [
  "Język polski",
  "Matematyka",
  "Historia",
  "Fizyka",
  "Biologia",
  "Edukacja wczesnoszkolna",
  "Przyroda",
  "Geografia",
] as const;

const confirmationIdsBeforeNewForm = new WeakMap<Locator, Set<string>>();

async function readConfirmationIds(rows: Locator) {
  const ids = new Set<string>();

  for (let index = 0; index < (await rows.count()); index += 1) {
    const cells = rows.nth(index).getByRole("cell");

    // Lista zawiera również wiersz nagłówka (columnheader) oraz techniczne
    // wiersze szczegółów. Nie próbujemy odczytywać z nich drugiej komórki.
    if ((await cells.count()) < 2) continue;

    const id = ((await cells.nth(1).textContent()) ?? "").trim();
    if (/^\d+$/.test(id)) ids.add(id);
  }

  return ids;
}

export function confirmations(page: Page) {
  return page.getByRole("tabpanel", {
    name: "Potwierdzenia",
    exact: true,
  });
}

export function subjects(page: Page) {
  return page.locator("app-teacher-subjects");
}

export function subjectLevelRow(page: Page, subject = "Matematyka") {
  return subjects(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", { name: subject, exact: true }),
    });
}

export function teacherSchoolRow(page: Page, schoolName: string) {
  return page.getByRole("row").filter({
    has: page.getByRole("gridcell", { name: schoolName, exact: true }),
  });
}

export function teacherSchoolPublisherCell(page: Page, schoolName: string) {
  return teacherSchoolRow(page, schoolName).getByRole("gridcell").nth(8);
}

export function teacherSchoolFunctionCell(page: Page, schoolName: string) {
  return teacherSchoolRow(page, schoolName).getByRole("gridcell").nth(10);
}

export function clubForm(page: Page) {
  return page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: "Formularz klubowy",
      exact: true,
    }),
  });
}

export function supportingClubForm(page: Page) {
  return page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: "Formularz klubowy dla nauczycieli wspomagających",
      exact: true,
    }),
  });
}

export function supportingClubEditForm(page: Page) {
  return page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", {
      name: /^Formularz klubowy - nauczyciel wspomag/,
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

export function deletedConfirmationIcon(page: Page, confirmationId: string) {
  return confirmationRow(page, confirmationId).getByRole("cell").nth(2).locator("mat-icon");
}

export async function deleteClubConfirmation(page: Page, confirmationId: string) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);
  await row.click();

  const deleteButton = confirmations(page).getByRole("button", {
    name: "Usuń",
    exact: true,
  });

  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();
  await confirmDeleteIfShown(page);

  // Kontrolujemy stan zwrócony ponownie przez serwer, a nie tylko
  // optymistyczną aktualizację wiersza po kliknięciu przycisku.
  await page.reload();
  await expect(confirmations(page)).toBeVisible();
  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveText("backspace");
}

export async function requestClubRestore(page: Page, confirmationId: string) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);
  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveText("backspace");
  await row.click();

  const restoreButton = confirmations(page).getByRole("button", {
    name: "Przywróć",
    exact: true,
  });

  await expect(restoreButton).toBeEnabled();
  await restoreButton.click();
}

export async function restoreClubConfirmation(page: Page, confirmationId: string) {
  await requestClubRestore(page, confirmationId);

  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveCount(0);

  // Ponowne wczytanie potwierdza stan zapisany na serwerze, a nie wyłącznie
  // zmianę w aktualnym modelu tabeli.
  await page.reload();
  await expect(confirmations(page)).toBeVisible();
  await expect(deletedConfirmationIcon(page, confirmationId)).toHaveCount(0);
}

export async function negativelyVerifyClubConfirmation(
  page: Page,
  confirmationId: string,
  subject = "Matematyka",
) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);
  await row.click();

  const verifyButton = confirmations(page).getByRole("button", {
    name: "Weryfikuj neg.",
    exact: true,
  });

  await expect(verifyButton).toBeEnabled();
  await verifyButton.click();
  await expect(
    subjectLevelRow(page, subject).getByRole("cell", { name: "Obcy", exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(confirmations(page)).toBeVisible();
  await expect(
    subjectLevelRow(page, subject).getByRole("cell", { name: "Obcy", exact: true }),
  ).toBeVisible();
}

export function clubHistoryDialog(page: Page) {
  return page.locator("mat-dialog-container").filter({
    has: page.getByRole("heading", { name: /^Historia oświadczeń\s*-/ }),
  });
}

export function clubHistoryRows(page: Page, history: Locator) {
  return history.getByRole("row").filter({ has: page.getByRole("gridcell") });
}

export function clubHistoryEntry(
  page: Page,
  history: Locator,
  options: { className?: string; modification: string | RegExp },
) {
  let rows = clubHistoryRows(page, history).filter({
    has: page.getByRole("gridcell", {
      name: options.modification,
      exact: typeof options.modification === "string",
    }),
  });

  if (options.className) {
    rows = rows.filter({
      has: page.getByRole("gridcell", { name: options.className, exact: true }),
    });
  }

  return rows;
}

export async function openClubHistory(page: Page, confirmationId: string) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);
  await row.click();

  const historyButton = confirmations(page).getByRole("button", {
    name: "Historia",
    exact: true,
  });

  await expect(historyButton).toBeEnabled();
  await historyButton.click();

  const history = clubHistoryDialog(page);
  await expect(history).toBeVisible();
  await expect(clubHistoryRows(page, history).first()).toBeVisible();

  return history;
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
  const previousIds = await readConfirmationIds(
    confirmations(page).getByRole("row", { includeHidden: true }),
  );

  await confirmations(page)
    .getByRole("button", {
      name: "Dodaj formularz",
      exact: true,
    })
    .click();

  const form = clubForm(page);

  await expect(form).toBeVisible();

  confirmationIdsBeforeNewForm.set(form, previousIds);

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

export async function openNewSupportingClubForm(page: Page) {
  const previousIds = await readConfirmationIds(
    confirmations(page).getByRole("row", { includeHidden: true }),
  );

  await confirmations(page)
    .getByRole("button", {
      name: "Dodaj form. wspom",
      exact: true,
    })
    .click();

  const form = supportingClubForm(page);
  await expect(form).toBeVisible();
  confirmationIdsBeforeNewForm.set(form, previousIds);

  const schoolYear = await selectedSchoolYear(form);
  expect(schoolYear).toMatch(/^\d{4}\/\d{4}$/);

  return { form, schoolYear };
}

export async function selectSupportingSchool(page: Page, form: Locator, schoolName: string) {
  const school = form.getByRole("combobox").first();

  await school.click();
  const option = page.getByRole("option").filter({ hasText: schoolName });
  await expect(option).toHaveCount(1);
  await option.click();
  await expect(school).toContainText(schoolName);
}

export function supportingSubject(form: Locator, subject: string) {
  return form.getByRole("checkbox", { name: subject, exact: true });
}

async function supportingSubjectBox(
  form: Locator,
  subject: string,
  box: ".green-box" | ".red-box",
) {
  const subjectCheckbox = supportingSubject(form, subject);

  // Formularz dodawania może zawierać kilka przedmiotów i ich sekcji.
  // W edycji przedmiot jest readonly, nie ma checkboxa i istnieje jedna sekcja.
  if ((await subjectCheckbox.count()) === 0) {
    await expect(form.getByRole("textbox").nth(1)).toHaveValue(`${subject} - WSPOM`);
    const editBox = form.locator(box).first();
    await expect(editBox).toBeVisible();
    return editBox;
  }

  const subjectIndex = SUPPORTING_SUBJECTS.indexOf(subject as (typeof SUPPORTING_SUBJECTS)[number]);
  expect(subjectIndex, `Nieznany przedmiot WSPOM: ${subject}`).toBeGreaterThanOrEqual(0);
  await expect(subjectCheckbox).toBeChecked();

  let selectedBefore = 0;
  for (const earlierSubject of SUPPORTING_SUBJECTS.slice(0, subjectIndex)) {
    if (await supportingSubject(form, earlierSubject).isChecked()) selectedBefore += 1;
  }

  const subjectBox = form.locator(box).nth(selectedBefore);
  await expect(subjectBox).toBeVisible();
  return subjectBox;
}

export async function supportingOwnClasses(form: Locator, subject: string) {
  return supportingSubjectBox(form, subject, ".green-box");
}

export async function supportingForeignClasses(form: Locator, subject: string) {
  return supportingSubjectBox(form, subject, ".red-box");
}

export async function supportingOwnClass(form: Locator, subject: string, className: string) {
  return (await supportingOwnClasses(form, subject)).getByRole("checkbox", {
    name: className,
    exact: true,
  });
}

export async function supportingForeignClass(form: Locator, subject: string, className: string) {
  return (await supportingForeignClasses(form, subject)).getByRole("checkbox", {
    name: className,
    exact: true,
  });
}

export async function selectSupportingForeignPublisher(
  page: Page,
  form: Locator,
  subject: string,
  expectedPublisher?: string,
) {
  const publisher = (await supportingForeignClasses(form, subject)).getByRole("combobox");

  await expect(publisher).toBeEnabled();
  await publisher.click();

  const option = expectedPublisher
    ? page.getByRole("option", { name: expectedPublisher, exact: true })
    : page
        .getByRole("option")
        .filter({ hasNotText: /^wybierz$/i })
        .first();
  await expect(option).toBeVisible();

  const publisherName = (await option.innerText()).trim();
  expect(publisherName).not.toBe("");
  await option.click();
  await expect(publisher).toContainText(publisherName);

  return publisherName;
}

export async function saveSupportingClubForm(page: Page, form: Locator, subject: string) {
  const confirmationSubject = `${subject} - WSPOM`;
  const rows = confirmations(page)
    .getByRole("row", { includeHidden: true })
    .filter({
      has: page.getByRole("cell", {
        name: confirmationSubject,
        exact: true,
        includeHidden: true,
      }),
    });
  const previousIds = confirmationIdsBeforeNewForm.get(form) ?? (await readConfirmationIds(rows));

  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toHaveCount(0);

  let newIds: string[] = [];
  await expect
    .poll(async () => {
      const currentIds = await readConfirmationIds(rows);
      newIds = [...currentIds].filter((id) => !previousIds.has(id));
      return newIds.length;
    })
    .toBe(1);

  return newIds[0];
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

export async function selectForeignPublisher(
  page: Page,
  form: Locator,
  expectedPublisher?: string,
) {
  const publisher = foreignClasses(form).getByRole("combobox");

  await publisher.click();

  const option = expectedPublisher
    ? page.getByRole("option", { name: expectedPublisher, exact: true })
    : page
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

export async function selectDifferentForeignPublisher(
  page: Page,
  form: Locator,
  currentPublisher: string,
) {
  const publisher = foreignClasses(form).getByRole("combobox");

  await publisher.click();

  const options = page.getByRole("option").filter({
    hasNotText: /^wybierz$/i,
  });

  await expect(options.first()).toBeVisible();

  let selectedPublisher = "";
  for (let index = 0; index < (await options.count()); index += 1) {
    const name = (await options.nth(index).innerText()).trim();
    if (name && name !== currentPublisher) {
      selectedPublisher = name;
      await options.nth(index).click();
      break;
    }
  }

  expect(
    selectedPublisher,
    `Lista wydawnictw powinna zawierać wartość inną niż "${currentPublisher}"`,
  ).not.toBe("");

  return selectedPublisher;
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
  const previousIds = confirmationIdsBeforeNewForm.get(form) ?? (await readConfirmationIds(rows));

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);

  let newIds: string[] = [];

  await expect
    .poll(async () => {
      const currentIds = await readConfirmationIds(rows);
      newIds = [...currentIds].filter((id) => !previousIds.has(id));
      return newIds.length;
    })
    .toBe(1);

  const confirmationId = newIds[0];

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

export async function openSupportingClubEdit(page: Page, confirmationId: string) {
  const row = confirmationRow(page, confirmationId);

  await expect(row).toHaveCount(1);
  await row.click();

  const editButton = confirmations(page).getByRole("button", {
    name: "Edytuj",
    exact: true,
  });
  await expect(editButton).toBeEnabled();
  await editButton.click();

  const form = supportingClubEditForm(page);
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
