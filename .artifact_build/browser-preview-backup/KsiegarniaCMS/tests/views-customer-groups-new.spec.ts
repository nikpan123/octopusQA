import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Grupy klientów Zarządzaj grupami klientów", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "customer-groups-new", testInfo);
});
