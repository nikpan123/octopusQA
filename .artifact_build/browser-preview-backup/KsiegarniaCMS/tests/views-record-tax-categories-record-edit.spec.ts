import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Kategorie podatkowe — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-tax-categories-record-edit", testInfo);
});
