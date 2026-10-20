import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Komunikaty — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-admin-announcements-record-edit", testInfo);
});
