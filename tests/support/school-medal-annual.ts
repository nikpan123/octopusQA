import { expect, type Page } from "@playwright/test";
import { Octopus, typeValue } from "./octopus";
import {
  getSchoolMedalApiData,
  openMedalSchool,
  type MedalSchool,
  type SchoolMedal,
} from "./school-medal";
import { readFile } from "node:fs/promises";

export type AnnualMedalTeacherRow = {
  teacherId: string;
  subjectsInSchool: string;
  functionName: string;

  subjectsCellClass: string;
  subjectsCellStyle: string;

  subjectsCellBackgroundColor: string;
  subjectsCellColor: string;
  subjectsCellHtml: string;
};

export async function getAnnualMedalTeacherRows(
  page: Page,
): Promise<AnnualMedalTeacherRow[]> {
  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });

  await expect(teachers).toBeVisible();

  await expect(
    teachers.getByRole("button", {
      name: /^Nauczyciele:\s*\d+$/,
    }),
    "Sekcja nauczycieli powinna być załadowana",
  ).toBeVisible();

  const headers = teachers.getByRole("columnheader");
  const headerCount = await headers.count();

  const headerNames: string[] = [];

  for (let i = 0; i < headerCount; i++) {
    headerNames.push((await headers.nth(i).innerText()).trim());
  }

  const idIndex = headerNames.indexOf("ID");

  const subjectsIndex = headerNames.indexOf("Przedmioty w tej szkole");

  const functionIndex = headerNames.indexOf("Funkcja");

  expect(
    idIndex,
    "Nie znaleziono kolumny ID w tabeli nauczycieli",
  ).toBeGreaterThanOrEqual(0);

  expect(
    subjectsIndex,
    'Nie znaleziono kolumny "Przedmioty w tej szkole"',
  ).toBeGreaterThanOrEqual(0);

  expect(
    functionIndex,
    "Nie znaleziono kolumny Funkcja",
  ).toBeGreaterThanOrEqual(0);

  const rows = teachers.getByRole("row");

  const result: AnnualMedalTeacherRow[] = [];

  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).getByRole("gridcell");

    const cellCount = await cells.count();

    if (cellCount === 0) {
      continue;
    }

    const idCell = cells.nth(idIndex);
    const subjectsCell = cells.nth(subjectsIndex);
    const functionCell = cells.nth(functionIndex);

    const teacherId = (await idCell.innerText()).trim();

    if (!/^\d+$/.test(teacherId)) {
      continue;
    }

    const subjectsInSchool = (await subjectsCell.innerText()).trim();

    const functionName = (await functionCell.innerText()).trim();

    const subjectsCellClass = (await subjectsCell.getAttribute("class")) ?? "";

    const subjectsCellStyle = (await subjectsCell.getAttribute("style")) ?? "";

    const subjectsCellBackgroundColor = await subjectsCell.evaluate(
      (element) => {
        return window.getComputedStyle(element).backgroundColor;
      },
    );

    const subjectsCellColor = await subjectsCell.evaluate((element) => {
      return window.getComputedStyle(element).color;
    });

    const subjectsCellHtml = await subjectsCell.evaluate((element) => {
      return element.innerHTML;
    });

    result.push({
      teacherId,
      subjectsInSchool,
      functionName,

      subjectsCellClass,
      subjectsCellStyle,

      subjectsCellBackgroundColor,
      subjectsCellColor,
      subjectsCellHtml,
    });
  }

  return result;
}

export type AnnualMedalTeacherSubject = {
  teacherId: string;
  subjectLevel: string;
  functionName: string;
  isGreen: boolean;
  isSupportingTeacher: boolean;
};

