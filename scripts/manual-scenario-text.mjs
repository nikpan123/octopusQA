export function manualGiftScenario(row, c, matrix) {
  const year = c.variant === "OLD_CONFIRM" ? "2025/2026" : matrix.confirmationYear;
  const scope =
    row.scope === "P" ? ", zakres podstawowy" : row.scope === "R" ? ", zakres rozszerzony" : "";
  const series = {
    MAT: "Matematyka",
    MN: "Między nami",
    MZ: "Moim zdaniem",
    HIS: "Historia",
    FPLUS: "Fizyka z plusem",
    TNS: "To nasz Świat. Fizyka",
    PRZ: "Przyroda",
    BIO: "Biologia",
    GEO: "Geografia",
  }[row.series];
  const option =
    row.level === "SP" && row.classLevel === 4 && row.series === "MN"
      ? "4 Między N"
      : row.level === "SP" && row.classLevel === 4 && row.series === "MZ"
        ? "4 Moim Z"
        : `${row.classLevel}${row.scope ? " " + row.scope : ""}${row.series === "TNS" ? " TNŚ" : row.series === "FPLUS" ? " F+" : ""}`;
  const noOrder = c.variant === "NO_ORDER";
  const blocked = !c.eligible && c.giftExpected;
  const expected = !c.giftExpected
    ? `W zakładce „Gratisy” tego nauczyciela nie ma żadnego wpisu. ${c.variant === "FOREIGN" ? "Potwierdzenie dotyczy obcego wydawnictwa." : c.variant === "TEST_TEACHER" ? "Nauczyciel ma zaznaczone „Testowy”." : `Nauczyciel ma potwierdzenie tylko na ${year}, bez potwierdzenia na ${matrix.confirmationYear}.`} Pusta lista jest poprawnym wynikiem; wpis z blokadą również oznacza błąd.`
    : `W zakładce „Gratisy” jest dokładnie jedna pozycja ${row.giftCode}, 1 egzemplarz, przypisana do przygotowanej szkoły. ${blocked ? `W kolumnie „Blokada” jest „Jest”, a w „Powód blokady” — „${c.blockReason}”. Brak wpisu jest błędem.` : "Pozycja nie ma blokady, a „Powód blokady” jest pusty."} Sprawdzenie kończy się na liście gratisów; nie nadaje się przesyłki.`;
  const steps = [
    `Wejdź w „Szkoły” → „Szukaj” i otwórz przygotowaną szkołę po jej ID. Sprawdź typ ${row.level === "SP" ? "„Szkoła podstawowa”" : "„Technikum”"}, ${c.students === null ? "pustą liczbę uczniów" : "liczbę uczniów " + c.students}${c.schoolThreshold === null ? "" : " i wartość pola „Próg”: " + c.schoolThreshold}. W „Nauczyciele” otwórz nowego nauczyciela przypisanego do tej szkoły. Przed testem nauczyciel nie ma potwierdzeń ani gratisów.`,
    noOrder
      ? "Na karcie szkoły otwórz „Zamówienia”. Lista ma być pusta. Nie dodawaj zamówienia i nie zmieniaj daty w bazie."
      : `Na karcie szkoły otwórz „Zamówienia” i kliknij „Dodaj”. Wyszukaj produkt po kodzie ${row.orderCode}, dodaj ${c.quantity} szt. i zapisz. Zapisz numer nowego zamówienia.${row.orderClassLevel ? ` Produkt jest dla klasy ${row.orderClassLevel}, a potwierdzenie w tym przypadku dotyczy klasy ${row.classLevel}.` : ""}`,
    ...(!noOrder
      ? [
          `Przed dodaniem potwierdzenia przekaż osobie z dostępem do bazy ID tego zamówienia i szkoły. Ma ustawić datę utworzenia na ${c.date} i potwierdzić zapis ponownym odczytem. Tego przygotowania nie wykonuje się przyciskiem w Octopusie; samo wpisanie daty przy wysyłaniu żądania nie wystarcza. Po potwierdzeniu daty osoba z dostępem do bazy wykonuje RecalculateSchoolClassDigitalAccessesBasedOnSchoolId dla ID tej szkoły. Dalsze kroki wykonuj dopiero po zakończeniu przeliczenia.`,
        ]
      : []),
    `Na karcie nauczyciela otwórz „Kluby” → „Dodaj formularz”. Wybierz rok ${year}, przedmiot „${row.subject}” i przygotowaną szkołę. ${c.variant === "FOREIGN" ? `Po stronie „obce” zaznacz klasę ${row.classLevel}${scope} i wybierz wydawnictwo „NOWA ERA”. Nie zaznaczaj tej klasy po stronie „nasze”.` : `Po stronie „nasze” zaznacz klasę ${row.classLevel}${scope}, serię „${series}” (opcja „${option}”). Nie zaznaczaj dodatkowych klas ani klas obcych.`} Odznacz „Wysłać maila do nauczyciela” i kliknij „Zapisz”. Zapisz ID nowego formularza i przekaż je osobie z dostępem do bazy: ma wykonać SendBookFromFormClubPSChangesStates dla tego formularza. Poczekaj na zakończenie procedury przed sprawdzeniem gratisów.`,
    `Na karcie nauczyciela sprawdź, że „Testowy” jest ${c.variant === "TEST_TEACHER" ? "zaznaczone" : "odznaczone"}; w szkole ma być odznaczone. Otwórz zakładkę „Gratisy” tego samego nauczyciela.`,
    `Sprawdź listę od razu po zakończeniu przeliczenia formularza. ${expected}`,
    `Po zapisaniu wyniku usuń wyłącznie dane utworzone do tego sprawdzenia: ${noOrder ? "potwierdzenie i niewysłane gratisy" : "potwierdzenie, zapisane zamówienie i niewysłane gratisy"}. Jeśli sprawdzasz wykryty błąd, najpierw zapisz numery dokumentów i zrzut wyniku.`,
  ];
  return {
    description: `Sprawdzamy, czy po zapisaniu potwierdzenia nauczyciela ${c.giftExpected ? `pojawia się gratis ${row.giftCode}${blocked ? " z właściwą blokadą" : " bez blokady"}` : "lista gratisów pozostaje pusta"}. Przypadek: ${c.label}.`,
    preconditions: [
      "Zaloguj się do DEV na konto z prawem dodawania nauczycieli, szkół, zamówień i formularzy klubowych.",
      `Przygotuj jedną osobną szkołę ${row.level === "SP" ? "podstawową" : "typu Technikum"}: ${c.students === null ? "nie wpisuj liczby uczniów" : c.students + " uczniów"}. Szkoła nie ma wcześniejszych zamówień; „Testowy” jest odznaczone. Zapisz ID szkoły.`,
      `Przygotuj nowego nauczyciela: imię i unikalne nazwisko, własny testowy e-mail, przypisanie do tej szkoły oraz przedmiot „${row.subject}”, poziom ${row.level}. Nie dodawaj jeszcze potwierdzenia klubowego. „Testowy” u nauczyciela ma być ${c.variant === "TEST_TEACHER" ? "zaznaczone — to badany warunek" : "odznaczone"}.`,
      `Dane potwierdzenia: rok ${year}, przedmiot „${row.subject}”, klasa ${row.classLevel}${scope}, seria „${series}”.${c.variant === "OLD_CONFIRM" ? ` Nie może istnieć dodatkowe potwierdzenie na ${matrix.confirmationYear}.` : ""} Wysyłka e-maila z formularza wyłączona.`,
      ...(noOrder
        ? []
        : [
            `Do przygotowania daty ${c.date} potrzebna jest pomoc osoby z dostępem do bazy DEV. Zamówienie musi być utworzone i mieć poprawioną datę przed dodaniem potwierdzenia.`,
          ]),
    ],
    data: noOrder
      ? `Bez zamówień. Oczekiwany gratis: ${row.giftCode}; okres zamówień sprawdzany przez regułę: ${row.start}–${row.end}.`
      : `Produkt zamówienia: ${row.orderCode}; ilość: ${c.quantity} szt.; data utworzenia po zmianie w bazie: ${c.date}. Wymagany okres: ${row.start}–${row.end}. ${c.giftMinimum === null ? "Dla SŚ wystarczy 1 egzemplarz; próg ilościowy szkoły nie jest warunkiem tego gratisu." : `Minimum do gratisu w tym przypadku: ${c.giftMinimum} szt.; odczytane pole „Próg” szkoły: ${c.schoolThreshold}. Nie mnożymy pola „Próg” ponownie przez 60%.`} Oczekiwany produkt w gratisach: ${row.giftCode}.`,
    steps,
    expected,
  };
}
