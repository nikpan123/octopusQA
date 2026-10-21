import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Hurtownicy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "wholesale-admin-wholesaler", testInfo);
});
