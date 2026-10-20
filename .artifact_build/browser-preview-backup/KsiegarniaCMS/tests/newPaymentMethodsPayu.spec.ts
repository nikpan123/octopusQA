import { test } from "@playwright/test";
import { NewPaymentMethodsPayuPage } from "../pages/paymentMethods/NewPaymentMethodsPayuPage";
import { NewPaymentMethodsPayuAssertions } from "../assertions/paymentMethods/NewPaymentMethodsPayuAssertions";

test("Nowa metoda płatności - payu", async ({ page }) => {
  const newPaymentMethodsPayuPage = new NewPaymentMethodsPayuPage(page);
  const assertions = new NewPaymentMethodsPayuAssertions(page, newPaymentMethodsPayuPage);

  await newPaymentMethodsPayuPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});