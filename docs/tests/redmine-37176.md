# Redmine #37176 — ujemna ilość w zamówieniu szkolnym

Źródło: opis zgłoszenia i zrzuty ekranu przekazane przez użytkownika. Adres Redmine nie został podany.

## Regresja

Plik `tests/zamowienia-redmine-37176.spec.ts`, scenariusze `ORD-BUG-37176-01` (-1) i `ORD-BUG-37176-02` (-10), tag `@redmine-37176`. Dostępne w pakiecie Zamówienia i przez wybór pojedynczych ID.

Test przygotowuje dedykowaną szkołę za pomocą istniejącego fixture, zapamiętuje ID zamówień, dodaje produkt i wpisuje nieprawidłową ilość. Jeżeli pole odrzuca ujemną wartość i przywraca dodatnią, dokumentuje tę ochronę bez zapisywania poprawnego zamówienia. Gdy pole zachowuje niedodatnią wartość, test sprawdza blokadę przycisku albo rzeczywiście próbuje kliknąć Zapisz. Oczekuje pozostania formularza i braku nowego zamówienia po ponownym otwarciu szkoły. Nie przechwytuje ani nie blokuje żądania zapisu.

Zapisuje zrzuty ekranu także przy przejściu, dane wejściowe, ID przed/po, informację o żądaniu i adnotację Redmine. Jeżeli błąd utworzy zamówienie, test odkrywa je do sprzątania w istniejącym mechanizmie `withOrderCleanup`. Nie korzysta ze szkoły ani zamówienia ze zrzutów użytkownika.

Nie testuje bezpośrednio kontraktu walidacji API z pominięciem interfejsu. Odrzucenie lub normalizacja wartości w polu stanowi osobną akceptowaną ścieżkę ochrony formularza. ORD-38 pozostaje wcześniejszym, węższym testem pola.

## Stan

Test napisany; brak wykonania na DEV/TEST. Samo dodanie testu nie jest dowodem usunięcia błędu. Dowodem będzie raport konkretnego uruchomienia z datą, środowiskiem i wersją aplikacji, przypięty do zgłoszenia w Centrum.
