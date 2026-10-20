import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Szkolenia dla nauczycieli — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-academy-admin-paid-courses-record-edit", testInfo);
});
