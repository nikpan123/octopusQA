import { test, expect } from '@playwright/test';

// Usuń .fixme przy JEDNYM ćwiczeniu i zastąp kontrolę false własnym testem.
// Celowa porażka chroni przed zaliczeniem pustego rozwiązania.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');
});

test.fixme('C1: tytuł karty zawiera Szkolenie Playwright', async ({ page }) => {
  // TODO: asercja dotycząca tytułu karty, a nie nagłówka strony.
  expect(false, 'Zastąp tę linię swoim rozwiązaniem').toBe(true);
});

test.fixme('C2: P1 pokazuje AUTH-002 i AUTH-003', async ({ page }) => {
  // TODO: wybierz P1; sprawdź liczbę, oba ID i priorytet obu wyników.
  expect(false, 'Zastąp tę linię swoim rozwiązaniem').toBe(true);
});

test.fixme('C3: wyszukiwanie nie rozróżnia wielkości liter', async ({ page }) => {
  // TODO: wpisz cart-001; sprawdź jeden wynik z ID CART-001.
  expect(false, 'Zastąp tę linię swoim rozwiązaniem').toBe(true);
});

test.fixme('C4: P2 daje pustą listę i komunikat', async ({ page }) => {
  // TODO: sprawdź listę, licznik i widoczny komunikat.
  expect(false, 'Zastąp tę linię swoim rozwiązaniem').toBe(true);
});

test.fixme('C5: wyczyszczenie pola przywraca wyniki bieżącego priorytetu', async ({ page }) => {
  // TODO: P1, potem AUTH-002 (1 wynik), potem search.fill('') (2 wyniki).
  // Priorytet ma pozostać P1. To inna operacja niż przycisk Wyczyść filtry.
  expect(false, 'Zastąp tę linię swoim rozwiązaniem').toBe(true);
});

test.fixme('C6: formularz działa z klawiatury', async ({ page }) => {
  // TODO: focus na wyszukiwarce, Tab -> priorytet, Tab -> przycisk.
  // Użyj page.keyboard.press('Tab') i asercji toBeFocused().
  expect(false, 'Zastąp tę linię swoim rozwiązaniem').toBe(true);
});
