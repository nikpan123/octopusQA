import { apiStep } from "./api-step";
import { expect, type Locator, type Page } from "@playwright/test";
import { test as base, type Scenario } from "./scenario";
import { ClubFormApi, TFL_CURRENT_SCHOOL_YEAR } from "./club-form-api";
import { ensureCategorySchool } from "./school-category-data";
import { type CategorySchool } from "./school-category";
import { Octopus } from "./octopus";
import { OrderClassApi } from "./order-class";
import { liveOctopusHeaders } from "./live-auth";
import type { TeacherSubjectLevel } from "./api-factory";
import { deleteTestTeacher } from "../../scripts/cleanup-teachers.mjs";
import { OCTOPUS_ENV } from "./environment";

export const ACCESS_YEAR = Number(TFL_CURRENT_SCHOOL_YEAR.split("/")[0]);
export const GRANTED = "Przyznano";
// Taką wartość zwraca obecna implementacja. Wymagania UI mówią „Brak dostępu”.
export const DENIED = "Brak dostepu";
export const hasBokSource = (source: string) => source === "BOK" || source === "automat/BOK";
export type AccessClass = {
  class: number;
  className: string;
  scopeId: number | null;
  schoolId: number;
  levelId: number;
  isOur: boolean;
  isChecked: boolean;
  modifiedManualy?: boolean;
};
export type AccessDetail = {
  status: string;
  // Etykieta prezentowana w szczególe, np. "7 F+" albo "7 TNŚ", nie sam numer.
  class: string;
  orderedCount: number;
  threshold: number;
  reasonForLack: string | null;
  orderYears: number[] | null;
  grantedAt: string | null;
};
export type AccessRecord = {
  id: number;
  subjectId: number;
  subject: string;
  schoolId: number;
  schoolName: string;
  schoolYear: number | string;
  accessStatus: string;
  accessSource: string;
  classRange: string;
  permissionClasses: AccessClass[];
  details: AccessDetail[];
};
export type Assignment = {
  subjectId: number;
  classes: Array<{ classLevel: number; schoolLevelId: number; scope: number }>;
};

export async function entitlementSchool(
  page: Page,
  key = "PRIMARY",
  students: number | null = 400,
  testRecord = true,
  schoolType = "Szkoła podstawowa",
  label = "szkoła",
) {
  const worker = process.env.TEST_PARALLEL_INDEX ?? "0";
  return ensureCategorySchool(
    page,
    new Octopus(page),
    {
      key: `ENT_${testRecord ? "" : "UNMARKED_"}${key}_W${worker}`,
      testRecord,
      type: schoolType,
      count: students ?? undefined,
      category: students === null ? "A" : students <= 100 ? "C" : students <= 400 ? "B" : "A",
    },
    { openPanel: false, label },
  );
}

export class EntitlementData {
  private readonly orderApis = new Map<string, OrderClassApi>();
  constructor(
    readonly page: Page,
    readonly scenario: Scenario,
    readonly club: ClubFormApi,
    readonly headers: Record<string, string>,
    readonly userId: number,
    readonly teacherId: string,
    readonly schools: CategorySchool[],
  ) {}

  async get<T>(path: string, params?: Record<string, string | number>) {
    const headers = await liveOctopusHeaders(this.page);
    const response = await this.page.context().request.get(path, { headers, params });
    expect(response.ok(), `GET ${path}: HTTP ${response.status()}`).toBe(true);
    return (await response.json()) as T;
  }

  async records() {
    const rows = await this.get<AccessRecord[]>(
      "/api/TeacherAccess/GetTeacherAccessPermissionsByTeacherId",
      { teacherId: this.teacherId },
    );
    expect(Array.isArray(rows)).toBe(true);
    return rows;
  }

