# Zamówienia ORD na dwóch workerach

Pakiet `ORD-01`–`ORD-66` jest przystosowany do pracy na jednym lub dwóch workerach. Konfiguracja jest już częścią projektu — nie trzeba podmieniać plików ani uruchamiać skryptu migracyjnego.

## Jak działa izolacja

`tests/zamowienia-szkoly.spec.ts` działa w trybie równoległym. `tests/support/order-school.ts` buduje nazwy szkół na podstawie `TEST_PARALLEL_INDEX` lub `TEST_WORKER_INDEX`:

```text
worker 0 → AUTO_ORD_REFERENCE_DEV_W0
           AUTO_ORD_REFERENCE_DEV_W0_B

worker 1 → AUTO_ORD_REFERENCE_DEV_W1
           AUTO_ORD_REFERENCE_DEV_W1_B
```

Na TEST prefiks `DEV` jest zastępowany przez `TEST`. Każdy worker korzysta z własnej pary szkół, dlatego tworzenie i cleanup zamówień nie powinny kolidować między workerami.

## Uruchomienie

```powershell
npm run test:workers:2 -- tests/zamowienia-szkoly.spec.ts
```

W panelu wybierz pakiet **Zamówienia** i `2` workery. Wartość `4` jest dla tego pakietu blokowana.

Pojedynczy scenariusz diagnostyczny najlepiej uruchamiać na jednym workerze:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts --grep "ORD-43" --workers=1
```

## Ważne ograniczenia

- szkoły referencyjne pozostają w bazie;
- zamówienia utworzone przez test są rejestrowane i sprzątane;
- pełny zestaw na czterech workerach nie jest profilem wspieranym przez panel ORD;
- szczegółowy zakres testów znajduje się w [dokumentacji zamówień](docs/tests/zamowienia-szkoly.md).
