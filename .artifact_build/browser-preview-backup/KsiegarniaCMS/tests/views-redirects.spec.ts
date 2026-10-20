import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Redirects", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "redirects", testInfo);
});
