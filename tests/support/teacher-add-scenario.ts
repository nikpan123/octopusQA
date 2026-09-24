import { expect, type Page } from "@playwright/test";
import { typeValue } from "./octopus";
import type { Scenario } from "./scenario";

export async function registerCreatedTeacher(
  scenario: Scenario,
  teacherId: string,
  identity: { email?: string; lastName?: string } = {},
) {
  await scenario.registerTeacher({
    teacherId,
    teacherEmail: identity.email ?? scenario.email,
    teacherLastName: identity.lastName,
  });
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
  const row = scenario.app
    .results("teacher")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: teacherId,
        exact: true,
      }),
    });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await scenario.app.openPanel("teacher");
    const search = await scenario.app.openSearch("teacher");
    await typeValue(scenario.app.field(search, "Email"), email);
    await search.getByRole("button", { name: "Szukaj", exact: true }).click();
    await expect(search).toHaveCount(0);
    if ((await row.count()) === 1) break;
    await page.waitForTimeout(500);
  }

  await expect(row).toHaveCount(1);
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/teacher/teacher-panel/${teacherId}$`));
}
