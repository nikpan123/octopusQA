import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Procesy eksportu", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-exporters", testInfo);
});
