import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Raport handlowy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-legacy-trade-raport", testInfo);
});
