import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Prowadzący", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "academy-admin-consultants", testInfo);
});
