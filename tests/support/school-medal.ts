import { expect, type Locator, type Page } from "@playwright/test";
import { Octopus, typeValue } from "./octopus";

export type SchoolMedal = "Złoto" | "Srebro" | "Brąz" | "Brak";

export type MedalSchool = {
  id: string;
  name: string;
  city: string;
};

export const GOLD_SCHOOL: MedalSchool = {
  id: "57616",
  name: "Szkoła Podstawowa nr 5",
  city: "Lębork",
};

export const SILVER_SCHOOL: MedalSchool = {
  id: "85263",
  name: "Szkoła Podstawowa nr 379",
  city: "Warszawa",
};

export const BRONZE_SCHOOL: MedalSchool = {
  id: "66109",
  name: "Szkoła Podstawowa w Raszkowie",
  city: "Raszków",
};

export const NO_MEDAL_SCHOOL: MedalSchool = {
  id: "92928",
  name: "Szkoła Podstawowa nr 403",
  city: "Warszawa",
};

/**
 * Pole Medal w danych podstawowych szkoły.
 */
export function medalInput(page: Page): Locator {
  return page
    .locator(".info-row")
    .filter({
      has: page.getByText("Medal", { exact: true }),
    })
    .locator('input[type="text"]')
    .last();
}

/**
 * Widoczny tooltip Angular Material dla medalu.
 */
export function medalTooltip(page: Page): Locator {
  return page.locator(".mat-mdc-tooltip-surface").filter({
    hasText: "Na medal składają się",
  });
}

/**
 * Otwiera wskazaną szkołę i potwierdza,
 * że został załadowany właściwy rekord.
 */
export async function openMedalSchool(
  app: Octopus,
  school: MedalSchool,
): Promise<void> {
  await app.openPanel("school", school.id);

  await expect(app.detail("name")).toHaveValue(school.name);
}

/**
 * Sprawdza wartość pola Medal.
 */
export async function expectSchoolMedal(
  page: Page,
  expectedMedal: SchoolMedal,
): Promise<void> {
  await expect(medalInput(page)).toHaveValue(expectedMedal);
}

/**
 * Sprawdza, że pole Medal jest tylko do odczytu.
 */
export async function expectMedalReadOnly(page: Page): Promise<void> {
  await expect(medalInput(page)).toBeDisabled();
}

/**
 * Najeżdża na medal i sprawdza pojawienie się tooltipa.
 *
 * Opcjonalnie można przekazać listę przedmiotów,
 * które powinny znajdować się w tooltipie.
 */
export async function expectMedalTooltip(
  page: Page,
  subjects: string[] = [],
): Promise<void> {
  await medalInput(page).hover();

  const tooltip = medalTooltip(page);

  await expect(tooltip).toBeVisible();

  for (const subject of subjects) {
    await expect(tooltip).toContainText(subject);
  }
}

/**
 * Sprawdza, że dla wartości Brak po najechaniu
 * nie pojawia się tooltip z przedmiotami.
 */
export async function expectNoMedalTooltip(page: Page): Promise<void> {
  await medalInput(page).hover();

  // W tym przypadku testujemy brak elementu po hoverze.
  // Czekamy chwilę, aby Angular Material miał czas na ewentualne
  // wyświetlenie tooltipa.
  await page.waitForTimeout(1000);

  await expect(medalTooltip(page)).toHaveCount(0);
}

/**
 * Wyszukuje szkołę po ID i zwraca jej wiersz
 * z tabeli wyników wyszukiwania.
 */
export async function searchSchoolById(
  app: Octopus,
  school: MedalSchool,
): Promise<Locator> {
  await app.openPanel("school");

  const search = await app.openSearch("school");

  await typeValue(app.field(search, "ID szkoły"), school.id);

  await search.getByRole("button", { name: "Szukaj", exact: true }).click();

  await expect(search).toHaveCount(0);

  const results = app.results("school");

  const schoolRow = results.getByRole("row").filter({
    has: app.page.getByRole("gridcell", {
      name: school.id,
      exact: true,
    }),
  });

  await expect(schoolRow).toHaveCount(1);

  return schoolRow;
}

/**
 * Otwiera zakładkę Historia zmian.
 */
export async function openSchoolHistory(page: Page): Promise<Locator> {
  await page
    .getByRole("tab", {
      name: "Historia zmian",
      exact: true,
    })
    .click();

  const history = page.getByRole("tabpanel", {
    name: "Historia zmian",
    exact: true,
  });

  await expect(history).toBeVisible();

  return history;
}

/**
 * Zwraca wszystkie wiersze historii,
 * dla których Pole = Medal.
 */
export function medalHistoryRows(history: Locator): Locator {
  return history
    .getByRole("gridcell", {
      name: "Medal",
      exact: true,
    })
    .locator('xpath=ancestor::*[@role="row"][1]');
}

/**
 * Zwraca konkretny wpis medalowy po wartości,
 * np. "2025/2026 Złoto".
 */
export function medalHistoryRowByValue(
  history: Locator,
  value: string,
): Locator {
  return history
    .getByRole("gridcell", {
      name: value,
      exact: true,
    })
    .locator('xpath=ancestor::*[@role="row"][1]');
}

