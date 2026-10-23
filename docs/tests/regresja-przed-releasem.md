# Octopus — szybka regresja przed releasem

W panelu **Uruchom testy** wybierz **Octopus — regresja przed releasem (26)**. W zakładce **Scenariusze** ten sam zestaw jest opisany jako **Szybka regresja Octopusa przed releasem — 26 przypadków**. Pakiet korzysta z istniejących testów; lista źródłowa znajduje się w `tests/data/regresja-przed-releasem.json`.

Wymagane: DEV, działająca sesja, dostęp do bazy GWO_CRMDEV do ustawienia dat własnych zamówień gratisowych i wykonania obu procedur przeliczeń (EXECUTE). Pakiet działa w jednym procesie z uwagi na kopiowanie i izolację danych. Na TEST uruchomienie tego pakietu jest odrzucane, aby nie uzyskać pozornie poprawnego wyniku z pominiętymi gratisami.

| Obszar | Przypadki |
|---|---|
| Nauczyciele | ADD-01, ADD-15, EDIT-12: zapis, wymagane imię, edycja e-maila i historia |
| Szkoły | SCH-03, SCH-04, SCH-EDIT-04: zapis, wymagana nazwa, edycja kontaktu |
| Klubowiczostwo | CLUB-01, CLUB-02, CLUB-52: zapis, edycja klasy, powrót OBCY → NASZ |
| Progi i uprawnienia | THR-12, ACC-01, NCL-01, NCL-02, NCL-07: próg, eksport, kwalifikacja i odebranie promocji |
| Zamówienia i kopiowanie | ORD-01, ORD-03, ORD-05, ORD-COPY-01: zapis, edycja i usunięcie, anulowanie, kopia ZS → SP |
| Medalowość | MED-02: pole medalu nie pozwala na edycję |
| Gratisy | POTW26-01-MINUS, MIN, NO-ORDER, FOREIGN oraz POTW26-08-MIN: za mała ilość, poprawny próg, brak zamówienia, obcy nauczyciel i SŚ klasa 2 |
| Katalog gratisów | GFT-01 i GFT-02: lista oraz dodanie, edycja, porównanie z bazą i usunięcie śmietnikiem |

Z terminala: `npm run test:release:smoke`. Sama lista bez wykonania: `node scripts/run-release-smoke.mjs --list`. Widoczna przeglądarka: `node scripts/run-release-smoke.mjs --headed`.

Do oceny wymagane są 26 wyników PASS bez pominięć. FAIL danych przygotowania oznacza brak potwierdzenia funkcji i wymaga przygotowania danych oraz ponowienia. Nie zmieniaj oczekiwań testu, żeby uzyskać zielony pakiet.

Czas całego zestawu nie został jeszcze zmierzony na DEV. Lista testów nie potwierdza ich zaliczenia. Zestaw nie obejmuje pełnej macierzy dat i klas, wszystkich kierunków kopiowania, rocznej medalowości ani sezonowego debiutu. NCL-04 i NCL-05 są dostępne w osobnym scenariuszu promocji; ich brak w krótkim pakiecie nie zamyka wcześniejszych niezgodności. Po zmianie konkretnej funkcji uruchom dodatkowo odpowiedni pełny pakiet.
