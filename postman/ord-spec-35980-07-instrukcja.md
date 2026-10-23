# Kopiowanie do szkoły poza strukturą — Postman

Importuj `ord-spec-35980-07.postman_collection.json`. Ustaw Variables kolekcji:

- `bearerToken`: aktualny token sesji Octopusa, bez prefiksu Bearer;
- `currentUserId`: ID własnego zalogowanego użytkownika (w raporcie: 20415).

Dane z raportu są wpisane:

| Rola          | ID szkoły | Jednostka w raporcie | Nazwa                                                       |
| ------------- | --------- | -------------------- | ----------------------------------------------------------- |
| Źródło SP     | 94824     | 42320                | AUTO_STR_DEV_COPY_SPEC35980_SP_ZS_RUN_cf267fc9c52e_W0       |
| Odbiorca SOLO | 94827     | 42324                | AUTO_STR_DEV_COPY_SPEC35980_SAMODZIELNA_RUN_cf267fc9c52e_W0 |

Jednostki są automatycznie odczytywane w kroku 00 bezpośrednio z danych szkół. Nie są wyznaczane z relacji zapisanych przy zamówieniu. Jeżeli szkoły już nie istnieją, wpisz własne `sourceSchoolId` i `targetSchoolId`, pozostające poza wspólną strukturą. Kolekcja nie tworzy ani nie usuwa relacji. Relacje przygotowane przez pierwotny automat zostały posprzątane; istotnym warunkiem tego przypadku jest brak powiązania źródła z odbiorcą.

Uruchom **00–07 w kolejności, jedna iteracja**, z kontynuowaniem po błędzie asercji. Można też wysyłać kolejno ręcznie.

1. **00:** odczyt obu szkół i ich jednostek.
2. **01:** odczyt struktury odbiorcy i kontrola, że nie zawiera źródła.
3. **02:** utworzenie nowego oryginału: F7P (produkt 3005) ×3 i 4P-2 (produkt 4707) ×2. ID zapisuje się w `newOrderId`.
4. **03:** kontrola oryginału i zapis dokumentów źródła przed próbą.
5. **04:** zapis dokumentów odbiorcy przed próbą.
6. **05:** POST `/api/SchoolOrder/MakeSchoolOrderCopy` z `institutionOrderId={{newOrderId}}`, `institutionUnitIdsCopyTo=[{{targetUnitId}}]` i `createdBy={{currentUserId}}`.
7. **06–07:** porównanie dokumentów źródła i odbiorcy ze stanem przed próbą.

Oczekiwany wynik: odmowa kopiowania z kodem walidacji i brak zmian w obu szkołach. Kolekcja stosuje te same kryteria co automat: HTTP 400/404/409/422 lub HTTP 200 z takim kodem w `codeResult`. HTTP 401/403 oznacza problem dostępu; 500 nie zalicza kontroli walidacji.

W raporcie `a2084378-4cfb-4601-b3fa-f036955910af` API zwróciło HTTP 200 i `{"description":"Nie można skopiować zamówienia ponieważ podane instytucje nie są w relacji","codeResult":500}`, a dokumenty nie zmieniły się. Odtworzenie tej sytuacji da **FAIL w 05 oraz PASS w 06 i 07**. To odmowa z niewłaściwym kodem, a nie komunikat sukcesu utworzenia kopii.

Nowe dokumenty wykryte w porównaniu zapisują się w `sourceAddedOrderIds` i `targetAddedOrderIds`. Pełna odpowiedź próby kopiowania jest w `copyResponse`.

Oryginał 1022383 z raportu został usunięty przez automat; kolekcja tworzy nowy. Przy ponawianiu na istniejącym `newOrderId` **pomiń 02**. Jeżeli utworzenie zwróci niejednoznaczny wynik, sprawdź listę zamówień przed ponowieniem POST. Kolekcja pozostawia dokumenty do obejrzenia. Po kontroli usuń ręcznie własne nowo utworzone zamówienie oraz ewentualne nowe kopie.

Podgląd w UI: [źródło](https://octopus.gwodev.pl/school/school-panel/94824), [odbiorca](https://octopus.gwodev.pl/school/school-panel/94827).

Nie wymaga zmiany dat w bazie ani dodawania nauczycieli i potwierdzeń. Kolekcję sprawdzono lokalnie; nie uruchomiono jej na DEV. Token nie jest dołączony. Nie udostępniaj eksportu po wpisaniu tokenu.
