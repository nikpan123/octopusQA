# Indeks scenariuszy

> Plik generowany automatycznie przez `npm run docs:scenarios`. Nie edytuj tabeli ręcznie.

Łącznie: **272 scenariuszy**.

| ID | Scenariusz | Plik | Tagi |
|---|---|---|---|
| CLUB-01 | CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L80) | `teacher`, `club`, `history` |
| CLUB-02 | CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L178) | `teacher`, `club`, `history` |
| CLUB-03 | CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L248) | `teacher`, `club` |
| CLUB-04 | CLUB-04: formularz klubowy zachowuje kilka klas 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L279) | `teacher`, `club` |
| CLUB-05 | CLUB-05: zaznaczenie wszystkich klas Matematyka/SP wybiera 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L316) | `teacher`, `club` |
| CLUB-06 | CLUB-06: edycja usuwa tylko wskazaną klasę 5 z zestawu 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L356) | `teacher`, `club` |
| CLUB-07 | CLUB-07: formularz klubowy dotyczy tylko wybranej szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L394) | `teacher`, `club` |
| CLUB-08 | CLUB-08: formularz klubowy obsługuje dwie szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L441) | `teacher`, `club` |
| CLUB-09 | CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L884) | `teacher`, `club`, `cancel` |
| CLUB-10 | CLUB-10: anulowanie edycji zachowuje klasę 4 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L915) | `teacher`, `club`, `cancel` |
| CLUB-11 | CLUB-11: formularz klubowy można usunąć | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L957) | `teacher`, `club`, `delete` |
| CLUB-12A | CLUB-12A: brak szkoły blokuje utworzenie formularza klubowego | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1154) | `teacher`, `club`, `validation` |
| CLUB-12B | CLUB-12B: brak klasy blokuje utworzenie formularza klubowego | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1261) | `teacher`, `club`, `validation` |
| CLUB-13 | CLUB-13: formularz klubowy poprawnie prezentuje wszystkie OBCE wydawnictwa | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1373) | `teacher`, `club`, `publisher` |
| CLUB-14 | CLUB-14: nowy formularz ma domyślnie wybrany bieżący rok szkolny | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1427) | `teacher`, `club`, `defaults` |
| CLUB-15 | CLUB-15: formularz pokazuje wszystkie szkoły i przedmioto-poziomy nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1443) | `teacher`, `club`, `defaults` |
| CLUB-16 | CLUB-16: klasy można wybierać wyłącznie dla zaznaczonej szkoły | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1470) | `teacher`, `club`, `school` |
| CLUB-17 | CLUB-17: odznaczenie szkoły usuwa wybrane dla niej klasy | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1490) | `teacher`, `club`, `school` |
| CLUB-18 | CLUB-18: standardowa klasa nie może być jednocześnie NASZA i OBCA | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1511) | `teacher`, `club`, `classes`, `validation` |
| CLUB-19 | CLUB-19: zaznaczenie klasy OBCEJ blokuje tę samą klasę NASZĄ | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1529) | `teacher`, `club`, `classes` |
| CLUB-20 | CLUB-20: różne klasy mogą być jednocześnie NASZE i OBCE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1547) | `teacher`, `club`, `classes` |
| CLUB-21 | CLUB-21: Fizyka pozwala zaznaczyć dwie NASZE serie tej samej klasy | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1567) | `teacher`, `club`, `physics` |
| CLUB-22 | CLUB-22: zaznaczenie wszystkich NASZYCH klas Fizyki obejmuje obie serie | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1588) | `teacher`, `club`, `physics` |
| CLUB-23 | CLUB-23: Matematyka SŚ pozwala zaznaczyć równocześnie wszystkie klasy NASZE i OBCE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1612) | `teacher`, `club`, `math-secondary` |
| CLUB-24 | CLUB-24: wszystkie klasy Matematyki SŚ są trwałe po ponownym otwarciu | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1639) | `teacher`, `club`, `math-secondary` |
| CLUB-25 | CLUB-25: Fizyka zapisuje wszystkie NASZE klasy obu serii | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1677) | `teacher`, `club`, `physics` |
| CLUB-26 | CLUB-26: usunięcie wszystkich klas podczas edycji blokuje zapis | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1706) | `teacher`, `club`, `edit`, `validation` |
| CLUB-27 | CLUB-27: istniejące potwierdzenie blokuje duplikat dla tego samego roku, przedmiotu i szkoły | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1739) | `teacher`, `club`, `duplicate`, `validation` |
| CLUB-28 | CLUB-28: formularz dla poprzedniego roku szkolnego jest trwały | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1778) | `teacher`, `club`, `school-year` |
| CLUB-29 | CLUB-29: potwierdzenia dla tej samej szkoły i przedmiotu mogą dotyczyć dwóch różnych lat | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1808) | `teacher`, `club`, `school-year` |
| CLUB-30 | CLUB-30: odznaczenie opcji wszystkich klas NASZYCH czyści cały wybór | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1857) | `teacher`, `club`, `classes` |
| CLUB-31 | CLUB-31: odznaczenie opcji wszystkich klas OBCYCH czyści cały wybór | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1878) | `teacher`, `club`, `classes` |
| CLUB-32 | CLUB-32: edycja zmienia klasę NASZĄ na OBCĄ i zachowuje wydawnictwo | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1901) | `teacher`, `club`, `edit` |
| CLUB-33 | CLUB-33: klasa OBCA bez wydawnictwa blokuje utworzenie formularza | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1930) | `teacher`, `club`, `publisher`, `validation` |
| CLUB-34 | CLUB-34: zmianę wydawnictwa klasy OBCEJ można zapisać podczas edycji | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1955) | `teacher`, `club`, `publisher`, `edit` |
| CLUB-35 | CLUB-35: usunięcie ostatniej klasy OBCEJ zachowuje klasę NASZĄ | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1983) | `teacher`, `club`, `publisher`, `edit` |
| CLUB-36 | CLUB-36: edycja może dodać kolejną klasę NASZĄ bez utraty poprzedniej | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2010) | `teacher`, `club`, `classes`, `edit` |
| CLUB-37 | CLUB-37: zmiana przedmiotu nie przenosi klas wybranych dla Matematyki do Fizyki | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2035) | `teacher`, `club`, `subject`, `classes` |
| CLUB-38 | CLUB-38: ta sama szkoła i rok mogą mieć osobne potwierdzenia Matematyki i Fizyki | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2060) | `teacher`, `club`, `subject` |
| CLUB-39 | CLUB-39: usuniętego formularza klubowego nie można edytować | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2095) | `teacher`, `club`, `delete`, `validation` |
| CLUB-40 | CLUB-40: po usunięciu można utworzyć nowe potwierdzenie dla tej samej szkoły, roku i przedmiotu | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2124) | `teacher`, `club`, `delete` |
| CLUB-41 | CLUB-41: usunięte potwierdzenie można przywrócić, gdy nie istnieje inne aktywne potwierdzenie | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2170) | `teacher`, `club`, `restore`, `history` |
| CLUB-42 | CLUB-42: aktywne potwierdzenie dla tego samego roku, przedmiotu i szkoły blokuje przywrócenie | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2202) | `teacher`, `club`, `restore`, `validation` |
| CLUB-43 | CLUB-43: przywrócenie zachowuje wszystkie wcześniej wybrane klasy NASZE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2245) | `teacher`, `club`, `restore`, `classes` |
| CLUB-44 | CLUB-44: przywrócenie zachowuje klasę OBCĄ i wydawnictwo | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2278) | `teacher`, `club`, `restore`, `publisher` |
| CLUB-45 | CLUB-45: aktywne potwierdzenie innego przedmiotu nie blokuje przywrócenia | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2306) | `teacher`, `club`, `restore`, `subject` |
| CLUB-46 | CLUB-46: nowsze potwierdzenie blokuje przywrócenie starszego dla tego samego przedmiotu, poziomu i szkoły | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2343) | `teacher`, `club`, `restore`, `school-year`, `validation` |
| CLUB-47 | CLUB-47: aktywne potwierdzenie innej szkoły nie blokuje przywrócenia | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2391) | `teacher`, `club`, `restore`, `school` |
| CLUB-48 | CLUB-48: przywrócone potwierdzenie można edytować | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2436) | `teacher`, `club`, `restore`, `edit` |
| CLUB-49 | CLUB-49: edycja, weryfikacja negatywna, usunięcie i historia wymagają wybranego potwierdzenia | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2468) | `teacher`, `club`, `actions` |
| CLUB-50 | CLUB-50: weryfikacja negatywna zmienia klasę NASZĄ na OBCĄ z wydawnictwem INNE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2498) | `teacher`, `club`, `negative-verification`, `history` |
| CLUB-51 | CLUB-51: weryfikacja negatywna zmienia wszystkie klasy NASZE na OBCE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2540) | `teacher`, `club`, `negative-verification`, `classes` |
| CLUB-52 | CLUB-52: potwierdzenie zweryfikowane negatywnie można zmienić z powrotem na NASZE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2567) | `teacher`, `club`, `negative-verification`, `edit` |
| CLUB-53 | CLUB-53: potwierdzenie zweryfikowane negatywnie można usunąć | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2600) | `teacher`, `club`, `negative-verification`, `delete`, `history` |
| CLUB-54 | CLUB-54: edycja Matematyki nie zmienia potwierdzenia Fizyki | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2627) | `teacher`, `club`, `multi-subject`, `edit` |
| CLUB-55 | CLUB-55: weryfikacja negatywna Matematyki nie zmienia Fizyki | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2673) | `teacher`, `club`, `multi-subject`, `negative-verification` |
| CLUB-56 | CLUB-56: usunięcie i przywrócenie Matematyki nie zmienia aktywnej Fizyki | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2721) | `teacher`, `club`, `multi-subject`, `delete`, `restore` |
| CLUB-57 | CLUB-57: dwie szkoły i dwa przedmioty tworzą cztery niezależne potwierdzenia | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2771) | `teacher`, `club`, `multi-subject`, `multi-school` |
| CLUB-58 | CLUB-58: Matematyka i Fizyka zachowują niezależne potwierdzenia dla dwóch lat szkolnych | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2829) | `teacher`, `club`, `multi-subject`, `school-year` |
| CLUB-59 | CLUB-59: mieszany cykl życia Matematyki i Fizyki zachowuje niezależne statusy i historie | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2895) | `teacher`, `club`, `multi-subject`, `negative-verification`, `delete`, `restore`, `history` |
| CLUB-60 | CLUB-60: nowsze potwierdzenie blokuje późniejsze dodanie starszego dla tej samej szkoły i przedmiotu | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2956) | `teacher`, `club`, `school-year`, `validation` |
| CLUB-61 | CLUB-61: Język polski pozwala zapisać tylko jedną NASZĄ serię klasy 4 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L2999) | `teacher`, `club`, `polish`, `classes`, `validation` |
| CLUB-62 | CLUB-62: formularz WSPOM tworzy potwierdzenie i funkcję nauczyciela wspomagającego | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3044) | `teacher`, `club`, `supporting` |
| CLUB-63 | CLUB-63: jeden formularz WSPOM zapisuje Język polski i Matematykę niezależnie | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3070) | `teacher`, `club`, `supporting`, `multi-subject` |
| CLUB-64 | CLUB-64: dwa szybkie kliknięcia Zapisz nie tworzą dwóch potwierdzeń | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3117) | `teacher`, `club`, `concurrency` |
| CLUB-65 | CLUB-65: zaznaczenie wszystkich klas OBCYCH Matematyki SP jest trwałe | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3145) | `teacher`, `club`, `classes`, `publisher`, `select-all` |
| CLUB-66 | CLUB-66: edycja Języka polskiego nie pozwala zapisać dwóch NASZYCH serii klasy 4 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3180) | `teacher`, `club`, `polish`, `edit`, `validation` |
| CLUB-67 | CLUB-67: zaznaczenie wszystkich NASZYCH klas Języka polskiego wybiera tylko jedną serię klasy 4 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3224) | `teacher`, `club`, `polish`, `classes`, `select-all` |
| CLUB-68 | CLUB-68: formularz WSPOM nie pokazuje serii Języka polskiego ani Fizyki | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3270) | `teacher`, `club`, `supporting`, `polish`, `physics`, `classes` |
| CLUB-69 | CLUB-69: formularz WSPOM poprawnie prezentuje wszystkie OBCE wydawnictwa | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3310) | `teacher`, `club`, `supporting`, `publisher` |
| CLUB-70 | CLUB-70: formularz WSPOM wymaga szkoły, przedmiotu i klasy | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3368) | `teacher`, `club`, `supporting`, `validation` |
| CLUB-71 | CLUB-71: zwykłe potwierdzenie i WSPOM współistnieją dla tego samego przedmiotu, szkoły i roku | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L3401) | `teacher`, `club`, `supporting`, `duplicate` |
| ADD-01 | ADD-01: nauczyciela można utworzyć z imieniem, nazwiskiem, szkołą i e-mailem bez przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L84) | `teacher`, `add`, `positive` |
| ADD-02 | ADD-02: nauczyciela można utworzyć z telefonem bez e-maila | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L219) | `teacher`, `add`, `positive` |
| ADD-03 | ADD-03: dzisiejsza data urodzenia jest akceptowana | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L321) | `teacher`, `add`, `birthdate` |
| ADD-04 | ADD-04: źródło domyślne to Karta nauczyciela i lista zawiera trzy wartości | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L426) | `teacher`, `add`, `source` |
| ADD-05 | ADD-05: nauczyciela można utworzyć ze źródłem Karta LS | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L475) | `teacher`, `add`, `source` |
| ADD-06 | ADD-06: zgoda E-mail może być zaznaczona bez zgody Marketing | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L509) | `teacher`, `add`, `rodo` |
| ADD-07 | ADD-07: zgoda Telefon może być zaznaczona bez zgody Marketing | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L595) | `teacher`, `add`, `rodo` |
| ADD-08 | ADD-08: nauczyciela można utworzyć bez żadnej zgody RODO | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L676) | `teacher`, `add`, `rodo` |
| ADD-09 | ADD-09: nauczyciela można utworzyć z dwiema szkołami | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L720) | `teacher`, `add`, `school` |
| ADD-10 | ADD-10: szkołę można usunąć przed zapisaniem nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L759) | `teacher`, `add`, `school` |
| ADD-11 | ADD-11: nauczyciela można utworzyć z przedmioto-poziomem Matematyka SP | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L812) | `teacher`, `add`, `subject` |
| ADD-12 | ADD-12: nauczyciela można utworzyć z wieloma przedmioto-poziomami | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L841) | `teacher`, `add`, `subject` |
| ADD-13 | ADD-13: dodawanie nauczyciela zachowuje wielkość liter i akceptuje znak _ | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L880) | `teacher`, `add`, `name` |
| ADD-14 | ADD-14: Pokaż przy podobnej osobie zamyka formularz i otwiera istniejącego nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L973) | `teacher`, `add`, `duplicate` |
| ADD-15 | ADD-15: brak pola imię blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1031) | `teacher`, `add`, `validation` |
| ADD-16 | ADD-16: brak pola nazwisko blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1031) | `teacher`, `add`, `validation` |
| ADD-17 | ADD-17: brak pola szkoła blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1031) | `teacher`, `add`, `validation` |
| ADD-18 | ADD-18: brak e-maila i telefonu blokuje utworzenie nauczyciela po potwierdzeniu braku przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1085) | `teacher`, `add`, `validation` |
| ADD-19 | ADD-19: wybranie Nie przy ostrzeżeniu o braku przedmioto-poziomu pozostawia formularz otwarty | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1132) | `teacher`, `add`, `validation` |
| ADD-20.1 | ADD-20.1: niepoprawny e-mail "test" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1182) | `teacher`, `add`, `email`, `validation` |
| ADD-20.2 | ADD-20.2: niepoprawny e-mail "test@" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1182) | `"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.3 | ADD-20.3: niepoprawny e-mail "@example.pl" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1182) | `example.pl"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.4 | ADD-20.4: niepoprawny e-mail "a b@example.pl" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1182) | `example.pl"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.5 | ADD-20.5: niepoprawny e-mail "a@" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1182) | `"`, `teacher`, `add`, `email`, `validation` |
| ADD-21 | ADD-21: e-mail używany przez innego nauczyciela blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1220) | `teacher`, `add`, `email`, `validation` |
| ADD-22 | ADD-22: telefon krótszy niż 9 cyfr blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1329) | `teacher`, `add`, `phone`, `validation` |
| ADD-23 | ADD-23: pole telefonu nie pozwala wprowadzić więcej niż 9 cyfr | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1429) | `teacher`, `add`, `phone` |
| ADD-24 | ADD-24: przyszła data urodzenia blokuje zapis nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1472) | `teacher`, `add`, `birthdate`, `validation` |
| ADD-25 | ADD-25: nauczyciela można utworzyć bez daty urodzenia | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1502) | `teacher`, `add`, `birthdate`, `positive` |
| ADD-27 | ADD-27: brak poziomu blokuje dodanie przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1669) | `teacher`, `add`, `subject`, `validation` |
| ADD-28 | ADD-28: brak przedmiotu blokuje dodanie przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1763) | `teacher`, `add`, `subject`, `validation` |
| ADD-29 | ADD-29: tego samego przedmioto-poziomu nie można dodać dwa razy | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1850) | `teacher`, `add`, `subject`, `validation` |
| ADD-30 | ADD-30: anulowanie kompletnego formularza nie tworzy nauczyciela ani relacji ze szkołą | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1940) | `teacher`, `add`, `cancel` |
| EDIT-04 | EDIT-04: zmiana imienia jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L70) | `teacher`, `edit` |
| EDIT-05 | EDIT-05: zmiana nazwiska jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L138) | `teacher`, `edit` |
| EDIT-06 | EDIT-06: jednoczesna zmiana imienia i nazwiska zapisuje oba pola | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L175) | `teacher`, `edit` |
| EDIT-07 | EDIT-07: wielkość liter imienia jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L223) | `teacher`, `edit`, `normalization` |
| EDIT-08 | EDIT-08: wielkość liter nazwiska jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L258) | `teacher`, `edit`, `normalization` |
| EDIT-09 | EDIT-09: nazwisko z łącznikiem można zapisać | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L287) | `teacher`, `edit` |
| EDIT-10 | EDIT-10: puste imię blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L322) | `teacher`, `edit`, `validation` |
| EDIT-11 | EDIT-11: puste nazwisko blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L366) | `teacher`, `edit`, `validation` |
| EDIT-12 | EDIT-12: poprawny e-mail można zmienić i zmiana jest widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L408) | `teacher`, `edit` |
| EDIT-13 | EDIT-13: niepoprawny e-mail blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L581) | `teacher`, `edit`, `validation` |
| EDIT-14 | EDIT-14: poprawny telefon można dodać | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L737) | `teacher`, `edit` |
| EDIT-15 | EDIT-15: można dodać drugi numer telefonu | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L851) | `teacher`, `edit` |
| EDIT-16 | EDIT-16: przy dwóch telefonach nie można dodać trzeciego | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L918) | `teacher`, `edit` |
| EDIT-17 | EDIT-17: można usunąć zapisany numer telefonu | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1010) | `teacher`, `edit` |
| EDIT-18 | EDIT-18: anulowanie usunięcia telefonu nie zmienia danych | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1159) | `teacher`, `edit` |
| EDIT-19 | EDIT-19: niepoprawny telefon blokuje dodanie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1281) | `teacher`, `edit`, `validation` |
| EDIT-20 | EDIT-20: nauczyciel może pozostać bez e-maila jeśli posiada telefon | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1385) | `teacher`, `edit` |
| EDIT-21 | EDIT-21: nauczyciel może istnieć bez telefonu jeśli posiada e-mail | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1470) | `teacher`, `edit` |
| EDIT-22 | EDIT-22: brak e-maila i telefonu wymaga dodatkowego potwierdzenia | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1509) | `teacher`, `edit`, `validation` |
| EDIT-23 | EDIT-23: można usunąć e-mail bez telefonu po potwierdzeniu ostrzeżenia o rekordzie minimalnym | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1566) | `teacher`, `edit`, `validation` |
| EDIT-24 | EDIT-24: poprawna data urodzenia jest trwała | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1695) | `teacher`, `edit` |
| EDIT-25 | EDIT-25: niepoprawna data urodzenia blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1738) | `teacher`, `edit`, `validation` |
| EDIT-26 | EDIT-26: pełny adres prywatny można dodać i jest zapisany w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1784) | `teacher`, `edit`, `history` |
| EDIT-27 | EDIT-27: wszystkie dane istniejącego adresu prywatnego można zmienić | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1905) | `teacher`, `edit`, `history` |
| EDIT-28 | EDIT-28: uwagi nauczyciela są trwałe | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2154) | `teacher`, `edit` |
| EDIT-29 | EDIT-29: nauczyciel może posiadać wiele notatek | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2275) | `teacher`, `edit`, `notes` |
| EDIT-30 | EDIT-30: notatkę nauczyciela można zarchiwizować | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2338) | `teacher`, `edit`, `notes` |
| EDIT-31 | EDIT-31: anulowanie nie zapisuje nowej notatki nauczyciela | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2400) | `teacher`, `edit`, `notes`, `cancel` |
| EDIT-32 | EDIT-32: zapisana notatka posiada autora i datę | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2468) | `teacher`, `edit`, `notes` |
| EDIT-33 | EDIT-33: notatka nauczyciela ma limit 220 znaków | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2531) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-34 | EDIT-34: pusta notatka nauczyciela nie jest zapisywana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2599) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-35 | EDIT-35: zgoda Marketing jest trwała | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2723) | `teacher`, `edit`, `rodo` |
| EDIT-36 | EDIT-36: zaznaczenie zgody E-mail automatycznie zaznacza Marketing | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2765) | `teacher`, `edit`, `rodo` |
| EDIT-37 | EDIT-37: zaznaczenie zgody Telefon automatycznie zaznacza Marketing | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2823) | `teacher`, `edit`, `rodo` |
| EDIT-38 | EDIT-38: wszystkie zgody RODO można zapisać jednocześnie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2879) | `teacher`, `edit`, `rodo` |
| EDIT-39 | EDIT-39: odznaczenie zgody Marketing pokazuje ostrzeżenie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2919) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-40 | EDIT-40: odznaczenie Marketing automatycznie odznacza E-mail i Telefon | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3007) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-41 | EDIT-41: zapis bez żadnej zgody RODO pokazuje ostrzeżenie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3132) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-42 | EDIT-42: dropdown Źródło RODO zawiera oczekiwane wartości | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3180) | `teacher`, `edit`, `rodo` |
| EDIT-43 | EDIT-43: ponowny zapis już znormalizowanych danych bez zmian nie modyfikuje danych ani historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3248) | `teacher`, `edit` |
| EDIT-44 | EDIT-44: anulowanie wielu zmian zachowuje poprzednie dane i historię | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3372) | `teacher`, `edit`, `cancel` |
| EDIT-45 | EDIT-45: zmienione dane są trwałe po przejściu do szkoły i powrocie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3417) | `teacher`, `edit`, `navigation` |
| EDIT-46 | EDIT-46: edycja danych nauczyciela nie usuwa relacji ze szkołą | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3465) | `teacher`, `edit`, `relation` |
| EDIT-47 | EDIT-47: jednoczesna zmiana wielu pól tworzy komplet wpisów historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3510) | `teacher`, `edit`, `history` |
| EDIT-03 | EDIT-03: zapis nazwiska jest trwały i widoczny w historii | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L4) | `teacher`, `edit` |
| TEA-04 | TEA-04: niepoprawny e-mail blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L42) | `teacher`, `validation` |
| TEA-04 | TEA-04: niepoprawny telefon blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L42) | `teacher`, `validation` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Email | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L85) | `teacher`, `search` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Nazwisko | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L85) | `teacher`, `search` |
| REL-02 | REL-02: druga szkoła zachowuje pierwszą relację i pokazuje nauczyciela w obu szkołach | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L123) | `teacher`, `relation` |
| SCH-03 | SCH-03: minimalny poprawny formularz tworzy szkołę | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L78) | `school`, `school-add`, `positive` |
| SCH-04 | SCH-04: brak nazwy blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L97) | `school`, `school-add`, `validation` |
| SCH-05 | SCH-05: brak typu blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L111) | `school`, `school-add`, `validation` |
| SCH-06 | SCH-06: brak adresu blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L125) | `school`, `school-add`, `validation`, `address` |
| SCH-09 | SCH-09: anulowanie adresu nie przenosi danych do formularza szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L138) | `school`, `school-add`, `address`, `cancel` |
| SCH-10 | SCH-10: dwa szybkie kliknięcia Zapisz tworzą tylko jedną szkołę | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L168) | `school`, `school-add`, `concurrency` |
| SCH-11 | SCH-11: dane szkoły są trwałe po ponownym otwarciu | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L186) | `school`, `school-add`, `positive` |
| SCH-12 | SCH-12: nową szkołę można znaleźć po nazwie i zidentyfikować po ID | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L204) | `school`, `school-add`, `search` |
| SCH-13 | SCH-13: słownik zawiera wszystkie obsługiwane typy szkół | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L228) | `school`, `school-add`, `dictionary` |
| SCH-14 | SCH-14: formularz tworzy liceum z właściwym typem | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L244) | `school`, `school-add`, `positive`, `school-type` |
| SCH-21 | SCH-21: formularz tworzy szkołę typu Technikum | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L260) | `school`, `school-add`, `positive`, `school-type` |
| SCH-22 | SCH-22: formularz tworzy szkołę typu Placówka doskonalenia nauczycieli | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L260) | `school`, `school-add`, `positive`, `school-type` |
| SCH-23 | SCH-23: formularz tworzy szkołę typu Zespół szkół | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L260) | `school`, `school-add`, `positive`, `school-type` |
| SCH-24 | SCH-24: formularz tworzy szkołę typu Szkoła NPC | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L260) | `school`, `school-add`, `positive`, `school-type` |
| SCH-25 | SCH-25: formularz tworzy szkołę typu Przedszkole | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L260) | `school`, `school-add`, `positive`, `school-type` |
| SCH-17 | SCH-17: nazwa złożona wyłącznie ze spacji nie pozwala utworzyć szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L284) | `school`, `school-add`, `validation` |
| SCH-18 | SCH-18: nazwa z polskimi znakami i interpunkcją jest zachowana | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L306) | `school`, `school-add`, `positive`, `name` |
| SCH-27 | SCH-27: spacje na brzegach nazwy są usuwane przy zapisie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L321) | `school`, `school-add`, `positive`, `name` |
| SCH-28 | SCH-28: identyczna nazwa i adres mogą utworzyć dwa różne rekordy | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L337) | `school`, `school-add`, `positive`, `duplicate` |
| SCH-29 | SCH-29: identyczna nazwa pod różnymi adresami tworzy dwa różne rekordy | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L361) | `school`, `school-add`, `positive`, `duplicate` |
| SCH-07 | SCH-07: poprawny kod pocztowy pozwala wybrać miejscowość i zapisać adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L395) | `school`, `school-add`, `address` |
| SCH-08 | SCH-08: nieznany kod pocztowy blokuje zapis adresu i szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L419) | `school`, `school-add`, `validation`, `address` |
| SCH-19 | SCH-19: numer budynku z literą jest zachowany w adresie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L456) | `school`, `school-add`, `address` |
| SCH-20 | SCH-20: wyczyszczenie wyszukiwania adresu usuwa wpisane kryteria | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L477) | `school`, `school-add`, `address`, `clear` |
| SCH-26 | SCH-26: numer budynku z separatorem jest zachowany po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L499) | `school`, `school-add`, `positive`, `address` |
| SCH-41 | SCH-41: brak numeru budynku blokuje zapis adresu i szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L514) | `school`, `school-add`, `validation`, `address` |
| SCH-43 | SCH-43: pełny adres z ulicą jest zachowany po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L539) | `school`, `school-add`, `positive`, `address` |
| SCH-44 | SCH-44: wyczyszczenie wybranego adresu usuwa utworzony adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L570) | `school`, `school-add`, `validation`, `address`, `clear` |
| SCH-45 | SCH-45: ponowne dodanie adresu zastępuje adres przed utworzeniem szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L597) | `school`, `school-add`, `positive`, `address` |
| SCH-46 | SCH-46: anulowanie zmiany adresu zachowuje poprzedni adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L628) | `school`, `school-add`, `positive`, `address`, `cancel` |
| SCH-47 | SCH-47: wyczyszczenie adresu i anulowanie zachowuje poprzedni adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L652) | `school`, `school-add`, `positive`, `address`, `cancel`, `clear` |
| SCH-15 | SCH-15: usunięcie dodanego adresu ponownie blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L674) | `school`, `school-add`, `address`, `validation` |
| SCH-30 | SCH-30: nazwa z SIO jest zachowana po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L699) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-32 | SCH-32: liczba uczniów jest zachowana po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L715) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-33 | SCH-33: numer RSPO jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L733) | `school`, `school-add`, `positive`, `identifier` |
| SCH-34 | SCH-34: numer REGON jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L751) | `school`, `school-add`, `positive`, `identifier` |
| SCH-35 | SCH-35: numer NIP jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L769) | `school`, `school-add`, `positive`, `identifier` |
| SCH-51 | SCH-51: REGON z wiodącymi zerami zachowuje pełną długość | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L787) | `school`, `school-add`, `positive`, `identifier` |
| SCH-52 | SCH-52: NIP z wiodącymi zerami zachowuje pełną długość | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L805) | `school`, `school-add`, `positive`, `identifier` |
| SCH-49 | SCH-49: zerowa liczba uczniów jest zachowana | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L823) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-31 | SCH-31: WWW i e-mail są zachowane po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L845) | `school`, `school-add`, `positive`, `contact` |
| SCH-53 | SCH-53: pełny adres WWW ze ścieżką i parametrami jest zachowany | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L865) | `school`, `school-add`, `positive`, `contact` |
| SCH-54 | SCH-54: e-mail z wielkimi literami jest normalizowany do małych liter | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L882) | `school`, `school-add`, `positive`, `contact` |
| SCH-36 | SCH-36: przełącznik komórka ustawia format numeru i resetuje się po zapisie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L901) | `school`, `school-add`, `positive`, `contact` |
| SCH-37 | SCH-37: telefon stacjonarny zachowuje właściwy format po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L927) | `school`, `school-add`, `positive`, `contact` |
| SCH-38 | SCH-38: niepoprawny e-mail blokuje utworzenie szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L954) | `school`, `school-add`, `validation`, `contact` |
| SCH-39 | SCH-39: niepełny telefon blokuje utworzenie szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L971) | `school`, `school-add`, `validation`, `contact` |
| SCH-40 | SCH-40: przełączenie komórka zmienia maskę bez utraty cyfr | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L991) | `school`, `school-add`, `contact`, `format` |
| SCH-48 | SCH-48: e-mail z subdomeną jest zachowany | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1010) | `school`, `school-add`, `positive`, `contact` |
| SCH-50 | SCH-50: e-mail z aliasem plus jest odrzucany przez backend | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1027) | `school`, `school-add`, `validation`, `contact` |
| SCH-16 | SCH-16: błąd serwera nie otwiera nieistniejącej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1063) | `school`, `school-add`, `error-handling` |
| SCH-42 | SCH-42: pełny formularz zachowuje wszystkie dane opcjonalne | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1100) | `school`, `school-add`, `positive`, `optional-data`, `contact`, `identifier` |
| SCH-EDIT-01 | SCH-EDIT-01: formularz edycji wczytuje nazwę szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L46) | `school`, `school-edit`, `smoke` |
| SCH-EDIT-02 | SCH-EDIT-02: anulowanie zmiany nazwy zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L59) | `school`, `school-edit`, `cancel` |
| SCH-EDIT-03 | SCH-EDIT-03: zmiana nazwy jest trwała po ponownym otwarciu szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L75) | `school`, `school-edit`, `positive` |
| SCH-EDIT-04 | SCH-EDIT-04: zmiana WWW i e-maila jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L92) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-05 | SCH-EDIT-05: zmiana nazwy z SIO jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L127) | `school`, `school-edit`, `positive`, `sio` |
| SCH-EDIT-06 | SCH-EDIT-06: anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L151) | `school`, `school-edit`, `cancel`, `sio` |
| SCH-EDIT-07 | SCH-EDIT-07: pusta nazwa nie pozwala zapisać edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L170) | `school`, `school-edit`, `validation` |
| SCH-EDIT-08 | SCH-EDIT-08: typ i poziom szkoły są nieedytowalne w edycji danych | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L188) | `school`, `school-edit`, `readonly` |
| MED-YEAR-PREP | MED-YEAR-PREP: przygotuj snapshot 4 szkół referencyjnych i 50 losowych szkół | [szkola-medalowosc-annual.spec.ts](../../tests/szkola-medalowosc-annual.spec.ts#L59) | `annual-medal` |
| MED-YEAR-01 | MED-YEAR-01: roczne przeliczenie ustawia oczekiwany medal na podstawie snapshotu | [szkola-medalowosc-annual.spec.ts](../../tests/szkola-medalowosc-annual.spec.ts#L173) | `annual-medal` |
| MED-02 | MED-02: pole Medal dla szkoły ze złotym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L38) | — |
| MED-04 | MED-04: tooltip złotego medalu wyświetla przedmioty składające się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L47) | — |
| MED-05 | MED-05: złoty medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L59) | — |
| MED-07 | MED-07: pole Medal dla szkoły ze srebrnym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L68) | — |
| MED-09 | MED-09: tooltip srebrnego medalu wyświetla przedmioty składające się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L77) | — |
| MED-10 | MED-10: srebrny medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L89) | — |
| MED-12 | MED-12: pole Medal dla szkoły z brązowym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L98) | — |
| MED-14 | MED-14: tooltip brązowego medalu wyświetla przedmiot składający się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L107) | — |
| MED-15 | MED-15: brązowy medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L119) | — |
| MED-17 | MED-17: pole Medal dla szkoły bez medalu jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L128) | — |
| MED-18 | MED-18: najechanie na wartość Brak nie wyświetla tooltipa z przedmiotami | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L137) | — |
| MED-19 | MED-19: wartość Brak jest widoczna w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L148) | — |
| MED-20 | MED-20: historia zmian szkoły zawiera wpis dotyczący złotego medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L157) | — |
| MED-21 | MED-21: historia zawiera tylko jeden wpis medalowy dla danego roku szkolnego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L192) | — |
| MED-22 | MED-22: wartość wpisu medalowego ma format RRRR/RRRR Medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L227) | — |
| MED-23 | MED-23: wpisy medalowe w historii mają źródło Formularz klubowy | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L250) | — |
| MED-24 | MED-24: wpisy medalowe w historii mają uzupełnionego autora | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L273) | — |
| MED-25 | MED-25: wpisy medalowe w historii są zapisane z datą 1 października | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L294) | — |
| MED-26 | MED-26: wpisy medalowe w historii są posortowane od najnowszego sezonu do najstarszego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L318) | — |
| MED-27 | MED-27: wyszukiwanie po Medal = Złoto zwraca tylko szkoły ze złotym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L364) | — |
| MED-28 | MED-28: wyszukiwanie po Medal = Srebro zwraca tylko szkoły ze srebrnym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L374) | — |
| MED-29 | MED-29: wyszukiwanie po Medal = Brąz zwraca tylko szkoły z brązowym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L384) | — |
| MED-30 | MED-30: wyszukiwanie po Medal = Brak zwraca tylko szkoły bez medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L394) | — |
| MED-31 | MED-31: wyszukiwanie po Medal = Złoto i Srebro zwraca szkoły z oboma wybranymi medalami | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L402) | — |
| MED-33 | MED-33: złoty medal i jego przedmioty są zgodne między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L412) | — |
| MED-36 | MED-36: srebrny medal i jego przedmioty są zgodne między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L432) | — |
| MED-39 | MED-39: brązowy medal i jego przedmioty są zgodne między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L452) | — |
| MED-43 | MED-43: brak medalu i przedmiotów jest zgodny między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L472) | — |
| MED-44 | MED-44: medal szkoły jest zgodny z liczbą przedmiotów zwracanych przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L491) | — |
| MED-45 | MED-45: lista przedmiotów wpływających na medal nie zawiera duplikatów | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L517) | — |
| MED-46 | MED-46: wielu nauczycieli MAT SP nie zwiększa liczby przedmiotów medalowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L538) | — |
| MED-47 | MED-47: medal w wynikach wyszukiwania szkoły jest zgodny z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L568) | — |
| MED-48 | MED-48: przedmioty nauczycieli nie są automatycznie zaliczane do medalowości szkoły | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L595) | — |
| MED-49 | MED-49: najnowszy wpis historii medalu jest zgodny z aktualną wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L658) | — |
| MED-50 | MED-50: historia medalowości zawiera maksymalnie jeden wpis dla każdego roku szkolnego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L720) | — |
| MED-51 | MED-51: wszystkie wpisy historii medalowości mają źródło Formularz klubowy | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L777) | — |
| MED-52 | MED-52: data wpisu medalowości przypada na 1 października roku kończącego sezon | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L813) | — |
| MED-53 | MED-53: wszystkie wpisy historii medalowości są zapisane przez automat | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L857) | — |
| MED-54 | MED-54: wyszukiwanie po ID szkoły ma priorytet nad filtrem medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L893) | — |
| MED-55 | MED-55: filtrowanie bez ID zwraca tylko szkoły z wybranym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L964) | — |
| MED-56 | MED-56: multiselect medalu jest poprawnie przekazywany do API i zwraca tylko wybrane medale | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1001) | — |
| MED-60 | MED-60: każda szkoła z medalem Brak nie ma przedmiotów medalowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1173) | — |
| — | szkoła → nauczyciel → relacja → wyszukiwanie → nauczyciel → historia | [szkola-nauczyciel.spec.ts](../../tests/szkola-nauczyciel.spec.ts#L7) | `smoke` |
| TEA-02 | TEA-02: brak pola imię blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola nazwisko blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola szkoła blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola kontakt blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-03 | TEA-03: anulowanie kompletnego formularza nie tworzy nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L49) | `cancel` |
| SCH-02 | SCH-02: anulowanie kompletnego formularza nie tworzy szkoły | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L60) | `cancel` |
| EDIT-02 | EDIT-02: anulowanie edycji zachowuje dane i historię | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L70) | `cancel` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — teacher | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L107) | `search` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — school | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L107) | `search` |
| ORD-01 | ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L13) | `school`, `order` |
| ORD-02 | ORD-02: zamówienie szkoły z dwoma produktami zachowuje produkty i ilości po ponownym otwarciu | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L42) | `school`, `order` |
| ORD-03 | ORD-03: edycja ilości dwóch produktów w zamówieniu i usunięcie zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L101) | `school`, `order` |
