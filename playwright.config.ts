import { defineConfig, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { OCTOPUS_BASE_URL, OCTOPUS_ENV } from "./tests/support/environment";

// Dziedziczone przez workery: po błędzie logowania nie próbujemy hasła
// ponownie dla każdego kolejnego testu w tym samym uruchomieniu.
process.env.OCTOPUS_AUTH_RUN_ID ??= randomUUID();
console.log(
  `Playwright: środowisko ${OCTOPUS_ENV.toUpperCase()} → ${OCTOPUS_BASE_URL}`,
);
export default defineConfig({
  testDir: "./tests",
  globalSetup: "./scripts/cleanup-global-setup.mjs",
  globalTeardown: "./scripts/cleanup-global-teardown.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0, // Każda próba tworzy dane: bez automatycznych powtórek.
  timeout: 240_000,
  expect: { timeout: 20_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: OCTOPUS_BASE_URL,
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 1000 },
      },
    },
  ],
});
