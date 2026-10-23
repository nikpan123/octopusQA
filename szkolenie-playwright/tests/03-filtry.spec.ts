import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
});

test('05: P0 pokazuje wyłącznie trzy scenariusze P0', async ({ page }) => {
  await page.getByLabel('Priorytet', { exact: true }).selectOption('P0');
  await expect(page.getByRole('listitem')).toHaveCount(3);
  await expect(page.getByTestId('priorytet')).toHaveText(['P0', 'P0', 'P0']);
});

test('06: wyszukiwarka i priorytet działają razem', async ({ page }) => {
  await page.getByLabel('Szukaj przypadku').fill('CART-');
  await page.getByLabel('Priorytet', { exact: true }).selectOption('P0');
  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(2);
  await expect(rows).toContainText(['CART-001', 'CART-002']);
  await expect(page.getByTestId('priorytet')).toHaveText(['P0', 'P0']);
});

test('07: wyczyszczenie filtrów przywraca pełną listę', async ({ page }) => {
  await page.getByLabel('Szukaj przypadku').fill('CART-');
  await page.getByLabel('Priorytet', { exact: true }).selectOption('P1');
  await expect(page.getByRole('listitem')).toHaveCount(0);

  await page.getByRole('button', { name: 'Wyczyść filtry', exact: true }).click();

  await expect(page.getByLabel('Szukaj przypadku')).toHaveValue('');
  await expect(page.getByLabel('Priorytet', { exact: true })).toHaveValue('');
  await expect(page.getByRole('listitem')).toHaveCount(5);
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
  await expect(page.getByText('Brak wyników.', { exact: false })).toBeHidden();
});
