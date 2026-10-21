import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Kursy wymiany walut", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "exchange-rates", testInfo);
});
