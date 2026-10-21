import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Klienci — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-customers-record", testInfo);
});
