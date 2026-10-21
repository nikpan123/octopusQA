import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje katalogowe — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-catalog-promotions-record-edit", testInfo);
});
