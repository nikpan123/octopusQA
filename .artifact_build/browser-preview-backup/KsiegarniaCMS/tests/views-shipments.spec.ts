import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Przesyłki", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "shipments", testInfo);
});
