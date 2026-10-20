import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promocje koszykowe — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-promotions-record-edit", testInfo);
});
