import { test } from "@playwright/test";
import { SpecialOffersPage } from "../pages/specialOffers/SpecialOffersPage";
import { SpecialOffersAssertions } from "../assertions/specialOffers/SpecialOffersAssertions";

test("Oferty specjalne", async ({ page }) => {
  const specialOffersPage = new SpecialOffersPage(page);
  const assertions = new SpecialOffersAssertions(page, specialOffersPage);

  await specialOffersPage.open();

  await specialOffersPage.clickCreateButton();
  await specialOffersPage.waitForMenuVisible();
  await assertions.assertMenuOptionsVisible();

  await specialOffersPage.openFilters();
  await assertions.assertFiltersVisible();

  await assertions.assertTableVisible();
  
  await assertions.assertButtonsVisible();
});