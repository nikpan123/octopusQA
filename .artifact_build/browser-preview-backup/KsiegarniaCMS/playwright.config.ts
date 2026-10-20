import { defineConfig, devices } from "@playwright/test";
import { contextOptions } from "./config/context";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    ...contextOptions,
    baseURL: process.env.BASE_URL,
    storageState: "auth.json",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  globalSetup: "./global-setup.ts",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
