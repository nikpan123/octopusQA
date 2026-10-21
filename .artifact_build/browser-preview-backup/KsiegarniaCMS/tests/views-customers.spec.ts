import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Klienci", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "customers", testInfo);
});
