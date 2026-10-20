import { test } from "@playwright/test";
import { NewCoursePackagePage } from "../pages/coursePackage/NewCoursePackagePage";
import { NewCoursePackageAssertions } from "../assertions/coursePackage/NewCoursePackageAssertions";

test("Nowy pakiet szkoleń", async ({ page }) => {
  const newCoursePackagePage = new NewCoursePackagePage(page);
  const assertions = new NewCoursePackageAssertions(page, newCoursePackagePage);

  await newCoursePackagePage.open();

  await assertions.assertButtonsVisible();
  await newCoursePackagePage.clickFormAddButton();
  await assertions.assertButtonsVisibleAfterAdd();
  await assertions.assertFormVisible();
});