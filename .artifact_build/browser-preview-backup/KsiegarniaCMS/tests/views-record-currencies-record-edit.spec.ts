import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Waluty — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-currencies-record-edit", testInfo);
});
