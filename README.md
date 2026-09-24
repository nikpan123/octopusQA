# Testy regresji Octopusa

Projekt Playwright uruchamia test w prawdziwej przeglądarce Chromium na **dev: https://octopus.gwodev.pl**. Nie potrzebuje kodu źródłowego Octopusa.

Aktualna, automatycznie generowana liczba i lista scenariuszy znajduje się w [docs/tests/scenario-index.md](docs/tests/scenario-index.md). Szczegóły i wcześniejsze wyniki są w [WERYFIKACJA.md](WERYFIKACJA.md); ograniczenie dotyczące wejścia bezpośrednim linkiem do kartoteki opisano w [OCT-OBS-002](OCT-OBS-002.md). Sesje i lokalne raporty nie są częścią repozytorium.

## Pierwsze uruchomienie

Otwórz PowerShell w katalogu sklonowanego repozytorium (tym, który zawiera `package.json`). Wymagany jest Node.js 22 lub nowszy.

```powershell
npm.cmd ci
npm.cmd run install:browser
Copy-Item .env.example .env
```

Uzupełnij lokalny plik `.env`: dane GitLaba oraz `OCTOPUS_DEV_USERNAME` / `OCTOPUS_DEV_PASSWORD`; dla środowiska TEST także `OCTOPUS_TEST_USERNAME` / `OCTOPUS_TEST_PASSWORD`. Starsze `OCTOPUS_USERNAME` i `OCTOPUS_PASSWORD` nadal działają jako fallback dla DEV. GitLab i Octopus mają osobne dane.

Przed każdym testem automat lokalnie sprawdza datę wygaśnięcia JWT, bez uruchamiania dodatkowej przeglądarki. Pełne logowanie wykonuje tylko wtedy, gdy sesji brakuje albo pozostało mniej niż pięć minut jej ważności. Blokada między workerami gwarantuje, że sesję odświeża jeden proces, a pozostałe wykorzystują jego wynik. Fixture odtwarza `sessionStorage`, ale nie wykonuje startowej nawigacji do panelu nauczyciela; pierwszą stroną jest panel wymagany przez scenariusz.

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
- `docs/tests/dodawanie-szkoly.md` — aktualny zakres i plan rozwoju testów formularza dodawania szkoły wraz z zasadami retencji danych.
- `tests/walidacja-anulowanie.spec.ts` — 9 przypadków walidacji, anulowania i pustych wyników.
- `tests/nauczyciel-rozszerzenie.spec.ts` — 6 przypadków zapisu nazwiska, walidacji kontaktu, wyszukiwania i drugiej szkoły.
- `tests/nauczyciel-kontrakty.spec.ts` — różnice kontraktów dodawania i edycji nauczyciela.
- `tests/sesja-i-odpornosc.spec.ts` — błędy 401/403, współbieżna edycja i podwójny zapis przy wolnej sieci.
- `tests/dane-brzegowe-i-bezpieczenstwo.spec.ts` — długie i niebezpieczne dane wejściowe, Unicode, wklejanie oraz sumy kontrolne.
- `tests/support/shared-school.ts` — stabilna szkoła referencyjna używana przez testy edycji.
- `tests/support/scenario.ts` — osobne dane i rejestr przebiegu każdego nowego przypadku.
- `tests/support/api-factory.ts` — szybkie tworzenie nauczyciela, relacji, przedmioto-poziomów i szkoły przez API; dla szkoły potwierdzono domyślnie wyłącznie Szkołę podstawową w Gdańsku (80-064).
- `tests/support/performance.ts` — pomiary fixture, setupu API i ruchu przeglądarki.
- `tests/support/octopus.ts` — obsługa formularzy i selektory elementów aplikacji.
- `tests/support/fixtures.ts` — szybka kontrola ważności JWT, odtworzenie sesji i kontrola dostępu każdego testu.
- `scripts/login.mjs` — samodzielne logowanie i zapis sesji.
- `scripts/auth.mjs` — sprawdzenie sesji i automatyczne logowanie.
- `.env.example` — pusty wzór konfiguracji danych logowania.
- `scripts/performance-reporter.mjs` — percentyle czasu i obciążenie po przebiegu.
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

