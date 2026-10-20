import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Ustawienia regionalne — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-locales-record-edit", testInfo);
});
