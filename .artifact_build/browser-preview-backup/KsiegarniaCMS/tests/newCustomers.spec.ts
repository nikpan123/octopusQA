import { test } from "@playwright/test";
import { NewCustomersPage } from "../pages/customers/NewCustomersPage";
import { NewCustomersAssertions } from "../assertions/customers/NewCustomersAssertions";

test("Nowy klient", async ({ page }) => {
  const newCustomersPage = new NewCustomersPage(page);
  const assertions = new NewCustomersAssertions(page, newCustomersPage);

  await newCustomersPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});