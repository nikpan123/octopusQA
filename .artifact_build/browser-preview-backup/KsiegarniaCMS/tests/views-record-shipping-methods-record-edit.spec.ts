import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Sposób wysyłki — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-shipping-methods-record-edit", testInfo);
});
