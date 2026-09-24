import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { test as base, expect } from "./fixtures";
import { OCTOPUS_BASE_URL } from "./environment";
import { Octopus } from "./octopus";
import type { CreateSchoolOptions, TeacherSubjectLevel } from "./api-factory";

export type CreateScenarioTeacherOptions = {
  additionalSchoolIds?: string[];
  subjectLevels?: TeacherSubjectLevel[];
};

export type Scenario = {
  app: Octopus;
  id: string;
  schoolName: string;
  email: string;
  record: (key: string, value: string) => Promise<void>;
  /*
   * Jeden przebieg scenariusza może utworzyć WIĘCEJ NIŻ JEDNEGO nauczyciela
   * (np. część "dodawanie" i część "edycja" tego samego testu
   * kontraktowego) - w odróżnieniu od record() ta metoda DOPISUJE do listy
   * zamiast nadpisywać jedno pole, więc żaden utworzony nauczyciel nie
   * "gubi się" dla globalnego sprzątania (patrz scripts/cleanup-teachers.mjs,
   * getTeacherEntries). createTeacher() i registerCreatedTeacher() (support/
   * teacher-add-scenario.ts) wołają ją automatycznie - w większości testów
   * nie trzeba wołać jej ręcznie.
   */
  registerTeacher: (entry: {
    teacherId: string;
    teacherEmail?: string;
    teacherLastName?: string;
  }) => Promise<void>;
  /*
   * Aktualizuje oczekiwaną tożsamość (e-mail/nazwisko) JUŻ zarejestrowanego
   * nauczyciela - potrzebne, gdy test edytuje te dane po utworzeniu, a
   * sprzątanie musi dopasować rekord po NOWEJ, a nie pierwotnej wartości.
   */
  updateTeacherIdentity: (
    teacherId: string,
    identity: { email?: string; lastName?: string },
  ) => Promise<void>;
  createSchool: (schoolType?: string) => Promise<string>;
  /*
   * Szybka alternatywa dla createSchool(): tworzy szkołę jednym
   * żądaniem POST /api/Institution/AddNewInstitution zamiast przez
   * pełny formularz UI. Domyślnie potwierdzona jest wyłącznie
   * kombinacja "Szkoła podstawowa" + Gdańsk (80-064) - patrz komentarz
   * przy CreateSchoolOptions w support/api-factory.ts. Nie nadaje się
   * do testów, które celowo weryfikują sam formularz dodawania szkoły
   * (te muszą zostać przy createSchool/UI) - jest za to dobrym wyborem
   * tam, gdzie istnienie szkoły jest tylko warunkiem wstępnym (np.
   * testy edycji szkoły, zamówień itp.).
   */
  createSchoolViaApi: (options?: CreateSchoolOptions) => Promise<string>;
  createTeacher: (
    schoolId: string,
    relatedSchoolName?: string,
    options?: CreateScenarioTeacherOptions,
  ) => Promise<string>;
};

type TeacherRunEntry = {
  teacherId: string;
  teacherEmail: string;
  teacherLastName?: string;
  cleanupStatus?: string;
  cleanupFinishedAt?: string;
};

