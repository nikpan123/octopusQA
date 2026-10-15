import { test, expect } from "./support/scenario";
import { OCTOPUS_ENV } from "./support/environment";
import { CATEGORY_CASES } from "./support/school-category-data";
import {
  fillSchoolAddTextField,
  prepareCompleteSchoolAdd,
  saveSchoolAdd,
  schoolAddTextField,
} from "./support/school-add";
import {
  categoryInput,
  expectNpcSchoolIdentity,
  expectCategoryInSearch,
  studentCountInput,
} from "./support/school-category";

test.describe("Kategoria podczas dodawania szkoły", () => {
  for (const [index, sample] of CATEGORY_CASES.entries()) {
    const id = `CAT-${35 + index}`;
    test(`${id}: nowa ${sample.type}, ${sample.count ?? "brak danych"} uczniów otrzymuje ${sample.category} @school @category @school-add @boundaries @persistence`, async ({
      page,
      scenario: s,
    }) => {
      const name = `AUTO_CAT_${OCTOPUS_ENV.toUpperCase()}_ADD_${sample.key}_${s.id}`;
      const number = `CAT-ADD-${s.id}`;
      await s.record("schoolName", name);
      await s.record("schoolType", sample.type);
      await s.record("studentCount", sample.count === undefined ? "EMPTY" : String(sample.count));
      await s.record("expectedCategory", sample.category);
      const form = await prepareCompleteSchoolAdd(page, s.app, name, number, sample.type);
      const countInput = schoolAddTextField(form, "Liczba uczniów");
      await test.step("Sprawdzenie: liczba elementów w widoku — countInput; oczekiwane: 1", async () =>
        expect(countInput).toHaveCount(1));
      if (sample.count === undefined) {
        // Brak danych musi pochodzić z pustego pola, nie z dopisania zera przez test.
        await test.step('Sprawdzenie: wartość pola w widoku — countInput; oczekiwane: ""', async () =>
          expect(countInput).toHaveValue(""));
      } else {
        await fillSchoolAddTextField(form, "Liczba uczniów", String(sample.count));
        await countInput.blur();
        await test.step("Sprawdzenie: wartość pola w widoku — countInput; oczekiwane: String(sample.count)", async () =>
          expect(countInput).toHaveValue(String(sample.count)));
      }

      // Tworzenie odbywa się zawsze przez UI; nie używamy cache ani createSchool API.
      const { schoolId, saveRequestCount } = await saveSchoolAdd(page, form);
      await s.record("schoolId", schoolId);
      await s.record("schoolRetentionStatus", "KEPT_NO_DELETE_ENDPOINT");
      await s.app.markTestRecord();
      const school = { id: schoolId, name };
      const expectedCount = sample.count === undefined ? /^(?:0)?$/ : String(sample.count);
      await test.step("Sprawdzenie: zgodność wartości — saveRequestCount; oczekiwane: 1", async () => {
        expect(saveRequestCount).toBe(1);
      });
      await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: name', async () =>
        expect(s.app.detail("name")).toHaveValue(name));
      await test.step("Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: expectedCount", async () =>
        expect(studentCountInput(page)).toHaveValue(expectedCount));
      await test.step("Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: sample.category", async () =>
        expect(categoryInput(page)).toHaveValue(sample.category));
      if (sample.type === "Szkoła NPC")
        await test.step("Sprawdzenie: expectNpcSchoolIdentity", async () =>
          expectNpcSchoolIdentity(s.app));
      await test.step("Sprawdzenie: expectCategoryInSearch", async () =>
        expectCategoryInSearch(s.app, school, sample.category));
      await s.app.openPanel("school", schoolId);
      await test.step('Sprawdzenie: wartość pola w widoku — s.app.detail("name"); oczekiwane: name', async () =>
        expect(s.app.detail("name")).toHaveValue(name));
      await test.step("Sprawdzenie: wartość pola w widoku — studentCountInput(page); oczekiwane: expectedCount", async () =>
        expect(studentCountInput(page)).toHaveValue(expectedCount));
      await test.step("Sprawdzenie: wartość pola w widoku — categoryInput(page); oczekiwane: sample.category", async () =>
        expect(categoryInput(page)).toHaveValue(sample.category));
    });
  }
});
