import { test } from "@playwright/test";
import { ClosedCoursesPage } from "../pages/closedCourses/ClosedCoursesPage";
import { ClosedCoursesAssertions } from "../assertions/closedCourses/ClosedCoursesAssertions";

test("Szkolenia dla rad", async ({ page }) => {
  const closedCoursesPage = new ClosedCoursesPage(page);
  const assertions = new ClosedCoursesAssertions(page, closedCoursesPage);

  await closedCoursesPage.open();

  await closedCoursesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});