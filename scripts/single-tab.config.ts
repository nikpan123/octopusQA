import { defineConfig } from "@playwright/test";
process.env.OCTOPUS_SINGLE_TAB = "1";
export default defineConfig({
  testDir: ".",
  testMatch: "single-tab.spec.ts",
  workers: 1,
  outputDir: "../test-results/single-tab-unit",
  reporter: "list",
  use: { reuseContext: true, video: "off" },
});
