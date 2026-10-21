import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Kanały — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-channels-record-edit", testInfo);
});
