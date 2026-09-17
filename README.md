# Testy regresji Octopusa

Projekt Playwright uruchamia test w prawdziwej przeglądarce Chromium na **dev: https://octopus.gwodev.pl**. Nie potrzebuje kodu źródłowego Octopusa.

Projekt zawiera **18 testów**. Najnowsze dwa scenariusze (zamówienie szkoły i klubowiczostwo nauczyciela) przeszły razem na dev. Nie uruchamiano jeszcze wszystkich 18 przypadków w jednym przebiegu. Szczegóły i wcześniejsze wyniki w [WERYFIKACJA.md](WERYFIKACJA.md); ograniczenie dotyczące wejścia bezpośrednim linkiem do kartoteki opisano w [OCT-OBS-002](OCT-OBS-002.md). Sesje i lokalne raporty nie są częścią repozytorium. Po sklonowaniu skonfiguruj logowanie według instrukcji poniżej.

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
- `tests/nauczyciel-rozszerzenie.spec.ts` — 6 przypadków zapisu nazwiska, walidacji kontaktu, wyszukiwania i drugiej szkoły.
- `tests/support/shared-school.ts` — szkoła przygotowywana raz na proces wykonawczy nowych testów.
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

Pierwsze rozszerzenie zawiera 9 przypadków obok dotychczasowej ścieżki:

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

### Drugie rozszerzenie: nauczyciel

Rozszerzenie nauczyciela zwiększyło zestaw do 16 testów. Plik `tests/nauczyciel-rozszerzenie.spec.ts` dodaje:

| Test | Sprawdzenie |
|---|---|
| EDIT-03 | Zapis nazwiska Nowak, trwałość po ponownym otwarciu, zachowanie imienia, e-maila i szkoły oraz wpis historii z autorem i datą |
| TEA-04, e-mail | Adres `invalid-email` bez @: niepoprawne pole, komunikat, otwarty formularz i brak rekordu po próbie zapisu |
| TEA-04, telefon | Numer `123`: niepoprawne pole, komunikat, otwarty formularz i brak rekordu; pozostałe wymagane dane są poprawne |
| FIND-05, e-mail | Dokładnie jeden wynik dla unikalnego e-maila, właściwe ID i dane otwartego nauczyciela |
| FIND-05, nazwisko | Dokładnie jeden wynik dla unikalnego nazwiska, właściwe ID i dane otwartego nauczyciela |
| REL-02 | Dodanie drugiej szkoły, zachowanie pierwszej, dokładnie dwa trwałe powiązania i ten sam nauczyciel w obu szkołach |

Reguły walidacji dla podanych przykładów sprawdzono w UI dev. To nie jest pełna specyfikacja dopuszczalnych e-maili ani numerów międzynarodowych. W tym rozszerzeniu pozytywna edycja dotyczy nazwiska, nie zapisu nowego kontaktu.

Nowe testy mają wspólną szkołę tworzoną raz na proces wykonawczy, bez stałego ID istniejącej placówki. Każdy przypadek tworzy własnego nauczyciela albo własny niezapisany formularz. REL-02 tworzy dodatkową szkołę. Po błędzie Playwright uruchamia nowy proces, więc może powstać kolejna wspólna szkoła. Dotychczasowe testy zachowują swoje przygotowanie danych.

```powershell
npm.cmd test -- nauczyciel-rozszerzenie.spec.ts
```

### Rejestry przebiegów

Każdy przebieg ma unikalny prefiks `REG_...`. ID i linki do rekordów są w `runs/<identyfikator>.json` oraz w załączniku raportu. Po udanym teście jego nauczyciel jest automatycznie usuwany wraz z powiązaniami i formularzami. Szkoły i ich zamówienia pozostają. Dane nieudanych testów zostają do analizy. Przy błędzie przed odczytaniem ID można szukać szkoły po zapisanej w pliku nazwie.

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

## Zamówienia i klubowiczostwo

Plik `tests/zamowienia-klubowiczostwo.spec.ts` dodaje dwa niezależne testy:

- **ORD-01** — własna szkoła testowa, produkt KMLT18, jedna sztuka. Po ponownym otwarciu sprawdza ID zamówienia, tytuł, kod, ilość i adres szkoły. Produkt musi istnieć w katalogu dev.
- **CLUB-01** — własna szkoła i nauczyciel testowy, matematyka / SP, formularz w Potwierdzeniach dla klasy 4 (nasze) i domyślnego roku szkolnego. Wysyłka e-maila jest wyłączona. Test sprawdza trwałość przedmiotopoziomu, a następnie formularza, szkoły, klasy oraz statusu Nasz.

Uruchomienie tylko nowych testów:

```powershell
npm.cmd test -- zamowienia-klubowiczostwo.spec.ts
```

ID i parametry rekordów są zapisane w `runs/REG_*.json` i załączone do raportu. Po udanym CLUB-01 nauczyciel i formularz są usuwani; szkoła oraz zamówienie ORD-01 pozostają. Konto wymaga praw do dodawania tych danych oraz usuwania nauczycieli.

