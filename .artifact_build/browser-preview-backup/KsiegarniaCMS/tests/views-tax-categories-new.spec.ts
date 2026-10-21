import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa kategoria podatkowa Zarządzaj opodatkowaniem produktów", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "tax-categories-new", testInfo);
});
