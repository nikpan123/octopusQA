import type { Page } from "@playwright/test";
import type { Scenario } from "./scenario";
import { addTeacherSubjectLevel } from "./club";

type ClubScenarioOptions = {
  schoolType?: string;
  subject?: string;
  levelOption?: string;
  levelCode?: string;
};

export async function prepareClubTeacher(
  page: Page,
  scenario: Scenario,
  options: ClubScenarioOptions = {},
) {
  const {
    schoolType = "Szkoła podstawowa",
    subject = "Matematyka",
    levelOption = "Szkoła Podstawowa",
    levelCode = "SP",
  } = options;

  const schoolId = await scenario.createSchool(schoolType);
  const teacherId = await scenario.createTeacher(schoolId);

  await addTeacherSubjectLevel(page, subject, levelOption, levelCode);
  await scenario.app.openPanel("teacher", teacherId);

  return { schoolId, teacherId };
}
