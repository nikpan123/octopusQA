import { test } from "@playwright/test";
import { NewCartPromotionPage } from "../pages/promotions/NewCartPromotionPage";
import { NewCartPromotionAssertions } from "../assertions/promotions/NewCartPromotionAssertions";

test("Nowa promocja koszykowa", async ({ page }) => {
  const newCartPromotionPage = new NewCartPromotionPage(page);
  const assertions = new NewCartPromotionAssertions(page, newCartPromotionPage);

  await newCartPromotionPage.open();
  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});
