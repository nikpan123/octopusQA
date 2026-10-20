import { test } from "@playwright/test";
import { NewShippingMethodsPage } from "../pages/shippingMethods/NewShippingMethodsPage";
import { NewShippingMethodsAssertions } from "../assertions/shippingMethods/NewShippingMethodsAssertions";

test("Nowa metoda wysyłki", async ({ page }) => {
  const newShippingMethodsPage = new NewShippingMethodsPage(page);
  const assertions = new NewShippingMethodsAssertions(page, newShippingMethodsPage);

  await newShippingMethodsPage.open();
  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});
