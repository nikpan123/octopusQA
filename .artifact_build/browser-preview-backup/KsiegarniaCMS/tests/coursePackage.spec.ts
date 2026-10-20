import { test } from "@playwright/test";
import { CoursePackagePage } from "../pages/coursePackage/CoursePackagePage";
import { CoursePackageAssertions } from "../assertions/coursePackage/CoursePackageAssertions";

test("Pakiety szkoleń", async ({ page }) => {
  const coursePackagePage = new CoursePackagePage(page);
  const assertions = new CoursePackageAssertions(page, coursePackagePage);

  await coursePackagePage.open();

  await coursePackagePage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});