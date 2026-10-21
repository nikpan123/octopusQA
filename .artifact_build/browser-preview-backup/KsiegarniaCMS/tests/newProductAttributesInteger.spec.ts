import { test } from "@playwright/test";
import { NewProductAttributesIntegerPage } from "../pages/productAttributes/NewProductAttributesIntegerPage";
import { NewProductAttributesIntegerAssertions } from "../assertions/productAttributes/NewProductAttributesIntegerAssertions";

test("Nowe atrybut produktu - liczba całkowita", async ({ page }) => {
  const newProductAttributesIntegerPage = new NewProductAttributesIntegerPage(page);
  const assertions = new NewProductAttributesIntegerAssertions(page, newProductAttributesIntegerPage);

  await newProductAttributesIntegerPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});