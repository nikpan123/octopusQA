import { test } from "@playwright/test";
import { ProductAttributesPage } from "../pages/productAttributes/ProductAttributesPage";
import { ProductAttributesAssertions } from "../assertions/productAttributes/ProductAttributesAssertions";

test("Atrybuty produktu", async ({ page }) => {
  const productAttributesPage = new ProductAttributesPage(page);
  const assertions = new ProductAttributesAssertions(page, productAttributesPage);

  await productAttributesPage.open();

  await productAttributesPage.clickCreateButton();
  await productAttributesPage.waitForMenuVisible();
  await assertions.assertMenuVisible();

  await productAttributesPage.openFilters();
  await assertions.assertFiltersVisible();

  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});