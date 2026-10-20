import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Cechy — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-product-attributes-record-edit", testInfo);
});
