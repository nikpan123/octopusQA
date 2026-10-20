import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Hurtownicy — rabaty", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-wholesale-admin-wholesaler-record-edit-wholesale-admin-wholesaler-record-wholesal-1cc13306", testInfo);
});
