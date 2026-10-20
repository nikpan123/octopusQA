import { test } from "@playwright/test";
import { InventoryPage } from "../pages/inventory/InventoryPage";
import { InventoryAssertions } from "../assertions/inventory/InventoryAssertions";

test("Zapasy", async ({ page }) => {
  const inventoryPage = new InventoryPage(page);
  const assertions = new InventoryAssertions(page, inventoryPage);

  await inventoryPage.open();

  await inventoryPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});