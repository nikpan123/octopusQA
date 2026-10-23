import { test, expect } from '@playwright/test';
import { ScenariosPage } from '../pages/ScenariosPage';

for (const id of ['AUTH-001', 'CART-002']) {
  test(`08: szukanie scenariusza ${id}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
    await page.getByLabel('Szukaj przypadku').fill(id);
    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('listitem')).toContainText(id);
  });
}

test('09: wyszukiwanie z prostym Page Object', async ({ page }) => {
  const scenarios = new ScenariosPage(page);
  await scenarios.open();
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
  await scenarios.searchFor('AUTH-002');
  await expect(scenarios.rows).toHaveCount(1);
  await expect(scenarios.rows).toContainText('Niepoprawne hasło API');
});
