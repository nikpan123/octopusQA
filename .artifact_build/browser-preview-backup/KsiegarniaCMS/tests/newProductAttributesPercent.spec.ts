import { test } from "@playwright/test";
import { NewProductAttributesPercentPage } from "../pages/productAttributes/NewProductAttributesPercentPage";
import { NewProductAttributesPercentAssertions } from "../assertions/productAttributes/NewProductAttributesPercentAssertions";

test("Nowe atrybut produktu - procent", async ({ page }) => {
  const newProductAttributesPercentPage = new NewProductAttributesPercentPage(page);
  const assertions = new NewProductAttributesPercentAssertions(page, newProductAttributesPercentPage);

  await newProductAttributesPercentPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});