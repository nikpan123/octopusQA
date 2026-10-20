import { test } from "@playwright/test";
import { NewTaxCategoriesPage } from "../pages/taxCategories/NewTaxCategoriesPage";
import { NewTaxCategoriesAssertions } from "../assertions/taxCategories/NewTaxCategoriesAssertions";

test("Nowa kategoria podatkowa", async ({ page }) => {
  const newTaxCategoriesPage = new NewTaxCategoriesPage(page);
  const assertions = new NewTaxCategoriesAssertions(page, newTaxCategoriesPage);

  await newTaxCategoriesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});