# Redmine #37204 — filtrowanie po medalu „Brak”

Zgłoszenie: https://redmine.gwo.pl/issues/37204. Projekt: Octopus, wyszukiwarka szkół. Na zrzucie zgłoszenia status „Do testów na developie”. Opis wskazuje szkołę **94435**; drugi zrzut pokazuje pusty wynik przy innym otwartym profilu i sam nie potwierdza danych szkoły 94435.

## Cel i warunki

Szkoła z medalem „Brak” powinna być zwracana przez filtr „Brak”, również przy połączeniu „Brak lub Złoto”. Wielokrotny wybór medali oznacza OR. Nazwa i miejscowość ograniczają wyszukiwanie niezależnie od medalu.

Od 21.10.2026 testy `tests/szkola-redmine-37204.spec.ts` korzystają ze szkoły testowej przygotowanej na wybranym środowisku przez wspólne fixture. Brakująca szkoła jest tworzona i oznaczana jako Testowy. Właściwe kroki odczytują dane, nie zmieniają medalu ani nie uruchamiają rocznego przeliczania. Przed każdym scenariuszem:

1. Otwierają profil przygotowanej szkoły i sprawdzają jej aktualne ID.
2. Pobierają aktualną nazwę i miejscowość z odpowiedzi API profilu.
3. Potwierdzają „Brak” w API oraz w polu Medal na profilu.
4. Wykonują wyszukiwanie po nazwie i miejscowości bez medalu; szkoła musi być znaleziona.

Jeżeli medal przygotowanej szkoły nie jest równy Brak, test przerywa sprawdzanie na warunku wstępnym. Regresja sprawdza regułę filtrowania na obu środowiskach; nie jest już uzależniona od istnienia oryginalnego rekordu 94435 ze zgłoszenia.

## Scenariusze

| ID | Kroki po sprawdzeniu warunków | Wynik oczekiwany |
| --- | --- | --- |
| MED-BUG-37204-01 | Nazwa i miejscowość szkoły, Medal = Brak, wyszukaj | ID przygotowanej szkoły w odpowiedzi API i tabeli UI; wszystkie wyniki z medalem Brak |
| MED-BUG-37204-02 | Te same kryteria, Medal = Brak oraz Złoto | ID przygotowanej szkoły w wynikach; API wysyła dwie opcje, wyniki wyłącznie Brak/Złoto |
| MED-BUG-37204-03 | Te same kryteria, Medal = Złoto | Brak ID przygotowanej szkoły; pozostałe wyniki mają medal Złoto; przy pustej liście komunikat i pusta tabela |
| MED-BUG-37204-04 | Te same kryteria, wybierz Złoto, kliknij wyczyszczenie medalu, wyszukaj | Brak ograniczenia medalu w zapytaniu; ID przygotowanej szkoły znów w API oraz tabeli |

Formularz przed wyszukiwaniem czyści zapamiętane kryteria. Testy sprawdzają, że zapytanie nie ogranicza wyników identyfikatorem szkoły — rzeczywista reprodukcja odbywa się po nazwie i miejscowości. Nie oznaczamy błędów jako oczekiwane (`test.fail`).

## Dowody i uruchamianie

Każdy scenariusz dołącza do raportu Playwright zrzut ekranu i `37204-wyniki.json`: dane kontrolne szkoły, wynik bez medalu, faktyczny filtr oraz pary ID–medal zwrócone przez API. Załączniki zapisują się także przy nieudanej asercji. Zrzuty ze zgłoszenia dokumentują wcześniejszy objaw, a dowodem aktualnego sprawdzenia jest dopiero raport wykonania.

W panelu Octopusa: DEV lub TEST, jeden worker, filtr `@redmine-37204`, bez zaznaczonych innych testów. W Centrum testów zgłoszenie ma typ „Błąd” i powiązanie z czterema powyższymi scenariuszami. Wynik uruchomienia zostaje przypięty do karty wraz z informacją o zakresie i wersji środowiska. Numer wdrożenia DEV nie jest znany, więc nie zastępujemy go datą jako numerem wersji.

Zakres nie obejmuje zmiany medalu, masowych wyników/stronicowania, innych poziomów medalowości ani poprawności rocznego naliczania.

## Wynik wykonania — 19.10.2026

DEV, jeden worker, wyłącznie filtr `@redmine-37204`: **4 PASS, 0 FAIL, 0 SKIP**, czas około 49 sekund. Szkoła 94435 ma aktualnie nazwę `AUTO_SFLT_DEV_V1_A`, miejscowość Poznań i medal Brak; odczyt potwierdzono przed każdym testem. Wynik bez medalu, dla Brak, OR Brak/Złoto i po wyczyszczeniu filtra zawierał ID 94435. Filtr Złoto zwrócił pustą listę i poprawny komunikat.

Aktualnego błędu nie odtworzono w tym zakresie. Wynik dotyczy stanu DEV z dnia wykonania, bez znanego numeru wdrożenia. Nie zmieniono statusu zgłoszenia w Redmine.

[Raport Playwright ze zrzutami i JSON](http://127.0.0.1:4173/report/78ad0a1d-4ba5-4b32-9b2a-4746fc3f503b/). Raport przypięto do [karty w Centrum testów](http://127.0.0.1:4180/#issues/6408e58d-65fb-48c3-a228-174b9d3e629f). Linki działają na tym komputerze.

## Weryfikacja przenośności — 21.10.2026

TEST, jeden worker: **4 PASS, 0 FAIL, 0 SKIP**, 58,4 s. Przebieg używa szkoły przygotowanej na TEST, bez zależności od ID 94435. Wynik potwierdza warianty Brak, OR Brak/Złoto, wykluczenie przez Złoto i wyczyszczenie filtra.
