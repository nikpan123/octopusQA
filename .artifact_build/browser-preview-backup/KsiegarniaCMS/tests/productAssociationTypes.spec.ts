import { test } from "@playwright/test";
import { ProductAssociationTypesPage } from "../pages/productAssociationTypes/ProductAssociationTypesPage";
import { ProductAssociationTypesAssertions } from "../assertions/productAssociationTypes/ProductAssociationTypesAssertions";

test("Rodzaje produktów towarzyszących", async ({ page }) => {
  const productAssociationTypesPage = new ProductAssociationTypesPage(page);
  const assertions = new ProductAssociationTypesAssertions(page, productAssociationTypesPage);

  await productAssociationTypesPage.open();

  await productAssociationTypesPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});