import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Przesyłki — szczegóły", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-shipments-record", testInfo);
});
