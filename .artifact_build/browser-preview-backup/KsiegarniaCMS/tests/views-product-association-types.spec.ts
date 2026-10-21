import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Typy powiązań", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "product-association-types", testInfo);
});
