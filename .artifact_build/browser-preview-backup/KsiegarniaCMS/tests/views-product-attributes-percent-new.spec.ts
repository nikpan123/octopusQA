import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — procent", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-percent-new", testInfo);
});
