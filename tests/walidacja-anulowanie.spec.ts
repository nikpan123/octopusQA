import { test, expect } from "./support/shared-school";
import { typeValue } from "./support/octopus";

for (const missing of ["imię", "nazwisko", "szkoła", "kontakt"] as const) {
  test(`TEA-02: brak pola ${missing} blokuje zapis nauczyciela @validation`, async ({
    page,
    scenario: s,
    school,
  }) => {
    const schoolId = missing === "szkoła" ? undefined : school.id;
    const form = await s.app.prepareTeacher(
      s.id,
      missing === "kontakt" ? "" : s.email,
      schoolId,
      schoolId ? school.name : undefined,
    );
    if (missing === "imię") await typeValue(s.app.field(form, "*Imię"), "");
    if (missing === "nazwisko") await typeValue(s.app.field(form, "*Nazwisko"), "");
    await test.step("Spróbuj zapisać i sprawdź wyjaśnienie odmowy", async () => {
      await form.getByRole("button", { name: "Zapisz", exact: true }).click();
      if (missing === "kontakt") {
        const warning = s.app.dialog("Uwaga");
        await expect(warning).toContainText("Nie dodałeś przedmioto-poziomu");
        await warning.getByRole("button", { name: "Tak", exact: true }).click();
        const contactError = page.locator("mat-dialog-container").filter({
          hasText: "Email lub numer telefonu jest obowiązkowym polem",
        });
        await expect(contactError).toBeVisible();
        await contactError.getByRole("button", { name: "OK", exact: true }).click();
      } else {
        await expect(form).toContainText("Należy uzupełnić nazwisko, imię i wybrać szkołę");
      }
      await expect(form).toBeVisible();
      await expect(page).toHaveURL(/\/teacher\/teacher-panel$/);
    });
    await test.step("Sprawdź w wyszukiwarce, że rekord nie powstał", async () => {
      await form.getByRole("button", { name: "Anuluj", exact: true }).click();
      await expect(form).toHaveCount(0);
      await s.app.openPanel("teacher");
      await s.app.searchMissing(
        "teacher",
        missing === "kontakt" ? "Nazwisko" : "Email",
        missing === "kontakt" ? s.id : s.email,
      );
    });
  });
}

test("TEA-03: anulowanie kompletnego formularza nie tworzy nauczyciela @cancel", async ({
  scenario: s,
  school,
}) => {
  const form = await s.app.prepareTeacher(s.id, s.email, school.id, school.name);
  await form.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(form).toHaveCount(0);
  await s.app.openPanel("teacher");
  await s.app.searchMissing("teacher", "Email", s.email);
});

test("SCH-02: anulowanie kompletnego formularza nie tworzy szkoły @cancel", async ({
  scenario: s,
}) => {
  const form = await s.app.prepareSchool(s.schoolName, String(Date.now()));
  await form.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(form).toHaveCount(0);
  await s.app.openPanel("school");
  await s.app.searchMissing("school", "Nazwa szkoły", s.schoolName);
});

test("EDIT-02: anulowanie edycji zachowuje dane i historię @cancel", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);
  await s.app.openPanel("teacher", teacherId);
  // Dane kontaktowe doczytują się niezależnie od ID i przycisku edycji.
  // Nie zapisuj pustego stanu ładowania jako wartości oczekiwanej.
  await expect(s.app.detail("firstName")).toHaveValue("Testowy");
  await expect(s.app.detail("lastName")).toHaveValue(s.id);
  await expect(s.app.detail("email")).toHaveValue(s.email);
  const before = {
    firstName: await s.app.detail("firstName").inputValue(),
    lastName: await s.app.detail("lastName").inputValue(),
    email: await s.app.detail("email").inputValue(),
  };
  await page.getByRole("tab", { name: "Historia zmian", exact: true }).click();
  const history = page.getByRole("tabpanel", { name: "Historia zmian", exact: true });
  await expect(history.getByRole("gridcell", { name: s.email, exact: true })).toBeVisible();
  const beforeHistory = await history.getByRole("row").allTextContents();
  await page.getByRole("button", { name: "Edycja danych", exact: true }).click();
  const form = s.app.dialog("Edycja danych podstawowych");
  await typeValue(form.locator('input[id="firstName"]'), "Adam");
  await typeValue(form.locator('input[id="lastName"]'), "Anulowany");
  await form.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(form).toHaveCount(0);
  await s.app.openPanel("teacher", teacherId);
  for (const [field, value] of Object.entries(before))
    await expect(s.app.detail(field)).toHaveValue(value);
  await expect(page.getByRole("row").filter({ hasText: school.name })).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "Testowy", exact: true })).toBeChecked();
  await page.getByRole("tab", { name: "Historia zmian", exact: true }).click();
  await expect(history.getByRole("row")).toHaveText(beforeHistory);
});

for (const kind of ["teacher", "school"] as const) {
  test(`FIND-04: brak wyników usuwa poprzednią listę — ${kind} @search`, async ({
    page,
    scenario: s,
    school,
  }) => {
    if (kind === "teacher") {
      const teacherId = await s.createTeacher(school.id, school.name);
      await s.app.searchTeacher(teacherId);
    } else {
      await s.app.searchSchool(school.name, school.id);
    }
    await expect(s.app.results(kind).getByRole("gridcell")).not.toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Rekordów: 1", exact: true })).toBeVisible();
    await s.app.searchMissing(
      kind,
      kind === "teacher" ? "Email" : "Nazwa szkoły",
      kind === "teacher" ? `absent_${s.email}` : `ABSENT_${s.id}`,
    );
    await expect(page.getByRole("heading", { name: "Rekordów: 1", exact: true })).toHaveCount(0);
  });
}