  async create(subject = "Matematyka", classes = ["4"], school = this.schools[0]) {
    expect(this.schools.map((item) => item.id)).toContain(school.id);
    const declaration = await this.club.create(this.teacherId, school.id, true, {
      subject,
      classes,
      year: TFL_CURRENT_SCHOOL_YEAR,
    });
    await this.scenario.record(
      `accessForm_${declaration.confirmationId}`,
      JSON.stringify(declaration),
    );
    let records: AccessRecord[] = [];
    await expect
      .poll(
        async () => {
          records = (await this.records()).filter(
            (row) =>
              row.id === Number(declaration.confirmationId) && row.schoolId === Number(school.id),
          );
          return records.length;
        },
        { message: "Aktywne potwierdzenie musi mieć rekord Uprawnień również bez zamówień" },
      )
      .toBe(1);
    const record = records[0];
    expect(String(record.schoolYear)).toMatch(
      new RegExp(`^${ACCESS_YEAR}(?:/${ACCESS_YEAR + 1})?$`),
    );
    return record;
  }

  async checkboxes(record: AccessRecord) {
    const groups = await this.get<Array<{ schoolId: number; listOfCheckBoxes: AccessClass[] }>>(
      "/api/TeacherFormClub/GetCheckBoxesToFormClub",
      { schoolIds: record.schoolId, subjectId: record.subjectId },
    );
    const group = groups.find((item) => item.schoolId === record.schoolId);
    expect(
      group,
      "Klasy przedmiotu i szkoły muszą być dostępne w słowniku potwierdzeń",
    ).toBeDefined();
    expect(group!.listOfCheckBoxes.length).toBeGreaterThan(0);
    return group!.listOfCheckBoxes;
  }

  async owned(record: AccessRecord) {
    expect(this.schools.map((item) => Number(item.id))).toContain(record.schoolId);
    expect(
      (await this.records()).some(
        (item) => item.id === record.id && item.schoolId === record.schoolId,
      ),
    ).toBe(true);
  }

  async decide(record: AccessRecord, classes: AccessClass[]) {
    return await apiStep(
      "API: zapis decyzji BOK i potwierdzenie zapisanego zakresu klas",
      async () => {
        await this.owned(record);
        expect(classes.every((item) => item.schoolId === record.schoolId)).toBe(true);
        expect(classes.every((item) => item.isOur)).toBe(true);
        const identity = (item: AccessClass) =>
          `${item.schoolId}:${item.levelId}:${item.class}:${item.scopeId}`;
        const requested = new Set(classes.map(identity));
        const groups = new Map<string, AccessClass[]>();
        for (const item of await this.checkboxes(record)) {
          const key = identity(item);
          groups.set(key, [...(groups.get(key) ?? []), item]);
        }
        for (const key of requested)
          expect(groups.has(key), `Przyznawana klasa ${key} jest dostępna dla przedmiotu`).toBe(
            true,
          );
        // To helper przygotowania dokładnego zbioru klas, nie dodawania jednej
        // decyzji do automatu. Pozostałe klasy wymagają jawnej odmowy BOK,
        // inaczej np. Promocja debiutu nadal przyznaje dostęp do klas 5–8.
        const decisions = [...groups].map(([key, options]) => {
          const isOur = requested.has(key);
          const matching = options.filter((item) => item.isOur === isOur);
          expect(
            matching.length,
            `Najwyżej jeden wariant decyzji BOK dla ${key}`,
          ).toBeLessThanOrEqual(1);
          // Słownik Fizyki zwraca TNŚ tylko po zielonej stronie. Odmowa
          // nadal dotyczy tej samej pary klasa/zakres, z isOur=false.
          const source = matching[0] ?? options[0];
          return { ...source, isOur, isChecked: true, modifiedManualy: true };
        });
        const response = await this.page
          .context()
          .request.put(`/api/TeacherAccess/UpdateTeacherAccessPermission/${record.id}`, {
            headers: await liveOctopusHeaders(this.page),
            params: { userId: this.userId },
            data: {
              accessSource: "recznie",
              accessStatus: classes.length ? GRANTED : DENIED,
              permissionClasses: decisions,
            },
          });
        expect(
          response.ok(),
          "Decyzja dotyczy wyłącznie własnego nauczyciela i potwierdzenia",
        ).toBe(true);
        await expect
          .poll(
            async () => {
              const saved = (await this.records()).find((item) => item.id === record.id);
              if (!saved) return null;
              return {
                bok: hasBokSource(saved.accessSource),
                classes: saved.permissionClasses
                  .filter((item) => item.isChecked)
                  .map((item) => `${identity(item)}:${item.isOur}`)
                  .sort(),
                granted: saved.accessStatus === GRANTED,
              };
            },
            {
              message:
                "Zapisana decyzja BOK przyznaje dokładnie wskazane klasy i odmawia pozostałym",
            },
          )
          .toEqual({
            bok: true,
            classes: decisions.map((item) => `${identity(item)}:${item.isOur}`).sort(),
            granted: classes.length > 0,
          });
      },
    );
  }

