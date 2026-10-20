import { test } from "@playwright/test";
import { CustomerGroupsPage } from "../pages/customerGroups/CustomerGroupsPage";
import { CustomerGroupsAssertions } from "../assertions/customerGroups/CustomerGroupsAssertions";

test("Grupy klientów", async ({ page }) => {
  const customerGroupsPage = new CustomerGroupsPage(page);
  const assertions = new CustomerGroupsAssertions(page, customerGroupsPage);

  await customerGroupsPage.open();

  await customerGroupsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertCustomerGroupsTableVisible();
  await assertions.assertButtonsVisible();
});