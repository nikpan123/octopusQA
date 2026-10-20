import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Kategorie wysyłki", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "shipping-categories", testInfo);
});
