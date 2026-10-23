# Rozwiązania ćwiczeń C1–C6

Najpierw spróbuj samodzielnie. Poniższy kod zastępuje zawartość funkcji danego ćwiczenia w `tests/05-twoje-cwiczenia.spec.ts`.
Zachowaj importy i `beforeEach`. Zmień `test.fixme(...)` na `test(...)` przy rozwiązywanym ćwiczeniu.
Usuń linię `expect(false, ...).toBe(true)` — celowo blokuje zaliczenie pustego zadania.

## C1 — tytuł karty

```ts
await expect(page).toHaveTitle(/Szkolenie Playwright/);
```

To tytuł karty, nie nagłówek `h1`.

## C2 — P1

```ts
await page.getByLabel('Priorytet', { exact: true }).selectOption('P1');
const rows = page.getByRole('listitem');
await expect(rows).toHaveCount(2);
await expect(rows).toContainText(['AUTH-002', 'AUTH-003']);
await expect(page.getByTestId('priorytet')).toHaveText(['P1', 'P1']);
```

Sama liczba 2 nie wykryłaby zamiany wyników na dwa niewłaściwe rekordy.

## C3 — małe litery

```ts
await page.getByLabel('Szukaj przypadku').fill('cart-001');
await expect(page.getByRole('listitem')).toHaveCount(1);
await expect(page.getByRole('listitem')).toContainText('CART-001');
```

## C4 — brak P2

```ts
await page.getByLabel('Priorytet', { exact: true }).selectOption('P2');
await expect(page.getByRole('listitem')).toHaveCount(0);
await expect(page.getByRole('status')).toHaveText('0 z 5 scenariuszy');
await expect(page.getByText('Brak wyników. Zmień hasło lub wyczyść filtry.', { exact: true })).toBeVisible();
```

To poprawny rezultat dla danych szkolenia, a nie awaria testu.

## C5 — wyczyszczenie samego tekstu

```ts
const search = page.getByLabel('Szukaj przypadku');
const priority = page.getByLabel('Priorytet', { exact: true });
await priority.selectOption('P1');
await search.fill('AUTH-002');
await expect(page.getByRole('listitem')).toHaveCount(1);
await expect(page.getByRole('listitem')).toContainText('AUTH-002');

await search.fill('');

await expect(search).toHaveValue('');
await expect(priority).toHaveValue('P1');
await expect(page.getByRole('listitem')).toHaveCount(2);
await expect(page.getByRole('listitem')).toContainText(['AUTH-002', 'AUTH-003']);
await expect(page.getByTestId('priorytet')).toHaveText(['P1', 'P1']);
```

Wyczyszczenie pola pozostawia priorytet. Przycisk resetowania czyści oba filtry.

## C6 — klawiatura

```ts
await page.getByLabel('Szukaj przypadku').focus();
await page.keyboard.press('Tab');
await expect(page.getByLabel('Priorytet', { exact: true })).toBeFocused();
await page.keyboard.press('Tab');
await expect(page.getByRole('button', { name: 'Wyczyść filtry', exact: true })).toBeFocused();
```

To kontrola kolejności fokusu, a nie pełny audyt dostępności.
