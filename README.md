# Testy regresji Octopusa

Projekt Playwright uruchamia test w prawdziwej przeglądarce Chromium na **dev: https://octopus.gwodev.pl**. Nie potrzebuje kodu źródłowego Octopusa.

Status: pierwszy pełny przebieg skryptu na dev **PASS**, 2026-09-17. Szczegóły w [WERYFIKACJA.md](WERYFIKACJA.md). Sesje i lokalne raporty nie są częścią repozytorium. Po sklonowaniu zainstaluj zależności i zapisz własną sesję według instrukcji poniżej.

## Pierwsze uruchomienie

Otwórz PowerShell w katalogu sklonowanego repozytorium (tym, który zawiera `package.json`). Wymagany jest Node.js 22 lub nowszy.

```powershell
npm.cmd ci
npm.cmd run install:browser
npm.cmd run login
```

W otwartym oknie Chromium zaloguj się do GitLaba, a potem Octopusa. Poczekaj na komunikat „Sesja zapisana” w terminalu. Okno zamknie się automatycznie. To osobna przeglądarka: zalogowanie w panelu Codexa nie przenosi sesji do Playwright.

Następnie uruchom test z widoczną przeglądarką:

```powershell
npm.cmd run test:headed
```

Po zakończeniu obejrzyj raport:

```powershell
npm.cmd run report
```

Serwer raportu kończysz skrótem Ctrl+C. Kod zakończenia testu 0 oznacza sukces, 1 oznacza błąd; szczegóły znajdują się w raporcie.

## Panel do wybierania i oglądania testów

```powershell
npm.cmd run test:ui
```

Wybierz test i kliknij przycisk uruchomienia. Panel pokazuje kroki i ich wyniki. Każde ponowne uruchomienie tworzy kolejny zestaw danych. Logowanie wykonuj osobno przez `npm.cmd run login`, również po wygaśnięciu sesji.

## Kod do przeczytania

- `tests/szkola-nauczyciel.spec.ts` — scenariusz i oczekiwane wyniki, opisane przez `test.step`.
- `tests/support/octopus.ts` — obsługa formularzy i selektory elementów aplikacji.
- `tests/support/fixtures.ts` — odtworzenie sesji i sprawdzenie dostępu przed zmianą danych.
- `scripts/login.mjs` — samodzielne logowanie i zapis sesji.
- `playwright.config.ts` — przeglądarka, limity oczekiwania i raportowanie.

## Co sprawdza pierwszy test

1. Tworzy syntetyczną szkołę podstawową i oznacza ją jako Testowy.
2. Wyszukuje szkołę po unikalnej nazwie; sprawdza adres i utrwalenie oznaczenia.
3. Tworzy nauczyciela z adresem `@example.invalid`, bez zgód i przedmioto-poziomu; przypisuje go do nowej szkoły.
4. Oznacza nauczyciela jako Testowy i wyszukuje go po ID.
5. Zmienia imię na `BoŻena`; po ponownym otwarciu sprawdza `Bożena`, normalizację nazwiska, e-mail, zgody i powiązanie.
6. Sprawdza historię zmiany imienia (wartość, źródło, niepusty autor, format daty) oraz wpis dodania szkoły.
7. Otwiera szkołę ponownie i sprawdza jednego powiązanego nauczyciela z właściwym ID i imieniem.

To jeden test całego procesu, nie pełne pokrycie Octopusa. Nie testuje samodzielnie logowania GitLab — korzysta z wcześniej zapisanej sesji.

## Dane i wyniki

Każdy przebieg ma unikalny prefiks `REG_...`. ID i linki do rekordów są w `runs/<identyfikator>.json` oraz w załączniku raportu. Dane pozostają na dev do obejrzenia — skrypt ich nie usuwa. Przy błędzie przed odczytaniem ID można szukać szkoły po zapisanej w pliku nazwie.

Nie ma automatycznych ponowień. Testy działają kolejno w jednym procesie, by ograniczyć wzajemny wpływ operacji na tej samej sesji. Ponowne uruchomienie to nowy zestaw danych.

Raport HTML znajduje się w `playwright-report`, a zrzut i ślad wykonania nieudanego testu w `test-results`. Kolejne uruchomienie zastępuje bieżący raport; trwały rejestr identyfikatorów pozostaje w `runs`.

Sesja jest lokalnie w `playwright/.auth` i daje dostęp do konta. Nie udostępniaj tego katalogu. Jest wyłączony z Git, podobnie jak raporty mogące zawierać dane aplikacji. Kod nie zawiera hasła i nie zapisuje logowania na filmie ani w śladzie wykonania. Pliki sesji są odczytywane przy starcie — po ponownym logowaniu uruchom test/panel UI ponownie.

## Instalacja na innym komputerze

Wymagany Node.js 22 lub nowszy, dostęp sieciowy do Octopusa i konto z prawem dodawania/edycji nauczycieli oraz szkół.

```powershell
npm.cmd ci
npm.cmd run install:browser
npm.cmd run login
npm.cmd run test:headed
```

Na macOS/Linux użyj `npm` zamiast `npm.cmd`.

## Pozostałe polecenia

```powershell
npm.cmd test                 # bez widocznego okna
npm.cmd run test:list        # lista testów bez wykonywania
npm.cmd run check            # kontrola TypeScript, bez zmiany danych
npm.cmd test -- --grep @smoke # tylko testy oznaczone @smoke
```

## Gdy test nie działa

- „Brak zapisanej sesji” / „Sesja wygasła”: wykonaj `npm.cmd run login`.
- Brak przeglądarki: wykonaj `npm.cmd run install:browser`.
- Brak dostępu do strony: sprawdź sieć/VPN tak samo jak podczas ręcznej pracy.
- Błąd selektora po zmianie interfejsu: obejrzyj raport i ślad, zaktualizuj funkcje w `tests/support/octopus.ts`. Nie zmieniaj oczekiwanego wyniku tylko po to, aby uzyskać PASS.
- Błąd w połowie procesu: sprawdź `runs` przed kolejnym uruchomieniem; część danych mogła już powstać.

Dokumentacja: [sesje Playwright](https://playwright.dev/docs/auth), [panel UI](https://playwright.dev/docs/test-ui-mode), [raporty](https://playwright.dev/docs/test-reporters).
