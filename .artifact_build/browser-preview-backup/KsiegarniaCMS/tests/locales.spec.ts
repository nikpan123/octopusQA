import { test } from "@playwright/test";
import { LocalesPage } from "../pages/locales/LocalesPage";
import { LocalesAssertions } from "../assertions/locales/LocalesAssertions";

test("Ustawienia regionalne", async ({ page }) => {
  const localesPage = new LocalesPage(page);
  const assertions = new LocalesAssertions(page, localesPage);

  await localesPage.open();

  await localesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});