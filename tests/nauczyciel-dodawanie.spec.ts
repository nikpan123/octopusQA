import { test, expect } from "./support/scenario";

import { typeValue } from "./support/octopus";

import {
  expectSavedTeacherPhone,
  expectTeacherRodoOnCard,
  openTeacherHistory,
  expectTeacherRodoHistoryChange,
} from "./support/teacher-edit";

import {
  openNewTeacherForm,
  newTeacherFirstNameInput,
  newTeacherLastNameInput,
  newTeacherEmailInput,
  newTeacherPhoneInput,
  newTeacherBirthDateInput,
  newTeacherSourceSelect,
  selectNewTeacherSource,
  newTeacherConsentCheckbox,
  newTeacherSubjectAddButton,
  newTeacherSubjectLevelRow,
  selectNewTeacherSubject,
  selectNewTeacherLevel,
  addNewTeacherSubjectLevel,
  newTeacherSchoolRow,
  removeSchoolFromNewTeacher,
  newTeacherSaveButton,
  newTeacherCancelButton,
  openNoSubjectLevelWarning,
  confirmNoSubjectLevelWarning,
  cancelNoSubjectLevelWarning,
  expectContactRequiredWarning,
  closeContactRequiredWarning,
  saveNewTeacherWithoutSubjectLevel,
  saveNewTeacherWithSubjectLevel,
  expectTeacherCreationHistoryChange,
  similarTeacherRow,
  showSimilarTeacher,
  expectTeacherSubjectLevelOnCard,
  formatDateDDMMYYYY,
  tomorrowDDMMYYYY,
  expectEmailAlreadyInUseWarning,
  closeEmailAlreadyInUseWarning,
} from "./support/teacher-add";

/*
 * =========================================================
 * STAŁE SZKOŁY QA
 * =========================================================
 *
 * W testach dodawania nauczyciela NIE tworzymy
 * dodatkowych szkół.
 *
 * Korzystamy z dwóch istniejących szkół QA.
 */

const TEST_SCHOOL = {
  id: "93391",
  name: "Szkoła QA 1",
} as const;

const SECOND_TEST_SCHOOL = {
  id: "93392",
  name: "Szkoła QA 2",
} as const;

/*
 * =========================================================
 * HELPERY LOKALNE
 * =========================================================
 */

async function registerCreatedTeacher(s: any, teacherId: string) {
  /*
   * Scenario nie utworzył nauczyciela przez createTeacher(),
   * dlatego ID zapisujemy ręcznie.
   */
  await s.record("teacherId", teacherId);

  /*
   * Oznaczamy rekord jako testowy.
   */
  await s.app.markTestRecord();
}

/*
 * Sprawdzenie relacji od strony szkoły.
 */
async function expectTeacherInSchool(
  page: any,
  s: any,
  schoolId: string,
  teacherId: string,
) {
  await s.app.openPanel("school", schoolId);

  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });

  const row = teachers.getByRole("row").filter({
    has: page.getByRole("gridcell", {
      name: teacherId,
      exact: true,
    }),
  });

  await expect(row).toHaveCount(1);
}

/*
 * Wyszukanie konkretnego nauczyciela po e-mailu.
 */
async function searchTeacherByEmail(
  page: any,
  s: any,
  email: string,
  teacherId: string,
) {
  await s.app.openPanel("teacher");

  const search = await s.app.openSearch("teacher");

  await typeValue(s.app.field(search, "Email"), email);

  await search
    .getByRole("button", {
      name: "Szukaj",
      exact: true,
    })
    .click();

  await expect(search).toHaveCount(0);

  const row = s.app
    .results("teacher")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name: teacherId,
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  await row.click();

  await expect(page).toHaveURL(
    new RegExp(`/teacher/teacher-panel/${teacherId}$`),
  );
}

/*
 * =========================================================
 * ADD-01
 * MINIMALNY POPRAWNY REKORD Z E-MAILEM
 * =========================================================
 */

