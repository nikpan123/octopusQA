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
  categorySortRows,
  type SchoolCategory,
  type CategorySchool,
} from "./support/school-category";
import { openSchoolSioForm, schoolSioInput, cancelSchoolEdit } from "./support/school-edit";

const test = base.extend<{ categoryEditSchool: CategorySchool }>({
  categoryEditSchool: [
    async ({ page }, use, testInfo) => {
      const app = new Octopus(page);
      const definition = testInfo.title.startsWith("CAT-34:") ? EDIT_D_CASE : EDIT_CASE;
      const school = await ensureCategorySchool(page, app, definition);
      try {
        await use(school);
      } finally {
        // Sprzątanie fixture ma własny limit, niezależny od czasu zużytego przez test.
        await setStudentCount(app, school, String(definition.count));
        await app.openPanel("school", school.id);
        await expect(studentCountInput(page)).toHaveValue(String(definition.count));
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
    const school = await ensureCategorySchool(page, app, CATEGORY_CASES[3]);
    const results = await searchCategorySchools(app, { id: school.id });
    const { header } = await categoryColumn(results);
    await expect(header).toBeVisible();
  });

  test("CAT-02: Kategoria znajduje się bezpośrednio po Poziom @school @category @layout", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const school = await ensureCategorySchool(page, app, CATEGORY_CASES[3]);
    const results = await searchCategorySchools(app, { id: school.id });
    const { header } = await categoryColumn(results);
    const level = results.getByRole("columnheader", { name: "Poziom", exact: true });
    await expect(level).toHaveCount(1);
    const categoryIndex = Number(await header.getAttribute("aria-colindex"));
    const levelIndex = Number(await level.getAttribute("aria-colindex"));
    expect(levelIndex).toBeGreaterThan(0);
    expect(categoryIndex).toBe(levelIndex + 1);
  });

  test("CAT-03: kategoria na profilu jest pod poziomem szkoły i tylko do odczytu @school @category @readonly @layout", async ({
    page,
  }) => {
    const app = new Octopus(page);
    await ensureCategorySchool(page, app, CATEGORY_CASES[3]);
    await expect(categoryInput(page)).toBeVisible();
    await expect(categoryInput(page)).toBeDisabled();
    await expect(categoryInput(page)).toHaveValue("C");
    const level = app.detail("level");
    await expect(level).toBeVisible();
    const levelBox = await level.boundingBox();
    const categoryBox = await categoryInput(page).boundingBox();
    expect(levelBox).not.toBeNull();
    expect(categoryBox).not.toBeNull();
    expect(categoryBox!.y).toBeGreaterThanOrEqual(levelBox!.y + levelBox!.height);
  });

  for (const sample of CATEGORY_CASES) {
    test(`${sample.id}: ${sample.type}, ${sample.count ?? "brak danych"} uczniów daje kategorię ${sample.category} @school @category @boundaries`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const school = await ensureCategorySchool(page, app, sample);
      await expect(categoryInput(page)).toHaveValue(sample.category);
      if (sample.type === "Szkoła NPC") await expectNpcSchoolIdentity(app);
      await expectCategoryInSearch(app, school, sample.category);
      await app.openPanel("school", school.id);
      await expect(categoryInput(page)).toHaveValue(sample.category);
    });
  }

  for (const sorting of [
    { id: "CAT-23", direction: "ascending", expected: ["A", "B", "C", "D"] },
    { id: "CAT-24", direction: "descending", expected: ["D", "C", "B", "A"] },
  ]) {
    test(`${sorting.id}: Kategoria sortuje alfabetycznie ${sorting.direction} @school @category @sort`, async ({
      page,
    }) => {
      test.setTimeout(360000);
      const app = new Octopus(page);
      const schools = [];
      for (const definition of SORT_CASES)
        schools.push(await ensureCategorySchool(page, app, definition));
      const results = await searchCategorySchools(app, { name: categorySortPrefix });
      const { header, column } = await categoryColumn(results);
      for (
        let attempt = 0;
        attempt < 3 && (await header.getAttribute("aria-sort")) !== sorting.direction;
        attempt++
      )
        await header.click();
      await expect(header).toHaveAttribute("aria-sort", sorting.direction);
      await expect
        .poll(async () => (await categorySortRows(results, column)).map((row) => row.category))
        .toEqual(sorting.expected);
      expect((await categorySortRows(results, column)).map((row) => row.id).sort()).toEqual(
        schools.map((school) => school.id).sort(),
      );
    });
  }

  test("CAT-25: zmiany sortowania nie zmieniają szkół i ich kategorii @school @category @sort", async ({
    page,
  }) => {
    test.setTimeout(360000);
    const app = new Octopus(page);
    const schools = [];
    for (const definition of SORT_CASES)
      schools.push(await ensureCategorySchool(page, app, definition));
    const results = await searchCategorySchools(app, { name: categorySortPrefix });
    const { header, column } = await categoryColumn(results);
    const expected = schools
      .map((school, index) => ({ id: school.id, category: SORT_CASES[index].category }))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const direction of ["ascending", "descending"]) {
      for (
        let attempt = 0;
        attempt < 3 && (await header.getAttribute("aria-sort")) !== direction;
        attempt++
      )
        await header.click();
      await expect(header).toHaveAttribute("aria-sort", direction);
      await expect
        .poll(async () =>
          (await categorySortRows(results, column))
            .map(({ id, category }) => ({ id, category }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        )
        .toEqual(expected);
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
      await expect(categoryInput(page)).toHaveValue(change.category);
      await expectCategoryInSearch(app, school, change.category as SchoolCategory);
      await app.openPanel("school", school.id);
      await expect(studentCountInput(page)).toHaveValue(change.after);
      await expect(categoryInput(page)).toHaveValue(change.category);
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
    await expect(studentCountInput(page)).toHaveValue("100");
    await expect(categoryInput(page)).toHaveValue("C");
    await expectCategoryInSearch(app, school, "C");
  });

  test("CAT-34: zmiana liczby uczniów innej placówki zachowuje D @school @category @edit", async ({
    page,
    categoryEditSchool: school,
  }) => {
    const app = new Octopus(page);
    await setStudentCount(app, school, "1");
    await expect(categoryInput(page)).toHaveValue("D");
    await expectCategoryInSearch(app, school, "D");
    await app.openPanel("school", school.id);
    await expect(studentCountInput(page)).toHaveValue("1");
    await expect(categoryInput(page)).toHaveValue("D");
  });
});
