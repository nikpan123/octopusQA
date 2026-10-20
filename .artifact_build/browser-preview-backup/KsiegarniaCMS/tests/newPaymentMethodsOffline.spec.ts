import { test } from "@playwright/test";
import { NewPaymentMethodsOfflinePage } from "../pages/paymentMethods/NewPaymentMethodsOfflinePage";
import { NewPaymentMethodsOfflineAssertions } from "../assertions/paymentMethods/NewPaymentMethodsOfflineAssertions";

test("Nowa metoda płatności - offline", async ({ page }) => {
  const newPaymentMethodsOfflinePage = new NewPaymentMethodsOfflinePage(page);
  const assertions = new NewPaymentMethodsOfflineAssertions(page, newPaymentMethodsOfflinePage);

  await newPaymentMethodsOfflinePage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});