# Zamówienia szkoły — dokumentacja testów automatycznych

## 1. Cel

Sekcja `ORD-*` sprawdza obsługę zamówień szkoły w Octopusie: formularz, filtry, słowniki, wyszukiwanie gratisów, przenoszenie produktów, ilości, zapis, edycję, izolację zamówień, cleanup oraz załączniki.

Aktualny zakres dokumentacji obejmuje **ORD-01–ORD-66**.

## 2. Pliki

```text
tests/zamowienia-szkoly.spec.ts
tests/support/order.ts
tests/support/order-school.ts
tests/data/order-product-data.ts
tests/support/scenario.ts
```

## 3. Dane referencyjne

Dane produktów są utrzymywane centralnie w `ORDER_PRODUCTS`.

Najważniejsze zestawy referencyjne:

- Fizyka / Szkoła Podstawowa / klasa 7,
- Język polski / Szkoła Podstawowa / klasa 5.

Dla wykonywania ORD równolegle każdy worker powinien korzystać z osobnej szkoły referencyjnej, np.:

```text
AUTO_ORD_REFERENCE_DEV_W0
AUTO_ORD_REFERENCE_DEV_W1
```

Dzięki temu cleanup jednego workera nie powinien usuwać zamówień utworzonych przez drugi worker.

## 4. Zakres testów

| Zakres | Obszar |
|---|---|
| `ORD-01–ORD-03` | rdzeń regresji: zapis, wiele produktów, edycja i usuwanie |
| `ORD-04–ORD-08` | formularz i anulowanie |
| `ORD-09–ORD-11` | słowniki Przedmiot / Poziom / Klasy |
| `ORD-12–ORD-24` | wyszukiwanie, filtry i reset filtrów |
| `ORD-25–ORD-32` | przenoszenie produktów i spójność danych |
| `ORD-33–ORD-39` | ilości, AG Grid, wartości graniczne i walidacja |
| `ORD-40–ORD-47` | zapis, integralność, ID, izolacja i trwałość |
| `ORD-48–ORD-62` | załączniki: formaty, trwałość, usuwanie i limit 10 MB |
| `ORD-63–ORD-66` | wskaźnik załącznika na liście zamówień |

## 5. Najważniejsze reguły biznesowe potwierdzone testami

- Zamówienie można zapisać bez wybranego filtra `Przedmiot`, jeżeli produkt został już dodany do sekcji **Zamówienie**.
- Pole `Ilość` jest edytorem AG Grid i kończy edycję po `Tab`.
- Wpisanie `0` jest normalizowane przez aplikację do `10`.
- Po wyczyszczeniu pola ilości aplikacja automatycznie przywraca wartość.
- Produkt już dodany do Zamówienia nie powinien pojawiać się ponownie w Gratisach.
- Załączniki mogą być dodawane w formatach PDF, JPG i PNG.
- WEBP i TXT są odrzucane.
- Limit rozmiaru załącznika wynosi 10 MB; plik dokładnie 10 MB jest akceptowany, większy jest odrzucany.
- Obecność załącznika jest sygnalizowana ikoną przy zapisanym zamówieniu.

## 6. Znany bug — ORD-38

`ORD-38` jest oznaczony przez Playwright jako `test.fail()`:

```ts
test.fail(
  true,
  "Znany bug: pole Ilość pozwala obecnie wpisać -1.",
);
```

To oznacza, że jego niepowodzenie jest **oczekiwane** i nie powoduje niepowodzenia całej regresji.

W Test Runner UI taki przypadek jest prezentowany osobno jako **Expected failed**. Jest to informacja dodatkowa: expected failure jest już zawarty w liczbie `Passed` raportowanej przez Playwrighta.

Przykład poprawnego wyniku pełnego ORD:

```text
Passed:          66
Expected failed: 1
Failed:           0
Skipped:          0

Historia: PASSED · 66/66 · expected fail: 1
```

## 7. Uruchamianie

Jeden worker:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts --workers=1
```

Dwa workery:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts --workers=2
```

