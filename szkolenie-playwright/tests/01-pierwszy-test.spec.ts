import { test, expect } from '@playwright/test';

test('01: strona pokazuje nagłówek scenariuszy', async ({ page }) => {
  // Przygotowanie: otwórz stronę ćwiczeniową.
  await page.goto('/');

  // Sprawdzenie: nagłówek jest widoczny dla użytkownika.
  await expect(
    page.getByRole('heading', { name: 'Scenariusze testowe.', exact: true }),
  ).toBeVisible();
});
