import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Warianty — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-product-options-record-edit", testInfo);
});
