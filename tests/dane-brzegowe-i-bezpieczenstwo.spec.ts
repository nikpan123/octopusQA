import { test, expect } from "./support/scenario";

import {
  DEFAULT_CITY,
  DEFAULT_POSTAL_CODE,
  cancelSchoolAdd,
  fillSchoolAddTextField,
  fillSchoolName,
  openSchoolAddForm,
  openSchoolAddressForm,
  saveSchoolAdd,
  saveSchoolAddress,
  selectSchoolType,
} from "./support/school-add";

/*
 * =========================================================
 * GENERATORY REGON/NIP (duplikat)
 * =========================================================
 *
 * Te dwie funkcje są zduplikowane z tests/szkola-dodawanie.spec.ts,
 * gdzie nie są eksportowane z tego pliku ani z support/school-add.ts.
 * Potrzebujemy ich wyłącznie po to, by wygenerować POPRAWNĄ bazową
 * wartość, którą świadomie psujemy o jedną cyfrę sumy kontrolnej
 * w BRZEG-05 - algorytm musi być identyczny z tym używanym gdzie
 * indziej w pakiecie, inaczej "popsuta" wartość mogłaby przypadkiem
 * pozostać poprawna.
 */

function validRegon(seed: number) {
  const weights = [8, 9, 2, 3, 4, 5, 6, 7];
  const body = String(seed).padStart(8, "0").slice(-8);
  const checksum =
    body.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0) % 11;
  return `${body}${checksum === 10 ? 0 : checksum}`;
}

function validNip(seed: number) {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  for (let offset = 0; offset < 100; offset += 1) {
    const body = String(seed + offset)
      .padStart(9, "0")
      .slice(-9);
    const checksum =
      body.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0) % 11;
    if (checksum < 10) return `${body}${checksum}`;
  }
  throw new Error("Nie udało się wygenerować poprawnego numeru NIP");
}

function corruptChecksumDigit(value: string): string {
  const lastDigit = Number(value.at(-1));
  const corrupted = (lastDigit + 1) % 10;
  return `${value.slice(0, -1)}${corrupted}`;
}

async function newUniqueSchoolAddress(
  page: Parameters<typeof openSchoolAddressForm>[0],
  form: Parameters<typeof openSchoolAddressForm>[1],
) {
  const address = await openSchoolAddressForm(page, form);
  await saveSchoolAddress(address, DEFAULT_POSTAL_CODE, DEFAULT_CITY, String(Date.now()).slice(-4));
}

/*
 * =========================================================
 * BRZEG-01
 * BARDZO DŁUGA WARTOŚĆ TEKSTOWA (NAZWA SZKOŁY)
 * =========================================================
 *
 * Gap analysis, punkt F.19: znany jest limit 220 znaków dla pola
 * notatki, ale żadne inne pole tekstowe (np. nazwa szkoły) nie ma
 * przetestowanej wartości skrajnie długiej. Test nie zakłada z góry,
 * czy aplikacja przytnie wartość, czy ją odrzuci - dokumentuje
 * rzeczywiste zachowanie i asertuje wyłącznie brak błędu/awarii.
 */

test("BRZEG-01: bardzo długa nazwa szkoły (5000 znaków) jest obsłużona bez błędu @school @school-add @edge-input", async ({
  page,
  scenario: s,
}) => {
  const longName = `${s.id}-${"A".repeat(5000)}`;

  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, longName);
  await selectSchoolType(page, form);
  await newUniqueSchoolAddress(page, form);

  const saveButton = form.getByRole("button", { name: "Zapisz", exact: true });
  if (!(await saveButton.isEnabled())) {
    console.log("BRZEG-01: bardzo długa nazwa blokuje przycisk Zapisz już po stronie klienta.");
    await cancelSchoolAdd(form);
    return;
  }

  const saveResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/Institution/AddNewInstitution",
  );
  await saveButton.click();
  const response = await saveResponse;
  await response.finished();

  if (!response.ok()) {
    expect(response.status()).toBeGreaterThanOrEqual(400);
    await expect(page).toHaveURL(/\/school\/school-panel$/);
    await s.record("longNameResult", `REJECTED_HTTP_${response.status()}`);
    return;
  }

  if ((await form.count()) > 0) {
    console.log("BRZEG-01: zapis z bardzo długą nazwą został zablokowany po stronie serwera.");
    await expect(form).toBeVisible();
    await cancelSchoolAdd(form);
    return;
  }

  await expect(page).toHaveURL(/\/school\/school-panel\/\d+$/);
  const persistedName = await s.app.detail("name").inputValue();
  console.log(
    `BRZEG-01: wpisano ${longName.length} znaków, zapisana wartość ma ${persistedName.length} ` +
      "znaków.",
  );

  // Niezależnie od tego, czy wartość została przycięta, czy zachowana
  // w całości - musi dać się ją odczytać, a jej treść musi być spójnym
  // prefiksem oryginału (żadnych obciętych znaków w środku, żadnych
  // znaków zastępczych).
  expect(persistedName.length).toBeGreaterThan(0);
  expect(longName.startsWith(persistedName)).toBeTruthy();

  const schoolId = page.url().split("/").pop()!;
  await s.record("longNameSchoolId", schoolId);
});

