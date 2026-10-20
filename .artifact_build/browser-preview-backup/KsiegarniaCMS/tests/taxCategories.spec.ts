import { test } from "@playwright/test";
import { TaxCategoriesPage } from "../pages/taxCategories/TaxCategoriesPage";
import { TaxCategoriesAssertions } from "../assertions/taxCategories/TaxCategoriesAssertions";

test("Kategorie podatkowe", async ({ page }) => {
  const taxCategoriesPage = new TaxCategoriesPage(page);
  const assertions = new TaxCategoriesAssertions(page, taxCategoriesPage);

  await taxCategoriesPage.open();
  await taxCategoriesPage.openFilters();

  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});