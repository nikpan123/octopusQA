# Jak opisywać scenariusze Octopusa

Opis w katalogu służy także do samodzielnego sprawdzenia na stronie przez osobę, która nie zna kodu testów.

1. **Co sprawdzamy**: jedno zdanie o zachowaniu aplikacji i badanym warunku. Nie zaczynaj od nazwy pliku ani endpointu.
2. **Zanim zaczniesz**: środowisko, potrzebne konto, liczba szkół i nauczycieli, ich powiązania, flagi Testowy, poprzednie potwierdzenia, zamówienia i okres promocji. Wskaż, czy dane muszą być nowe i puste.
3. **Dane do przygotowania**: przedmiot, klasa, seria, rok szkolny, kod produktu, ilość i data. Używaj konkretnych wartości. Jeśli ilość zależy od progu T, wyjaśnij dokładnie, gdzie odczytać T.
4. **Jak wykonać sprawdzenie**: podaj ścieżkę w aplikacji, nazwę przycisku, wpisywaną wartość, zapis i wynik po danej czynności. „Edytuj formularz” zastąp np. „Na karcie nauczyciela wybierz Kluby, zaznacz formularz i kliknij Edytuj; odznacz 4, zaznacz 5 i zapisz bez wysyłania maila”.
5. **Co powinno się wydarzyć**: wymień widoczne pozycje, klasy, ilości, blokady i dokładne komunikaty. Pustą listę odróżniaj od zablokowanego wpisu.

Zmiany w bazie, wywołania API, eksport i synchronizację opisuj jako oddzielną część wymagającą QA lub administratora. Nie sugeruj, że tę samą kontrolę da się zastąpić kliknięciem, jeśli na stronie nie ma odpowiedniej operacji. Przy częściowym pokryciu powiedz, czego bieżący test nie potwierdza.

Skróty wyjaśniaj przy danych. ZS oznacza zespół szkół, SP szkołę podstawową, LO liceum, TECH technikum. Gdy użytkownik ma wrócić do dokumentu, każ zapisać jego ID lub symbol.

Nazwy kroków automatu i powiązania z raportami są danymi technicznymi. `steps` w katalogu zawiera instrukcje dla człowieka; `stepLinks.titles` zachowuje faktyczne nazwy etapów automatu. Nie zmieniaj powiązania kroku tylko po to, aby uzyskać zielony znacznik.

## Odświeżanie opisów

590 przypadków gratisowych generuje `scripts/build-confirmation-scenarios.mjs`; instrukcje ręczne pochodzą z `scripts/manual-scenario-text.mjs`. Zwykłe uruchomienie generatora zachowuje opisy edytowane w panelu. Użycie `--refresh` świadomie je odtwarza.

Po odtworzeniu pakietu gratisowego uruchom `node scripts/rewrite-manual-scenarios.mjs`, aby odtworzyć przygotowane opisy pozostałych katalogowych scenariuszy i zestawów zbiorczych. Ten skrypt również zastępuje opisy; nie uruchamiaj go jako automatycznej operacji przy otwieraniu panelu.

Przed dostarczeniem zmiany sprawdź lokalnie poprawność opisów i powiązań (`scripts/manual-scenarios.test.mjs`) oraz działanie katalogu. Kontrola treści nie oznacza wykonania testów biznesowych na DEV.
