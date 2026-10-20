import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Grupy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "customer-groups", testInfo);
});
