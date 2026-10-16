# Indeks scenariuszy

> Plik generowany automatycznie przez `npm run docs:scenarios`. Nie edytuj tabeli ręcznie.

Łącznie: **728 scenariuszy**.

| ID | Scenariusz | Plik | Tagi |
|---|---|---|---|
| CLUB-30 | CLUB-30: odznaczenie opcji wszystkich klas NASZYCH czyści cały wybór | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L42) | `teacher`, `club`, `classes` |
| CLUB-31 | CLUB-31: odznaczenie opcji wszystkich klas OBCYCH czyści cały wybór | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L68) | `teacher`, `club`, `classes` |
| CLUB-32 | CLUB-32: edycja zmienia klasę NASZĄ na OBCĄ i zachowuje wydawnictwo | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L95) | `teacher`, `club`, `edit` |
| CLUB-33 | CLUB-33: klasa OBCA bez wydawnictwa blokuje utworzenie formularza | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L129) | `teacher`, `club`, `publisher`, `validation` |
| CLUB-34 | CLUB-34: zmianę wydawnictwa klasy OBCEJ można zapisać podczas edycji | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L158) | `teacher`, `club`, `publisher`, `edit` |
| CLUB-35 | CLUB-35: usunięcie ostatniej klasy OBCEJ zachowuje klasę NASZĄ | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L190) | `teacher`, `club`, `publisher`, `edit` |
| CLUB-36 | CLUB-36: edycja może dodać kolejną klasę NASZĄ bez utraty poprzedniej | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L221) | `teacher`, `club`, `classes`, `edit` |
| CLUB-37 | CLUB-37: zmiana przedmiotu nie przenosi klas wybranych dla Matematyki do Fizyki | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L250) | `teacher`, `club`, `subject`, `classes` |
| CLUB-38 | CLUB-38: ta sama szkoła i rok mogą mieć osobne potwierdzenia Matematyki i Fizyki | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L278) | `teacher`, `club`, `subject` |
| CLUB-39 | CLUB-39: usuniętego formularza klubowego nie można edytować | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L321) | `teacher`, `club`, `delete`, `validation` |
| CLUB-40 | CLUB-40: po usunięciu można utworzyć nowe potwierdzenie dla tej samej szkoły, roku i przedmiotu | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L354) | `teacher`, `club`, `delete` |
| CLUB-41 | CLUB-41: usunięte potwierdzenie można przywrócić, gdy nie istnieje inne aktywne potwierdzenie | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L411) | `teacher`, `club`, `restore`, `history` |
| CLUB-42 | CLUB-42: aktywne potwierdzenie dla tego samego roku, przedmiotu i szkoły blokuje przywrócenie | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L446) | `teacher`, `club`, `restore`, `validation` |
| CLUB-43 | CLUB-43: przywrócenie zachowuje wszystkie wcześniej wybrane klasy NASZE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L497) | `teacher`, `club`, `restore`, `classes` |
| CLUB-44 | CLUB-44: przywrócenie zachowuje klasę OBCĄ i wydawnictwo | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L535) | `teacher`, `club`, `restore`, `publisher` |
| CLUB-45 | CLUB-45: aktywne potwierdzenie innego przedmiotu nie blokuje przywrócenia | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L568) | `teacher`, `club`, `restore`, `subject` |
| CLUB-46 | CLUB-46: nowsze potwierdzenie blokuje przywrócenie starszego dla tego samego przedmiotu, poziomu i szkoły | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L610) | `teacher`, `club`, `restore`, `school-year`, `validation` |
| CLUB-47 | CLUB-47: aktywne potwierdzenie innej szkoły nie blokuje przywrócenia | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L668) | `teacher`, `club`, `restore`, `school` |
| CLUB-48 | CLUB-48: przywrócone potwierdzenie można edytować | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L721) | `teacher`, `club`, `restore`, `edit` |
| CLUB-49 | CLUB-49: edycja, weryfikacja negatywna, usunięcie i historia wymagają wybranego potwierdzenia | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L757) | `teacher`, `club`, `actions` |
| CLUB-50 | CLUB-50: weryfikacja negatywna zmienia klasę NASZĄ na OBCĄ z wydawnictwem INNE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L793) | `teacher`, `club`, `negative-verification`, `history` |
| CLUB-51 | CLUB-51: weryfikacja negatywna zmienia wszystkie klasy NASZE na OBCE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L840) | `teacher`, `club`, `negative-verification`, `classes` |
| CLUB-52 | CLUB-52: potwierdzenie zweryfikowane negatywnie można zmienić z powrotem na NASZE | [klubowiczostwo-cykl-zycia.spec.ts](../../tests/klubowiczostwo-cykl-zycia.spec.ts#L871) | `teacher`, `club`, `negative-verification`, `edit` |
| CLUB-01 | CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L26) | `teacher`, `club`, `history` |
| CLUB-02 | CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L126) | `teacher`, `club`, `history` |
| CLUB-03 | CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L198) | `teacher`, `club` |
| CLUB-04 | CLUB-04: formularz klubowy zachowuje kilka klas 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L232) | `teacher`, `club` |
| CLUB-05 | CLUB-05: zaznaczenie wszystkich klas Matematyka/SP wybiera 4-8 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L273) | `teacher`, `club` |
| CLUB-06 | CLUB-06: edycja usuwa tylko wskazaną klasę 5 z zestawu 4,5,6 | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L317) | `teacher`, `club` |
| CLUB-07 | CLUB-07: formularz klubowy dotyczy tylko wybranej szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L360) | `teacher`, `club` |
| CLUB-08 | CLUB-08: formularz klubowy obsługuje dwie szkoły nauczyciela | [klubowiczostwo-nauczyciela.spec.ts](../../tests/klubowiczostwo-nauczyciela.spec.ts#L414) | `teacher`, `club` |
| CLUB-09 | CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L47) | `teacher`, `club`, `cancel` |
| CLUB-10 | CLUB-10: anulowanie edycji zachowuje klasę 4 | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L81) | `teacher`, `club`, `cancel` |
| CLUB-11 | CLUB-11: formularz klubowy można usunąć | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L129) | `teacher`, `club`, `delete` |
| CLUB-12A | CLUB-12A: brak szkoły blokuje utworzenie formularza klubowego | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L330) | `teacher`, `club`, `validation` |
| CLUB-12B | CLUB-12B: brak klasy blokuje utworzenie formularza klubowego | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L445) | `teacher`, `club`, `validation` |
| CLUB-13 | CLUB-13: formularz klubowy poprawnie prezentuje wszystkie OBCE wydawnictwa | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L565) | `teacher`, `club`, `publisher` |
| CLUB-14 | CLUB-14: nowy formularz ma domyślnie wybrany bieżący rok szkolny | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L623) | `teacher`, `club`, `defaults` |
| CLUB-15 | CLUB-15: formularz pokazuje wszystkie szkoły i przedmioto-poziomy nauczyciela | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L643) | `teacher`, `club`, `defaults` |
| CLUB-16 | CLUB-16: klasy można wybierać wyłącznie dla zaznaczonej szkoły | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L675) | `teacher`, `club`, `school` |
| CLUB-17 | CLUB-17: odznaczenie szkoły usuwa wybrane dla niej klasy | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L701) | `teacher`, `club`, `school` |
| CLUB-18 | CLUB-18: standardowa klasa nie może być jednocześnie NASZA i OBCA | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L726) | `teacher`, `club`, `classes`, `validation` |
| CLUB-19 | CLUB-19: zaznaczenie klasy OBCEJ blokuje tę samą klasę NASZĄ | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L748) | `teacher`, `club`, `classes` |
| CLUB-20 | CLUB-20: różne klasy mogą być jednocześnie NASZE i OBCE | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L770) | `teacher`, `club`, `classes` |
| CLUB-21 | CLUB-21: Fizyka pozwala zaznaczyć dwie NASZE serie tej samej klasy | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L795) | `teacher`, `club`, `physics` |
| CLUB-22 | CLUB-22: zaznaczenie wszystkich NASZYCH klas Fizyki obejmuje obie serie | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L820) | `teacher`, `club`, `physics` |
| CLUB-23 | CLUB-23: Matematyka SŚ pozwala zaznaczyć równocześnie wszystkie klasy NASZE i OBCE | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L847) | `teacher`, `club`, `math-secondary` |
| CLUB-24 | CLUB-24: wszystkie klasy Matematyki SŚ są trwałe po ponownym otwarciu | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L877) | `teacher`, `club`, `math-secondary` |
| CLUB-25 | CLUB-25: Fizyka zapisuje wszystkie NASZE klasy obu serii | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L920) | `teacher`, `club`, `physics` |
| CLUB-26 | CLUB-26: usunięcie wszystkich klas podczas edycji blokuje zapis | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L953) | `teacher`, `club`, `edit`, `validation` |
| CLUB-27 | CLUB-27: istniejące potwierdzenie blokuje duplikat dla tego samego roku, przedmiotu i szkoły | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L992) | `teacher`, `club`, `duplicate`, `validation` |
| CLUB-28 | CLUB-28: formularz dla poprzedniego roku szkolnego jest trwały | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L1037) | `teacher`, `club`, `school-year` |
| CLUB-29 | CLUB-29: potwierdzenia dla tej samej szkoły i przedmiotu mogą dotyczyć dwóch różnych lat | [klubowiczostwo-walidacja.spec.ts](../../tests/klubowiczostwo-walidacja.spec.ts#L1073) | `teacher`, `club`, `school-year` |
| CLUB-53 | CLUB-53: potwierdzenie zweryfikowane negatywnie można usunąć | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L63) | `teacher`, `club`, `negative-verification`, `delete`, `history` |
| CLUB-54 | CLUB-54: edycja Matematyki nie zmienia potwierdzenia Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L91) | `teacher`, `club`, `multi-subject`, `edit` |
| CLUB-55 | CLUB-55: weryfikacja negatywna Matematyki nie zmienia Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L145) | `teacher`, `club`, `multi-subject`, `negative-verification` |
| CLUB-56 | CLUB-56: usunięcie i przywrócenie Matematyki nie zmienia aktywnej Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L202) | `teacher`, `club`, `multi-subject`, `delete`, `restore` |
| CLUB-57 | CLUB-57: dwie szkoły i dwa przedmioty tworzą cztery niezależne potwierdzenia | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L263) | `teacher`, `club`, `multi-subject`, `multi-school` |
| CLUB-58 | CLUB-58: Matematyka i Fizyka zachowują niezależne potwierdzenia dla dwóch lat szkolnych | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L332) | `teacher`, `club`, `multi-subject`, `school-year` |
| CLUB-59 | CLUB-59: mieszany cykl życia Matematyki i Fizyki zachowuje niezależne statusy i historie | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L405) | `teacher`, `club`, `multi-subject`, `negative-verification`, `delete`, `restore`, `history` |
| CLUB-60 | CLUB-60: nowsze potwierdzenie blokuje późniejsze dodanie starszego dla tej samej szkoły i przedmiotu | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L475) | `teacher`, `club`, `school-year`, `validation` |
| CLUB-61 | CLUB-61: Język polski pozwala zapisać tylko jedną NASZĄ serię klasy 4 | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L525) | `teacher`, `club`, `polish`, `classes`, `validation` |
| CLUB-62 | CLUB-62: formularz WSPOM tworzy potwierdzenie i funkcję nauczyciela wspomagającego | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L586) | `teacher`, `club`, `supporting` |
| CLUB-63 | CLUB-63: jeden formularz WSPOM zapisuje Język polski i Matematykę niezależnie | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L616) | `teacher`, `club`, `supporting`, `multi-subject` |
| CLUB-64 | CLUB-64: dwa szybkie kliknięcia Zapisz nie tworzą dwóch potwierdzeń | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L676) | `teacher`, `club`, `concurrency` |
| CLUB-65 | CLUB-65: zaznaczenie wszystkich klas OBCYCH Matematyki SP jest trwałe | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L710) | `teacher`, `club`, `classes`, `publisher`, `select-all` |
| CLUB-66 | CLUB-66: edycja Języka polskiego nie pozwala zapisać dwóch NASZYCH serii klasy 4 | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L752) | `teacher`, `club`, `polish`, `edit`, `validation` |
| CLUB-67 | CLUB-67: zaznaczenie wszystkich NASZYCH klas Języka polskiego wybiera tylko jedną serię klasy 4 | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L810) | `teacher`, `club`, `polish`, `classes`, `select-all` |
| CLUB-68 | CLUB-68: formularz WSPOM nie pokazuje serii Języka polskiego ani Fizyki | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L866) | `teacher`, `club`, `supporting`, `polish`, `physics`, `classes` |
| CLUB-69 | CLUB-69: formularz WSPOM poprawnie prezentuje wszystkie OBCE wydawnictwa | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L917) | `teacher`, `club`, `supporting`, `publisher` |
| CLUB-70 | CLUB-70: formularz WSPOM wymaga szkoły, przedmiotu i klasy | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L978) | `teacher`, `club`, `supporting`, `validation` |
| CLUB-71 | CLUB-71: zwykłe potwierdzenie i WSPOM współistnieją dla tego samego przedmiotu, szkoły i roku | [klubowiczostwo-zaawansowane.spec.ts](../../tests/klubowiczostwo-zaawansowane.spec.ts#L1016) | `teacher`, `club`, `supporting`, `duplicate` |
| ADD-01 | ADD-01: nauczyciela można utworzyć z imieniem, nazwiskiem, szkołą i e-mailem bez przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L84) | `teacher`, `add`, `positive` |
| ADD-02 | ADD-02: nauczyciela można utworzyć z telefonem bez e-maila | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L227) | `teacher`, `add`, `positive` |
| ADD-03 | ADD-03: dzisiejsza data urodzenia jest akceptowana | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L337) | `teacher`, `add`, `birthdate` |
| ADD-04 | ADD-04: źródło domyślne to Karta nauczyciela i lista zawiera trzy wartości | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L455) | `teacher`, `add`, `source` |
| ADD-05 | ADD-05: nauczyciela można utworzyć ze źródłem Karta LS | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L508) | `teacher`, `add`, `source` |
| ADD-06 | ADD-06: zgoda E-mail może być zaznaczona bez zgody Marketing | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L547) | `teacher`, `add`, `rodo` |
| ADD-07 | ADD-07: zgoda Telefon może być zaznaczona bez zgody Marketing | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L647) | `teacher`, `add`, `rodo` |
| ADD-08 | ADD-08: nauczyciela ze źródłem Karta LS można utworzyć bez żadnej zgody RODO | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L742) | `teacher`, `add`, `rodo` |
| ADD-09 | ADD-09: nauczyciela można utworzyć z dwiema szkołami | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L798) | `teacher`, `add`, `school` |
| ADD-10 | ADD-10: szkołę można usunąć przed zapisaniem nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L842) | `teacher`, `add`, `school` |
| ADD-11 | ADD-11: nauczyciela można utworzyć z przedmioto-poziomem Matematyka SP | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L902) | `teacher`, `add`, `subject` |
| ADD-12 | ADD-12: nauczyciela można utworzyć z wieloma przedmioto-poziomami | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L934) | `teacher`, `add`, `subject` |
| ADD-13 | ADD-13: dodawanie nauczyciela zachowuje wielkość liter i akceptuje znak _ | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L973) | `teacher`, `add`, `name` |
| ADD-14 | ADD-14: Pokaż przy podobnej osobie zamyka formularz i otwiera istniejącego nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1077) | `teacher`, `add`, `duplicate` |
| ADD-15 | ADD-15: brak pola imię blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1133) | `teacher`, `add`, `validation` |
| ADD-16 | ADD-16: brak pola nazwisko blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1133) | `teacher`, `add`, `validation` |
| ADD-17 | ADD-17: brak pola szkoła blokuje utworzenie nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1133) | `teacher`, `add`, `validation` |
| ADD-18 | ADD-18: brak e-maila i telefonu blokuje utworzenie nauczyciela po potwierdzeniu braku przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1191) | `teacher`, `add`, `validation` |
| ADD-19 | ADD-19: wybranie Nie przy ostrzeżeniu o braku przedmioto-poziomu pozostawia formularz otwarty | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1241) | `teacher`, `add`, `validation` |
| ADD-20.1 | ADD-20.1: niepoprawny e-mail "test" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1290) | `teacher`, `add`, `email`, `validation` |
| ADD-20.2 | ADD-20.2: niepoprawny e-mail "test@" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1290) | `"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.3 | ADD-20.3: niepoprawny e-mail "@example.pl" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1290) | `example.pl"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.4 | ADD-20.4: niepoprawny e-mail "a b@example.pl" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1290) | `example.pl"`, `teacher`, `add`, `email`, `validation` |
| ADD-20.5 | ADD-20.5: niepoprawny e-mail "a@" blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1290) | `"`, `teacher`, `add`, `email`, `validation` |
| ADD-21 | ADD-21: e-mail używany przez innego nauczyciela blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1326) | `teacher`, `add`, `email`, `validation` |
| ADD-22 | ADD-22: telefon krótszy niż 9 cyfr blokuje zapis | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1448) | `teacher`, `add`, `phone`, `validation` |
| ADD-23 | ADD-23: pole telefonu nie pozwala wprowadzić więcej niż 9 cyfr | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1555) | `teacher`, `add`, `phone` |
| ADD-24 | ADD-24: przyszła data urodzenia blokuje zapis nauczyciela | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1604) | `teacher`, `add`, `birthdate`, `validation` |
| ADD-25 | ADD-25: nauczyciela można utworzyć bez daty urodzenia | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1637) | `teacher`, `add`, `birthdate`, `positive` |
| ADD-27 | ADD-27: brak poziomu blokuje dodanie przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1812) | `teacher`, `add`, `subject`, `validation` |
| ADD-28 | ADD-28: brak przedmiotu blokuje dodanie przedmioto-poziomu | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L1908) | `teacher`, `add`, `subject`, `validation` |
| ADD-29 | ADD-29: tego samego przedmioto-poziomu nie można dodać dwa razy | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L2002) | `teacher`, `add`, `subject`, `validation` |
| ADD-30 | ADD-30: anulowanie kompletnego formularza nie tworzy nauczyciela ani relacji ze szkołą | [nauczyciel-dodawanie.spec.ts](../../tests/nauczyciel-dodawanie.spec.ts#L2094) | `teacher`, `add`, `cancel` |
| EDIT-24 | EDIT-24: poprawna data urodzenia jest trwała | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L17) | `teacher`, `edit` |
| EDIT-25 | EDIT-25: niepoprawna data urodzenia blokuje zapis | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L65) | `teacher`, `edit`, `validation` |
| EDIT-26 | EDIT-26: pełny adres prywatny można dodać i jest zapisany w historii | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L114) | `teacher`, `edit`, `history` |
| EDIT-27 | EDIT-27: wszystkie dane istniejącego adresu prywatnego można zmienić | [nauczyciel-edycja-adres.spec.ts](../../tests/nauczyciel-edycja-adres.spec.ts#L247) | `teacher`, `edit`, `history` |
| EDIT-43 | EDIT-43: ponowny zapis już znormalizowanych danych bez zmian nie modyfikuje danych ani historii | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L15) | `teacher`, `edit` |
| EDIT-44 | EDIT-44: anulowanie wielu zmian zachowuje poprzednie dane i historię | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L149) | `teacher`, `edit`, `cancel` |
| EDIT-45 | EDIT-45: zmienione dane są trwałe po przejściu do szkoły i powrocie | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L199) | `teacher`, `edit`, `navigation` |
| EDIT-46 | EDIT-46: edycja danych nauczyciela nie usuwa relacji ze szkołą | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L252) | `teacher`, `edit`, `relation` |
| EDIT-47 | EDIT-47: jednoczesna zmiana wielu pól tworzy komplet wpisów historii | [nauczyciel-edycja-integralnosc.spec.ts](../../tests/nauczyciel-edycja-integralnosc.spec.ts#L302) | `teacher`, `edit`, `history` |
| EDIT-12 | EDIT-12: poprawny e-mail można zmienić i zmiana jest widoczna w historii | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L28) | `teacher`, `edit` |
| EDIT-13 | EDIT-13: niepoprawny e-mail blokuje zapis | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L221) | `teacher`, `edit`, `validation` |
| EDIT-14 | EDIT-14: poprawny telefon można dodać | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L395) | `teacher`, `edit` |
| EDIT-15 | EDIT-15: można dodać drugi numer telefonu | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L525) | `teacher`, `edit` |
| EDIT-16 | EDIT-16: przy dwóch telefonach nie można dodać trzeciego | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L601) | `teacher`, `edit` |
| EDIT-17 | EDIT-17: można usunąć zapisany numer telefonu | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L705) | `teacher`, `edit` |
| EDIT-18 | EDIT-18: anulowanie usunięcia telefonu nie zmienia danych | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L873) | `teacher`, `edit` |
| EDIT-19 | EDIT-19: niepoprawny telefon blokuje dodanie | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1010) | `teacher`, `edit`, `validation` |
| EDIT-20 | EDIT-20: nauczyciel może pozostać bez e-maila jeśli posiada telefon | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1126) | `teacher`, `edit` |
| EDIT-21 | EDIT-21: nauczyciel może istnieć bez telefonu jeśli posiada e-mail | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1220) | `teacher`, `edit` |
| EDIT-22 | EDIT-22: brak e-maila i telefonu wymaga dodatkowego potwierdzenia | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1267) | `teacher`, `edit`, `validation` |
| EDIT-23 | EDIT-23: można usunąć e-mail bez telefonu po potwierdzeniu ostrzeżenia o rekordzie minimalnym | [nauczyciel-edycja-kontakt.spec.ts](../../tests/nauczyciel-edycja-kontakt.spec.ts#L1331) | `teacher`, `edit`, `validation` |
| EDIT-28 | EDIT-28: uwagi nauczyciela są trwałe | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L17) | `teacher`, `edit` |
| EDIT-29 | EDIT-29: nauczyciel może posiadać wiele notatek | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L146) | `teacher`, `edit`, `notes` |
| EDIT-30 | EDIT-30: notatkę nauczyciela można zarchiwizować | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L213) | `teacher`, `edit`, `notes` |
| EDIT-31 | EDIT-31: anulowanie nie zapisuje nowej notatki nauczyciela | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L279) | `teacher`, `edit`, `notes`, `cancel` |
| EDIT-32 | EDIT-32: zapisana notatka posiada autora i datę | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L351) | `teacher`, `edit`, `notes` |
| EDIT-33 | EDIT-33: notatka nauczyciela ma limit 220 znaków | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L419) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-34 | EDIT-34: pusta notatka nauczyciela nie jest zapisywana | [nauczyciel-edycja-notatki.spec.ts](../../tests/nauczyciel-edycja-notatki.spec.ts#L493) | `teacher`, `edit`, `notes`, `validation` |
| EDIT-35 | EDIT-35: zgoda Marketing jest trwała | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L19) | `teacher`, `edit`, `rodo` |
| EDIT-36 | EDIT-36: zaznaczenie zgody E-mail automatycznie zaznacza Marketing | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L68) | `teacher`, `edit`, `rodo` |
| EDIT-37 | EDIT-37: zaznaczenie zgody Telefon automatycznie zaznacza Marketing | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L136) | `teacher`, `edit`, `rodo` |
| EDIT-38 | EDIT-38: wszystkie zgody RODO można zapisać jednocześnie | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L201) | `teacher`, `edit`, `rodo` |
| EDIT-39 | EDIT-39: odznaczenie zgody Marketing pokazuje ostrzeżenie | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L247) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-40 | EDIT-40: odznaczenie Marketing automatycznie odznacza E-mail i Telefon | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L343) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-41 | EDIT-41: zapis bez żadnej zgody RODO pokazuje ostrzeżenie | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L481) | `teacher`, `edit`, `rodo`, `validation` |
| EDIT-42 | EDIT-42: dropdown Źródło RODO zawiera oczekiwane wartości | [nauczyciel-edycja-rodo.spec.ts](../../tests/nauczyciel-edycja-rodo.spec.ts#L536) | `teacher`, `edit`, `rodo` |
| EDIT-04 | EDIT-04: zmiana imienia jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L13) | `teacher`, `edit` |
| EDIT-05 | EDIT-05: zmiana nazwiska jest trwała i widoczna w historii | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L89) | `teacher`, `edit` |
| EDIT-06 | EDIT-06: jednoczesna zmiana imienia i nazwiska zapisuje oba pola | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L132) | `teacher`, `edit` |
| EDIT-07 | EDIT-07: wielkość liter imienia jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L185) | `teacher`, `edit`, `normalization` |
| EDIT-08 | EDIT-08: wielkość liter nazwiska jest normalizowana | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L223) | `teacher`, `edit`, `normalization` |
| EDIT-09 | EDIT-09: nazwisko z łącznikiem można zapisać | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L254) | `teacher`, `edit` |
| EDIT-10 | EDIT-10: puste imię blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L291) | `teacher`, `edit`, `validation` |
| EDIT-11 | EDIT-11: puste nazwisko blokuje zapis | [nauczyciel-edycja.spec.ts](../../tests/nauczyciel-edycja.spec.ts#L339) | `teacher`, `edit`, `validation` |
| EDIT-03 | EDIT-03: zapis nazwiska jest trwały i widoczny w historii | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L4) | `teacher`, `edit` |
| TEA-04 | TEA-04: niepoprawny e-mail blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L43) | `teacher`, `validation` |
| TEA-04 | TEA-04: niepoprawny telefon blokuje zapis nauczyciela | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L43) | `teacher`, `validation` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Email | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L87) | `teacher`, `search` |
| FIND-05 | FIND-05: wyszukiwanie nauczyciela — Nazwisko | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L87) | `teacher`, `search` |
| REL-02 | REL-02: druga szkoła zachowuje pierwszą relację i pokazuje nauczyciela w obu szkołach | [nauczyciel-rozszerzenie.spec.ts](../../tests/nauczyciel-rozszerzenie.spec.ts#L133) | `teacher`, `relation` |
| PERM-01 | PERM-01: zakładka Uprawnienia sąsiaduje z Potwierdzeniami | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L27) | `teacher`, `entitlement`, `smoke` |
| PERM-02 | PERM-02: aktywne potwierdzenie jest widoczne mimo braku zamówień | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L38) | `teacher`, `entitlement`, `no-orders` |
| PERM-03 | PERM-03: lista zawiera wymagane podstawowe kolumny | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L56) | `teacher`, `entitlement`, `columns` |
| PERM-04 | PERM-04: tabela ma aktualny zestaw i kolejność kolumn | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L73) | `teacher`, `entitlement`, `columns` |
| PERM-05 | PERM-05: szczegół zawiera wszystkie klasy przedmiotu również nieprzyznane | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L101) | `teacher`, `entitlement`, `classes` |
| PERM-06 | PERM-06: szczegół pokazuje zapisane ilości progi powody lata i daty | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L141) | `teacher`, `entitlement`, `details` |
| PERM-07 | PERM-07: Przyznano w nagłówku oznacza co najmniej jedną przyznaną klasę | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L188) | `teacher`, `entitlement`, `status` |
| PERM-08 | PERM-08: bez zaznaczenia rekordu akcje są zablokowane | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L209) | `teacher`, `entitlement`, `selection` |
| PERM-09 | PERM-09: rekord automatyczny nie pozwala przywracać automatu | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L220) | `teacher`, `entitlement`, `restore` |
| PERM-10 | PERM-10: anulowanie edycji nie zapisuje decyzji ani historii | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L237) | `teacher`, `entitlement`, `cancel` |
| PERM-11 | PERM-11: historia dotyczy zaznaczonego przedmiotu i roku | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L266) | `teacher`, `entitlement`, `history` |
| PERM-12 | PERM-12: ponowne otwarcie zakładki nie zmienia kwalifikacji | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L298) | `teacher`, `entitlement`, `persistence` |
| PERM-13 | PERM-13: dwa przedmioty tworzą osobne rekordy uprawnień | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L316) | `teacher`, `entitlement`, `isolation` |
| PERM-14 | PERM-14: ten sam przedmiot w dwóch szkołach ma oddzielne rekordy | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L339) | `teacher`, `entitlement`, `isolation` |
| PERM-15 | PERM-15: dane ilościowe w szczególe nie są edytowalne | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L359) | `teacher`, `entitlement`, `readonly` |
| PERM-16 | PERM-16: nadanie jednej klasy przez UI zapisuje decyzję BOK i historię | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L375) | `teacher`, `entitlement`, `manual` |
| PERM-17 | PERM-17: Przywróć wyłącza decyzję ręczną i pokazuje wynik automatu | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L439) | `teacher`, `entitlement`, `restore`, `manual` |
| PERM-18 | PERM-18: odmowa klasy 4 przez UI nie zmienia automatu dla pozostałych klas | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L507) | `teacher`, `entitlement`, `manual`, `isolation` |
| PERM-19 | PERM-19: anulowanie Przywróć zachowuje decyzję BOK eksport i historię | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L570) | `teacher`, `entitlement`, `restore`, `cancel` |
| PERM-20 | PERM-20: edycja BOK jednej szkoły nie zmienia tego samego przedmiotu w drugiej szkole | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L586) | `teacher`, `entitlement`, `manual`, `isolation` |
| PERM-21 | PERM-21: szkoła testowa bez zamówień rozszerza deklarację Matematyki 4 do 4–8 | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L609) | `teacher`, `entitlement`, `test-school`, `no-orders` |
| PERM-22 | PERM-22: szkoła testowa bez zamówień rozszerza deklarację Matematyki 7 do 4–8 | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L609) | `teacher`, `entitlement`, `test-school`, `no-orders` |
| PERM-23 | PERM-23: bez flag Testowy ręczne nadanie jednej klasy przez UI działa i trafia do eksportu | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L646) | `teacher`, `entitlement`, `manual`, `unmarked` |
| PERM-24 | PERM-24: bez flag Testowy przywrócenie automatu odtwarza dostęp 7–8 z kwalifikującego zamówienia | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L661) | `teacher`, `entitlement`, `restore`, `orders`, `unmarked` |
| PERM-25 | PERM-25: bez flag Testowy anulowanie przywrócenia zachowuje BOK historię i eksport | [nauczyciel-uprawnienia.spec.ts](../../tests/nauczyciel-uprawnienia.spec.ts#L695) | `teacher`, `entitlement`, `restore`, `cancel`, `unmarked` |
| SCH-03 | SCH-03: minimalny poprawny formularz tworzy szkołę | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L79) | `school`, `school-add`, `positive` |
| SCH-04 | SCH-04: brak nazwy blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L104) | `school`, `school-add`, `validation` |
| SCH-05 | SCH-05: brak typu blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L119) | `school`, `school-add`, `validation` |
| SCH-06 | SCH-06: brak adresu blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L134) | `school`, `school-add`, `validation`, `address` |
| SCH-09 | SCH-09: anulowanie adresu nie przenosi danych do formularza szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L148) | `school`, `school-add`, `address`, `cancel` |
| SCH-10 | SCH-10: dwa szybkie kliknięcia Zapisz tworzą tylko jedną szkołę | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L182) | `school`, `school-add`, `concurrency` |
| SCH-11 | SCH-11: dane szkoły są trwałe po ponownym otwarciu | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L203) | `school`, `school-add`, `positive` |
| SCH-12 | SCH-12: nową szkołę można znaleźć po nazwie i zidentyfikować po ID | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L224) | `school`, `school-add`, `search` |
| SCH-13 | SCH-13: słownik zawiera wszystkie obsługiwane typy szkół | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L251) | `school`, `school-add`, `dictionary` |
| SCH-14 | SCH-14: formularz tworzy liceum z właściwym typem | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L270) | `school`, `school-add`, `positive`, `school-type` |
| SCH-21 | SCH-21: formularz tworzy szkołę typu Technikum | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L289) | `school`, `school-add`, `positive`, `school-type` |
| SCH-22 | SCH-22: formularz tworzy szkołę typu Placówka doskonalenia nauczycieli | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L289) | `school`, `school-add`, `positive`, `school-type` |
| SCH-23 | SCH-23: formularz tworzy szkołę typu Zespół szkół | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L289) | `school`, `school-add`, `positive`, `school-type` |
| SCH-24 | SCH-24: formularz tworzy szkołę typu Szkoła NPC | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L289) | `school`, `school-add`, `positive`, `school-type` |
| SCH-25 | SCH-25: formularz tworzy szkołę typu Przedszkole | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L289) | `school`, `school-add`, `positive`, `school-type` |
| SCH-17 | SCH-17: nazwa złożona wyłącznie ze spacji nie pozwala utworzyć szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L317) | `school`, `school-add`, `validation` |
| SCH-18 | SCH-18: nazwa z polskimi znakami i interpunkcją jest zachowana | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L342) | `school`, `school-add`, `positive`, `name` |
| SCH-27 | SCH-27: spacje na brzegach nazwy są usuwane przy zapisie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L358) | `school`, `school-add`, `positive`, `name` |
| SCH-28 | SCH-28: identyczna nazwa i adres mogą utworzyć dwa różne rekordy | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L375) | `school`, `school-add`, `positive`, `duplicate` |
| SCH-29 | SCH-29: identyczna nazwa pod różnymi adresami tworzy dwa różne rekordy | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L403) | `school`, `school-add`, `positive`, `duplicate` |
| SCH-07 | SCH-07: poprawny kod pocztowy pozwala wybrać miejscowość i zapisać adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L440) | `school`, `school-add`, `address` |
| SCH-08 | SCH-08: nieznany kod pocztowy blokuje zapis adresu i szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L465) | `school`, `school-add`, `validation`, `address` |
| SCH-19 | SCH-19: numer budynku z literą jest zachowany w adresie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L512) | `school`, `school-add`, `address` |
| SCH-20 | SCH-20: wyczyszczenie wyszukiwania adresu usuwa wpisane kryteria | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L534) | `school`, `school-add`, `address`, `clear` |
| SCH-26 | SCH-26: numer budynku z separatorem jest zachowany po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L560) | `school`, `school-add`, `positive`, `address` |
| SCH-41 | SCH-41: brak numeru budynku blokuje zapis adresu i szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L576) | `school`, `school-add`, `validation`, `address` |
| SCH-43 | SCH-43: pełny adres z ulicą jest zachowany po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L607) | `school`, `school-add`, `positive`, `address` |
| SCH-44 | SCH-44: wyczyszczenie wybranego adresu usuwa utworzony adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L639) | `school`, `school-add`, `validation`, `address`, `clear` |
| SCH-45 | SCH-45: ponowne dodanie adresu zastępuje adres przed utworzeniem szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L672) | `school`, `school-add`, `positive`, `address` |
| SCH-46 | SCH-46: anulowanie zmiany adresu zachowuje poprzedni adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L705) | `school`, `school-add`, `positive`, `address`, `cancel` |
| SCH-47 | SCH-47: wyczyszczenie adresu i anulowanie zachowuje poprzedni adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L732) | `school`, `school-add`, `positive`, `address`, `cancel`, `clear` |
| SCH-15 | SCH-15: usunięcie dodanego adresu ponownie blokuje zapis szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L758) | `school`, `school-add`, `address`, `validation` |
| SCH-30 | SCH-30: nazwa z SIO jest zachowana po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L785) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-32 | SCH-32: liczba uczniów jest zachowana po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L802) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-33 | SCH-33: numer RSPO jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L819) | `school`, `school-add`, `positive`, `identifier` |
| SCH-34 | SCH-34: numer REGON jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L840) | `school`, `school-add`, `positive`, `identifier` |
| SCH-35 | SCH-35: numer NIP jest przekazywany podczas tworzenia szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L861) | `school`, `school-add`, `positive`, `identifier` |
| SCH-51 | SCH-51: REGON z wiodącymi zerami zachowuje pełną długość | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L882) | `school`, `school-add`, `positive`, `identifier` |
| SCH-52 | SCH-52: NIP z wiodącymi zerami zachowuje pełną długość | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L905) | `school`, `school-add`, `positive`, `identifier` |
| SCH-49 | SCH-49: zerowa liczba uczniów jest zachowana | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L928) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-31 | SCH-31: WWW i e-mail są zachowane po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L949) | `school`, `school-add`, `positive`, `contact` |
| SCH-53 | SCH-53: pełny adres WWW ze ścieżką i parametrami jest zachowany | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L971) | `school`, `school-add`, `positive`, `contact` |
| SCH-54 | SCH-54: e-mail z wielkimi literami jest normalizowany do małych liter | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L991) | `school`, `school-add`, `positive`, `contact` |
| SCH-36 | SCH-36: przełącznik komórka ustawia format numeru i resetuje się po zapisie | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1013) | `school`, `school-add`, `positive`, `contact` |
| SCH-37 | SCH-37: telefon stacjonarny zachowuje właściwy format po utworzeniu szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1045) | `school`, `school-add`, `positive`, `contact` |
| SCH-38 | SCH-38: niepoprawny e-mail blokuje utworzenie szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1078) | `school`, `school-add`, `validation`, `contact` |
| SCH-39 | SCH-39: niepełny telefon blokuje utworzenie szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1098) | `school`, `school-add`, `validation`, `contact` |
| SCH-40 | SCH-40: przełączenie komórka zmienia maskę bez utraty cyfr | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1122) | `school`, `school-add`, `contact`, `format` |
| SCH-48 | SCH-48: e-mail z subdomeną jest zachowany | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1144) | `school`, `school-add`, `positive`, `contact` |
| SCH-50 | SCH-50: e-mail z aliasem plus jest odrzucany przez backend | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1164) | `school`, `school-add`, `validation`, `contact` |
| SCH-16 | SCH-16: błąd serwera nie otwiera nieistniejącej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1207) | `school`, `school-add`, `error-handling` |
| SCH-58 | SCH-58: HTTP 422 nie otwiera nieutworzonej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1254) | `school`, `school-add`, `error-handling` |
| SCH-59 | SCH-59: timeout sieci nie otwiera nieutworzonej szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1254) | `school`, `school-add`, `error-handling` |
| SCH-42 | SCH-42: pełny formularz zachowuje wszystkie dane opcjonalne | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1294) | `school`, `school-add`, `positive`, `optional-data`, `contact`, `identifier` |
| SCH-55 | SCH-55: pola opcjonalne mogą pozostać puste i szkoła nadal jest trwała | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1358) | `school`, `school-add`, `positive`, `optional-data` |
| SCH-56 | SCH-56: anulowanie kompletnego formularza po uzupełnieniu danych opcjonalnych nie tworzy szkoły | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1397) | `school`, `school-add`, `cancel`, `optional-data` |
| SCH-57 | SCH-57: ponowne otwarcie szkoły zachowuje typ, poziom i adres | [szkola-dodawanie.spec.ts](../../tests/szkola-dodawanie.spec.ts#L1414) | `school`, `school-add`, `positive`, `persistence` |
| SCH-EDIT-01 | SCH-EDIT-01: formularz edycji wczytuje nazwę szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L79) | `school`, `school-edit`, `smoke` |
| SCH-EDIT-02 | SCH-EDIT-02: anulowanie zmiany nazwy zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L95) | `school`, `school-edit`, `cancel` |
| SCH-EDIT-03 | SCH-EDIT-03: zmiana nazwy jest trwała po ponownym otwarciu szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L118) | `school`, `school-edit`, `positive` |
| SCH-EDIT-04 | SCH-EDIT-04: zmiana WWW i e-maila jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L143) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-05 | SCH-EDIT-05: zmiana nazwy z SIO jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L229) | `school`, `school-edit`, `positive`, `sio` |
| SCH-EDIT-06 | SCH-EDIT-06: anulowanie zmiany nazwy z SIO zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L258) | `school`, `school-edit`, `cancel`, `sio` |
| SCH-EDIT-07 | SCH-EDIT-07: pusta nazwa nie pozwala zapisać edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L280) | `school`, `school-edit`, `validation` |
| SCH-EDIT-08 | SCH-EDIT-08: typ i poziom szkoły są nieedytowalne w edycji danych | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L312) | `school`, `school-edit`, `readonly` |
| SCH-EDIT-09 | SCH-EDIT-09: anulowanie edycji WWW zachowuje poprzednią wartość | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L339) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-10 | SCH-EDIT-10: WWW można usunąć i pusta wartość jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L377) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-10A | SCH-EDIT-10A: rezygnacja z usunięcia WWW zachowuje poprzedni adres | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L418) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-11 | SCH-EDIT-11: e-mail można usunąć i pusta wartość jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L468) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-11A | SCH-EDIT-11A: anulowanie edycji e-maila zachowuje poprzedni adres | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L509) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-11B | SCH-EDIT-11B: rezygnacja z usunięcia e-maila zachowuje poprzedni adres | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L547) | `school`, `school-edit`, `cancel`, `contact` |
| SCH-EDIT-12 | SCH-EDIT-12: e-mail z wielkimi literami jest normalizowany po edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L593) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-13 | SCH-EDIT-13: nazwa z polskimi znakami i interpunkcją jest trwała po edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L641) | `school`, `school-edit`, `positive`, `name` |
| SCH-EDIT-14 | SCH-EDIT-14: spacje na brzegach nazwy są usuwane po edycji | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L664) | `school`, `school-edit`, `positive`, `name` |
| SCH-EDIT-15 | SCH-EDIT-15: nazwę z SIO można wyczyścić | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L689) | `school`, `school-edit`, `positive`, `sio` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Szkoła podstawowa i poziom Szkoła Podstawowa są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Liceum i poziom Szkoła Średnia są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Technikum i poziom Szkoła Średnia są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Placówka doskonalenia nauczycieli i poziom Inny są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Zespół szkół i poziom Zespół Szkół są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Szkoła NPC i poziom Szkoła Podstawowa są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-16 | SCH-EDIT-16: typ Przedszkole i poziom Przedszkole są tylko do odczytu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L746) | `school`, `school-edit`, `readonly`, `school-type` |
| SCH-EDIT-17 | SCH-EDIT-17: kolejne edycje różnych pól nie nadpisują wcześniejszych zmian | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L770) | `school`, `school-edit`, `positive`, `regression` |
| SCH-EDIT-18 | SCH-EDIT-18: zmiana adresu szkoły jest trwała | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L867) | `school`, `school-edit`, `positive`, `address` |
| SCH-EDIT-19 | SCH-EDIT-19: dane SIO i liczba uczniów można zmienić i ponownie odczytać | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L887) | `school`, `school-edit`, `positive`, `sio`, `identifier` |
| SCH-EDIT-20 | SCH-EDIT-20: drugi telefon stacjonarny można dodać po przełączeniu typu | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L931) | `school`, `school-edit`, `positive`, `contact` |
| SCH-EDIT-21 | SCH-EDIT-21: zmiana nazwy tworzy kompletny wpis historii szkoły | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L960) | `school`, `school-edit`, `history` |
| SCH-EDIT-22 | SCH-EDIT-22: HTTP 422 nie utrwala zmiany nazwy | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L1001) | `school`, `school-edit`, `error-handling` |
| SCH-EDIT-23 | SCH-EDIT-23: HTTP 500 nie utrwala zmiany nazwy | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L1001) | `school`, `school-edit`, `error-handling` |
| SCH-EDIT-24 | SCH-EDIT-24: timeout sieci nie utrwala zmiany nazwy | [szkola-edycja.spec.ts](../../tests/szkola-edycja.spec.ts#L1001) | `school`, `school-edit`, `error-handling` |
| CAT-35 | CAT-35: nowa Szkoła podstawowa, brak danych uczniów otrzymuje A | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-36 | CAT-36: nowa Szkoła podstawowa, 0 uczniów otrzymuje A | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-37 | CAT-37: nowa Szkoła podstawowa, 1 uczniów otrzymuje C | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-38 | CAT-38: nowa Szkoła podstawowa, 100 uczniów otrzymuje C | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-39 | CAT-39: nowa Szkoła podstawowa, 101 uczniów otrzymuje B | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-40 | CAT-40: nowa Szkoła podstawowa, 400 uczniów otrzymuje B | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-41 | CAT-41: nowa Szkoła podstawowa, 401 uczniów otrzymuje A | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-42 | CAT-42: nowa Szkoła podstawowa, 1200 uczniów otrzymuje A | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-43 | CAT-43: nowa Liceum, 101 uczniów otrzymuje B | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-44 | CAT-44: nowa Technikum, 1 uczniów otrzymuje C | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-45 | CAT-45: nowa Przedszkole, 0 uczniów otrzymuje D | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-46 | CAT-46: nowa Przedszkole, 1 uczniów otrzymuje D | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-47 | CAT-47: nowa Przedszkole, 401 uczniów otrzymuje D | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-48 | CAT-48: nowa Placówka doskonalenia nauczycieli, 0 uczniów otrzymuje D | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-49 | CAT-49: nowa Placówka doskonalenia nauczycieli, 1 uczniów otrzymuje D | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-50 | CAT-50: nowa Placówka doskonalenia nauczycieli, 401 uczniów otrzymuje D | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-51 | CAT-51: nowa Szkoła NPC, 0 uczniów otrzymuje A | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-52 | CAT-52: nowa Szkoła NPC, 1 uczniów otrzymuje C | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-53 | CAT-53: nowa Szkoła NPC, 401 uczniów otrzymuje A | [szkola-kategoria-dodawanie.spec.ts](../../tests/szkola-kategoria-dodawanie.spec.ts#L20) | `school`, `category`, `school-add`, `boundaries`, `persistence` |
| CAT-01 | CAT-01: tabela wyszukiwania zawiera kolumnę Kategoria | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L49) | `school`, `category`, `smoke` |
| CAT-02 | CAT-02: Kategoria znajduje się bezpośrednio po Poziom | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L62) | `school`, `category`, `layout` |
| CAT-03 | CAT-03: kategoria na profilu jest pod poziomem szkoły i tylko do odczytu | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L84) | `school`, `category`, `readonly`, `layout` |
| CAT-04 | CAT-04: Szkoła podstawowa, brak danych uczniów daje kategorię A | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-05 | CAT-05: Szkoła podstawowa, 0 uczniów daje kategorię A | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-06 | CAT-06: Szkoła podstawowa, 1 uczniów daje kategorię C | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-07 | CAT-07: Szkoła podstawowa, 100 uczniów daje kategorię C | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-08 | CAT-08: Szkoła podstawowa, 101 uczniów daje kategorię B | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-09 | CAT-09: Szkoła podstawowa, 400 uczniów daje kategorię B | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-10 | CAT-10: Szkoła podstawowa, 401 uczniów daje kategorię A | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-11 | CAT-11: Szkoła podstawowa, 1200 uczniów daje kategorię A | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-12 | CAT-12: Liceum, 101 uczniów daje kategorię B | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-13 | CAT-13: Technikum, 1 uczniów daje kategorię C | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-14 | CAT-14: Przedszkole, 0 uczniów daje kategorię D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-15 | CAT-15: Przedszkole, 1 uczniów daje kategorię D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-16 | CAT-16: Przedszkole, 401 uczniów daje kategorię D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-17 | CAT-17: Placówka doskonalenia nauczycieli, 0 uczniów daje kategorię D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-18 | CAT-18: Placówka doskonalenia nauczycieli, 1 uczniów daje kategorię D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-19 | CAT-19: Placówka doskonalenia nauczycieli, 401 uczniów daje kategorię D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-20 | CAT-20: Szkoła NPC, 0 uczniów daje kategorię A | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-21 | CAT-21: Szkoła NPC, 1 uczniów daje kategorię C | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-22 | CAT-22: Szkoła NPC, 401 uczniów daje kategorię A | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L113) | `school`, `category`, `boundaries` |
| CAT-23 | CAT-23: Kategoria sortuje alfabetycznie ascending | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L137) | `school`, `category`, `sort` |
| CAT-24 | CAT-24: Kategoria sortuje alfabetycznie descending | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L137) | `school`, `category`, `sort` |
| CAT-25 | CAT-25: zmiany sortowania nie zmieniają szkół i ich kategorii | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L170) | `school`, `category`, `sort` |
| CAT-26 | CAT-26: zmiana liczby uczniów 100 → 101 aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-27 | CAT-27: zmiana liczby uczniów 400 → 401 aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-28 | CAT-28: zmiana liczby uczniów 101 → 100 aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-29 | CAT-29: zmiana liczby uczniów 401 → 0 aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-30 | CAT-30: zmiana liczby uczniów 100 → brak danych aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-31 | CAT-31: zmiana liczby uczniów 0 → 1 aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-32 | CAT-32: zmiana liczby uczniów 401 → 400 aktualizuje kategorię | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L215) | `school`, `category`, `edit` |
| CAT-33 | CAT-33: anulowanie liczby uczniów nie zmienia kategorii | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L234) | `school`, `category`, `cancel` |
| CAT-34 | CAT-34: zmiana liczby uczniów innej placówki zachowuje D | [szkola-kategoria.spec.ts](../../tests/szkola-kategoria.spec.ts#L251) | `school`, `category`, `edit` |
| MED-YEAR-PREP | MED-YEAR-PREP: przygotuj snapshot 4 szkół referencyjnych i 50 losowych szkół | [szkola-medalowosc-annual.spec.ts](../../tests/szkola-medalowosc-annual.spec.ts#L67) | `annual-medal` |
| MED-YEAR-01 | MED-YEAR-01: roczne przeliczenie ustawia oczekiwany medal na podstawie snapshotu | [szkola-medalowosc-annual.spec.ts](../../tests/szkola-medalowosc-annual.spec.ts#L186) | `annual-medal` |
| MED-02 | MED-02: pole Medal dla szkoły ze złotym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L38) | — |
| MED-04 | MED-04: tooltip złotego medalu wyświetla przedmioty składające się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L48) | — |
| MED-05 | MED-05: złoty medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L62) | — |
| MED-07 | MED-07: pole Medal dla szkoły ze srebrnym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L73) | — |
| MED-09 | MED-09: tooltip srebrnego medalu wyświetla przedmioty składające się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L83) | — |
| MED-10 | MED-10: srebrny medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L97) | — |
| MED-12 | MED-12: pole Medal dla szkoły z brązowym medalem jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L108) | — |
| MED-14 | MED-14: tooltip brązowego medalu wyświetla przedmiot składający się na medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L118) | — |
| MED-15 | MED-15: brązowy medal jest widoczny w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L132) | — |
| MED-17 | MED-17: pole Medal dla szkoły bez medalu jest nieedytowalne | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L143) | — |
| MED-18 | MED-18: najechanie na wartość Brak nie wyświetla tooltipa z przedmiotami | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L153) | — |
| MED-19 | MED-19: wartość Brak jest widoczna w wynikach wyszukiwania szkół | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L165) | — |
| MED-20 | MED-20: historia zmian szkoły zawiera wpis dotyczący złotego medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L176) | — |
| MED-21 | MED-21: historia zawiera tylko jeden wpis medalowy dla danego roku szkolnego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L223) | — |
| MED-22 | MED-22: wartość wpisu medalowego ma format RRRR/RRRR Medal | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L262) | — |
| MED-23 | MED-23: wpisy medalowe w historii mają źródło Formularz klubowy | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L289) | — |
| MED-24 | MED-24: wpisy medalowe w historii mają uzupełnionego autora | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L316) | — |
| MED-25 | MED-25: wpisy medalowe w historii są zapisane z datą 1 października | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L343) | — |
| MED-26 | MED-26: wpisy medalowe w historii są posortowane od najnowszego sezonu do najstarszego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L371) | — |
| MED-27 | MED-27: wyszukiwanie po Medal = Złoto zwraca tylko szkoły ze złotym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L423) | — |
| MED-28 | MED-28: wyszukiwanie po Medal = Srebro zwraca tylko szkoły ze srebrnym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L434) | — |
| MED-29 | MED-29: wyszukiwanie po Medal = Brąz zwraca tylko szkoły z brązowym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L445) | — |
| MED-30 | MED-30: wyszukiwanie po Medal = Brak zwraca tylko szkoły bez medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L456) | — |
| MED-31 | MED-31: wyszukiwanie po Medal = Złoto i Srebro zwraca szkoły z oboma wybranymi medalami | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L465) | — |
| MED-33 | MED-33: złoty medal i jego przedmioty są zgodne między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L476) | — |
| MED-36 | MED-36: srebrny medal i jego przedmioty są zgodne między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L506) | — |
| MED-39 | MED-39: brązowy medal i jego przedmioty są zgodne między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L536) | — |
| MED-43 | MED-43: brak medalu i przedmiotów jest zgodny między API i UI | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L566) | — |
| MED-44 | MED-44: medal szkoły jest zgodny z liczbą przedmiotów zwracanych przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L593) | — |
| MED-45 | MED-45: lista przedmiotów wpływających na medal nie zawiera duplikatów | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L621) | — |
| MED-46 | MED-46: wielu nauczycieli MAT SP nie zwiększa liczby przedmiotów medalowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L644) | — |
| MED-47 | MED-47: medal w wynikach wyszukiwania szkoły jest zgodny z wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L683) | — |
| MED-48 | MED-48: przedmioty nauczycieli nie są automatycznie zaliczane do medalowości szkoły | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L713) | — |
| MED-49 | MED-49: najnowszy wpis historii medalu jest zgodny z aktualną wartością zwracaną przez API | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L790) | — |
| MED-50 | MED-50: historia medalowości zawiera maksymalnie jeden wpis dla każdego roku szkolnego | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L858) | — |
| MED-51 | MED-51: wszystkie wpisy historii medalowości mają źródło Formularz klubowy | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L922) | — |
| MED-52 | MED-52: data wpisu medalowości przypada na 1 października roku kończącego sezon | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L962) | — |
| MED-53 | MED-53: wszystkie wpisy historii medalowości są zapisane przez automat | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1012) | — |
| MED-54 | MED-54: wyszukiwanie po ID szkoły ma priorytet nad filtrem medalu | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1052) | — |
| MED-55 | MED-55: filtrowanie bez ID zwraca tylko szkoły z wybranym medalem | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1135) | — |
| MED-56 | MED-56: multiselect medalu jest poprawnie przekazywany do API i zwraca tylko wybrane medale | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1183) | — |
| MED-60 | MED-60: każda szkoła z medalem Brak nie ma przedmiotów medalowych | [szkola-medalowosc.spec.ts](../../tests/szkola-medalowosc.spec.ts#L1368) | — |
| — | szkoła → nauczyciel → relacja → wyszukiwanie → nauczyciel → historia | [szkola-nauczyciel.spec.ts](../../tests/szkola-nauczyciel.spec.ts#L8) | `smoke` |
| TFL-01 | TFL-01: nagłówki są widoczne i klikalne | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L24) | `school`, `teacher-filter`, `smoke` |
| TFL-02 | TFL-02: domyślnie widać wszystkich przypisanych nauczycieli | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L41) | `school`, `teacher-filter`, `default` |
| TFL-03 | TFL-03: Nasi pokazuje dokładnie właściwych nauczycieli | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L54) | `school`, `teacher-filter`, `classification` |
| TFL-04 | TFL-04: Obcy pokazuje dokładnie właściwych nauczycieli | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L54) | `school`, `teacher-filter`, `classification` |
| TFL-05 | TFL-05: Nauczyciele przywraca pełną listę po każdym filtrze | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L64) | `school`, `teacher-filter`, `switch` |
| TFL-06 | TFL-06: liczniki nie maleją po zastosowaniu filtra | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L79) | `school`, `teacher-filter`, `counters` |
| TFL-07 | TFL-07: nauczyciel bez wpisów występuje tylko w pełnej liście | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L95) | `school`, `teacher-filter`, `negative` |
| TFL-08 | TFL-08: jedna osoba może być Nasza i Obca w różnych przedmiotach | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L110) | `school`, `teacher-filter`, `counters` |
| TFL-09 | TFL-09: dwa przedmioty zwiększają licznik Nasi, ale nie duplikują nauczyciela | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L133) | `school`, `teacher-filter`, `duplicates`, `counters` |
| TFL-10 | TFL-10: dwa przedmioty zwiększają licznik Obcy, ale nie duplikują nauczyciela | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L133) | `school`, `teacher-filter`, `duplicates`, `counters` |
| TFL-11 | TFL-11: regresja dziewięć obcych przedmiotów pokazuje sześciu unikalnych nauczycieli | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L156) | `school`, `teacher-filter`, `regression`, `counters` |
| TFL-12 | TFL-12: szkoła bez nauczycieli ma trzy liczniki zero i puste listy | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L183) | `school`, `teacher-filter`, `empty` |
| TFL-13 | TFL-13: grupa Obcy może być pusta przy niepustej szkole | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L199) | `school`, `teacher-filter`, `empty` |
| TFL-14 | TFL-14: grupa Nasi może być pusta przy niepustej szkole | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L199) | `school`, `teacher-filter`, `empty` |
| TFL-15 | TFL-15: zmiana filtrów nie przeładowuje dokumentu ani nie zmienia URL | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L216) | `school`, `teacher-filter`, `dynamic` |
| TFL-16 | TFL-16: aktywny filtr Nasi jest wizualnie wyróżniony | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L256) | `school`, `teacher-filter`, `visual` |
| TFL-17 | TFL-17: aktywny filtr Obcy jest wizualnie wyróżniony | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L256) | `school`, `teacher-filter`, `visual` |
| TFL-18 | TFL-18: aktywny filtr Nauczyciele jest wizualnie wyróżniony | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L256) | `school`, `teacher-filter`, `visual` |
| TFL-19 | TFL-19: filtrowanie nie zmienia podstawowych danych szkoły | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L278) | `school`, `teacher-filter`, `isolation` |
| TFL-20 | TFL-20: pozostałe zakładki są dostępne przy aktywnym filtrze | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L302) | `school`, `teacher-filter`, `tabs` |
| TFL-21 | TFL-21: klasyfikacja uwzględnia szkołę wpisu, nie status globalny | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L320) | `school`, `teacher-filter`, `school-context` |
| TFL-22 | TFL-22: zmiana GWO na inne wydawnictwo aktualizuje listy i liczniki | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L347) | `school`, `teacher-filter`, `latest-entry` |
| TFL-23 | TFL-23: zmiana inne wydawnictwo na GWO aktualizuje listy i liczniki | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L347) | `school`, `teacher-filter`, `latest-entry` |
| TFL-24 | TFL-24: usunięte potwierdzenie GWO nie kwalifikuje do grup | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L374) | `school`, `teacher-filter`, `soft-delete` |
| TFL-25 | TFL-25: usunięte potwierdzenie obce nie kwalifikuje do grup | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L374) | `school`, `teacher-filter`, `soft-delete` |
| TFL-26 | TFL-26: aktualne GWO ma pierwszeństwo przed przyszłym Obcy po GWO | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L396) | `school`, `teacher-filter`, `regression`, `school-year` |
| TFL-27 | TFL-27: ponowne kliknięcie filtra nie zmienia wyników ani liczników | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L438) | `school`, `teacher-filter`, `repeat` |
| TFL-28 | TFL-28: filtry można uruchomić klawiaturą | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L454) | `school`, `teacher-filter`, `keyboard` |
| TFL-29 | TFL-29: filtrowanie nie zmienia danych po ponownym otwarciu szkoły | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L473) | `school`, `teacher-filter`, `persistence` |
| TFL-30 | TFL-30: nauczyciel przypisany tylko do innej szkoły nie jest pokazywany | [szkola-nauczyciele-filtry.spec.ts](../../tests/szkola-nauczyciele-filtry.spec.ts#L485) | `school`, `teacher-filter`, `school-context` |
| THR-01 | THR-01: SP 0 uczniów daje próg cyfrowy 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-02 | THR-02: SP 1 uczniów daje próg cyfrowy 1 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-03 | THR-03: SP 6 uczniów daje próg cyfrowy 1 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-04 | THR-04: SP 7 uczniów daje próg cyfrowy 1 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-05 | THR-05: SP 19 uczniów daje próg cyfrowy 1 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-06 | THR-06: SP 20 uczniów daje próg cyfrowy 2 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-07 | THR-07: SP 21 uczniów daje próg cyfrowy 2 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-08 | THR-08: SP 59 uczniów daje próg cyfrowy 4 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-09 | THR-09: SP 60 uczniów daje próg cyfrowy 5 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-10 | THR-10: SP 61 uczniów daje próg cyfrowy 5 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-11 | THR-11: SP 100 uczniów daje próg cyfrowy 8 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-12 | THR-12: SP 400 uczniów daje próg cyfrowy 30 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-13 | THR-13: SP 750 uczniów daje próg cyfrowy 56 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-14 | THR-14: SP 1200 uczniów daje próg cyfrowy 90 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L35) | `school`, `threshold`, `boundaries` |
| THR-15 | THR-15: Przedszkole 1 uczniów ma stały próg 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L59) | `school`, `threshold` |
| THR-16 | THR-16: Przedszkole 400 uczniów ma stały próg 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L59) | `school`, `threshold` |
| THR-17 | THR-17: Przedszkole 1200 uczniów ma stały próg 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L59) | `school`, `threshold` |
| THR-18 | THR-18: Szkoła NPC 1 uczniów ma stały próg 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L59) | `school`, `threshold` |
| THR-19 | THR-19: Szkoła NPC 400 uczniów ma stały próg 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L59) | `school`, `threshold` |
| THR-20 | THR-20: Szkoła NPC 1200 uczniów ma stały próg 10 | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L59) | `school`, `threshold` |
| THR-21 | THR-21: zapis SIO przelicza próg cyfrowy w otwartym profilu | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L76) | `school`, `threshold`, `edit` |
| THR-22 | THR-22: anulowanie SIO nie zmienia progu | [szkola-prog.spec.ts](../../tests/szkola-prog.spec.ts#L124) | `school`, `threshold`, `cancel` |
| STR-88 | STR-88: nowa szkoła udostępnia dialog struktury bez nadanego ID | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L165) | `school`, `structure`, `school-add` |
| STR-89 | STR-89: Zapisz strukturę odkłada relację do zapisu nowej szkoły | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L183) | `school`, `structure`, `school-add`, `api` |
| STR-90 | STR-90: nowa szkoła utrwala Filia / Podrzędna | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L266) | `school`, `structure`, `school-add`, `persistence` |
| STR-91 | STR-91: nowa szkoła utrwala Filia / Nadrzędna | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L266) | `school`, `structure`, `school-add`, `persistence` |
| STR-92 | STR-92: nowa szkoła utrwala Zespół szkół / Nadrzędna | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L266) | `school`, `structure`, `school-add`, `persistence` |
| STR-93 | STR-93: nowa szkoła utrwala Zespół szkół / Podrzędna | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L266) | `school`, `structure`, `school-add`, `persistence` |
| STR-94 | STR-94: nowa szkoła utrwala Wielobudynkowość / Podrzędna | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L266) | `school`, `structure`, `school-add`, `persistence` |
| STR-95 | STR-95: nowa szkoła utrwala Wielobudynkowość / Nadrzędna | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L266) | `school`, `structure`, `school-add`, `persistence` |
| STR-96 | STR-96: nowa szkoła utrwala kilka powiązań z jednego formularza | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L307) | `school`, `structure`, `school-add`, `persistence` |
| STR-97 | STR-97: anulowanie dialogu struktury zachowuje szkołę i odrzuca roboczą relację | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L350) | `school`, `structure`, `school-add`, `cancel` |
| STR-98 | STR-98: anulowanie nowej szkoły odrzuca zaakceptowaną strukturę | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L377) | `school`, `structure`, `school-add`, `cancel` |
| STR-99 | STR-99: zaakceptowaną pozycję można usunąć przed utworzeniem szkoły | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L404) | `school`, `structure`, `school-add`, `cancel` |
| STR-100 | STR-100: nowa szkoła nie planuje dwukrotnie tej samej szkoły | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L430) | `school`, `structure`, `school-add`, `validation` |
| STR-101 | STR-101: puste wyszukiwanie nie zamyka żadnego formularza | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L463) | `school`, `structure`, `school-add`, `validation` |
| STR-102 | STR-102: zmiany roboczego typu i kierunku przechodzą do ponownie otwartego dialogu | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L479) | `school`, `structure`, `school-add`, `edit` |
| STR-103 | STR-103: gotowa struktura nie omija obowiązkowej nazwy nowej szkoły | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L513) | `school`, `structure`, `school-add`, `validation` |
| STR-104 | STR-104: HTTP 422 zapisu szkoły nie zapisuje osieroconej struktury | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L546) | `school`, `structure`, `school-add`, `negative`, `mock` |
| STR-105 | STR-105: HTTP 500 zapisu szkoły nie zapisuje osieroconej struktury | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L546) | `school`, `structure`, `school-add`, `negative`, `mock` |
| STR-106 | STR-106: timeout zapisu szkoły nie zapisuje osieroconej struktury | [szkola-struktura-dodawanie.spec.ts](../../tests/szkola-struktura-dodawanie.spec.ts#L546) | `school`, `structure`, `school-add`, `negative`, `mock` |
| STR-01 | STR-01: szkoła bez relacji pokazuje pusty stan struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L119) | `school`, `structure`, `smoke` |
| STR-02 | STR-02: pusty stan blokuje filtrowanie struktury i pozwala dodać powiązanie | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L129) | `school`, `structure`, `validation` |
| STR-03 | STR-03: dialog dodawania zawiera filtry, obie tabele i akcje | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L143) | `school`, `structure`, `dialog` |
| STR-04 | STR-04: puste wyszukiwanie pokazuje walidację i pozostawia dialog otwarty | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L185) | `school`, `structure`, `negative` |
| STR-05 | STR-05: anulowanie pustego dialogu nie zmienia struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L197) | `school`, `structure`, `cancel` |
| STR-06 | STR-06: wyszukiwanie po dokładnym ID zwraca właściwą szkołę | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L212) | `school`, `structure`, `search` |
| STR-07 | STR-07: wyszukiwanie po pełnej nazwie zwraca właściwą szkołę | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L224) | `school`, `structure`, `search` |
| STR-08 | STR-08: wyszukiwanie po fragmencie nazwy zwraca pasującą szkołę | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L236) | `school`, `structure`, `search` |
| STR-09 | STR-09: wyszukiwanie po kodzie pocztowym zwraca zgodne adresy | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L257) | `school`, `structure`, `search` |
| STR-10 | STR-10: wyszukiwanie po miejscowości zwraca zgodne adresy | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L269) | `school`, `structure`, `search` |
| STR-11 | STR-11: wyszukiwanie po ulicy zwraca zgodne adresy | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L281) | `school`, `structure`, `search` |
| STR-12 | STR-12: wyszukiwanie łączy ID i nazwę szkoły | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L293) | `school`, `structure`, `search` |
| STR-13 | STR-13: nieistniejące ID pozostawia pustą tabelę wyników | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L305) | `school`, `structure`, `search`, `negative` |
| STR-14 | STR-14: szkołę można dodać do planowanych powiązań bez zapisu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L322) | `school`, `structure`, `positive` |
| STR-15 | STR-15: niezapisaną szkołę można usunąć z planowanych powiązań | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L337) | `school`, `structure`, `cancel` |
| STR-16 | STR-16: pojedyncze poprawne powiązanie wysyła jedno żądanie zapisu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L355) | `school`, `structure`, `api` |
| STR-17 | STR-17: trwałość relacji po ponownym otwarciu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L385) | `school`, `structure`, `persistence` |
| STR-18 | STR-18: anulowanie po dodaniu szkoły nie zachowuje planowanego powiązania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L409) | `school`, `structure`, `cancel` |
| STR-19 | STR-19: kilka szkół jest wysyłanych dokładnie raz w jednym zapisie | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L438) | `school`, `structure`, `api` |
| STR-20 | STR-20: Pokaż zaznaczone otwiera wybrane szkoły w nowej karcie | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L461) | `school`, `structure`, `filter` |
| STR-21 | STR-21: typ „Zespół szkół” jest dostępny i mapowany do kontraktu API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L502) | `school`, `structure`, `api` |
| STR-22 | STR-22: typ „Filia” jest dostępny i mapowany do kontraktu API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L502) | `school`, `structure`, `api` |
| STR-23 | STR-23: typ „Wielobudynkowość” jest dostępny i mapowany do kontraktu API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L502) | `school`, `structure`, `api` |
| STR-24 | STR-24: nieistniejący typ relacji jest odrzucany | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L522) | `school`, `structure`, `api`, `negative` |
| STR-25 | STR-25: duplikat aktywnej relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L535) | `school`, `structure`, `validation` |
| STR-26 | STR-26: drugi typ nie tworzy drugiej aktywnej relacji dla pary | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L570) | `school`, `structure`, `api` |
| STR-27 | STR-27: bieżącej szkoły nie można dodać jako własnego powiązania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L590) | `school`, `structure`, `validation`, `negative` |
| STR-28 | STR-28: cykl bezpośredni jest blokowany przez API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L616) | `school`, `structure`, `api`, `negative` |
| STR-29 | STR-29: cykl pośredni jest blokowany przez API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L632) | `school`, `structure`, `api`, `negative` |
| STR-30 | STR-30: cztery poziomy i wielorakie role szkoły są obsługiwane | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L647) | `school`, `structure`, `hierarchy` |
| STR-31 | STR-31: hierarchia głębsza niż cztery poziomy nie ma sztucznego limitu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L674) | `school`, `structure`, `hierarchy` |
| STR-32 | STR-32: edycja typu zapisanej relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L702) | `school`, `structure`, `edit` |
| STR-33 | STR-33: zamiana stron zapisanej relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L743) | `school`, `structure`, `edit` |
| STR-34 | STR-34: ikona śmietnika usuwa relację ze struktury | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L774) | `school`, `structure`, `delete` |
| STR-35 | STR-35: ponowne dodanie reaktywuje ten sam rekord relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L802) | `school`, `structure`, `persistence` |
| STR-36 | STR-36: relację można ponownie dodać po usunięciu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L832) | `school`, `structure`, `delete` |
| STR-37 | STR-37: usunięta relacja nie trafia do aktywnego drzewa ani formularza | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L854) | `school`, `structure`, `delete` |
| STR-38 | STR-38: nadany identyfikator zespołu ma dokładnie trzy cyfry | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L873) | `school`, `structure`, `identifier` |
| STR-39 | STR-39: dwa dedykowane zespoły mają różne identyfikatory | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L888) | `school`, `structure`, `identifier` |
| STR-40 | STR-40: identyfikatory zespołu i szkół nie kolidują w danych referencyjnych | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L899) | `school`, `structure`, `identifier` |
| STR-41 | STR-41: wyszukiwanie zespołu po własnym ID jest jednoznaczne | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L916) | `school`, `structure`, `search` |
| STR-42 | STR-42: publiczne API jednoznacznie identyfikuje zespół | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L932) | `school`, `structure`, `api` |
| STR-43 | STR-43: API zachowuje ID, obie strony i typ zapisanej relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L958) | `school`, `structure`, `api`, `persistence` |
| STR-44 | STR-44: wybór typu w UI odpowiada słownikowi API | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L974) | `school`, `structure`, `dictionary` |
| STR-45 | STR-45: historia pokazuje utworzenie relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1009) | `school`, `structure`, `history` |
| STR-46 | STR-46: historia pokazuje zmianę typu relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1022) | `school`, `structure`, `history` |
| STR-47 | STR-47: historia pokazuje usunięcie relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1048) | `school`, `structure`, `history` |
| STR-48 | STR-48: historia pokazuje reaktywację relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1063) | `school`, `structure`, `history` |
| STR-49 | STR-49: odpowiedź 422 nie zamyka dialogu ani nie ponawia zapisu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1080) | `school`, `structure`, `api`, `negative` |
| STR-50 | STR-50: odpowiedź 500 zachowuje przygotowaną relację i pozwala ponowić zapis | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1099) | `school`, `structure`, `api`, `negative` |
| STR-51 | STR-51: równoczesna edycja zgłasza konflikt zamiast cichego nadpisania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1120) | `school`, `structure`, `api`, `concurrency` |
| STR-52 | STR-52: obecny użytkownik ma akcje dodawania, edycji i usuwania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1161) | `school`, `structure`, `permissions` |
| STR-53 | STR-53: wyszukiwanie złożone wyłącznie z białych znaków jest odrzucane | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1188) | `school`, `structure`, `validation`, `negative` |
| STR-54 | STR-54: ponowne wyszukiwanie zastępuje poprzednie wyniki | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1208) | `school`, `structure`, `search` |
| STR-55 | STR-55: tej samej szkoły nie można dodać dwukrotnie do planowanych powiązań | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1227) | `school`, `structure`, `validation` |
| STR-56 | STR-56: usuniętą planowaną szkołę można ponownie dodać | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1247) | `school`, `structure`, `positive` |
| STR-57 | STR-57: anulowanie kilku planowanych powiązań nie zachowuje żadnego z nich | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1264) | `school`, `structure`, `cancel` |
| STR-58 | STR-58: brak szkoły nadrzędnej nie zapisuje relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1296) | `school`, `structure`, `api`, `negative` |
| STR-59 | STR-59: brak szkoły podrzędnej nie zapisuje relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1296) | `school`, `structure`, `api`, `negative` |
| STR-60 | STR-60: brak typu relacji nie zapisuje relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1296) | `school`, `structure`, `api`, `negative` |
| STR-61 | STR-61: samopowiązanie w API nie zapisuje relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1296) | `school`, `structure`, `api`, `negative` |
| STR-62 | STR-62: nieistniejąca szkoła nie zapisuje relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1296) | `school`, `structure`, `api`, `negative` |
| STR-63 | STR-63: filii nie można przypisać do dwóch szkół głównych | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1312) | `school`, `structure`, `api`, `negative` |
| STR-64 | STR-64: relacje pośrednie są tylko do odczytu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1328) | `school`, `structure`, `permissions` |
| STR-65 | STR-65: dodatkowa lokalizacja modyfikuje wyłącznie bezpośrednią wielobudynkowość | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1364) | `school`, `structure`, `permissions` |
| STR-66 | STR-66: lokalizacja jest przed filią niezależnie od kolejności utworzenia | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1401) | `school`, `structure`, `layout` |
| STR-67 | STR-67: ikony i wcięcia odwzorowują poziomy bez zwijania | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1423) | `school`, `structure`, `layout` |
| STR-68 | STR-68: podstruktura pozostaje ciągła przed kolejnym rodzeństwem | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1478) | `school`, `structure`, `layout` |
| STR-69 | STR-69: Nie w potwierdzeniu nie usuwa relacji ani szkoły | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1509) | `school`, `structure`, `cancel` |
| STR-70 | STR-70: anulowanie edycji odrzuca typ i hierarchię | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1537) | `school`, `structure`, `cancel` |
| STR-71 | STR-71: usunięcie relacji zachowuje obie szkoły | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1559) | `school`, `structure`, `delete` |
| STR-72 | STR-72: timeout zapisu zachowuje dialog i przygotowaną relację | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1573) | `school`, `structure`, `negative` |
| STR-73 | STR-73: blokada aktywnego procesu nie usuwa relacji w UI | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1594) | `school`, `structure`, `negative`, `mock` |
| STR-74 | STR-74: blokada aktywnego procesu zachowuje edytowaną relację | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1629) | `school`, `structure`, `negative`, `mock` |
| STR-75 | STR-75: zespół przyjmuje SP, LO i przedszkole | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1667) | `school`, `structure`, `positive` |
| STR-76 | STR-76: Nadrzędna oznacza wyszukaną szkołę jako rodzica dla Zespół szkół | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1694) | `school`, `structure`, `hierarchy` |
| STR-77 | STR-77: Nadrzędna oznacza wyszukaną szkołę jako rodzica dla Filia | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1694) | `school`, `structure`, `hierarchy` |
| STR-78 | STR-78: Nadrzędna oznacza wyszukaną szkołę jako rodzica dla Wielobudynkowość | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1694) | `school`, `structure`, `hierarchy` |
| STR-79 | STR-79: zawieszonej szkoły nie można powiązać | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1716) | `school`, `structure`, `status`, `negative` |
| STR-80 | STR-80: zamówienie wymaga potwierdzenia usuwania relacji i pozostaje po anulowaniu | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1739) | `school`, `structure`, `order` |
| STR-81 | STR-81: cykl zamykający siedem poziomów jest blokowany | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1785) | `school`, `structure`, `api`, `negative` |
| STR-82 | STR-82: pojedynczy zapis formularza utrwala kilka relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1810) | `school`, `structure`, `api` |
| STR-83 | STR-83: błędna pozycja nie zostawia częściowego zapisu formularza | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1844) | `school`, `structure`, `api`, `negative` |
| STR-84 | STR-84: równoczesne dodanie nie tworzy dwóch aktywnych relacji | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1862) | `school`, `structure`, `api`, `concurrency` |
| STR-85 | STR-85: Pokaż wszystkie działa niezależnie od Pokaż zaznaczone | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1874) | `school`, `structure`, `filter` |
| STR-86 | STR-86: historia zespołu szkół zawiera audyt dodania szkoły | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1901) | `school`, `structure`, `history` |
| STR-87 | STR-87: przejście do roli dodatkowej lokalizacji ogranicza akcje istniejącej filii | [szkola-struktura.spec.ts](../../tests/szkola-struktura.spec.ts#L1920) | `school`, `structure`, `permissions` |
| SFLT-01 | SFLT-01: formularz zawiera nowe pola i komplet opcji | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L20) | `school`, `school-search`, `smoke` |
| SFLT-02 | SFLT-02: kategorie A filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-03 | SFLT-03: kategorie B filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-04 | SFLT-04: kategorie C filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-05 | SFLT-05: kategorie D filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-06 | SFLT-06: kategorie A lub B filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-07 | SFLT-07: kategorie A lub C filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-08 | SFLT-08: kategorie A lub B lub C lub D filtrują jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L51) | `school`, `school-search`, `category` |
| SFLT-09 | SFLT-09: Medal Brak lub Złoto działa jako OR | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L75) | `school`, `school-search`, `medal` |
| SFLT-10 | SFLT-10: Medal Brak obejmuje kategorię A | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L120) | `school`, `school-search`, `medal`, `category` |
| SFLT-11 | SFLT-11: Medal Brak obejmuje kategorię B | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L120) | `school`, `school-search`, `medal`, `category` |
| SFLT-12 | SFLT-12: Medal Brak obejmuje kategorię C | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L120) | `school`, `school-search`, `medal`, `category` |
| SFLT-13 | SFLT-13: Medal Brak obejmuje kategorię D | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L120) | `school`, `school-search`, `medal`, `category` |
| SFLT-14 | SFLT-14: Medal i Kategoria i nazwa działają jako AND | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L149) | `school`, `school-search`, `and` |
| SFLT-15 | SFLT-15: nazwa zawęża wyniki kategorii | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L173) | `school`, `school-search`, `and` |
| SFLT-16 | SFLT-16: poziom ogranicza wyniki Medalu i Kategorii | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L185) | `school`, `school-search`, `and` |
| SFLT-17 | SFLT-17: RSPO wymaga dokładnego numeru | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L215) | `school`, `school-search`, `rspo` |
| SFLT-18 | SFLT-18: fragment RSPO nie zwraca dopasowania częściowego | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L232) | `school`, `school-search`, `rspo`, `negative` |
| SFLT-19 | SFLT-19: dokładny RSPO ma pierwszeństwo nad niezgodną kategorią | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L249) | `school`, `school-search`, `rspo`, `priority` |
| SFLT-20 | SFLT-20: brak wyników zastępuje poprzednią listę komunikatem | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L282) | `school`, `school-search`, `empty` |
| SFLT-21 | SFLT-21: wyczyszczenie pola Kategoria krzyżykiem usuwa ograniczenie wyników | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L305) | `school`, `school-search`, `clear` |
| SFLT-22 | SFLT-22: wyczyszczenie pola Medal krzyżykiem usuwa ograniczenie wyników | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L305) | `school`, `school-search`, `clear` |
| SFLT-23 | SFLT-23: wyczyszczenie SI przywraca brak ograniczenia | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L351) | `school`, `school-search`, `clear` |
| SFLT-24 | SFLT-24: kolejne wyszukanie zastępuje poprzednią kategorię | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L370) | `school`, `school-search`, `repeat` |
| SFLT-25 | SFLT-25: poprawienie błędnego RSPO pozwala wyszukać szkołę | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L387) | `school`, `school-search`, `validation` |
| SFLT-26 | SFLT-26: SI Tak łączy się z nazwą kategorią i medalem | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L406) | `school`, `school-search`, `si`, `and` |
| SFLT-27 | SFLT-27: SI Nie łączy się z nazwą kategorią i medalem | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L406) | `school`, `school-search`, `si`, `and` |
| SFLT-28 | SFLT-28: sezon SI według fixture OCTOPUS_SEARCH_SI_CURRENT | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L440) | `school`, `school-search`, `si`, `season` |
| SFLT-29 | SFLT-29: sezon SI według fixture OCTOPUS_SEARCH_SI_PAST_ONLY | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L440) | `school`, `school-search`, `si`, `season` |
| SFLT-30 | SFLT-30: sezon SI według fixture OCTOPUS_SEARCH_SI_FUTURE_ONLY | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L440) | `school`, `school-search`, `si`, `season` |
| SFLT-31 | SFLT-31: wymagane pole Notatki jest dostępne niezależnie od Tagów | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L473) | `school`, `school-search`, `notes` |
| SFLT-32 | SFLT-32: RSPO działa samodzielnie bez nazwy i pozostałych filtrów | [szkola-wyszukiwanie-filtry.spec.ts](../../tests/szkola-wyszukiwanie-filtry.spec.ts#L482) | `school`, `school-search`, `rspo` |
| ACC-01 | ACC-01: przyznana klasa trafia do eksportu wraz z poziomem i zakresem | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L15) | `teacher`, `entitlement`, `access-api` |
| ACC-02 | ACC-02: kilka klas przedmiotu tworzy jeden teachingAssignment | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L35) | `teacher`, `entitlement`, `access-api` |
| ACC-03 | ACC-03: eksport grupuje dwa przedmioty oddzielnie | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L55) | `teacher`, `entitlement`, `access-api` |
| ACC-04 | ACC-04: odebrana decyzja nie pozostawia przyznanych klas w eksporcie | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L91) | `teacher`, `entitlement`, `access-api`, `negative` |
| ACC-05 | ACC-05: uprawnienie z 2026 nie trafia do eksportu roku 2025 | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L114) | `teacher`, `entitlement`, `access-api`, `year` |
| ACC-06 | ACC-06: identyczne przypisania z dwóch szkół nie są duplikowane | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L137) | `teacher`, `entitlement`, `access-api`, `deduplication` |
| ACC-07 | ACC-07: ta sama klasa Fizyki zachowuje dwa różne zakresy w eksporcie | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L177) | `teacher`, `entitlement`, `access-api`, `scope` |
| ACC-08 | ACC-08: odebranie F+ nie odbiera TNŚ dla tej samej klasy | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L187) | `teacher`, `entitlement`, `access-api`, `scope`, `manual` |
| ACC-09 | ACC-09: odmowa w jednej szkole nie przesłania przyznania tej samej klasy w drugiej | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L199) | `teacher`, `entitlement`, `access-api`, `isolation` |
| ACC-10 | ACC-10: usunięcie jednego z dwóch źródeł nie usuwa wspólnej klasy z eksportu | [uprawnienia-api.spec.ts](../../tests/uprawnienia-api.spec.ts#L210) | `teacher`, `entitlement`, `access-api`, `deduplication`, `delete` |
| ACL-01 | ACL-01: usunięcie blokuje również ręczne nadanie BOK | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L64) | `teacher`, `entitlement`, `access-lifecycle`, `manual` |
| ACL-02 | ACL-02: zmiana wszystkich klas na obce blokuje również ręczne nadanie BOK | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L64) | `teacher`, `entitlement`, `access-lifecycle`, `manual` |
| ACL-03 | ACL-03: weryfikacja negatywna blokuje również ręczne nadanie BOK | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L64) | `teacher`, `entitlement`, `access-lifecycle`, `manual` |
| ACL-04 | ACL-04: usunięcie Matematyki nie odbiera aktywnej Fizyki | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L91) | `teacher`, `entitlement`, `access-lifecycle`, `isolation` |
| ACL-05 | ACL-05: usunięcie potwierdzenia zachowuje wcześniejszą historię BOK | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L130) | `teacher`, `entitlement`, `access-lifecycle`, `history` |
| ACL-06 | ACL-06: przywrócenie potwierdzenia ponownie tworzy podstawę dostępu | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L154) | `teacher`, `entitlement`, `access-lifecycle`, `restore` |
| ACL-07 | ACL-07: zmiana obce na nasze ponownie aktywuje rekord uprawnień | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L172) | `teacher`, `entitlement`, `access-lifecycle`, `publisher` |
| ACL-08 | ACL-08: najpierw zamówienie — istniejące dane zamówienia są wykorzystane | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L191) | `teacher`, `entitlement`, `access-lifecycle`, `orders` |
| ACL-09 | ACL-09: najpierw potwierdzenie — istniejące dane zamówienia są wykorzystane | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L191) | `teacher`, `entitlement`, `access-lifecycle`, `orders` |
| ACL-10 | ACL-10: nowe zamówienie nie nadpisuje ręcznej odmowy BOK | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L243) | `teacher`, `entitlement`, `access-lifecycle`, `manual`, `orders` |
| ACL-11 | ACL-11: usunięcie potwierdzenia nie usuwa zamówienia szkoły | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L283) | `teacher`, `entitlement`, `access-lifecycle`, `isolation`, `orders` |
| ACL-12 | ACL-12: zawieszenie nauczyciela blokuje także ręcznie przyznany dostęp | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L308) | `teacher`, `entitlement`, `access-lifecycle`, `suspension`, `manual` |
| ACL-13 | ACL-13: usunięcie potwierdzenia jednej szkoły zachowuje inne klasy przedmiotu z drugiej szkoły | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L367) | `teacher`, `entitlement`, `access-lifecycle`, `isolation` |
| ACL-14 | ACL-14: zmiana decyzji BOK z Matematyki nie zmienia Fizyki ani jej historii | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L391) | `teacher`, `entitlement`, `access-lifecycle`, `manual`, `isolation` |
| ACL-15 | ACL-15: usunięcie zamówienia przelicza ilość ale zachowuje ręczne nadanie dostępu | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L414) | `teacher`, `entitlement`, `access-lifecycle`, `orders`, `manual` |
| ACL-16 | ACL-16: korekta zamówienia poniżej progu nie nadpisuje ręcznego nadania BOK | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L449) | `teacher`, `entitlement`, `access-lifecycle`, `orders`, `manual` |
| ACL-17 | ACL-17: przywrócenie potwierdzenia wykorzystuje pozostawione zamówienie i zachowuje historię | [uprawnienia-cykl-zycia.spec.ts](../../tests/uprawnienia-cykl-zycia.spec.ts#L488) | `teacher`, `entitlement`, `access-lifecycle`, `restore`, `orders` |
| DEB-01 | DEB-01: pierwsze potwierdzenie Matematyka 4 daje pełny zakres właściwej serii bez zamówień | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L26) | `teacher`, `entitlement`, `promotion`, `debut`, `seasonal` |
| DEB-02 | DEB-02: pierwsze potwierdzenie Fizyka 7 daje pełny zakres właściwej serii bez zamówień | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L26) | `teacher`, `entitlement`, `promotion`, `debut`, `seasonal` |
| DEB-03 | DEB-03: pierwsze potwierdzenie Fizyka 7 TNŚ daje pełny zakres właściwej serii bez zamówień | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L26) | `teacher`, `entitlement`, `promotion`, `debut`, `seasonal` |
| DEB-04 | DEB-04: poprzedni rok obcy i obecny nasz uruchamiają debiut bez zakupów | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L45) | `teacher`, `entitlement`, `promotion`, `debut`, `seasonal` |
| DEB-07 | DEB-07: znany nauczyciel matematyki może debiutować z fizyki | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L62) | `teacher`, `entitlement`, `promotion`, `debut`, `isolation`, `seasonal` |
| DEB-08 | DEB-08: po 30 września zakup klasy 4 daje zakres zamówieniowy 4–6 zamiast debiutu 4–8 | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L81) | `teacher`, `entitlement`, `promotion`, `debut`, `seasonal` |
| DEB-05 | DEB-05: wcześniejsze nasze potwierdzenie matematyki wyklucza debiut z matematyki | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L103) | `teacher`, `entitlement`, `promotion`, `debut`, `negative`, `seasonal` |
| DEB-06 | DEB-06: od 1 października pierwsze potwierdzenie bez zamówień nie daje promocji debiutu | [uprawnienia-promocja-debiutu.spec.ts](../../tests/uprawnienia-promocja-debiutu.spec.ts#L123) | `teacher`, `entitlement`, `promotion`, `debut`, `negative`, `seasonal` |
| NCL-01 | NCL-01: zamówienie klasy 4 na progu rozszerza dostęp do 4–6 | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L49) | `teacher`, `entitlement`, `promotion`, `new-client` |
| NCL-02 | NCL-02: zamówienie poniżej progu nie uruchamia promocji | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L49) | `teacher`, `entitlement`, `promotion`, `new-client` |
| NCL-03 | NCL-03: zamówienie powyżej progu rozszerza dostęp do 4–6 | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L49) | `teacher`, `entitlement`, `promotion`, `new-client` |
| NCL-04 | NCL-04: zamówienia poniżej progu w obu poprzednich latach nie wykluczają nowego klienta | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L49) | `teacher`, `entitlement`, `promotion`, `new-client` |
| NCL-05 | NCL-05: klasa 7 rozszerza dostęp tylko do 7–8 | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L82) | `teacher`, `entitlement`, `promotion`, `new-client`, `ranges` |
| NCL-06 | NCL-06: zakup w obu zakresach daje sumę 4–8 | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L82) | `teacher`, `entitlement`, `promotion`, `new-client`, `ranges` |
| NCL-07 | NCL-07: korekta zakupu odbiera promocję bez pozostawienia klas 5–6 | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L111) | `teacher`, `entitlement`, `promotion`, `new-client`, `recalculation` |
| NCL-08 | NCL-08: usunięcie zakupu odbiera promocję bez pozostawienia klas 5–6 | [uprawnienia-promocja-nowy-klient.spec.ts](../../tests/uprawnienia-promocja-nowy-klient.spec.ts#L111) | `teacher`, `entitlement`, `promotion`, `new-client`, `recalculation` |
| TEA-02 | TEA-02: brak pola imię blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola nazwisko blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola szkoła blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-02 | TEA-02: brak pola kontakt blokuje zapis nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L5) | `validation` |
| TEA-03 | TEA-03: anulowanie kompletnego formularza nie tworzy nauczyciela | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L50) | `cancel` |
| SCH-02 | SCH-02: anulowanie kompletnego formularza nie tworzy szkoły | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L63) | `cancel` |
| EDIT-02 | EDIT-02: anulowanie edycji zachowuje dane i historię | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L75) | `cancel` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — teacher | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L122) | `search` |
| FIND-04 | FIND-04: brak wyników usuwa poprzednią listę — school | [walidacja-anulowanie.spec.ts](../../tests/walidacja-anulowanie.spec.ts#L122) | `search` |
| ORD-DOC-01 | ORD-DOC-01: dokument PDF można podejrzeć i pobrać bez zmiany bajtów | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L41) | `school`, `order`, `attachment`, `order-document`, `download` |
| ORD-DOC-02 | ORD-DOC-02: dokument JPG można podejrzeć i pobrać bez zmiany bajtów | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L41) | `school`, `order`, `attachment`, `order-document`, `download` |
| ORD-DOC-03 | ORD-DOC-03: dokument PNG można podejrzeć i pobrać bez zmiany bajtów | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L41) | `school`, `order`, `attachment`, `order-document`, `download` |
| ORD-DOC-04 | ORD-DOC-04: podgląd i pobieranie każdego z kilku dokumentów | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L66) | `school`, `order`, `attachment`, `order-document`, `download` |
| ORD-DOC-05 | ORD-DOC-05: dodanie dokumentu podczas edycji zachowuje poprzedni | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L102) | `school`, `order`, `attachment`, `order-document`, `edit` |
| ORD-DOC-06 | ORD-DOC-06: usunięcie jednego zapisanego dokumentu nie usuwa pozostałych | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L136) | `school`, `order`, `attachment`, `order-document`, `edit` |
| ORD-DOC-07 | ORD-DOC-07: edycja ilości nie zmienia ID ani zawartości dokumentu | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L161) | `school`, `order`, `attachment`, `order-document`, `edit` |
| ORD-DOC-08 | ORD-DOC-08: zamiana produktu zachowuje istniejące dokumenty | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L177) | `school`, `order`, `attachment`, `order-document`, `edit` |
| ORD-DOC-09 | ORD-DOC-09: anulowanie dodania i usunięcia dokumentów nie zmienia repozytorium | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L194) | `school`, `order`, `attachment`, `order-document`, `cancel` |
| ORD-DOC-10 | ORD-DOC-10: identyczne nazwy oryginalne nie nadpisują różnych dokumentów | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L216) | `school`, `order`, `attachment`, `order-document`, `filename` |
| ORD-DOC-11 | ORD-DOC-11: osiem dokumentów jest przechowywanych niezależnie | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L247) | `school`, `order`, `attachment`, `order-document`, `multiple` |
| ORD-DOC-12 | ORD-DOC-12: zamówienie dokumentowe pokazuje autora i datę utworzenia | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L267) | `school`, `order`, `attachment`, `order-document`, `audit` |
| ORD-DOC-13 | ORD-DOC-13: filtr roku ukrywa i przywraca zamówienie z dokumentem | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L303) | `school`, `order`, `attachment`, `order-document`, `year` |
| ORD-DOC-14 | ORD-DOC-14: usunięcie zamówienia usuwa widoczne powiązania dokumentów | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L344) | `school`, `order`, `attachment`, `order-document`, `delete` |
| ORD-DOC-15 | ORD-DOC-15: API odrzuca błędny format dokumentu bez utraty zapisanych plików | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L369) | `school`, `order`, `attachment`, `order-document`, `api`, `negative` |
| ORD-DOC-16 | ORD-DOC-16: API odrzuca błędny size dokumentu bez utraty zapisanych plików | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L369) | `school`, `order`, `attachment`, `order-document`, `api`, `negative` |
| ORD-DOC-17 | ORD-DOC-17: błąd uploadu podczas edycji nie usuwa poprzedniego dokumentu | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L404) | `school`, `order`, `attachment`, `order-document`, `network` |
| ORD-DOC-18 | ORD-DOC-18: oświadczenie ma te same dokumenty u nauczyciela i w pierwotnej szkole | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L448) | `school`, `teacher`, `order`, `order-document`, `statement` |
| ORD-DOC-19 | ORD-DOC-19: edycja oświadczenia pozwala dodać dokument bez utraty poprzedniego | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L490) | `teacher`, `order`, `order-document`, `statement`, `edit` |
| ORD-DOC-20 | ORD-DOC-20: usunięcie pojedynczego skanu oświadczenia zachowuje drugi | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L519) | `teacher`, `order`, `order-document`, `statement`, `edit` |
| ORD-DOC-21 | ORD-DOC-21: oświadczenie bez szkoły nie pokazuje skanów w szkole | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L548) | `school`, `teacher`, `order`, `order-document`, `statement`, `negative` |
| ORD-DOC-22 | ORD-DOC-22: zmiana szkoły nauczyciela nie przenosi dokumentu oświadczenia | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L569) | `school`, `teacher`, `order`, `order-document`, `statement`, `isolation` |
| ORD-DOC-23 | ORD-DOC-23: bez powodu Oświadczenie dodawanie plików nauczyciela jest niedostępne | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L611) | `teacher`, `order`, `order-document`, `statement`, `negative` |
| ORD-DOC-24 | ORD-DOC-24: oświadczenie odrzuca błędny format pliku w UI | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L652) | `teacher`, `order`, `order-document`, `statement`, `validation` |
| ORD-DOC-25 | ORD-DOC-25: oświadczenie odrzuca błędny size pliku w UI | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L652) | `teacher`, `order`, `order-document`, `statement`, `validation` |
| ORD-DOC-26 | ORD-DOC-26: oświadczenie akceptuje granicę 10 MB w formularzu | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L673) | `teacher`, `order`, `order-document`, `statement`, `boundary` |
| ORD-DOC-27 | ORD-DOC-27: oświadczenie jest tylko do odczytu z poziomu zamówień szkoły | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L692) | `school`, `teacher`, `order`, `order-document`, `statement`, `readonly` |
| ORD-DOC-28 | ORD-DOC-28: zamówienie z integracji nie udostępnia edycji szkolnej | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L720) | `school`, `order`, `order-document`, `integration`, `readonly` |
| ORD-DOC-29 | ORD-DOC-29: usunięcie oświadczenia usuwa widoczne powiązania dokumentów u nauczyciela i w szkole | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L742) | `school`, `teacher`, `order`, `order-document`, `statement`, `delete` |
| ORD-DOC-30 | ORD-DOC-30: edycja przez formularz zmienia produkt i ilość bez utraty dokumentu | [zamowienia-dokumenty.spec.ts](../../tests/zamowienia-dokumenty.spec.ts#L777) | `school`, `order`, `order-document`, `edit` |
| ORD-CLASS-01 | ORD-CLASS-01: kolumna Klasa jest widoczna i zgodna z makietą - lista | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L19) | `school`, `order`, `order-class`, `layout` |
| ORD-CLASS-02 | ORD-CLASS-02: kolumna Klasa jest widoczna i zgodna z makietą - szczegóły | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L19) | `school`, `order`, `order-class`, `layout` |
| ORD-CLASS-03 | ORD-CLASS-03: kolumna Klasa jest widoczna i zgodna z makietą - pozycje | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L19) | `school`, `order`, `order-class`, `layout` |
| ORD-CLASS-04 | ORD-CLASS-04: podręcznik klasy 5 ma właściwą klasę w trzech widokach | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L57) | `school`, `order`, `order-class`, `positive` |
| ORD-CLASS-05 | ORD-CLASS-05: podręcznik klasy 7 ma właściwą klasę w trzech widokach | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L57) | `school`, `order`, `order-class`, `positive` |
| ORD-CLASS-06 | ORD-CLASS-06: multimedia klasy 7 ma właściwą klasę w trzech widokach | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L57) | `school`, `order`, `order-class`, `positive` |
| ORD-CLASS-07 | ORD-CLASS-07: produkt dla kilku klas ma właściwą klasę w trzech widokach | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L57) | `school`, `order`, `order-class`, `positive` |
| ORD-CLASS-08 | ORD-CLASS-08: brak przypisanej klasy pozostawia pustą komórkę w trzech widokach | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L70) | `school`, `order`, `order-class`, `empty` |
| ORD-CLASS-09 | ORD-CLASS-09: produkt LS ma klasę w trzech widokach | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L82) | `school`, `order`, `order-class`, `ls` |
| ORD-CLASS-10 | ORD-CLASS-10: zamówienie klas 5 i 7 agreguje klasy, ale nie miesza pozycji | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L107) | `school`, `order`, `order-class`, `aggregate` |
| ORD-CLASS-11 | ORD-CLASS-11: dwa różne produkty klasy 7 nie duplikują klasy zamówienia | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L127) | `school`, `order`, `order-class`, `duplicates` |
| ORD-CLASS-12 | ORD-CLASS-12: ilość produktu nie jest numerem klasy | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L146) | `school`, `order`, `order-class`, `quantity` |
| ORD-CLASS-13 | ORD-CLASS-13: produkt bez klasy nie dziedziczy klasy innej pozycji | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L158) | `school`, `order`, `order-class`, `empty` |
| ORD-CLASS-14 | ORD-CLASS-14: ten sam produkt w dwóch zamówieniach ma jedną pozycję i poprawne powiązania | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L178) | `school`, `order`, `order-class`, `positions` |
| ORD-CLASS-15 | ORD-CLASS-15: klasy dwóch różnych zamówień nie przenikają się | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L206) | `school`, `order`, `order-class`, `isolation` |
| ORD-CLASS-16 | ORD-CLASS-16: klasy pozostają po przeładowaniu strony | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L222) | `school`, `order`, `order-class`, `persistence` |
| ORD-CLASS-17 | ORD-CLASS-17: zmiana zakładek nie zmienia klasy | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L237) | `school`, `order`, `order-class`, `tabs` |
| ORD-CLASS-18 | ORD-CLASS-18: zamiana produktu przez API aktualizuje klasę i usuwa starą pozycję | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L259) | `school`, `order`, `order-class`, `edit` |
| ORD-CLASS-19 | ORD-CLASS-19: usunięcie pozycji klasy 5 aktualizuje agregację zamówienia | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L281) | `school`, `order`, `order-class`, `edit` |
| ORD-CLASS-20 | ORD-CLASS-20: usunięcie jednego zamówienia nie usuwa klasy produktu z drugiego | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L303) | `school`, `order`, `order-class`, `delete` |
| ORD-CLASS-21 | ORD-CLASS-21: zamówienie i jego klasa nie pojawiają się w innej szkole | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L317) | `school`, `order`, `order-class`, `isolation` |
| ORD-CLASS-22 | ORD-CLASS-22: zwijanie i rozwijanie zachowuje klasę pozycji | [zamowienia-klasa.spec.ts](../../tests/zamowienia-klasa.spec.ts#L335) | `school`, `order`, `order-class`, `expand` |
| ORD-12 | ORD-12: wyszukiwanie po dokładnym kodzie zwraca właściwy produkt | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L30) | `school`, `order`, `search` |
| ORD-13 | ORD-13: wyszukiwanie po fragmencie kodu zwraca oba produkty fizyki 7 | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L53) | `school`, `order`, `search` |
| ORD-14 | ORD-14: filtr Przedmiot ogranicza wyniki do fizyki | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L72) | `school`, `order`, `filter` |
| ORD-15 | ORD-15: filtr Poziom ogranicza wyniki do szkoły podstawowej | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L98) | `school`, `order`, `filter` |
| ORD-16 | ORD-16: filtr Klasa zwraca produkty klasy 7 | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L124) | `school`, `order`, `filter` |
| ORD-17 | ORD-17: filtr Klasy pozwala wyszukiwać dla kilku klas jednocześnie | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L150) | `school`, `order`, `filter` |
| ORD-18 | ORD-18: Przedmiot i Poziom działają razem | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L179) | `school`, `order`, `filter` |
| ORD-19 | ORD-19: Przedmiot, Poziom i Klasa działają razem | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L202) | `school`, `order`, `filter` |
| ORD-20 | ORD-20: wszystkie filtry razem zwracają oczekiwane produkty | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L227) | `school`, `order`, `filter` |
| ORD-21 | ORD-21: nieistniejący kod daje pustą listę wyników | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L270) | `school`, `order`, `search`, `negative` |
| ORD-22 | ORD-22: drugie wyszukanie zastępuje wyniki pierwszego | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L287) | `school`, `order`, `search` |
| ORD-23 | ORD-23: Wyczyść filtry resetuje wszystkie kryteria | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L312) | `school`, `order`, `filter` |
| ORD-24 | ORD-24: wyszukiwanie działa poprawnie po wyczyszczeniu filtrów | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L340) | `school`, `order`, `filter` |
| ORD-25 | ORD-25: strzałka w prawo przenosi wybrany produkt do Zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L371) | `school`, `order`, `product` |
| ORD-26 | ORD-26: kilka produktów można przenieść do Zamówienia jednym ruchem | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L392) | `school`, `order`, `product` |
| ORD-27 | ORD-27: strzałka w lewo cofa zaznaczony produkt | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L415) | `school`, `order`, `product` |
| ORD-28 | ORD-28: kosz usuwa wszystkie produkty z tworzonego zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L443) | `school`, `order`, `product` |
| ORD-29 | ORD-29: produkt już dodany do Zamówienia nie pojawia się ponownie w Gratisach | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L467) | `school`, `order`, `duplicate` |
| ORD-30 | ORD-30: wyszukanie kolejnego produktu nie usuwa wcześniej wybranego | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L491) | `school`, `order`, `product` |
| ORD-31 | ORD-31: zmiana filtrów nie usuwa produktów z Zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L512) | `school`, `order`, `product`, `filter` |
| ORD-32 | ORD-32: dane produktu są spójne po przeniesieniu do Zamówienia | [zamowienia-produkty.spec.ts](../../tests/zamowienia-produkty.spec.ts#L535) | `school`, `order`, `product` |
| ORD-01 | ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L43) | `school`, `order`, `smoke` |
| ORD-02 | ORD-02: zamówienie z dwoma produktami zachowuje produkty i ilości | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L74) | `school`, `order`, `positive` |
| ORD-03 | ORD-03: edycja ilości dwóch produktów i usunięcie zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L121) | `school`, `order`, `edit` |
| ORD-04 | ORD-04: formularz Dodaj zamówienie zawiera komplet podstawowych kontrolek | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L184) | `school`, `order`, `form` |
| ORD-05 | ORD-05: anulowanie pustego formularza nie tworzy zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L313) | `school`, `order`, `cancel` |
| ORD-06 | ORD-06: anulowanie po wyszukaniu nie tworzy zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L332) | `school`, `order`, `cancel` |
| ORD-07 | ORD-07: anulowanie po dodaniu produktu i ilości nie tworzy zamówienia | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L356) | `school`, `order`, `cancel` |
| ORD-08 | ORD-08: ponowne otwarcie po anulowaniu zaczyna od czystego formularza | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L381) | `school`, `order`, `cancel` |
| ORD-09 | ORD-09: lista Przedmiot zawiera oczekiwane pozycje | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L478) | `school`, `order`, `dictionary` |
| ORD-10 | ORD-10: lista Poziom zawiera oczekiwane pozycje | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L496) | `school`, `order`, `dictionary` |
| ORD-11 | ORD-11: lista Klasy zawiera 0-8 i pozwala zaznaczyć kilka klas | [zamowienia-szkoly.spec.ts](../../tests/zamowienia-szkoly.spec.ts#L514) | `school`, `order`, `dictionary` |
| ORD-33 | ORD-33: ilość 1 jest zachowywana w edytorze | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L29) | `school`, `order`, `quantity` |
| ORD-34 | ORD-34: różne produkty zachowują niezależne ilości | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L50) | `school`, `order`, `quantity` |
| ORD-35 | ORD-35: ostatnia zmiana ilości przed zapisem jest używana | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L78) | `school`, `order`, `quantity` |
| ORD-36 | ORD-36: Tab kończy edycję ilości w AG Grid | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L117) | `school`, `order`, `quantity` |
| ORD-37 | ORD-37: wpisanie 0 normalizuje ilość do 10 | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L140) | `school`, `order`, `quantity`, `boundary` |
| ORD-38 | ORD-38: wartość ujemna nie jest akceptowana | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L161) | `school`, `order`, `quantity`, `boundary` |
| ORD-39 | ORD-39: wyczyszczenie pola Ilość automatycznie przywraca wartość | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L182) | `school`, `order`, `quantity`, `boundary` |
| ORD-40 | ORD-40: pusty formularz nie zapisuje zamówienia i oznacza Przedmiot jako niepoprawny | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L215) | `school`, `order`, `validation` |
| ORD-41 | ORD-41: zamówienie można zapisać bez wybranego Przedmiotu, jeśli produkt został dodany | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L247) | `school`, `order`, `positive` |
| ORD-42 | ORD-42: dwa szybkie kliknięcia Zapisz z krótkim odstępem tworzą tylko jedno zamówienie | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L303) | `school`, `order`, `duplicate` |
| ORD-43 | ORD-43: dwa kolejne zamówienia dostają różne ID | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L368) | `school`, `order`, `identity` |
| ORD-44 | ORD-44: usunięcie pierwszego z dwóch zamówień nie usuwa drugiego | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L415) | `school`, `order`, `isolation` |
| ORD-45 | ORD-45: zamówienie utworzone dla szkoły A nie pojawia się w szkole B | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L466) | `school`, `order`, `isolation` |
| ORD-46 | ORD-46: reload zachowuje ID, produkt i ilość zamówienia | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L492) | `school`, `order`, `persistence` |
| ORD-47 | ORD-47: zapisane zamówienie ma numeryczne ID i widoczny wiersz na liście | [zamowienia-walidacja.spec.ts](../../tests/zamowienia-walidacja.spec.ts#L524) | `school`, `order`, `list` |
| ORD-48 | ORD-48: poprawny JPG można dodać jako załącznik | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L45) | `school`, `order`, `attachment` |
| ORD-49 | ORD-49: poprawny PNG można dodać jako załącznik | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L45) | `school`, `order`, `attachment` |
| ORD-50 | ORD-50: poprawny PDF można dodać jako załącznik | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L45) | `school`, `order`, `attachment` |
| ORD-51 | ORD-51: można dodać kilka załączników do jednego zamówienia | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L63) | `school`, `order`, `attachment` |
| ORD-52 | ORD-52: można usunąć jeden z kilku załączników | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L89) | `school`, `order`, `attachment` |
| ORD-53 | ORD-53: po usunięciu wszystkich załączników lista jest pusta | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L138) | `school`, `order`, `attachment` |
| ORD-54 | ORD-54: zmiana filtrów nie usuwa załącznika | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L178) | `school`, `order`, `attachment`, `filter` |
| ORD-55 | ORD-55: dodanie produktu nie usuwa załącznika | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L203) | `school`, `order`, `attachment`, `product` |
| ORD-56 | ORD-56: załącznik jest trwały po zapisaniu i ponownym otwarciu edycji zamówienia | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L224) | `school`, `order`, `attachment`, `persistence` |
| ORD-57 | ORD-57: kilka załączników jest trwałych po zapisaniu zamówienia | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L282) | `school`, `order`, `attachment`, `persistence` |
| ORD-58 | ORD-58: anulowanie formularza z załącznikiem nie przenosi pliku do kolejnego formularza | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L340) | `school`, `order`, `attachment`, `cancel` |
| ORD-59 | ORD-59: niedozwolony typ pliku WEBP jest odrzucany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L370) | `school`, `order`, `attachment`, `validation` |
| ORD-60 | ORD-60: niedozwolony typ pliku TXT jest odrzucany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L370) | `school`, `order`, `attachment`, `validation` |
| ORD-61 | ORD-61: plik większy niż 10 MB jest odrzucany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L385) | `school`, `order`, `attachment`, `validation` |
| ORD-62 | ORD-62: plik o rozmiarze dokładnie 10 MB jest akceptowany | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L401) | `school`, `order`, `attachment`, `boundary` |
| ORD-63 | ORD-63: zamówienie z załącznikiem pokazuje ikonę dokumentu na liście | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L417) | `school`, `order`, `attachment`, `list` |
| ORD-64 | ORD-64: zamówienie bez załącznika nie pokazuje ikony dokumentu | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L466) | `school`, `order`, `attachment`, `list`, `negative` |
| ORD-65 | ORD-65: po usunięciu ostatniego załącznika ikona dokumentu znika | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L493) | `school`, `order`, `attachment`, `edit`, `list` |
| ORD-66 | ORD-66: kilka załączników daje pojedynczą ikonę dokumentu na liście | [zamowienia-zalaczniki.spec.ts](../../tests/zamowienia-zalaczniki.spec.ts#L576) | `school`, `order`, `attachment`, `list` |
