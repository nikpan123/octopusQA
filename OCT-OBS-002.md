# OCT-OBS-002: komunikat o braku wyników znika przy czyszczeniu wybranego rekordu

> Dokument konkretnej obserwacji z wcześniejszego przebiegu. Aktualny zakres automatyzacji i sposób diagnostyki opisuje [README.md](README.md).

Status: obserwacja ograniczona do ścieżki rozpoczętej bezpośrednim adresem kartoteki z ID. Nie należy uogólniać jej na każde wyszukiwanie. Aktualizacja diagnostyki: 2026-09-17.

## Uściślenie po analizie testów

Zrzut użytkownika potwierdził poprawne wyświetlenie komunikatu z przyciskiem OK i licznikiem 0. Diagnostyka wykazała różnicę między otwarciem panelu, a wejściem bezpośrednim adresem `/school/school-panel/93056` (analogicznie dla nauczyciela).

W kodzie modułu szkół pobranego z dev wybór znalezionego rekordu zmienia adres przez `location.go`, natomiast brak wyników wywołuje `router.navigate` do panelu bez ID. Po wejściu bezpośrednim adresem z ID ta druga operacja zmienia trasę routera i ponownie inicjalizuje panel. W śladzie diagnostycznym właśnie wtedy znikał komunikat. Sam selektor `mat-dialog-container` poprawnie identyfikuje okno; zmiana selektora nie rozwiązuje problemu nawigacji.

Poprawiono przygotowanie głównych scenariuszy regresji: pierwsze wyszukiwanie rozpoczyna się w panelu bez ID i wybiera rekord przez wyniki, a formularz musi być widoczny i mieć ustawiony fokus przed wpisywaniem. Drugie wyszukiwanie w FIND-04 odbywa się bez ponownego otwarcia panelu — wcześniejsze wyniki pozostają obecne, więc nadal sprawdzamy ich usunięcie. Asercje widocznego komunikatu, kliknięcia OK i pustej listy zostały zachowane.

Nie naprawiano kodu aplikacji. Zachowanie po wejściu bezpośrednim linkiem pozostaje osobną obserwacją, poza podstawową ścieżką FIND-04. Poniżej zachowano wcześniejsze dowody dla tej ścieżki.

## Odtworzenie

1. W panelu szkół wyszukać i otworzyć istniejącą szkołę, np. testową 93056.
2. Z tej kartoteki otworzyć Szukaj.
3. Wpisać nieistniejącą nazwę, np. ABSENT_REG_1789628206617_be7b91.
4. Uruchomić wyszukiwanie i obserwować panel oraz komunikat.

Analogiczny przypadek automatyczny dla nauczycieli zaczyna od znalezienia nauczyciela po ID, a następnie szuka nieistniejącego e-maila.

Oczekiwane: czytelny komunikat „Brak wyników wyszukiwania”, możliwy do zamknięcia przyciskiem OK, oraz pusta lista zamiast poprzednich wyników.

Zaobserwowane w końcowym przebiegu:

- Nauczyciele: test nie znalazł widocznego komunikatu w ciągu 20 sekund po wyszukiwaniu. Ślad sieci potwierdza zapytanie z nieistniejącym e-mailem i odpowiedź HTTP 200. Końcowy ekran jest pustym panelem bez ID w adresie.
- Szkoły: test zobaczył komunikat, lecz zniknął on przed kliknięciem OK. Końcowy ekran jest pustym panelem bez ID w adresie.
- Niezależne sprawdzenie w przeglądarce, poza skryptem testowym: po wyszukaniu nieistniejącej nazwy z kartoteki 93056 aplikacja przeszła na `/school/school-panel`, wyczyściła listę i nie pozostawiła komunikatu.

W poprzednim przebiegu obie ścieżki przeszły: test zdążył zamknąć komunikat. To zachowanie zależne od czasu; nie jest to dowód pozostawiania starych danych w końcowej liście. Końcowe zrzuty pokazują puste panele. Nie zmieniono asercji tylko po to, żeby uzyskać PASS.

## Dane i dowody

- Nauczyciel 532288, szkoła 93055: przebieg `REG_1789628154535_0dba66`.
- Szkoła 93056: przebieg `REG_1789628206617_be7b91`.
- Raport HTML: `npm.cmd run report`; dwa przypadki z tagiem `@search`.
- W raporcie dostępne są zrzuty i ślady Playwright. Lokalnych plików sesji ani trace.zip nie dołączać do publicznego zgłoszenia bez sprawdzenia zawartości.

Do sprawdzenia przez zespół aplikacji: czy przejście z adresu kartoteki z ID do pustego panelu automatycznie zamyka nowo otwarty dialog. Jest to hipoteza na podstawie obserwowanej nawigacji, nie potwierdzona przyczyna.
