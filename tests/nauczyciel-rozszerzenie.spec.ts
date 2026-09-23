import { test, expect } from "./support/shared-school";
import { typeValue } from "./support/octopus";

test("EDIT-03: zapis nazwiska jest trwały i widoczny w historii @teacher @edit", async ({
  page,
  scenario: s,
  school,
}) => {
  const teacherId = await s.createTeacher(school.id, school.name);
  // Edycja nazwiska dopuszcza litery i łącznik; identyfikujemy rekord przez ID.
  const lastName = "Nowak";
  await s.record("editedLastName", lastName);
  await test.step("Zmień wyłącznie nazwisko i zapisz", async () => {
    await page.getByRole("button", { name: "Edycja danych", exact: true }).click();
    const form = s.app.dialog("Edycja danych podstawowych");
    await expect(form.locator("#lastName")).toHaveValue(s.id);
    await typeValue(form.locator("#lastName"), lastName);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(s.app.detail("lastName")).toHaveValue(lastName);
  });
  await test.step("Otwórz ponownie; sprawdź dane, relację i historię", async () => {
    await s.app.openPanel("teacher", teacherId);
    await expect(s.app.detail("lastName")).toHaveValue(lastName);
    await expect(s.app.detail("firstName")).toHaveValue("Testowy");
    await expect(s.app.detail("email")).toHaveValue(s.email);
    await expect(page.getByRole("row").filter({ hasText: school.name })).toHaveCount(1);
    await page.getByRole("tab", { name: "Historia zmian", exact: true }).click();
    const history = page.getByRole("tabpanel", { name: "Historia zmian", exact: true });
    const edit = history
      .getByRole("row")
      .filter({ has: page.getByRole("gridcell", { name: "Nazwisko", exact: true }) })
      .filter({ has: page.getByRole("gridcell", { name: lastName, exact: true }) })
      .filter({ has: page.getByRole("gridcell", { name: "Edycja danych", exact: true }) });
    await expect(edit).toHaveCount(1);
    await expect(edit).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    await expect(edit.getByRole("gridcell").nth(2)).not.toHaveText("");
  });
});

for (const kind of ["email", "phone"] as const) {
  test(`TEA-04: niepoprawny ${kind === "email" ? "e-mail" : "telefon"} blokuje zapis nauczyciela @teacher @validation`, async ({
    page,
    scenario: s,
    school,
  }) => {
    const form = await s.app.prepareTeacher(
      s.id,
      kind === "email" ? "invalid-email" : s.email,
      school.id,
      school.name,
    );
    await test.step("Sprawdź błędne pole i komunikat przy próbie zapisu", async () => {
      const field =
        kind === "email"
          ? form
              .locator(".new-teacher__personal-input")
              .filter({ has: page.getByText("E-mail", { exact: true }) })
              .locator("input")
          : form.getByPlaceholder("___-___-___", { exact: true });
      if (kind === "phone") {
        await field.fill("123");
        await field.press("Tab");
      }
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await form.getByRole("button", { name: "Zapisz", exact: true }).click();
      await expect(
        form.getByText(
          kind === "email" ? "Wprowadź poprawny adres E-Mail" : "Wprowadź poprawny numer telefonu",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(form).toBeVisible();
      await expect(page).toHaveURL(/\/teacher\/teacher-panel$/);
    });
    await test.step("Po anulowaniu potwierdź brak utworzonego rekordu", async () => {
      await form.getByRole("button", { name: "Anuluj", exact: true }).click();
      await expect(form).toHaveCount(0);
      await s.app.searchMissing("teacher", "Nazwisko", s.id);
    });
  });
}

for (const criterion of ["Email", "Nazwisko"] as const) {
  test(`FIND-05: wyszukiwanie nauczyciela — ${criterion} @teacher @search`, async ({
    page,
    scenario: s,
    school,
  }) => {
    const teacherId = await s.createTeacher(school.id, school.name);
    await s.app.openPanel("teacher");
    const search = await s.app.openSearch("teacher");
    await typeValue(s.app.field(search, criterion), criterion === "Email" ? s.email : s.id);
    await search.getByRole("button", { name: "Szukaj", exact: true }).click();
    await expect(search).toHaveCount(0);
    const results = s.app.results("teacher");
    // Własna unikalna wartość: oczekujemy dokładnie jednego wyniku i właściwego ID.
    await expect(results.getByRole("row").filter({ has: page.getByRole("gridcell") })).toHaveCount(
      1,
    );
    const row = results
      .getByRole("row")
      .filter({ has: page.getByRole("gridcell", { name: teacherId, exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(s.id);
    await expect(page.getByRole("heading", { name: "Rekordów: 1", exact: true })).toBeVisible();
    await row.click();
    await expect(s.app.detail("lastName")).toHaveValue(s.id);
    await expect(s.app.detail("email")).toHaveValue(s.email);
    await expect(page).toHaveURL(new RegExp(`/teacher/teacher-panel/${teacherId}$`));
  });
}

test("REL-02: druga szkoła zachowuje pierwszą relację i pokazuje nauczyciela w obu szkołach @teacher @relation", async ({
  page,
  scenario: s,
  school,
}) => {
  const secondId = await s.createSchool();
  await s.record("secondSchoolId", secondId);
  const teacherId = await s.createTeacher(school.id, school.name);
  await test.step("Dodaj drugą szkołę istniejącemu nauczycielowi", async () => {
    await s.app.attachSchool(page.locator("body"), secondId, s.schoolName);
    await expect(page.getByRole("row").filter({ hasText: school.name })).toHaveCount(1);
  });
  await test.step("Potwierdź trwałość dokładnie dwóch powiązań", async () => {
    await s.app.openPanel("teacher", teacherId);
    const schools = page
      .getByRole("treegrid")
      .filter({ has: page.getByRole("columnheader", { name: "Nazwa szkoły", exact: true }) });
    await expect(schools.getByRole("row").filter({ has: page.getByRole("gridcell") })).toHaveCount(
      2,
    );
    for (const id of [school.id, secondId]) {
      await expect(schools.getByRole("gridcell", { name: id, exact: true })).toHaveCount(1);
    }
  });
  await test.step("Znajdź tego samego nauczyciela w obu kartotekach szkół", async () => {
    for (const id of [school.id, secondId]) {
      await s.app.openPanel("school", id);
      const teachers = page.getByRole("tabpanel", { name: "Nauczyciele", exact: true });
      const row = teachers
        .getByRole("row")
        .filter({ has: page.getByRole("gridcell", { name: teacherId, exact: true }) });
      await expect(row).toHaveCount(1);
      await expect(row.getByRole("gridcell", { name: s.id, exact: true })).toBeVisible();
      await expect(row.getByRole("gridcell", { name: "Testowy", exact: true })).toBeVisible();
    }
  });
});
