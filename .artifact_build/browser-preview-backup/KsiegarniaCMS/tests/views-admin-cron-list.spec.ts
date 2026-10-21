import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Zaplanowane zadania", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-cron-list", testInfo);
});
