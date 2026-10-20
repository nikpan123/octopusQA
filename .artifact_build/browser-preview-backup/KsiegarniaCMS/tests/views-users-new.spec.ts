import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowy administrator Zarządzaj użytkownikami mającymi dostęp do panelu administracyjnego", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "users-new", testInfo);
});