test("ADD-01: nauczyciela można utworzyć z imieniem, nazwiskiem, szkołą i e-mailem bez przedmioto-poziomu @teacher @add @positive", async ({
  page,
  scenario: s,
}) => {
  /*
   * Ważne:
   *
   * Przy DODAWANIU nie ma obecnie normalizacji.
   *
   * nOWAK ma pozostać nOWAK.
   */
  const firstName = "Testowy";

  const lastName = "nOWAK";

  const form = await s.app.prepareTeacher(
    lastName,
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await typeValue(newTeacherFirstNameInput(form), firstName);

  /*
   * Nie dodajemy przedmioto-poziomu.
   *
   * Oczekujemy ostrzeżenia i wybieramy Tak.
   */
  const teacherId = await saveNewTeacherWithoutSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * =====================================================
   * DANE PODSTAWOWE
   * =====================================================
   */

  await expect(s.app.detail("firstName")).toHaveValue(firstName);

  /*
   * BRAK NORMALIZACJI PRZY DODAWANIU.
   */
  await expect(s.app.detail("lastName")).toHaveValue(lastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  /*
   * =====================================================
   * SZKOŁA
   * =====================================================
   */

  await expect(
    page.getByRole("row").filter({
      hasText: TEST_SCHOOL.name,
    }),
  ).toHaveCount(1);

  /*
   * =====================================================
   * RODO
   * =====================================================
   */

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: false,
  });

  /*
   * =====================================================
   * TRWAŁOŚĆ PO ID
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(firstName);

  await expect(s.app.detail("lastName")).toHaveValue(lastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  /*
   * =====================================================
   * WYSZUKIWANIE PO E-MAILU
   * =====================================================
   */

  await searchTeacherByEmail(page, s, s.email, teacherId);

  /*
   * =====================================================
   * RELACJA OD STRONY SZKOŁY
   * =====================================================
   */

  await expectTeacherInSchool(page, s, TEST_SCHOOL.id, teacherId);

  /*
   * =====================================================
   * HISTORIA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  const history = await openTeacherHistory(page);

  await expectTeacherCreationHistoryChange(
    page,
    history,
    "Imię",
    firstName,
    "Karta nauczyciela",
  );

  await expectTeacherCreationHistoryChange(
    page,
    history,
    "Nazwisko",
    lastName,
    "Karta nauczyciela",
  );

  await expectTeacherCreationHistoryChange(
    page,
    history,
    "Email",
    s.email,
    "Karta nauczyciela",
  );

  await expectTeacherCreationHistoryChange(
    page,
    history,
    "Dodana Szkoła",
    TEST_SCHOOL.name,
    "Karta nauczyciela",
  );
});

/*
 * =========================================================
 * ADD-02
 * TELEFON ZAMIAST E-MAILA
 * =========================================================
 */

test("ADD-02: nauczyciela można utworzyć z telefonem bez e-maila @teacher @add @positive", async ({
  page,
  scenario: s,
}) => {
  const phone = "500500500";

  const form = await s.app.prepareTeacher(
    "Telefonowy",
    "",
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const phoneInput = newTeacherPhoneInput(form);

  await phoneInput.fill(phone);

  await phoneInput.press("Tab");

  const teacherId = await saveNewTeacherWithoutSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  await expect(s.app.detail("email")).toHaveValue("");

  await expectSavedTeacherPhone(page, phone);

  /*
   * Trwałość.
   */
  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("email")).toHaveValue("");

  await expectSavedTeacherPhone(page, phone);

  await expectTeacherInSchool(page, s, TEST_SCHOOL.id, teacherId);
});

/*
 * =========================================================
 * ADD-03
 * DZISIEJSZA DATA URODZENIA
 * =========================================================
 */

test("ADD-03: dzisiejsza data urodzenia jest akceptowana @teacher @add @birthdate", async ({
  page,
  scenario: s,
}) => {
  const today = formatDateDDMMYYYY(new Date());

  const firstName = "Testowy";

  const lastName = "Dzisiejszy";

  /*
   * =====================================================
   * 1. PRZYGOTOWANIE FORMULARZA
   * =====================================================
   */

  const form = await s.app.prepareTeacher(
    lastName,
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await typeValue(newTeacherFirstNameInput(form), firstName);

  /*
   * =====================================================
   * 2. DATA URODZENIA
   * =====================================================
   */

  const birthDate = newTeacherBirthDateInput(form);

  await expect(birthDate).toHaveCount(1);

  await expect(birthDate).toBeVisible();

  await expect(birthDate).toBeEnabled();

  await birthDate.fill(today);

  await birthDate.press("Tab");

  await expect(birthDate).toHaveValue(today);

  /*
   * Sprawdzamy, że wpisanie daty
   * nie zmieniło innych pól.
   */
  await expect(newTeacherFirstNameInput(form)).toHaveValue(firstName);

  await expect(newTeacherLastNameInput(form)).toHaveValue(lastName);

  /*
   * =====================================================
   * 3. PRZEDMIOTO-POZIOM
   * =====================================================
   *
   * Dodajemy go tylko po to,
   * żeby zapis nie wymagał dodatkowego
   * potwierdzenia jego braku.
   *
   * Nie testujemy go w ADD-03.
   */

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  /*
   * =====================================================
   * 4. ZAPIS
   * =====================================================
   */

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * =====================================================
   * 5. DATA JEST ZAPISANA
   * =====================================================
   */

  await expect(s.app.detail("dateOfBirth")).toHaveValue(today);

  await expect(s.app.detail("firstName")).toHaveValue(firstName);

  await expect(s.app.detail("lastName")).toHaveValue(lastName);

  /*
   * =====================================================
   * 6. TRWAŁOŚĆ PO PONOWNYM OTWARCIU
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("dateOfBirth")).toHaveValue(today);

  await expect(s.app.detail("firstName")).toHaveValue(firstName);

  await expect(s.app.detail("lastName")).toHaveValue(lastName);
});
/*
 * =========================================================
 * ADD-04
 * DOMYŚLNE ŹRÓDŁO I LISTA ŹRÓDEŁ
 * =========================================================
 */

test("ADD-04: źródło domyślne to Karta nauczyciela i lista zawiera trzy wartości @teacher @add @source", async ({
  page,
  scenario: s,
}) => {
  await s.app.openPanel("teacher");

  const form = await openNewTeacherForm(page);

  const source = newTeacherSourceSelect(form);

  await expect(source).toContainText("Karta nauczyciela");

  await source.click();

  const expectedSources = [
    "Formularz klubowy",
    "Karta LS",
    "Karta nauczyciela",
  ];

  for (const sourceName of expectedSources) {
    await expect(
      page.getByRole("option", {
        name: sourceName,
        exact: true,
      }),
    ).toBeVisible();
  }

  await expect(page.getByRole("option")).toHaveCount(expectedSources.length);

  /*
   * Zamknięcie listy.
   */
  await page
    .getByRole("option", {
      name: "Karta nauczyciela",
      exact: true,
    })
    .click();

  await newTeacherCancelButton(form).click();

  await expect(form).toHaveCount(0);
});

/*
 * =========================================================
 * ADD-05
 * ZMIANA ŹRÓDŁA
 * =========================================================
 */

test("ADD-05: nauczyciela można utworzyć ze źródłem Karta LS @teacher @add @source", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Zrodlo",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await selectNewTeacherSource(page, form, "Karta LS");

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  const history = await openTeacherHistory(page);

  await expectTeacherCreationHistoryChange(
    page,
    history,
    "Email",
    s.email,
    "Karta LS",
  );

  await expectTeacherCreationHistoryChange(
    page,
    history,
    "Dodana Szkoła",
    TEST_SCHOOL.name,
    "Karta LS",
  );
});

/*
 * =========================================================
 * ADD-06
 * RODO E-MAIL -> MARKETING
 * =========================================================
 */

test("ADD-06: zgoda E-mail może być zaznaczona bez zgody Marketing @teacher @add @rodo", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Rodoemail",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const marketing = newTeacherConsentCheckbox(form, "Marketing");

  const email = newTeacherConsentCheckbox(form, "E-mail");

  const phone = newTeacherConsentCheckbox(form, "Telefon");

  /*
   * Stan początkowy.
   */
  await expect(marketing).not.toBeChecked();

  await expect(email).not.toBeChecked();

  await expect(phone).not.toBeChecked();

  /*
   * Zaznaczamy wyłącznie zgodę E-mail.
   */
  await email.check();

  await expect(email).toBeChecked();

  /*
   * Przy DODAWANIU nauczyciela
   * E-mail NIE wymusza Marketingu.
   */
  await expect(marketing).not.toBeChecked();

  await expect(phone).not.toBeChecked();

  /*
   * Przedmioto-poziom dodajemy tylko,
   * żeby zapis nie wymagał dodatkowego
   * potwierdzenia jego braku.
   */
  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * Stan po zapisie.
   */
  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: true,
    phone: false,
  });

  /*
   * Trwałość.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: true,
    phone: false,
  });

  /*
   * Historia.
   */
  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Nie");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Email", "Tak");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Nie");
});

