import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Import prod. powiązanych", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-import-products-association", testInfo);
});
