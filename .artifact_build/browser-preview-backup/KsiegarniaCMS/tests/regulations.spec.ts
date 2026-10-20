import { test } from "@playwright/test";
import { RegulationsPage } from "../pages/regulations/RegulationsPage";
import { RegulationsAssertions } from "../assertions/regulations/RegulationsAssertions";

test("Regulaminy", async ({ page }) => {
  const regulationsPage = new RegulationsPage(page);
  const assertions = new RegulationsAssertions(page, regulationsPage);

  await regulationsPage.open();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});
