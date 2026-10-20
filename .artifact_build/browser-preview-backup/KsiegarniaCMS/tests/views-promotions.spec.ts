import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje koszykowe", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "promotions", testInfo);
});
