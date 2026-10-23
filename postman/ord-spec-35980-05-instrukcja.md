# Kopiowanie do tej samej szkoły — Postman

Wersja 2 poprawia kontrolę jednostki: `institutionAllRelationInformation` w zamówieniu nie jest źródłem tożsamości szkoły i po usunięciu relacji może być puste. Nowy krok **00** odczytuje `institutionUnitId` bezpośrednio przez `/api/InstitutionBrowser/GetInstitutions` i ustawia `schoolUnitId`. Wykonuj kroki **00–05**. Dla już utworzonego zamówienia 1022380 nie powtarzaj kroku 02: po imporcie zaktualizowanej kolekcji wpisz `newOrderId=1022380`, wykonaj 00, 01, ponownie ustaw `newOrderId=1022380` (01 czyści tę zmienną), następnie 03, 04 i 05. Pozostaw tę samą szkołę i użytkownika.

Importuj `ord-spec-35980-05.postman_collection.json`. W Variables kolekcji ustaw `bearerToken` (aktualny token Octopusa bez słowa Bearer) i `currentUserId` (ID własnego zalogowanego użytkownika; w raporcie 20415).

Wstępnie wpisana szkoła z raportu: `schoolId=94822`, jednostka tej samej szkoły: `schoolUnitId=42318`. Nazwa: `AUTO_STR_DEV_COPY_SPEC35980_SP_ZS_RUN_c55d7eec3643_W0`. Możesz użyć własnej szkoły testowej, ale wtedy zmień oba ID. `institutionId` to ID szkoły, natomiast `institutionUnitIdsCopyTo` przyjmuje ID jednostki — te liczby są różne. Szkoła LO 94823 była elementem przygotowania automatu, lecz nie jest odbiorcą tej próby i nie jest potrzebna w kolekcji.

Uruchom kolekcję w Runnerze: kroki 01–05, **jedna iteracja**. Pozostaw kontynuowanie po błędzie asercji włączone, aby wykonał się odczyt 05 po niezaliczonym 04. Możesz też wysyłać żądania ręcznie w tej kolejności.

1. Odczyt dokumentów szkoły.
2. Utworzenie nowego zamówienia: F7P (ID produktu 3005), 3 sztuki; 4P-2 (ID 4707), 2 sztuki. ID odpowiedzi zapisuje się jako `newOrderId`.
3. Sprawdzenie oryginału, produktów i jednostki oraz zapamiętanie stanu przed kopiowaniem.
4. POST `/api/SchoolOrder/MakeSchoolOrderCopy`, z `institutionOrderId={{newOrderId}}`, `institutionUnitIdsCopyTo=[42318]` i własnym `createdBy`. Cel jest tą samą szkołą co źródło.
5. Porównanie pełnej listy dokumentów przed i po operacji.

Oczekiwanie: API odrzuca operację i dokumenty pozostają bez zmian. 401/403 oznacza problem dostępu; błąd 500 nie potwierdza poprawnej walidacji.

W raporcie `d7083f0f-a619-4505-a467-14af5ff6689e` odpowiedź miała HTTP 200 i treść `{"description":"Stworzono kopię zamówienia","codeResult":204}`, a dokumenty pozostały bez zmian. Odtworzenie tego zachowania oznacza FAIL w 04 i PASS w 05: nieprawidłowy komunikat sukcesu, bez dowodu utworzenia duplikatu. Jeżeli 05 też zgłosi zmianę, sprawdź różnice dokumentów i zmienną `addedOrderIds`.

Zamówienie 1022378 z raportu zostało usunięte przez automat. Kolekcja tworzy nowe; nie korzysta ze starego ID. Nie wymaga zmiany daty w bazie ani potwierdzenia nauczyciela — to test kopiowania, a nie gratisów.

Po wykonaniu sprawdź dane w [szkole na DEV](https://octopus.gwodev.pl/school/school-panel/94822). Nowe ID znajdziesz w Variables kolekcji i konsoli Postmana. Dokumenty pozostają do obejrzenia; po kontroli usuń własny nowy oryginał oraz ewentualne nowe kopie. Kolekcja niczego automatycznie nie usuwa. Nie ponawiaj kroku 02 bez sprawdzenia listy dokumentów, jeżeli odpowiedź utworzenia była niejednoznaczna.

Kolekcję przygotowano na podstawie zapisanego raportu; nie uruchomiono jej na DEV. Token nie jest dołączony. Nie udostępniaj eksportu po wpisaniu tokenu.
