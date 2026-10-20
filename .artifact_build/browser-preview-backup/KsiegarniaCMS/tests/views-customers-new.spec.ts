import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy Klient Zarządzaj klientami", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "customers-new", testInfo);
});
