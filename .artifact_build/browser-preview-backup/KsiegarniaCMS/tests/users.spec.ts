import { test } from "@playwright/test";
import { UsersPage } from "../pages/users/UsersPage";
import { UsersAssertions } from "../assertions/users/UsersAssertions";

test("Administratorzy", async ({ page }) => {
  const usersPage = new UsersPage(page);
  const assertions = new UsersAssertions(page, usersPage);

  await usersPage.open();

  await usersPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});