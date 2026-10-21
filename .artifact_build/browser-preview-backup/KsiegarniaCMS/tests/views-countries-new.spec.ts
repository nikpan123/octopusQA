import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy kraj Zarządzaj miejscami docelowymi wysyłek", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "countries-new", testInfo);
});
