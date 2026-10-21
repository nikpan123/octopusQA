import { test } from "@playwright/test";
import { NewProductAttributesTextPage } from "../pages/productAttributes/NewProductAttributesTextPage";
import { NewProductAttributesTextAssertions } from "../assertions/productAttributes/NewProductAttributesTextAssertions";

test("Nowy atrybut produktu - tekst", async ({ page }) => {
  const newProductAttributesTextPage = new NewProductAttributesTextPage(page);
  const assertions = new NewProductAttributesTextAssertions(page, newProductAttributesTextPage);

  await newProductAttributesTextPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});