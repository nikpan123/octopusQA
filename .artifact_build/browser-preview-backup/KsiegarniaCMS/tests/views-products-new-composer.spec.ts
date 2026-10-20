import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy produkt: Kompozytor z wariantami", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "products-new-composer", testInfo);
});
