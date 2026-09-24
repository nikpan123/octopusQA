import { test, expect } from "./support/club-fixtures";
import {
  cancelClubForm,
  confirmationRow,
  confirmations,
  disableTeacherEmail,
  openNewClubForm,
  openNewSupportingClubForm,
  ownClass,
  saveClubForm,
  selectSchool,
  selectSchoolYear,
  supportingSubject,
} from "./support/club";
import { prepareClubTeacher } from "./support/club-scenario";

test.describe.configure({ mode: "parallel" });

/*
 * =========================================================
 * UWAGA O ZAKRESIE TEGO PLIKU
 * =========================================================
 *
 * Ten plik pokrywa punkty F.24 i F.26 z raportu gap analysis.
 * Dwa pozostałe punkty z tej samej grupy (klubowiczostwo) NIE mają
 * tu odpowiadających testów, celowo:
 *
 *  - Punkt F.25 (komunikaty błędów klubowiczostwa zawierają numeryczne
 *    ID, co czyni je kruchymi) jest rekomendacją na poziomie
 *    dokumentacji/refaktoryzacji istniejących 70+ testów w
 *    klubowiczostwo-nauczyciela.spec.ts, a nie brakującym scenariuszem
 *    testowym. Przepisanie tych asercji bez możliwości uruchomienia
 *    testów byłoby nieodpowiedzialne - mogłoby po cichu zepsuć
 *    pokrycie, którego nikt by nie zweryfikował przed scaleniem.
 *
 *  - Punkt F.27 (usunięcie szkoły/nauczyciela z aktywnymi
 *    potwierdzeniami klubowymi) nie ma odpowiadającej funkcji w tym
 *    repozytorium - nie istnieje żadna funkcja "usuń szkołę" ani
 *    "usuń nauczyciela" (support/octopus.ts, support/school-edit.ts,
 *    support/teacher-edit.ts nie eksportują niczego takiego, a UI nie
 *    ma widocznego dla testów przycisku usuwania tych encji - w
 *    odróżnieniu od usuwania POTWIERDZENIA klubowego, które istnieje
 *    i jest już pokryte przez CLUB-11/39/40). Napisanie testu na
 *    nieistniejącą funkcję oznaczałoby fabrykowanie scenariusza, więc
 *    ten punkt pozostaje zgłoszony jako brak funkcjonalności do
 *    potwierdzenia z zespołem, a nie jako luka testowa.
 */

/*
 * =========================================================
 * KLUB-DOD-01
 * PRZEDMIOT SPOZA WEWNĘTRZNEJ LISTY SUPPORTING_SUBJECTS
 * =========================================================
 *
 * Gap analysis, punkt F.26: lista przedmiotów formularza wspomagającego
 * pochodzi z zamkniętej, wewnętrznej stałej SUPPORTING_SUBJECTS
 * (support/club.ts: Język polski, Matematyka, Historia, Fizyka,
 * Biologia, Edukacja wczesnoszkolna, Przyroda, Geografia) - a nie z
 * żadnego słownika przedmiotów szkoły. Formularz renderuje checkboxy
 * wyłącznie dla przedmiotów z tej listy, więc nie da się przez UI
 * "wybrać" przedmiotu spoza niej - ten test dokumentuje wprost, które
 * potencjalnie istotne przedmioty są nieobecne, zamiast zakładać, że
 * nikt tego nie zauważy.
 */

test("KLUB-DOD-01: formularz wspomagający nie oferuje Chemii ani innych przedmiotów spoza SUPPORTING_SUBJECTS @teacher @club @supporting @edge-input", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);
  const { form } = await openNewSupportingClubForm(page);

  const candidateSubjects = ["Chemia", "Wychowanie fizyczne", "Plastyka", "Muzyka", "Informatyka"];
  for (const subject of candidateSubjects) {
    const present = (await supportingSubject(form, subject).count()) > 0;
    console.log(
      `KLUB-DOD-01: przedmiot "${subject}" ${present ? "JEST" : "NIE JEST"} dostępny w ` +
        "formularzu wspomagającym.",
    );
  }

  // Dokumentujemy BIEŻĄCY stan (Chemia nieobecna). Jeśli to się zmieni,
  // test celowo się wywróci - ma to wymusić świadomą aktualizację, a nie
  // ciche rozjechanie się stałej SUPPORTING_SUBJECTS z realnymi
  // potrzebami biznesu (np. nauczycielami chemii korzystającymi z
  // formularza wspomagającego gdzie indziej w systemie).
  await expect(
    supportingSubject(form, "Chemia"),
    "Chemia pojawiła się na liście przedmiotów formularza wspomagającego - stała " +
      "SUPPORTING_SUBJECTS w support/club.ts została rozszerzona. Zaktualizuj ten test i " +
      "raport gap analysis (punkt F.26), jeśli to zamierzona zmiana.",
  ).toHaveCount(0);

  await cancelClubForm(form);
});

