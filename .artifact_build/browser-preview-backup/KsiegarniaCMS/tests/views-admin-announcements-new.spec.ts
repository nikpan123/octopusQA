import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy komunikat", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-announcements-new", testInfo);
});
