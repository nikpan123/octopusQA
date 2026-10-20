import { test } from "@playwright/test";
import { NewZonesCountryPage } from "../pages/zones/NewZonesCountryPage";
import { NewZonesCountryAssertions } from "../assertions/zones/NewZonesCountryAssertions";

test("Nowa strefa - kraj", async ({ page }) => {
  const newZonesCountryPage = new NewZonesCountryPage(page);
  const assertions  = new NewZonesCountryAssertions(page, newZonesCountryPage);

  await newZonesCountryPage.open();

  await assertions.assertRequiredFormFieldsVisible();
  await assertions.assertFormButtonsVisible();
});