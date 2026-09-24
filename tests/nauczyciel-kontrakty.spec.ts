import { test, expect } from "./support/scenario";

import {
  newTeacherConsentCheckbox,
  newTeacherSaveButton,
  newTeacherCancelButton,
  addNewTeacherSubjectLevel,
  openNoSubjectLevelWarning,
  confirmNoSubjectLevelWarning,
  expectContactRequiredWarning,
  closeContactRequiredWarning,
  saveNewTeacherWithSubjectLevel,
} from "./support/teacher-add";
import { registerCreatedTeacher } from "./support/teacher-add-scenario";

import {
  openTeacherRodoEdit,
  teacherRodoCheckbox,
  teacherRodoSourceSelect,
  cancelTeacherRodoEdit,
  expectTeacherRodoOnCard,
  openTeacherEmailEdit,
  openTeacherEmailDeleteConfirmation,
  confirmTeacherEmailDelete,
  openTeacherMinimalRecordWarning,
  confirmTeacherMinimalRecordWarning,
  getSavedTeacherPhones,
  openTeacherHistory,
  expectTeacherRodoHistoryChange,
} from "./support/teacher-edit";

/*
 * =========================================================
 * STAŁA SZKOŁA QA
 * =========================================================
 *
 * Te testy dotyczą kontraktu ADD vs EDIT i sesji/uprawnień,
 * nie tworzenia szkoły. Podobnie jak nauczyciel-dodawanie.spec.ts,
 * korzystamy z istniejącej, stałej szkoły QA zamiast tworzyć nową
 * przy każdym teście.
 */

const TEST_SCHOOL = {
  id: "93391",
  name: "Szkoła QA 1",
} as const;

/*
 * =========================================================
 * CONTRACT-01
 * KASKADA RODO: ADD (brak kaskady) vs EDIT (kaskada)
 * =========================================================
 *
 * Gap analysis, punkt B.4: kaskada E-mail/Telefon -> Marketing
 * jest udokumentowana w kodzie (ADD-06/07 vs EDIT-36/37), ale
 * nigdy nie porównana wprost w jednym teście. Ten test celowo
 * zestawia oba zachowania obok siebie, aby przypadkowe
 * "ujednolicenie" jednego z przepływów zostało wychwycone od razu.
 */

test("CONTRACT-01: kaskada RODO E-mail -> Marketing obowiązuje tylko przy edycji, nie przy dodawaniu @teacher @rodo @contract", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * CZĘŚĆ A: DODAWANIE
   * =====================================================
   */
  const addEmail = `add-${s.email}`;
  const addLastName = `${s.id}-Add`;

  const addForm = await s.app.prepareTeacher(
    addLastName,
    addEmail,
    TEST_SCHOOL.id,
    TEST_SCHOOL.name,
  );

  const addEmailConsent = newTeacherConsentCheckbox(addForm, "E-mail");
  const addMarketingConsent = newTeacherConsentCheckbox(addForm, "Marketing");

  await addEmailConsent.check();
  await expect(addEmailConsent).toBeChecked();

  await expect(
    addMarketingConsent,
    'KONTRAKT ZŁAMANY: przy DODAWANIU nauczyciela zaznaczenie zgody "E-mail" nie powinno ' +
      'automatycznie zaznaczać "Marketing" (patrz ADD-06). Jeśli ta asercja nie przechodzi, ' +
      "formularz dodawania upodobnił się do formularza edycji (patrz EDIT-36) - potwierdź to " +
      "świadomie z biznesem, zanim zmienisz ten test.",
  ).not.toBeChecked();

  await addNewTeacherSubjectLevel(page, addForm, "Matematyka", "SP");
  const addedTeacherId = await saveNewTeacherWithSubjectLevel(page, addForm);
  await registerCreatedTeacher(s, addedTeacherId, { email: addEmail, lastName: addLastName });

  /*
   * =====================================================
   * CZĘŚĆ B: EDYCJA
   * =====================================================
   */
  const editTeacherId = await s.createTeacher(TEST_SCHOOL.id, TEST_SCHOOL.name);

  const editDialog = await openTeacherRodoEdit(page);
  const editEmailConsent = teacherRodoCheckbox(editDialog, "E-mail");
  const editMarketingConsent = teacherRodoCheckbox(editDialog, "Marketing");

  await editEmailConsent.check();
  await expect(editEmailConsent).toBeChecked();

  await expect(
    editMarketingConsent,
    'KONTRAKT ZŁAMANY: przy EDYCJI nauczyciela zaznaczenie zgody "E-mail" powinno automatycznie ' +
      'wymuszać zaznaczenie "Marketing" (patrz EDIT-36). Jeśli ta asercja nie przechodzi, kaskada ' +
      "RODO przy edycji została usunięta lub zmieniona - potwierdź to świadomie z biznesem.",
  ).toBeChecked();

  await cancelTeacherRodoEdit(editDialog);
  await s.record("contractEditTeacherId", editTeacherId);
});

/*
 * =========================================================
 * CONTRACT-02
 * REKORD MINIMALNY: ADD (twardo blokowany) vs EDIT (dopuszczalny)
 * =========================================================
 *
 * Gap analysis, punkt B.5: przy dodawaniu nauczyciela bez e-maila
 * i telefonu zapis jest całkowicie zablokowany (ADD-18). Przy
 * edycji istniejącego rekordu da się dojść do tego samego stanu
 * po dwukrotnym potwierdzeniu (EDIT-22/23). Nie jest potwierdzone
 * biznesowo, czy to zamierzona niespójność - ten test ją
 * dokumentuje, żeby zmiana w dowolną stronę była świadoma.
 */

