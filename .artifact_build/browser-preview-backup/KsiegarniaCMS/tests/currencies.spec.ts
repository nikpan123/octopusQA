import { test } from "@playwright/test";
import { CurrenciesPage } from "../pages/currencies/CurrenciesPage";
import { CurrenciesAssertions } from "../assertions/currencies/CurrenciesAssertions";

test("Waluty", async ({ page }) => {
  const currenciesPage = new CurrenciesPage(page);
  const assertions = new CurrenciesAssertions(page, currenciesPage);

  await currenciesPage.open();

  await currenciesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});