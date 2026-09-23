import { defineConfig, devices } from "@playwright/test";

import { randomUUID } from "node:crypto";

export type OctopusEnvironment = "dev" | "test";

export function createPlaywrightConfig(environment: OctopusEnvironment) {
  process.env.OCTOPUS_ENV = environment;

  const runId = randomUUID();
  process.env.OCTOPUS_AUTH_RUN_ID = runId;

  const baseURL =
    environment === "test" ? "https://octopus.gwotest.pl" : "https://octopus.gwodev.pl";
  const requestedWorkers = Number(process.env.OCTOPUS_WORKERS ?? 2);
  const workers = Number.isInteger(requestedWorkers)
    ? Math.min(4, Math.max(2, requestedWorkers))
    : 2;
  process.env.OCTOPUS_EFFECTIVE_WORKERS = String(workers);

  console.log(`Playwright: środowisko ${environment.toUpperCase()} → ${baseURL}`);

  return defineConfig({
    testDir: "./tests",

    globalSetup: "./scripts/cleanup-global-setup.mjs",

    globalTeardown: "./scripts/cleanup-global-teardown.mjs",

    fullyParallel: false,

    workers,

    retries: 0,

    timeout: 240_000,

    expect: {
      timeout: 20_000,
    },

    forbidOnly: Boolean(process.env.CI),

    reporter: [
      ["list"],
      [
        "html",
        {
          open: "never",
        },
      ],
      ["./scripts/performance-reporter.mjs"],
    ],

    // Każde uruchomienie zapisuje ślady w osobnym katalogu. Dzięki temu
    // start testu z VS Code nie może skasować plików trwającego pełnego zestawu
    // jeszcze zanim globalSetup wykryje blokadę równoległego uruchomienia.
    outputDir: `test-results/${runId}`,

    use: {
      baseURL,

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

          viewport: {
            width: 1600,
            height: 1000,
          },
        },
      },
    ],
  });
}
