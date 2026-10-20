import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa stawka podatkowa Zarządzaj opodatkowaniem produktów", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "tax-rates-new", testInfo);
});
