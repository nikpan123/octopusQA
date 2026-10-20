import { test } from "@playwright/test";
import { PaymentMethodsPage } from "../pages/paymentMethods/PaymentMethodsPage";
import { PaymentMethodsAssertions } from "../assertions/paymentMethods/PaymentMethodsAssertions";

test("Metody płatności", async ({ page }) => {
  const paymentMethodsPage = new PaymentMethodsPage(page);
  const assertions = new PaymentMethodsAssertions(page, paymentMethodsPage);

  await paymentMethodsPage.open();

  await paymentMethodsPage.clickCreateButton();
  await paymentMethodsPage.waitForMenuVisible();
  await assertions.assertMenuVisible();
  await paymentMethodsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});