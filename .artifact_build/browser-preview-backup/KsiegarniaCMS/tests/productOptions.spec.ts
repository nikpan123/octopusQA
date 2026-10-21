import { test } from "@playwright/test";
import { ProductOptionsPage } from "../pages/productOptions/ProductOptionsPage";
import { ProductOptionsAssertions } from "../assertions/productOptions/ProductOptionsAssertions";

test("Opcje produktu", async ({ page }) => {
  const productOptionsPage = new ProductOptionsPage(page);
  const assertions = new ProductOptionsAssertions(page, productOptionsPage);

  await productOptionsPage.open();

  await productOptionsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});