import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowe powiązanie produktu Zarządzaj powiązaniami Twojego produktu", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-association-types-new", testInfo);
});
