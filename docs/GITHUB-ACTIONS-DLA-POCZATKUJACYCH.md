# GitHub Actions — instrukcja dla początkujących

## Co to jest?

GitHub Actions to automat uruchamiany przy repozytorium na GitHubie. W tym projekcie służy do sprawdzania zmian i uruchamiania testów. Można go traktować jak dodatkowego kontrolera: po wysłaniu zmian sprawdza, czy projekt nadal spełnia ustalone zasady.

Pracuje na osobnym, tymczasowym komputerze GitHuba. Nie zajmuje okna terminala na Twoim komputerze i nie jest tym samym co lokalny panel Octopus Test Runner.

Krótki słownik:

- **Repozytorium** — miejsce przechowywania kodu i jego historii.
- **Commit** — zapis konkretnego zestawu zmian w historii projektu.
- **Push** — wysłanie zapisanych zmian z komputera do GitHuba.
- **Gałąź (branch)** — osobna linia pracy nad projektem, np. `main` lub `fixes`.
- **Pull request** — propozycja połączenia zmian z inną gałęzią, umożliwiająca ich przegląd.
- **Workflow** — zapisany przepis dla automatu, np. `Quality`.
- **Job** — zadanie w tym przepisie, np. `quality`.
- **Step** — pojedynczy krok zadania, np. instalacja zależności.
- **Log** — tekstowy zapis tego, co automat wykonał i gdzie napotkał problem.

## Dwa procesy w naszym projekcie

| Proces      | Kiedy się uruchamia?                                              | Co sprawdza?                                                         | Czy działa na rzeczywistym DEV?                    |
| ----------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| **Quality** | Automatycznie dla pull requestów i po pushu do `main` lub `fixes` | Jakość kodu projektu testowego, dokumentację i mechanizmy pomocnicze | Nie uruchamia regresji DEV i nie tworzy tam danych |
| **E2E DEV** | Ręcznie z zakładki Actions                                        | Scenariusze rzeczywistej aplikacji Octopus                           | Tak; może tworzyć i zmieniać dane testowe          |

Konfiguracja tych procesów jest zapisana w [quality.yml](../.github/workflows/quality.yml) i [e2e-dev.yml](../.github/workflows/e2e-dev.yml). Ten dokument opisuje obecną konfigurację, nie wszystkie możliwości GitHub Actions.

## Quality — co dzieje się krok po kroku?

1. Wysyłasz zmiany do `main` lub `fixes` albo otwierasz/aktualizujesz pull request.
2. GitHub uruchamia zadanie na komputerze z Linuxem. Limit czasu tego zadania wynosi 15 minut.
3. **Checkout** pobiera kod sprawdzanej wersji projektu.
4. **Node.js** przygotowuje środowisko potrzebne do wykonania narzędzi i testów.
5. **Install dependencies** instaluje zależności zgodnie z zapisanym plikiem wersji (`npm ci`).
6. **Static quality checks** wykonuje `npm run quality`. Sprawdzenia idą kolejno; niepowodzenie jednego zatrzymuje dalsze sprawdzenia tego polecenia.
7. **Unit tests** instaluje przeglądarkę Chromium oraz potrzebne biblioteki i wykonuje `npm run test:unit`.
8. GitHub zapisuje wynik oraz logi całego uruchomienia. Może pokazać też końcowe kroki `Post Node.js` i `Post Checkout` — to porządkowanie środowiska, nie dodatkowe testy Octopusa.

### Co obejmuje Static quality checks?

- **Poprawność typów** — czy kod TypeScript nie zawiera niezgodności typów danych.
- **Kontrola kodu** — czy kod przestrzega reguł projektu, np. nie ma nieużywanych zmiennych lub niebezpiecznych konstrukcji.
- **Formatowanie** — czy zapis kodu i dokumentów jest zgodny ze wspólnym formatem. Kontrola tylko sprawdza; nie poprawia plików automatycznie.
- **Aktualność indeksu scenariuszy** — czy lista testów w dokumentacji odpowiada aktualnemu kodowi, jego nazwom i lokalizacjom.

### Co obejmują Unit tests?

Sprawdzają pomocnicze mechanizmy projektu: obsługę sesji, zabezpieczenia sprzątania danych testowych, rozpoznawanie błędów oraz listowanie i wybieranie testów w panelu.

Część uruchamia izolowaną przeglądarkę. Jej żądania są przechwytywane i odpowiedzi symulowane, więc nie loguje się do rzeczywistego DEV i nie usuwa tam danych. Instalowanie narzędzi może korzystać z internetu; „brak kontaktu z DEV” nie oznacza braku jakichkolwiek połączeń sieciowych.

## Co oznacza wynik?

- **Żółty / In progress / Queued** — proces trwa albo czeka na wykonanie.
- **Zielony / Success** — wszystkie wymagane kroki tego uruchomienia zakończyły się poprawnie.
- **Czerwony / Failure** — co najmniej jeden krok nie przeszedł. Trzeba otworzyć jego log.
- **Skipped / Cancelled** — krok lub uruchomienie zostało pominięte albo anulowane. Nie jest to potwierdzenie poprawności testów.

Quality anuluje poprzednie, nadal trwające uruchomienie dla tej samej gałęzi/referencji, gdy pojawia się nowsze. Takie anulowanie może być normalnym skutkiem wysłania kolejnych zmian, a nie błędem projektu.

