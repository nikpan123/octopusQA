import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Pakiety szkoleń — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-academy-course-package-record-edit", testInfo);
});
