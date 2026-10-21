import { test } from "@playwright/test";
import { NewTaxRatesPage } from "../pages/taxRates/NewTaxRatesPage";
import { NewTaxRatesAssertions } from "../assertions/taxRates/NewTaxRatesAssertions";

test("Nowa stawka podatkowa", async ({ page }) => {
  const newTaxRatesPage = new NewTaxRatesPage(page);
  const assertions = new NewTaxRatesAssertions(page, newTaxRatesPage);

  await newTaxRatesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});