Najważniejsza zasada: **zielone Quality oznacza, że projekt testowy przeszedł swoje kontrole. Nie oznacza, że wszystkie funkcjonalności Octopusa działają poprawnie.** Quality nie uruchamia całego zestawu testów biznesowych na DEV i nie wdraża aplikacji.

## Jak przeczytać błąd w Actions?

1. Otwórz repozytorium na GitHubie i przejdź do **Actions**.
2. Wybierz konkretne uruchomienie, np. z opisem „Rozszerzono testy struktury i UI”. To opis sprawdzanych zmian, nie treść błędu.
3. Otwórz zadanie `quality`.
4. Znajdź pierwszy krok z czerwonym oznaczeniem i rozwiń jego log.
5. Szukaj konkretnego komunikatu nad końcowym `Process completed with exit code 1`.
6. Zanotuj nazwę kroku, plik, numer linii i treść problemu. Możesz przekazać je osobie pracującej nad projektem.

Sam komunikat `exit code 1` oznacza tylko niepowodzenie polecenia. Przyczyna znajduje się wcześniej. Jeżeli nie przeszły kontrole jakości, następny krok Unit tests może nie zostać wykonany — to nie jest jeszcze wynik samych testów jednostkowych.

### Przykład: nieaktualny indeks scenariuszy

Komunikat:

```text
Indeks scenariuszy jest nieaktualny. Uruchom: npm run docs:scenarios
```

Oznacza, że kod testów i zapisana lista w dokumentacji różnią się. Przyczyną mogą być nowe testy, zmiana nazwy lub nawet przesunięcie linii w pliku. Nie oznacza awarii Octopusa.

Osoba aktualizująca projekt powinna w katalogu projektu wykonać:

```powershell
npm run docs:scenarios
npm run quality
```

Następnie zapisać do historii projektu również zmieniony `docs/tests/scenario-index.md` i wysłać zmiany do GitHuba. Samo poprawienie pliku na komputerze nie aktualizuje wersji sprawdzanej przez Actions.

### Pozostałe typowe sytuacje

- Błąd typów lub kontroli kodu: trzeba poprawić wskazany fragment, a nie usuwać kontrolę.
- Błąd formatowania: można zastosować projektowy formatter (`npm run format`), przejrzeć zmiany i ponownie sprawdzić Quality.
- Błąd Unit tests: trzeba przeczytać nazwę testu i niespełniony warunek. Może dotyczyć naszego narzędzia testowego, nie aplikacji Octopus.
- Problem pobierania zależności: sprawdzić log instalacji; ponowienie ma sens przy awarii przejściowej. Ponawianie nie naprawi stałego błędu kodu.

## E2E DEV — czym różni się od Quality?

Ten proces uruchamia się ręcznie. Wykonuje najpierw kontrolę jakości, a potem regresję DEV przez `npm test`. Można wybrać 1, 2 lub 4 workery, czyli równolegle pracujące procesy testowe.

Wymaga skonfigurowanych sekretów dostępu do GitLaba i Octopusa. Sekrety to poufne wartości przechowywane w ustawieniach repozytorium; nie należy wpisywać haseł do kodu ani dokumentacji.

W odróżnieniu od Quality te testy naprawdę mogą utworzyć szkoły, relacje, zamówienia lub inne dane. Sprzątanie zależy od konkretnego scenariusza. Końcowy dodatkowy cleanup dotyczy zweryfikowanych nauczycieli testowych, nie wszystkich możliwych rekordów. Szkoły testowe mogą pozostać zgodnie z zasadami projektu.

Po przebiegu proces próbuje zachować raporty HTML, ślady wykonania i rejestry diagnostyczne jako pliki do pobrania w Actions. Ich skonfigurowany czas przechowywania wynosi 14 dni. Pliki nie zastępują sprawdzenia logu nieudanego kroku.

Także zielona regresja wymaga ostrożnej interpretacji: scenariusze `test.fail` mogą być oczekiwanymi porażkami, a pominięte przypadki nie zostały przetestowane. Wynik nie jest procentem pokrycia całego produktu.

## A gdzie jest lokalny panel?

**Octopus Test Runner** działa na Twoim komputerze, domyślnie pod [http://127.0.0.1:4173](http://127.0.0.1:4173). Służy do wygodnego wyboru środowiska, pakietu i pojedynczych testów. Nie jest stroną GitHub Actions.

Jeżeli panel już działa, wystarczy otworzyć jego adres. Nie uruchamiaj drugiej kopii na tym samym porcie. Błąd `EADDRINUSE ... 127.0.0.1:4173` oznacza zajęty port, nie awarię testów. Szczegóły uruchamiania i tego komunikatu są w [instrukcji panelu](../TEST-UI.md).

## Gdzie sprawdzać konfigurację?

- [Quality](../.github/workflows/quality.yml) — warunki uruchomienia i wykonywane kroki kontroli.
- [E2E DEV](../.github/workflows/e2e-dev.yml) — ręczna regresja rzeczywistej aplikacji.
- [package.json](../package.json) — co wykonują polecenia `quality` i `test:unit`.
- [Dokumentacja testów](tests/README.md) — jakie obszary są objęte scenariuszami.
- [Panel Test Runner](../TEST-UI.md) — lokalne uruchamianie testów.
