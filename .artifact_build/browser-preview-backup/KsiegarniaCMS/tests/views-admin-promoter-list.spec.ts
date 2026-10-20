import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Promotorzy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-promoter-list", testInfo);
});