/*
 * =========================================================
 * ADD-07
 * RODO TELEFON -> MARKETING
 * =========================================================
 */

test("ADD-07: zgoda Telefon może być zaznaczona bez zgody Marketing @teacher @add @rodo", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Rodotelefon",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const marketing = newTeacherConsentCheckbox(form, "Marketing");

  const email = newTeacherConsentCheckbox(form, "E-mail");

  const phone = newTeacherConsentCheckbox(form, "Telefon");

  /*
   * Stan początkowy.
   */
  await expect(marketing).not.toBeChecked();

  await expect(email).not.toBeChecked();

  await expect(phone).not.toBeChecked();

  /*
   * Zaznaczamy wyłącznie Telefon.
   */
  await phone.check();

  await expect(phone).toBeChecked();

  /*
   * Przy DODAWANIU nauczyciela
   * Telefon również nie wymusza Marketingu.
   */
  await expect(marketing).not.toBeChecked();

  await expect(email).not.toBeChecked();

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * Stan po zapisie.
   */
  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: true,
  });

  /*
   * Trwałość.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: true,
  });

  /*
   * Historia.
   */
  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Nie");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Email", "Nie");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Tak");
});

/*
 * =========================================================
 * ADD-08
 * BRAK ZGÓD JEST DOZWOLONY
 * =========================================================
 */

test("ADD-08: nauczyciela można utworzyć bez żadnej zgody RODO @teacher @add @rodo", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Bezrodo",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await expect(newTeacherConsentCheckbox(form, "Marketing")).not.toBeChecked();

  await expect(newTeacherConsentCheckbox(form, "E-mail")).not.toBeChecked();

  await expect(newTeacherConsentCheckbox(form, "Telefon")).not.toBeChecked();

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  await expectTeacherRodoOnCard(page, {
    marketing: false,
    email: false,
    phone: false,
  });

  /*
   * Tworzenie nauczyciela zapisuje
   * również stan zgód Nie.
   */
  const history = await openTeacherHistory(page);

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Nie");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Email", "Nie");

  await expectTeacherRodoHistoryChange(page, history, "Zgoda Telefon", "Nie");
});

/*
 * =========================================================
 * ADD-09
 * DWIE ISTNIEJĄCE SZKOŁY
 * =========================================================
 */

