import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy wariant produktu", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-products-record-variants-new", testInfo);
});
