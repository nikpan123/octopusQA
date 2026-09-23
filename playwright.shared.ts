import { defineConfig, devices } from "@playwright/test";

import { randomUUID } from "node:crypto";

export type OctopusEnvironment = "dev" | "test";

export function createPlaywrightConfig(environment: OctopusEnvironment) {
  process.env.OCTOPUS_ENV = environment;

  process.env.OCTOPUS_AUTH_RUN_ID = randomUUID();

  const baseURL =
    environment === "test" ? "https://octopus.gwotest.pl" : "https://octopus.gwodev.pl";

  console.log(`Playwright: środowisko ${environment.toUpperCase()} → ${baseURL}`);

  return defineConfig({
    testDir: "./tests",

    globalSetup: "./scripts/cleanup-global-setup.mjs",

    globalTeardown: "./scripts/cleanup-global-teardown.mjs",

    fullyParallel: false,

    workers: 1,

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
    ],

    outputDir: "test-results",

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
