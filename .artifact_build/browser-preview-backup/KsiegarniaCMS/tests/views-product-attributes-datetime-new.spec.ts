import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — data i godzina", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-datetime-new", testInfo);
});
