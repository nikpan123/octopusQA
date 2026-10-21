import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Klienci — pokaż zamówienia", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-customers-record-customers-record-orders", testInfo);
});
