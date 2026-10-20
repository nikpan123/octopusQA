import { test } from "@playwright/test";
import { NewProductAttributesDatetimePage } from "../pages/productAttributes/NewProductAttributesDatetimePage";
import { NewProductAttributesDatetimeAssertions } from "../assertions/productAttributes/NewProductAttributesDatetimeAssertions";

test("Nowe atrybut produktu - data i godzina", async ({ page }) => {
  const newProductAttributesDatetimePage = new NewProductAttributesDatetimePage(page);
  const assertions = new NewProductAttributesDatetimeAssertions(page, newProductAttributesDatetimePage);

  await newProductAttributesDatetimePage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});