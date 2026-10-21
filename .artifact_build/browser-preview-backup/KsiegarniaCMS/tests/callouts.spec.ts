import { test } from "@playwright/test";
import { CalloutsPage } from "../pages/callouts/CalloutsPage";
import { CalloutsAssertions } from "../assertions/callouts/CalloutsAssertions";

test("Labelki", async ({ page }) => {
  const calloutsPage = new CalloutsPage(page);
  const assertions = new CalloutsAssertions(page, calloutsPage);

  await calloutsPage.open();

  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});