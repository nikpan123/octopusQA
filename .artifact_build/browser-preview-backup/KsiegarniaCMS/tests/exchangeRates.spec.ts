import { test } from "@playwright/test";
import { ExchangeRatesPage } from "../pages/exchangeRates/ExchangeRatesPage";
import { ExchangeRatesAssertions } from "../assertions/exchangeRates/ExchangeRatesAssertions";

test("Kursy wymiany walut", async ({ page }) => {
  const exchangeRatesPage = new ExchangeRatesPage(page);
  const assertions = new ExchangeRatesAssertions(page, exchangeRatesPage);

  await exchangeRatesPage.open();

  await exchangeRatesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});