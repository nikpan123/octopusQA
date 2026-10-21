import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Hurtownicy — adresy — utwórz", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-wholesale-admin-wholesaler-record-edit-wholesale-admin-wholesaler-record-address--0b72a759", testInfo);
});
