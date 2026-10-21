import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Klienci — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-customers-record-edit", testInfo);
});
