import { test } from "@playwright/test";
import { ShipmentPage } from "../pages/shipment/ShipmentPage";
import { ShipmentAssertions } from "../assertions/shipment/ShipmentAssertions";

test("Przesyłki", async ({ page }) => {
  const shipmentPage = new ShipmentPage(page);
  const assertions = new ShipmentAssertions(page, shipmentPage);

  await shipmentPage.open();

  await shipmentPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});
