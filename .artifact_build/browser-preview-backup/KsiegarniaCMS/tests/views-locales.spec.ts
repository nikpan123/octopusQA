import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Ustawienia regionalne", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "locales", testInfo);
});
