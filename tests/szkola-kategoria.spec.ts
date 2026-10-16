import { test as base, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import {
  CATEGORY_CASES,
  SORT_CASES,
  EDIT_CASE,
  EDIT_D_CASE,
  categorySortPrefix,
  ensureCategorySchool,
} from "./support/school-category-data";
import {
  categoryInput,
  expectNpcSchoolIdentity,
  studentCountInput,
  categoryColumn,
  searchCategorySchools,
  expectCategoryInSearch,
  setStudentCount,
  type SchoolCategory,
  type CategorySchool,
} from "./support/school-category";
import { openSchoolSioForm, schoolSioInput, cancelSchoolEdit } from "./support/school-edit";
import { verifyCategorySort, type ExpectedCategoryRow } from "./support/category-sort-evidence";

const test = base.extend<{ categoryEditSchool: CategorySchool }>({
  categoryEditSchool: [
    async ({ page }, use, testInfo) => {
      const app = new Octopus(page);
      const definition = testInfo.title.startsWith("CAT-34:") ? EDIT_D_CASE : EDIT_CASE;
      const school =
        await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
          ensureCategorySchool(page, app, definition));
      try {
        await use(school);
      } finally {
        // Sprzątanie fixture ma własny limit, niezależny od czasu zużytego przez test.
        await setStudentCount(app, school, String(definition.count));
        await app.openPanel("school", school.id);
        await test.step("Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: String(definition.count)", async () =>
          expect(studentCountInput(page)).toHaveValue(String(definition.count)));
      }
    },
    { timeout: 120000 },
  ],
});

