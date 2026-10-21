import { test } from "@playwright/test";
import { TaxRatesPage } from "../pages/taxRates/TaxRatesPage";
import { TaxRatesAssertions } from "../assertions/taxRates/TaxRatesAssertions";

test("Stawki podatkowe", async ({ page }) => {
  const taxRatesPage = new TaxRatesPage(page);
  const assertions = new TaxRatesAssertions(page, taxRatesPage);

  await taxRatesPage.open();

  await taxRatesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});