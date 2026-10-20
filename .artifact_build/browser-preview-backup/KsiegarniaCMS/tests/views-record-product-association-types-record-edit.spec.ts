import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Typy powiązań — edycja", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-product-association-types-record-edit", testInfo);
});
