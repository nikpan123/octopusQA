import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa oferta specjalna — N+", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-special-offers-new-n-plus", testInfo);
});
