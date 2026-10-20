import { test } from "@playwright/test";
import { TaxonsPage } from "../pages/taxons/TaxonsPage";
import { TaxonsAssertions } from "../assertions/taxons/TaxonsAssertions";

test("Nowa taksonomia", async ({ page }) => {
  const taxonsPage = new TaxonsPage(page);
  const assertions = new TaxonsAssertions(page, taxonsPage);

  await taxonsPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});