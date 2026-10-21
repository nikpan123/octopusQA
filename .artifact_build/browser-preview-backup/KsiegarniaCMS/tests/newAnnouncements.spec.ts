import { test } from "@playwright/test";
import { NewAnnouncementsPage } from "../pages/announcements/NewAnnouncementsPage";
import { NewAnnouncementsAssertions } from "../assertions/announcements/NewAnnouncementsAssertions";

test("Nowy Komunikat", async ({ page }) => {
  const newAnnouncementsPage = new NewAnnouncementsPage(page);
  const assertions = new NewAnnouncementsAssertions(page, newAnnouncementsPage);

  await newAnnouncementsPage.open();

  await assertions.assertFormVisible();
  await assertions.assertButtonsVisible();
});