export const test = base.extend<{ scenario: Scenario }>({
  scenario: async ({ page, apiFactory, performanceMetrics }, use, testInfo) => {
    const app = new Octopus(page);
    const id = `REG_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const schoolName = `${id} Szkoła testowa`;
    const email = `${id.toLowerCase()}@example.invalid`;
    const data: Record<string, string> = {
      id,
      schoolName,
      email,
      title: testInfo.title,
      result: "RUNNING",
      cleanupBatchId: process.env.OCTOPUS_CLEANUP_BATCH_ID ?? "",
    };
    const teacherRecords: TeacherRunEntry[] = [];
    await mkdir("runs", { recursive: true });
    const save = () => writeFile(`runs/${id}.json`, JSON.stringify(data, null, 2));
    const record = async (key: string, value: string) => {
      data[key] = value;
      await save();
    };
    const registerTeacher = async (entry: {
      teacherId: string;
      teacherEmail?: string;
      teacherLastName?: string;
    }) => {
      teacherRecords.push({
        teacherId: entry.teacherId,
        teacherEmail: entry.teacherEmail ?? email,
        ...(entry.teacherLastName ? { teacherLastName: entry.teacherLastName } : {}),
      });
      // Pole informacyjne: ostatni utworzony nauczyciel, wygodne do
      // wyświetlenia/powiązania (np. cleanup-preview.mjs). Autorytatywnym
      // źródłem dla sprzątania jest zawsze data.teachers.
      data.teacherId = entry.teacherId;
      data.teachers = JSON.stringify(teacherRecords);
      await save();
    };
    const updateTeacherIdentity = async (
      teacherId: string,
      identity: { email?: string; lastName?: string },
    ) => {
      const target = teacherRecords.find((t) => t.teacherId === teacherId);
      if (!target) {
        throw new Error(
          `updateTeacherIdentity: nie znaleziono zarejestrowanego nauczyciela ${teacherId} - ` +
            "wywołaj registerTeacher()/createTeacher() przed aktualizacją tożsamości.",
        );
      }
      if (identity.email !== undefined) target.teacherEmail = identity.email;
      if (identity.lastName !== undefined) target.teacherLastName = identity.lastName;
      data.teachers = JSON.stringify(teacherRecords);
      await save();
    };
    await performanceMetrics.measure("fixture.scenario.setup", save);
    try {
      await use({
        app,
        id,
        schoolName,
        email,
        record,
        registerTeacher,
        updateTeacherIdentity,
        createSchool: async (schoolType) => {
          const schoolId = await app.createSchool(schoolName, String(Date.now()), schoolType);
          await record("schoolId", schoolId);
          await app.markTestRecord();
          return schoolId;
        },
        createSchoolViaApi: async (options = {}) => {
          const schoolId = await apiFactory.createSchool({
            name: options.name ?? schoolName,
            ...options,
          });
          await record("schoolId", schoolId);
          await record("schoolCreationMethod", "API");
          // markTestRecord() wymaga otwartego panelu szkoły w UI - to
          // jedyny potwierdzony sposób oznaczenia rekordu jako testowego
          // (patrz komentarz w OctopusApiFactory.createSchool).
          await app.openPanel("school", schoolId);
          await app.markTestRecord();
          return schoolId;
        },
        createTeacher: async (schoolId, relatedSchoolName = schoolName, options = {}) => {
          await record("schoolId", schoolId);
          await record("relatedSchoolName", relatedSchoolName);
          const teacherId = await apiFactory.createTeacher({
            lastName: id,
            email,
            schoolIds: [schoolId, ...(options.additionalSchoolIds ?? [])],
            subjectLevels: options.subjectLevels,
          });
          await registerTeacher({ teacherId, teacherEmail: email });
          await app.openPanel("teacher", teacherId);
          return teacherId;
        },
      });
    } finally {
      // Przy błędzie po zapisie zachowaj adres także wtedy, gdy asercja
      // przerwała helper przed zwróceniem ID.
      const current = new URL(page.url());
      if (current.origin === OCTOPUS_BASE_URL && /^\/(teacher|school)\//.test(current.pathname)) {
        data.lastUrl = current.toString();
      }
      data.result = testInfo.status === "passed" ? "PASS" : String(testInfo.status).toUpperCase();
      data.finishedAt = new Date().toISOString();
      if (teacherRecords.length) {
        const initialStatus = data.result === "PASS" ? "PENDING_SUITE_END" : "KEPT_FAILED_TEST";
        for (const teacher of teacherRecords) {
          if (!teacher.cleanupStatus) teacher.cleanupStatus = initialStatus;
        }
        data.teachers = JSON.stringify(teacherRecords);
      }
      await performanceMetrics.measure("fixture.scenario.cleanup", async () => {
        await save();
        await testInfo.attach("Dane scenariusza", {
          body: JSON.stringify(data, null, 2),
          contentType: "application/json",
        });
      });
    }
  },
});
export { expect };
