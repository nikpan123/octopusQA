import { test } from "@playwright/test";
import { SubscriptionsPage } from "../pages/subscriptions/SubscriptionsPage";
import { SubscriptionsAssertions } from "../assertions/subscriptions/SubscriptionsAssertions";

test("Powiadomienia o dostępności", async ({ page }) => {
  const subscriptionsPage = new SubscriptionsPage(page);
  const assertions = new SubscriptionsAssertions(page, subscriptionsPage);

  await subscriptionsPage.open();

  await subscriptionsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});