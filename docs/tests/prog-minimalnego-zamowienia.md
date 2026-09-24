# Próg minimalnego zamówienia (cyfrowy vs wysyłka)

Źródło: „Scenariusze testowe – Minimalne zamówienie (próg cyfrowy vs wysyłka)”, Nikodem, 24.09.2026 — 60 scenariuszy Given/When/Then dla nowego mechanizmu progu minimalnego zamówienia (przedszkola, NPC, szkoły podstawowe; szkoły średnie zostają w BOK/CC).

**Status ogólny: częściowo zaimplementowane.** Zaimplementowana i uruchomiona (jako 27 testów jednostkowych `node:test`) jest czysta logika wzoru — 24 z 60 scenariuszy dokumentu, plus dodatkowe testy właściwości i walidacji (patrz niżej), które nie odpowiadają jednemu konkretnemu ID z dokumentu, ale zwiększają pewność co do poprawności reimplementacji. **Dodatkowo, 24.09.2026, dopisano jeden prawdziwy test E2E** (`tests/prog-minimalnego-zamowienia.spec.ts`) dla jedynego scenariusza, dla którego mamy potwierdzony realny endpoint (TC-SP-01, patrz niżej) — to pierwszy test w tym obszarze, który faktycznie tworzy dane w Octopusie i odpytuje prawdziwe API, a nie tylko czystą funkcję. Pozostałe 36 scenariuszy z dokumentu nadal wymaga informacji, których nie ma w tym repozytorium (patrz „Braki blokujące” niżej) — pisanie ich teraz oznaczałoby zgadywanie nazw endpointów, selektorów UI i pól bazy danych, których nikt nie potwierdził.

## Trzy warstwy testów w tym obszarze

1. **Testy jednostkowe formuły** (`scripts/prog-minimalnego-zamowienia.test.mjs`, 27 testów `node:test`) — testują WYŁĄCZNIE referencyjną reimplementację wzoru, w izolacji, bez żadnego wywołania sieciowego. Najszybsza i najtańsza warstwa; łapie regresje logiki, ale nie dowodzi, że prawdziwy Octopus liczy próg tak samo.
2. **Test E2E dla potwierdzonego punktu danych** (`tests/prog-minimalnego-zamowienia.spec.ts`, 1 test, `@school @threshold`) — jedyny test w tym obszarze, który tworzy prawdziwą szkołę przez UI i sprawdza prawdziwe API. Pokrywa TC-SP-01 jako rzeczywisty dowód, nie tylko założenie.
3. **36 zablokowanych scenariuszy** — patrz sekcja „Braki blokujące” niżej.

## Warstwa 1: testy jednostkowe formuły

`scripts/prog-minimalnego-zamowienia.mjs` — referencyjna reimplementacja wzoru z dokumentu (nie import z prawdziwego backendu Octopusa — to osobne repozytorium testów E2E, bez dostępu do kodu aplikacji). Uruchamiana jako:

```text
npm run test:prog-minimalny
```

`scripts/prog-minimalnego-zamowienia.test.mjs` — 27 testów `node:test` (19 pierwotnych + 8 dopisanych 24.09.2026), wszystkie **uruchomione i przechodzące** (nie dotykają aplikacji, więc nie łamią zasady „nie testuj”):

| ID dokumentu | Pokryte? | Uwaga |
| --- | --- | --- |
| TC-SP-01 | ✅ | |
| TC-SP-02 | ✅ | parametryzowane: 20, 60, 100, 140 |
| TC-SP-03 | ✅ | |
| TC-SP-04 | ✅ | |
| TC-SP-05 | ✅ | |
| TC-SP-06 | ✅ | |
| TC-SP-07 | ✅ | parametryzowane: 53, 60, 67 |
| TC-SP-08 | ✅ [DO POTWIERDZENIA] | koduje domyślną interpretację dokumentu (9 wiążące) |
| TC-SP-09 | ✅ | |
| TC-SP-11 | ✅ | logika domyślnej wartości nie wymaga API |
| TC-SP-12 | ✅ [DO POTWIERDZENIA] | koduje interpretację "0 traktowane jak null → 10" |
| TC-SP-15 | ✅ | |
| TC-PN-01..05 | ✅ (5 scenariuszy) | w tym kontrast z regułą SP (TC-PN-05) |
| Szkoła średnia (założenie) | ✅ (dodatkowy test) | dokumentuje założenie `calculateThreshold("SREDNIA", ...) === null`, nie jest to potwierdzone API |
| Walidacja błędnych argumentów (dodatkowe, 24.09.2026) | ✅ (3 testy) | ujemna/niecałkowita/zerowa liczba uczniów, nieznany rodzaj placówki, nieznana forma progu, wielkość liter — wszystko poza kontraktem funkcji rzuca błąd zamiast zwracać cichy zły wynik |
| Właściwości ogólne, przegląd 1–300 uczniów (dodatkowe, 24.09.2026) | ✅ (4 testy) | niezmienniki: wysyłka SP ≥ cyfrowy SP; cyfrowy SP ≥ 1 i wysyłka SP ≥ 5; próg procentowy SP niemalejący wraz z liczbą uczniów; PRZEDSZKOLE/NPC zawsze = 10 — łapią regresje, których pojedyncze przykłady z dokumentu mogłyby nie wychwycić |
| Kontrakt eksportów `SCHOOL_KINDS`/`ORDER_FORMS` (dodatkowe, 24.09.2026) | ✅ (1 test) | strażnik przed przypadkową zmianą/przeliterowaniem dozwolonych wartości |

