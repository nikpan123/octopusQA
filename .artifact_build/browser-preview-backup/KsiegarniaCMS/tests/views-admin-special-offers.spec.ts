import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Oferty specjalne", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-special-offers", testInfo);
});
