# Aktualizacja Octopus Test Runner UI — Dane testowe

## Pliki do podmiany

Skopiuj do istniejącego projektu:

```text
scripts/test-ui-server.mjs
test-ui/app.js
test-ui/index.html
test-ui/styles.css
TEST-UI.md
```

## Wymagany istniejący plik

Funkcja usuwania nauczycieli używa istniejącego mechanizmu:

```text
scripts/cleanup-teachers.mjs
```

Nie trzeba go podmieniać w ramach tej aktualizacji.

## Po podmianie

```powershell
Ctrl+C
npm run test-ui
```

W Chrome:

```text
Ctrl+F5
```

## Nowa sekcja

Panel zawiera teraz kartę **Dane testowe**:

- Nauczyciele — podgląd, otwieranie w Octopusie, pojedyncze i zbiorcze usuwanie DEV.
- Szkoły — podgląd i otwieranie w Octopusie; bez usuwania.

Dane są odczytywane z lokalnych rejestrów `runs/REG_*.json`.

Usunięcie nauczyciela nie omija zabezpieczeń cleanupu. UI uruchamia istniejący `cleanup-teachers.mjs`, który ponownie sprawdza rekord przed DELETE.
