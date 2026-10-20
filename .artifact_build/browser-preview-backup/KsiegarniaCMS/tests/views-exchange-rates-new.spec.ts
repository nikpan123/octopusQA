import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy kurs wymiany Zarządzaj kursami wymiany walut", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "exchange-rates-new", testInfo);
});
