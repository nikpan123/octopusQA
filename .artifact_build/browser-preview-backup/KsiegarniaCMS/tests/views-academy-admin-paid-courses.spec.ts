import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Szkolenia dla nauczycieli", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "academy-admin-paid-courses", testInfo);
});
