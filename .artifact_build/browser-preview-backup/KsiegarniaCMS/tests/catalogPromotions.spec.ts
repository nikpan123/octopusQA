import { test } from "@playwright/test";
import { CatalogPromotionsPage } from "../pages/catalogPromotions/CatalogPromotionsPage";
import { CatalogPromotionsAssertions } from "../assertions/catalogPromotions/CatalogPromotionsAssertions";

test("Promocje katalogowe", async ({ page }) => {
  const catalogPromotionsPage = new CatalogPromotionsPage(page);
  const assertions = new CatalogPromotionsAssertions(page, catalogPromotionsPage);

  await catalogPromotionsPage.open();

  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});