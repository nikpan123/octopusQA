import { test } from "@playwright/test";
import { AnnouncementsPage } from "../pages/announcements/AnnouncementsPage";
import { AnnouncementsAssertions } from "../assertions/announcements/AnnouncementsAssertions";

test("Komunikaty", async ({ page }) => {
  const announcementsPage = new AnnouncementsPage(page);
  const assertions = new AnnouncementsAssertions(page, announcementsPage);

  await announcementsPage.open();

  await announcementsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});