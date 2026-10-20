import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: New catalog promotion Zarządzaj rabatami w katalogu produktów", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "catalog-promotions-new", testInfo);
});
