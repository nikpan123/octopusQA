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
    // Stała konfiguracja kontekstu pozwala zachować kartę także po odświeżeniu JWT.
    // Bieżąca sesja trafia do kontekstu w fixture page, przed rozpoczęciem testu.
    await use(
      process.env.OCTOPUS_SINGLE_TAB === "1"
        ? { cookies: [], origins: [] }
        : authSession.storageState,
    );
  },

  page: async ({ page, authSession, performanceMetrics }, use) => {
    if (process.env.OCTOPUS_SINGLE_TAB === "1")
      await page.context().setStorageState(authSession.storageState);
    await performanceMetrics.measure("fixture.session-restore", () =>
      restoreSession(page.context(), authSession.session),
    );

    const onRequest = () => performanceMetrics.increment("browser.requests");
    const onResponse = (response: import("@playwright/test").Response) => {
      performanceMetrics.increment(`browser.status.${response.status()}`);
    };
    const onFailed = () => performanceMetrics.increment("browser.failed");
    page.on("request", onRequest);
    page.on("response", onResponse);
    page.on("requestfailed", onFailed);
    try {
      await use(page);
    } finally {
      page.off("request", onRequest);
      page.off("response", onResponse);
      page.off("requestfailed", onFailed);
    }
  },

  apiFactory: async ({ page, authSession, performanceMetrics }, use) => {
    await use(new OctopusApiFactory(page.context().request, authSession, performanceMetrics));
  },
});

export { expect };