  async history(record: AccessRecord) {
    await this.owned(record);
    return this.get<Array<Record<string, unknown>>>(
      `/api/TeacherAccess/GetTeacherAccessPermissionHistory/${record.id}`,
    );
  }

  async export(year = ACCESS_YEAR) {
    const path = "/api/free-mh-distributor/ClassesWithLevels";
    // Ten endpoint nie wymaga Bearera. Nie używamy get(), które dodaje
    // Authorization dla wewnętrznego API Octopusa. Cookies bramki pozostają.
    const response = await this.page.context().request.get(path, {
      headers: {},
      params: {
        email: this.scenario.email,
        // subjectsIdText pozostaje opcjonalny: sprawdzamy cały zbiór przedmiotów.
        schoolYearsText: String(year),
      },
    });
    expect(response.ok(), `GET ${path} bez Bearera: HTTP ${response.status()}`).toBe(true);
    const rows = (await response.json()) as Array<{
      teacherId: number;
      schoolYear: number;
      teachingAssignments: Assignment[];
    }>;
    expect(Array.isArray(rows), "Eksport zwraca tablicę rekordów nauczyciel/rok").toBe(true);
    expect(
      rows.length,
      "Zapytanie o jednego nauczyciela i rok nie może zwracać duplikatów",
    ).toBeLessThanOrEqual(1);
    // Brak przyznanych przypisań może oznaczać pustą tablicę odpowiedzi.
    // Testy dodatnie nadal wymagają dokładnego, niepustego zestawu klas.
    if (rows.length === 0) return [];
    const body = rows[0];
    expect(body.teacherId).toBe(Number(this.teacherId));
    expect(body.schoolYear).toBe(year);
    expect(Array.isArray(body.teachingAssignments)).toBe(true);
    const subjectIds = body.teachingAssignments.map((item) => item.subjectId);
    expect(new Set(subjectIds).size, "Jeden obiekt na przedmiot").toBe(subjectIds.length);
    for (const assignment of body.teachingAssignments) {
      expect(Number.isSafeInteger(assignment.subjectId)).toBe(true);
      expect(Array.isArray(assignment.classes)).toBe(true);
      const identities: string[] = [];
      for (const item of assignment.classes) {
        expect(Number.isInteger(item.classLevel)).toBe(true);
        expect(Number.isInteger(item.schoolLevelId)).toBe(true);
        expect(Number.isInteger(item.scope), "Zakres w odpowiedzi jest liczbowym ID").toBe(true);
        identities.push(JSON.stringify([item.classLevel, item.schoolLevelId, item.scope]));
      }
      expect(new Set(identities).size, "Brak powtórzonych klas, poziomów i zakresów").toBe(
        identities.length,
      );
    }
    return body.teachingAssignments;
  }

  orders(school = this.schools[0]) {
    expect(this.schools.map((item) => item.id)).toContain(school.id);
    let api = this.orderApis.get(school.id);
    if (!api) {
      api = new OrderClassApi(
        this.page.context().request,
        this.headers,
        this.userId,
        school,
        this.scenario,
        () => liveOctopusHeaders(this.page),
      );
      this.orderApis.set(school.id, api);
    }
    return api;
  }

  async finish() {
    // A test can clean its orders before removing gifts; fixture teardown need not
    // repeat an empty cleanup step. Failed removals stay owned and are retried.
    if (![...this.orderApis.values()].some((api) => api.owned.size > 0)) return;
    return await apiStep(
      "Sprzątanie: usunięcie zamówień i dokumentów utworzonych przez test",
      async () => {
        const errors: unknown[] = [];
        for (const api of this.orderApis.values()) {
          for (const id of [...api.owned].reverse()) {
            try {
              await api.remove(id);
            } catch (error) {
              errors.push(error);
              await this.scenario.record(`accessOrderCleanup_${id}`, "FAILED");
            }
          }
        }
        if (errors.length) throw errors[0];
      },
    );
  }

