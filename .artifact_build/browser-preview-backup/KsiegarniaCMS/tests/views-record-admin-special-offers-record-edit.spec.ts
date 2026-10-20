import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Oferty specjalne — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-admin-special-offers-record-edit", testInfo);
});
