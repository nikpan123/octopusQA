import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Labelki — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-admin-callouts-record-edit", testInfo);
});
