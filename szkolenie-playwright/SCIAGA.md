# Ściąga — Playwright na stronie szkoleniowej

```ts
import { test, expect } from '@playwright/test';

test('opis zachowania', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('5 z 5 scenariuszy');

  await page.getByLabel('Szukaj przypadku').fill('CART-001');

  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('listitem')).toContainText('CART-001');
});
```

| Potrzeba | Zapis |
| --- | --- |
| Wpisz tekst | `await pole.fill('tekst');` |
| Wyczyść pole | `await pole.fill('');` |
| Kliknij | `await przycisk.click();` |
| Wybierz natywny select | `await lista.selectOption('P1');` |
| Sprawdź wartość pola | `await expect(pole).toHaveValue('tekst');` |
| Sprawdź widoczność | `await expect(element).toBeVisible();` |
| Sprawdź dokładny tekst | `await expect(element).toHaveText('tekst');` |
| Sprawdź fragment | `await expect(element).toContainText('fragment');` |
| Sprawdź liczbę | `await expect(wiersze).toHaveCount(2);` |
| Sprawdź priorytety wszystkich wyników | `await expect(page.getByTestId('priorytet')).toHaveText(['P1', 'P1']);` |
| Przejdź klawiszem Tab | `await page.keyboard.press('Tab');` |
| Sprawdź fokus | `await expect(element).toBeFocused();` |

Przed uruchomieniem sprawdź: właściwa konfiguracja szkolenia, jednoznaczny lokator, `await` przy czynnościach i asercjach strony, sprawdzenie wyniku, niezależność od poprzedniego testu.

Przy błędzie: przeczytaj nazwę testu → znajdź nieudaną linię → porównaj Expected i Received → obejrzyj lokator i stronę → popraw przyczynę.
