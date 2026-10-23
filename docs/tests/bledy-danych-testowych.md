# Błędy danych testowych

Octopus, Księgarnia CMS, Hurtownia i Centrum testów odróżniają błędy przygotowania danych od niezgodności działania aplikacji. Komunikat podaje przyczynę i wskazówki do ponownego uruchomienia. Wynik FAIL nie zmienia się w PASS ani SKIP.

- **Błąd istniejących danych**: np. zamówienia pozostawione w szkole albo zajęty koszyk konta. Sprawdź wskazane dokumenty; usuń wyłącznie własne dane testowe lub przygotuj oddzielne dane.
- **Błąd przygotowania danych**: brakuje wymaganych danych referencyjnych albo jawnie wskazany warunek początkowy nie jest spełniony.
- **Niedokończone przygotowanie danych**: pozostał dziennik przywracania po wcześniejszym teście. Wykonaj procedurę przywracania; nie usuwaj dziennika, aby ominąć kontrolę.

NCL-05: brak pustej szkoły jest sprawdzany przed dodaniem potwierdzeń i zamówień. Nowy komunikat zawiera nazwę i ID szkoły, symbole i ID dokumentów oraz autora. Automat nie usuwa tych zamówień.

Nowe kontrole przygotowania powinny jawnie zgłaszać znacznik `[EXISTING_TEST_DATA]`, `[TEST_DATA_ERROR]`, `[TEST_PRECONDITION]` lub `[TEST_DATA_CONFLICT]` wraz z konkretną przyczyną. Nie oznaczaj tak sprawdzania wyników aplikacji, odpowiedzi HTTP 500 ani oczekiwanej walidacji negatywnego przypadku. Samo wystąpienie słów „brak” lub „istnieje” nie zmienia klasyfikacji błędu.

Klasyfikację obsługuje `scripts/test-data-diagnostic.cjs`; identyczne moduły znajdują się w panelu CMS, API Hurtowni i Centrum testów. Centrum może objaśnić starszy zapisany błąd przy imporcie historii, bez zmiany historycznego wyniku. Pliki starych raportów nie są przepisywane.

Po zmianie kodu serwera panel należy ponownie otworzyć po zakończeniu aktywnych uruchomień. Zmiana opisów nie wymaga ponawiania ani zatrzymywania bieżących testów.
