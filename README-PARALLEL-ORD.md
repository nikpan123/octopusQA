# ORD na 2 workerach

Ta paczka zmienia wykonywanie testów `ORD-*` tak, aby pakiet Zamówienia mógł działać na 2 workerach bez współdzielenia tej samej szkoły referencyjnej.

## Pliki do podmiany

- `tests/support/order-school.ts`
- `test-ui/app.js`
- `scripts/test-ui-server.mjs`

## Ważne: `zamowienia-szkoly.spec.ts`

Lokalny plik użytkownika jest nowszy niż ostatnia kopia dostępna w rozmowie, dlatego paczka **nie nadpisuje całego pliku**. Zamiast tego zawiera bezpieczny skrypt, który dodaje wyłącznie:

```ts
test.describe.configure({
  mode: "parallel",
});
```

Uruchom z głównego katalogu projektu:

```powershell
node scripts/enable-orders-parallel.mjs
```

Skrypt zachowuje całą aktualną zawartość `tests/zamowienia-szkoly.spec.ts` i tylko włącza równoległy tryb dla testów z tego pliku.

## Efekt

Przy wyborze w UI:

```text
Zamówienia
Workery: 2
```

serwer uruchomi:

```text
--workers=2
```

a każdy worker będzie korzystał z własnych szkół:

```text
AUTO_ORD_REFERENCE_DEV_W0
AUTO_ORD_REFERENCE_DEV_W0_B
AUTO_ORD_REFERENCE_DEV_W1
AUTO_ORD_REFERENCE_DEV_W1_B
```

Analogicznie na TEST.

Dla pakietu Zamówienia UI pozwala na 1 lub 2 workery. Wartość 4 jest blokowana dla tego pakietu.