test("CONTRACT-02: brak jedynego kontaktu jest blokowany przy dodawaniu, ale osiągalny przy edycji @teacher @contract", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * CZĘŚĆ A: DODAWANIE
   * =====================================================
   */
  const addLastName = `${s.id}-Kontrakt`;
  const addForm = await s.app.prepareTeacher(addLastName, "", TEST_SCHOOL.id, TEST_SCHOOL.name);

  await newTeacherSaveButton(addForm).click();

  const noSubjectWarning = await openNoSubjectLevelWarning(page);
  await confirmNoSubjectLevelWarning(noSubjectWarning);

  const contactWarning = await expectContactRequiredWarning(page);
  await closeContactRequiredWarning(contactWarning);

  await expect(
    addForm,
    "KONTRAKT: przy DODAWANIU formularz musi pozostać otwarty, gdy brakuje zarówno e-maila, " +
      "jak i telefonu (patrz ADD-18).",
  ).toBeVisible();

  await newTeacherCancelButton(addForm).click();
  await s.app.openPanel("teacher");
  await s.app.searchMissing("teacher", "Nazwisko", addLastName);

  /*
   * =====================================================
   * CZĘŚĆ B: EDYCJA
   * =====================================================
   *
   * UWAGA BIZNESOWA (patrz raport gap analysis, punkt B.5):
   * ta niespójność między ADD i EDIT nie została jeszcze
   * potwierdzona jako zamierzona. Jeśli poniższa część zacznie
   * się wywracać, oznacza to, że regułę edycji zaostrzono do
   * poziomu reguły dodawania - potwierdź to z biznesem, zanim
   * zaktualizujesz ten test.
   */
  const editTeacherId = await s.createTeacher(TEST_SCHOOL.id, TEST_SCHOOL.name);
  expect(await getSavedTeacherPhones(page)).toEqual([]);

  const emailDialog = await openTeacherEmailEdit(page);
  const emailDeleteDialog = await openTeacherEmailDeleteConfirmation(page, emailDialog);
  await confirmTeacherEmailDelete(emailDeleteDialog);

  const minimalRecordWarning = await openTeacherMinimalRecordWarning(page);
  await confirmTeacherMinimalRecordWarning(minimalRecordWarning);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(new RegExp(`/teacher/teacher-panel/${editTeacherId}$`));

  await expect(
    s.app.detail("email"),
    "KONTRAKT: przy EDYCJI, po dwukrotnym potwierdzeniu, nauczyciel MOŻE pozostać bez żadnego " +
      "kontaktu (patrz EDIT-23). To udokumentowana, ale niepotwierdzona biznesowo niespójność " +
      "względem reguły dodawania (ADD-18).",
  ).toHaveValue("");
  expect(await getSavedTeacherPhones(page)).toEqual([]);
});

/*
 * =========================================================
 * CONTRACT-03
 * WYJĄTEK "KARTA LS" OD WYMOGU MIN. JEDNEJ ZGODY RODO
 * =========================================================
 *
 * Gap analysis, punkt B.6: komentarz przy EDIT-41 sugeruje, że
 * źródło "Karta LS" jest zwolnione z wymogu minimum jednej zgody
 * RODO, ale nigdzie nie ma na to pozytywnego testu. Ten test
 * sprawdza to wprost.
 */

test('CONTRACT-03: źródło "Karta LS" zwalnia z wymogu minimum jednej zgody RODO @teacher @edit @rodo', async ({
  page,
  scenario: s,
}) => {
  const teacherId = await s.createTeacher(TEST_SCHOOL.id, TEST_SCHOOL.name);

  const dialog = await openTeacherRodoEdit(page);

  await expect(teacherRodoCheckbox(dialog, "Marketing")).not.toBeChecked();
  await expect(teacherRodoCheckbox(dialog, "E-mail")).not.toBeChecked();
  await expect(teacherRodoCheckbox(dialog, "Telefon")).not.toBeChecked();

  const sourceSelect = teacherRodoSourceSelect(dialog);
  await sourceSelect.click();
  await page.getByRole("option", { name: "Karta LS", exact: true }).click();
  await expect(sourceSelect).toContainText("Karta LS");

  await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

  await expect(
    dialog,
    'KONTRAKT: przy źródle "Karta LS" zapis bez żadnej zgody RODO nie powinien być blokowany ' +
      'ostrzeżeniem "Dla źródeł danych innych niż karta LS..." (patrz komentarz w EDIT-41). Jeśli ' +
      "dialog nadal jest widoczny, wyjątek dla Karty LS albo został usunięty, albo nigdy nie " +
      "istniał tak jak zakładano - potwierdź to z biznesem przed zmianą tego testu.",
  ).toHaveCount(0);

  await s.app.openPanel("teacher", teacherId);
  await expectTeacherRodoOnCard(page, { marketing: false, email: false, phone: false });

  const history = await openTeacherHistory(page);
  await expectTeacherRodoHistoryChange(page, history, "Zgoda Marketing", "Nie");
});
