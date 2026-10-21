import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Produkty — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-products-record", testInfo);
});
