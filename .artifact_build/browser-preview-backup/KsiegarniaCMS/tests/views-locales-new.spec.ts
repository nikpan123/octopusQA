import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowe ustawienia regionalne Zarządzaj językami dostępnymi w sklepie", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "locales-new", testInfo);
});
