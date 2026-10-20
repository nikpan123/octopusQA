import { test } from "@playwright/test";
import { NewShippingCategoriesPage } from "../pages/shippingCategories/NewShippingCategoriesPage";
import { NewShippingCategoriesAssertions } from "../assertions/shippingCategories/NewShippingCategoriesAssertions";

test("Nowa kategoria wysyłki", async ({ page }) => {
  const newShippingCategoriesPage = new NewShippingCategoriesPage(page);
  const assertions = new NewShippingCategoriesAssertions(page, newShippingCategoriesPage);

  await newShippingCategoriesPage.open();
  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});
