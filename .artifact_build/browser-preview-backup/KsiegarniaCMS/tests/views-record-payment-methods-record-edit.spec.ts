import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Metody płatności — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-payment-methods-record-edit", testInfo);
});
