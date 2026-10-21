import { test } from "@playwright/test";
import { PaymentsPage } from "../pages/payments/PaymentsPage";
import { PaymentsAssertions } from "../assertions/payments/PaymentsAssertions";

test("Płatności", async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const assertions = new PaymentsAssertions(page, paymentsPage);

  await paymentsPage.open();

  await paymentsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});