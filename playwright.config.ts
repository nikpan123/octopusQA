import { createPlaywrightConfig, type OctopusEnvironment } from "./playwright.shared";

const environment = process.env.OCTOPUS_ENV ?? "dev";
if (environment !== "dev" && environment !== "test")
  throw new Error(`Nieobsługiwane OCTOPUS_ENV="${environment}". Dozwolone wartości: dev, test.`);

export default createPlaywrightConfig(environment as OctopusEnvironment);
