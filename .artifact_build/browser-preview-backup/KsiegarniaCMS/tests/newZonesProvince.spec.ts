import { test } from "@playwright/test";
import { NewZonesProvincePage } from "../pages/zones/NewZonesProvincePage";
import { NewZonesProvinceAssertions } from "../assertions/zones/NewZonesProvinceAssertions";

test("Nowa strefa - województwo", async ({ page }) => {
  const newZonesProvincePage = new NewZonesProvincePage(page);
  const assertions = new NewZonesProvinceAssertions(page, newZonesProvincePage);

  await newZonesProvincePage.open();

  await assertions.assertRequiredFormFieldsVisible();
  await assertions.assertFormButtonsVisible();
});