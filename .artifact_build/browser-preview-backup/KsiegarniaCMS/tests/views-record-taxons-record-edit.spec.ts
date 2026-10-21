import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Taksonomie — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-taxons-record-edit", testInfo);
});
