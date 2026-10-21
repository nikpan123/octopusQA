import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Administratorzy — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-users-record-edit", testInfo);
});
