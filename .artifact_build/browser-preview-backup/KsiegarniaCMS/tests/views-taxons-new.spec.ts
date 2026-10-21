import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Taksonomie", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "taxons-new", testInfo);
});
