import { test } from "@playwright/test";
import { NewProductAttributesSelectPage } from "../pages/productAttributes/NewProductAttributesSelectPage";
import { NewProductAttributesSelectAssertions } from "../assertions/productAttributes/NewProductAttributesSelectAssertions";

test("Nowe atrybut produktu - wybierz", async ({ page }) => {
  const newProductAttributesSelectPage = new NewProductAttributesSelectPage(page);
  const assertions = new NewProductAttributesSelectAssertions(page, newProductAttributesSelectPage);

  await newProductAttributesSelectPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});