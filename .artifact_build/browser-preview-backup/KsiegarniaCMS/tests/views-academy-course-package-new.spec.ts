import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy pakiet szkoleń", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "academy-course-package-new", testInfo);
});
