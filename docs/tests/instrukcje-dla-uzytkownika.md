# Testy dla osoby, która pierwszy raz otwiera panel

## Nazwa testu i krok w otwartej przeglądarce

Nakładkę możesz przesuwać, przeciągając górny pasek „PODGLĄD TESTU”. Położenie zapisuje się na komputerze i jest odtwarzane w kolejnych testach, nowych kartach i następnych uruchomieniach Octopusa oraz CMS. Na mniejszym ekranie pozostaje w granicach okna. Licznik „TEST 3 Z 12” odnosi się do wybranego zestawu; numer testu nie zmienia się przy ponownej próbie. Gdy testy działają równolegle, każde okno pokazuje numer swojego testu.

W Octopusie zaznacz **Pokaż okno przeglądarki podczas testu**, a w Księgarni CMS **Pokaż okno przeglądarki**. Na stronie pojawi się nakładka podobna do tej w Hurtowni: nazwa testu, aktualny etap oraz wykonywana czynność. Działa po nawigacji i w nowych kartach. Nie blokuje kliknięć ani nie pokazuje argumentów akcji, np. wpisywanych haseł. Dla scenariuszy bez nazwanych etapów pokazuje bieżącą czynność. Podgląd w zwykłym trybie bez okna przeglądarki jest wyłączony.

Nowe testy Octopusa powinny korzystać ze wspólnych fixtures; nowe testy CMS importują `test` z `shared/browser-preview`. Etapy biznesowe nazywaj w `test.step`, np. „Dodanie szkoły” lub „Sprawdzenie braku duplikatu”. Izolowane kontrole nakładki: `npx playwright test --config playwright.preview.config.ts`.

W każdym z czterech paneli dostępny jest przewodnik „Pierwszy raz tutaj?”. Przy przypadkach i zestawach wybierz „Jak wykonać test?”. Otwieranie instrukcji nie zaznacza testu ani go nie uruchamia.

1. Wybierz przypadek i przeczytaj przygotowanie oraz wpływ na dane.
2. Sprawdź środowisko i konto. Zaznacz scenariusz, który chcesz wykonać.
3. Przycisk uruchomienia rozpoczyna automat. Opisane czynności wykona program.
4. Poczekaj na koniec i otwórz raport konkretnego uruchomienia.
5. Sprawdź wynik właściwego przypadku. Pominięty przypadek nie potwierdza poprawki.
6. W Centrum przypnij raport do zgłoszenia albo wybierz „Zapisz wynik ręczny”, jeśli sprawdzenie wykonano ręcznie.

## Standard nowego opisu

Każdy nowy scenariusz powinien wyjaśniać:

- **Cel:** jakie zachowanie sprawdzamy i dlaczego.
- **Przygotowanie:** środowisko, konto, wymagane rekordy i ich identyfikatory.
- **Instrukcja użytkownika:** co kliknąć w panelu i co rozpoczyna wykonanie.
- **Przebieg:** co zrobi automat lub co wykonać ręcznie, w kolejności.
- **Wpływ na dane:** odczyt, zapis, zamówienia, wiadomości; co zostaje po próbie i jak posprzątać.
- **Oczekiwany wynik:** konkretny komunikat, kolejność, wartość lub zapis. Samo „działa poprawnie” nie wystarcza.
- **Dowód:** gdzie pojawi się wynik, co potwierdza i co pozostaje poza zakresem.

W Centrum wymagane pola kroków i oczekiwanego wyniku zawierają instrukcję dla autora. W Hurtowni źródłem szczegółów są katalogi scenariuszy w `docs`. W Octopusie nazwy etapów pochodzą z `test.step`, a w CMS opisy kontroli wynikają z wywołanych asercji i rodzajów widoków. Brak szczegółów jest oznaczany w instrukcji; nie zastępujemy go wymyślonym zachowaniem.

Po dodaniu testów lub zmianie ich opisów odśwież instrukcje poleceniem `node scripts/update-guided-ui.cjs` z projektu Octopus. Skrypt aktualizuje lokalne pliki paneli wszystkich czterech projektów, nie wykonuje testów i nie zmienia historii ani zgłoszeń.
