import { test } from "@playwright/test";
import { ShippingCategoriesPage } from "../pages/shippingCategories/ShippingCategoriesPage";
import { ShippingCategoriesAssertions } from "../assertions/shippingCategories/ShippingCategoriesAssertions";

test("Kategorie wysyłki", async ({ page }) => {
  const shippingCategoriesPage = new ShippingCategoriesPage(page);
  const assertions = new ShippingCategoriesAssertions(page, shippingCategoriesPage);

  await shippingCategoriesPage.open();

  await shippingCategoriesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});
