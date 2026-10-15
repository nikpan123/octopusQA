import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { apiStep } from "./api-step";
import { expect, type Page } from "@playwright/test";
import { OCTOPUS_ENV } from "./environment";
import { Octopus, typeValue } from "./octopus";
import {
  setStudentCount,
  studentCountInput,
  type CategorySchool,
  type SchoolCategory,
} from "./school-category";

type Definition = {
  key: string;
  type: string;
  count?: number;
  category: SchoolCategory;
  testRecord?: boolean;
};
export const CATEGORY_CASES: Array<Definition & { id: string }> = [
  { id: "CAT-04", key: "SP_BRAK", type: "Szkoła podstawowa", category: "A" },
  { id: "CAT-05", key: "SP_0", type: "Szkoła podstawowa", count: 0, category: "A" },
  { id: "CAT-06", key: "SP_1", type: "Szkoła podstawowa", count: 1, category: "C" },
  { id: "CAT-07", key: "SP_100", type: "Szkoła podstawowa", count: 100, category: "C" },
  { id: "CAT-08", key: "SP_101", type: "Szkoła podstawowa", count: 101, category: "B" },
  { id: "CAT-09", key: "SP_400", type: "Szkoła podstawowa", count: 400, category: "B" },
  { id: "CAT-10", key: "SP_401", type: "Szkoła podstawowa", count: 401, category: "A" },
  { id: "CAT-11", key: "SP_1200", type: "Szkoła podstawowa", count: 1200, category: "A" },
  { id: "CAT-12", key: "LO_101", type: "Liceum", count: 101, category: "B" },
  { id: "CAT-13", key: "TECH_1", type: "Technikum", count: 1, category: "C" },
  ...["Przedszkole", "Placówka doskonalenia nauczycieli"].flatMap((type, index) =>
    [0, 1, 401].map((count, offset) => ({
      id: `CAT-${14 + index * 3 + offset}`,
      key: `INNE_${index}_${count}`,
      type,
      count,
      category: "D" as const,
    })),
  ),
  // NPC ma poziom szkoły podstawowej i podlega tym samym progom kategorii.
  // Klucze pozostają bez zmian, aby wykorzystać istniejące szkoły testowe.
  { id: "CAT-20", key: "INNE_2_0", type: "Szkoła NPC", count: 0, category: "A" },
  { id: "CAT-21", key: "INNE_2_1", type: "Szkoła NPC", count: 1, category: "C" },
  { id: "CAT-22", key: "INNE_2_401", type: "Szkoła NPC", count: 401, category: "A" },
];

export const SORT_CASES: Definition[] = [
  { key: "SORT_A", type: "Szkoła podstawowa", count: 401, category: "A" },
  { key: "SORT_B", type: "Szkoła podstawowa", count: 101, category: "B" },
  { key: "SORT_C", type: "Szkoła podstawowa", count: 1, category: "C" },
  { key: "SORT_D", type: "Przedszkole", count: 999, category: "D" },
];
export const EDIT_CASE: Definition = {
  key: "EDYCJA",
  type: "Szkoła podstawowa",
  count: 100,
  category: "C",
};
export const EDIT_D_CASE: Definition = {
  key: "EDYCJA_D",
  type: "Przedszkole",
  count: 401,
  category: "D",
};
const cachePath = path.resolve("playwright", ".auth", OCTOPUS_ENV, "category-schools.json");
const prefix = `AUTO_CAT_${OCTOPUS_ENV.toUpperCase()}_`;

export async function ensureCategorySchool(
  page: Page,
  app: Octopus,
  definition: Definition,
): Promise<CategorySchool> {
  return await apiStep(
    "Przygotowanie: szkoła o zadanym typie, liczbie uczniów i kategorii",
    async () => {
      if (definition.testRecord === false)
        expect(
          definition.key,
          "Szkoły bez flagi mają oddzielną przestrzeń danych Uprawnień",
        ).toMatch(/^ENT_UNMARKED_/);
      const cache = await readFile(cachePath, "utf8")
        .then((value) => JSON.parse(value) as Record<string, CategorySchool>)
        .catch(() => ({}) as Record<string, CategorySchool>);
      const name = prefix + definition.key;
      let school = cache[definition.key];
      if (!school) {
        await app.openPanel("school");
        const search = await app.openSearch("school");
        for (const input of await search
          .locator('input:not([type="checkbox"]):not([readonly]):not([disabled])')
          .all())
          await typeValue(input, "");
        await typeValue(app.field(search, "Nazwa szkoły"), name);
        const searched = page.waitForResponse((response) => {
          const url = new URL(response.url());
          return (
            response.request().method() === "GET" &&
            url.pathname === "/api/InstitutionBrowser/GetInstitutions" &&
            decodeURIComponent(url.search).includes(name)
          );
        });
        await search.getByRole("button", { name: "Szukaj", exact: true }).click();
        const response = await searched;
        expect(response.ok(), `Wyszukiwanie szkoły ${name} powinno się powieść`).toBe(true);
        const body = (await response.json()) as { data: Array<{ id: number; name: string }> };
        expect(Array.isArray(body.data), "Wyszukiwanie powinno zwrócić tablicę szkół").toBe(true);
        const matches = body.data.filter((candidate) => candidate.name === name);
        expect(matches.length, `Nie może istnieć kilka szkół o nazwie ${name}`).toBeLessThanOrEqual(
          1,
        );
        await expect(search).toHaveCount(0);
        const empty = page
          .locator("mat-dialog-container")
          .filter({ hasText: "Brak wyników wyszukiwania" });
        if (matches.length === 0) {
          // Wyszukiwanie jest częściowe: SP_1 może zwrócić SP_100, ale nie samą SP_1.
          // Decyzję o utworzeniu podejmujemy dopiero na podstawie zakończonej odpowiedzi.
          if (body.data.length === 0) {
            await expect(empty).toBeVisible();
            await empty.getByRole("button", { name: "OK", exact: true }).click();
            await expect(empty).toHaveCount(0);
          }
          const id = await app.createSchool(name, `CAT-${definition.key}`, definition.type, {
            quantityOfStudents: definition.count,
          });
          school = { id, name };
        } else {
          school = { id: String(matches[0].id), name };
        }
        cache[definition.key] = school;
        await mkdir(path.dirname(cachePath), { recursive: true });
        await writeFile(cachePath, JSON.stringify(cache, null, 2));
      }
      await app.openPanel("school", school.id);
      await expect(app.detail("name")).toHaveValue(name);
      if (definition.testRecord === false) {
        await expect(
          page.getByRole("checkbox", { name: "Testowy", exact: true }),
        ).not.toBeChecked();
      } else {
        await app.markTestRecord();
      }
      // Tylko dedykowane szkoły edycyjne mogą mieć stan pozostały po przerwanym teście.
      // Nie naprawiamy danych przypadków granicznych, bo mogłoby to ukrywać błąd produktu.
      if (definition.key === EDIT_CASE.key || definition.key === EDIT_D_CASE.key) {
        const baseline = String(definition.count);
        if ((await studentCountInput(page).inputValue()) !== baseline) {
          await setStudentCount(app, school, baseline);
          await app.openPanel("school", school.id);
        }
      }
      if (definition.count === undefined)
        await expect(studentCountInput(page)).toHaveValue(/^(?:0)?$/);
      else await expect(studentCountInput(page)).toHaveValue(String(definition.count));
      return school;
    },
  );
}

export const categorySortPrefix = prefix + "SORT_";
