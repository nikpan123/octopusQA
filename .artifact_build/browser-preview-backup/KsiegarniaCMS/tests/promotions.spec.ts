import { test } from "@playwright/test";
import { PromotionsPage } from "../pages/promotions/PromotionsPage";
import { PromotionsAssertions } from "../assertions/promotions/PromotionsAssertions";

test("Promocje koszykowe", async ({ page }) => {
  const promotionsPage = new PromotionsPage(page);
  const assertions = new PromotionsAssertions(page, promotionsPage);

  await promotionsPage.open();

  await promotionsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});