| Obszar                              | Przypadki | Sprawdzenie                                                                                                               |
| ----------------------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------- |
| Wymagane dane nauczyciela           |         4 | Osobno brak imienia, nazwiska, szkoły oraz e-maila i telefonu; komunikat, otwarty formularz i brak rekordu w wyszukiwaniu |
| Anulowanie dodawania                |         2 | Kompletny formularz nauczyciela lub szkoły anulowany; brak rekordu po ponownym wyszukaniu                                 |
| Anulowanie edycji                   |         1 | Zmiana imienia i nazwiska anulowana; po ponownym otwarciu poprzednie dane, relacja i identyczna historia                  |
| Brak wyników po udanym wyszukiwaniu |         2 | Osobno szkoły i nauczyciele: komunikat o braku wyników, usunięcie poprzedniej listy i licznika 1                          |

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

| Test              | Sprawdzenie                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| EDIT-03           | Zapis nazwiska Nowak, trwałość po ponownym otwarciu, zachowanie imienia, e-maila i szkoły oraz wpis historii z autorem i datą |
| TEA-04, e-mail    | Adres `invalid-email` bez @: niepoprawne pole, komunikat, otwarty formularz i brak rekordu po próbie zapisu                   |
| TEA-04, telefon   | Numer `123`: niepoprawne pole, komunikat, otwarty formularz i brak rekordu; pozostałe wymagane dane są poprawne               |
| FIND-05, e-mail   | Dokładnie jeden wynik dla unikalnego e-maila, właściwe ID i dane otwartego nauczyciela                                        |
| FIND-05, nazwisko | Dokładnie jeden wynik dla unikalnego nazwiska, właściwe ID i dane otwartego nauczyciela                                       |
| REL-02            | Dodanie drugiej szkoły, zachowanie pierwszej, dokładnie dwa trwałe powiązania i ten sam nauczyciel w obu szkołach             |

Reguły walidacji dla podanych przykładów sprawdzono w UI dev. To nie jest pełna specyfikacja dopuszczalnych e-maili ani numerów międzynarodowych. W tym rozszerzeniu pozytywna edycja dotyczy nazwiska, nie zapisu nowego kontaktu.

Testy edycji korzystają ze szkoły referencyjnej właściwej dla środowiska. Nauczyciel, relacja ze szkołą i opcjonalne przedmioto-poziomy są przygotowywane przez API; UI wykonuje wyłącznie operację badaną przez scenariusz. Testy `ADD-*` i pełny smoke nadal tworzą nauczyciela przez interfejs. REL-02 bada dodanie drugiej relacji przez UI.

Weryfikacja relacji od strony szkoły przełącza paginowaną tabelę nauczycieli na `Pokaż wszystkich`, a następnie identyfikuje rekord po ID. Wyszukiwanie `FIND-05` po e-mailu używa zdarzenia `input` bez dodatkowego `keyup`, ponieważ aktualny formularz po `keyup` kopiuje e-mail również do filtra nazwiska.

```powershell
npm.cmd test -- nauczyciel-rozszerzenie.spec.ts
```

### Rejestry przebiegów

Każdy przebieg ma unikalny prefiks `REG_...`. ID i linki do rekordów są w `runs/<identyfikator>.json` oraz w załączniku raportu. Dopiero po ostatnim teście całego uruchomienia nauczyciele z udanych scenariuszy są usuwani wraz z powiązaniami i formularzami. Szkoły i ich zamówienia pozostają. Dane nieudanych testów zostają do analizy. Przy błędzie przed odczytaniem ID można szukać szkoły po zapisanej w pliku nazwie.

