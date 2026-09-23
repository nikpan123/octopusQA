import { expect, type Locator, type Page } from "@playwright/test";
import { Octopus, typeValue } from "./octopus";

export type SchoolMedal = "Złoto" | "Srebro" | "Brąz" | "Brak";

export type MedalSchool = {
  id: string;
  name: string;
  city: string;
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
export async function openMedalSchool(app: Octopus, school: MedalSchool): Promise<void> {
  await app.openPanel("school", school.id);

  console.log(`Otwarto szkołę ${school.id} "${school.name}".`);
}

/**
 * Sprawdza wartość pola Medal.
 */
export async function expectSchoolMedal(page: Page, expectedMedal: SchoolMedal): Promise<void> {
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
export async function expectMedalTooltip(page: Page, subjects: string[] = []): Promise<void> {
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
export async function searchSchoolById(app: Octopus, school: MedalSchool): Promise<Locator> {
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

  const firstGridCell = history.getByRole("gridcell").first();

  await expect(firstGridCell, "Historia zmian powinna zakończyć ładowanie danych").toBeVisible({
    timeout: 20_000,
  });

  await page.waitForTimeout(300);

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
export function medalHistoryRowByValue(history: Locator, value: string): Locator {
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
export async function searchSchoolsByMedals(app: Octopus, medals: SchoolMedal[]): Promise<Locator> {
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
export async function searchSchoolsByMedal(app: Octopus, medal: SchoolMedal): Promise<Locator> {
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

  expect(count, "Wyszukiwanie powinno zwrócić co najmniej jedną szkołę").toBeGreaterThan(0);

  const foundMedals = new Set<SchoolMedal>();

  for (let i = 0; i < count; i++) {
    const medalCell = medalCells.nth(i);

    const medalText = (await medalCell.innerText()).trim() as SchoolMedal;

    expect(allMedals, `Nieznana wartość medalu w wynikach: "${medalText}"`).toContain(medalText);

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

  expect(response.ok(), "GetInstitutions powinien zwrócić poprawną odpowiedź").toBeTruthy();

  const body = await response.json();

  const schoolData = body.data?.find((item: { id: number }) => String(item.id) === school.id);

  expect(schoolData, `API powinno zwrócić szkołę o ID ${school.id}`).toBeTruthy();

  return {
    medalCategoryName: schoolData.informationAboutMedalCategory?.medalCategoryName ?? null,

    subjectNames: schoolData.informationAboutMedalCategory?.subjectNames ?? [],
  };
}

/**
 * Odczytuje listę przedmiotów wyświetlaną
 * w tooltipie medalu w danych podstawowych szkoły.
 */
export async function getMedalTooltipSubjects(page: Page): Promise<string[]> {
  await medalInput(page).hover();

  const tooltip = medalTooltip(page);

  await expect(tooltip).toBeVisible();

  const text = await tooltip.innerText();

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim());
}

/**
 * Zwraca aktualną wartość pola Medal
 * wyświetlaną w danych podstawowych szkoły.
 */
export async function getSchoolMedalValue(page: Page): Promise<SchoolMedal> {
  const value = await medalInput(page).inputValue();

  expect(["Złoto", "Srebro", "Brąz", "Brak"], `Nieznana wartość medalu w UI: "${value}"`).toContain(
    value,
  );

  return value as SchoolMedal;
}

/**
 * Sprawdza zgodność liczby przedmiotów z wyliczonym medalem.
 *
 * Brak   -> 0
 * Brąz   -> 1
 * Srebro -> 2
 * Złoto  -> 3 lub więcej
 */
export function expectMedalMatchesSubjectCount(
  medal: SchoolMedal | null,
  subjectNames: string[],
): void {
  switch (medal) {
    case "Brak":
      expect(subjectNames).toHaveLength(0);
      break;

    case "Brąz":
      expect(subjectNames).toHaveLength(1);
      break;

    case "Srebro":
      expect(subjectNames).toHaveLength(2);
      break;

    case "Złoto":
      expect(subjectNames.length).toBeGreaterThanOrEqual(3);
      break;

    default:
      throw new Error(`Nieobsługiwana wartość medalu: "${medal}"`);
  }
}

export function expectUniqueMedalSubjects(subjectNames: string[]): void {
  const uniqueSubjects = new Set(subjectNames);

  expect(
    uniqueSubjects.size,
    `Lista przedmiotów medalowych zawiera duplikaty: ${subjectNames.join(", ")}`,
  ).toBe(subjectNames.length);
}

export function schoolTeachersBySubject(page: Page, subjectLevel: string): Locator {
  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });

  return teachers.getByRole("row").filter({
    has: page.getByRole("gridcell", {
      name: subjectLevel,
      exact: true,
    }),
  });
}

export async function getLatestMedalHistoryValue(history: Locator): Promise<string> {
  const rows = medalHistoryRows(history);

  await expect(rows.first()).toBeVisible();

  const count = await rows.count();

  let latestStartYear = -1;
  let latestValue = "";

  for (let i = 0; i < count; i++) {
    const value = (await historyValueCell(rows.nth(i)).innerText()).trim();

    const match = value.match(/^(\d{4})\/(\d{4}) (Złoto|Srebro|Brąz|Brak)$/);

    expect(match, `Nieprawidłowy format wpisu historii medalu: "${value}"`).not.toBeNull();

    const startYear = Number(match![1]);

    if (startYear > latestStartYear) {
      latestStartYear = startYear;
      latestValue = value;
    }
  }

  expect(latestValue, "Nie znaleziono wpisu historii medalowości").not.toBe("");

  return latestValue;
}

export type MedalHistoryEntry = {
  value: string;
  author: string;
  source: string;
  date: string;
};

export async function collectMedalHistoryEntries(
  page: Page,
  history: Locator,
): Promise<MedalHistoryEntry[]> {
  const firstCell = history.getByRole("gridcell").first();

  await expect(
    firstCell,
    "Historia zmian powinna zawierać dane przed rozpoczęciem odczytu",
  ).toBeVisible({
    timeout: 20_000,
  });

  const scrollHandle = await history.evaluateHandle((root) => {
    const elements = [root as HTMLElement, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

    const scrollables = elements.filter((element) => {
      const style = window.getComputedStyle(element);

      return (
        element.scrollHeight > element.clientHeight + 20 &&
        (style.overflowY === "auto" || style.overflowY === "scroll")
      );
    });

    scrollables.sort((a, b) => b.scrollHeight - b.clientHeight - (a.scrollHeight - a.clientHeight));

    /*
     * TEST:
     * może istnieć osobny scrollowalny kontener.
     *
     * DEV:
     * historia może mieścić się w całości bez scrolla.
     *
     * Jeżeli nie ma osobnego scrolla,
     * używamy samego tabpanelu historii.
     */
    return scrollables[0] ?? (root as HTMLElement);
  });

  const scrollElement = scrollHandle.asElement();

  if (!scrollElement) {
    await scrollHandle.dispose();

    throw new Error("Nie udało się uzyskać kontenera historii zmian.");
  }

  await scrollElement.evaluate((element) => {
    const el = element as HTMLElement;

    el.scrollTop = 0;
  });

  const found = new Map<string, MedalHistoryEntry>();

  for (let attempt = 0; attempt < 100; attempt++) {
    await page.waitForTimeout(150);

    const rows = history.getByRole("row");

    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).getByRole("gridcell");

      const cellCount = await cells.count();

      if (cellCount < 5) {
        continue;
      }

      const field = (await cells.nth(0).innerText()).trim();

      if (field !== "Medal") {
        continue;
      }

      const entry: MedalHistoryEntry = {
        value: (await cells.nth(1).innerText()).trim(),

        author: (await cells.nth(2).innerText()).trim(),

        source: (await cells.nth(3).innerText()).trim(),

        date: (await cells.nth(4).innerText()).trim(),
      };

      found.set([entry.value, entry.author, entry.source, entry.date].join("|"), entry);
    }

    const scrollState = await scrollElement.evaluate((element) => {
      const el = element as HTMLElement;

      return {
        scrollTop: el.scrollTop,

        clientHeight: el.clientHeight,

        scrollHeight: el.scrollHeight,
      };
    });

    const isScrollable = scrollState.scrollHeight > scrollState.clientHeight + 2;

    /*
     * DEV:
     * brak scrolla -> wszystko już jest w DOM,
     * więc kończymy po pierwszym odczycie.
     */
    if (!isScrollable) {
      break;
    }

    const reachedBottom =
      scrollState.scrollTop + scrollState.clientHeight >= scrollState.scrollHeight - 2;

    if (reachedBottom) {
      break;
    }

    await scrollElement.evaluate((element) => {
      const el = element as HTMLElement;

      el.scrollTop = Math.min(el.scrollTop + Math.max(el.clientHeight * 0.8, 300), el.scrollHeight);
    });
  }

  await scrollHandle.dispose();

  console.log(`Historia medalowości: znaleziono ${found.size} wpisów Medal.`);

  return [...found.values()];
}

export async function prepareSchoolSearchByIdAndMedal(
  app: Octopus,
  schoolId: string,
  medal: SchoolMedal,
): Promise<Locator> {
  await app.openPanel("school");

  const search = await app.openSearch("school");

  await typeValue(app.field(search, "ID szkoły"), schoolId);

  const medalSelect = search
    .getByText("Medal", { exact: true })
    .locator('xpath=ancestor::*[.//*[@role="combobox"]][1]')
    .getByRole("combobox");

  await medalSelect.click();

  const allMedals: SchoolMedal[] = ["Złoto", "Srebro", "Brąz", "Brak"];

  // Wyszukiwarka zapamiętuje poprzednie kryteria.
  // Najpierw czyścimy wszystkie zaznaczone medale.
  for (const medalOption of allMedals) {
    const option = app.page.getByRole("option", {
      name: medalOption,
      exact: true,
    });

    const selected = await option.getAttribute("aria-selected");

    if (selected === "true") {
      await option.click();
    }
  }

  // Ustawiamy tylko medal wymagany przez bieżące wyszukiwanie.
  await app.page
    .getByRole("option", {
      name: medal,
      exact: true,
    })
    .click();

  await app.page.keyboard.press("Escape");

  return search;
}

export async function searchSchoolsByMedalsWithApi(
  app: Octopus,
  medals: SchoolMedal[],
): Promise<{
  results: Locator;
  filterModel: Record<string, unknown> & {
    institutionIds: unknown[];
    medal: SchoolMedal[];
  };
  schools: Array<{
    id: string | number;
    informationAboutMedalCategory?: {
      medalCategoryName?: string;
      subjectNames?: string[];
    };
  }>;
}> {
  const responsePromise = app.page.waitForResponse((response) => {
    const url = new URL(response.url());

    if (
      url.pathname !== "/api/InstitutionBrowser/GetInstitutions" ||
      response.request().method() !== "GET"
    ) {
      return false;
    }

    const rawFilterModel = url.searchParams.get("filterModel");

    if (!rawFilterModel) {
      return false;
    }

    try {
      const filterModel = JSON.parse(rawFilterModel);

      const hasExpectedMedalCount =
        Array.isArray(filterModel.medal) && filterModel.medal.length === medals.length;

      const hasNoSchoolId =
        !Array.isArray(filterModel.institutionIds) || filterModel.institutionIds.length === 0;

      return hasExpectedMedalCount && hasNoSchoolId;
    } catch {
      return false;
    }
  });

  const results = await searchSchoolsByMedals(app, medals);

  const response = await responsePromise;

  expect(
    response.ok(),
    `Wyszukiwanie po medalach ${medals.join(", ")} powinno zakończyć się poprawną odpowiedzią API`,
  ).toBeTruthy();

  const url = new URL(response.url());

  const rawFilterModel = url.searchParams.get("filterModel");

  expect(rawFilterModel, "Żądanie wyszukiwania powinno zawierać filterModel").not.toBeNull();

  const filterModel = JSON.parse(rawFilterModel!) as Record<string, unknown> & {
    institutionIds: unknown[];
    medal: SchoolMedal[];
  };
  const body = (await response.json()) as {
    data?: Array<{
      id: string | number;
      informationAboutMedalCategory?: {
        medalCategoryName?: string;
        subjectNames?: string[];
      };
    }>;
  };

  return {
    results,
    filterModel,
    schools: body.data ?? [],
  };
}

export async function waitForSchoolTeachersLoaded(page: Page): Promise<void> {
  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });

  await expect(teachers).toBeVisible();

  await expect(
    teachers.getByRole("button", {
      name: /^Nauczyciele:\s*\d+$/,
    }),
    "Sekcja nauczycieli powinna zakończyć ładowanie",
  ).toBeVisible();

  await expect(
    teachers
      .getByRole("row")
      .filter({
        has: page.getByRole("gridcell"),
      })
      .first(),
    "Tabela nauczycieli powinna zawierać co najmniej jeden wiersz danych",
  ).toBeVisible();
}
