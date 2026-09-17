# Testy regresji Octopusa

Projekt Playwright uruchamia test w prawdziwej przeglądarce Chromium na **dev: https://octopus.gwodev.pl**. Nie potrzebuje kodu źródłowego Octopusa.

Status po poprawce wyszukiwania, 2026-09-17: **9 PASS w pełnym przebiegu; dziesiąty test przerwany wygaśnięciem sesji przeszedł w oddzielnej powtórce**. Test główny i oba przypadki pustych wyników przeszły. Szczegóły w [WERYFIKACJA.md](WERYFIKACJA.md); ograniczenie dotyczące wejścia bezpośrednim linkiem do kartoteki opisano w [OCT-OBS-002](OCT-OBS-002.md). Sesje i lokalne raporty nie są częścią repozytorium. Po sklonowaniu skonfiguruj logowanie według instrukcji poniżej.

## Pierwsze uruchomienie

Otwórz PowerShell w katalogu sklonowanego repozytorium (tym, który zawiera `package.json`). Wymagany jest Node.js 22 lub nowszy.

```powershell
npm.cmd ci
npm.cmd run install:browser
Copy-Item .env.example .env
```

Uzupełnij lokalny plik `.env`: `GITLAB_USERNAME`, `GITLAB_PASSWORD`, `OCTOPUS_USERNAME`, `OCTOPUS_PASSWORD`. GitLab i Octopus mają osobne dane. Wpisz wartości pomiędzy apostrofami; jeśli hasło zawiera apostrof, użyj podwójnych cudzysłowów. Nie nadpisuj istniejącego, uzupełnionego `.env`. Zmienne środowiskowe (np. sekrety CI) mają pierwszeństwo przed plikiem.

Przed testami automat sprawdza zapisaną sesję. Jeśli jest nieaktualna albo jej nie ma, loguje się przez `https://gitlab.gwo.pl`, a następnie do Octopusa. Dane logowania nie są nagrywane w trace, filmie ani zrzutach raportu. Hasła w `.env` są zapisane jawnym tekstem lokalnie; plik jest wykluczony z Gita. Nie udostępniaj go. W repozytorium jest tylko pusty wzór `.env.example`.

Sprawdzenie samego logowania, bez tworzenia szkół i nauczycieli:

```powershell
npm.cmd run auth:check  # wykorzystuje sesję, jeśli jest ważna
npm.cmd run login:auto # wymusza świeże logowanie danymi z .env
```

Opcjonalnie nadal działa ręczne `npm.cmd run login`. W tym trybie zaloguj się w osobnym oknie Chromium i poczekaj na „Sesja zapisana”. Zalogowanie w panelu Codexa nie przenosi sesji do Playwright.

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

Wybierz test i kliknij przycisk uruchomienia. Panel pokazuje kroki i ich wyniki. Każde ponowne uruchomienie tworzy kolejny zestaw danych. Logowanie jest przygotowywane automatycznie przy starcie procesu testowego, również w panelu UI. Jeśli sesja wygaśnie w trakcie długiej pracy w panelu, uruchom panel ponownie.

## Kod do przeczytania

- `tests/szkola-nauczyciel.spec.ts` — scenariusz i oczekiwane wyniki, opisane przez `test.step`.
- `tests/walidacja-anulowanie.spec.ts` — 9 przypadków walidacji, anulowania i pustych wyników.
- `tests/support/scenario.ts` — osobne dane i rejestr przebiegu każdego nowego przypadku.
- `tests/support/octopus.ts` — obsługa formularzy i selektory elementów aplikacji.
- `tests/support/fixtures.ts` — odtworzenie sesji i sprawdzenie dostępu przed zmianą danych.
- `scripts/login.mjs` — samodzielne logowanie i zapis sesji.
- `scripts/auth.mjs` — sprawdzenie sesji i automatyczne logowanie.
- `.env.example` — pusty wzór konfiguracji danych logowania.
- `playwright.config.ts` — przeglądarka, limity oczekiwania i raportowanie.

## Co sprawdza pierwszy test

1. Tworzy syntetyczną szkołę podstawową i oznacza ją jako Testowy.
2. Wyszukuje szkołę po unikalnej nazwie; sprawdza adres i utrwalenie oznaczenia.
3. Tworzy nauczyciela z adresem `@example.invalid`, bez zgód i przedmioto-poziomu; przypisuje go do nowej szkoły.
4. Oznacza nauczyciela jako Testowy i wyszukuje go po ID.
5. Zmienia imię na `JaN`; po ponownym otwarciu sprawdza `Jan`, normalizację nazwiska, e-mail, zgody i powiązanie.
6. Sprawdza historię zmiany imienia (wartość, źródło, niepusty autor, format daty) oraz wpis dodania szkoły.
7. Otwiera szkołę ponownie i sprawdza jednego powiązanego nauczyciela z właściwym ID i imieniem.

