import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Śledzenie kolejki", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-queue-tracker", testInfo);
});
