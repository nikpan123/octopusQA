import { test } from "@playwright/test";
import { NewProductAttributesTextareaPage } from "../pages/productAttributes/NewProductAttributesTextareaPage";
import { NewProductAttributesTextareaAssertions } from "../assertions/productAttributes/NewProductAttributesTextareaAssertions";

test("Nowy atrybut produktu - pole tekstowe", async ({ page }) => {
  const newProductAttributesTextareaPage = new NewProductAttributesTextareaPage(page);
  const assertions = new NewProductAttributesTextareaAssertions(page, newProductAttributesTextareaPage);

  await newProductAttributesTextareaPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});