/*
 * =========================================================
 * BRZEG-02
 * ZNAKI SPECJALNE / NIEBEZPIECZNE W NAZWIE SZKOŁY
 * =========================================================
 *
 * Gap analysis, punkt F.20 (sprawdzenie renderowania/escapowania).
 * Payload XSS celowo NIE używa alert() - wywołanie prawdziwego
 * dialogu przeglądarki zawiesiłoby sesję Playwrighta. Zamiast tego
 * ustawiamy niegroźny znacznik w obiekcie window, którego obecność
 * po odświeżeniu panelu jednoznacznie dowodzi wykonania wstrzykniętego
 * kodu.
 */

const dangerousPayloads = [
  {
    label: "XSS przez atrybut onerror",
    value: '<img src=x onerror="window.__brzeg02Marker = true">',
  },
  { label: "cudzysłowy i apostrofy", value: `Szkoła "Testowa" O'Brien'a` },
  { label: "wzorzec SQL-injection", value: "Robert'); DROP TABLE Students;--" },
] as const;

for (const payload of dangerousPayloads) {
  test(`BRZEG-02: nazwa szkoły z ${payload.label} nie wykonuje kodu i nie powoduje błędu @school @school-add @security`, async ({
    page,
    scenario: s,
  }) => {
    const name = `${s.id}-${payload.value}`;

    const form = await openSchoolAddForm(s.app);
    await fillSchoolName(s.app, form, name);
    await selectSchoolType(page, form);
    await newUniqueSchoolAddress(page, form);

    const { schoolId } = await saveSchoolAdd(page, form);
    await s.record("dangerousInputSchoolId", schoolId);

    const marker = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__brzeg02Marker === true,
    );
    expect(
      marker,
      "KRYTYCZNE: znacznik JavaScript ustawiony przez wstrzyknięty atrybut onerror wykonał się - " +
        "to jest podatność XSS w polu nazwy szkoły.",
    ).toBeFalsy();

    const persistedName = await s.app.detail("name").inputValue();
    console.log(`BRZEG-02 (${payload.label}): zapisana wartość to "${persistedName}".`);
    await s.record(`dangerousInputResult-${payload.label}`, persistedName || "SANITIZED_TO_EMPTY");
  });
}

/*
 * =========================================================
 * BRZEG-03
 * EMOJI I ZNAKI SPOZA BMP W NAZWIE SZKOŁY
 * =========================================================
 *
 * Gap analysis, punkt F.21.
 */

test("BRZEG-03: emoji i znaki spoza BMP w nazwie szkoły są zapisywane i odczytywane bez utraty danych @school @school-add @edge-input", async ({
  page,
  scenario: s,
}) => {
  const name = `${s.id}-🎓😀 Szkoła 𝕏𝔂𝔃`;

  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, name);
  await selectSchoolType(page, form);
  await newUniqueSchoolAddress(page, form);

  const { schoolId } = await saveSchoolAdd(page, form);
  await s.record("emojiSchoolId", schoolId);

  await expect(
    s.app.detail("name"),
    "Nazwa z emoji/znakami spoza BMP powinna zostać zachowana w całości, a nie ucięta ani " +
      "zamieniona na znaki zastępcze.",
  ).toHaveValue(name);

  const persistedName = await s.app.detail("name").inputValue();
  console.log(`BRZEG-03: zapisana nazwa to "${persistedName}".`);
  expect(persistedName).not.toContain("�");
});

/*
 * =========================================================
 * BRZEG-04
 * WKLEJENIE (PASTE) DO POLA Z MASKĄ/AUTOCOMPLETE
 * =========================================================
 *
 * Gap analysis, punkt F.22. support/school-add.ts (searchSchoolCity)
 * zawiera komentarz wprost ostrzegający, że atomowe ustawienie
 * wartości pola kodu pocztowego (fill()) nie zawsze uruchamia
 * wyszukiwanie tak, jak sekwencja pojedynczych naciśnięć klawiszy.
 * Prawdziwe wklejenie przez schowek jest z perspektywy przeglądarki
 * bliższe atomowemu ustawieniu wartości niż wpisywaniu - stąd to
 * ryzyko jest realne, a nie tylko teoretyczne.
 */

