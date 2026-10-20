import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Prowadzący — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-academy-admin-consultants-record-edit", testInfo);
});
