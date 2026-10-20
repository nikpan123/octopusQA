import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa metoda płatności — PayU", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "payment-methods-new-payu", testInfo);
});
