import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy produkt: Ebook", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "products-new-simple-ebook", testInfo);
});
