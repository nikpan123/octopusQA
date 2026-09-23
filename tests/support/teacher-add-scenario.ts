import { expect, type Page } from "@playwright/test";
import { typeValue } from "./octopus";
import type { Scenario } from "./scenario";

export async function registerCreatedTeacher(
  scenario: Scenario,
  teacherId: string,
  identity: { email?: string; lastName?: string } = {},
) {
  await scenario.record("teacherId", teacherId);
  await scenario.record("teacherEmail", identity.email ?? scenario.email);

  if (identity.lastName) {
    await scenario.record("teacherLastName", identity.lastName);
  }

  await scenario.app.markTestRecord();
}

export async function expectTeacherInSchool(
  page: Page,
  scenario: Scenario,
  schoolId: string,
  teacherId: string,
) {
  await scenario.app.openPanel("school", schoolId);

  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });
  const row = teachers.getByRole("row").filter({
    has: page.getByRole("gridcell", {
      name: teacherId,
      exact: true,
    }),
  });

  await expect(row).toHaveCount(1);
}

export async function searchTeacherByEmail(
  page: Page,
  scenario: Scenario,
  email: string,
  teacherId: string,
) {
  await scenario.app.openPanel("teacher");

  const search = await scenario.app.openSearch("teacher");
  await typeValue(scenario.app.field(search, "Email"), email);
  await search.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(search).toHaveCount(0);

  const row = scenario.app
    .results("teacher")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: teacherId,
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/teacher/teacher-panel/${teacherId}$`));
}
