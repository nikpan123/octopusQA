import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Wnioski o zwrot — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-admin-return-requests-record", testInfo);
});