/**
 * Kolumny historii:
 *
 * 0 - Pole
 * 1 - Wartość
 * 2 - Autor
 * 3 - Źródło
 * 4 - Data
 */
export function historyFieldCell(row: Locator): Locator {
  return row.getByRole("gridcell").nth(0);
}

export function historyValueCell(row: Locator): Locator {
  return row.getByRole("gridcell").nth(1);
}

export function historyAuthorCell(row: Locator): Locator {
  return row.getByRole("gridcell").nth(2);
}

export function historySourceCell(row: Locator): Locator {
  return row.getByRole("gridcell").nth(3);
}

export function historyDateCell(row: Locator): Locator {
  return row.getByRole("gridcell").nth(4);
}

/**
 * Wyszukuje szkoły po jednej lub kilku wartościach pola Medal.
 */
export async function searchSchoolsByMedals(
  app: Octopus,
  medals: SchoolMedal[],
): Promise<Locator> {
  await app.openPanel("school");

  const search = await app.openSearch("school");

  const medalSelect = search
    .getByText("Medal", { exact: true })
    .locator('xpath=ancestor::*[.//*[@role="combobox"]][1]')
    .getByRole("combobox");

  await medalSelect.click();

  for (const medal of medals) {
    await app.page
      .getByRole("option", {
        name: medal,
        exact: true,
      })
      .click();
  }

  await app.page.keyboard.press("Escape");

  await search
    .getByRole("button", {
      name: "Szukaj",
      exact: true,
    })
    .click();

  await expect(search).toHaveCount(0);

  return app.results("school");
}

/**
 * Wersja skrócona dla wyszukiwania po jednym medalu.
 */
export async function searchSchoolsByMedal(
  app: Octopus,
  medal: SchoolMedal,
): Promise<Locator> {
  return searchSchoolsByMedals(app, [medal]);
}

/**
 * Sprawdza wyniki wyszukiwania szkół po medalach.
 *
 * - musi istnieć co najmniej jeden wynik,
 * - każdy wynik musi mieć jeden z dozwolonych medali,
 * - każda wybrana wartość medalu musi wystąpić
 *   przynajmniej raz w wynikach.
 */
export async function expectSchoolResultsMedals(
  results: Locator,
  allowedMedals: SchoolMedal[],
): Promise<void> {
  const allMedals: SchoolMedal[] = ["Złoto", "Srebro", "Brąz", "Brak"];

  const medalCells = results.getByRole("gridcell", {
    name: /^(Złoto|Srebro|Brąz|Brak)$/,
  });

  await expect(medalCells.first()).toBeVisible();

  const count = await medalCells.count();

  expect(
    count,
    "Wyszukiwanie powinno zwrócić co najmniej jedną szkołę",
  ).toBeGreaterThan(0);

  const foundMedals = new Set<SchoolMedal>();

  for (let i = 0; i < count; i++) {
    const medalCell = medalCells.nth(i);

    const medalText = (await medalCell.innerText()).trim() as SchoolMedal;

    expect(
      allMedals,
      `Nieznana wartość medalu w wynikach: "${medalText}"`,
    ).toContain(medalText);

    expect(
      allowedMedals,
      `Znaleziono medal "${medalText}", mimo że wyszukiwano tylko: ${allowedMedals.join(", ")}`,
    ).toContain(medalText);

    foundMedals.add(medalText);
  }

  for (const medal of allowedMedals) {
    expect(
      foundMedals.has(medal),
      `W wynikach nie znaleziono żadnej szkoły z medalem "${medal}"`,
    ).toBeTruthy();
  }
}

export async function getSchoolMedalApiData(
  app: Octopus,
  school: MedalSchool,
): Promise<{
  medalCategoryName: string | null;
  subjectNames: string[];
}> {
  const responsePromise = app.page.waitForResponse((response) => {
    const url = new URL(response.url());

    if (
      url.pathname !== "/api/InstitutionBrowser/GetInstitutions" ||
      response.request().method() !== "GET"
    ) {
      return false;
    }

    const filterModel = url.searchParams.get("filterModel");

    if (!filterModel) {
      return false;
    }

    try {
      const parsed = JSON.parse(filterModel);

      return (
        Array.isArray(parsed.institutionIds) &&
        parsed.institutionIds.map(String).includes(school.id)
      );
    } catch {
      return false;
    }
  });

  await app.openPanel("school", school.id);

  const response = await responsePromise;

  expect(
    response.ok(),
    "GetInstitutions powinien zwrócić poprawną odpowiedź",
  ).toBeTruthy();

  const body = await response.json();

  const schoolData = body.data?.find(
    (item: { id: number }) => String(item.id) === school.id,
  );

  expect(
    schoolData,
    `API powinno zwrócić szkołę o ID ${school.id}`,
  ).toBeTruthy();

  return {
    medalCategoryName:
      schoolData.informationAboutMedalCategory?.medalCategoryName ?? null,

    subjectNames: schoolData.informationAboutMedalCategory?.subjectNames ?? [],
  };
}