Nie ma automatycznych ponowień. Domyślnie dwa workery wykonują równolegle niezależne pliki spec; testy wewnątrz jednego pliku pozostają sekwencyjne. `OCTOPUS_WORKERS` pozwala wybrać od 2 do 4 workerów.

Raport HTML znajduje się w `playwright-report`, a zrzut i ślad wykonania nieudanego testu w osobnym podkatalogu uruchomienia w `test-results`. Dzięki temu drugie uruchomienie nie usuwa diagnostyki działającego zestawu. Kolejne uruchomienie zastępuje bieżący raport; trwały rejestr identyfikatorów pozostaje w `runs`.

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
npm.cmd run test:workers:2   # bezpieczny poziom domyślny
npm.cmd run test:workers:4   # próba obciążeniowa
npm.cmd run test:annual:dev  # osobny workflow rocznej medalowości, 1 worker
npm.cmd run test:list        # lista testów bez wykonywania
npm.cmd run check            # kontrola TypeScript, bez zmiany danych
npm.cmd run quality          # TypeScript, ESLint, formatowanie i aktualność indeksu scenariuszy
npm.cmd run docs:scenarios   # odtworzenie generowanego indeksu scenariuszy
npm.cmd run test:auth        # mechanizm logowania na przechwyconych formularzach, fikcyjne dane
npm.cmd test -- --grep @smoke # tylko testy oznaczone @smoke
```

Jednocześnie może działać tylko jedno uruchomienie testów dla danego środowiska. Wewnątrz tego uruchomienia Playwright używa 2–4 workerów. Sesja jest kontrolowana w globalnym setupie i przed testami; gdy wymaga odświeżenia, blokada między procesami dopuszcza tylko jedno logowanie, a pozostałe workery odczytują jego wynik. Po przebiegu konsola pokazuje p50, p90, p95 i maksimum dla testu, setupu i cleanupu (w tym osobno faz globalnych), a pełny raport wraz z licznikami HTTP trafia do `runs/performance-<run-id>.json`.

Dwufazowe testy `@annual-medal` są celowo wyłączone ze zwykłego `npm test`. Generują snapshot i kilka tysięcy żądań, dlatego uruchamia się je osobno przez `test:annual:dev` lub `test:annual:test`, zawsze na jednym workerze.

Wykluczenie obowiązuje również dla `npm.cmd run test:test`, `test:dev` oraz profili 2–4 workerów. Według indeksu wygenerowanego 24.09.2026 regularna regresja zawiera 296 testów; aktualną liczbę można zawsze sprawdzić przez `npm.cmd run test:test -- --list`. Roczny skrypt zawsze uruchamiaj z `--grep "MED-YEAR-PREP"` albo `--grep "MED-YEAR-01"`; bez filtra wykona oba etapy w jednym przebiegu.

### Historyczny pomiar skalowania z 23.09.2026

Pomiar dotyczył wcześniejszego zestawu 171 testów, a nie obecnego katalogu 296 regularnych scenariuszy.

| Workery |   Wynik | Czas całkowity | `test.total` p50 / p95 | Wniosek                                                                                 |
| ------: | ------: | -------------: | ---------------------: | --------------------------------------------------------------------------------------- |
|       2 | 171/171 |       19,7 min |       6,99 s / 17,95 s | profil domyślny i stabilny                                                              |
|       4 | 166/171 |       15,9 min |       6,65 s / 20,05 s | profil eksperymentalny; 5 błędów pod obciążeniem, w tym HTTP 500 optimistic concurrency |

Cztery workery skróciły przebieg o około 19%, ale podniosły p95 i ujawniły limit środowiska DEV. Dlatego `npm test` pozostaje przy dwóch workerach, a `test:workers:4` służy do kontrolowanych prób obciążeniowych. Raporty źródłowe: `runs/performance-1d8097ac-dbeb-467d-ab3f-6eb6e7b22763.json` i `runs/performance-4a30477c-13cd-43d5-bf3a-1b30b1cac0d6.json`.

## Zamówienia i klubowiczostwo

Testy zamówień znajdują się w `tests/zamowienia-szkoly.spec.ts` oraz `tests/zamowienia-negatywne.spec.ts`, a testy klubowiczostwa w `tests/klubowiczostwo-nauczyciela.spec.ts` i `tests/klubowiczostwo-dodatkowe.spec.ts`.

- **ORD-01–ORD-10** sprawdzają zapis, edycję, usunięcie, walidację ilości i produktów, błędy uprawnień oraz współbieżność zamówień szkoły.
- **CLUB-01–CLUB-71** oraz **KLUB-DOD-01–02** sprawdzają przedmioto-poziomy, formularze klubowe i WSPOM, klasy własne i obce, wydawnictwa, walidację, lata szkolne oraz trwałość danych.
- Testy `CLUB-*` używają stałej puli dwóch szkół podstawowych i jednego liceum, osobnej dla każdego środowiska. Nauczyciele, relacje i przygotowawcze przedmioto-poziomy powstają przez API. `CLUB-01` zachowuje dodawanie przedmioto-poziomu przez UI, ponieważ jest to część celu scenariusza.

Uruchomienie tych sekcji:

```powershell
npm.cmd test -- tests/zamowienia-szkoly.spec.ts
npm.cmd test -- tests/zamowienia-negatywne.spec.ts
npm.cmd test -- tests/klubowiczostwo-nauczyciela.spec.ts
npm.cmd test -- tests/klubowiczostwo-dodatkowe.spec.ts
```

ID i parametry rekordów są zapisane w `runs/REG_*.json` i załączone do raportu. Po zakończeniu całego uruchomienia nauczyciele z udanych scenariuszy `CLUB-*` są usuwani wraz z formularzami; szkoły i zamówienia pozostają. Konto wymaga praw do dodawania tych danych oraz usuwania nauczycieli.

## Gdy test nie działa

### Podgląd danych do sprzątania

```powershell
npm.cmd run cleanup:preview
```

Polecenie odczytuje lokalne `runs/REG_*.json`, łączy powtarzające się ID i zapisuje zestawienie w `runs/cleanup-preview.json`. Nie loguje się do Octopusa i niczego w nim nie zmienia. Rekordy związane z nieudanym lub niedokończonym przebiegiem oznacza jako `KEEP_FOR_DIAGNOSIS`. Pozostałe wymagają sprawdzenia w aplikacji (`VERIFY_IN_OCTOPUS`), w tym własności rekordu, zależności i flagi Testowy. Sam wpis w rejestrze nie dowodzi, że dany test utworzył rekord — szkoły bywają współdzielone. Starsze zapisy mogą nie zawierać wszystkich ID.

### Usuwanie nauczycieli

Sprzątanie działa w globalTeardown, po zakończeniu wszystkich testów i workerów. Każde uruchomienie dostaje własny cleanupBatchId. Sprzątane są wyłącznie rekordy PASS z tego uruchomienia, także z testu smoke; starsze rejestry pozostają nietknięte. Zweryfikowani nauczyciele są usuwani w paczkach po maksymalnie 10 ID. Odczyty kontrolne przed i po każdej paczce nadal są osobnymi żądaniami GET. Jeśli wszyscy już nie istnieją, DELETE nie jest wysyłany. W trybie UI globalny teardown zależy od zakończenia sesji/globalnego teardown w panelu, a nie od zakończenia pojedynczego testu. Po wymuszonym zamknięciu procesu pozostaje ręczne cleanup:teachers. Korzysta z `DELETE /api/DeleteRecordsDB/DeleteRecordsFromDB`, z query parameters `userId` (zalogowany użytkownik) i `jsonData` (lista własnych `nauczycielId`). Zgodnie z kontraktem potwierdzonym przez programistę endpoint usuwa dane nauczyciela, w tym formularze klubowe i przedmiotopoziomy, oraz odpina szkoły. Szkół i ich zamówień nie usuwa.

Przed DELETE sprawdzane są ID, zgodność e-maila z unikalnym identyfikatorem przebiegu i (domyślnie) aktualna flaga Testowy. Po DELETE API musi potwierdzić brak nauczyciela. Błąd sprzątania powoduje niepowodzenie całego uruchomienia, bez zmiany wyniku zakończonego testu; `result` w rejestrze opisuje wynik scenariusza, a `cleanupStatus` wynik sprzątania: `DELETED`, `ALREADY_ABSENT`, `KEPT_FAILED_TEST`, `PENDING_SUITE_END` (oczekuje na koniec zestawu), `UNKNOWN` (niepewny wynik DELETE), `FAILED` albo `RUNNING` (operacja przerwana/niezakończona). Brak nauczyciela potwierdzony przez API oznacza HTTP 204; samo HTTP 200 z DELETE nie wystarcza. Rejestry i raporty nie są kasowane. Załącznik testu jest zapisywany przed końcowym sprzątaniem i może pokazywać PENDING_SUITE_END; końcowy wynik jest w pliku runs/REG_*.json i w konsoli. `ABSENCE_CONFIRMED` w podglądzie odnosi się do zapisanego wyniku sprzątania, nie nowego odczytu API.

Ręczne `--apply` na całej paczce (`--all`/`--include-failed`) jest odporne na pojedynczy zły rekord: błąd jednego nauczyciela (niezgodność z rejestrem albo brak flagi Testowy) nie przerywa całej operacji — jest zbierany i zgłaszany na końcu, a pozostali nauczyciele z paczki zostają usunięci. Kod wyjścia jest wtedy niezerowy, żeby pominięty rekord nie umknął uwadze, mimo że reszta się powiodła.

Domyślny ręczny podgląd obejmuje tylko rejestry `PASS`. Opcja `--include-failed` dodaje zakończone rejestry `FAIL`, `FAILED`, `TIMEDOUT` i `INTERRUPTED`, pozostawione wcześniej jako `KEPT_FAILED_TEST`. Nie osłabia kontroli bezpieczeństwa: przed usunięciem nadal muszą zgadzać się ID, unikalny e-mail lub zapisane nazwisko oraz (domyślnie) flaga `Testowy`. Wynik scenariusza pozostaje niezmieniony; aktualizowany jest tylko `cleanupStatus`.

Opcja `--include-untested` pozwala usunąć nauczyciela nawet bez potwierdzonej flagi `Testowy` (np. gdy jej zapis się nie powiódł, mimo że sam test przeszedł). Zgodność ID + e-maila (i nazwiska, jeśli zapisane w rejestrze) pozostaje obowiązkowa nawet z tą opcją — to ona jest właściwym zabezpieczeniem przed usunięciem cudzego rekordu, flaga Testowy to dodatkowa, informacyjna warstwa. Łączy się z `--all`, `--include-failed` i z konkretnymi nazwami rejestrów:

```powershell
npm.cmd run cleanup:teachers -- --all --include-untested          # podgląd, bez zmian
npm.cmd run cleanup:teachers -- --all --include-untested --apply  # usuń też nieoflagowanych
```

#### Usuwanie nauczycieli po nieudanych testach

Automatyczny globalTeardown zachowuje rekord po nieudanym teście, aby umożliwić analizę błędu. Po zakończeniu diagnostyki można usunąć go ręcznie. Zalecana kolejność to najpierw podgląd, a dopiero później powtórzenie polecenia z `--apply`.

Podgląd wszystkich nieposprzątanych rejestrów PASS oraz zakończonych nieudanych testów:

```powershell
npm.cmd run cleanup:teachers -- --include-failed
```

Jeśli mają zostać usunięte wyłącznie wybrane rekordy `FAILED`, należy skopiować ich pełne nazwy z kolumny `rejestr`:

```powershell
# Podgląd wybranych rekordów — bez usuwania
npm.cmd run cleanup:teachers -- REG_123456_abcdef.json REG_123457_abcdef.json --include-failed

