import { test } from "@playwright/test";
import { OrdersPage } from "../pages/orders/OrdersPage";
import { OrdersAssertions } from "../assertions/orders/OrdersAssertions";

test("Zamówienia", async ({ page }) => {
  const ordersPage = new OrdersPage(page);
  const assertions = new OrdersAssertions(page, ordersPage);

  await ordersPage.open();

  await ordersPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});