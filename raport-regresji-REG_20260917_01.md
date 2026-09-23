# Raport pierwszego scenariusza Octopus

Data: 2026-09-17. Środowisko: dev, https://octopus.gwodev.pl. Przebieg: REG_20260917_01.
Test wykonany przez interfejs przeglądarki w sesji udostępnionej przez użytkownika. Wersja aplikacji i nazwa roli nieustalone. Nie jest to jeszcze samodzielny skrypt do uruchamiania w CI.

## Wynik

PASS w wykonanym zakresie: utworzenie szkoły i nauczyciela, wyszukiwanie, relacja w obu kartotekach, trwałość edycji i wpisy historii. Użytkownik potwierdził 2026-09-17, że normalizacja wielkości liter jest zamierzona (przykład: BoŻena → Bożena). Wynik zaktualizowano na podstawie wyjaśnienia reguły, bez ponownego wykonania testu. Nie oznacza to zaliczenia całej regresji projektu.

| Etap                           | Wynik                        | Dowód zaobserwowany w UI                                                                                                                                                        |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Utworzenie szkoły              | PASS                         | Szkoła 93033, REG_20260917_01 Szkoła testowa, Szkoła podstawowa, 80-064 Gdańsk 999                                                                                              |
| Wyszukiwanie szkoły po nazwie  | PASS                         | Kryterium REG_20260917_01; Rekordów: 1, ID 93033                                                                                                                                |
| Utworzenie nauczyciela         | PASS                         | Nauczyciel 532276, początkowo Testowy REG_20260917_01, e-mail reg_20260917_01@example.invalid                                                                                   |
| Szkoła w kartotece nauczyciela | PASS                         | Wiersz ze szkołą 93033 i zgodnym adresem                                                                                                                                        |
| Wyszukiwanie nauczyciela po ID | PASS                         | Kryterium 532276; Rekordów: 1, właściwa osoba                                                                                                                                   |
| Edycja imienia — trwałość      | PASS                         | Wpisano TestowyPoEdycji; zapisano Testowypoedycji; zmiana widoczna również w kartotece szkoły po pełnej nawigacji                                                               |
| Edycja — normalizacja nazwiska | PASS po potwierdzeniu reguły | Nazwisko REG_20260917_01 zostało zapisane jako Reg_20260917_01; normalizacja jest zamierzona                                                                                    |
| Historia zmian                 | PASS w sprawdzonym zakresie  | Imię Testowypoedycji i Nazwisko Reg_20260917_01; autor npanek; źródło Edycja danych; czas wyświetlany 2026-09-17 08:10. Widoczne także wpisy utworzenia i Dodana Szkoła z 08:09 |
| Relacja od strony szkoły       | PASS                         | Po ponownym wejściu na adres szkoły: Nauczyciele: 1; jeden wiersz 532276, Reg_20260917_01, Testowypoedycji, Szkoły: 1                                                           |
| Oznaczenie danych testowych    | PASS                         | Oba rekordy oznaczono Testowy; szkoła zachowała zaznaczenie po pełnej nawigacji, nauczyciel po ponownym wyszukaniu                                                              |

## Dane pozostawione do dalszej regresji

- Szkoła: https://octopus.gwodev.pl/school/school-panel/93033
- Nauczyciel: https://octopus.gwodev.pl/teacher/teacher-panel/532276
- Nazwa szkoły: REG_20260917_01 Szkoła testowa.
- Aktualne dane nauczyciela: Testowypoedycji Reg_20260917_01.
- Syntetyczny adres e-mail: reg_20260917_01@example.invalid; nie wysyłano wiadomości.
- Źródło nauczyciela: Karta nauczyciela; zgody Marketing, E-mail, Telefon pozostawiono niezaznaczone.
- Nauczyciela zapisano bez przedmioto-poziomu po zaakceptowaniu ostrzeżenia aplikacji.
- Rekordy pozostawiono, nie wykonywano usuwania ani zawieszania.

## Obserwacja OCT-OBS-001 — edycja zmienia również nieedytowane nazwisko

Kroki reprodukcji:

1. Utworzyć nauczyciela z nazwiskiem REG_20260917_01 i imieniem Testowy.
2. Otworzyć Edycja danych.
3. Zmienić wyłącznie imię na TestowyPoEdycji i zapisać.
4. Wyszukać nauczyciela po ID i otworzyć Historię zmian.

Pierwotne oczekiwanie robocze: zmiana dotyczy imienia; nazwisko pozostaje identyczne. Skorygowano je po wyjaśnieniu użytkownika: zapis może normalizować wielkość liter w imieniu i nazwisku.
Rzeczywistość: imię Testowypoedycji; nazwisko Reg_20260917_01. Historia zawiera oba wpisy zmiany.
Klasyfikacja: ZAMKNIĘTA — zachowanie zamierzone, potwierdzone przez użytkownika 2026-09-17. Przykład wymagania: BoŻena → Bożena. Ten konkretny przykład nie został jeszcze wykonany w UI; dodano go jako NORM-01. Zasad dla nazwisk złożonych, łączników i apostrofów nie należy wywodzić z tego jednego przykładu.

## Dodatkowe ustalenia

- Przy braku e-maila i telefonu zapis nauczyciela jest blokowany komunikatem: „Email lub numer telefonu jest obowiązkowym polem podczas rejestracji rekordu nauczyciela. Proszę uzupełnić wybrane pole.” Pola nie miały gwiazdek w obejrzanym formularzu.
- Brak przedmioto-poziomu wywołuje ostrzeżenie, ale można kontynuować zapis.
- W formularzu adresu samo ustawienie wartości numeru (setValue/fill) nie wystarczyło: aplikacja zgłaszała brak numeru mimo widocznego 999. Po wyczyszczeniu i wpisaniu przez zdarzenia klawiatury zapis przeszedł. To uwaga do automatyzacji, nie potwierdzony błąd użytkowy.
- Widoki aktualizują się asynchronicznie; automatyczne testy muszą czekać na docelowe dane, nie tylko zamknięcie formularza. Pierwszy odczyt po zapisie bywał jeszcze stanem wcześniejszym.
- Przed automatyzacją należy zastąpić dynamiczne ID mat-input stabilnymi selektorami lub semantycznym powiązaniem pól z etykietami. Kilka przycisków ma nazwę Dodaj, więc wymagają ograniczenia do odpowiedniej sekcji.

## Następny krok

Utrwalić ten przebieg jako powtarzalny test z unikalnymi danymi, oczekiwaniem na wynik zapisu i asercją relacji w obu kartotekach. Rozszerzyć o test BoŻena → Bożena, walidację wymaganych danych i anulowanie formularzy.
