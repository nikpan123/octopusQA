import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { test as base, expect } from "./fixtures";
import { OCTOPUS_BASE_URL } from "./environment";
import { Octopus } from "./octopus";
import type { TeacherSubjectLevel } from "./api-factory";

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
  createSchool: (schoolType?: string) => Promise<string>;
  createTeacher: (
    schoolId: string,
    relatedSchoolName?: string,
    options?: CreateScenarioTeacherOptions,
  ) => Promise<string>;
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
    await mkdir("runs", { recursive: true });
    const save = () => writeFile(`runs/${id}.json`, JSON.stringify(data, null, 2));
    const record = async (key: string, value: string) => {
      data[key] = value;
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
        createSchool: async (schoolType) => {
          const schoolId = await app.createSchool(schoolName, String(Date.now()), schoolType);
          await record("schoolId", schoolId);
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
          await record("teacherId", teacherId);
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
      if (data.teacherId)
        data.cleanupStatus = data.result === "PASS" ? "PENDING_SUITE_END" : "KEPT_FAILED_TEST";
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