# Usunięcie dokładnie tych rekordów
npm.cmd run cleanup:teachers -- REG_123456_abcdef.json REG_123457_abcdef.json --include-failed --apply
```

Usunięcie wszystkich rekordów pokazanych przez zbiorczy podgląd, czyli zarówno PASS, jak i nieudanych:

```powershell
npm.cmd run cleanup:teachers -- --include-failed --apply
```

Nie ma niejawnego usuwania rekordów `FAILED`: brak `--include-failed` zawsze je pomija lub odrzuca. Samo `--include-failed` również niczego nie usuwa — operacja wymaga dodatkowo `--apply`.

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
npm.cmd run cleanup:teachers -- --all                              # podgląd, bez zmian
npm.cmd run cleanup:teachers -- --all --apply                      # wykonanie
npm.cmd run cleanup:teachers -- --include-failed                   # podgląd PASS i nieudanych
npm.cmd run cleanup:teachers -- --include-failed --apply           # usuń pokazane rekordy
npm.cmd run cleanup:teachers -- --all --include-untested --apply   # usuń też bez flagi Testowy
```

`--all` nie obejmuje wszystkich nauczycieli w bazie: wybiera tylko poprawne rejestry udanych testów, których jeszcze nie oznaczono jako posprzątane. Nauczyciele usunięci wcześniej np. przez Excel otrzymują `ALREADY_ABSENT`, bez ponownego DELETE. Rejestry nieudanych testów są pomijane w trybie `--all`; wymagają `--include-failed`. Nie łącz `--all` z nazwami rejestrów. Narzędzie weryfikuje każdego nauczyciela z osobna przed jego usunięciem — błąd jednego (niezgodność danych albo, bez `--include-untested`, brak flagi Testowy) pomija tylko jego i nie blokuje pozostałych — a następnie wysyła paczki po maksymalnie 10 ID. Po każdej paczce sprawdza osobno każdego nauczyciela i zachowuje jego wynik. Nie ponawia automatycznie niepewnego DELETE; ponowne uruchomienie pomija już posprzątane rejestry. Szkoły i zamówienia pozostają. Endpoint działa wyłącznie na dev. Testy zabezpieczeń: `npm.cmd run test:cleanup`.