export async function getAnnualMedalTeacherSubjects(
  page: Page,
): Promise<AnnualMedalTeacherSubject[]> {
  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });

  await expect(teachers).toBeVisible();

  await expect(
    teachers.getByRole("button", {
      name: /^Nauczyciele:\s*\d+$/,
    }),
    "Sekcja nauczycieli powinna być załadowana",
  ).toBeVisible();

  const headers = teachers.getByRole("columnheader");
  const headerCount = await headers.count();

  const headerNames: string[] = [];

  for (let i = 0; i < headerCount; i++) {
    headerNames.push((await headers.nth(i).innerText()).trim());
  }

  const idIndex = headerNames.indexOf("ID");

  const subjectsIndex = headerNames.indexOf("Przedmioty w tej szkole");

  const functionIndex = headerNames.indexOf("Funkcja");

  expect(idIndex, "Nie znaleziono kolumny ID").toBeGreaterThanOrEqual(0);

  expect(
    subjectsIndex,
    'Nie znaleziono kolumny "Przedmioty w tej szkole"',
  ).toBeGreaterThanOrEqual(0);

  expect(
    functionIndex,
    "Nie znaleziono kolumny Funkcja",
  ).toBeGreaterThanOrEqual(0);

  const rows = teachers.getByRole("row");

  const result: AnnualMedalTeacherSubject[] = [];

  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).getByRole("gridcell");

    if ((await cells.count()) === 0) {
      continue;
    }

    const teacherId = (await cells.nth(idIndex).innerText()).trim();

    if (!/^\d+$/.test(teacherId)) {
      continue;
    }

    const functionName = (await cells.nth(functionIndex).innerText()).trim();

    const isSupportingTeacher = functionName.includes(
      "Nauczyciel wspomagający",
    );

    const subjectElements = cells.nth(subjectsIndex).locator(".subject");

    const subjectCount = await subjectElements.count();

    for (let j = 0; j < subjectCount; j++) {
      const subjectElement = subjectElements.nth(j);

      const subjectLevel = (await subjectElement.innerText())
        .replace(/;\s*$/, "")
        .trim();

      if (!subjectLevel) {
        continue;
      }

      const className = (await subjectElement.getAttribute("class")) ?? "";

      const isGreen = className.split(/\s+/).includes("green-background");

      result.push({
        teacherId,
        subjectLevel,
        functionName,
        isGreen,
        isSupportingTeacher,
      });
    }
  }

  return result;
}

export type AnnualMedalExpectation = {
  qualifyingSubjectLevels: string[];
  expectedMedal: "Złoto" | "Srebro" | "Brąz" | "Brak";
  supportingTeachersExcluded: string[];
};

export async function getExpectedAnnualMedal(
  page: Page,
): Promise<AnnualMedalExpectation> {
  const teacherSubjects = await getAnnualMedalTeacherSubjects(page);

  const supportingTeachersExcluded = [
    ...new Set(
      teacherSubjects
        .filter((subject) => subject.isGreen && subject.isSupportingTeacher)
        .map((subject) => subject.teacherId),
    ),
  ];

  const qualifyingSubjectLevels = [
    ...new Set(
      teacherSubjects
        .filter((subject) => subject.isGreen && !subject.isSupportingTeacher)
        .map((subject) => subject.subjectLevel),
    ),
  ].sort();

  let expectedMedal: "Złoto" | "Srebro" | "Brąz" | "Brak";

  switch (qualifyingSubjectLevels.length) {
    case 0:
      expectedMedal = "Brak";
      break;

    case 1:
      expectedMedal = "Brąz";
      break;

    case 2:
      expectedMedal = "Srebro";
      break;

    default:
      expectedMedal = "Złoto";
      break;
  }

  return {
    qualifyingSubjectLevels,
    expectedMedal,
    supportingTeachersExcluded,
  };
}

export type AnnualMedalSnapshotEntry = {
  school: MedalSchool;

  currentMedal: SchoolMedal;
  currentSubjectNames: string[];

  qualifyingSubjectLevels: string[];
  expectedMedal: SchoolMedal;

  supportingTeachersExcluded: string[];
};

export async function buildAnnualMedalSnapshot(
  app: Octopus,
  schools: MedalSchool[],
): Promise<AnnualMedalSnapshotEntry[]> {
  const result: AnnualMedalSnapshotEntry[] = [];

  for (const school of schools) {
    await openMedalSchool(app, school);

    const expectation = await getExpectedAnnualMedal(app.page);

    const currentMedalData = await getSchoolMedalApiData(app, school);

    const allowedMedals: SchoolMedal[] = ["Złoto", "Srebro", "Brąz", "Brak"];

    expect(
      currentMedalData.medalCategoryName,
      `Szkoła ${school.id} powinna mieć poprawną wartość aktualnego medalu`,
    ).not.toBeNull();

    expect(
      allowedMedals,
      `Nieznana wartość medalu szkoły ${school.id}: "${currentMedalData.medalCategoryName}"`,
    ).toContain(currentMedalData.medalCategoryName);

    result.push({
      school,

      currentMedal: currentMedalData.medalCategoryName as SchoolMedal,

      currentSubjectNames: currentMedalData.subjectNames,

      qualifyingSubjectLevels: expectation.qualifyingSubjectLevels,

      expectedMedal: expectation.expectedMedal,

      supportingTeachersExcluded: expectation.supportingTeachersExcluded,
    });
  }

  return result;
}

