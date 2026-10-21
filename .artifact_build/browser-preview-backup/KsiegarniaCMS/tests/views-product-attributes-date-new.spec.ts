import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — data", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-date-new", testInfo);
});
