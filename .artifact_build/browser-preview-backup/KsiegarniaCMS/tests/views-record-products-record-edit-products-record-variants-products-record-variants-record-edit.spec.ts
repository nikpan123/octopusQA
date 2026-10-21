import {test} from '@playwright/test';
import {checkView} from '../shared/viewSmoke';

test("Widoki: Produkty — wylistuj warianty — edytuj", {tag:'@views'}, async ({page},testInfo) => {
  await checkView(page, "record-products-record-edit-products-record-variants-products-record-variants-record-edit", testInfo);
});
