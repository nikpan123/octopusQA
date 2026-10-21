import { test } from "@playwright/test";
import { NewCatalogPromotionPage } from "../pages/catalogPromotions/NewCatalogPromotionPage";
import { NewCatalogPromotionAssertions } from "../assertions/catalogPromotions/NewCatalogPromotionAssertions";

test("Nowa promocja katalogowa", async ({ page }) => {
  const newCatalogPromotionPage = new NewCatalogPromotionPage(page);
  const assertions = new NewCatalogPromotionAssertions(page, newCatalogPromotionPage);

  await newCatalogPromotionPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});