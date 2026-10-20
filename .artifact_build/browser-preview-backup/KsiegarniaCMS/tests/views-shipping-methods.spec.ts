import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Sposób wysyłki", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "shipping-methods", testInfo);
});
