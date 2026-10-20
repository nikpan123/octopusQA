import { test } from "@playwright/test";
import { ProductsPage } from "../pages/products/ProductsPage";
import { ProductsAssertions } from "../assertions/products/ProductsAssertions";

test("Produkty", async ({ page }) => {
  const productsPage = new ProductsPage(page);
  const assertions = new ProductsAssertions(page, productsPage);

  await productsPage.open();

  await productsPage.clickCreateButton();
  await productsPage.waitForMenuVisible();
  await assertions.assertMenuVisible();
  await productsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});