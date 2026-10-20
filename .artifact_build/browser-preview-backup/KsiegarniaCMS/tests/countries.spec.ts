import { test } from "@playwright/test";
import { CountriesPage } from "../pages/countries/CountriesPage";
import { CountriesAssertions } from "../assertions/countries/CountriesAssertions";

test("Kraje", async ({ page }) => {
  const countriesPage = new CountriesPage(page);
  const assertions = new CountriesAssertions(page, countriesPage);

  await countriesPage.open();

  await countriesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});