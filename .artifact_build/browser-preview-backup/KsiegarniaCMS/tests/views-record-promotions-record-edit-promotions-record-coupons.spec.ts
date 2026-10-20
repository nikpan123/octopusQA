import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje koszykowe — zarządzaj kuponami", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-promotions-record-edit-promotions-record-coupons", testInfo);
});