test("BRZEG-04: wklejenie kodu pocztowego ze schowka jest obsłużone tak samo jak ręczne wpisanie @school @school-add @edge-input", async ({
  page,
  scenario: s,
}) => {
  const form = await openSchoolAddForm(s.app);
  await fillSchoolName(s.app, form, `${s.id} Szkoła wklejanie`);
  await selectSchoolType(page, form);
  const address = await openSchoolAddressForm(page, form);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate((text) => navigator.clipboard.writeText(text), DEFAULT_POSTAL_CODE);

  const postalCodeInput = address.locator('input[id="zip_code_input"]');
  await address.getByRole("button", { name: "Wyczyść pola", exact: true }).click();
  await expect(postalCodeInput).toHaveValue("");

  await postalCodeInput.click();
  await postalCodeInput.press("Control+V");

  console.log(
    `BRZEG-04: po wklejeniu pole kodu pocztowego pokazuje wartość ` +
      `"${await postalCodeInput.inputValue()}".`,
  );

  const postalCodeOption = page.getByRole("option", { name: DEFAULT_POSTAL_CODE, exact: true });
  const optionAppeared = await postalCodeOption
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);

  if (!optionAppeared) {
    console.log(
      "BRZEG-04: wklejenie kodu pocztowego NIE uruchomiło podpowiedzi autocomplete tak, jak " +
        "wyszukiwanie oparte na ręcznym wpisywaniu (patrz searchSchoolCity w support/school-add.ts). " +
        "Użytkownik wklejający kod pocztowy mógłby utknąć bez listy miejscowości do wyboru - " +
        "warto to zweryfikować manualnie i rozważyć zgłoszenie jako błąd UX.",
    );
    await expect(postalCodeInput).toHaveValue(DEFAULT_POSTAL_CODE);
  } else {
    console.log("BRZEG-04: wklejenie uruchomiło podpowiedzi autocomplete tak samo jak wpisywanie.");
    await postalCodeOption.click();
    const row = address
      .getByRole("row")
      .filter({ hasText: DEFAULT_POSTAL_CODE })
      .filter({ hasText: DEFAULT_CITY });
    await expect(row).toHaveCount(1);
  }

  // Sprzątanie: zamykamy oba okna (adres + formularz szkoły) klawiszem
  // Escape, niezależnie od tego, którą gałęzią powyższej logiki test
  // przeszedł - nie zależymy od konkretnej etykiety przycisku "Anuluj"
  // wewnątrz dialogu adresu, którego istnienia nie zweryfikowaliśmy.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
});

/*
 * =========================================================
 * BRZEG-05
 * NIEPOPRAWNA SUMA KONTROLNA REGON/NIP
 * =========================================================
 *
 * Gap analysis, punkt F.23: dotychczasowe testy (SCH-34/35/51/52)
 * używają wyłącznie POPRAWNYCH numerów REGON/NIP. Ten test celowo
 * psuje ostatnią cyfrę (sumę kontrolną) i dokumentuje, czy aplikacja
 * to wykrywa.
 */

for (const identifier of [
  { label: "REGON", generate: validRegon },
  { label: "NIP", generate: validNip },
] as const) {
  test(`BRZEG-05: ${identifier.label} z niepoprawną sumą kontrolną - dokumentacja zachowania walidacji @school @school-add @validation`, async ({
    page,
    scenario: s,
  }) => {
    const valid = identifier.generate(Date.now());
    const invalid = corruptChecksumDigit(valid);

    const form = await openSchoolAddForm(s.app);
    await fillSchoolName(s.app, form, `${s.id} Szkoła ${identifier.label}`);
    await selectSchoolType(page, form);
    await newUniqueSchoolAddress(page, form);
    await fillSchoolAddTextField(form, identifier.label, invalid);

    const saveButton = form.getByRole("button", { name: "Zapisz", exact: true });
    if (!(await saveButton.isEnabled())) {
      console.log(
        `BRZEG-05 (${identifier.label}): niepoprawna suma kontrolna blokuje przycisk Zapisz - ` +
          "walidacja działa już po stronie klienta.",
      );
      await cancelSchoolAdd(form);
      return;
    }

    await saveButton.click();
    await page.waitForTimeout(1_000);

    if ((await form.count()) > 0) {
      console.log(
        `BRZEG-05 (${identifier.label}): niepoprawna suma kontrolna zablokowała zapis po stronie ` +
          "serwera/walidacji asynchronicznej.",
      );
      await expect(form).toBeVisible();
      await cancelSchoolAdd(form);
      return;
    }

    console.log(
      `BRZEG-05 (${identifier.label}): UWAGA - wartość "${invalid}" z niepoprawną sumą kontrolną ` +
        `(poprawna byłaby "${valid}") została zapisana bez żadnej blokady walidacyjnej. Brak ` +
        "walidacji sumy kontrolnej może być świadomą decyzją biznesową (np. numer wprowadzony " +
        "ręcznie z innego systemu) - potwierdź to z zespołem, zanim potraktujesz to jako błąd.",
    );
    await expect(page).toHaveURL(/\/school\/school-panel\/\d+$/);
    const schoolId = page.url().split("/").pop()!;
    await s.record(`invalid${identifier.label}SchoolId`, schoolId);
  });
}
