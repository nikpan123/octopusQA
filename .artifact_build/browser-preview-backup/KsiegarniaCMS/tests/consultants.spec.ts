import { test } from "@playwright/test";
import { ConsultantsPage } from "../pages/consultants/ConsultantsPage";
import { ConsultantsAssertions } from "../assertions/consultants/ConsultantsAssertions";

test("Prowadzący", async ({ page }) => {
  const consultantsPage = new ConsultantsPage(page);
  const assertions = new ConsultantsAssertions(page, consultantsPage);

  await consultantsPage.open();

  await consultantsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});