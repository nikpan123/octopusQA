import { readFile, writeFile } from "node:fs/promises";
import { minimumGiftOrder } from "./gift-rules-2026.mjs";
import smoke from "../tests/data/gratisy-szybki-test-2026.json" with { type: "json" };
import corrections from "../tests/data/potwierdzenia-gratisy-2026-overrides.json" with { type: "json" };
import { applyConfirmationOverrides } from "./confirmation-matrix.mjs";
import { manualGiftScenario } from "./manual-scenario-text.mjs";

const matrix = applyConfirmationOverrides(
  JSON.parse(await readFile("tests/data/potwierdzenia-gratisy-2026.json", "utf8")),
  corrections,
);
const variants = [
  ["MINUS", "o jedną sztukę poniżej minimum dla gratisu", false],
  ["MIN", "dokładnie minimum dla gratisu", true],
  ["PLUS", "o jedną sztukę powyżej minimum dla gratisu", true],
  ["START", "zamówienie 1 maja na początku okresu", true],
  ["END", "zamówienie 30 kwietnia na końcu okresu", true],
  ["BEFORE", "zamówienie 30 kwietnia przed okresem", false],
  ["AFTER", "zamówienie 1 maja po okresie", false],
  ["NO_ORDER", "brak zamówienia szkoły", false],
  ["FOREIGN", "potwierdzenie obcego wydawcy", false],
  ["TEST_TEACHER", "nauczyciel z flagą Testowy", false],
  ["OLD_CONFIRM", "potwierdzenie z poprzedniego roku", false],
];
const cases = [];
for (const [index, row] of matrix.rows.entries()) {
  const extras = row.coefficient
    ? [
        ["LOW_MINUS", "Próg 1 przy 8 uczniach — 4 sztuki, blokada Za mała ilość", false],
        ["LOW_MIN", "Próg 1 przy 8 uczniach — 5 sztuk, gratis bez blokady", true],
        ["MISSING_MINUS", "9 sztuk bez liczby uczniów — próg zastępczy 10", false],
        ["MISSING", "10 sztuk bez liczby uczniów — próg zastępczy 10", true],
      ]
    : [];
  const rowVariants =
    row.level === "SŚ"
      ? variants
          .filter(([v]) => v !== "MINUS")
          .map(([v, label, eligible]) => [
            v,
            v === "MIN"
              ? "1 egzemplarz w zamówieniu szkoły i potwierdzenie NASZ"
              : v === "PLUS"
                ? "2 egzemplarze w zamówieniu szkoły i potwierdzenie NASZ"
                : label,
            eligible,
          ])
      : [...variants, ...extras];
  for (const [variant, label, eligible] of rowVariants) {
    const students = variant.startsWith("MISSING") ? null : variant.startsWith("LOW_") ? 8 : 400;
    const schoolThreshold =
      row.level === "SŚ"
        ? null
        : students === null
          ? 10
          : Math.max(1, Math.round((students / 8) * 0.6));
    const giftMinimum =
      row.level === "SŚ"
        ? null
        : minimumGiftOrder({
            schoolThreshold,
            historical: row.orderYear !== matrix.confirmationYear,
            missingStudents: students === null,
          });
    const quantity =
      (giftMinimum ?? 1) + (variant.endsWith("MINUS") ? -1 : variant === "PLUS" ? 1 : 0);
    const startYear = Number(row.start.slice(0, 4));
    const date =
      variant === "END"
        ? row.end
        : variant === "BEFORE"
          ? `${startYear}-04-30`
          : variant === "AFTER"
            ? `${startYear + 1}-05-01`
            : row.start;
    const confirmationYear = variant === "OLD_CONFIRM" ? "2025/2026" : matrix.confirmationYear;
    const giftExpected = !["FOREIGN", "TEST_TEACHER", "OLD_CONFIRM"].includes(variant);
    const noGiftReason =
      variant === "TEST_TEACHER"
        ? "nauczyciel z włączoną flagą Testowy"
        : variant === "OLD_CONFIRM"
          ? `nauczyciel z potwierdzeniem wyłącznie na ${confirmationYear}, bez potwierdzenia na ${matrix.confirmationYear}`
          : "nauczyciel z potwierdzeniem obcego wydawcy";
    const stepTitles = {
      prepare: `Sprawdź szkołę (${students ?? "brak danych o liczbie"} uczniów${schoolThreshold === null ? "" : ", Próg " + schoolThreshold}) oraz brak wcześniejszych zamówień i gratisów nauczyciela`,
      order:
        variant === "NO_ORDER"
          ? `Pozostaw szkołę bez zamówienia ${row.orderCode} i potwierdź pustą listę zamówień`
          : `Utwórz w szkole zamówienie ${row.orderCode}: ${quantity} szt.${row.orderClassLevel ? " — podręcznik klasy " + row.orderClassLevel + " dla potwierdzenia klasy " + row.classLevel : ""}`,
      date: `Ustaw w bazie datę zamówienia na ${date} i potwierdź tę datę odczytem API`,
      confirm: `Dodaj nauczycielowi potwierdzenie ${variant === "FOREIGN" ? "obcego wydawcy" : "NASZ"}: ${row.subject}, klasa ${row.classLevel}${row.scope ? " " + row.scope : ""}, seria ${row.series}, rok ${confirmationYear}${variant !== "FOREIGN" && row.level === "SP" && row.classLevel === 4 && ["MN", "MZ"].includes(row.series) ? "; zaznacz „" + (row.series === "MN" ? "4 Między N" : "4 Moim Z") + "”" : ""}`,
      view: `Sprawdź flagi Testowy (nauczyciel: ${variant === "TEST_TEACHER" ? "tak" : "nie"}, szkoła: nie) i otwórz Gratisy nauczyciela`,
      compare: !giftExpected
        ? `Sprawdź od razu pustą listę Gratisów — ${noGiftReason}`
        : eligible
          ? `Sprawdź pozycję ${row.giftCode}: 1 egzemplarz, właściwa szkoła, brak blokady i pusty powód`
          : `Sprawdź pozycję ${row.giftCode}: 1 egzemplarz, właściwa szkoła, blokada ${["MINUS", "LOW_MINUS", "MISSING_MINUS"].includes(variant) ? "„Za mała ilość”" : ["NO_ORDER", "BEFORE", "AFTER"].includes(variant) ? "„Brak zamówień”" : "z niepustym powodem"}; sprawdź od razu brak możliwości wysyłki`,
      cleanup:
        variant === "NO_ORDER"
          ? "Usuń własne potwierdzenie i niewysłane gratisy; sprawdź zakończenie sprzątania"
          : "Usuń własne potwierdzenie, zamówienie i niewysłane gratisy; sprawdź zakończenie sprzątania",
    };
    stepTitles.date +=
      "; wykonaj RecalculateSchoolClassDigitalAccessesBasedOnSchoolId dla tej szkoły";
    stepTitles.confirm += "; wykonaj SendBookFromFormClubPSChangesStates dla zapisanego formularza";
    cases.push({
      id: `POTW26-${String(index + 1).padStart(2, "0")}-${variant.replaceAll("_", "-")}`,
      rowKey: row.key,
      variant,
      label,
      eligible,
      giftExpected,
      blockReason: eligible
        ? ""
        : ["MINUS", "LOW_MINUS", "MISSING_MINUS"].includes(variant)
          ? "Za mała ilość"
          : ["NO_ORDER", "BEFORE", "AFTER"].includes(variant)
            ? "Brak zamówień"
            : null,
      students,
      schoolThreshold,
      giftMinimum,
      quantity,
      date,
      title: `${row.notes} ${row.level} klasa ${row.classLevel}${row.scope ? " " + row.scope : ""}, ${row.giftCode}: ${label}`,
      stepTitles,
    });
  }
}
await writeFile(
  "tests/data/potwierdzenia-gratisy-2026-cases.json",
  JSON.stringify(cases, null, 2) + "\n",
);
const scenarios = cases.map((c) => {
  const row = matrix.rows.find((r) => r.key === c.rowKey);
  const steps = [
    c.stepTitles.prepare,
    c.stepTitles.order,
    ...(c.variant === "NO_ORDER" ? [] : [c.stepTitles.date]),
    c.stepTitles.confirm,
    c.stepTitles.view,
    c.stepTitles.compare,
    c.stepTitles.cleanup,
  ];
  return {
    id: c.id,
    title: c.title,
    testIds: [c.id],
    automation: "automated",
    description: `Sprawdź, czy po dodaniu potwierdzenia dla ${row.subject}, klasa ${row.classLevel}, ${!c.giftExpected ? "nie powstaje żaden wpis w Gratisach (" + c.label + ")" : "powstaje gratis " + row.giftCode + " " + (c.eligible ? "bez blokady" : "z blokadą " + (c.blockReason ?? "odpowiadającą badanemu warunkowi"))}. Badany warunek: ${c.label}. Źródło: ${matrix.sourceFile}, ${matrix.sourceSheet}!${row.source}; A88:A98.`,
    preconditions: [
      `Potwierdzenie do dodania w trakcie testu: ${c.variant === "OLD_CONFIRM" ? "2025/2026" : matrix.confirmationYear}; przedmiot ${row.subject}, poziom ${row.level}, klasa ${row.classLevel}, seria ${row.series}${row.scope ? " zakres " + row.scope : ""}; wydawca ${c.variant === "FOREIGN" ? "obcy" : "NASZ"}.`,
      `Szkoła ${row.level === "SP" ? "podstawowa" : "technikum"}, liczba uczniów: ${c.students ?? "brak"}; ${c.giftMinimum === null ? "SŚ bez progu ilościowego — wystarczy zamówienie 1 egzemplarza i potwierdzenie NASZ na wymagany rok; weryfikacja CC nie jest warunkiem" : "pole Próg szkoły: " + c.schoolThreshold + "; odrębne minimum zamówienia dla gratisu: " + c.giftMinimum + " sztuk"}.`,
      "Nowy nauczyciel bez wcześniejszych gratisów, przypisany do jednej odizolowanej szkoły tego testu; wiadomości e-mail wyłączone.",
      `Flagi Testowy: nauczyciel ${c.variant === "TEST_TEACHER" ? "włączona — badana blokada" : "wyłączona"}; szkoła wyłączona. Pozostałe testy negatywne nie korzystają z tej dodatkowej blokady.`,
    ],
    steps,
    expected: !c.giftExpected
      ? `Pusta lista Gratisów nauczyciela od razu po dodaniu potwierdzenia — ${c.variant === "TEST_TEACHER" ? "nauczyciel ma włączoną flagę Testowy" : c.variant === "OLD_CONFIRM" ? "nauczyciel ma potwierdzenie wyłącznie na 2025/2026, bez potwierdzenia na " + matrix.confirmationYear : "nauczyciel ma wyłącznie potwierdzenie obcego wydawcy"}. Nie może powstać wpis ani z blokadą, ani bez blokady.`
      : c.eligible
        ? `Dokładnie jedna niezablokowana pozycja ${row.giftCode} (ID ${row.giftId}), 1 egzemplarz, w gratisach właściwej szkoły. Bez nadawania przesyłki.`
        : `Dokładnie jedna pozycja ${row.giftCode} (ID ${row.giftId}), 1 egzemplarz, we właściwej szkole. Blokada: Jest; powód: ${c.blockReason ?? "niepusty, odpowiadający badanej blokadzie (dokładna treść wymaga doprecyzowania)"}. Brak pozycji nie zalicza testu. Stan blokady jest sprawdzany od razu po dodaniu potwierdzenia, bez dodatkowego oczekiwania. Bez nadawania przesyłki.`,
    blocker:
      c.variant === "NO_ORDER"
        ? "Wymaga DEV. Wariant bez zamówienia nie zmienia daty w bazie. Pełny pakiet nie był wykonywany."
        : "Wymaga DEV i konfiguracji SQL z prawem zmiany CreatedAt własnego zamówienia. Pełny pakiet nie był wykonywany.",
    data:
      c.variant === "NO_ORDER"
        ? `Nie twórz zamówienia ${row.orderCode} ani żadnego innego zamówienia w szkole. Nie ustawiaj daty w bazie. Okres wymagany dla tego tytułu: ${row.start}–${row.end}. Po dodaniu potwierdzenia oczekuj ${row.giftCode}, 1 egz., z blokadą „Brak zamówień”.`
        : `Zamówienie: ${row.orderCode}, ${c.quantity} szt.; data do ustawienia w bazie: ${c.date}. Wymagany okres: ${row.start}–${row.end}.${row.orderClassLevel ? " Podręcznik klasy " + row.orderClassLevel + " jest właściwy dla potwierdzenia klasy " + row.classLevel + " (korekta użytkownika)." : ""}${c.variant === "BEFORE" ? " Badana data przypada dzień przed początkiem okresu." : c.variant === "AFTER" ? " Badana data przypada dzień po końcu okresu." : ""} Najpierw utwórz zamówienie, następnie zmień jego CreatedAt w bazie i potwierdź datę odczytem API. Dopiero potem dodaj potwierdzenie nauczyciela.`,
    ...manualGiftScenario(row, c, matrix),
    stepLinks: steps.map((title, step) => ({ step, testId: c.id, titles: [title] })),
  };
});
const feature = {
  id: "potwierdzenia-gratisy-2026",
  issue: "POTW26",
  title: "Potwierdzenia SP i SŚ 2026 — gratisy (Excel)",
  verification: {
    environment: "DEV",
    date: "2026-10-21",
    passed: 4,
    failed: 2,
    skipped: 0,
    scope:
      "Archiwalny przebieg sprzed korekty reguł gratisów: 4 PASS i 2 FAIL. Nie potwierdza obecnych wymagań ilościowych ani wyniku aktualnego pakietu. Przebieg nie stanowi walidacji bieżącej automatyzacji SŚ.",
  },
  scope: `51 pozycji arkusza, 28 SP i 23 SŚ; ${cases.length} przypadków. Rozwinięto scalenia (m.in. klasy 4–5 SŚ i dwie pozycje MZ). SŚ: bez progu, wystarczy zamówienie 1 egzemplarza i potwierdzenie NASZ; bez dodatkowej weryfikacji CC; okres 1.05.2026–30.04.2027. Zmiana daty zamówienia bezpośrednio w bazie przed oceną gratisów. SP i SŚ mają zaimplementowane automaty; pełnego pakietu nie wykonano. Pozostałe blokady ogólne A92:A98 wymagają osobnych scenariuszy.`,
  scenarios,
};
const smokeCases = smoke.testIds.map((id) => {
  const item = cases.find((c) => c.id === id);
  if (!item) throw new Error(`Brak przypadku szybkiego pakietu: ${id}`);
  return item;
});
const smokeFeature = {
  id: "gratisy-szybki-test-2026",
  title: smoke.title,
  scope:
    "Szybka kontrola najważniejszych reguł gratisów: 13 istniejących testów zamiast pełnych 590. SP i SŚ, progi ilościowe, daty oraz warunki braku wpisu. Nie zastępuje pełnej macierzy wszystkich przedmiotów, klas i dat.",
  scenarios: [
    {
      id: "POTW26-SMOKE",
      title: "Szybka kontrola przypisywania gratisów — 13 najważniejszych przypadków",
      testIds: smoke.testIds,
      automation: "automated",
      description:
        "Uruchom cały zestaw po zmianie aplikacji: poprawne przyznanie na progu 30, blokada przy 29, granica 4/5 przy progu szkoły 1, brak zamówienia. Nauczyciel obcy, Testowy i z potwierdzeniem wyłącznie z poprzedniego roku nie mają wpisu w Gratisach. Dodatnie kontrole obejmują SŚ (1 egzemplarz), polski MN/MZ oraz fizykę F+/TNŚ.",
      preconditions: [
        "Środowisko DEV i konfiguracja zmiany daty własnego zamówienia w bazie.",
        "Każdy przypadek przygotowuje własnego nauczyciela; szkoły i dokumenty są izolowane między procesami. E-maile wyłączone.",
        "Można wybrać 1 lub 2 procesy. Wynik każdego testu jest widoczny osobno w raporcie.",
      ],
      steps: smokeCases.map((c) => `${c.id}: ${c.title}`),
      data: smokeCases
        .map((c) => `${c.id}: ${scenarios.find((s) => s.id === c.id).data}`)
        .join("\n"),
      expected: smokeCases
        .map((c) => `${c.id}: ${scenarios.find((s) => s.id === c.id).expected}`)
        .join("\n"),
      blocker:
        "Pakiet nie został jeszcze uruchomiony na DEV; kontrola lokalna nie potwierdza wyniku biznesowego.",
      stepLinks: smokeCases.map((c, step) => ({
        step,
        testId: c.id,
        titles: [c.stepTitles.compare],
      })),
    },
  ],
};
for (const currentFeature of [feature, smokeFeature]) {
  const feature = currentFeature;
  const file = "test-ui/scenarios.json";
  const original = await readFile(file, "utf8");
  const catalog = JSON.parse(original);
  if (catalog.features.some((f) => f.id === feature.id) && !process.argv.includes("--refresh")) {
    // Preserve descriptions edited by the user on repeat runs.
    console.log("Opisy pakietu już istnieją; pozostawiono edycje użytkownika.");
  } else if (catalog.features.some((f) => f.id === feature.id)) {
    const idAt = original.indexOf(`"id": "${feature.id}"`);
    const from = original.lastIndexOf("{", idAt);
    let depth = 0,
      quoted = false,
      escape = false,
      end = from;
    for (; end < original.length; end++) {
      const ch = original[end];
      if (quoted) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') quoted = false;
        continue;
      }
      if (ch === '"') quoted = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        end++;
        break;
      }
    }
    await writeFile(
      file,
      original.slice(0, from) + JSON.stringify(feature, null, 2) + original.slice(end),
    );
  } else {
    const marker = /"features"\s*:\s*\[/;
    await writeFile(
      file,
      original.replace(marker, (match) => match + "\n" + JSON.stringify(feature, null, 2) + ","),
    );
  }
}
console.log(`${matrix.rows.length} pozycji, ${cases.length} przypadków.`);
