import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Grupy — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-customer-groups-record-edit", testInfo);
});
