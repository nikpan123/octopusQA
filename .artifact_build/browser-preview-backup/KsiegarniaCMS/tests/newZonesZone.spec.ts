import { test } from "@playwright/test";
import { NewZonesZonePage } from "../pages/zones/NewZonesZonePage";
import { NewZonesZoneAssertions } from "../assertions/zones/NewZonesZoneAssertions";

test("Nowa strefa - inna strefa", async ({ page }) => {
  const newZonesZonePage = new NewZonesZonePage(page);
  const assertions = new NewZonesZoneAssertions(page, newZonesZonePage);

  await newZonesZonePage.open();

  await assertions.assertRequiredFormFieldsVisible();
  await assertions.assertFormButtonsVisible();
});