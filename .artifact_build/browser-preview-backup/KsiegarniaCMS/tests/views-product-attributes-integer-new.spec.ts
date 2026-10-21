import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy atrybut produktu — liczba całkowita", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-attributes-integer-new", testInfo);
});
