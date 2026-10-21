import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa metoda płatności — PayPal Express", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "payment-methods-new-paypal-express-checkout", testInfo);
});
