import type { Page } from "@playwright/test";
import type { TeacherSubjectLevel } from "./api-factory";
import type { Scenario } from "./scenario";

type ClubScenarioOptions = {
  schoolType?: string;
  subject?: string;
  levelOption?: string;
  levelCode?: string;
  additionalSchoolIds?: string[];
  additionalSubjectLevels?: TeacherSubjectLevel[];
};

export async function prepareClubTeacher(
  _page: Page,
  scenario: Scenario,
  options: ClubScenarioOptions = {},
) {
  const {
    schoolType = "Szkoła podstawowa",
    subject = "Matematyka",
    levelOption = "Szkoła Podstawowa",
  } = options;

  const schoolId = await scenario.createSchool(schoolType);
  const teacherId = await scenario.createTeacher(schoolId, undefined, {
    additionalSchoolIds: options.additionalSchoolIds,
    subjectLevels: [{ subject, level: levelOption }, ...(options.additionalSubjectLevels ?? [])],
  });

  return { schoolId, teacherId };
}
