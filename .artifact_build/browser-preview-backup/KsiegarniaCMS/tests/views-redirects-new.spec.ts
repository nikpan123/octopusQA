import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: New redirect Manage redirects", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "redirects-new", testInfo);
});
