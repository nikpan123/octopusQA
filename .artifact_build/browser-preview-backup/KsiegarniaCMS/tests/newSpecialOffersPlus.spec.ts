import { test } from "@playwright/test";
import { NewSpecialOffersPlusPage } from "../pages/specialOffers/NewSpecialOffersPlusPage";
import { NewSpecialOffersPlusAssertions } from "../assertions/specialOffers/NewSpecialOffersPlusAssertions";

test("Nowa ofera specjalna - n + 1", async ({ page }) => {
  // Skrócone nazwy zmiennych dla czytelności
  const pageObject = new NewSpecialOffersPlusPage(page);
  const assertions = new NewSpecialOffersPlusAssertions(page, pageObject);

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