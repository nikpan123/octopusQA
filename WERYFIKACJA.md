# Weryfikacja projektu testów

2026-09-17, Octopus dev, Chromium (Playwright 1.63.0).

- `npm.cmd run check`: PASS — kontrola typów TypeScript.
- `node --check scripts/login.mjs`: PASS — składnia skryptu logowania.
- `npm.cmd run test:list`: PASS — wykrywa jeden test całego procesu.
- `npm.cmd run login`: PASS — użytkownik zalogował się, zapisano lokalną sesję.
- `npm.cmd test`: **1 passed**, test 26,5 s, całość 29,0 s.
- Sprawdzono wykluczenie sesji i artefaktów z Git przez `git check-ignore`.

Zaliczony przebieg: `REG_1789626483792_d4f729`. Szczegóły i ID rekordów w `runs/REG_1789626483792_d4f729.json`, raport w `playwright-report/index.html`.

Potwierdzono tworzenie szkoły i nauczyciela, wyszukiwanie, trwałość flag Testowy, relację w obu kartotekach, normalizację BoŻena → Bożena, zachowanie e-maila i zgód oraz wpisy historii.

Podczas przygotowania skryptu wcześniejsze próby zatrzymały się na obsłudze fokusu wyszukiwarki i selektorze tabeli historii. Poprawiono wprowadzanie tekstu (fill oraz zdarzenie keyup) i selektory komórek. Jeden przebieg przerwano po rozpoznaniu nieprawidłowej roli komórki. Są to próby uruchomieniowe automatyzacji, nie zgłoszenia błędów Octopusa. Częściowe dane pozostały na dev; rejestry wszystkich prób znajdują się w `runs`. Brak pola result w rejestrze oznacza przerwany/niedokończony przebieg, nigdy PASS.

Zaliczenie dotyczy jednej ścieżki na jednej sesji użytkownika. Nie zweryfikowano całego katalogu regresji, wszystkich ról ani wszystkich przeglądarek. Test sam nie wykonuje logowania — korzysta z zapisanej sesji. Tryby headed/UI udostępniono w poleceniach, a końcowy przebieg weryfikacyjny wykonano bez widocznego okna.
