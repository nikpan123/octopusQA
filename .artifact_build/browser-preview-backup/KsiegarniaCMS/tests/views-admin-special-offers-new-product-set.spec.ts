import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa oferta specjalna — zestaw produktów", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-special-offers-new-product-set", testInfo);
});
