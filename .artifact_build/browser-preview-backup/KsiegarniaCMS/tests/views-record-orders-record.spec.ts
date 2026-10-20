import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Zamówienia — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-orders-record", testInfo);
});
