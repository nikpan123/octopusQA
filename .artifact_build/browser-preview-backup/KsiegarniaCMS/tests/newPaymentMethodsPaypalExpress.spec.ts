import { test } from "@playwright/test";
import { NewPaymentMethodsPaypalExpressPage } from "../pages/paymentMethods/NewPaymentMethodsPaypalExpressPage";
import { NewPaymentMethodsPaypalExpressAssertions } from "../assertions/paymentMethods/NewPaymentMethodsPaypalExpressAssertions";

test("Nowa metoda płatności - paypal express", async ({ page }) => {
  const newPaymentMethodsPaypalExpressPage = new NewPaymentMethodsPaypalExpressPage(page);
  const assertions = new NewPaymentMethodsPaypalExpressAssertions(page, newPaymentMethodsPaypalExpressPage);

  await newPaymentMethodsPaypalExpressPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});