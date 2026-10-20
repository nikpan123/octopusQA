import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa oferta specjalna — oparta na listach", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-special-offers-new-list-based", testInfo);
});
