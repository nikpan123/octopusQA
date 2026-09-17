import { test as base, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

export const test = base.extend({
  page: async ({ page }, use) => {
    if (!existsSync('playwright/.auth/user.json')) {
      throw new Error('Brak zapisanej sesji. Najpierw uruchom: npm.cmd run login');
    }
    if (existsSync('playwright/.auth/session.json')) {
      const state = JSON.parse(readFileSync('playwright/.auth/session.json', 'utf8'));
      await page.context().addInitScript(({ origin, values }) => {
        if (window.location.origin === origin) {
          for (const [key, value] of Object.entries(values)) window.sessionStorage.setItem(key, String(value));
        }
      }, state);
    }
    await page.goto('/teacher/teacher-panel');
    await expect(page.getByRole('button', { name: 'Wyloguj', exact: true }),
      'Sesja wygasła lub brak dostępu. Uruchom npm.cmd run login.').toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/^https:\/\/octopus\.gwodev\.pl\/teacher\//);
    await use(page);
  },
});
export { expect };