Błąd zmiennoprzecinkowy z uwagi w dokumencie (przypadki 20/60/100/140) jest jawnie zaadresowany: wzór policzony jest jako `floor((6n + 40) / 80)` na liczbach całkowitych zamiast `round((n/8) * 0.6)`, więc nie ma ryzyka błędu reprezentacji `0.6` w pobliżu granicy `x,5`.

## Warstwa 2: test E2E dla potwierdzonego punktu danych (24.09.2026)

`tests/prog-minimalnego-zamowienia.spec.ts` — 1 test Playwright, tagi `@school @threshold`. W odróżnieniu od warstwy 1 (czysta funkcja w izolacji), ten test:

1. Tworzy prawdziwą szkołę SP przez UI (`prepareCompleteSchoolAdd` + `fillSchoolAddTextField(form, "Liczba uczniów", "750")` — dokładnie ten sam, już wcześniej potwierdzony mechanizm co istniejący test `SCH-32` w `tests/szkola-dodawanie.spec.ts`).
2. Otwiera panel szkoły (`app.openPanel("school", schoolId)`) i przechwytuje prawdziwą odpowiedź `GET /api/InstitutionBrowser/GetInstitutions` — dokładnie ten sam wzorzec co istniejący `getSchoolMedalApiData()` w `tests/support/school-medal.ts`.
3. Sprawdza, że zwrócone pole `threshold` jest równe wynikowi referencyjnej funkcji `calculateThreshold("SP", "CYFROWY", 750)` (=56) z `scripts/prog-minimalnego-zamowienia.mjs`, użytej tu jako „oracle”.

To pokrywa TC-SP-01 jako **rzeczywisty dowód działania mechanizmu w Octopusie**, nie tylko test czystej reimplementacji wzoru. Nie ma tu żadnego zgadywania — obie użyte techniki (zapis „Liczba uczniów”, przechwycenie GetInstitutions) są ponownym użyciem już istniejących, przechodzących testów w tym repozytorium.

Świadomie NIE dodano analogicznego testu E2E dla TC-SP-14 (rozróżnienie progu cyfrowego od wysyłkowego) — dla n=750 obie wartości wychodzą sobie równe (56), więc ten jeden potwierdzony punkt danych nie rozstrzyga, którą z dwóch wartości reprezentuje pojedyncze pole `threshold` z API. Napisanie takiego testu teraz oznaczałoby zgadywanie; wymaga drugiego Network capture dla liczby uczniów, przy której cyfrowy i wysyłka się różnią (patrz punkt 1 w sekcji niżej).

Szkoła utworzona w tym teście nie jest usuwana (Octopus nie ma potwierdzonego endpointu DELETE dla szkół) — dokładnie tak samo jak pozostałe testy w `szkola-dodawanie.spec.ts`; jest rejestrowana ze statusem `KEPT_NO_DELETE_ENDPOINT`.

## Braki blokujące pozostałe 36 scenariuszy

Żaden z poniższych elementów nie istnieje (lub nie został znaleziony) gdziekolwiek w repozytorium `octopusQA`:

1. **Endpoint zwracający próg** — ✅ **CZĘŚCIOWO POTWIERDZONE** (24.09.2026, realny Network capture): `GET /api/InstitutionBrowser/GetInstitutions?filterModel={"institutionIds":[id],"page":1,"limit":1}` faktycznie zwraca wypełnione pole `threshold` w środowisku dev. Dla szkoły SP z `quantityOfStudents: 750` odpowiedź zawiera `"threshold": 56` — dokładnie tyle, ile przewiduje wzór z tego dokumentu i referencyjna implementacja (`calculateThreshold("SP", "CYFROWY"|"WYSYLKA", 750) === 56`). To pierwsze realne, pozytywne potwierdzenie, że mechanizm progu jest wdrożony i liczy się zgodnie z oczekiwaniami.
   - **Nadal nierozstrzygnięte:** dla n=750 próg cyfrowy i wysyłkowy wychodzą sobie równe (oba 56), więc ten jeden punkt danych NIE rozróżnia, czy pole `threshold` reprezentuje jedną wspólną wartość, czy to zbieg okoliczności. Dokument wymaga DWÓCH niezależnych wartości (TC-SP-14) — potrzebny jest **drugi przykład z Network**, dla liczby uczniów, przy której cyfrowy i wysyłka się różnią (np. 40 uczniów → cyfrowy=3, wysyłka=5), żeby sprawdzić, czy `threshold` zwraca jedną z tych wartości (i którą), czy istnieje osobne pole/endpoint dla drugiej formy.
   - Automatyczne odpytanie z tej sesji przez `scripts/_inspect-institution-api.mjs` nadal nie działa (ograniczenia sieciowe środowiska sesji Claude, nie samej aplikacji) — kolejne potwierdzenia nadal wymagają ręcznego Network capture od użytkownika.
