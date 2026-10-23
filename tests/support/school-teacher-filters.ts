import { automaticSchoolName, automaticTeacherName } from "../../scripts/test-names.mjs";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { expect, type Locator } from "@playwright/test";
import { test as base } from "./fixtures";
import { Octopus } from "./octopus";
import { OCTOPUS_ENV } from "./environment";
import type { OctopusApiFactory } from "./api-factory";
import { ClubFormApi } from "./club-form-api";
import { backgroundSchoolSetup } from "./background-school-setup";

export type TeacherFilter = "Nauczyciele" | "Nasi" | "Obcy";
export type FilterSchool = { id: string; name: string };
export type FilterTeacher = { id: string; label: string };
type TeacherLog = Record<string, string>;

// Każdy test ma osobne dane. Rejestry REG_* obsługuje istniejący cleanup nauczycieli.
export class TeacherFilterData {
  readonly app: Octopus;
  readonly logs: TeacherLog[] = [];
  readonly schools: FilterSchool[] = [];
  readonly metadataId = randomUUID();
  readonly declarations: Array<{ teacherId: string; confirmationId: string; schoolYear: string }> =
    [];
  constructor(
    app: Octopus,
    private readonly factory: OctopusApiFactory,
    private readonly clubApi: ClubFormApi,
    readonly title: string,
  ) {
    this.app = app;
  }

  async school(label = "A"): Promise<FilterSchool> {
    const key = `REG_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const name = automaticSchoolName("TFL", "", OCTOPUS_ENV, `${key}:${label}`);
    const id = await backgroundSchoolSetup(this.app.page, async (setup) => {
      const id = await setup.createSchool(name, `TFL-${key}`, "Szkoła podstawowa");
      this.schools.push({ id, name });
      await setup.markTestRecord();
      return id;
    });
    return { id, name };
  }

  async teacher(
    school: FilterSchool,
    label: string,
    subjects = ["Matematyka"],
    otherSchools: FilterSchool[] = [],
  ): Promise<FilterTeacher> {
    expect(school.name).toMatch(/^AUTO_TFL_/);
    for (const other of otherSchools) expect(other.name).toMatch(/^AUTO_TFL_/);
    const id = `REG_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const email = `${id.toLowerCase()}@example.invalid`;
    const lastName = automaticTeacherName(id);
    const log: TeacherLog = {
      id,
      email,
      teacherLastName: lastName,
      title: this.title,
      schoolId: school.id,
      schoolName: school.name,
      result: "RUNNING",
      cleanupBatchId: process.env.OCTOPUS_CLEANUP_BATCH_ID ?? "",
      schoolRetentionStatus: "KEPT_NO_DELETE_ENDPOINT",
    };
    this.logs.push(log);
    await this.saveLog(log);
    const teacherId = await this.factory.createTeacher({
      lastName,
      email,
      schoolIds: [school.id, ...otherSchools.map((other) => other.id)],
      subjectLevels: subjects.map((subject) => ({ subject, level: "Szkoła Podstawowa" })),
    });
    log.teacherId = teacherId;
    this.clubApi.registerTeacher(teacherId, lastName, [school, ...otherSchools]);
    await this.saveLog(log);
    return { id: teacherId, label };
  }

  private async saveLog(log: TeacherLog) {
    await mkdir("runs", { recursive: true });
    await writeFile(`runs/${log.id}.json`, JSON.stringify(log, null, 2));
  }

  async finish(status: string) {
    // Zachowaj ID także wtedy, gdy zapis się udał, ale walidacja danych po API nie przeszła.
    const declarations = this.clubApi.createdDeclarations();
    await mkdir("runs", { recursive: true });
    await writeFile(
      `runs/tfl-${this.metadataId}.json`,
      JSON.stringify(
        {
          title: this.title,
          status,
          schools: this.schools,
          declarations,
          schoolRetentionStatus: "KEPT_NO_DELETE_ENDPOINT",
        },
        null,
        2,
      ),
    );
    for (const log of this.logs) {
      log.result = status === "passed" ? "PASS" : status.toUpperCase();
      log.cleanupStatus = status === "passed" ? "PENDING_SUITE_END" : "KEPT_FAILED_TEST";
      log.finishedAt = new Date().toISOString();
      log.declarations = JSON.stringify(declarations.filter((d) => d.teacherId === log.teacherId));
      await this.saveLog(log);
    }
  }

  async declare(
    teacher: FilterTeacher,
    school: FilterSchool,
    own: boolean,
    options: { subject?: string; year?: string; classes?: string[] } = {},
  ) {
    const declaration = await this.clubApi.create(teacher.id, school.id, own, options);
    this.declarations.push(declaration);
    return declaration;
  }

  async change(teacher: FilterTeacher, confirmationId: string, own: boolean) {
    await this.clubApi.change(teacher.id, confirmationId, own);
  }

