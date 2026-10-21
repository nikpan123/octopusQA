import { test } from "@playwright/test";
import { ChannelsPage } from "../pages/channels/ChannelsPage";
import { ChannelsAssertions } from "../assertions/channels/ChannelsAssertions";

test("Kanały", async ({ page }) => {
  const channelsPage = new ChannelsPage(page);
  const assertions = new ChannelsAssertions(page, channelsPage);

  await channelsPage.open();

  await channelsPage.openFilters();
  await assertions.assertFiltersVisible();
  await assertions.assertTableVisible();
  await assertions.assertButtonsVisible();
});