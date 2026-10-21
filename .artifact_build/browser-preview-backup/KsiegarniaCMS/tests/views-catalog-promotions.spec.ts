import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje katalogowe", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "catalog-promotions", testInfo);
});
