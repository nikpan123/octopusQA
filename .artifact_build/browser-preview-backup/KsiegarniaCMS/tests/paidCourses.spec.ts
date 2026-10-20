import { test } from "@playwright/test";
import { PaidCoursesPage } from "../pages/paidCourses/PaidCoursesPage";
import { PaidCoursesAssertions } from "../assertions/paidCourses/PaidCoursesAssertions";

test("Szkolenia dla nauczycieli", async ({ page }) => {
  const paidCoursesPage = new PaidCoursesPage(page);
  const assertions = new PaidCoursesAssertions(page, paidCoursesPage);

  await paidCoursesPage.open();

  await paidCoursesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});