## Gdy test nie działa

### Podgląd danych do sprzątania

```powershell
npm.cmd run cleanup:preview
```

Polecenie odczytuje lokalne `runs/REG_*.json`, łączy powtarzające się ID i zapisuje zestawienie w `runs/cleanup-preview.json`. Nie loguje się do Octopusa i niczego w nim nie zmienia. Rekordy związane z nieudanym lub niedokończonym przebiegiem oznacza jako `KEEP_FOR_DIAGNOSIS`. Pozostałe wymagają sprawdzenia w aplikacji (`VERIFY_IN_OCTOPUS`), w tym własności rekordu, zależności i flagi Testowy. Sam wpis w rejestrze nie dowodzi, że dany test utworzył rekord — szkoły bywają współdzielone. Starsze zapisy mogą nie zawierać wszystkich ID.

### Usuwanie nauczycieli

Sprzątanie działa automatycznie po PASS w scenariuszach tworzących nauczyciela, także w teście smoke. Korzysta z `DELETE /api/DeleteRecordsDB/DeleteRecordsFromDB`, z query parameters `userId` (zalogowany użytkownik) i `jsonData` (jeden własny `nauczycielId`). Zgodnie z kontraktem potwierdzonym przez programistę endpoint usuwa dane nauczyciela, w tym formularze klubowe i przedmiotopoziomy, oraz odpina szkoły. Szkół i ich zamówień nie usuwa.

Przed DELETE sprawdzane są ID, zgodność e-maila z unikalnym identyfikatorem przebiegu i aktualna flaga Testowy. Po DELETE API musi potwierdzić brak nauczyciela. Błąd sprzątania powoduje niepowodzenie testu; `result` w rejestrze opisuje wynik scenariusza, a `cleanupStatus` wynik sprzątania: `DELETED`, `ALREADY_ABSENT`, `KEPT_FAILED_TEST`, `FAILED` albo `RUNNING` (operacja przerwana/niezakończona). Brak nauczyciela potwierdzony przez API oznacza HTTP 204; samo HTTP 200 z DELETE nie wystarcza. Rejestry i raporty nie są kasowane. `ABSENCE_CONFIRMED` w podglądzie odnosi się do zapisanego wyniku sprzątania, nie nowego odczytu API.

Podgląd nauczycieli ze starszych udanych przebiegów (bez logowania i usuwania):

```powershell
npm.cmd run cleanup:teachers
```

Usunięcie nauczyciela z konkretnego rejestru wymaga podania jego rzeczywistej nazwy oraz `--apply`:

```powershell
npm.cmd run cleanup:teachers -- REG_123456_abcdef.json --apply
```

Przykładową nazwę zastąp nazwą z podglądu. Można podać kilka rejestrów. Wszystkich nauczycieli z poprawnych lokalnych rejestrów PASS można obsłużyć jednym poleceniem:

```powershell
npm.cmd run cleanup:teachers -- --all          # podgląd, bez zmian
npm.cmd run cleanup:teachers -- --all --apply  # wykonanie
```

`--all` nie obejmuje wszystkich nauczycieli w bazie: wybiera tylko poprawne rejestry udanych testów, których jeszcze nie oznaczono jako posprzątane. Nauczyciele usunięci wcześniej np. przez Excel otrzymują `ALREADY_ABSENT`, bez ponownego DELETE. Rejestry nieudanych testów są pomijane w trybie --all, a odrzucane przy jawnym podaniu pliku. Nie łącz --all z nazwami rejestrów. Narzędzie ponownie weryfikuje każdy rekord w Octopusie i zatrzymuje się przy pierwszym błędzie; ponowne uruchomienie pomija już posprzątane rejestry. Szkoły i zamówienia pozostają. Endpoint działa wyłącznie na dev. Testy zabezpieczeń: `npm.cmd run test:cleanup`.

- Błąd automatycznego logowania: sprawdź cztery wartości w `.env` i wykonaj `npm.cmd run login:auto`. Alternatywnie użyj ręcznego `npm.cmd run login`.
- Po nieudanym logowaniu kolejne testy w tym samym uruchomieniu nie ponawiają próby hasła. Po poprawieniu danych uruchom zestaw/panel UI ponownie.
- Brak przeglądarki: wykonaj `npm.cmd run install:browser`.
- Brak dostępu do strony: sprawdź sieć/VPN tak samo jak podczas ręcznej pracy.
- Błąd selektora po zmianie interfejsu: obejrzyj raport i ślad, zaktualizuj funkcje w `tests/support/octopus.ts`. Nie zmieniaj oczekiwanego wyniku tylko po to, aby uzyskać PASS.
- Błąd w połowie procesu: sprawdź `runs` przed kolejnym uruchomieniem; część danych mogła już powstać.

Dokumentacja: [sesje Playwright](https://playwright.dev/docs/auth), [panel UI](https://playwright.dev/docs/test-ui-mode), [raporty](https://playwright.dev/docs/test-reporters).
