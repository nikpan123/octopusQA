# Zamówienia szkoły — dokumentacja testów automatycznych

## 1. Cel sekcji

Sekcja `ORD-*` sprawdza formularz zamówień szkoły w Octopusie: wyszukiwanie gratisów, filtry, przenoszenie produktów do zamówienia, ilości, zapis, edycję, izolację zamówień, cleanup oraz załączniki.

Stan po ostatnim uruchomieniu: **aktualny zestaw testów przeszedł na środowisku DEV**.

## 2. Pliki

```text
tests/zamowienia-szkoly.spec.ts
tests/support/order.ts
tests/support/order-school.ts
tests/data/order-product-data.ts
tests/support/scenario.ts
```

## 3. Dane referencyjne

Testy nie opierają się już na starych, wpisanych na sztywno kodach `KMLT18` i `4P-2`. Dane produktów są centralizowane w `ORDER_PRODUCTS` i rozdzielone m.in. na zestawy dla Fizyki SP kl. 7 oraz Języka polskiego SP kl. 5. Dzięki temu kod produktu, tytuł, przedmiot, poziom, klasa i fraza wyszukiwania są utrzymywane w jednym miejscu.

Dla szkół używane są dedykowane rekordy referencyjne środowiska, np. `AUTO_ORD_REFERENCE_DEV` i odpowiednik dla TEST. Testy nie powinny zakładać, że lista istniejących zamówień jest pusta.

## 4. Zakres ORD-01–ORD-62

| Zakres | Obszar |
|---|---|
| `ORD-01–ORD-03` | rdzeń regresji: zapis, wiele produktów, edycja ilości i usuwanie |
| `ORD-04–ORD-08` | kontrakt formularza i anulowanie |
| `ORD-09–ORD-11` | słowniki Przedmiot / Poziom / Klasy |
| `ORD-12–ORD-24` | wyszukiwanie, kombinacje filtrów i reset filtrów |
| `ORD-25–ORD-32` | przenoszenie produktów pomiędzy Gratisy i Zamówienie, spójność danych |
| `ORD-33–ORD-39` | ilości, AG Grid, wartości graniczne i automatyczne uzupełnianie |
| `ORD-40–ORD-47` | zapis, integralność, identyfikacja ID, izolacja i trwałość |
| `ORD-48–ORD-62` | załączniki: typy plików, wiele plików, usuwanie, trwałość i limit 10 MB |

## 5. Najważniejsze reguły biznesowe potwierdzone testami

- Do zapisania zamówienia wymagany jest produkt przeniesiony do sekcji **Zamówienie**. Sam filtr `Przedmiot` nie jest wymagany, jeżeli produkt został już dodany.
- Pole `Ilość` jest edytorem AG Grid. Zakończenie edycji klawiszem `Tab` utrwala wartość.
- Wpisanie `0` jest normalizowane przez aplikację do `10`.
- Po całkowitym wyczyszczeniu pola `Ilość` aplikacja automatycznie wstawia wartość; pole nie pozostaje puste.
- Wartość ujemna jest obecnie akceptowana — `ORD-38` dokumentuje znany błąd.
- Dwa szybkie kliknięcia `Zapisz` są wykonywane z krótkim, realistycznym odstępem; test nie wymusza dwóch zdarzeń JavaScript w tej samej chwili.
- Nowe zamówienie należy identyfikować względem listy ID pobranej **przed otwarciem formularza**. Zapobiega to błędnemu zwracaniu ID poprzedniego zamówienia.
- Kolejne zamówienia muszą mieć różne ID i pozostawać od siebie niezależne.

## 6. Załączniki

Obsługiwane formaty deklarowane przez UI: `PDF`, `JPG`, `PNG`. Maksymalny rozmiar: `10 MB`.

Testy sprawdzają:

- dodawanie pojedynczego JPG, PNG i PDF;
- kilka załączników w jednym zamówieniu;
- usuwanie jednego i wszystkich załączników;
- potwierdzenie usunięcia w dialogu **Usuwanie dokumentu** przyciskiem **Tak**;
- zachowanie załącznika przy zmianie filtrów i dodawaniu produktu;
- trwałość jednego i wielu załączników po zapisaniu i ponownym otwarciu edycji;
- brak przenoszenia załączników po anulowaniu formularza;
- odrzucenie `WEBP`, `TXT` i pliku większego niż `10 MB`;
- akceptację pliku o rozmiarze dokładnie `10 MB`.

