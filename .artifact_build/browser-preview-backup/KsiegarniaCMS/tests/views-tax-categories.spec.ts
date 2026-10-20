import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Kategorie podatkowe", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "tax-categories", testInfo);
});
