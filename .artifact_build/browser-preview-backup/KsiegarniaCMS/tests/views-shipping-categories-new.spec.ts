import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Nowa kategoria wysyłki Zarządzaj kategoriami wysyłki dla Twojego sklepu", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "shipping-categories-new", testInfo);
});