export type AnnualMedalSnapshot = {
  schemaVersion: number;
  generatedAt: string;
  targetProcessDate: string;
  schools: AnnualMedalSnapshotEntry[];
};

export async function loadAnnualMedalSnapshot(
  path = "tests/data/medalowosc-annual-2026.json",
): Promise<AnnualMedalSnapshot> {
  const raw = await readFile(path, "utf8");

  const snapshot = JSON.parse(raw) as AnnualMedalSnapshot;

  expect(
    snapshot.schemaVersion,
    "Snapshot powinien mieć schemaVersion = 1",
  ).toBe(1);

  expect(
    snapshot.generatedAt,
    "Snapshot powinien zawierać datę wygenerowania",
  ).toMatch(/^\d{4}-\d{2}-\d{2}T/);

  expect(
    snapshot.targetProcessDate,
    "Snapshot powinien zawierać datę procesu rocznego",
  ).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  expect(
    snapshot.schools.length,
    "Snapshot powinien zawierać szkoły referencyjne",
  ).toBeGreaterThan(0);

  return snapshot;
}

export type AnnualMedalRandomCandidate = {
  id: string;
  name: string;
  city: string;

  currentMedal: SchoolMedal;
  currentSubjectNames: string[];
};

export async function getRandomAnnualMedalCandidates(
  app: Octopus,
  count: number,
  excludedSchoolIds: string[] = [],
): Promise<AnnualMedalRandomCandidate[]> {
  const allMedals: SchoolMedal[] = ["Złoto", "Srebro", "Brąz", "Brak"];

  await app.openPanel("school");

  const search = await app.openSearch("school");

  // Wyszukiwarka pamięta wcześniejsze kryteria.
  // Czyścimy wszystkie zwykłe pola tekstowe.
  const textInputs = search.locator(
    'input:not([type="checkbox"]):not([readonly]):not([disabled])',
  );

  const inputCount = await textInputs.count();

  for (let i = 0; i < inputCount; i++) {
    await textInputs.nth(i).fill("");
  }

  // Czyścimy zapamiętany filtr Medal.
  const medalLabel = search.getByText("Medal", {
    exact: true,
  });

  if (await medalLabel.count()) {
    const medalSelect = medalLabel
      .locator('xpath=ancestor::*[.//*[@role="combobox"]][1]')
      .getByRole("combobox");

    await medalSelect.click();

    for (const medal of allMedals) {
      const option = app.page.getByRole("option", {
        name: medal,
        exact: true,
      });

      const selected = await option.getAttribute("aria-selected");

      if (selected === "true") {
        await option.click();
      }
    }

    await app.page.keyboard.press("Escape");
  }

  // UWAGA:
  // etykieta w UI brzmi dokładnie "Miasto/poczta".
  await typeValue(app.field(search, "Miasto/poczta"), "warszawa");

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

      const cityPost = String(filterModel.cityPost ?? "")
        .trim()
        .toLowerCase();

      const hasNoSchoolId =
        !Array.isArray(filterModel.institutionIds) ||
        filterModel.institutionIds.length === 0;

      return cityPost === "warszawa" && hasNoSchoolId;
    } catch {
      return false;
    }
  });

  await search
    .getByRole("button", {
      name: "Szukaj",
      exact: true,
    })
    .click();

  await expect(search).toHaveCount(0);

  const response = await responsePromise;

  expect(
    response.ok(),
    "Wyszukiwanie szkół z Warszawy powinno zakończyć się poprawną odpowiedzią API",
  ).toBeTruthy();

  const responseUrl = new URL(response.url());

  const rawFilterModel = responseUrl.searchParams.get("filterModel");

  expect(
    rawFilterModel,
    "Request powinien zawierać filterModel",
  ).not.toBeNull();

  const filterModel = JSON.parse(rawFilterModel!);

  console.log(
    "PREP-08: filterModel wyszukiwania Warszawy:",
    JSON.stringify(filterModel, null, 2),
  );

  const body = await response.json();

  const schools = body.data ?? [];

  console.log(`PREP-08: API zwróciło ${schools.length} rekordów dla Warszawy`);

  const candidates = new Map<string, AnnualMedalRandomCandidate>();

  let skippedReg = 0;
  let skippedOtherCity = 0;
  let skippedInvalidMedal = 0;
  let skippedReference = 0;

  for (const school of schools) {
    const id = String(school.id ?? "");

    const name = String(school.name ?? "").trim();

    const city = String(school.city ?? "").trim();

    if (!/^\d+$/.test(id)) {
      continue;
    }

    if (excludedSchoolIds.includes(id)) {
      skippedReference++;
      continue;
    }

    if (/^REG_/i.test(name)) {
      skippedReg++;
      continue;
    }

    if (city.toLowerCase() !== "warszawa") {
      skippedOtherCity++;
      continue;
    }

    const medal = school.informationAboutMedalCategory?.medalCategoryName;

    if (!allMedals.includes(medal as SchoolMedal)) {
      skippedInvalidMedal++;
      continue;
    }

    candidates.set(id, {
      id,
      name,
      city,

      currentMedal: medal as SchoolMedal,

      currentSubjectNames:
        school.informationAboutMedalCategory?.subjectNames ?? [],
    });
  }

  const pool = [...candidates.values()];

  console.log(`PREP-08: poprawna pula Warszawa: ${pool.length}`);

  console.log(
    `PREP-08: pominięto: ` +
      `REG_*=${skippedReg}, ` +
      `inne miasto=${skippedOtherCity}, ` +
      `referencyjne=${skippedReference}, ` +
      `niepoprawny medal=${skippedInvalidMedal}`,
  );

  expect(
    pool.length,
    `Po filtrowaniu Warszawy powinna pozostać pula co najmniej ${count} szkół`,
  ).toBeGreaterThanOrEqual(count);

  // Fisher-Yates.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, count);

  expect(
    selected,
    `Powinno zostać wylosowanych dokładnie ${count} szkół z Warszawy`,
  ).toHaveLength(count);

  return selected;
}

