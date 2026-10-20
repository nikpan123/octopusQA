import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa strefa Zarządzaj strefami geograficznymi", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "zones-country-new", testInfo);
});
