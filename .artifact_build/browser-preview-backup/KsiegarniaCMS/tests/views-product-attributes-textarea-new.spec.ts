import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — pole tekstowe", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-textarea-new", testInfo);
});
