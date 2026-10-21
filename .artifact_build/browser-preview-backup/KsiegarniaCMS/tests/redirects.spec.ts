import { test } from "@playwright/test";
import { RedirectsPage } from "../pages/redirects/RedirectsPage";
import { RedirectsAssertions } from "../assertions/redirects/RedirectsAssertions";

test("Redirects", async ({ page }) => {
  const redirectsPage = new RedirectsPage(page);
  const assertions = new RedirectsAssertions(page, redirectsPage);

  await redirectsPage.open();

  await redirectsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});
