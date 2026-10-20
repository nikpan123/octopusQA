import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje koszykowe — zarządzaj kuponami — utwórz", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-promotions-record-edit-promotions-record-coupons-promotions-record-coupons-new", testInfo);
});
