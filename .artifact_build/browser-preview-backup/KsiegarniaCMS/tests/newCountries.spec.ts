import { test } from "@playwright/test";
import { NewCountriesPage } from "../pages/countries/NewCountriesPage";
import { NewCountriesAssertions } from "../assertions/countries/NewCountriesAssertions";

test("Nowy kraj", async ({ page }) => {
  const newCountriesPage = new NewCountriesPage(page);
  const assertions = new NewCountriesAssertions(page, newCountriesPage);

  await newCountriesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});