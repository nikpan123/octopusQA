import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa waluta Zarządzaj walutami dostępnymi w sklepie", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "currencies-new", testInfo);
});
