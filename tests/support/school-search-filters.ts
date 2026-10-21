import { mkdir, open, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { apiStep } from "./api-step";
import { expect, type Locator } from "@playwright/test";
import { Octopus } from "./octopus";
import { OCTOPUS_ENV } from "./environment";
import { fixtureSchools } from "./fixture-schools";
import { backgroundSchoolSetup } from "./background-school-setup";

export type SearchCriteria = {
  name?: string;
  city?: string;
  rspo?: string;
  medals?: string[];
  categories?: string[];
  si?: boolean;
  level?: string;
};

export async function selectSearchValues(
  app: Octopus,
  form: Locator,
  field: string,
  values: string[],
) {
  const select = form.locator(`[data-cy="${field}"]`);
  await select.click();
  for (const value of values)
    await app.page.getByRole("option", { name: value, exact: true }).click();
  await app.page.keyboard.press("Escape");
}

export async function schoolSearchForm(app: Octopus) {
  await app.openPanel("school");
  const form = await app.openSearch("school");
  for (const input of await form
    .locator('input:not([type="checkbox"]):enabled:not([readonly])')
    .all())
    await input.fill("");
  // Nie pozwalamy, aby zapamiętany filtr zmieniał znaczenie scenariusza.
  for (const field of [
    "medal-clear",
    "size-category-clear",
    "si-clear",
    "tags-clear",
    "school-level-clear",
  ])
    if (await form.locator(`[data-cy="${field}"]`).isVisible())
      await form.locator(`[data-cy="${field}"]`).click();
  return form;
}

export async function applySearchCriteria(app: Octopus, form: Locator, criteria: SearchCriteria) {
  if (criteria.name !== undefined)
    await form.locator('[data-cy="school-name-input"]').fill(criteria.name);
  if (criteria.city !== undefined) await form.locator('[data-cy="city-input"]').fill(criteria.city);
  if (criteria.rspo !== undefined) await form.locator('[data-cy="rspo-input"]').fill(criteria.rspo);
  if (criteria.medals?.length) await selectSearchValues(app, form, "medal-select", criteria.medals);
  if (criteria.categories?.length)
    await selectSearchValues(app, form, "size-category-select", criteria.categories);
  if (criteria.si !== undefined)
    await selectSearchValues(app, form, "si-select", [criteria.si ? "TAK" : "NIE"]);
  if (criteria.level) await selectSearchValues(app, form, "school-level-select", [criteria.level]);
}

export async function submitSchoolSearch(app: Octopus, form: Locator) {
  const loaded = app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === "/api/InstitutionBrowser/GetInstitutions",
  );
  await form.locator('[data-cy="search-button"]').click();
  const response = await loaded;
  expect(response.ok()).toBe(true);
  const model = JSON.parse(new URL(response.url()).searchParams.get("filterModel")!);
  const body = await response.json();
  expect(Array.isArray(body.data), "Odpowiedź musi zawierać listę szkół").toBe(true);
  const schools = body.data as Array<{
    id: number | string;
    name: string;
    informationAboutMedalCategory?: { medalCategoryName?: string };
  }>;
  await expect(form).toHaveCount(0);
  if (schools.length > 0 && schools.length <= 4) {
    // Kontrolowane zbiory mieszczą się w widoku: porównujemy także UI, nie samą odpowiedź.
    await expect
      .poll(async () =>
        (
          await app
            .results("school")
            .locator('[role="row"][row-index] [role="gridcell"][col-id="id"]')
            .allTextContents()
        )
          .map((id) => id.trim())
          .sort(),
      )
      .toEqual(schools.map((school) => String(school.id)).sort());
  }
  return { model, schools, ids: schools.map((school) => String(school.id)).sort() };
}

export async function searchSchools(app: Octopus, criteria: SearchCriteria) {
  const form = await schoolSearchForm(app);
  await applySearchCriteria(app, form, criteria);
  return submitSchoolSearch(app, form);
}

type SearchSchool = { id: string; name: string; category: string; rspo: string };
type SearchDataset = { prefix: string; schools: SearchSchool[] };
type DatasetRegistry = SearchDataset & { schema: 1; rspoBase: number; pending?: string };

const datasetDirectory = path.resolve("playwright", ".auth", OCTOPUS_ENV);
const datasetPath = path.join(datasetDirectory, "search-filter-schools.json");
const lockPath = `${datasetPath}.lock`;
const datasetPrefix = `AUTO_SFLT_${OCTOPUS_ENV.toUpperCase()}_V1`;
let sharedDataset: Promise<SearchDataset> | undefined;

