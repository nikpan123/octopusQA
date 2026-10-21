import { defineConfig } from "@playwright/test";

// Offline verification only: no Octopus authentication, setup or cleanup.
export default defineConfig({
  testDir: "./checks",
  testMatch: "debugger-pilot.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "test-results/debugger-offline",
  reporter: [["list"]],
  use: { channel: "msedge", headless: true, viewport: { width: 1000, height: 700 } },
});
