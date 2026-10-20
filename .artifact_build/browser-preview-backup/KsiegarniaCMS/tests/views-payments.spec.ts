import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Płatności", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "payments", testInfo);
});
