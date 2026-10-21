import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Inne konfiguracje", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "admin-configurations", testInfo);
});
