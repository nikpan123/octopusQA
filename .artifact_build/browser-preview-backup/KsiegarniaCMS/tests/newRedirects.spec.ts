import { test } from "@playwright/test";
import { NewRedirectsPage } from "../pages/redirects/NewRedirectsPage";
import { NewRedirectsAssertions } from "../assertions/redirects/NewRedirectsAssertions";

test("New redirects", async ({ page }) => {
  const newRedirectsPage = new NewRedirectsPage(page);
  const assertions = new NewRedirectsAssertions(page, newRedirectsPage);

  await newRedirectsPage.open();
  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});
