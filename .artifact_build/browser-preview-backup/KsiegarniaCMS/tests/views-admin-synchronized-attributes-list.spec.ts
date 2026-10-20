import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Synchronizacja cech", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-synchronized-attributes-list", testInfo);
});
