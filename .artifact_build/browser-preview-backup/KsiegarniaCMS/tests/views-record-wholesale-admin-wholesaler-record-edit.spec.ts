import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Hurtownicy — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-wholesale-admin-wholesaler-record-edit", testInfo);
});
