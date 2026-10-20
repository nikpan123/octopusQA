import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Hurtownicy — adresy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-wholesale-admin-wholesaler-record-edit-wholesale-admin-wholesaler-record-address-record", testInfo);
});