  async open() {
    await this.scenario.app.openPanel("teacher", this.teacherId);
    await this.page.getByRole("tab", { name: "Uprawnienia", exact: true }).click();
    const panel = this.page.locator("app-teacher-permissions");
    await expect(panel).toBeVisible();
    return panel;
  }
}

export const test = base.extend<{
  access: EntitlementData;
  accessTestFlags: { teacher: boolean; school: boolean };
  accessSchoolNamespace: string;
  accessSchoolKey: string;
  accessTeacherSchools: "both" | "target";
  accessSchoolCount: 1 | 2;
  accessStudentCount: number | null;
  accessSchoolType: string;
  accessSubjectLevels: TeacherSubjectLevel[];
  accessCleanupUnmarkedTeacher: boolean;
}>({
  accessTestFlags: [{ teacher: true, school: true }, { option: true }],
  accessSchoolNamespace: ["", { option: true }],
  accessSchoolKey: ["", { option: true }],
  accessTeacherSchools: ["both", { option: true }],
  accessSchoolCount: [1, { option: true }],
  accessStudentCount: [400, { option: true }],
  accessCleanupUnmarkedTeacher: [false, { option: true }],
  accessSchoolType: ["Szkoła podstawowa", { option: true }],
  accessSubjectLevels: [
    [
      { subject: "Matematyka", level: "Szkoła Podstawowa" },
      { subject: "Fizyka", level: "Szkoła Podstawowa" },
    ],
    { option: true },
  ],
  access: [
    async (
      {
        page,
        scenario,
        authSession,
        performanceMetrics,
        accessTestFlags,
        accessSchoolNamespace,
        accessSchoolKey,
        accessTeacherSchools,
        accessSchoolCount,
        accessStudentCount,
        accessSchoolType,
        accessSubjectLevels,
        accessCleanupUnmarkedTeacher,
      },
      use,
      testInfo,
    ) => {
      if (accessSchoolNamespace && !/^[A-Za-z0-9_]{1,48}$/.test(accessSchoolNamespace))
        throw new Error("Niepoprawna przestrzeń danych uprawnień.");
      const suffix = accessSchoolNamespace ? `_${accessSchoolNamespace}` : "";
      const schools: CategorySchool[] = [];
      const schoolRoles =
        accessSchoolCount === 2
          ? ["PRIMARY", "SECOND"]
          : [accessTeacherSchools === "target" ? "SECOND" : "PRIMARY"];
      for (const role of schoolRoles) {
        schools.push(
          await entitlementSchool(
            page,
            `${accessSchoolKey}${role}${suffix}`,
            accessStudentCount,
            accessTestFlags.school,
            accessSchoolType,
            accessSchoolCount === 1
              ? "jedyna szkoła"
              : role === "PRIMARY"
                ? "pierwsza szkoła"
                : "druga szkoła",
          ),
        );
      }
      const teacherSchools =
        accessTeacherSchools === "target" ? [schools[schools.length - 1]] : schools;
      await scenario.record(
        "accessSchools",
        JSON.stringify(schools.map(({ id, name }) => ({ id, name }))),
      );
      const teacherId = await scenario.createTeacher(teacherSchools[0].id, teacherSchools[0].name, {
        // API preparation otherwise leaves the main debugger page at about:blank.
        openPanel: process.env.QA_TEST_DEBUGGER === "1",
        testRecord: accessTestFlags.teacher,
        additionalSchoolIds: teacherSchools.slice(1).map((school) => school.id),
        subjectLevels: accessSubjectLevels,
      });
      const teacherTestFlag = await page.context().request.get("/api/Teacher/GetTeacherIsTested", {
        headers: await liveOctopusHeaders(page),
        params: { teacherId },
      });
      expect(teacherTestFlag.ok(), "Odczyt flagi Testowy nowego nauczyciela").toBe(true);
      expect(await teacherTestFlag.json(), "Flaga nauczyciela zgodna z wariantem testu").toBe(
        accessTestFlags.teacher,
      );
      await scenario.record("accessTestFlags", JSON.stringify(accessTestFlags));
      const club = new ClubFormApi(page.context().request, authSession, performanceMetrics, () =>
        liveOctopusHeaders(page),
      );
      club.registerEntitlementTeacher(teacherId, scenario.id, schools);
      const storage = authSession.storageState.origins.find(
        (item) => item.origin === authSession.session.origin,
      )!.localStorage;
      const value = (name: string) => {
        const raw = storage.find((item) => item.name === name)!.value;
        try {
          return String(JSON.parse(raw));
        } catch {
          return raw;
        }
      };
      const data = new EntitlementData(
        page,
        scenario,
        club,
        {
          Authorization: `Bearer ${value("token").replace(/^Bearer\s+/i, "")}`,
        },
        Number(value("id")),
        teacherId,
        schools,
      );
      try {
        await use(data);
      } finally {
        await data.finish();
        if (!accessTestFlags.teacher && testInfo.status === "passed") {
          if (accessCleanupUnmarkedTeacher) {
            if (new URL(page.url()).pathname !== `/teacher/teacher-panel/${teacherId}`)
              await scenario.app.openPanel("teacher", teacherId);
            const status = await deleteTestTeacher(
              page,
              {
                id: scenario.runId,
                teacherId,
                teacherLastName: scenario.id,
                email: scenario.email,
                environment: OCTOPUS_ENV,
                result: "PASS",
              },
              { allowUnmarked: true },
            );
            await scenario.record("cleanupStatus", status);
            await scenario.record("cleanupFinishedAt", new Date().toISOString());
          } else {
            // Flaga nie uczestniczy w scenariuszu. Dopiero po wszystkich asercjach
            // oznaczamy własny rekord, aby istniejący bezpieczny cleanup mógł go usunąć.
            // Nieudany przypadek zostaje nieoznaczony do analizy.
            await scenario.app.openPanel("teacher", teacherId);
            await expect(scenario.app.detail("lastName")).toHaveValue(scenario.id);
            await scenario.app.markTestRecord();
            await scenario.record("unmarkedTeacherMarkedOnlyForCleanup", "true");
          }
        }
      }
      // Istniejący rejestr scenario: nauczyciel z udanego testu jest usuwany
      // na końcu przebiegu; dane nieudanego testu pozostają do analizy.
    },
    { timeout: 180000 },
  ],
});

