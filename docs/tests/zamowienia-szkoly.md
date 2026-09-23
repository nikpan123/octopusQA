# Zamówienia szkoły — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcja `ORD-*` sprawdza tworzenie, odczyt, edycję i usuwanie zamówień przypisanych do szkoły.

## 2. Pliki

```text
tests/zamowienia-klubowiczostwo.spec.ts
tests/support/order.ts
tests/support/scenario.ts
```

## 3. Dane referencyjne

Testy używają produktów katalogowych:

| Kod | Zastosowanie |
|---|---|
| `KMLT18` | scenariusz jednego i wielu produktów |
| `4P-2` | scenariusze wielu produktów |

Brak produktu o oczekiwanym kodzie oznacza zmianę danych referencyjnych i powinien ujawnić się jako błąd testu, a nie zostać pominięty.

## 4. Zakres ORD-01–ORD-03

| Test | Cel |
|---|---|
| `ORD-01` | zapis jednego produktu i ilości po ponownym otwarciu szkoły |
| `ORD-02` | zapis dwóch różnych produktów i ich ilości |
| `ORD-03` | edycja ilości obu produktów oraz cleanup przez usunięcie zamówienia |

## 5. Przepływ zamówienia

```text
zakładka Zamówienia
→ Dodaj
→ wyszukaj produkt po kodzie
→ przenieś produkt do wybranych
→ ustaw ilość
→ zapisz
→ otwórz szkołę ponownie
→ rozwiń zamówienie po ID
→ porównaj kod, nazwę i ilość
```

Pole ilości jest edytorem AG Grid. Helper najpierw aktywuje je kliknięciem, następnie wpisuje wartość i kończy edycję klawiszem `Tab`. Samo wypełnienie renderera komórki nie gwarantuje zapisu.

## 6. Helper `order.ts`

Wspólny helper usuwa powtarzalne selektory i operacje techniczne z testów.

| Helper | Odpowiedzialność |
|---|---|
| `ordersPanel()` | panel zamówień szkoły |
| `openOrders()` | otwarcie zakładki |
| `openNewOrderForm()` | formularz nowego zamówienia |
| `addOrderProduct()` | wyszukanie i przeniesienie produktu |
| `setOrderQuantity()` | bezpieczna edycja ilości w AG Grid |
| `saveNewOrder()` | zapis i zwrócenie ID zamówienia |
| `orderRow()` | wiersz konkretnego zamówienia |
| `expandOrderItems()` | rozwinięcie listy pozycji |
| `expectOrderItems()` | porównanie kodu, nazwy i ilości |
| `openOrderEdit()` | otwarcie edycji zaznaczonego zamówienia |
| `deleteOrder()` | usunięcie z opcjonalnym dialogiem potwierdzenia |

## 7. Cleanup

`ORD-03` próbuje usunąć utworzone zamówienie także wtedy, gdy wcześniejsza asercja zakończy się błędem. Błąd cleanupu nie może przykryć pierwotnej przyczyny nieudanego testu. Status sprzątania jest zapisywany jako:

```text
DELETED
ALREADY_ABSENT
FAILED
```

## 8. Uruchamianie

```text
npx playwright test tests/zamowienia-klubowiczostwo.spec.ts --grep @order
```

