import { test } from "@playwright/test";
import { NewProductAssociationTypesPage } from "../pages/productAssociationTypes/NewProductAssociationTypesPage";
import { NewProductAssociationTypesAssertions } from "../assertions/productAssociationTypes/NewProductAssociationTypesAssertions";

test("Nowe powiązanie produktu", async ({ page }) => {
  const newProductAssociationTypesPage = new NewProductAssociationTypesPage(page);
  const assertions = new NewProductAssociationTypesAssertions(page, newProductAssociationTypesPage);

  await newProductAssociationTypesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});