// Only scenarios that exercise independence between schools need a second school.
export const twoSchoolTest = test.extend({ accessSchoolCount: 2 });

export function permissionRow(panel: Locator, record: AccessRecord) {
  return panel
    .locator("td.mat-column-id")
    .filter({ hasText: new RegExp(`^\\s*${record.id}\\s*$`) })
    .locator("xpath=ancestor::tr[1]");
}

export async function openPermissionDetails(panel: Locator, record: AccessRecord) {
  const row = permissionRow(panel, record);
  await expect(row).toHaveCount(1);
  await row.locator("td.mat-column-expand .expand-colapse-icon-container").click();
  const details = row
    .locator("xpath=following-sibling::tr[1]")
    .locator("app-teacher-permissions-inner-table");
  await expect(details).toBeVisible();
  return details;
}

export function canonicalAssignments(items: Assignment[]) {
  return items
    .map((item) => ({
      subjectId: item.subjectId,
      classes: [...item.classes].sort(
        (a, b) =>
          a.classLevel - b.classLevel || a.schoolLevelId - b.schoolLevelId || a.scope - b.scope,
      ),
    }))
    .sort((a, b) => a.subjectId - b.subjectId);
}

export function expectedAssignments(
  records: Array<{ record: AccessRecord; classes: AccessClass[] }>,
) {
  const groups = new Map<number, Map<string, Assignment["classes"][number]>>();
  for (const { record, classes } of records) {
    // Eksport obejmuje tylko przyznane przypisania. Brak klas nie tworzy
    // pustego przedmiotu; inny rekord tego samego przedmiotu nadal może go dodać.
    if (classes.length === 0) continue;
    const group = groups.get(record.subjectId) ?? new Map();
    groups.set(record.subjectId, group);
    for (const item of classes) {
      const value = {
        classLevel: item.class,
        schoolLevelId: item.levelId,
        scope: item.scopeId ?? 4,
      };
      group.set(JSON.stringify(value), value);
    }
  }
  return canonicalAssignments(
    [...groups].map(([subjectId, classes]) => ({ subjectId, classes: [...classes.values()] })),
  );
}
