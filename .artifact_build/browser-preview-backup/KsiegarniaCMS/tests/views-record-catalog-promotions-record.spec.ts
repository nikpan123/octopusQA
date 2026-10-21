import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje katalogowe — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-catalog-promotions-record", testInfo);
});
