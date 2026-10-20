import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy produkt: Kompozytor", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "products-new-simple-composer", testInfo);
});
