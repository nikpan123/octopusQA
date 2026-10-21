import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Waluty", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "currencies", testInfo);
});
