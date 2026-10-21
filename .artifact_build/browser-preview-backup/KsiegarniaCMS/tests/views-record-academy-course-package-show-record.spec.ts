import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Pakiety szkoleń — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-academy-course-package-show-record", testInfo);
});
