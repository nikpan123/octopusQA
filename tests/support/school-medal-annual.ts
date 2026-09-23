import { expect, type Page } from "@playwright/test";
import { Octopus, typeValue } from "./octopus";
import {
  getSchoolMedalApiData,
  openMedalSchool,
  type MedalSchool,
  type SchoolMedal,
} from "./school-medal";
import { readFile } from "node:fs/promises";

export const ANNUAL_MEDAL_TARGET_PROCESS_DATE = "2026-10-01";

export type AnnualMedalClubMembershipExclusion = {
  teacherId: string;
  subjectLevel: string;
  targetSchoolYear: string;
  reason: string;
};

type AnnualMedalTeacherSchoolSubjectYear = {
  schoolId: string;
  subjectLevel: string;
  schoolYear: string;
};

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

export async function getAnnualMedalTeacherRows(page: Page): Promise<AnnualMedalTeacherRow[]> {
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

  expect(idIndex, "Nie znaleziono kolumny ID w tabeli nauczycieli").toBeGreaterThanOrEqual(0);

  expect(subjectsIndex, 'Nie znaleziono kolumny "Przedmioty w tej szkole"').toBeGreaterThanOrEqual(
    0,
  );

  expect(functionIndex, "Nie znaleziono kolumny Funkcja").toBeGreaterThanOrEqual(0);

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

    const subjectsCellBackgroundColor = await subjectsCell.evaluate((element) => {
      return window.getComputedStyle(element).backgroundColor;
    });

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

  expect(subjectsIndex, 'Nie znaleziono kolumny "Przedmioty w tej szkole"').toBeGreaterThanOrEqual(
    0,
  );

  expect(functionIndex, "Nie znaleziono kolumny Funkcja").toBeGreaterThanOrEqual(0);

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

    const isSupportingTeacher = functionName.includes("Nauczyciel wspomagający");

    const subjectElements = cells.nth(subjectsIndex).locator(".subject");

    const subjectCount = await subjectElements.count();

    for (let j = 0; j < subjectCount; j++) {
      const subjectElement = subjectElements.nth(j);

      const subjectLevel = (await subjectElement.innerText()).replace(/;\s*$/, "").trim();

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

export function getAnnualTargetSchoolYear(targetProcessDate: string): string {
  const match = targetProcessDate.match(/^(\d{4})-\d{2}-\d{2}$/);

  if (!match) {
    throw new Error(`Nieprawidłowa data procesu rocznego: "${targetProcessDate}".`);
  }

  const startYear = Number(match[1]);

  return `${startYear}/${startYear + 1}`;
}

async function getCurrentSchoolId(page: Page): Promise<string> {
  const idInput = page
    .locator(".info-row")
    .filter({
      has: page.getByText("ID", { exact: true }),
    })
    .locator('input[type="text"]');

  await expect(idInput, "Nie znaleziono ID aktualnie otwartej szkoły").toBeVisible();

  const schoolId = (await idInput.inputValue()).trim();

  expect(schoolId, "ID aktualnie otwartej szkoły powinno być liczbą").toMatch(/^\d+$/);

  return schoolId;
}

async function getTeacherSchoolSubjectYears(
  page: Page,
  schoolId: string,
): Promise<AnnualMedalTeacherSchoolSubjectYear[]> {
  const schoolsGrid = page
    .getByRole("treegrid")
    .filter({
      has: page.getByRole("columnheader", {
        name: "Nazwa szkoły",
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("columnheader", {
        name: "Przedmiot",
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("columnheader", {
        name: "Rok szkolny",
        exact: true,
      }),
    })
    .first();

  await expect(schoolsGrid, "Tabela szkół nauczyciela powinna być widoczna").toBeVisible();

  const headers = schoolsGrid.getByRole("columnheader");

  const headerCount = await headers.count();

  const headerNames: string[] = [];

  for (let i = 0; i < headerCount; i++) {
    headerNames.push((await headers.nth(i).innerText()).trim());
  }

  const idIndex = headerNames.indexOf("ID");

  const levelIndex = headerNames.indexOf("Poziom");

  const subjectIndex = headerNames.indexOf("Przedmiot");

  const schoolYearIndex = headerNames.indexOf("Rok szkolny");

  expect(idIndex, 'Nie znaleziono kolumny "ID" w tabeli szkół nauczyciela').toBeGreaterThanOrEqual(
    0,
  );

  expect(
    levelIndex,
    'Nie znaleziono kolumny "Poziom" w tabeli szkół nauczyciela',
  ).toBeGreaterThanOrEqual(0);

  expect(
    subjectIndex,
    'Nie znaleziono kolumny "Przedmiot" w tabeli szkół nauczyciela',
  ).toBeGreaterThanOrEqual(0);

  expect(
    schoolYearIndex,
    'Nie znaleziono kolumny "Rok szkolny" w tabeli szkół nauczyciela',
  ).toBeGreaterThanOrEqual(0);

  const rows = schoolsGrid.getByRole("row");

  const rowCount = await rows.count();

  const result: AnnualMedalTeacherSchoolSubjectYear[] = [];

  let currentSchoolId = "";

  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).getByRole("gridcell");

    const cellCount = await cells.count();

    if (
      cellCount === 0 ||
      cellCount <= Math.max(idIndex, levelIndex, subjectIndex, schoolYearIndex)
    ) {
      continue;
    }

    const rawSchoolId = (await cells.nth(idIndex).innerText()).trim();

    if (/^\d+$/.test(rawSchoolId)) {
      currentSchoolId = rawSchoolId;
    }

    if (currentSchoolId !== schoolId) {
      continue;
    }

    const subjectLines = (await cells.nth(subjectIndex).innerText())
      .split(/\r?\n/)
      .map((value) => value.trim());

    const levelLines = (await cells.nth(levelIndex).innerText())
      .split(/\r?\n/)
      .map((value) => value.trim());

    const schoolYearLines = (await cells.nth(schoolYearIndex).innerText())
      .split(/\r?\n/)
      .map((value) => value.trim());

    for (let j = 0; j < subjectLines.length; j++) {
      const subjectCode = subjectLines[j];

      if (!subjectCode) {
        continue;
      }

      const level = levelLines.length === 1 ? levelLines[0] : (levelLines[j] ?? "");

      const schoolYear =
        schoolYearLines.length === 1 ? schoolYearLines[0] : (schoolYearLines[j] ?? "");

      if (!level || !schoolYear) {
        continue;
      }

      result.push({
        schoolId,
        subjectLevel: `${subjectCode} ${level}`.trim(),
        schoolYear,
      });
    }
  }

  return result;
}

export type AnnualMedalExpectation = {
  qualifyingSubjectLevels: string[];

  expectedMedal: "Złoto" | "Srebro" | "Brąz" | "Brak";

  supportingTeachersExcluded: string[];

  clubMembershipExcluded: AnnualMedalClubMembershipExclusion[];

  targetSchoolYear: string;
};

class AnnualMedalTeacherVerificationError extends Error {
  constructor(
    readonly teacherId: string,
    readonly schoolId: string,
  ) {
    super(`Nie udało się zweryfikować nauczyciela ${teacherId} ` + `dla szkoły ${schoolId}.`);

    this.name = "AnnualMedalTeacherVerificationError";
  }
}

async function openAnnualMedalTeacherPanel(
  app: Octopus,
  teacherId: string,
  schoolId: string,
): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(
        `Roczna medalowość: otwieram nauczyciela ${teacherId} ` +
          `dla szkoły ${schoolId}, próba ${attempt}/2.`,
      );

      await app.openPanel("teacher", teacherId);

      return;
    } catch {
      if (attempt === 2) {
        throw new AnnualMedalTeacherVerificationError(teacherId, schoolId);
      }

      await app.page.waitForTimeout(500);
    }
  }
}

export async function getExpectedAnnualMedal(
  page: Page,
  targetProcessDate = ANNUAL_MEDAL_TARGET_PROCESS_DATE,
): Promise<AnnualMedalExpectation> {
  const schoolId = await getCurrentSchoolId(page);

  const targetSchoolYear = getAnnualTargetSchoolYear(targetProcessDate);

  const teacherSubjects = await getAnnualMedalTeacherSubjects(page);

  const supportingTeachersExcluded = [
    ...new Set(
      teacherSubjects
        .filter((subject) => subject.isGreen && subject.isSupportingTeacher)
        .map((subject) => subject.teacherId),
    ),
  ];

  const candidateSubjects = teacherSubjects.filter(
    (subject) => subject.isGreen && !subject.isSupportingTeacher,
  );

  const subjectsByTeacher = new Map<string, AnnualMedalTeacherSubject[]>();

  for (const subject of candidateSubjects) {
    const subjects = subjectsByTeacher.get(subject.teacherId) ?? [];

    subjects.push(subject);

    subjectsByTeacher.set(subject.teacherId, subjects);
  }

  const qualifyingSubjectLevels = new Set<string>();

  const clubMembershipExcluded = new Map<string, AnnualMedalClubMembershipExclusion>();

  const app = new Octopus(page);

  for (const [teacherId, subjects] of subjectsByTeacher) {
    await openAnnualMedalTeacherPanel(app, teacherId, schoolId);

    const teacherSchoolSubjects = await getTeacherSchoolSubjectYears(page, schoolId);

    for (const subject of subjects) {
      const hasMembershipForTargetYear = teacherSchoolSubjects.some(
        (teacherSchoolSubject) =>
          teacherSchoolSubject.subjectLevel === subject.subjectLevel &&
          teacherSchoolSubject.schoolYear === targetSchoolYear,
      );

      if (hasMembershipForTargetYear) {
        qualifyingSubjectLevels.add(subject.subjectLevel);

        continue;
      }

      const key = `${teacherId}|${subject.subjectLevel}`;

      clubMembershipExcluded.set(key, {
        teacherId,

        subjectLevel: subject.subjectLevel,

        targetSchoolYear,

        reason:
          `Brak klubowiczostwa dla ${subject.subjectLevel} ` +
          `w roku szkolnym ${targetSchoolYear}`,
      });
    }
  }

  const sortedQualifyingSubjectLevels = [...qualifyingSubjectLevels].sort();

  const sortedClubMembershipExcluded = [...clubMembershipExcluded.values()].sort((a, b) => {
    const teacherCompare = a.teacherId.localeCompare(b.teacherId);

    if (teacherCompare !== 0) {
      return teacherCompare;
    }

    return a.subjectLevel.localeCompare(b.subjectLevel);
  });

  let expectedMedal: "Złoto" | "Srebro" | "Brąz" | "Brak";

  switch (sortedQualifyingSubjectLevels.length) {
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

  console.log(
    `Roczna medalowość: szkoła ${schoolId}, ` +
      `docelowy rok ${targetSchoolYear}. ` +
      `Kwalifikowane: ${JSON.stringify(sortedQualifyingSubjectLevels)}.`,
  );

  if (sortedClubMembershipExcluded.length > 0) {
    console.log(
      "Roczna medalowość: przedmioty wykluczone z powodu braku klubowiczostwa:",
      JSON.stringify(sortedClubMembershipExcluded, null, 2),
    );
  }

  return {
    qualifyingSubjectLevels: sortedQualifyingSubjectLevels,

    expectedMedal,

    supportingTeachersExcluded,

    clubMembershipExcluded: sortedClubMembershipExcluded,

    targetSchoolYear,
  };
}

export type AnnualMedalSnapshotEntry = {
  school: MedalSchool;

  currentMedal: SchoolMedal;

  currentSubjectNames: string[];

  qualifyingSubjectLevels: string[];

  expectedMedal: SchoolMedal;

  supportingTeachersExcluded: string[];

  clubMembershipExcluded: AnnualMedalClubMembershipExclusion[];

  targetSchoolYear: string;
};

export async function buildAnnualMedalSnapshot(
  app: Octopus,
  schools: MedalSchool[],
  targetProcessDate = ANNUAL_MEDAL_TARGET_PROCESS_DATE,
): Promise<AnnualMedalSnapshotEntry[]> {
  const result: AnnualMedalSnapshotEntry[] = [];

  for (const school of schools) {
    await openMedalSchool(app, school);

    const expectation = await getExpectedAnnualMedal(app.page, targetProcessDate);

    const currentMedalData = await getSchoolMedalApiData(app, school);

    const allowedMedals: SchoolMedal[] = ["Złoto", "Srebro", "Brąz", "Brak"];

    expect(
      currentMedalData.medalCategoryName,
      `Szkoła ${school.id} powinna mieć poprawną wartość aktualnego medalu`,
    ).not.toBeNull();

    expect(
      allowedMedals,
      `Nieznana wartość medalu szkoły ${school.id}: ` + `"${currentMedalData.medalCategoryName}"`,
    ).toContain(currentMedalData.medalCategoryName);

    result.push({
      school,

      currentMedal: currentMedalData.medalCategoryName as SchoolMedal,

      currentSubjectNames: currentMedalData.subjectNames,

      qualifyingSubjectLevels: expectation.qualifyingSubjectLevels,

      expectedMedal: expectation.expectedMedal,

      supportingTeachersExcluded: expectation.supportingTeachersExcluded,

      clubMembershipExcluded: expectation.clubMembershipExcluded,

      targetSchoolYear: expectation.targetSchoolYear,
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

  expect(snapshot.schemaVersion, "Snapshot powinien mieć schemaVersion = 1").toBe(1);

  expect(snapshot.generatedAt, "Snapshot powinien zawierać datę wygenerowania").toMatch(
    /^\d{4}-\d{2}-\d{2}T/,
  );

  expect(snapshot.targetProcessDate, "Snapshot powinien zawierać datę procesu rocznego").toMatch(
    /^\d{4}-\d{2}-\d{2}$/,
  );

  expect(snapshot.schools.length, "Snapshot powinien zawierać szkoły referencyjne").toBeGreaterThan(
    0,
  );

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
  reserveCount = 20,
): Promise<AnnualMedalRandomCandidate[]> {
  const allMedals: SchoolMedal[] = ["Złoto", "Srebro", "Brąz", "Brak"];

  await app.openPanel("school");

  const search = await app.openSearch("school");

  const textInputs = search.locator('input:not([type="checkbox"]):not([readonly]):not([disabled])');

  const inputCount = await textInputs.count();

  for (let i = 0; i < inputCount; i++) {
    await textInputs.nth(i).fill("");
  }

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
        !Array.isArray(filterModel.institutionIds) || filterModel.institutionIds.length === 0;

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

      currentSubjectNames: school.informationAboutMedalCategory?.subjectNames ?? [],
    });
  }

  const pool = [...candidates.values()];

  expect(
    pool.length,
    `Po filtrowaniu Warszawy powinna pozostać pula co najmniej ${count} szkół`,
  ).toBeGreaterThanOrEqual(count);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const candidateCount = Math.min(pool.length, count + reserveCount);

  const selected = pool.slice(0, candidateCount);

  console.log(
    `PREP-08: wybrano ${selected.length} kandydatów ` +
      `(${count} wymaganych + maksymalnie ${reserveCount} rezerwowych).`,
  );

  console.log(
    `PREP-08: pominięto: ` +
      `REG_*=${skippedReg}, ` +
      `inne miasto=${skippedOtherCity}, ` +
      `referencyjne=${skippedReference}, ` +
      `niepoprawny medal=${skippedInvalidMedal}.`,
  );

  return selected;
}

export async function buildRandomAnnualMedalSnapshot(
  app: Octopus,
  count: number,
  excludedSchoolIds: string[] = [],
  targetProcessDate = ANNUAL_MEDAL_TARGET_PROCESS_DATE,
): Promise<AnnualMedalSnapshotEntry[]> {
  const candidates = await getRandomAnnualMedalCandidates(app, count, excludedSchoolIds, 20);

  const result: AnnualMedalSnapshotEntry[] = [];

  const skippedSchools: {
    id: string;
    name: string;
    reason: string;
  }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (result.length === count) {
      break;
    }

    const candidate = candidates[i];

    console.log(
      `PREP-08: analizuję kandydata ${i + 1}/${candidates.length}: ` +
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

    let expectation: AnnualMedalExpectation;

    try {
      expectation = await getExpectedAnnualMedal(app.page, targetProcessDate);
    } catch (error) {
      if (error instanceof AnnualMedalTeacherVerificationError) {
        const reason = `Nie udało się zweryfikować nauczyciela ` + `${error.teacherId}.`;

        skippedSchools.push({
          id: candidate.id,

          name: candidate.name,

          reason,
        });

        console.log(`PREP-08: pomijam szkołę ${candidate.id} "${candidate.name}". ` + reason);

        continue;
      }

      throw error;
    }

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

      clubMembershipExcluded: expectation.clubMembershipExcluded,

      targetSchoolYear: expectation.targetSchoolYear,
    });

    console.log(
      `PREP-08: zapisano ${result.length}/${count}: ` +
        `${candidate.id} "${candidate.name}": ` +
        `${candidate.currentMedal} → ${expectation.expectedMedal}; ` +
        `rok=${expectation.targetSchoolYear}; ` +
        `przedmioty=${JSON.stringify(expectation.qualifyingSubjectLevels)}; ` +
        `wykluczoneKlub=${expectation.clubMembershipExcluded.length}`,
    );
  }

  console.log(
    `PREP-08: pominięto podczas szczegółowej analizy: ` + `${skippedSchools.length} szkół.`,
  );

  for (const skipped of skippedSchools) {
    console.log(`  ${skipped.id} "${skipped.name}": ${skipped.reason}`);
  }

  expect(
    result,
    `Nie udało się przygotować ${count} poprawnie zweryfikowanych szkół. ` +
      `Przygotowano ${result.length}.`,
  ).toHaveLength(count);

  return result;
}
