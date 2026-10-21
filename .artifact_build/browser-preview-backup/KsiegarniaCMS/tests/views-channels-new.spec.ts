import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy kanał Skonfiguruj kanały dostępne w twoim sklepie", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "channels-new", testInfo);
});
