import { test } from "@playwright/test";
import { NewCurrenciesPage } from "../pages/currencies/NewCurrenciesPage";
import { NewCurrenciesAssertions } from "../assertions/currencies/NewCurrenciesAssertions";

test("Nowa waluta", async ({ page }) => {
  const newCurrenciesPage = new NewCurrenciesPage(page);
  const assertions = new NewCurrenciesAssertions(page, newCurrenciesPage);

  await newCurrenciesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});