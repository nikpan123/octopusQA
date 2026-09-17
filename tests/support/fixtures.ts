import { test as base, expect } from '@playwright/test';
import { ensureSession, restoreSession, type AuthSession } from '../../scripts/auth.mjs';

export const test = base.extend<{}, { authSession: AuthSession }>({
  // Działa także w panelu UI i przy uruchomieniu pojedynczego testu.
  authSession: [async ({}, use) => {
    await use(await ensureSession());
  }, { scope: 'worker', timeout: 180_000 }],
  storageState: async ({ authSession }, use) => {
    await use(authSession.storageState);
  },
  page: async ({ page, authSession }, use) => {
    await restoreSession(page.context(), authSession.session);
    await page.goto('/teacher/teacher-panel');
    await expect(page.getByRole('button', { name: 'Wyloguj', exact: true }),
      'Brak dostępu do Octopusa po przygotowaniu sesji. Sprawdź npm.cmd run auth:check.').toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/^https:\/\/octopus\.gwodev\.pl\/teacher\//);
    await use(page);
  },
});
export { expect };
