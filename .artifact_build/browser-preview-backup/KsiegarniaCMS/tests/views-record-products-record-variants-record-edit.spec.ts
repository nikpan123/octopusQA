import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Zapasy — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-products-record-variants-record-edit", testInfo);
});
