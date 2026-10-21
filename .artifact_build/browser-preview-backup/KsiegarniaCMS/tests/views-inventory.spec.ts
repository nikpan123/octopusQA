import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Zapasy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "inventory", testInfo);
});
