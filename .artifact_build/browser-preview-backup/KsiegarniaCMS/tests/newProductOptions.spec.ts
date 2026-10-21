import { test } from "@playwright/test";
import { NewProductOptionsPage } from "../pages/productOptions/NewProductOptionsPage";
import { NewProductOptionsAssertions } from "../assertions/productOptions/NewProductOptionsAssertions";

test("Nowa opcja produktu", async ({ page }) => {
  const newProductOptionsPage = new NewProductOptionsPage(page);
  const assertions = new NewProductOptionsAssertions(page, newProductOptionsPage);

  await newProductOptionsPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});