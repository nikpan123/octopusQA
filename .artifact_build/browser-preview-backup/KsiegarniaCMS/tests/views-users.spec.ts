import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Administratorzy", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "users", testInfo);
});