export async function buildRandomAnnualMedalSnapshot(
  app: Octopus,
  count: number,
  excludedSchoolIds: string[] = [],
): Promise<AnnualMedalSnapshotEntry[]> {
  const candidates = await getRandomAnnualMedalCandidates(
    app,
    count,
    excludedSchoolIds,
  );

  const result: AnnualMedalSnapshotEntry[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    console.log(
      `PREP-08: analizuję ${i + 1}/${candidates.length}: ` +
        `${candidate.id} "${candidate.name}"`,
    );

    await app.openPanel("school", candidate.id);

    const actualName = (await app.detail("name").inputValue()).trim();

    expect(
      actualName,
      `Nazwa szkoły ${candidate.id} powinna odpowiadać wynikowi wyszukiwarki`,
    ).toBe(candidate.name);

    expect(
      /^REG_/i.test(actualName),
      `Szkoła ${candidate.id} nie może być rekordem automatycznym REG_*`,
    ).toBeFalsy();

    const expectation = await getExpectedAnnualMedal(app.page);

    result.push({
      school: {
        id: candidate.id,

        name: candidate.name,

        city: candidate.city,
      },

      currentMedal: candidate.currentMedal,

      currentSubjectNames: candidate.currentSubjectNames,

      qualifyingSubjectLevels: expectation.qualifyingSubjectLevels,

      expectedMedal: expectation.expectedMedal,

      supportingTeachersExcluded: expectation.supportingTeachersExcluded,
    });

    console.log(
      `PREP-08: ${i + 1}/${count} ` +
        `${candidate.id} "${candidate.name}": ` +
        `${candidate.currentMedal} → ${expectation.expectedMedal}; ` +
        `przedmioty=${JSON.stringify(expectation.qualifyingSubjectLevels)}`,
    );
  }

  expect(
    result,
    `Powinno zostać przygotowanych dokładnie ${count} losowych szkół z Warszawy`,
  ).toHaveLength(count);

  return result;
}
