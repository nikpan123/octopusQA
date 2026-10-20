import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Komunikaty", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-announcements", testInfo);
});
