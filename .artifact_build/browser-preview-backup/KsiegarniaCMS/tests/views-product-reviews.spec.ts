import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Recenzje produktu", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-reviews", testInfo);
});
