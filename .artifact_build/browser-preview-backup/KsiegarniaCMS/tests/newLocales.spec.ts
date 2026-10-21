import { test } from "@playwright/test";
import { NewLocalesPage } from "../pages/locales/NewLocalesPage";
import { NewLocalesAssertions } from "../assertions/locales/NewLocalesAssertions";

test("Nowe ustawienia regionalne", async ({ page }) => {
  const newLocalesPage = new NewLocalesPage(page);
  const assertions = new NewLocalesAssertions(page, newLocalesPage);

  await newLocalesPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});