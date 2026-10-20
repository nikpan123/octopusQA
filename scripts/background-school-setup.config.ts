import { defineConfig } from "@playwright/test";

// Lokalne testy mechanizmu przygotowania: bez DEV, logowania i blokady wykonania regresji.
export default defineConfig({
  testDir: ".",
  testMatch: ["background-school-setup.spec.ts", "browser-session.spec.ts"],
  outputDir: "../test-results/background-school-setup-unit",
  reporter: "list",
  workers: 1,
});
