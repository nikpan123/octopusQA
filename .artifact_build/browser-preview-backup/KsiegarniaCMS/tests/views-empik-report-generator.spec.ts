import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Raport dla księgowości", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "empik-report-generator", testInfo);
});
