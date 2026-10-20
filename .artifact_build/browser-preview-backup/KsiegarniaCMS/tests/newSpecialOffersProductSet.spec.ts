import { test } from "@playwright/test";
import { NewSpecialOffersProductSetPage } from "../pages/specialOffers/NewSpecialOffersProductSetPage";
import { NewSpecialOffersProductSetAssertions } from "../assertions/specialOffers/NewSpecialOffersProductSetAssertions";

test("Nowa ofera bazująca na zestawach", async ({ page }) => {
  // Skrócone nazwy zmiennych dla czytelności
  const pageObject = new NewSpecialOffersProductSetPage(page);
  const assertions = new NewSpecialOffersProductSetAssertions(page, pageObject);

  // Otwarcie strony
  await pageObject.open();

  // Lista zakładek i odpowiadających im metod
  const tabs = [
    { click: pageObject.clickDetailsTab, check: assertions.assertDetailsTabVisible },
    { click: pageObject.clickTaxonomyTab, check: assertions.assertTaxonomyTabVisible },
    { click: pageObject.clickAttributesTab, check: assertions.assertAttributesTabVisible },
    { click: pageObject.clickAssociationsTab, check: assertions.assertAssociationsTabVisible },
    { click: pageObject.clickMediaTab, check: assertions.assertMediaTabVisible },
    { click: pageObject.clickCalloutTab, check: assertions.assertCalloutTabVisible },
  ];

  // Pętla po zakładkach
  for (const { click, check } of tabs) {
    await click.call(pageObject); // Kliknięcie w zakładkę
    await check.call(assertions); // Sprawdzenie widoczności
  }

  // Sprawdzenie przycisków (nie wymaga zakładki)
  await assertions.assertButtonsVisible();
});