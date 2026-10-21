import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Wnioski o zwrot", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-return-requests", testInfo);
});