  async remove(teacher: FilterTeacher, confirmationId: string) {
    await this.clubApi.remove(teacher.id, confirmationId);
  }

  async schoolYears() {
    return this.clubApi.schoolYears();
  }
}

export const test = base.extend<{ filterData: TeacherFilterData }>({
  filterData: async ({ page, apiFactory, authSession, performanceMetrics }, use, testInfo) => {
    const clubApi = new ClubFormApi(page.context().request, authSession, performanceMetrics);
    const data = new TeacherFilterData(new Octopus(page), apiFactory, clubApi, testInfo.title);
    try {
      await use(data);
    } finally {
      await data.finish(testInfo.status ?? "interrupted");
    }
  },
});

export function teacherList(app: Octopus) {
  return app.page.getByRole("tabpanel", { name: "Nauczyciele", exact: true });
}

export function filterButton(app: Octopus, filter: TeacherFilter) {
  return teacherList(app).getByRole("button", { name: new RegExp(`^${filter}:?\\s*\\d+`) });
}

export async function openFilterSchool(data: TeacherFilterData, school: FilterSchool) {
  const loaded = data.app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === "/api/SchoolTeachers/GetSchoolTeachers",
  );
  await data.app.openPanel("school", school.id);
  const response = await loaded;
  expect(response.ok(), "Lista nauczycieli szkoły powinna zostać pobrana poprawnie").toBe(true);
  await response.finished();
  await expect(data.app.detail("name")).toHaveValue(school.name);
  await expect(teacherList(data.app)).toBeVisible();
}

async function teacherIds(app: Octopus) {
  const panel = teacherList(app);
  const header = panel.getByRole("columnheader", { name: "ID", exact: true });
  await expect(header).toHaveCount(1);
  const col = await header.getAttribute("col-id");
  expect(col, "Kolumna ID nauczyciela powinna być jednoznaczna").toBeTruthy();
  return (
    await panel
      .locator(`[role="row"][row-index] [role="gridcell"][col-id="${col}"]`)
      .allTextContents()
  )
    .map((id) => id.trim())
    .sort();
}

export async function expectTeacherIds(app: Octopus, ids: string[]) {
  // Małe, kontrolowane zbiory mieszczą się w widoku; porównanie zachowuje duplikaty.
  await expect.poll(() => teacherIds(app)).toEqual([...ids].sort());
}

export async function chooseFilter(app: Octopus, filter: TeacherFilter, ids: string[]) {
  const button = filterButton(app, filter);
  await expect(button).toBeEnabled();
  await button.click();
  await expectTeacherIds(app, ids);
}

// Nauczyciele: unikalne osoby. Nasi/Obcy: pozycje przedmiotowe w tej szkole,
// odpowiednio zielone/niezielone; nie liczba wierszy po zastosowaniu filtra.
export async function expectCounters(app: Octopus, all: number, own: number, foreign: number) {
  for (const [filter, count] of [
    ["Nauczyciele", all],
    ["Nasi", own],
    ["Obcy", foreign],
  ] as const) {
    const button = filterButton(app, filter);
    await expect(button).toBeVisible();
    await expect(button).toHaveText(new RegExp(`^\\s*${filter}:?\\s*${count}\\s*$`));
  }
}

export async function mixedFilterData(data: TeacherFilterData) {
  const school = await data.school();
  const own = await data.teacher(school, "NASZ");
  await data.declare(own, school, true);
  const foreign = await data.teacher(school, "OBCY");
  await data.declare(foreign, school, false);
  const mixed = await data.teacher(school, "MIESZANY", ["Matematyka", "Język polski"]);
  await data.declare(mixed, school, true);
  await data.declare(mixed, school, false, { subject: "Język polski" });
  const unknown = await data.teacher(school, "BEZ_WPISU");
  await openFilterSchool(data, school);
  const all = [own.id, foreign.id, mixed.id, unknown.id];
  const ours = [own.id, mixed.id];
  const foreigners = [foreign.id, mixed.id];
  await expectCounters(data.app, 4, 2, 2);
  await expectTeacherIds(data.app, all);
  return { school, all, ours, foreigners, own, foreign, mixed, unknown };
}

export async function appearance(button: Locator) {
  return button.evaluate((element) => {
    // Wyróżnienie może dotyczyć samego przycisku albo jego etykiety.
    // Pomijamy tymczasowe elementy animacji kliknięcia Angular Material.
    return [element, ...element.querySelectorAll("*")]
      .filter((node) => !node.classList.contains("mat-ripple-element"))
      .map((node) => {
        const style = getComputedStyle(node);
        return [
          style.backgroundColor,
          style.borderColor,
          style.borderWidth,
          style.boxShadow,
          style.fontWeight,
          style.textDecorationLine,
        ];
      });
  });
}
