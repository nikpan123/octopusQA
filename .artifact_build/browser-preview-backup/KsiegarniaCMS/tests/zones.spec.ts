import { test } from "@playwright/test";
import { ZonesPage } from "../pages/zones/ZonesPage";
import { ZonesAssertions } from "../assertions/zones/ZonesAssertions";

test("Strefy", async ({ page }) => {
  const zonesPage = new ZonesPage(page);
  const assertions = new ZonesAssertions(page, zonesPage);

  await zonesPage.open();

  await zonesPage.clickCreateButton();
  await zonesPage.waitForMenuVisible()
  await assertions.assertMenuOptionVisible();

  await zonesPage.openFilters();
  await assertions.assertFiltersVisible();

  await assertions.assertTableVisible();
  
  await assertions.assertButtonsVisible();
});