Pojedynczy test:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts -g "ORD-56" --workers=1 --headed
```

Testy załączników:

```powershell
npx playwright test tests/zamowienia-szkoly.spec.ts -g "@attachment" --workers=2
```

## 8. Nowe testy ORD-63–ORD-66

| ID | Scenariusz |
|---|---|
| `ORD-63` | zapisane zamówienie z co najmniej jednym załącznikiem pokazuje ikonę dokumentu na liście |
| `ORD-64` | zapisane zamówienie bez załącznika nie pokazuje ikony dokumentu |
| `ORD-65` | po usunięciu ostatniego załącznika z zapisanego zamówienia ikona dokumentu znika |
| `ORD-66` | kilka załączników nadal daje pojedynczą ikonę dokumentu na liście |

## 9. Pełna lista testów ORD

| ID | Scenariusz |
|---|---|
| `ORD-01` | zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu |
| `ORD-02` | zamówienie z dwoma produktami zachowuje produkty i ilości |
| `ORD-03` | edycja ilości dwóch produktów i usunięcie zamówienia |
| `ORD-04` | formularz Dodaj zamówienie zawiera komplet podstawowych kontrolek |
| `ORD-05` | anulowanie pustego formularza nie tworzy zamówienia |
| `ORD-06` | anulowanie po wyszukaniu nie tworzy zamówienia |
| `ORD-07` | anulowanie po dodaniu produktu i ilości nie tworzy zamówienia |
| `ORD-08` | ponowne otwarcie po anulowaniu zaczyna od czystego formularza |
| `ORD-09` | lista Przedmiot zawiera oczekiwane pozycje |
| `ORD-10` | lista Poziom zawiera oczekiwane pozycje |
| `ORD-11` | lista Klasy zawiera 0-8 i pozwala zaznaczyć kilka klas |
| `ORD-12` | wyszukiwanie po dokładnym kodzie zwraca właściwy produkt |
| `ORD-13` | wyszukiwanie po fragmencie kodu zwraca oba produkty fizyki 7 |
| `ORD-14` | filtr Przedmiot ogranicza wyniki do fizyki |
| `ORD-15` | filtr Poziom ogranicza wyniki do szkoły podstawowej |
| `ORD-16` | filtr Klasa zwraca produkty klasy 7 |
| `ORD-17` | filtr Klasy pozwala wyszukiwać dla kilku klas jednocześnie |
| `ORD-18` | Przedmiot i Poziom działają razem |
| `ORD-19` | Przedmiot, Poziom i Klasa działają razem |
| `ORD-20` | wszystkie filtry razem zwracają oczekiwane produkty |
| `ORD-21` | nieistniejący kod daje pustą listę wyników |
| `ORD-22` | drugie wyszukanie zastępuje wyniki pierwszego |
| `ORD-23` | Wyczyść filtry resetuje wszystkie kryteria |
| `ORD-24` | wyszukiwanie działa poprawnie po wyczyszczeniu filtrów |
| `ORD-25` | strzałka w prawo przenosi wybrany produkt do Zamówienia |
| `ORD-26` | kilka produktów można przenieść do Zamówienia jednym ruchem |
| `ORD-27` | strzałka w lewo cofa zaznaczony produkt |
| `ORD-28` | kosz usuwa wszystkie produkty z tworzonego zamówienia |
| `ORD-29` | produkt już dodany do Zamówienia nie pojawia się ponownie w Gratisach |
| `ORD-30` | wyszukanie kolejnego produktu nie usuwa wcześniej wybranego |
| `ORD-31` | zmiana filtrów nie usuwa produktów z Zamówienia |
| `ORD-32` | dane produktu są spójne po przeniesieniu do Zamówienia |
| `ORD-33` | ilość 1 jest zachowywana w edytorze |
| `ORD-34` | różne produkty zachowują niezależne ilości |
| `ORD-35` | ostatnia zmiana ilości przed zapisem jest używana |
| `ORD-36` | Tab kończy edycję ilości w AG Grid |
| `ORD-37` | wpisanie 0 normalizuje ilość do 10 |
| `ORD-38` | wartość ujemna nie powinna być akceptowana — znany bug |
| `ORD-39` | wyczyszczenie pola Ilość automatycznie przywraca wartość |
| `ORD-40` | pusty formularz nie zapisuje zamówienia i oznacza Przedmiot jako niepoprawny |
| `ORD-41` | zamówienie można zapisać bez wybranego Przedmiotu, jeśli produkt został dodany |
| `ORD-42` | dwa szybkie kliknięcia Zapisz z krótkim odstępem tworzą tylko jedno zamówienie |
| `ORD-43` | dwa kolejne zamówienia dostają różne ID |
| `ORD-44` | usunięcie pierwszego z dwóch zamówień nie usuwa drugiego |
| `ORD-45` | zamówienie utworzone dla szkoły A nie pojawia się w szkole B |
| `ORD-46` | reload zachowuje ID, produkt i ilość zamówienia |
| `ORD-47` | zapisane zamówienie ma numeryczne ID i widoczny wiersz na liście |
| `ORD-48` | poprawny JPG można dodać jako załącznik |
| `ORD-49` | poprawny PNG można dodać jako załącznik |
| `ORD-50` | poprawny PDF można dodać jako załącznik |
| `ORD-51` | można dodać kilka załączników do jednego zamówienia |
| `ORD-52` | można usunąć jeden z kilku załączników po potwierdzeniu |
| `ORD-53` | po usunięciu wszystkich załączników lista jest pusta |
| `ORD-54` | zmiana filtrów nie usuwa załącznika |
| `ORD-55` | dodanie produktu nie usuwa załącznika |
| `ORD-56` | załącznik jest trwały po zapisaniu i ponownym otwarciu edycji zamówienia |
| `ORD-57` | kilka załączników jest trwałych po zapisaniu zamówienia |
| `ORD-58` | anulowanie formularza z załącznikiem nie przenosi pliku do kolejnego formularza |
| `ORD-59` | niedozwolony typ pliku WEBP jest odrzucany |
| `ORD-60` | niedozwolony typ pliku TXT jest odrzucany |
| `ORD-61` | plik większy niż 10 MB jest odrzucany |
| `ORD-62` | plik o rozmiarze dokładnie 10 MB jest akceptowany |
| `ORD-63` | zapisane zamówienie z co najmniej jednym załącznikiem pokazuje ikonę dokumentu na liście |
| `ORD-64` | zapisane zamówienie bez załącznika nie pokazuje ikony dokumentu |
| `ORD-65` | po usunięciu ostatniego załącznika z zapisanego zamówienia ikona dokumentu znika |
| `ORD-66` | kilka załączników nadal daje pojedynczą ikonę dokumentu na liście |

## 10. Cleanup

Test, który utworzył zamówienie, powinien zarejestrować jego ID i usunąć je w `finally`/`withOrderCleanup`.

Przy dwóch workerach izolacja jest realizowana przez osobne szkoły referencyjne. Dzięki temu usunięcie zamówienia workera 0 nie powinno wpływać na dane workera 1.

## 11. Raportowanie

Każdy przebieg z UI ma własny raport HTML w katalogu:

```text
runs/html-reports/<run-id>/index.html
```

Raport jednego testu nie nadpisuje już raportu całej regresji.
