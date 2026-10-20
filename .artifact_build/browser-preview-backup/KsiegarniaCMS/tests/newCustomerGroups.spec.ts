import { test } from "@playwright/test";
import { NewCustomerGroupsPage } from "../pages/customerGroups/NewCustomerGroupsPage";
import { NewCustomerGroupsAssertions } from "../assertions/customerGroups/NewCustomerGroupsAssertions";

test("Nowa grupa klientów", async ({ page }) => {
  const newCustomerGroupsPage = new NewCustomerGroupsPage(page);
  const assertions = new NewCustomerGroupsAssertions(page, newCustomerGroupsPage);

  await newCustomerGroupsPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});