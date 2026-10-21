import { test } from "@playwright/test";
import { NewPaymentMethodsStripePage } from "../pages/paymentMethods/NewPaymentMethodsStripePage";
import { NewPaymentMethodsStripeAssertions } from "../assertions/paymentMethods/NewPaymentMethodsStripeAssertions";

test("Nowa metoda płatności - stripe checkout", async ({ page }) => {
  const newPaymentMethodsStripePage = new NewPaymentMethodsStripePage(page);
  const assertions = new NewPaymentMethodsStripeAssertions(page, newPaymentMethodsStripePage);

  await newPaymentMethodsStripePage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});