async function prepareSearchDataset(app: Octopus): Promise<SearchDataset> {
  await mkdir(datasetDirectory, { recursive: true });
  // Osobne procesy workerów współdzielą rejestr. Tylko właściciel blokady tworzy szkoły.
  const deadline = Date.now() + 150000;
  let lock: Awaited<ReturnType<typeof open>> | undefined;
  while (!lock) {
    try {
      lock = await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (Date.now() >= deadline)
        throw new Error(
          `Przygotowanie szkół SFLT jest zablokowane: ${lockPath}. Sprawdź proces właściciela; nie usuwaj blokady działających testów.`,
          { cause: error },
        );
      await delay(250);
    }
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    let registry: DatasetRegistry;
    try {
      registry = JSON.parse(await readFile(datasetPath, "utf8")) as DatasetRegistry;
    } catch (error) {
      // Uszkodzony rejestr nie może być powodem utworzenia kolejnego kompletu.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      registry = {
        schema: 1,
        prefix: datasetPrefix,
        rspoBase: OCTOPUS_ENV === "dev" ? 871100 : 871200,
        schools: [],
      };
      await writeFile(datasetPath, JSON.stringify(registry, null, 2));
    }
    expect(registry.schema).toBe(1);
    expect(registry.prefix).toBe(datasetPrefix);
    expect(Number.isInteger(registry.rspoBase)).toBe(true);
    const save = () => writeFile(datasetPath, JSON.stringify(registry, null, 2));
    const categories = ["A", "B", "C", "D"];
    const definitions = categories.map((category, index) => {
      const name = `${datasetPrefix}_${category}`;
      const cached = registry.schools.filter((school) => school.category === category);
      expect(
        cached.length,
        `Najwyżej jeden wpis rejestru kategorii ${category}`,
      ).toBeLessThanOrEqual(1);
      if (cached[0]) {
        expect(cached[0].name).toBe(name);
        expect(cached[0].rspo).toBe(String(registry.rspoBase + index));
      }
      return {
        id: cached[0]?.id,
        name,
        type: category === "D" ? "Przedszkole" : "Szkoła podstawowa",
        count: [401, 101, 1, 0][index],
        rspo: String(registry.rspoBase + index),
      };
    });
    const api = await fixtureSchools(app.page);
    // Lista instytucji zwraca RSPO=null dla tego zestawu; sam filtr RSPO sprawdza SFLT-17.
    // Nie dodajemy tutaj nowego wymagania względem dawnego przygotowania UI.
    const identityDefinitions = definitions.map(({ id, name, type, count }) => ({
      id,
      name,
      type,
      count,
    }));
    const resolved = await api.findMany(identityDefinitions);
    for (const [index, category] of categories.entries()) {
      const definition = definitions[index];
      const found = resolved[index];
      let id: string;
      if (found) id = found.id;
      else {
        if (registry.pending)
          throw new Error(
            `Niepotwierdzony zapis szkoły ${registry.pending}; nie tworzymy duplikatu.`,
          );
        registry.pending = definition.name;
        await save();
        id = await backgroundSchoolSetup(app.page, (setup) =>
          setup.createSchool(definition.name, `SFLT-${OCTOPUS_ENV}-${category}`, definition.type, {
            quantityOfStudents: definition.count,
            rspo: definition.rspo,
          }),
        );
      }
      const saved = { id, name: definition.name, category, rspo: definition.rspo };
      const existingIndex = registry.schools.findIndex((school) => school.category === category);
      if (existingIndex < 0) registry.schools.push(saved);
      else registry.schools[existingIndex] = saved;
      if (registry.pending === definition.name) delete registry.pending;
      await save();
      if (!found?.tested) {
        await backgroundSchoolSetup(app.page, async (setup) => {
          await setup.openPanel("school", id);
          await setup.markTestRecord();
        });
      }
      if (!found) {
        const [confirmed] = await api.findMany([{ ...identityDefinitions[index], id }]);
        expect(confirmed?.tested).toBe(true);
      }
      // Wyszukiwanie i prezentacja kategorii są sprawdzane w ciele SFLT; przygotowanie sprawdza dane przez API.
    }
    return {
      prefix: registry.prefix,
      schools: ["A", "B", "C", "D"].map((category) =>
        registry.schools.find((school) => school.category === category)!,
      ),
    };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

export async function searchDataset(app: Octopus): Promise<SearchDataset> {
  return await apiStep(
    "Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania",
    async () => {
      // Jedno przygotowanie na worker; kolejne uruchomienia odczytują ID z rejestru.
      sharedDataset ??= prepareSearchDataset(app).catch((error: unknown) => {
        sharedDataset = undefined;
        throw error;
      });
      const data = await sharedDataset;
      return { prefix: data.prefix, schools: data.schools.map((school) => ({ ...school })) };
    },
  );
}

export async function expectEmptySchoolSearch(app: Octopus) {
  const notice = app.page
    .locator("mat-dialog-container")
    .filter({ hasText: "Brak wyników wyszukiwania" });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "OK", exact: true }).click();
  await expect(app.results("school").getByRole("gridcell")).toHaveCount(0);
}