test.describe("Kategoria szkoły", () => {
  // Fixture są stabilne, a edycje korzystają z osobnej szkoły i odtwarzają liczbę uczniów.
  test("CAT-01: tabela wyszukiwania zawiera kolumnę Kategoria @school @category @smoke", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const school =
      await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
        ensureCategorySchool(page, app, CATEGORY_CASES[3]));
    const results = await searchCategorySchools(app, { id: school.id });
    const { header } = await categoryColumn(results);
    await test.step("Sprawdzenie: widoczność elementu — header", async () =>
      expect(header).toBeVisible());
  });

  test("CAT-02: Kategoria znajduje się bezpośrednio po Poziom @school @category @layout", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const school =
      await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
        ensureCategorySchool(page, app, CATEGORY_CASES[3]));
    const results = await searchCategorySchools(app, { id: school.id });
    const { header } = await categoryColumn(results);
    const level = results.getByRole("columnheader", { name: "Poziom", exact: true });
    await test.step("Sprawdzenie: liczba elementów w widoku — level; oczekiwane: 1", async () =>
      expect(level).toHaveCount(1));
    const categoryIndex = Number(await header.getAttribute("aria-colindex"));
    const levelIndex = Number(await level.getAttribute("aria-colindex"));
    await test.step("Sprawdzenie: wartość powyżej granicy — levelIndex; granica: 0", async () => {
      expect(levelIndex).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: zgodność wartości — categoryIndex; oczekiwane: levelIndex + 1", async () => {
      expect(categoryIndex).toBe(levelIndex + 1);
    });
  });

  test("CAT-03: kategoria na profilu jest pod poziomem szkoły i tylko do odczytu @school @category @readonly @layout", async ({
    page,
  }) => {
    const app = new Octopus(page);
    await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
      ensureCategorySchool(page, app, CATEGORY_CASES[3]));
    await test.step("Sprawdzenie: widoczność elementu — categoryInput(page)", async () =>
      expect(categoryInput(page)).toBeVisible());
    await test.step("Sprawdzenie: zablokowanie działania — categoryInput(page)", async () =>
      expect(categoryInput(page)).toBeDisabled());
    await test.step('Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: "C"', async () =>
      expect(categoryInput(page)).toHaveValue("C"));
    const level = app.detail("level");
    await test.step("Sprawdzenie: widoczność elementu — level", async () =>
      expect(level).toBeVisible());
    const levelBox = await level.boundingBox();
    const categoryBox = await categoryInput(page).boundingBox();
    await test.step("Sprawdzenie: negacja — toBeNull — levelBox", async () => {
      expect(levelBox).not.toBeNull();
    });
    await test.step("Sprawdzenie: negacja — toBeNull — categoryBox", async () => {
      expect(categoryBox).not.toBeNull();
    });
    await test.step("Sprawdzenie: wartość nie mniejsza od granicy — categoryBox!.y; granica: levelBox!.y + levelBox!.height", async () => {
      expect(categoryBox!.y).toBeGreaterThanOrEqual(levelBox!.y + levelBox!.height);
    });
  });

  for (const sample of CATEGORY_CASES) {
    test(`${sample.id}: ${sample.type}, ${sample.count ?? "brak danych"} uczniów daje kategorię ${sample.category} @school @category @boundaries`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const school =
        await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
          ensureCategorySchool(page, app, sample));
      await test.step("Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: sample.category", async () =>
        expect(categoryInput(page)).toHaveValue(sample.category));
      if (sample.type === "Szkoła NPC")
        await test.step("Sprawdzenie: expectNpcSchoolIdentity", async () =>
          expectNpcSchoolIdentity(app));
      await test.step("Sprawdzenie: expectCategoryInSearch", async () =>
        expectCategoryInSearch(app, school, sample.category));
      await app.openPanel("school", school.id);
      await test.step("Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: sample.category", async () =>
        expect(categoryInput(page)).toHaveValue(sample.category));
    });
  }

  for (const sorting of [
    { id: "CAT-23", direction: "ascending" },
    { id: "CAT-24", direction: "descending" },
  ] as const) {
    test(`${sorting.id}: Kategoria sortuje alfabetycznie ${sorting.direction} @school @category @sort @redmine-37203`, async ({
      page,
    }, info) => {
      info.annotations.push({
        type: "redmine",
        description: "https://redmine.gwo.pl/issues/37203",
      });
      test.setTimeout(360000);
      const app = new Octopus(page);
      const schools: CategorySchool[] = [];
      for (const definition of SORT_CASES)
        schools.push(
          await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
            ensureCategorySchool(page, app, definition)),
        );
      const results = await searchCategorySchools(app, { name: categorySortPrefix });
      const { header, column } = await categoryColumn(results);
      const expected: ExpectedCategoryRow[] = schools.map((school, index) => ({
        id: school.id,
        category: SORT_CASES[index].category,
      }));
      expected.sort((a, b) => a.category.localeCompare(b.category));
      if (sorting.direction === "descending") expected.reverse();
      await test.step("Sprawdzenie kolejności kategorii i odpowiadających im ID; zapis dowodów", () =>
        verifyCategorySort(
          page,
          results,
          header,
          column,
          sorting.direction,
          expected,
          info,
          sorting.id,
        ));
    });
  }

  test("CAT-25: przełączanie sortowania zmienia kolejność bez zmiany szkół i kategorii @school @category @sort @redmine-37203", async ({
    page,
  }, info) => {
    info.annotations.push({ type: "redmine", description: "https://redmine.gwo.pl/issues/37203" });
    test.setTimeout(360000);
    const app = new Octopus(page);
    const schools: CategorySchool[] = [];
    for (const definition of SORT_CASES)
      schools.push(
        await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
          ensureCategorySchool(page, app, definition)),
      );
    const results = await searchCategorySchools(app, { name: categorySortPrefix });
    const { header, column } = await categoryColumn(results);
    const ascending: ExpectedCategoryRow[] = schools
      .map((school, index) => ({ id: school.id, category: SORT_CASES[index].category }))
      .sort((a, b) => a.category.localeCompare(b.category));
    const directions = ["ascending", "descending", "ascending", "descending"] as const;
    for (const [index, direction] of directions.entries()) {
      const expected = direction === "ascending" ? ascending : [...ascending].reverse();
      await test.step(`Przełączenie ${index + 1}: ${direction}, kontrola pełnych wierszy i dowody`, () =>
        verifyCategorySort(
          page,
          results,
          header,
          column,
          direction,
          expected,
          info,
          `CAT-25-${index + 1}`,
        ));
    }
  });

  for (const change of [
    { id: "CAT-26", before: "100", after: "101", category: "B" },
    { id: "CAT-27", before: "400", after: "401", category: "A" },
    { id: "CAT-28", before: "101", after: "100", category: "C" },
    { id: "CAT-29", before: "401", after: "0", category: "A" },
    { id: "CAT-30", before: "100", after: "", category: "A" },
    { id: "CAT-31", before: "0", after: "1", category: "C" },
    { id: "CAT-32", before: "401", after: "400", category: "B" },
  ]) {
    test(`${change.id}: zmiana liczby uczniów ${change.before} → ${change.after || "brak danych"} aktualizuje kategorię @school @category @edit`, async ({
      page,
      categoryEditSchool: school,
    }) => {
      const app = new Octopus(page);
      await setStudentCount(app, school, change.before);
      await setStudentCount(app, school, change.after);
      await test.step("Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: change.category", async () =>
        expect(categoryInput(page)).toHaveValue(change.category));
      await test.step("Sprawdzenie: expectCategoryInSearch", async () =>
        expectCategoryInSearch(app, school, change.category as SchoolCategory));
      await app.openPanel("school", school.id);
      await test.step("Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: change.after", async () =>
        expect(studentCountInput(page)).toHaveValue(change.after));
      await test.step("Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: change.category", async () =>
        expect(categoryInput(page)).toHaveValue(change.category));
    });
  }

  test("CAT-33: anulowanie liczby uczniów nie zmienia kategorii @school @category @cancel", async ({
    page,
    categoryEditSchool: school,
  }) => {
    const app = new Octopus(page);
    const form = await openSchoolSioForm(page);
    await schoolSioInput(form, "quantityOfStudents").fill("101");
    await cancelSchoolEdit(form);
    await app.openPanel("school", school.id);
    await test.step('Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: "100"', async () =>
      expect(studentCountInput(page)).toHaveValue("100"));
    await test.step('Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: "C"', async () =>
      expect(categoryInput(page)).toHaveValue("C"));
    await test.step("Sprawdzenie: expectCategoryInSearch", async () =>
      expectCategoryInSearch(app, school, "C"));
  });

  test("CAT-34: zmiana liczby uczniów innej placówki zachowuje D @school @category @edit", async ({
    page,
    categoryEditSchool: school,
  }) => {
    const app = new Octopus(page);
    await setStudentCount(app, school, "1");
    await test.step('Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: "D"', async () =>
      expect(categoryInput(page)).toHaveValue("D"));
    await test.step("Sprawdzenie: expectCategoryInSearch", async () =>
      expectCategoryInSearch(app, school, "D"));
    await app.openPanel("school", school.id);
    await test.step('Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: "1"', async () =>
      expect(studentCountInput(page)).toHaveValue("1"));
    await test.step('Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: "D"', async () =>
      expect(categoryInput(page)).toHaveValue("D"));
  });
});
