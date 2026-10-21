import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Hurtownicy — zamówienia", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-wholesale-admin-wholesaler-record-edit-wholesale-admin-wholesaler-record-wholesal-6a0ff424", testInfo);
});
