import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy produkt: Aplikacja z wariantami", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "products-new-app", testInfo);
});
