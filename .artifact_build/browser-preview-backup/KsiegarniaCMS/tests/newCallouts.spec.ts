import { test } from "@playwright/test";
import { NewCalloutsPage } from "../pages/callouts/NewCalloutsPage";
import { NewCalloutsAssertions } from "../assertions/callouts/NewCalloutsAssertions";

test("Nowa labelka", async ({ page }) => {
  const newCalloutsPage = new NewCalloutsPage(page);
  const assertions = new NewCalloutsAssertions(page, newCalloutsPage);

  await newCalloutsPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});