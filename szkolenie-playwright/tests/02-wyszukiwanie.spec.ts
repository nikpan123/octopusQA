import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
});

test('02: wpisany tekst pozostaje w polu', async ({ page }) => {
  const search = page.getByLabel('Szukaj przypadku');
  await search.fill('CART-001');
  await expect(search).toHaveValue('CART-001');
});

test('03: wyszukiwanie po ID pokazuje właściwy scenariusz', async ({ page }) => {
  await page.getByLabel('Szukaj przypadku').fill('CART-001');
  const rows = page.getByRole('list', { name: 'Lista scenariuszy' }).getByRole('listitem');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText(['CART-001 — Utworzenie i odczyt pustego koszyka']);
  await expect(page.getByRole('status')).toHaveText('1 z 5 scenariuszy');
});

test('04: nieistniejące hasło pokazuje brak wyników', async ({ page }) => {
  await page.getByLabel('Szukaj przypadku').fill('NIE-MA-TAKIEGO-PRZYPADKU');
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByText('Brak wyników. Zmień hasło lub wyczyść filtry.', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('0 z 5 scenariuszy');
});
