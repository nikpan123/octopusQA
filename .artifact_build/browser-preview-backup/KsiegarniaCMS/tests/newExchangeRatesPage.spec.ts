import { test } from "@playwright/test";
import { NewExchangeRatesPage } from "../pages/exchangeRates/NewExchangeRatesPage";
import { NewExchangeRatesAssertions } from "../assertions/exchangeRates/NewExchangeRatesAssertions";

test("Nowy kurs wymiany", async ({ page }) => {
  const newExchangeRatesPage = new NewExchangeRatesPage(page);
  const assertions = new NewExchangeRatesAssertions(page, newExchangeRatesPage);

  await newExchangeRatesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});