2. **Endpoint przeliczenia** — TC-YR-*, TC-SR-01/02/04/05 zakładają istnienie akcji „przelicz próg”, wywoływanej ręcznie lub po aktualizacji SIO. Brak jakiejkolwiek nazwy w kodzie.
3. **Pole/selektor UI „Próg”** — TC-UI-01..07 zakładają widoczne pole w danych podstawowych szkoły, obok „Poziom szkoły” i „Kategoria”, oraz osobną zakładkę „Uprawnienia”. Nie znaleziono w `support/octopus.ts` ani żadnym innym pliku wsparcia.
4. **Historia zmian pola „Minimalne zamówienie”** — TC-HI-* zakładają wpisy historii analogiczne do istniejącej historii RODO nauczyciela (`teacher-history.ts`) czy medali szkoły, ale dla progu nie znaleziono odpowiednika.
5. **Dane historyczne sprzed wzoru** (TC-DH-*) — wymaga danych testowych z konkretnego, znanego roku sprzed wdrożenia wzoru; brak takich danych referencyjnych w repo (`school-medal-data.ts` dotyczy wyłącznie medali).
6. **Reguła cyklu dotacyjnego n±1** (TC-CY-*) — dokument sam odsyła do pliku „Wymagania biznesowe 26-27.xlsx”, którego nie mam.

## Punkty do potwierdzenia z analitykiem (z dokumentu źródłowego)

Te pięć pytań jest przywołane wprost w dokumencie źródłowym — obecna implementacja formuły koduje domyślną interpretację tam, gdzie to możliwe (patrz kolumna „Pokryte?” wyżej), ale nic z tego nie zastępuje realnego potwierdzenia:

1. Czy wynik poniżej 10 dla dostępu cyfrowego SP jest wiążący? *(TC-SP-08 zakłada: tak)*
2. Co dokładnie znaczy „próg nie może zostać wyliczony”? *(TC-SP-11/12 zakładają: null i 0 → 10)*
3. Czy reguła „min. 5” dla wysyłki dotyczy też wartości domyślnej 10? *(bez konfliktu, 10 ≥ 5 — nie testowane osobno, bo nierozstrzygalne bez konfliktu)*
4. Rok szkolny czy kalendarzowy wyznacza „rok” progu, i skąd system bierze bieżący rok? *(TC-YR-* — zablokowane, patrz wyżej)*
5. Czy przeliczenie z tą samą wartością tworzy wpis w historii? *(TC-HI-03 — zablokowane, patrz wyżej)*

## Co jest potrzebne, żeby odblokować resztę

Analogicznie do tego, jak udało się dodać `OctopusApiFactory.createSchool()` po przesłaniu realnego payloadu z Network — potrzebne są:

- ~~Realne żądanie/odpowiedź z Network dla endpointu zwracającego próg~~ ✅ dostarczone (750 uczniów → 56, patrz wyżej) — **potrzebny jeszcze drugi przykład**, gdzie cyfrowy ≠ wysyłka (np. 40 uczniów), żeby rozstrzygnąć znaczenie pojedynczego pola `threshold`.
- To samo dla endpointu przeliczenia (jeśli jest osobny, wyzwalany ręcznie lub automatycznie po edycji SIO).
- Zrzut ekranu lub selektor (np. `data-cy`, `id`, albo widoczny tekst etykiety) pola „Próg” w widoku danych podstawowych szkoły oraz zakładki „Uprawnienia”.
- Przykładowy wpis historii zmian tego pola (analogicznie do historii RODO nauczyciela), żeby poznać kształt rekordu (autor, źródło, data, wartość).
- Odpowiedzi na 5 pytań z sekcji wyżej, choćby nieformalne — pozwolą zamienić dzisiejsze `[DO POTWIERDZENIA]` w testach jednostkowych na twarde, niepodważalne asercje.

Po dostarczeniu tych elementów można od razu rozszerzyć `OctopusApiFactory` o odczyt/przeliczenie progu (ten sam wzorzec co `createSchool`) i napisać właściwe testy API/E2E dla TC-SP-10/13/14, TC-SR-*, TC-YR-*, TC-CY-*, TC-HI-*, TC-DH-*, TC-UI-* — bez zgadywania.
