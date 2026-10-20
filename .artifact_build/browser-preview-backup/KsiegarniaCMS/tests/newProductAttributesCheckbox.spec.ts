import { test } from "@playwright/test";
import { NewProductAttributesCheckboxPage } from "../pages/productAttributes/NewProductAttributesCheckboxPage";
import { NewProductAttributesCheckboxAssertions } from "../assertions/productAttributes/NewProductAttributesCheckboxAssertions";

test("Nowe atrybut produktu - pole wyboru", async ({ page }) => {
  const newProductAttributesCheckboxPage = new NewProductAttributesCheckboxPage(page);
  const assertions = new NewProductAttributesCheckboxAssertions(page, newProductAttributesCheckboxPage);

  await newProductAttributesCheckboxPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});