/*
 * =========================================================
 * KLUB-DOD-02
 * POTWIERDZENIE DLA STARSZEGO ROKU DODANE PO BIEŻĄCYM
 * =========================================================
 *
 * Gap analysis, punkt F.24. CLUB-29 (istniejący test) zapisuje
 * potwierdzenie dla STARSZEGO roku jako pierwsze, a dla BIEŻĄCEGO
 * jako drugie - czyli w naturalnym, chronologicznym porządku. Reguła
 * porządkująca lata nigdy nie została przetestowana w odwrotnej
 * kolejności: co się stanie, gdy potwierdzenie dla roku BIEŻĄCEGO już
 * istnieje, a użytkownik dopiero potem chce dodać potwierdzenie dla
 * roku STARSZEGO tego samego przedmiotu, poziomu i szkoły?
 */

test("KLUB-DOD-02: potwierdzenie dla starszego roku szkolnego dodane po potwierdzeniu dla roku bieżącego @teacher @club @school-year @edge-input", async ({
  page,
  scenario: s,
}) => {
  await prepareClubTeacher(page, s);

  const { form: currentForm, schoolYear: currentSchoolYear } = await openNewClubForm(page);
  await selectSchool(currentForm, s.schoolName);
  await ownClass(currentForm, "5").check();
  await disableTeacherEmail(currentForm);
  const currentConfirmationId = await saveClubForm(page, currentForm);
  await s.record("currentConfirmationId", currentConfirmationId);
  await s.record("schoolYear", currentSchoolYear);

  const previousSchoolYear = `${Number(currentSchoolYear.slice(0, 4)) - 1}/${Number(
    currentSchoolYear.slice(0, 4),
  )}`;

  const { form: previousForm } = await openNewClubForm(page);
  await selectSchoolYear(previousForm, previousSchoolYear);
  await selectSchool(previousForm, s.schoolName);
  await ownClass(previousForm, "4").check();
  await disableTeacherEmail(previousForm);

  await previousForm.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(previousForm).toHaveCount(0);

  const newerConfirmationWarning = page.locator("mat-dialog-container").filter({
    hasText: "istnieje nowsze potwierdzenie",
  });
  if (
    await newerConfirmationWarning
      .waitFor({ state: "visible", timeout: 3_000 })
      .then(() => true)
      .catch(() => false)
  ) {
    await newerConfirmationWarning.getByRole("button", { name: "OK", exact: true }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(confirmations(page)).toBeVisible();
    await expect(confirmationRow(page, currentConfirmationId)).toContainText(currentSchoolYear);
    await s.record("previousYearAfterCurrentResult", "BLOCKED_BY_NEWER_CONFIRMATION");
    return;
  }

  console.log(
    "KLUB-DOD-02: dodanie potwierdzenia dla STARSZEGO roku PO roku BIEŻĄCYM zostało " +
      "zaakceptowane - tak samo jak w odwrotnej kolejności udokumentowanej w CLUB-29. Brak " +
      "reguły zależnej od kolejności tworzenia; to udokumentowanie bieżącego zachowania, " +
      "nie stwierdzony błąd.",
  );

  const mathRows = confirmations(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "Matematyka", exact: true }) });
  await expect(mathRows).toHaveCount(2);

  const confirmationIds: string[] = [];
  for (let index = 0; index < (await mathRows.count()); index += 1) {
    confirmationIds.push((await mathRows.nth(index).getByRole("cell").nth(1).innerText()).trim());
  }
  const previousConfirmationId = confirmationIds.find((id) => id !== currentConfirmationId) ?? "";
  expect(previousConfirmationId).toMatch(/^\d+$/);

  await expect(confirmationRow(page, previousConfirmationId)).toContainText(previousSchoolYear);
  await expect(confirmationRow(page, currentConfirmationId)).toContainText(currentSchoolYear);

  await s.record("previousConfirmationId", previousConfirmationId);
  await s.record("previousYearAfterCurrentResult", "ACCEPTED");
});
