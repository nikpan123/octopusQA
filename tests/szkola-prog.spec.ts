import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import { ensureCategorySchool } from "./support/school-category-data";
import { categoryDetails, studentCountInput } from "./support/school-category";
import { schoolPanelTextField } from "./support/school-add";
import {
  openSchoolSioForm,
  schoolSioInput,
  saveSchoolSioEdit,
  cancelSchoolEdit,
} from "./support/school-edit";

test.describe("Minimalne zamówienie — pole Próg szkoły", () => {
  test.beforeEach(async () => {
    test.setTimeout(180000);
  });

  // Oczekiwane wyniki są zapisane niezależnie od wzoru implementacji.
  for (const [index, [students, threshold]] of [
    [0, 10],
    [1, 1],
    [6, 1],
    [7, 1],
    [19, 1],
    [20, 2],
    [21, 2],
    [59, 4],
    [60, 5],
    [61, 5],
    [100, 8],
    [400, 30],
    [750, 56],
    [1200, 90],
  ].entries()) {
    test(`THR-${String(index + 1).padStart(2, "0")}: SP ${students} uczniów daje próg cyfrowy ${threshold} @school @threshold @boundaries`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
        ensureCategorySchool(page, app, {
          key: `THR_SP_${students}`,
          type: "Szkoła podstawowa",
          count: students,
          category: students === 0 || students > 400 ? "A" : students <= 100 ? "C" : "B",
        }));
      const input = schoolPanelTextField(categoryDetails(page), "Próg");
      await test.step("Sprawdzenie: zablokowanie działania — input", async () =>
        expect(input).toBeDisabled());
      await test.step("Sprawdzenie: wartość pola w widoku — input; oczekiwane: String(threshold)", async () =>
        expect(input).toHaveValue(String(threshold)));
      await page.reload();
      await test.step("Sprawdzenie: wartość pola w widoku — input; oczekiwane: String(threshold)", async () =>
        expect(input).toHaveValue(String(threshold)));
    });
  }

  for (const [index, type] of ["Przedszkole", "Szkoła NPC"].entries()) {
    for (const [offset, students] of [1, 400, 1200].entries()) {
      test(`THR-${15 + index * 3 + offset}: ${type} ${students} uczniów ma stały próg 10 @school @threshold`, async ({
        page,
      }) => {
        const app = new Octopus(page);
        await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
          ensureCategorySchool(page, app, {
            key: `THR_FIXED_${index}_${students}`,
            type,
            count: students,
            category: index === 0 ? "D" : students > 400 ? "A" : students <= 100 ? "C" : "B",
          }));
        await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(categoryDetails(page), "Próg"); oczekiwane: "10"', async () =>
          expect(schoolPanelTextField(categoryDetails(page), "Próg")).toHaveValue("10"));
      });
    }
  }

  test("THR-21: zapis SIO przelicza próg cyfrowy w otwartym profilu @school @threshold @edit", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const worker = process.env.TEST_PARALLEL_INDEX ?? "0";
    const school =
      await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
        ensureCategorySchool(page, app, {
          key: `THR_EDIT_W${worker}`,
          type: "Szkoła podstawowa",
          count: 400,
          category: "B",
        }));
    const threshold = schoolPanelTextField(categoryDetails(page), "Próg");
    try {
      // Brak danych i jawne 0 mają próg domyślny 10. Minimum 1 ze wzoru
      // obowiązuje dopiero dla dodatniej liczby uczniów.
      for (const [students, expectedThreshold] of [
        ["100", "8"],
        ["0", "10"],
        ["", "10"],
        ["1", "1"],
      ]) {
        const form = await openSchoolSioForm(page);
        await schoolSioInput(form, "quantityOfStudents").fill(students);
        await saveSchoolSioEdit(form);
        await test.step("Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: students", async () =>
          expect(studentCountInput(page)).toHaveValue(students));
        await test.step("Sprawdzenie: wartość pola w widoku — threshold; oczekiwane: expectedThreshold", async () =>
          expect(threshold).toHaveValue(expectedThreshold));
        await app.openPanel("school", school.id);
        await test.step("Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: students", async () =>
          expect(studentCountInput(page)).toHaveValue(students));
        await test.step("Sprawdzenie: wartość pola w widoku — threshold; oczekiwane: expectedThreshold", async () =>
          expect(threshold).toHaveValue(expectedThreshold));
      }
    } finally {
      await app.openPanel("school", school.id);
      const form = await openSchoolSioForm(page);
      await schoolSioInput(form, "quantityOfStudents").fill("400");
      await saveSchoolSioEdit(form);
      await test.step('Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: "400"', async () =>
        expect(studentCountInput(page)).toHaveValue("400"));
      await test.step('Sprawdzenie: wartość pola w widoku — threshold; oczekiwane: "30"', async () =>
        expect(threshold).toHaveValue("30"));
    }
  });

  test("THR-22: anulowanie SIO nie zmienia progu @school @threshold @cancel", async ({ page }) => {
    const app = new Octopus(page);
    await test.step("Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii", async () =>
      ensureCategorySchool(page, app, {
        key: "THR_CANCEL",
        type: "Szkoła podstawowa",
        count: 400,
        category: "B",
      }));
    const form = await openSchoolSioForm(page);
    await schoolSioInput(form, "quantityOfStudents").fill("100");
    await cancelSchoolEdit(form);
    await test.step('Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: "400"', async () =>
      expect(studentCountInput(page)).toHaveValue("400"));
    await test.step('Sprawdzenie: wartość pola w widoku — schoolPanelTextField(categoryDetails(page), "Próg"); oczekiwane: "30"', async () =>
      expect(schoolPanelTextField(categoryDetails(page), "Próg")).toHaveValue("30"));
  });
});
