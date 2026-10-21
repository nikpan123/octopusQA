import { test } from "@playwright/test";
import { NewProductAttributesDatePage } from "../pages/productAttributes/NewProductAttributesDatePage";
import { NewProductAttributesDateAssertions } from "../assertions/productAttributes/NewProductAttributesDateAssertions";

test("Nowe atrybut produktu - data", async ({ page }) => {
  const newProductAttributesDatePage = new NewProductAttributesDatePage(page);
  const assertions = new NewProductAttributesDateAssertions(page, newProductAttributesDatePage);

  await newProductAttributesDatePage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});