test("ADD-09: nauczyciela można utworzyć z dwiema szkołami @teacher @add @school", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Dwieszkoly",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * Nie tworzymy drugiej szkoły.
   *
   * Dodajemy istniejącą Szkołę QA 2.
   */
  await s.app.attachSchool(
    form,
    SECOND_TEST_SCHOOL.id,
    SECOND_TEST_SCHOOL.name,
  );

  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  await expect(newTeacherSchoolRow(form, SECOND_TEST_SCHOOL.name)).toHaveCount(
    1,
  );

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * Nauczyciel ma być widoczny
   * w obu szkołach.
   */
  await expectTeacherInSchool(page, s, TEST_SCHOOL.id, teacherId);

  await expectTeacherInSchool(page, s, SECOND_TEST_SCHOOL.id, teacherId);
});

/*
 * =========================================================
 * ADD-10
 * USUNIĘCIE SZKOŁY PRZED ZAPISEM
 * =========================================================
 */

test("ADD-10: szkołę można usunąć przed zapisaniem nauczyciela @teacher @add @school", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Usunszkole",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await s.app.attachSchool(
    form,
    SECOND_TEST_SCHOOL.id,
    SECOND_TEST_SCHOOL.name,
  );

  /*
   * Mamy obie szkoły.
   */
  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  await expect(newTeacherSchoolRow(form, SECOND_TEST_SCHOOL.name)).toHaveCount(
    1,
  );

  /*
   * Usuwamy Szkołę QA 2.
   */
  await removeSchoolFromNewTeacher(form, SECOND_TEST_SCHOOL.name);

  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  await expect(newTeacherSchoolRow(form, SECOND_TEST_SCHOOL.name)).toHaveCount(
    0,
  );

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * Po zapisie ma zostać tylko Szkoła QA 1.
   */
  await expect(
    page.getByRole("row").filter({
      hasText: TEST_SCHOOL.name,
    }),
  ).toHaveCount(1);

  await expect(
    page.getByRole("row").filter({
      hasText: SECOND_TEST_SCHOOL.name,
    }),
  ).toHaveCount(0);
});

/*
 * =========================================================
 * ADD-11
 * JEDEN PRZEDMIOTO-POZIOM
 * =========================================================
 */

test("ADD-11: nauczyciela można utworzyć z przedmioto-poziomem Matematyka SP @teacher @add @subject", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Matematyka",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  await expectTeacherSubjectLevelOnCard(page, "Matematyka", "SP");

  /*
   * Trwałość.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectTeacherSubjectLevelOnCard(page, "Matematyka", "SP");
});

/*
 * =========================================================
 * ADD-12
 * WIELE PRZEDMIOTO-POZIOMÓW
 * =========================================================
 */

test("ADD-12: nauczyciela można utworzyć z wieloma przedmioto-poziomami @teacher @add @subject", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Wieleprzedmiotow",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  await addNewTeacherSubjectLevel(page, form, "Język Polski", "SŚ");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  await expectTeacherSubjectLevelOnCard(page, "Matematyka", "SP");

  await expectTeacherSubjectLevelOnCard(page, "Język polski", "SŚ");

  /*
   * Trwałość po ponownym otwarciu.
   */
  await s.app.openPanel("teacher", teacherId);

  await expectTeacherSubjectLevelOnCard(page, "Matematyka", "SP");

  await expectTeacherSubjectLevelOnCard(page, "Język polski", "SŚ");
});
/*
 * =========================================================
 * ADD-13
 * BRAK NORMALIZACJI PRZY DODAWANIU
 * =========================================================
 */

