import { test as base, expect } from "@playwright/test";

import { ensureSession, restoreSession, type AuthSession } from "../../scripts/auth.mjs";

import { OctopusApiFactory } from "./api-factory";
import { PerformanceMetrics } from "./performance";

export const test = base.extend<{
  authSession: AuthSession;
  apiFactory: OctopusApiFactory;
  performanceMetrics: PerformanceMetrics;
}>({
  performanceMetrics: async ({}, use, testInfo) => {
    const metrics = new PerformanceMetrics();
    await use(metrics);
    await metrics.attach(testInfo);
  },

  // Przed każdym testem odczytujemy sesję z pliku bez uruchamiania dodatkowej
  // przeglądarki. Pełne logowanie następuje tylko tuż przed wygaśnięciem JWT.
  authSession: async ({ performanceMetrics }, use) => {
    const authSession = await performanceMetrics.measure("fixture.auth", () => ensureSession());

    await use(authSession);
  },

  storageState: async ({ authSession }, use) => {
    await use(authSession.storageState);
  },

  page: async ({ page, authSession, performanceMetrics }, use) => {
    await performanceMetrics.measure("fixture.session-restore", () =>
      restoreSession(page.context(), authSession.session),
    );

    page.on("request", () => performanceMetrics.increment("browser.requests"));
    page.on("response", (response) => {
      performanceMetrics.increment(`browser.status.${response.status()}`);
    });
    page.on("requestfailed", () => performanceMetrics.increment("browser.failed"));

    await use(page);
  },

  apiFactory: async ({ page, authSession, performanceMetrics }, use) => {
    await use(new OctopusApiFactory(page.context().request, authSession, performanceMetrics));
  },
});

export { expect };
