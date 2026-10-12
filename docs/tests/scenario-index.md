# Indeks scenariuszy

> Plik generowany automatycznie przez `npm run docs:scenarios`. Nie edytuj tabeli ręcznie.

Łącznie: **422 scenariuszy**.

| ID | Scenariusz | Plik | Tagi |
|---|---|---|---|
| CLUB-30 | CLUB-30: odznaczenie opcji wszystkich klas NASZYCH czyści cały wybór | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L42) | `teacher`, `club`, `classes` |
| CLUB-31 | CLUB-31: odznaczenie opcji wszystkich klas OBCYCH czyści cały wybór | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L63) | `teacher`, `club`, `classes` |
| CLUB-32 | CLUB-32: edycja zmienia klasę NASZĄ na OBCĄ i zachowuje wydawnictwo | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L86) | `teacher`, `club`, `edit` |
| CLUB-33 | CLUB-33: klasa OBCA bez wydawnictwa blokuje utworzenie formularza | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L115) | `teacher`, `club`, `publisher`, `validation` |
| CLUB-34 | CLUB-34: zmianę wydawnictwa klasy OBCEJ można zapisać podczas edycji | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L140) | `teacher`, `club`, `publisher`, `edit` |
| CLUB-35 | CLUB-35: usunięcie ostatniej klasy OBCEJ zachowuje klasę NASZĄ | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L168) | `teacher`, `club`, `publisher`, `edit` |
| CLUB-36 | CLUB-36: edycja może dodać kolejną klasę NASZĄ bez utraty poprzedniej | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L195) | `teacher`, `club`, `classes`, `edit` |
| CLUB-37 | CLUB-37: zmiana przedmiotu nie przenosi klas wybranych dla Matematyki do Fizyki | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L220) | `teacher`, `club`, `subject`, `classes` |
| CLUB-38 | CLUB-38: ta sama szkoła i rok mogą mieć osobne potwierdzenia Matematyki i Fizyki | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L245) | `teacher`, `club`, `subject` |
| CLUB-39 | CLUB-39: usuniętego formularza klubowego nie można edytować | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L280) | `teacher`, `club`, `delete`, `validation` |
| CLUB-40 | CLUB-40: po usunięciu można utworzyć nowe potwierdzenie dla tej samej szkoły, roku i przedmiotu | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L309) | `teacher`, `club`, `delete` |
| CLUB-41 | CLUB-41: usunięte potwierdzenie można przywrócić, gdy nie istnieje inne aktywne potwierdzenie | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L355) | `teacher`, `club`, `restore`, `history` |
| CLUB-42 | CLUB-42: aktywne potwierdzenie dla tego samego roku, przedmiotu i szkoły blokuje przywrócenie | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L387) | `teacher`, `club`, `restore`, `validation` |
| CLUB-43 | CLUB-43: przywrócenie zachowuje wszystkie wcześniej wybrane klasy NASZE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L430) | `teacher`, `club`, `restore`, `classes` |
| CLUB-44 | CLUB-44: przywrócenie zachowuje klasę OBCĄ i wydawnictwo | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L463) | `teacher`, `club`, `restore`, `publisher` |
| CLUB-45 | CLUB-45: aktywne potwierdzenie innego przedmiotu nie blokuje przywrócenia | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L491) | `teacher`, `club`, `restore`, `subject` |
| CLUB-46 | CLUB-46: nowsze potwierdzenie blokuje przywrócenie starszego dla tego samego przedmiotu, poziomu i szkoły | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L528) | `teacher`, `club`, `restore`, `school-year`, `validation` |
| CLUB-47 | CLUB-47: aktywne potwierdzenie innej szkoły nie blokuje przywrócenia | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L576) | `teacher`, `club`, `restore`, `school` |
| CLUB-48 | CLUB-48: przywrócone potwierdzenie można edytować | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L621) | `teacher`, `club`, `restore`, `edit` |
| CLUB-49 | CLUB-49: edycja, weryfikacja negatywna, usunięcie i historia wymagają wybranego potwierdzenia | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L653) | `teacher`, `club`, `actions` |
| CLUB-50 | CLUB-50: weryfikacja negatywna zmienia klasę NASZĄ na OBCĄ z wydawnictwem INNE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L683) | `teacher`, `club`, `negative-verification`, `history` |
| CLUB-51 | CLUB-51: weryfikacja negatywna zmienia wszystkie klasy NASZE na OBCE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L725) | `teacher`, `club`, `negative-verification`, `classes` |
| CLUB-52 | CLUB-52: potwierdzenie zweryfikowane negatywnie można zmienić z powrotem na NASZE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L752) | `teacher`, `club`, `negative-verification`, `edit` |
| CLUB-01 | CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L26) | `teacher`, `club`, `history` |
| CLUB-02 | CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L124) | `teacher`, `club`, `history` |
| CLUB-03 | CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L194) | `teacher`, `club` |
| CLUB-04 | CLUB-04: formularz klubowy zachowuje kilka klas 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L225) | `teacher`, `club` |
| CLUB-05 | CLUB-05: zaznaczenie wszystkich klas Matematyka/SP wybiera 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L262) | `teacher`, `club` |
| CLUB-06 | CLUB-06: edycja usuwa tylko wskazaną klasę 5 z zestawu 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L302) | `teacher`, `club` |
| CLUB-07 | CLUB-07: formularz klubowy dotyczy tylko wybranej szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L340) | `teacher`, `club` |
| CLUB-08 | CLUB-08: formularz klubowy obsługuje dwie szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L387) | `teacher`, `club` |
| CLUB-09 | CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L47) | `teacher`, `club`, `cancel` |
| CLUB-10 | CLUB-10: anulowanie edycji zachowuje klasę 4 | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L78) | `teacher`, `club`, `cancel` |
| CLUB-11 | CLUB-11: formularz klubowy można usunąć | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L120) | `teacher`, `club`, `delete` |
| CLUB-12A | CLUB-12A: brak szkoły blokuje utworzenie formularza klubowego | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L317) | `teacher`, `club`, `validation` |
| CLUB-12B | CLUB-12B: brak klasy blokuje utworzenie formularza klubowego | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L424) | `teacher`, `club`, `validation` |
| CLUB-13 | CLUB-13: formularz klubowy poprawnie prezentuje wszystkie OBCE wydawnictwa | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L536) | `teacher`, `club`, `publisher` |
| CLUB-14 | CLUB-14: nowy formularz ma domyślnie wybrany bieżący rok szkolny | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L590) | `teacher`, `club`, `defaults` |
| CLUB-15 | CLUB-15: formularz pokazuje wszystkie szkoły i przedmioto-poziomy nauczyciela | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L606) | `teacher`, `club`, `defaults` |
| CLUB-16 | CLUB-16: klasy można wybierać wyłącznie dla zaznaczonej szkoły | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L633) | `teacher`, `club`, `school` |
| CLUB-17 | CLUB-17: odznaczenie szkoły usuwa wybrane dla niej klasy | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L653) | `teacher`, `club`, `school` |
| CLUB-18 | CLUB-18: standardowa klasa nie może być jednocześnie NASZA i OBCA | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L674) | `teacher`, `club`, `classes`, `validation` |
| CLUB-19 | CLUB-19: zaznaczenie klasy OBCEJ blokuje tę samą klasę NASZĄ | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L692) | `teacher`, `club`, `classes` |
| CLUB-20 | CLUB-20: różne klasy mogą być jednocześnie NASZE i OBCE | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L710) | `teacher`, `club`, `classes` |
| CLUB-21 | CLUB-21: Fizyka pozwala zaznaczyć dwie NASZE serie tej samej klasy | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L730) | `teacher`, `club`, `physics` |
| CLUB-22 | CLUB-22: zaznaczenie wszystkich NASZYCH klas Fizyki obejmuje obie serie | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L751) | `teacher`, `club`, `physics` |
| CLUB-23 | CLUB-23: Matematyka SŚ pozwala zaznaczyć równocześnie wszystkie klasy NASZE i OBCE | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L775) | `teacher`, `club`, `math-secondary` |
| CLUB-24 | CLUB-24: wszystkie klasy Matematyki SŚ są trwałe po ponownym otwarciu | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L802) | `teacher`, `club`, `math-secondary` |
| CLUB-25 | CLUB-25: Fizyka zapisuje wszystkie NASZE klasy obu serii | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L840) | `teacher`, `club`, `physics` |
| CLUB-26 | CLUB-26: usunięcie wszystkich klas podczas edycji blokuje zapis | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L869) | `teacher`, `club`, `edit`, `validation` |
| CLUB-27 | CLUB-27: istniejące potwierdzenie blokuje duplikat dla tego samego roku, przedmiotu i szkoły | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L902) | `teacher`, `club`, `duplicate`, `validation` |
| CLUB-28 | CLUB-28: formularz dla poprzedniego roku szkolnego jest trwały | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L941) | `teacher`, `club`, `school-year` |
| CLUB-29 | CLUB-29: potwierdzenia dla tej samej szkoły i przedmiotu mogą dotyczyć dwóch różnych lat | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L971) | `teacher`, `club`, `school-year` |
| CLUB-53 | CLUB-53: potwierdzenie zweryfikowane negatywnie można usunąć | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L63) | `teacher`, `club`, `negative-verification`, `delete`, `history` |
| CLUB-54 | CLUB-54: edycja Matematyki nie zmienia potwierdzenia Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L90) | `teacher`, `club`, `multi-subject`, `edit` |
| CLUB-55 | CLUB-55: weryfikacja negatywna Matematyki nie zmienia Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L136) | `teacher`, `club`, `multi-subject`, `negative-verification` |
| CLUB-56 | CLUB-56: usunięcie i przywrócenie Matematyki nie zmienia aktywnej Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L184) | `teacher`, `club`, `multi-subject`, `delete`, `restore` |
| CLUB-57 | CLUB-57: dwie szkoły i dwa przedmioty tworzą cztery niezależne potwierdzenia | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L234) | `teacher`, `club`, `multi-subject`, `multi-school` |
| CLUB-58 | CLUB-58: Matematyka i Fizyka zachowują niezależne potwierdzenia dla dwóch lat szkolnych | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L292) | `teacher`, `club`, `multi-subject`, `school-year` |
| CLUB-59 | CLUB-59: mieszany cykl życia Matematyki i Fizyki zachowuje niezależne statusy i historie | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L358) | `teacher`, `club`, `multi-subject`, `negative-verification`, `delete`, `restore`, `history` |
| CLUB-60 | CLUB-60: nowsze potwierdzenie blokuje późniejsze dodanie starszego dla tej samej szkoły i przedmiotu | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L419) | `teacher`, `club`, `school-year`, `validation` |
| CLUB-61 | CLUB-61: Język polski pozwala zapisać tylko jedną NASZĄ serię klasy 4 | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L462) | `teacher`, `club`, `polish`, `classes`, `validation` |
| CLUB-62 | CLUB-62: formularz WSPOM tworzy potwierdzenie i funkcję nauczyciela wspomagającego | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L507) | `teacher`, `club`, `supporting` |
| CLUB-63 | CLUB-63: jeden formularz WSPOM zapisuje Język polski i Matematykę niezależnie | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L533) | `teacher`, `club`, `supporting`, `multi-subject` |
| CLUB-64 | CLUB-64: dwa szybkie kliknięcia Zapisz nie tworzą dwóch potwierdzeń | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L580) | `teacher`, `club`, `concurrency` |
| CLUB-65 | CLUB-65: zaznaczenie wszystkich klas OBCYCH Matematyki SP jest trwałe | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L608) | `teacher`, `club`, `classes`, `publisher`, `select-all` |
| CLUB-66 | CLUB-66: edycja Języka polskiego nie pozwala zapisać dwóch NASZYCH serii klasy 4 | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L643) | `teacher`, `club`, `polish`, `edit`, `validation` |
| CLUB-67 | CLUB-67: zaznaczenie wszystkich NASZYCH klas Języka polskiego wybiera tylko jedną serię klasy 4 | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L687) | `teacher`, `club`, `polish`, `classes`, `select-all` |
| CLUB-68 | CLUB-68: formularz WSPOM nie pokazuje serii Języka polskiego ani Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L733) | `teacher`, `club`, `supporting`, `polish`, `physics`, `classes` |
| CLUB-69 | CLUB-69: formularz WSPOM poprawnie prezentuje wszystkie OBCE wydawnictwa | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L773) | `teacher`, `club`, `supporting`, `publisher` |
| CLUB-70 | CLUB-70: formularz WSPOM wymaga szkoły, przedmiotu i klasy | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L831) | `teacher`, `club`, `supporting`, `validation` |
| CLUB-71 | CLUB-71: zwykłe potwierdzenie i WSPOM współistnieją dla tego samego przedmiotu, szkoły i roku | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L864) | `teacher`, `club`, `supporting`, `duplicate` |
| ADD-01 | ADD-01: nauczyciela można utworzyć z imieniem, nazwiskiem, szkołą i e-mailem bez przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L84) | `teacher`, `add`, `positive` |
| ADD-02 | ADD-02: nauczyciela można utworzyć z telefonem bez e-maila | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L219) | `teacher`, `add`, `positive` |
| ADD-03 | ADD-03: dzisiejsza data urodzenia jest akceptowana | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L321) | `teacher`, `add`, `birthdate` |
| ADD-04 | ADD-04: źródło domyślne to Karta nauczyciela i lista zawiera trzy wartości | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L426) | `teacher`, `add`, `source` |
| ADD-05 | ADD-05: nauczyciela można utworzyć ze źródłem Karta LS | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L475) | `teacher`, `add`, `source` |
| ADD-06 | ADD-06: zgoda E-mail może być zaznaczona bez zgody Marketing | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L511) | `teacher`, `add`, `rodo` |
| ADD-07 | ADD-07: zgoda Telefon może być zaznaczona bez zgody Marketing | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L599) | `teacher`, `add`, `rodo` |
| ADD-08 | ADD-08: nauczyciela ze źródłem Karta LS można utworzyć bez żadnej zgody RODO | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L688) | `teacher`, `add`, `rodo` |
| ADD-09 | ADD-09: nauczyciela można utworzyć z dwiema szkołami | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L736) | `teacher`, `add`, `school` |
| ADD-10 | ADD-10: szkołę można usunąć przed zapisaniem nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L775) | `teacher`, `add`, `school` |
| ADD-11 | ADD-11: nauczyciela można utworzyć z przedmioto-poziomem Matematyka SP | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L828) | `teacher`, `add`, `subject` |
| ADD-12 | ADD-12: nauczyciela można utworzyć z wieloma przedmioto-poziomami | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L857) | `teacher`, `add`, `subject` |
| ADD-13 | ADD-13: dodawanie nauczyciela zachowuje wielkość liter i akceptuje znak _ | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L896) | `teacher`, `add`, `name` |
| ADD-14 | ADD-14: Pokaż przy podobnej osobie zamyka formularz i otwiera istniejącego nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L989) | `teacher`, `add`, `duplicate` |
| ADD-15 | ADD-15: brak pola imię blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1047) | `teacher`, `add`, `validation` |
| ADD-16 | ADD-16: brak pola nazwisko blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1047) | `teacher`, `add`, `validation` |
| ADD-17 | ADD-17: brak pola szkoła blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1047) | `teacher`, `add`, `validation` |
| ADD-18 | ADD-18: brak e-maila i telefonu blokuje utworzenie nauczyciela po potwierdzeniu braku przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1101) | `teacher`, `add`, `validation` |
| ADD-19 | ADD-19: wybranie Nie przy ostrzeżeniu o braku przedmioto-poziomu pozostawia formularz otwarty | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1148) | `teacher`, `add`, `validation` |
| ADD-20.1 | ADD-20.1: niepoprawny e-mail "test" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1198) | `teacher`, `add`, `email`, `validation` |
| ADD-20.2 | ADD-20.2: niepoprawny e-mail "test@" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1198) | `"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.3 | ADD-20.3: niepoprawny e-mail "@example.pl" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1198) | `example.pl"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.4 | ADD-20.4: niepoprawny e-mail "a b@example.pl" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1198) | `example.pl"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.5 | ADD-20.5: niepoprawny e-mail "a@" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1198) | `"`, `teacher`, `add`, `email`, `validation` |
| ADD-21 | ADD-21: e-mail używany przez innego nauczyciela blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1236) | `teacher`, `add`, `email`, `validation` |
| ADD-22 | ADD-22: telefon krótszy niż 9 cyfr blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1349) | `teacher`, `add`, `phone`, `validation` |
| ADD-23 | ADD-23: pole telefonu nie pozwala wprowadzić więcej niż 9 cyfr | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1449) | `teacher`, `add`, `phone` |
| ADD-24 | ADD-24: przyszła data urodzenia blokuje zapis nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1492) | `teacher`, `add`, `birthdate`, `validation` |
| ADD-25 | ADD-25: nauczyciela można utworzyć bez daty urodzenia | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1522) | `teacher`, `add`, `birthdate`, `positive` |
| ADD-27 | ADD-27: brak poziomu blokuje dodanie przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1689) | `teacher`, `add`, `subject`, `validation` |
| ADD-28 | ADD-28: brak przedmiotu blokuje dodanie przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1783) | `teacher`, `add`, `subject`, `validation` |
| ADD-29 | ADD-29: tego samego przedmioto-poziomu nie można dodać dwa razy | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1870) | `teacher`, `add`, `subject`, `validation` |
| ADD-30 | ADD-30: anulowanie kompletnego formularza nie tworzy nauczyciela ani relacji ze szkołą | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1960) | `teacher`, `add`, `cancel` |
| EDIT-24 | EDIT-24: poprawna data urodzenia jest trwała | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L17) | `teacher`, `edit` |
| EDIT-25 | EDIT-25: niepoprawna data urodzenia blokuje zapis | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L60) | `teacher`, `edit`, `validation` |
| EDIT-26 | EDIT-26: pełny adres prywatny można dodać i jest zapisany w historii | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L106) | `teacher`, `edit`, `history` |
| EDIT-27 | EDIT-27: wszystkie dane istniejącego adresu prywatnego można zmienić | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L227) | `teacher`, `edit`, `history` |
| EDIT-43 | EDIT-43: ponowny zapis już znormalizowanych danych bez zmian nie modyfikuje danych ani historii | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L15) | `teacher`, `edit` |
| EDIT-44 | EDIT-44: anulowanie wielu zmian zachowuje poprzednie dane i historię | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L139) | `teacher`, `edit`, `cancel` |
| EDIT-45 | EDIT-45: zmienione dane są trwałe po przejściu do szkoły i powrocie | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L184) | `teacher`, `edit`, `navigation` |
| EDIT-46 | EDIT-46: edycja danych nauczyciela nie usuwa relacji ze szkołą | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L232) | `teacher`, `edit`, `relation` |
| EDIT-47 | EDIT-47: jednoczesna zmiana wielu pól tworzy komplet wpisów historii | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L277) | `teacher`, `edit`, `history` |
| EDIT-12 | EDIT-12: poprawny e-mail można zmienić i zmiana jest widoczna w historii | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L28) | `teacher`, `edit` |
| EDIT-13 | EDIT-13: niepoprawny e-mail blokuje zapis | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L201) | `teacher`, `edit`, `validation` |
| EDIT-14 | EDIT-14: poprawny telefon można dodać | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L357) | `teacher`, `edit` |
| EDIT-15 | EDIT-15: można dodać drugi numer telefonu | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L471) | `teacher`, `edit` |
| EDIT-16 | EDIT-16: przy dwóch telefonach nie można dodać trzeciego | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L538) | `teacher`, `edit` |
| EDIT-17 | EDIT-17: można usunąć zapisany numer telefonu | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L630) | `teacher`, `edit` |
| EDIT-18 | EDIT-18: anulowanie usunięcia telefonu nie zmienia danych | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L779) | `teacher`, `edit` |
| EDIT-19 | EDIT-19: niepoprawny telefon blokuje dodanie | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L901) | `teacher`, `edit`, `validation` |
| EDIT-20 | EDIT-20: nauczyciel może pozostać bez e-maila jeśli posiada telefon | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1005) | `teacher`, `edit` |
| EDIT-21 | EDIT-21: nauczyciel może istnieć bez telefonu jeśli posiada e-mail | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1090) | `teacher`, `edit` |
| EDIT-22 | EDIT-22: brak e-maila i telefonu wymaga dodatkowego potwierdzenia | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1129) | `teacher`, `edit`, `validation` |
| EDIT-23 | EDIT-23: można usunąć e-mail bez telefonu po potwierdzeniu ostrzeżenia o rekordzie minimalnym | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1186) | `teacher`, `edit`, `validation` |
| EDIT-28 | EDIT-28: uwagi nauczyciela są trwałe | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L17) | `teacher`, `edit` |
| EDIT-29 | EDIT-29: nauczyciel może posiadać wiele notatek | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L138) | `teacher`, `edit`, `notes` |
| EDIT-30 | EDIT-30: notatkę nauczyciela można zarchiwizować | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L201) | `teacher`, `edit`, `notes` |
| EDIT-31 | EDIT-31: anulowanie nie zapisuje nowej notatki nauczyciela | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L263) | `teacher`, `edit`, `notes`, `cancel` |
| EDIT-32 | EDIT-32: zapisana notatka posiada autora i datę | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L331) | `teacher`, `edit`, `notes` |
| EDIT-33 | EDIT-33: notatka nauczyciela ma limit 220 znaków | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L394) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-34 | EDIT-34: pusta notatka nauczyciela nie jest zapisywana | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L462) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-35 | EDIT-35: zgoda Marketing jest trwała | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L19) | `teacher`, `edit`, `rodo` |
| EDIT-36 | EDIT-36: zaznaczenie zgody E-mail automatycznie zaznacza Marketing | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L61) | `teacher`, `edit`, `rodo` |
| EDIT-37 | EDIT-37: zaznaczenie zgody Telefon automatycznie zaznacza Marketing | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L119) | `teacher`, `edit`, `rodo` |
| EDIT-38 | EDIT-38: wszystkie zgody RODO można zapisać jednocześnie | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L175) | `teacher`, `edit`, `rodo` |
| EDIT-39 | EDIT-39: odznaczenie zgody Marketing pokazuje ostrzeżenie | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L215) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-40 | EDIT-40: odznaczenie Marketing automatycznie odznacza E-mail i Telefon | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L303) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-41 | EDIT-41: zapis bez żadnej zgody RODO pokazuje ostrzeżenie | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L428) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-42 | EDIT-42: dropdown Źródło RODO zawiera oczekiwane wartości | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L476) | `teacher`, `edit`, `rodo` |
| EDIT-04 | EDIT-04: zmiana imienia jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L13) | `teacher`, `edit` |
| EDIT-05 | EDIT-05: zmiana nazwiska jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L81) | `teacher`, `edit` |
| EDIT-06 | EDIT-06: jednoczesna zmiana imienia i nazwiska zapisuje oba pola | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L118) | `teacher`, `edit` |
| EDIT-07 | EDIT-07: wielkość liter imienia jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L166) | `teacher`, `edit`, `normalization` |
| EDIT-08 | EDIT-08: wielkość liter nazwiska jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L201) | `teacher`, `edit`, `normalization` |
| EDIT-09 | EDIT-09: nazwisko z łącznikiem można zapisać | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L230) | `teacher`, `edit` |
| EDIT-10 | EDIT-10: puste imię blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L265) | `teacher`, `edit`, `validation` |
| EDIT-11 | EDIT-11: puste nazwisko blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L309) | `teacher`, `edit`, `validation` |
| EDIT-03 | EDIT-03: zapis nazwiska jest trwały i widoczny w historii | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L4) | `teacher`, `edit` |
| TEA-04 | TEA-04: niepoprawny e-mail blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L42) | `teacher`, `validation` |
| TEA-04 | TEA-04: niepoprawny telefon blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L42) | `teacher`, `validation` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Email | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L85) | `teacher`, `search` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Nazwisko | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L85) | `teacher`, `search` |
| REL-02 | REL-02: druga szkoła zachowuje pierwszą relację i pokazuje nauczyciela w obu szkołach | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L123) | `teacher`, `relation` |
| SCH-03 | SCH-03: minimalny poprawny formularz tworzy szkołę | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L79) | `school`, `school-add`, `positive` |
| SCH-04 | SCH-04: brak nazwy blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L98) | `school`, `school-add`, `validation` |
| SCH-05 | SCH-05: brak typu blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L112) | `school`, `school-add`, `validation` |
| SCH-06 | SCH-06: brak adresu blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L126) | `school`, `school-add`, `validation`, `address` |
| SCH-09 | SCH-09: anulowanie adresu nie przenosi danych do formularza szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L139) | `school`, `school-add`, `address`, `cancel` |
| SCH-10 | SCH-10: dwa szybkie kliknięcia Zapisz tworzą tylko jedną szkołę | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L169) | `school`, `school-add`, `concurrency` |
| SCH-11 | SCH-11: dane szkoły są trwałe po ponownym otwarciu | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L187) | `school`, `school-add`, `positive` |
| SCH-12 | SCH-12: nową szkołę można znaleźć po nazwie i zidentyfikować po ID | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L205) | `school`, `school-add`, `search` |
| SCH-13 | SCH-13: słownik zawiera wszystkie obsługiwane typy szkół | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L229) | `school`, `school-add`, `dictionary` |
| SCH-14 | SCH-14: formularz tworzy liceum z właściwym typem | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L245) | `school`, `school-add`, `positive`, `school-type` |
| SCH-21 | SCH-21: formularz tworzy szkołę typu Technikum | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L262) | `school`, `school-add`, `positive`, `school-type` |
| SCH-22 | SCH-22: formularz tworzy szkołę typu Placówka doskonalenia nauczycieli | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L262) | `school`, `school-add`, `positive`, `school-type` |
| SCH-23 | SCH-23: formularz tworzy szkołę typu Zespół szkół | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L262) | `school`, `school-add`, `positive`, `school-type` |
| SCH-24 | SCH-24: formularz tworzy szkołę typu Szkoła NPC | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L262) | `school`, `school-add`, `positive`, `school-type` |
| SCH-25 | SCH-25: formularz tworzy szkołę typu Przedszkole | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L262) | `school`, `school-add`, `positive`, `school-type` |
| SCH-17 | SCH-17: nazwa złożona wyłącznie ze spacji nie pozwala utworzyć szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L287) | `school`, `school-add`, `validation` |
| SCH-18 | SCH-18: nazwa z polskimi znakami i interpunkcją jest zachowana | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L309) | `school`, `school-add`, `positive`, `name` |
| SCH-27 | SCH-27: spacje na brzegach nazwy są usuwane przy zapisie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L324) | `school`, `school-add`, `positive`, `name` |
| SCH-28 | SCH-28: identyczna nazwa i adres mogą utworzyć dwa różne rekordy | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L340) | `school`, `school-add`, `positive`, `duplicate` |
| SCH-29 | SCH-29: identyczna nazwa pod różnymi adresami tworzy dwa różne rekordy | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L364) | `school`, `school-add`, `positive`, `duplicate` |
| SCH-07 | SCH-07: poprawny kod pocztowy pozwala wybrać miejscowość i zapisać adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L398) | `school`, `school-add`, `address` |
| SCH-08 | SCH-08: nieznany kod pocztowy blokuje zapis adresu i szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L422) | `school`, `school-add`, `validation`, `address` |
| SCH-19 | SCH-19: numer budynku z literą jest zachowany w adresie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L461) | `school`, `school-add`, `address` |
| SCH-20 | SCH-20: wyczyszczenie wyszukiwania adresu usuwa wpisane kryteria | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L482) | `school`, `school-add`, `address`, `clear` |
| SCH-26 | SCH-26: numer budynku z separatorem jest zachowany po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L504) | `school`, `school-add`, `positive`, `address` |
| SCH-41 | SCH-41: brak numeru budynku blokuje zapis adresu i szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L519) | `school`, `school-add`, `validation`, `address` |
| SCH-43 | SCH-43: pełny adres z ulicą jest zachowany po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L544) | `school`, `school-add`, `positive`, `address` |
| SCH-44 | SCH-44: wyczyszczenie wybranego adresu usuwa utworzony adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L575) | `school`, `school-add`, `validation`, `address`, `clear` |
| SCH-45 | SCH-45: ponowne dodanie adresu zastępuje adres przed utworzeniem szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L602) | `school`, `school-add`, `positive`, `address` |
| SCH-46 | SCH-46: anulowanie zmiany adresu zachowuje poprzedni adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L633) | `school`, `school-add`, `positive`, `address`, `cancel` |
| SCH-47 | SCH-47: wyczyszczenie adresu i anulowanie zachowuje poprzedni adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L657) | `school`, `school-add`, `positive`, `address`, `cancel`, `clear` |
| SCH-15 | SCH-15: usunięcie dodanego adresu ponownie blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L679) | `school`, `school-add`, `address`, `validation` |
| SCH-30 | SCH-30: nazwa z SIO jest zachowana po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L704) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-32 | SCH-32: liczba uczniów jest zachowana po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L720) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-33 | SCH-33: numer RSPO jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L738) | `school`, `school-add`, `positive`, `identifier` |
| SCH-34 | SCH-34: numer REGON jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L756) | `school`, `school-add`, `positive`, `identifier` |
| SCH-35 | SCH-35: numer NIP jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L774) | `school`, `school-add`, `positive`, `identifier` |
| SCH-51 | SCH-51: REGON z wiodącymi zerami zachowuje pełną długość | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L792) | `school`, `school-add`, `positive`, `identifier` |
| SCH-52 | SCH-52: NIP z wiodącymi zerami zachowuje pełną długość | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L810) | `school`, `school-add`, `positive`, `identifier` |
| SCH-49 | SCH-49: zerowa liczba uczniów jest zachowana | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L828) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-31 | SCH-31: WWW i e-mail są zachowane po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L850) | `school`, `school-add`, `positive`, `contact` |
| SCH-53 | SCH-53: pełny adres WWW ze ścieżką i parametrami jest zachowany | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L870) | `school`, `school-add`, `positive`, `contact` |
| SCH-54 | SCH-54: e-mail z wielkimi literami jest normalizowany do małych liter | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L887) | `school`, `school-add`, `positive`, `contact` |
| SCH-36 | SCH-36: przełącznik komórka ustawia format numeru i resetuje się po zapisie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L906) | `school`, `school-add`, `positive`, `contact` |
| SCH-37 | SCH-37: telefon stacjonarny zachowuje właściwy format po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L932) | `school`, `school-add`, `positive`, `contact` |
| SCH-38 | SCH-38: niepoprawny e-mail blokuje utworzenie szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L959) | `school`, `school-add`, `validation`, `contact` |
| SCH-39 | SCH-39: niepełny telefon blokuje utworzenie szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L976) | `school`, `school-add`, `validation`, `contact` |
| SCH-40 | SCH-40: przełączenie komórka zmienia maskę bez utraty cyfr | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L996) | `school`, `school-add`, `contact`, `format` |
| SCH-48 | SCH-48: e-mail z subdomeną jest zachowany | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1015) | `school`, `school-add`, `positive`, `contact` |
| SCH-50 | SCH-50: e-mail z aliasem plus jest odrzucany przez backend | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1032) | `school`, `school-add`, `validation`, `contact` |
| SCH-16 | SCH-16: błąd serwera nie otwiera nieistniejącej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1068) | `school`, `school-add`, `error-handling` |
| SCH-58 | SCH-58: HTTP 422 nie otwiera nieutworzonej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1107) | `school`, `school-add`, `error-handling` |
| SCH-59 | SCH-59: timeout sieci nie otwiera nieutworzonej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1107) | `school`, `school-add`, `error-handling` |
| SCH-42 | SCH-42: pełny formularz zachowuje wszystkie dane opcjonalne | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1142) | `school`, `school-add`, `positive`, `optional-data`, `contact`, `identifier` |
| SCH-55 | SCH-55: pola opcjonalne mogą pozostać puste i szkoła nadal jest trwała | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1198) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-56 | SCH-56: anulowanie kompletnego formularza po uzupełnieniu danych opcjonalnych nie tworzy szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1223) | `school`, `school-add`, `cancel`, `optional-data` |
| SCH-57 | SCH-57: ponowne otwarcie szkoły zachowuje typ, poziom i adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1239) | `school`, `school-add`, `positive`, `persistence` |
| SCH-EDIT-01 | SCH-EDIT-01: formularz edycji wczytuje nazwę szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L83) | `school`, `school-edit`, `smoke` |
| SCH-EDIT-02 | SCH-EDIT-02: anulowanie zmiany nazwy zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L98) | `school`, `school-edit`, `cancel` |
| SCH-EDIT-03 | SCH-EDIT-03: zmiana nazwy jest trwała po ponownym otwarciu szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L119) | `school`, `school-edit`, `positive` |
| SCH-EDIT-04 | SCH-EDIT-04: zmiana WWW i e-maila jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L142) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-05 | SCH-EDIT-05: zmiana nazwy z SIO jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L218) | `school`, `school-edit`, `positive`, `sio` |
| SCH-EDIT-06 | SCH-EDIT-06: anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L249) | `school`, `school-edit`, `cancel`, `sio` |
| SCH-EDIT-07 | SCH-EDIT-07: pusta nazwa nie pozwala zapisać edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L272) | `school`, `school-edit`, `validation` |
| SCH-EDIT-08 | SCH-EDIT-08: typ i poziom szkoły są nieedytowalne w edycji danych | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L302) | `school`, `school-edit`, `readonly` |
| SCH-EDIT-09 | SCH-EDIT-09: anulowanie edycji WWW zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L325) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-10 | SCH-EDIT-10: WWW można usunąć i pusta wartość jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L358) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-10A | SCH-EDIT-10A: rezygnacja z usunięcia WWW zachowuje poprzedni adres | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L393) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-11 | SCH-EDIT-11: e-mail można usunąć i pusta wartość jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L436) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-11A | SCH-EDIT-11A: anulowanie edycji e-maila zachowuje poprzedni adres | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L471) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-11B | SCH-EDIT-11B: rezygnacja z usunięcia e-maila zachowuje poprzedni adres | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L504) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-12 | SCH-EDIT-12: e-mail z wielkimi literami jest normalizowany po edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L543) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-13 | SCH-EDIT-13: nazwa z polskimi znakami i interpunkcją jest trwała po edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L586) | `school`, `school-edit`, `positive`, `name` |
| SCH-EDIT-14 | SCH-EDIT-14: spacje na brzegach nazwy są usuwane po edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L607) | `school`, `school-edit`, `positive`, `name` |
| SCH-EDIT-15 | SCH-EDIT-15: nazwę z SIO można wyczyścić | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L630) | `school`, `school-edit`, `positive`, `sio` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Szkoła podstawowa i poziom Szkoła Podstawowa są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Liceum i poziom Szkoła Średnia są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Technikum i poziom Szkoła Średnia są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Placówka doskonalenia nauczycieli i poziom Inny są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Zespół szkół i poziom Zespół Szkół są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Szkoła NPC i poziom Szkoła Podstawowa są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Przedszkole i poziom Przedszkole są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L685) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-17 | SCH-EDIT-17: kolejne edycje różnych pól nie nadpisują wcześniejszych zmian | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L705) | `school`, `school-edit`, `positive`, `regression` |
| SCH-EDIT-18 | SCH-EDIT-18: zmiana adresu szkoły jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L796) | `school`, `school-edit`, `positive`, `address` |
| SCH-EDIT-19 | SCH-EDIT-19: dane SIO i liczba uczniów można zmienić i ponownie odczytać | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L813) | `school`, `school-edit`, `positive`, `sio`, `identifier` |
| SCH-EDIT-20 | SCH-EDIT-20: drugi telefon stacjonarny można dodać po przełączeniu typu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L852) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-21 | SCH-EDIT-21: zmiana nazwy tworzy kompletny wpis historii szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L877) | `school`, `school-edit`, `history` |
| SCH-EDIT-22 | SCH-EDIT-22: HTTP 422 nie utrwala zmiany nazwy | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L911) | `school`, `school-edit`, `error-handling` |
| SCH-EDIT-23 | SCH-EDIT-23: HTTP 500 nie utrwala zmiany nazwy | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L911) | `school`, `school-edit`, `error-handling` |
| SCH-EDIT-24 | SCH-EDIT-24: timeout sieci nie utrwala zmiany nazwy | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L911) | `school`, `school-edit`, `error-handling` |
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
| — | szkoła → nauczyciel → relacja → wyszukiwanie → nauczyciel → historia | [szkola-nauczyciel.spec.ts](../../tests/szkola-nauczyciel.spec.ts#L8) | `smoke` |
| STR-01 | STR-01: szkoła bez relacji pokazuje pusty stan struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L70) | `school`, `structure`, `smoke` |
| STR-02 | STR-02: pusty stan blokuje filtrowanie struktury i pozwala dodać powiązanie | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L79) | `school`, `structure`, `validation` |
| STR-03 | STR-03: dialog dodawania zawiera filtry, obie tabele i akcje | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L96) | `school`, `structure`, `dialog` |
| STR-04 | STR-04: puste wyszukiwanie pokazuje walidację i pozostawia dialog otwarty | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L132) | `school`, `structure`, `negative` |
| STR-05 | STR-05: anulowanie pustego dialogu nie zmienia struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L143) | `school`, `structure`, `cancel` |
| STR-06 | STR-06: wyszukiwanie po dokładnym ID zwraca właściwą szkołę | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L156) | `school`, `structure`, `search` |
| STR-07 | STR-07: wyszukiwanie po pełnej nazwie zwraca właściwą szkołę | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L167) | `school`, `structure`, `search` |
| STR-08 | STR-08: wyszukiwanie po fragmencie nazwy zwraca pasującą szkołę | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L178) | `school`, `structure`, `search` |
| STR-09 | STR-09: wyszukiwanie po kodzie pocztowym zwraca zgodne adresy | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L197) | `school`, `structure`, `search` |
| STR-10 | STR-10: wyszukiwanie po miejscowości zwraca zgodne adresy | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L208) | `school`, `structure`, `search` |
| STR-11 | STR-11: wyszukiwanie po ulicy zwraca zgodne adresy | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L219) | `school`, `structure`, `search` |
| STR-12 | STR-12: wyszukiwanie łączy ID i nazwę szkoły | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L230) | `school`, `structure`, `search` |
| STR-13 | STR-13: nieistniejące ID pozostawia pustą tabelę wyników | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L241) | `school`, `structure`, `search`, `negative` |
| STR-14 | STR-14: szkołę można dodać do planowanych powiązań bez zapisu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L255) | `school`, `structure`, `positive` |
| STR-15 | STR-15: niezapisaną szkołę można usunąć z planowanych powiązań | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L269) | `school`, `structure`, `cancel` |
| STR-16 | STR-16: pojedyncze poprawne powiązanie wysyła jedno żądanie zapisu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L285) | `school`, `structure`, `api` |
| STR-17 | STR-17: trwałość relacji po ponownym otwarciu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L305) | `school`, `structure`, `persistence` |
| STR-18 | STR-18: anulowanie po dodaniu szkoły nie zachowuje planowanego powiązania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L325) | `school`, `structure`, `cancel` |
| STR-19 | STR-19: kilka szkół jest wysyłanych dokładnie raz w jednym zapisie | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L349) | `school`, `structure`, `api` |
| STR-20 | STR-20: filtrowanie zaznaczonej gałęzi i całej struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L366) | `school`, `structure`, `blocked` |
| STR-21 | STR-21: typ „Zespół szkół” jest dostępny i mapowany do kontraktu API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L375) | `school`, `structure`, `api` |
| STR-22 | STR-22: typ „Filia” jest dostępny i mapowany do kontraktu API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L375) | `school`, `structure`, `api` |
| STR-23 | STR-23: typ „Wielobudynkowość” jest dostępny i mapowany do kontraktu API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L375) | `school`, `structure`, `api` |
| STR-24 | STR-24: niedozwolony typ relacji dla pary jednostek | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L391) | `school`, `structure`, `blocked` |
| STR-25 | STR-25: duplikat aktywnej relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L395) | `school`, `structure`, `blocked` |
| STR-26 | STR-26: ta sama para z innym typem | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L399) | `school`, `structure`, `blocked` |
| STR-27 | STR-27: bieżącej szkoły nie można dodać jako własnego powiązania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L403) | `school`, `structure`, `validation`, `negative` |
| STR-28 | STR-28: cykl bezpośredni | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L427) | `school`, `structure`, `blocked` |
| STR-29 | STR-29: cykl pośredni | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L431) | `school`, `structure`, `blocked` |
| STR-30 | STR-30: maksymalna głębokość hierarchii | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L435) | `school`, `structure`, `blocked` |
| STR-31 | STR-31: przekroczenie głębokości hierarchii | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L439) | `school`, `structure`, `blocked` |
| STR-32 | STR-32: edycja typu relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L443) | `school`, `structure`, `blocked` |
| STR-33 | STR-33: zamiana stron relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L447) | `school`, `structure`, `blocked` |
| STR-34 | STR-34: ikona śmietnika usuwa relację ze struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L451) | `school`, `structure`, `delete` |
| STR-35 | STR-35: przywrócenie relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L468) | `school`, `structure`, `blocked` |
| STR-36 | STR-36: relację można ponownie dodać po usunięciu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L472) | `school`, `structure`, `delete` |
| STR-37 | STR-37: brak wpływu nieaktywnej relacji na biznes | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L491) | `school`, `structure`, `blocked` |
| STR-38 | STR-38: automatyczne nadanie ID zespołu szkół | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L495) | `school`, `structure`, `blocked` |
| STR-39 | STR-39: unikalność ID zespołu szkół | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L499) | `school`, `structure`, `blocked` |
| STR-40 | STR-40: brak kolizji ID z numeracją szkół | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L503) | `school`, `structure`, `blocked` |
| STR-41 | STR-41: wyszukiwanie zespołu po trzycyfrowym ID | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L507) | `school`, `structure`, `blocked` |
| STR-42 | STR-42: dane identyfikacyjne zespołu w integracji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L511) | `school`, `structure`, `blocked` |
| STR-43 | STR-43: trwałość rekordu relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L515) | `school`, `structure`, `blocked` |
| STR-44 | STR-44: rozszerzalność słownika typów | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L519) | `school`, `structure`, `blocked` |
| STR-45 | STR-45: audyt utworzenia | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L523) | `school`, `structure`, `blocked` |
| STR-46 | STR-46: audyt edycji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L527) | `school`, `structure`, `blocked` |
| STR-47 | STR-47: audyt soft delete | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L531) | `school`, `structure`, `blocked` |
| STR-48 | STR-48: audyt przywrócenia | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L535) | `school`, `structure`, `blocked` |
| STR-49 | STR-49: odpowiedź 422 nie zamyka dialogu ani nie ponawia zapisu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L539) | `school`, `structure`, `api`, `negative` |
| STR-50 | STR-50: odpowiedź 500 zachowuje przygotowaną relację i pozwala ponowić zapis | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L555) | `school`, `structure`, `api`, `negative` |
| STR-51 | STR-51: konflikt równoczesnej edycji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L572) | `school`, `structure`, `blocked` |
| STR-52 | STR-52: uprawnienia tylko do odczytu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L576) | `school`, `structure`, `blocked` |
| STR-53 | STR-53: wyszukiwanie złożone wyłącznie z białych znaków jest odrzucane | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L580) | `school`, `structure`, `validation`, `negative` |
| STR-54 | STR-54: ponowne wyszukiwanie zastępuje poprzednie wyniki | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L598) | `school`, `structure`, `search` |
| STR-55 | STR-55: tej samej szkoły nie można dodać dwukrotnie do planowanych powiązań | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L614) | `school`, `structure`, `validation` |
| STR-56 | STR-56: usuniętą planowaną szkołę można ponownie dodać | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L633) | `school`, `structure`, `positive` |
| STR-57 | STR-57: anulowanie kilku planowanych powiązań nie zachowuje żadnego z nich | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L649) | `school`, `structure`, `cancel` |
| TEA-02 | TEA-02: brak pola imię blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola nazwisko blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola szkoła blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola kontakt blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-03 | TEA-03: anulowanie kompletnego formularza nie tworzy nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L49) | `cancel` |
| SCH-02 | SCH-02: anulowanie kompletnego formularza nie tworzy szkoły | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L60) | `cancel` |
| EDIT-02 | EDIT-02: anulowanie edycji zachowuje dane i historię | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L70) | `cancel` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — teacher | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L107) | `search` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — school | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L107) | `search` |
| ORD-12 | ORD-12: wyszukiwanie po dokładnym kodzie zwraca właściwy produkt | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L30) | `school`, `order`, `search` |
| ORD-13 | ORD-13: wyszukiwanie po fragmencie kodu zwraca oba produkty fizyki 7 | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L50) | `school`, `order`, `search` |
| ORD-14 | ORD-14: filtr Przedmiot ogranicza wyniki do fizyki | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L67) | `school`, `order`, `filter` |
| ORD-15 | ORD-15: filtr Poziom ogranicza wyniki do szkoły podstawowej | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L90) | `school`, `order`, `filter` |
| ORD-16 | ORD-16: filtr Klasa zwraca produkty klasy 7 | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L113) | `school`, `order`, `filter` |
| ORD-17 | ORD-17: filtr Klasy pozwala wyszukiwać dla kilku klas jednocześnie | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L136) | `school`, `order`, `filter` |
| ORD-18 | ORD-18: Przedmiot i Poziom działają razem | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L161) | `school`, `order`, `filter` |
| ORD-19 | ORD-19: Przedmiot, Poziom i Klasa działają razem | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L182) | `school`, `order`, `filter` |
| ORD-20 | ORD-20: wszystkie filtry razem zwracają oczekiwane produkty | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L205) | `school`, `order`, `filter` |
| ORD-21 | ORD-21: nieistniejący kod daje pustą listę wyników | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L244) | `school`, `order`, `search`, `negative` |
| ORD-22 | ORD-22: drugie wyszukanie zastępuje wyniki pierwszego | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L259) | `school`, `order`, `search` |
| ORD-23 | ORD-23: Wyczyść filtry resetuje wszystkie kryteria | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L280) | `school`, `order`, `filter` |
| ORD-24 | ORD-24: wyszukiwanie działa poprawnie po wyczyszczeniu filtrów | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L307) | `school`, `order`, `filter` |
| ORD-25 | ORD-25: strzałka w prawo przenosi wybrany produkt do Zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L336) | `school`, `order`, `product` |
| ORD-26 | ORD-26: kilka produktów można przenieść do Zamówienia jednym ruchem | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L355) | `school`, `order`, `product` |
| ORD-27 | ORD-27: strzałka w lewo cofa zaznaczony produkt | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L376) | `school`, `order`, `product` |
| ORD-28 | ORD-28: kosz usuwa wszystkie produkty z tworzonego zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L401) | `school`, `order`, `product` |
| ORD-29 | ORD-29: produkt już dodany do Zamówienia nie pojawia się ponownie w Gratisach | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L422) | `school`, `order`, `duplicate` |
| ORD-30 | ORD-30: wyszukanie kolejnego produktu nie usuwa wcześniej wybranego | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L443) | `school`, `order`, `product` |
| ORD-31 | ORD-31: zmiana filtrów nie usuwa produktów z Zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L462) | `school`, `order`, `product`, `filter` |
| ORD-32 | ORD-32: dane produktu są spójne po przeniesieniu do Zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L483) | `school`, `order`, `product` |
| ORD-01 | ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L43) | `school`, `order`, `smoke` |
| ORD-02 | ORD-02: zamówienie z dwoma produktami zachowuje produkty i ilości | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L72) | `school`, `order`, `positive` |
| ORD-03 | ORD-03: edycja ilości dwóch produktów i usunięcie zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L117) | `school`, `order`, `edit` |
| ORD-04 | ORD-04: formularz Dodaj zamówienie zawiera komplet podstawowych kontrolek | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L176) | `school`, `order`, `form` |
| ORD-05 | ORD-05: anulowanie pustego formularza nie tworzy zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L285) | `school`, `order`, `cancel` |
| ORD-06 | ORD-06: anulowanie po wyszukaniu nie tworzy zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L302) | `school`, `order`, `cancel` |
| ORD-07 | ORD-07: anulowanie po dodaniu produktu i ilości nie tworzy zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L323) | `school`, `order`, `cancel` |
| ORD-08 | ORD-08: ponowne otwarcie po anulowaniu zaczyna od czystego formularza | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L346) | `school`, `order`, `cancel` |
| ORD-09 | ORD-09: lista Przedmiot zawiera oczekiwane pozycje | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L439) | `school`, `order`, `dictionary` |
| ORD-10 | ORD-10: lista Poziom zawiera oczekiwane pozycje | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L454) | `school`, `order`, `dictionary` |
| ORD-11 | ORD-11: lista Klasy zawiera 0-8 i pozwala zaznaczyć kilka klas | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L469) | `school`, `order`, `dictionary` |
| ORD-33 | ORD-33: ilość 1 jest zachowywana w edytorze | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L29) | `school`, `order`, `quantity` |
| ORD-34 | ORD-34: różne produkty zachowują niezależne ilości | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L48) | `school`, `order`, `quantity` |
| ORD-35 | ORD-35: ostatnia zmiana ilości przed zapisem jest używana | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L73) | `school`, `order`, `quantity` |
| ORD-36 | ORD-36: Tab kończy edycję ilości w AG Grid | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L110) | `school`, `order`, `quantity` |
| ORD-37 | ORD-37: wpisanie 0 normalizuje ilość do 10 | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L130) | `school`, `order`, `quantity`, `boundary` |
| ORD-38 | ORD-38: wartość ujemna nie jest akceptowana | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L149) | `school`, `order`, `quantity`, `boundary` |
| ORD-39 | ORD-39: wyczyszczenie pola Ilość automatycznie przywraca wartość | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L168) | `school`, `order`, `quantity`, `boundary` |
| ORD-40 | ORD-40: pusty formularz nie zapisuje zamówienia i oznacza Przedmiot jako niepoprawny | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L200) | `school`, `order`, `validation` |
| ORD-41 | ORD-41: zamówienie można zapisać bez wybranego Przedmiotu, jeśli produkt został dodany | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L228) | `school`, `order`, `positive` |
| ORD-42 | ORD-42: dwa szybkie kliknięcia Zapisz z krótkim odstępem tworzą tylko jedno zamówienie | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L280) | `school`, `order`, `duplicate` |
| ORD-43 | ORD-43: dwa kolejne zamówienia dostają różne ID | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L340) | `school`, `order`, `identity` |
| ORD-44 | ORD-44: usunięcie pierwszego z dwóch zamówień nie usuwa drugiego | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L380) | `school`, `order`, `isolation` |
| ORD-45 | ORD-45: zamówienie utworzone dla szkoły A nie pojawia się w szkole B | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L427) | `school`, `order`, `isolation` |
| ORD-46 | ORD-46: reload zachowuje ID, produkt i ilość zamówienia | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L450) | `school`, `order`, `persistence` |
| ORD-47 | ORD-47: zapisane zamówienie ma numeryczne ID i widoczny wiersz na liście | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L479) | `school`, `order`, `list` |
| ORD-48 | ORD-48: poprawny JPG można dodać jako załącznik | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L44) | `school`, `order`, `attachment` |
| ORD-49 | ORD-49: poprawny PNG można dodać jako załącznik | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L44) | `school`, `order`, `attachment` |
| ORD-50 | ORD-50: poprawny PDF można dodać jako załącznik | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L44) | `school`, `order`, `attachment` |
| ORD-51 | ORD-51: można dodać kilka załączników do jednego zamówienia | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L60) | `school`, `order`, `attachment` |
| ORD-52 | ORD-52: można usunąć jeden z kilku załączników | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L83) | `school`, `order`, `attachment` |
| ORD-53 | ORD-53: po usunięciu wszystkich załączników lista jest pusta | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L127) | `school`, `order`, `attachment` |
| ORD-54 | ORD-54: zmiana filtrów nie usuwa załącznika | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L162) | `school`, `order`, `attachment`, `filter` |
| ORD-55 | ORD-55: dodanie produktu nie usuwa załącznika | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L185) | `school`, `order`, `attachment`, `product` |
| ORD-56 | ORD-56: załącznik jest trwały po zapisaniu i ponownym otwarciu edycji zamówienia | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L204) | `school`, `order`, `attachment`, `persistence` |
| ORD-57 | ORD-57: kilka załączników jest trwałych po zapisaniu zamówienia | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L259) | `school`, `order`, `attachment`, `persistence` |
| ORD-58 | ORD-58: anulowanie formularza z załącznikiem nie przenosi pliku do kolejnego formularza | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L313) | `school`, `order`, `attachment`, `cancel` |
| ORD-59 | ORD-59: niedozwolony typ pliku WEBP jest odrzucany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L340) | `school`, `order`, `attachment`, `validation` |
| ORD-60 | ORD-60: niedozwolony typ pliku TXT jest odrzucany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L340) | `school`, `order`, `attachment`, `validation` |
| ORD-61 | ORD-61: plik większy niż 10 MB jest odrzucany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L354) | `school`, `order`, `attachment`, `validation` |
| ORD-62 | ORD-62: plik o rozmiarze dokładnie 10 MB jest akceptowany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L369) | `school`, `order`, `attachment`, `boundary` |
| ORD-63 | ORD-63: zamówienie z załącznikiem pokazuje ikonę dokumentu na liście | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L384) | `school`, `order`, `attachment`, `list` |
| ORD-64 | ORD-64: zamówienie bez załącznika nie pokazuje ikony dokumentu | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L430) | `school`, `order`, `attachment`, `list`, `negative` |
| ORD-65 | ORD-65: po usunięciu ostatniego załącznika ikona dokumentu znika | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L454) | `school`, `order`, `attachment`, `edit`, `list` |
| ORD-66 | ORD-66: kilka załączników daje pojedynczą ikonę dokumentu na liście | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L531) | `school`, `order`, `attachment`, `list` |
