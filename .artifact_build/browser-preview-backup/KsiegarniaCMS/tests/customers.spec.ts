import { test } from "@playwright/test";
import { CustomersPage } from "../pages/customers/CustomersPage";
import { CustomersAssertions } from "../assertions/customers/CustomersAssertions";

test("Klienci", async ({ page }) => {
  const customersPage = new CustomersPage(page);
  const assertions = new CustomersAssertions(page, customersPage);

  await customersPage.open();

  await customersPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.checkCustomersTableVisibility();
  await assertions.checkButtonPresence();
});