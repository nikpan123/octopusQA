export type OctopusEnvironment = "dev" | "test";

const environment = (process.env.OCTOPUS_ENV ?? "dev") as OctopusEnvironment;

if (environment !== "dev" && environment !== "test") {
  throw new Error(
    `Nieobsługiwane środowisko OCTOPUS_ENV="${environment}". ` +
      `Dozwolone wartości: dev, test.`,
  );
}

const environments = {
  dev: {
    name: "DEV",
    baseUrl: "https://octopus.gwodev.pl",
  },

  test: {
    name: "TEST",
    baseUrl: "https://octopus.gwotest.pl",
  },
} as const;

export const OCTOPUS_ENV = environment;

export const OCTOPUS_CONFIG = environments[environment];

export const OCTOPUS_BASE_URL = OCTOPUS_CONFIG.baseUrl;

export const OCTOPUS_HOST = new URL(OCTOPUS_BASE_URL).host;
