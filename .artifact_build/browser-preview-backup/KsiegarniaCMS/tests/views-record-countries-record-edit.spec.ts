import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Kraje — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-countries-record-edit", testInfo);
});