test("ADD-13: dodawanie nauczyciela zachowuje wielkość liter i akceptuje znak _ @teacher @add @name", async ({
  page,
  scenario: s,
}) => {
  const inputFirstName = "nikODEm";

  const inputLastName = "nOWAK_TEST";

  /*
   * prepareTeacher:
   * - otwiera formularz,
   * - uzupełnia nazwisko,
   * - uzupełnia imię,
   * - uzupełnia e-mail,
   * - przypina szkołę.
   */
  const form = await s.app.prepareTeacher(
    "Tymczasowe",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * Nadpisujemy dane wartościami,
   * które chcemy faktycznie testować.
   */
  const firstName = newTeacherFirstNameInput(form);

  const lastName = newTeacherLastNameInput(form);

  await typeValue(firstName, inputFirstName);

  await typeValue(lastName, inputLastName);

  /*
   * Sprawdzamy stan formularza
   * przed zapisem.
   */
  await expect(firstName).toHaveValue(inputFirstName);

  await expect(lastName).toHaveValue(inputLastName);

  await expect(newTeacherEmailInput(form)).toHaveValue(s.email);

  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  /*
   * Dodajemy przedmioto-poziom,
   * żeby zapis nie wymagał dodatkowego
   * potwierdzenia jego braku.
   */
  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  /*
   * Zapis nauczyciela.
   */
  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * =====================================================
   * WERYFIKACJA PO ZAPISIE
   * =====================================================
   *
   * Przy dodawaniu nie oczekujemy
   * normalizacji wielkości liter.
   */

  await expect(s.app.detail("firstName")).toHaveValue(inputFirstName);

  await expect(s.app.detail("lastName")).toHaveValue(inputLastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  /*
   * =====================================================
   * TRWAŁOŚĆ
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("firstName")).toHaveValue(inputFirstName);

  await expect(s.app.detail("lastName")).toHaveValue(inputLastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);
});

/*
 * =========================================================
 * ADD-14
 * PODOBNA OSOBA -> POKAŻ
 * =========================================================
 */

test("ADD-14: Pokaż przy podobnej osobie zamyka formularz i otwiera istniejącego nauczyciela @teacher @add @duplicate", async ({
  page,
  scenario: s,
}) => {
  const existingLastName = "Podobny";

  /*
   * Tworzymy istniejącego nauczyciela,
   * ale NIE tworzymy nowej szkoły.
   */
  let form = await s.app.prepareTeacher(
    existingLastName,
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const existingTeacherId = await saveNewTeacherWithoutSubjectLevel(page, form);

  await registerCreatedTeacher(s, existingTeacherId);

  /*
   * Otwieramy pusty formularz dodawania
   * kolejnego nauczyciela.
   */
  await s.app.openPanel("teacher");

  form = await openNewTeacherForm(page);

  await typeValue(newTeacherLastNameInput(form), existingLastName);

  await typeValue(newTeacherFirstNameInput(form), "Testowy");

  /*
   * Istniejący nauczyciel powinien pojawić się
   * w tabeli osób podobnych.
   */
  await expect(similarTeacherRow(form, existingTeacherId)).toHaveCount(1);

  /*
   * Kliknięcie Pokaż:
   *
   * - zamyka Dodaj nowego nauczyciela,
   * - przechodzi do istniejącego rekordu.
   */
  await showSimilarTeacher(form, existingTeacherId);

  await expect(page).toHaveURL(
    new RegExp(`/teacher/teacher-panel/${existingTeacherId}$`),
  );
});

/*
 * =========================================================
 * ADD-15 / ADD-16 / ADD-17
 * POLA WYMAGANE
 * =========================================================
 */

for (const missing of ["imię", "nazwisko", "szkoła"] as const) {
  test(`ADD-${
    missing === "imię" ? "15" : missing === "nazwisko" ? "16" : "17"
  }: brak pola ${missing} blokuje utworzenie nauczyciela @teacher @add @validation`, async ({
    page,
    scenario: s,
  }) => {
    const form = await s.app.prepareTeacher(
      "Walidacja",
      s.email,

      /*
       * Przy ADD-17 celowo nie dodajemy szkoły.
       */
      missing === "szkoła" ? undefined : TEST_SCHOOL.id,

      missing === "szkoła" ? undefined : TEST_SCHOOL.name,
    );

    if (missing === "imię") {
      await newTeacherFirstNameInput(form).fill("");
    }

    if (missing === "nazwisko") {
      await newTeacherLastNameInput(form).fill("");
    }

    await newTeacherSaveButton(form).click();

    await expect(form).toContainText(
      "Należy uzupełnić nazwisko, imię i wybrać szkołę",
    );

    /*
     * Formularz pozostaje otwarty.
     */
    await expect(form).toBeVisible();

    await newTeacherCancelButton(form).click();

    await expect(form).toHaveCount(0);

    /*
     * Rekord nie powstał.
     */
    await s.app.openPanel("teacher");

    await s.app.searchMissing("teacher", "Email", s.email);
  });
}

/*
 * =========================================================
 * ADD-18
 * BRAK E-MAILA I TELEFONU
 * =========================================================
 */

test("ADD-18: brak e-maila i telefonu blokuje utworzenie nauczyciela po potwierdzeniu braku przedmioto-poziomu @teacher @add @validation", async ({
  page,
  scenario: s,
}) => {
  const lastName = "Bezkontaktu";

  const form = await s.app.prepareTeacher(
    lastName,
    "",
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * Pierwszy Zapisz:
   * brak przedmioto-poziomu.
   */
  await newTeacherSaveButton(form).click();

  const noSubjectWarning = await openNoSubjectLevelWarning(page);

  await confirmNoSubjectLevelWarning(noSubjectWarning);

  /*
   * Następnie walidacja kontaktu.
   */
  const contactWarning = await expectContactRequiredWarning(page);

  await closeContactRequiredWarning(contactWarning);

  /*
   * Formularz nadal pozostaje otwarty.
   */
  await expect(form).toBeVisible();

  await newTeacherCancelButton(form).click();

  /*
   * Rekord nie powstał.
   */
  await s.app.openPanel("teacher");

  await s.app.searchMissing("teacher", "Nazwisko", lastName);
});

/*
 * =========================================================
 * ADD-19
 * BRAK PRZEDMIOTO-POZIOMU -> NIE
 * =========================================================
 */

test("ADD-19: wybranie Nie przy ostrzeżeniu o braku przedmioto-poziomu pozostawia formularz otwarty @teacher @add @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Bezprzedmiotu",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await newTeacherSaveButton(form).click();

  const warning = await openNoSubjectLevelWarning(page);

  /*
   * Wybieramy Nie.
   */
  await cancelNoSubjectLevelWarning(warning);

  /*
   * Formularz pozostaje otwarty,
   * a dane pozostają w polach.
   */
  await expect(form).toBeVisible();

  await expect(newTeacherEmailInput(form)).toHaveValue(s.email);

  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  await newTeacherCancelButton(form).click();

  /*
   * Rekord nie powstał.
   */
  await s.app.openPanel("teacher");

  await s.app.searchMissing("teacher", "Email", s.email);
});

/*
 * =========================================================
 * ADD-20
 * NIEPOPRAWNE E-MAILE
 * =========================================================
 */

const invalidEmails = ["test", "test@", "@example.pl", "a b@example.pl", "a@"];

for (const [index, invalidEmail] of invalidEmails.entries()) {
  test(`ADD-20.${index + 1}: niepoprawny e-mail "${invalidEmail}" blokuje zapis @teacher @add @email @validation`, async ({
    page,
    scenario: s,
  }) => {
    const form = await s.app.prepareTeacher(
      "Niepoprawnyemail",
      invalidEmail,
      TEST_SCHOOL.id,
      TEST_SCHOOL.name,
    );

    /*
     * Dodajemy przedmioto-poziom,
     * żeby test dotyczył wyłącznie e-maila.
     */
    await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

    await newTeacherSaveButton(form).click();

    await expect(
      form.getByText("Wprowadź poprawny adres E-Mail", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(form).toBeVisible();

    await newTeacherCancelButton(form).click();
  });
}

/*
 * =========================================================
 * ADD-21
 * DUPLIKAT E-MAILA
 * =========================================================
 */

test("ADD-21: e-mail używany przez innego nauczyciela blokuje zapis @teacher @add @email @validation", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * 1. TWORZYMY PIERWSZEGO NAUCZYCIELA
   * =====================================================
   *
   * Ten nauczyciel zajmie adres s.email.
   */

  let form = await s.app.prepareTeacher(
    "Emailzajety",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const existingTeacherId = await saveNewTeacherWithoutSubjectLevel(page, form);

  await registerCreatedTeacher(s, existingTeacherId);

  /*
   * =====================================================
   * 2. OTWIERAMY FORMULARZ DRUGIEGO NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher");

  form = await openNewTeacherForm(page);

  await typeValue(newTeacherLastNameInput(form), "Duplikat");

  await typeValue(newTeacherFirstNameInput(form), "Adam");

  await typeValue(newTeacherEmailInput(form), s.email);

  await s.app.attachSchool(form, TEST_SCHOOL.id, TEST_SCHOOL.name);

  /*
   * Dodajemy przedmioto-poziom,
   * żeby zapis nie zatrzymał się
   * wcześniej na innym ostrzeżeniu.
   */
  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  /*
   * =====================================================
   * 3. PRÓBA ZAPISU
   * =====================================================
   */

  await newTeacherSaveButton(form).click();

  /*
   * =====================================================
   * 4. KOMUNIKAT O ZAJĘTYM E-MAILU
   * =====================================================
   */

  const warning = await expectEmailAlreadyInUseWarning(page);

  /*
   * Główny formularz nadal istnieje
   * pod oknem ostrzeżenia.
   */
  await expect(form).toBeVisible();

  /*
   * Najpierw zamykamy komunikat OK.
   */
  await closeEmailAlreadyInUseWarning(warning);

  /*
   * =====================================================
   * 5. FORMULARZ NADAL JEST OTWARTY
   * =====================================================
   */

  await expect(form).toBeVisible();

  /*
   * Dane nie zostały wyczyszczone.
   */
  await expect(newTeacherEmailInput(form)).toHaveValue(s.email);

  await expect(newTeacherLastNameInput(form)).toHaveValue("Duplikat");

  /*
   * =====================================================
   * 6. ANULOWANIE NIEUDANEJ PRÓBY
   * =====================================================
   */

  await newTeacherCancelButton(form).click();

  await expect(form).toHaveCount(0);

  /*
   * Nadal jesteśmy na panelu nauczycieli,
   * a drugi rekord nie został zapisany.
   */
  await expect(page).toHaveURL(/\/teacher\/teacher-panel$/);
});

/*
 * =========================================================
 * ADD-22
 * TELEFON ZA KRÓTKI
 * =========================================================
 */

test("ADD-22: telefon krótszy niż 9 cyfr blokuje zapis @teacher @add @phone @validation", async ({
  page,
  scenario: s,
}) => {
  const lastName = "Krotkitelefon";

  const form = await s.app.prepareTeacher(
    lastName,
    "",
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * =====================================================
   * 1. NIEPOPRAWNY TELEFON
   * =====================================================
   */

  const phone = newTeacherPhoneInput(form);

  await phone.fill("123");

  await phone.press("Tab");

  /*
   * Już po wyjściu z pola kontrolka
   * powinna być oznaczona jako niepoprawna.
   */
  await expect(phone).toHaveAttribute("aria-invalid", "true");

  /*
   * =====================================================
   * 2. PRZEDMIOTO-POZIOM
   * =====================================================
   *
   * Dodajemy poprawny przedmioto-poziom,
   * żeby próba zapisu nie zatrzymała się
   * wcześniej na ostrzeżeniu o jego braku.
   */

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  /*
   * =====================================================
   * 3. PRÓBA ZAPISU
   * =====================================================
   */

  await newTeacherSaveButton(form).click();

  /*
   * Dopiero po próbie zapisu aplikacja
   * pokazuje komunikat walidacyjny telefonu.
   */
  await expect(
    form.getByText("Wprowadź poprawny numer telefonu", {
      exact: true,
    }),
  ).toBeVisible();

  /*
   * Formularz nie może zostać zamknięty.
   */
  await expect(form).toBeVisible();

  /*
   * Pole nadal jest niepoprawne.
   */
  await expect(phone).toHaveAttribute("aria-invalid", "true");

  /*
   * Wartość nie została automatycznie
   * poprawiona ani wyczyszczona.
   */
  await expect(phone).toHaveValue("123");

  /*
   * =====================================================
   * 4. ANULOWANIE
   * =====================================================
   */

  await newTeacherCancelButton(form).click();

  await expect(form).toHaveCount(0);

  /*
   * =====================================================
   * 5. REKORD NIE POWSTAŁ
   * =====================================================
   */

  await s.app.openPanel("teacher");

  await s.app.searchMissing("teacher", "Nazwisko", lastName);
});

/*
 * =========================================================
 * ADD-23
 * TELEFON MAKSYMALNIE 9 CYFR
 * =========================================================
 */

test("ADD-23: pole telefonu nie pozwala wprowadzić więcej niż 9 cyfr @teacher @add @phone", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Telefonlimit",
    "",
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const phone = newTeacherPhoneInput(form);

  /*
   * Próbujemy wpisać 12 cyfr.
   */
  await phone.pressSequentially("500500500123", {
    delay: 40,
  });

  /*
   * Maskę usuwamy przed porównaniem.
   */
  const digits = (await phone.inputValue()).replace(/\D/g, "");

  expect(digits).toBe("500500500");

  expect(digits.length).toBe(9);

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  await expectSavedTeacherPhone(page, "500500500");
});

/*
 * =========================================================
 * ADD-24
 * DATA Z PRZYSZŁOŚCI
 * =========================================================
 */

test("ADD-24: przyszła data urodzenia blokuje zapis nauczyciela @teacher @add @birthdate @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Przyszly",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const birthDate = newTeacherBirthDateInput(form);

  await birthDate.fill(tomorrowDDMMYYYY());

  await birthDate.press("Tab");

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  await newTeacherSaveButton(form).click();

  await expect(
    form.getByText(/Wybierz datę z poprawnego zakresu/),
  ).toBeVisible();

  await expect(form).toBeVisible();

  await newTeacherCancelButton(form).click();
});

/*
 * =========================================================
 * ADD-25
 * NIEISTNIEJĄCA DATA
 * =========================================================
 */

test("ADD-25: nauczyciela można utworzyć bez daty urodzenia @teacher @add @birthdate @positive", async ({
  page,
  scenario: s,
}) => {
  const lastName = "Bezdaty";

  /*
   * =====================================================
   * 1. PRZYGOTOWANIE FORMULARZA
   * =====================================================
   */

  const form = await s.app.prepareTeacher(
    lastName,
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * =====================================================
   * 2. DATA URODZENIA POZOSTAJE PUSTA
   * =====================================================
   */

  const birthDate = newTeacherBirthDateInput(form);

  await expect(birthDate).toBeVisible();

  await expect(birthDate).toHaveValue("");

  /*
   * =====================================================
   * 3. PRZEDMIOTO-POZIOM
   * =====================================================
   *
   * Dodajemy poprawny przedmioto-poziom,
   * żeby zapis nie wymagał dodatkowego
   * potwierdzenia jego braku.
   */

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  /*
   * =====================================================
   * 4. ZAPIS
   * =====================================================
   */

  const teacherId = await saveNewTeacherWithSubjectLevel(page, form);

  await registerCreatedTeacher(s, teacherId);

  /*
   * =====================================================
   * 5. REKORD POWSTAŁ BEZ DATY
   * =====================================================
   */

  await expect(s.app.detail("lastName")).toHaveValue(lastName);

  await expect(s.app.detail("email")).toHaveValue(s.email);

  await expect(s.app.detail("dateOfBirth")).toHaveValue("");

  /*
   * =====================================================
   * 6. TRWAŁOŚĆ
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  await expect(s.app.detail("dateOfBirth")).toHaveValue("");

  await expect(s.app.detail("lastName")).toHaveValue(lastName);
});
/*
 * =========================================================
 * ADD-26
 * DUPLIKAT SZKOŁY
 * =========================================================
 */

test("ADD-26: tej samej szkoły nie można dodać nauczycielowi dwa razy @teacher @add @school @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Duplikatszkoly",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * Stan początkowy:
   * dokładnie jedna Szkoła QA 1.
   */
  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  /*
   * Ponowna próba dodania tej samej szkoły.
   */
  await form
    .getByRole("button", {
      name: "Dodaj szkołę",
      exact: true,
    })
    .click();

  const schools = s.app.dialog("Dodaj szkołę - szkoły nauczyciela");

  await typeValue(s.app.field(schools, "ID szkoły"), TEST_SCHOOL.id);

  await schools
    .getByRole("button", {
      name: "Szukaj",
      exact: true,
    })
    .click();

  const searchedSchool = schools.getByRole("row").filter({
    hasText: TEST_SCHOOL.name,
  });

  await expect(searchedSchool).toBeVisible();

  /*
   * Jeżeli UI nadal udostępnia akcję Dodaj,
   * próbujemy jej użyć.
   *
   * Końcowa asercja sprawdza regułę biznesową:
   * duplikat nie może znaleźć się na formularzu.
   */
  const addAction = searchedSchool.getByText("Dodaj", {
    exact: true,
  });

  if ((await addAction.count()) > 0) {
    await addAction.first().click();
  }

  /*
   * Zamykamy modal szkół.
   */
  const schoolSave = schools.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  if (await schoolSave.isVisible().catch(() => false)) {
    await schoolSave.click();
  }

  await expect(schools).toHaveCount(0);

  /*
   * Na formularzu nadal dokładnie jedna szkoła.
   */
  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  await newTeacherCancelButton(form).click();
});

/*
 * =========================================================
 * ADD-27
 * SAM PRZEDMIOT
 * =========================================================
 */

test("ADD-27: nie można dodać przedmioto-poziomu bez wybranego poziomu @teacher @add @subject @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Samprzedmiot",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await selectNewTeacherSubject(page, form, "Matematyka");

  const add = newTeacherSubjectAddButton(form);

  await expect(add).toBeDisabled();

  await expect(newTeacherSubjectLevelRow(form, "Matematyka", "SP")).toHaveCount(
    0,
  );

  await newTeacherCancelButton(form).click();
});

/*
 * =========================================================
 * ADD-28
 * SAM POZIOM
 * =========================================================
 */

test("ADD-28: nie można dodać przedmioto-poziomu bez wybranego przedmiotu @teacher @add @subject @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Sampoziom",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await selectNewTeacherLevel(page, form, "SP");

  const add = newTeacherSubjectAddButton(form);

  await expect(add).toBeDisabled();

  await newTeacherCancelButton(form).click();
});

/*
 * =========================================================
 * ADD-29
 * DUPLIKAT PRZEDMIOTO-POZIOMU
 * =========================================================
 */

test("ADD-29: tego samego przedmioto-poziomu nie można dodać dwa razy @teacher @add @subject @validation", async ({
  page,
  scenario: s,
}) => {
  const form = await s.app.prepareTeacher(
    "Duplikatprzedmiotu",
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  /*
   * Pierwsze dodanie.
   */
  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  await expect(newTeacherSubjectLevelRow(form, "Matematyka", "SP")).toHaveCount(
    1,
  );

  /*
   * Druga próba.
   */
  await selectNewTeacherSubject(page, form, "Matematyka");

  await selectNewTeacherLevel(page, form, "SP");

  const add = newTeacherSubjectAddButton(form);

  /*
   * Nie zakładamy jeszcze,
   * czy aplikacja blokuje przycisk,
   * czy ignoruje jego kliknięcie.
   *
   * Sprawdzamy końcowy rezultat.
   */
  if (await add.isEnabled()) {
    await add.click();
  }

  /*
   * Nadal tylko jeden taki wiersz.
   */
  await expect(newTeacherSubjectLevelRow(form, "Matematyka", "SP")).toHaveCount(
    1,
  );

  await newTeacherCancelButton(form).click();
});

/*
 * =========================================================
 * ADD-30
 * ANULOWANIE KOMPLETNEGO FORMULARZA
 * =========================================================
 */

test("ADD-30: anulowanie kompletnego formularza nie tworzy nauczyciela ani relacji ze szkołą @teacher @add @cancel", async ({
  page,
  scenario: s,
}) => {
  const lastName = "Anulowany";

  const form = await s.app.prepareTeacher(
    lastName,
    s.email,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  await addNewTeacherSubjectLevel(page, form, "Matematyka", "SP");

  await expect(newTeacherSchoolRow(form, TEST_SCHOOL.name)).toHaveCount(1);

  /*
   * Rezygnujemy z całego formularza.
   */
  await newTeacherCancelButton(form).click();

  await expect(form).toHaveCount(0);

  /*
   * =====================================================
   * NAUCZYCIEL NIE POWSTAŁ
   * =====================================================
   */

  await s.app.openPanel("teacher");

  await s.app.searchMissing("teacher", "Email", s.email);

  /*
   * =====================================================
   * NIE POWSTAŁA RELACJA ZE SZKOŁĄ
   * =====================================================
   */

  await s.app.openPanel("school", TEST_SCHOOL.id);

  const teachers = page.getByRole("tabpanel", {
    name: "Nauczyciele",
    exact: true,
  });

  await expect(
    teachers.getByRole("row").filter({
      hasText: lastName,
    }),
  ).toHaveCount(0);
});
