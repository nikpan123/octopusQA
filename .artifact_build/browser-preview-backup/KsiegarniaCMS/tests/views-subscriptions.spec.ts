import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Powiadomienia o dostępności", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "subscriptions", testInfo);
});
