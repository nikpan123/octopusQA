import { test as base, expect } from "@playwright/test";

import {
  ensureSession,
  restoreSession,
  type AuthSession,
} from "../../scripts/auth.mjs";

import { OCTOPUS_BASE_URL, OCTOPUS_ENV } from "./environment";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const teacherUrlPattern = new RegExp(
  `^${escapeRegExp(OCTOPUS_BASE_URL)}/teacher/`,
);

export const test = base.extend<{
  authSession: AuthSession;
}>({
  // Przed każdym testem odczytujemy sesję z pliku bez uruchamiania dodatkowej
  // przeglądarki. Pełne logowanie następuje tylko tuż przed wygaśnięciem JWT.
  authSession: async ({}, use) => {
    const authSession = await ensureSession();

    await use(authSession);
  },

  storageState: async ({ authSession }, use) => {
    await use(authSession.storageState);
  },

  page: async ({ page, authSession }, use) => {
    await restoreSession(page.context(), authSession.session);

    await page.goto("/teacher/teacher-panel");

    await expect(
      page.getByRole("button", {
        name: "Wyloguj",
        exact: true,
      }),
      `Brak dostępu do Octopusa na środowisku ${OCTOPUS_ENV.toUpperCase()} (${OCTOPUS_BASE_URL}).`,
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(
      page,
      `Po przygotowaniu sesji powinien być otwarty panel nauczyciela na ${OCTOPUS_BASE_URL}`,
    ).toHaveURL(teacherUrlPattern);

    await use(page);
  },
});

export { expect };
