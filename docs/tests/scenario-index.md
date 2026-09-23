# Indeks scenariuszy

> Plik generowany automatycznie przez `npm run docs:scenarios`. Nie edytuj tabeli ręcznie.

Łącznie: **188 scenariuszy**.

| ID | Scenariusz | Plik | Tagi |
|---|---|---|---|
| CLUB-01 | CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L33) | `teacher`, `club` |
| CLUB-02 | CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L116) | `teacher`, `club` |
| CLUB-03 | CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L179) | `teacher`, `club` |
| CLUB-04 | CLUB-04: formularz klubowy zachowuje kilka klas 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L214) | `teacher`, `club` |
| CLUB-05 | CLUB-05: zaznaczenie wszystkich klas Matematyka/SP wybiera 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L255) | `teacher`, `club` |
| CLUB-06 | CLUB-06: edycja usuwa tylko wskazaną klasę 5 z zestawu 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L299) | `teacher`, `club` |
| CLUB-07 | CLUB-07: formularz klubowy dotyczy tylko wybranej szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L341) | `teacher`, `club` |
| CLUB-08 | CLUB-08: formularz klubowy obsługuje dwie szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L392) | `teacher`, `club` |
| CLUB-09 | CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L842) | `teacher`, `club`, `cancel` |
| CLUB-10 | CLUB-10: anulowanie edycji zachowuje klasę 4 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L877) | `teacher`, `club`, `cancel` |
| CLUB-11 | CLUB-11: formularz klubowy można usunąć | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L923) | `teacher`, `club`, `delete` |
| CLUB-12A | CLUB-12A: brak szkoły blokuje utworzenie formularza klubowego | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1122) | `teacher`, `club`, `validation` |
| CLUB-12B | CLUB-12B: brak klasy blokuje utworzenie formularza klubowego | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1233) | `teacher`, `club`, `validation` |
| CLUB-13 | CLUB-13: formularz klubowy zachowuje klasę obcą i wydawnictwo | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1349) | `teacher`, `club` |
| CLUB-14 | CLUB-14: nowy formularz ma domyślnie wybrany bieżący rok szkolny | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1418) | `teacher`, `club`, `defaults` |
| CLUB-15 | CLUB-15: formularz pokazuje wszystkie szkoły i przedmioto-poziomy nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1434) | `teacher`, `club`, `defaults` |
| CLUB-16 | CLUB-16: klasy można wybierać wyłącznie dla zaznaczonej szkoły | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1463) | `teacher`, `club`, `school` |
| CLUB-17 | CLUB-17: odznaczenie szkoły usuwa wybrane dla niej klasy | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1483) | `teacher`, `club`, `school` |
| CLUB-18 | CLUB-18: standardowa klasa nie może być jednocześnie NASZA i OBCA | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1504) | `teacher`, `club`, `classes`, `validation` |
| CLUB-19 | CLUB-19: zaznaczenie klasy OBCEJ blokuje tę samą klasę NASZĄ | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1522) | `teacher`, `club`, `classes` |
| CLUB-20 | CLUB-20: różne klasy mogą być jednocześnie NASZE i OBCE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1540) | `teacher`, `club`, `classes` |
| CLUB-21 | CLUB-21: Fizyka pozwala zaznaczyć dwie NASZE serie tej samej klasy | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1560) | `teacher`, `club`, `physics` |
| CLUB-22 | CLUB-22: zaznaczenie wszystkich NASZYCH klas Fizyki obejmuje obie serie | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1581) | `teacher`, `club`, `physics` |
| CLUB-23 | CLUB-23: Matematyka SŚ pozwala zaznaczyć równocześnie wszystkie klasy NASZE i OBCE | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1605) | `teacher`, `club`, `math-secondary` |
| CLUB-24 | CLUB-24: wszystkie klasy Matematyki SŚ są trwałe po ponownym otwarciu | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1632) | `teacher`, `club`, `math-secondary` |
| CLUB-25 | CLUB-25: Fizyka zapisuje wszystkie NASZE klasy obu serii | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1670) | `teacher`, `club`, `physics` |
| CLUB-26 | CLUB-26: usunięcie wszystkich klas podczas edycji blokuje zapis | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1697) | `teacher`, `club`, `edit`, `validation` |
| CLUB-27 | CLUB-27: istniejące potwierdzenie blokuje duplikat dla tego samego roku, przedmiotu i szkoły | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1730) | `teacher`, `club`, `duplicate`, `validation` |
| CLUB-28 | CLUB-28: formularz dla poprzedniego roku szkolnego jest trwały | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1769) | `teacher`, `club`, `school-year` |
| CLUB-29 | CLUB-29: potwierdzenia dla tej samej szkoły i przedmiotu mogą dotyczyć dwóch różnych lat | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1799) | `teacher`, `club`, `school-year` |
| CLUB-30 | CLUB-30: odznaczenie opcji wszystkich klas NASZYCH czyści cały wybór | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1848) | `teacher`, `club`, `classes` |
| CLUB-31 | CLUB-31: odznaczenie opcji wszystkich klas OBCYCH czyści cały wybór | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1869) | `teacher`, `club`, `classes` |
| CLUB-32 | CLUB-32: edycja zmienia klasę NASZĄ na OBCĄ i zachowuje wydawnictwo | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L1892) | `teacher`, `club`, `edit` |
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
| EDIT-05 | EDIT-05: zmiana nazwiska jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L140) | `teacher`, `edit` |
| EDIT-06 | EDIT-06: jednoczesna zmiana imienia i nazwiska zapisuje oba pola | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L177) | `teacher`, `edit` |
| EDIT-07 | EDIT-07: wielkość liter imienia jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L225) | `teacher`, `edit`, `normalization` |
| EDIT-08 | EDIT-08: wielkość liter nazwiska jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L260) | `teacher`, `edit`, `normalization` |
| EDIT-09 | EDIT-09: nazwisko z łącznikiem można zapisać | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L289) | `teacher`, `edit` |
| EDIT-10 | EDIT-10: puste imię blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L324) | `teacher`, `edit`, `validation` |
| EDIT-11 | EDIT-11: puste nazwisko blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L368) | `teacher`, `edit`, `validation` |
| EDIT-12 | EDIT-12: poprawny e-mail można zmienić i zmiana jest widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L410) | `teacher`, `edit` |
| EDIT-13 | EDIT-13: niepoprawny e-mail blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L585) | `teacher`, `edit`, `validation` |
| EDIT-14 | EDIT-14: poprawny telefon można dodać | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L743) | `teacher`, `edit` |
| EDIT-15 | EDIT-15: można dodać drugi numer telefonu | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L859) | `teacher`, `edit` |
| EDIT-16 | EDIT-16: przy dwóch telefonach nie można dodać trzeciego | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L928) | `teacher`, `edit` |
| EDIT-17 | EDIT-17: można usunąć zapisany numer telefonu | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1022) | `teacher`, `edit` |
| EDIT-18 | EDIT-18: anulowanie usunięcia telefonu nie zmienia danych | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1173) | `teacher`, `edit` |
| EDIT-19 | EDIT-19: niepoprawny telefon blokuje dodanie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1297) | `teacher`, `edit`, `validation` |
| EDIT-20 | EDIT-20: nauczyciel może pozostać bez e-maila jeśli posiada telefon | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1403) | `teacher`, `edit` |
| EDIT-21 | EDIT-21: nauczyciel może istnieć bez telefonu jeśli posiada e-mail | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1490) | `teacher`, `edit` |
| EDIT-22 | EDIT-22: brak e-maila i telefonu wymaga dodatkowego potwierdzenia | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1531) | `teacher`, `edit`, `validation` |
| EDIT-23 | EDIT-23: można usunąć e-mail bez telefonu po potwierdzeniu ostrzeżenia o rekordzie minimalnym | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1590) | `teacher`, `edit`, `validation` |
| EDIT-24 | EDIT-24: poprawna data urodzenia jest trwała | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1721) | `teacher`, `edit` |
| EDIT-25 | EDIT-25: niepoprawna data urodzenia blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1764) | `teacher`, `edit`, `validation` |
| EDIT-26 | EDIT-26: pełny adres prywatny można dodać i jest zapisany w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1810) | `teacher`, `edit`, `history` |
| EDIT-27 | EDIT-27: wszystkie dane istniejącego adresu prywatnego można zmienić | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L1931) | `teacher`, `edit`, `history` |
| EDIT-28 | EDIT-28: uwagi nauczyciela są trwałe | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2180) | `teacher`, `edit` |
| EDIT-29 | EDIT-29: nauczyciel może posiadać wiele notatek | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2301) | `teacher`, `edit`, `notes` |
| EDIT-30 | EDIT-30: notatkę nauczyciela można zarchiwizować | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2364) | `teacher`, `edit`, `notes` |
| EDIT-31 | EDIT-31: anulowanie nie zapisuje nowej notatki nauczyciela | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2426) | `teacher`, `edit`, `notes`, `cancel` |
| EDIT-32 | EDIT-32: zapisana notatka posiada autora i datę | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2494) | `teacher`, `edit`, `notes` |
| EDIT-33 | EDIT-33: notatka nauczyciela ma limit 220 znaków | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2557) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-34 | EDIT-34: pusta notatka nauczyciela nie jest zapisywana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2625) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-35 | EDIT-35: zgoda Marketing jest trwała | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2749) | `teacher`, `edit`, `rodo` |
| EDIT-36 | EDIT-36: zaznaczenie zgody E-mail automatycznie zaznacza Marketing | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2793) | `teacher`, `edit`, `rodo` |
| EDIT-37 | EDIT-37: zaznaczenie zgody Telefon automatycznie zaznacza Marketing | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2853) | `teacher`, `edit`, `rodo` |
| EDIT-38 | EDIT-38: wszystkie zgody RODO można zapisać jednocześnie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2911) | `teacher`, `edit`, `rodo` |
| EDIT-39 | EDIT-39: odznaczenie zgody Marketing pokazuje ostrzeżenie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L2953) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-40 | EDIT-40: odznaczenie Marketing automatycznie odznacza E-mail i Telefon | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3041) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-41 | EDIT-41: zapis bez żadnej zgody RODO pokazuje ostrzeżenie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3166) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-42 | EDIT-42: dropdown Źródło RODO zawiera oczekiwane wartości | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3216) | `teacher`, `edit`, `rodo` |
| EDIT-43 | EDIT-43: ponowny zapis już znormalizowanych danych bez zmian nie modyfikuje danych ani historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3286) | `teacher`, `edit` |
| EDIT-44 | EDIT-44: anulowanie wielu zmian zachowuje poprzednie dane i historię | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3410) | `teacher`, `edit`, `cancel` |
| EDIT-45 | EDIT-45: zmienione dane są trwałe po przejściu do szkoły i powrocie | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3457) | `teacher`, `edit`, `navigation` |
| EDIT-46 | EDIT-46: edycja danych nauczyciela nie usuwa relacji ze szkołą | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3505) | `teacher`, `edit`, `relation` |
| EDIT-47 | EDIT-47: jednoczesna zmiana wielu pól tworzy komplet wpisów historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L3560) | `teacher`, `edit`, `history` |
| EDIT-03 | EDIT-03: zapis nazwiska jest trwały i widoczny w historii | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L4) | `teacher`, `edit` |
| TEA-04 | TEA-04: niepoprawny e-mail blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L42) | `teacher`, `validation` |
| TEA-04 | TEA-04: niepoprawny telefon blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L42) | `teacher`, `validation` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Email | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L85) | `teacher`, `search` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Nazwisko | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L85) | `teacher`, `search` |
| REL-02 | REL-02: druga szkoła zachowuje pierwszą relację i pokazuje nauczyciela w obu szkołach | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L114) | `teacher`, `relation` |
| MED-YEAR-PREP | MED-YEAR-PREP: przygotuj snapshot 4 szkół referencyjnych i 50 losowych szkół | [szkola-medalowosc-annual.spec.ts](../../tests/szkola-medalowosc-annual.spec.ts#L59) | `annual-medal` |
| MED-YEAR-01 | MED-YEAR-01: roczne przeliczenie ustawia oczekiwany medal na podstawie snapshotu | [szkola-medalowosc-annual.spec.ts](../../tests/szkola-medalowosc-annual.spec.ts#L173) | `annual-medal` |
| MED-01 | MED-01: szkoła ze złotym medalem wyświetla wartość Złoto w danych podstawowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L37) | — |
| MED-02 | MED-02: pole Medal dla szkoły ze złotym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L47) | — |
| MED-03 | MED-03: najechanie na złoty medal wyświetla informację o przedmiotach składających się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L56) | — |
| MED-04 | MED-04: tooltip złotego medalu wyświetla przedmioty składające się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L67) | — |
| MED-05 | MED-05: złoty medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L79) | — |
| MED-06 | MED-06: szkoła ze srebrnym medalem wyświetla wartość Srebro w danych podstawowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L88) | — |
| MED-07 | MED-07: pole Medal dla szkoły ze srebrnym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L98) | — |
| MED-08 | MED-08: najechanie na srebrny medal wyświetla informację o przedmiotach składających się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L107) | — |
| MED-09 | MED-09: tooltip srebrnego medalu wyświetla przedmioty składające się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L118) | — |
| MED-10 | MED-10: srebrny medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L130) | — |
| MED-11 | MED-11: szkoła z brązowym medalem wyświetla wartość Brąz w danych podstawowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L139) | — |
| MED-12 | MED-12: pole Medal dla szkoły z brązowym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L149) | — |
| MED-13 | MED-13: najechanie na brązowy medal wyświetla informację o przedmiotach składających się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L158) | — |
| MED-14 | MED-14: tooltip brązowego medalu wyświetla przedmiot składający się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L169) | — |
| MED-15 | MED-15: brązowy medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L181) | — |
| MED-16 | MED-16: szkoła bez medalu wyświetla wartość Brak w danych podstawowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L190) | — |
| MED-17 | MED-17: pole Medal dla szkoły bez medalu jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L200) | — |
| MED-18 | MED-18: najechanie na wartość Brak nie wyświetla tooltipa z przedmiotami | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L209) | — |
| MED-19 | MED-19: wartość Brak jest widoczna w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L220) | — |
| MED-20 | MED-20: historia zmian szkoły zawiera wpis dotyczący złotego medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L229) | — |
| MED-21 | MED-21: historia zawiera tylko jeden wpis medalowy dla danego roku szkolnego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L264) | — |
| MED-22 | MED-22: wartość wpisu medalowego ma format RRRR/RRRR Medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L299) | — |
| MED-23 | MED-23: wpisy medalowe w historii mają źródło Formularz klubowy | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L322) | — |
| MED-24 | MED-24: wpisy medalowe w historii mają uzupełnionego autora | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L345) | — |
| MED-25 | MED-25: wpisy medalowe w historii są zapisane z datą 1 października | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L366) | — |
| MED-26 | MED-26: wpisy medalowe w historii są posortowane od najnowszego sezonu do najstarszego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L390) | — |
| MED-27 | MED-27: wyszukiwanie po Medal = Złoto zwraca tylko szkoły ze złotym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L436) | — |
| MED-28 | MED-28: wyszukiwanie po Medal = Srebro zwraca tylko szkoły ze srebrnym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L446) | — |
| MED-29 | MED-29: wyszukiwanie po Medal = Brąz zwraca tylko szkoły z brązowym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L456) | — |
| MED-30 | MED-30: wyszukiwanie po Medal = Brak zwraca tylko szkoły bez medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L466) | — |
| MED-31 | MED-31: wyszukiwanie po Medal = Złoto i Srebro zwraca szkoły z oboma wybranymi medalami | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L474) | — |
| MED-32 | MED-32: API zwraca złoty medal i właściwe przedmioty dla szkoły | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L484) | — |
| MED-33 | MED-33: przedmioty złotego medalu w UI są zgodne z danymi zwracanymi przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L501) | — |
| MED-34 | MED-34: wartość złotego medalu w UI jest zgodna z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L519) | — |
| MED-35 | MED-35: API zwraca srebrny medal i właściwe przedmioty dla szkoły | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L536) | — |
| MED-36 | MED-36: przedmioty srebrnego medalu w UI są zgodne z danymi zwracanymi przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L553) | — |
| MED-37 | MED-37: wartość srebrnego medalu w UI jest zgodna z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L571) | — |
| MED-38 | MED-38: API zwraca brązowy medal i właściwe przedmioty dla szkoły | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L588) | — |
| MED-39 | MED-39: przedmioty brązowego medalu w UI są zgodne z danymi zwracanymi przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L605) | — |
| MED-40 | MED-40: wartość brązowego medalu w UI jest zgodna z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L623) | — |
| MED-41 | MED-41: API zwraca Brak i pustą listę przedmiotów dla szkoły bez medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L640) | — |
| MED-42 | MED-42: wartość Brak w UI jest zgodna z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L658) | — |
| MED-43 | MED-43: brak przedmiotów w API jest zgodny z brakiem tooltipa w UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L673) | — |
| MED-44 | MED-44: medal szkoły jest zgodny z liczbą przedmiotów zwracanych przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L690) | — |
| MED-45 | MED-45: lista przedmiotów wpływających na medal nie zawiera duplikatów | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L716) | — |
| MED-46 | MED-46: wielu nauczycieli MAT SP nie zwiększa liczby przedmiotów medalowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L737) | — |
| MED-47 | MED-47: medal w wynikach wyszukiwania szkoły jest zgodny z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L767) | — |
| MED-48 | MED-48: przedmioty nauczycieli nie są automatycznie zaliczane do medalowości szkoły | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L794) | — |
| MED-49 | MED-49: najnowszy wpis historii medalu jest zgodny z aktualną wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L857) | — |
| MED-50 | MED-50: historia medalowości zawiera maksymalnie jeden wpis dla każdego roku szkolnego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L919) | — |
| MED-51 | MED-51: wszystkie wpisy historii medalowości mają źródło Formularz klubowy | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L969) | — |
| MED-52 | MED-52: data wpisu medalowości przypada na 1 października roku kończącego sezon | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1005) | — |
| MED-53 | MED-53: wszystkie wpisy historii medalowości są zapisane przez automat | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1049) | — |
| MED-54 | MED-54: wyszukiwanie po ID szkoły ma priorytet nad filtrem medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1085) | — |
| MED-55 | MED-55: filtrowanie bez ID zwraca tylko szkoły z wybranym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1156) | — |
| MED-56 | MED-56: multiselect medalu jest poprawnie przekazywany do API i zwraca tylko wybrane medale | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1193) | — |
| MED-60 | MED-60: każda szkoła z medalem Brak nie ma przedmiotów medalowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1365) | — |
| — | szkoła → nauczyciel → relacja → wyszukiwanie → nauczyciel → historia | [szkola-nauczyciel.spec.ts](../../tests/szkola-nauczyciel.spec.ts#L7) | `smoke` |
| TEA-02 | TEA-02: brak pola imię blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola nazwisko blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola szkoła blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola kontakt blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-03 | TEA-03: anulowanie kompletnego formularza nie tworzy nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L48) | `cancel` |
| SCH-02 | SCH-02: anulowanie kompletnego formularza nie tworzy szkoły | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L63) | `cancel` |
| EDIT-02 | EDIT-02: anulowanie edycji zachowuje dane i historię | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L73) | `cancel` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — teacher | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L110) | `search` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — school | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L110) | `search` |
| ORD-01 | ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L13) | `school`, `order` |
| ORD-02 | ORD-02: zamówienie szkoły z dwoma produktami zachowuje produkty i ilości po ponownym otwarciu | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L42) | `school`, `order` |
| ORD-03 | ORD-03: edycja ilości dwóch produktów w zamówieniu i usunięcie zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L101) | `school`, `order` |