Ten test sprawdza cały proces biznesowy. Przygotowanie sesji (w tym ewentualne logowanie GitLab) odbywa się osobno przed testami.

## Dodatkowe testy

Zestaw zawiera łącznie 10 przypadków: dotychczasową ścieżkę oraz 9 nowych testów w czterech obszarach:

| Obszar | Przypadki | Sprawdzenie |
|---|---:|---|
| Wymagane dane nauczyciela | 4 | Osobno brak imienia, nazwiska, szkoły oraz e-maila i telefonu; komunikat, otwarty formularz i brak rekordu w wyszukiwaniu |
| Anulowanie dodawania | 2 | Kompletny formularz nauczyciela lub szkoły anulowany; brak rekordu po ponownym wyszukaniu |
| Anulowanie edycji | 1 | Zmiana imienia i nazwiska anulowana; po ponownym otwarciu poprzednie dane, relacja i identyczna historia |
| Brak wyników po udanym wyszukiwaniu | 2 | Osobno szkoły i nauczyciele: komunikat o braku wyników, usunięcie poprzedniej listy i licznika 1 |

Każdy przypadek może działać samodzielnie. Wymagane szkoły i nauczyciele są tworzeni od nowa, bez zależności od rekordów z wcześniejszego uruchomienia. Testy nie usuwają danych przygotowawczych. Weryfikacja braku rekordu odbywa się przez wyszukiwarkę interfejsu, nie przez bezpośredni odczyt bazy danych.

```powershell
npm.cmd test -- walidacja-anulowanie.spec.ts
npm.cmd test -- --grep @validation
npm.cmd test -- --grep @cancel
npm.cmd test -- --grep @search
```

## Dane i wyniki

Każdy przebieg ma unikalny prefiks `REG_...`. ID i linki do rekordów są w `runs/<identyfikator>.json` oraz w załączniku raportu. Dane pozostają na dev do obejrzenia — skrypt ich nie usuwa. Przy błędzie przed odczytaniem ID można szukać szkoły po zapisanej w pliku nazwie.

Nie ma automatycznych ponowień. Testy działają kolejno w jednym procesie, by ograniczyć wzajemny wpływ operacji na tej samej sesji. Ponowne uruchomienie to nowy zestaw danych.

Raport HTML znajduje się w `playwright-report`, a zrzut i ślad wykonania nieudanego testu w `test-results`. Kolejne uruchomienie zastępuje bieżący raport; trwały rejestr identyfikatorów pozostaje w `runs`.

Sesja jest lokalnie w `playwright/.auth` i daje dostęp do konta. Nie udostępniaj tego katalogu. Jest wyłączony z Git, podobnie jak `.env` i raporty mogące zawierać dane aplikacji. Kod nie zawiera hasła i nie zapisuje logowania na filmie ani w śladzie wykonania. Zapisywany jest tylko stan Octopusa, bez sesji GitLaba. Po zmianie danych w `.env` uruchom test/panel UI ponownie.

## Instalacja na innym komputerze

Wymagany Node.js 22 lub nowszy, dostęp sieciowy do Octopusa i konto z prawem dodawania/edycji nauczycieli oraz szkół.

```powershell
npm.cmd ci
npm.cmd run install:browser
Copy-Item .env.example .env
# Uzupełnij .env przed uruchomieniem testów.
npm.cmd run test:headed
```

Na macOS/Linux użyj `npm` zamiast `npm.cmd`.

## Pozostałe polecenia

```powershell
npm.cmd test                 # bez widocznego okna
npm.cmd run test:list        # lista testów bez wykonywania
npm.cmd run check            # kontrola TypeScript, bez zmiany danych
npm.cmd run test:auth        # mechanizm logowania na przechwyconych formularzach, fikcyjne dane
npm.cmd test -- --grep @smoke # tylko testy oznaczone @smoke
```

## Gdy test nie działa

- Błąd automatycznego logowania: sprawdź cztery wartości w `.env` i wykonaj `npm.cmd run login:auto`. Alternatywnie użyj ręcznego `npm.cmd run login`.
- Po nieudanym logowaniu kolejne testy w tym samym uruchomieniu nie ponawiają próby hasła. Po poprawieniu danych uruchom zestaw/panel UI ponownie.
- Brak przeglądarki: wykonaj `npm.cmd run install:browser`.
- Brak dostępu do strony: sprawdź sieć/VPN tak samo jak podczas ręcznej pracy.
- Błąd selektora po zmianie interfejsu: obejrzyj raport i ślad, zaktualizuj funkcje w `tests/support/octopus.ts`. Nie zmieniaj oczekiwanego wyniku tylko po to, aby uzyskać PASS.
- Błąd w połowie procesu: sprawdź `runs` przed kolejnym uruchomieniem; część danych mogła już powstać.

Dokumentacja: [sesje Playwright](https://playwright.dev/docs/auth), [panel UI](https://playwright.dev/docs/test-ui-mode), [raporty](https://playwright.dev/docs/test-reporters).
