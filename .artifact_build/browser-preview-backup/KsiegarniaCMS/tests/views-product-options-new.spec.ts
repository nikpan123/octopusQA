import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa opcja produktu Zarządzaj opcjami konfiguracji produktów", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-options-new", testInfo);
});
