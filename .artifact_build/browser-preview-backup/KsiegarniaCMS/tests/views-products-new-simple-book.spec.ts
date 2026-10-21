import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy produkt: Książka", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "products-new-simple-book", testInfo);
});