Po zapisaniu zamówienia Octopus może prezentować załącznik pod nazwą systemową, np. `2026/BOK/1020379_1`, zamiast oryginalnej nazwy lokalnego pliku. Test trwałości nie powinien oczekiwać pierwotnej nazwy `ord-*.jpg` po ponownym otwarciu edycji.

Komunikat błędu załącznika ma co najmniej dwa warianty tekstu. Testy sprawdzają wspólny kontrakt: tytuł `Błąd podczas załączania dokumentu`, dozwolone formaty, limit `10 MB`, brak odrzuconego pliku na liście i możliwość zamknięcia komunikatu. Nie należy porównywać całej treści komunikatu 1:1.

## 7. Cleanup i izolacja danych

Każde zamówienie utworzone przez scenariusz powinno zostać zarejestrowane do cleanupu po uzyskaniu prawidłowego ID. Cleanup jest wykonywany również po błędzie testu, jeżeli ID udało się wcześniej uzyskać.

Przy scenariuszach tworzących kilka zamówień wszystkie ID muszą zostać zarejestrowane przed asercją, która może zakończyć test błędem. Dzięki temu wykrycie duplikatu nie pozostawia danych testowych.

Jeżeli zamówienie jest celowo usuwane w samym scenariuszu, cleanup nie powinien ponownie długo oczekiwać na rekord, który już nie istnieje.

## 8. Najważniejsze helpery

| Helper | Odpowiedzialność |
|---|---|
| `ordersPanel()` | panel zamówień szkoły |
| `openOrders()` | otwarcie zakładki Zamówienia |
| `openNewOrderForm()` | formularz `Dodaj zamówienie` |
| `orderFilterCombobox()` | dostęp do filtrów formularza |
| `searchOrderProducts()` | uruchomienie wyszukiwania produktów |
| `availableProductRow()` | wiersz produktu w sekcji Gratisy |
| `selectedProductRow()` | wiersz produktu w sekcji Zamówienie |
| `addOrderProduct()` | wyszukanie i przeniesienie produktu |
| `editOrderQuantity()` / `setOrderQuantity()` | edycja ilości w AG Grid |
| `getOrderIds()` | odczyt ID zamówień widocznych na liście |
| `saveNewOrder()` | zapis i rozpoznanie nowego ID względem stanu `before` |
| `orderRow()` | wiersz konkretnego zamówienia |
| `expandOrderItems()` | rozwinięcie pozycji zamówienia |
| `expectOrderItems()` | porównanie produktów i ilości |
| `openOrderEdit()` | otwarcie edycji zaznaczonego zamówienia |
| `deleteOrder()` | usunięcie zamówienia |
| `attachmentByName()` | odszukanie załącznika przed zapisem |
| `uploadOrderAttachment()` | dodanie poprawnego pliku |
| `uploadOrderAttachmentExpectRejected()` | obsługa i weryfikacja odrzuconego pliku |
| `removeOrderAttachment()` | usunięcie pliku z potwierdzeniem |

## 9. Pełna lista testów ORD

Pełna lista `ORD-01–ORD-62`, razem z pozostałymi testami projektu, znajduje się w pliku `scenario-index-updated.md`.

## 10. Uruchamianie

Cała sekcja zamówień:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts --workers=1
```

Pojedynczy scenariusz:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts -g "ORD-56" --workers=1 --headed
```

Testy załączników:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts -g "@attachment" --workers=1
```

## 11. Scenariusze warte dodania

Poniższe przypadki są rekomendowane, ale nie są wliczone do aktualnych `349` scenariuszy:

| Proponowany ID | Scenariusz |
|---|---|
| `ORD-63` | zapisane zamówienie z co najmniej jednym załącznikiem pokazuje ikonę dokumentu na liście |
| `ORD-64` | zapisane zamówienie bez załącznika nie pokazuje ikony dokumentu |
| `ORD-65` | po usunięciu ostatniego załącznika z zapisanego zamówienia ikona dokumentu znika |
| `ORD-66` | kilka załączników nadal daje pojedynczy, jednoznaczny wskaźnik załącznika przy zamówieniu |

Największą wartość mają `ORD-63` i `ORD-64`, ponieważ razem potwierdzają, że ikona na liście faktycznie reprezentuje obecność załącznika, a nie jest stałym elementem wiersza.
