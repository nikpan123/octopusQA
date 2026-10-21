import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — pole wyboru", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-checkbox-new", testInfo);
});
