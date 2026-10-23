import { defineConfig } from "@playwright/test";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

// Offline verification only: no Octopus authentication, setup or cleanup.
export default defineConfig({
  metadata:
    process.env.QA_BROWSER_PREVIEW === "1"
      ? {
          qaBrowserPreviewDirectory: path.join(tmpdir(), `qa-debugger-overlay-${randomUUID()}`),
        }
      : {},
  testDir: "./checks",
  testMatch:
    process.env.QA_DEBUGGER_GENERIC === "1"
      ? "debugger-all-tests.spec.ts"
      : "debugger-pilot.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "test-results/debugger-offline",
  reporter: [["list"]],
  use: { channel: "msedge", headless: true, viewport: { width: 1000, height: 700 } },
});
