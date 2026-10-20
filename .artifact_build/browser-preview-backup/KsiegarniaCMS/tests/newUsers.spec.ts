import { test } from "@playwright/test";
import { NewUsersPage } from "../pages/users/NewUsersPage";
import { NewUsersAssertions } from "../assertions/users/NewUsersAssertions";

test("Nowy administrator", async ({ page }) => {
  const newUsersPage = new NewUsersPage(page);
  const assertions = new NewUsersAssertions(page, newUsersPage);

  await newUsersPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});