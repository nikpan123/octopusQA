import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — tekst", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-text-new", testInfo);
});