- Błąd automatycznego logowania: sprawdź cztery wartości w `.env` i wykonaj `npm.cmd run login:auto`. Alternatywnie użyj ręcznego `npm.cmd run login`.
- Po nieudanym logowaniu kolejne testy w tym samym uruchomieniu nie ponawiają próby hasła. Po poprawieniu danych uruchom zestaw/panel UI ponownie.
- Brak przeglądarki: wykonaj `npm.cmd run install:browser`.
- Brak dostępu do strony: sprawdź sieć/VPN tak samo jak podczas ręcznej pracy.
- Błąd selektora po zmianie interfejsu: obejrzyj raport i ślad, zaktualizuj funkcje w `tests/support/octopus.ts`. Nie zmieniaj oczekiwanego wyniku tylko po to, aby uzyskać PASS.
- Błąd w połowie procesu: sprawdź `runs` przed kolejnym uruchomieniem; część danych mogła już powstać.

Dokumentacja: [sesje Playwright](https://playwright.dev/docs/auth), [panel UI](https://playwright.dev/docs/test-ui-mode), [raporty](https://playwright.dev/docs/test-reporters).

Zbiorcze DELETE ma limit 180 sekund, odczyty kontrolne 30 sekund. Po timeout lub błędzie DELETE narzędzie nie ponawia usuwania, tylko sprawdza brak poszczególnych rekordów. Potwierdzony brak otrzymuje DELETED, a niepewny wynik UNKNOWN i błąd całego uruchomienia. Timeout klienta nie oznacza zatrzymania operacji na serwerze.
