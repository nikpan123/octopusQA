import { expect, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { OCTOPUS_ENV } from "./environment";
import { Octopus, typeValue } from "./octopus";
import type { StructureSchool } from "./school-structure";

export type StructureSchoolKey =
  "group" | "primary" | "secondary" | "preschool" | "main" | "branch" | "nodeC";

type StructureSchoolDefinition = {
  name: string;
  type: string;
};

const environment = OCTOPUS_ENV.toUpperCase();

const definitions: Record<StructureSchoolKey, StructureSchoolDefinition> = {
  group: { name: `AUTO_STR_${environment}_ZESPOL`, type: "Zespół szkół" },
  primary: { name: `AUTO_STR_${environment}_SP`, type: "Szkoła podstawowa" },
  secondary: { name: `AUTO_STR_${environment}_LO`, type: "Liceum" },
  preschool: { name: `AUTO_STR_${environment}_PRZEDSZKOLE`, type: "Przedszkole" },
  main: { name: `AUTO_STR_${environment}_GLOWNA`, type: "Szkoła podstawowa" },
  branch: { name: `AUTO_STR_${environment}_FILIA`, type: "Szkoła podstawowa" },
  nodeC: { name: `AUTO_STR_${environment}_WEZEL_C`, type: "Szkoła podstawowa" },
};

const cachedSchools = new Map<StructureSchoolKey, StructureSchool>();
const cacheFile = path.resolve("playwright", ".auth", OCTOPUS_ENV, "structure-schools.json");
let cacheLoaded = false;

async function loadSchoolCache() {
  if (cacheLoaded) return;
  cacheLoaded = true;

  const stored = await readFile(cacheFile, "utf8")
    .then((value) => JSON.parse(value) as Partial<Record<StructureSchoolKey, StructureSchool>>)
    .catch(() => ({}));

  for (const [key, school] of Object.entries(stored)) {
    if (school?.id && school.name) {
      cachedSchools.set(key as StructureSchoolKey, school);
    }
  }
}

async function saveSchoolCache() {
  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, `${JSON.stringify(Object.fromEntries(cachedSchools), null, 2)}\n`);
}

async function findExactStructureSchool(
  page: Page,
  app: Octopus,
  name: string,
): Promise<StructureSchool | null> {
  await app.openPanel("school");
  const search = await app.openSearch("school");
  await typeValue(app.field(search, "Nazwa szkoły"), name);
  await search.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(search).toHaveCount(0);

  const empty = page.locator("mat-dialog-container").filter({
    hasText: "Brak wyników wyszukiwania",
  });
  const exactRow = app
    .results("school")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", { name, exact: true }),
    });

  await expect
    .poll(async () => {
      if (await empty.isVisible().catch(() => false)) return "EMPTY";
      const count = await exactRow.count();
      return count > 0 ? `FOUND:${count}` : "WAITING";
    })
    .not.toBe("WAITING");

  if (await empty.isVisible().catch(() => false)) {
    await empty.getByRole("button", { name: "OK", exact: true }).click();
    await expect(empty).toHaveCount(0);
    return null;
  }

  await expect(exactRow, `Powinna istnieć jedna szkoła „${name}”`).toHaveCount(1);
  await exactRow.click();
  await expect(page).toHaveURL(/\/school\/school-panel\/\d+$/);

  return { id: page.url().split("/").pop()!, name };
}

export async function ensureStructureTestSchool(
  page: Page,
  app: Octopus,
  key: StructureSchoolKey,
): Promise<StructureSchool> {
  await loadSchoolCache();
  const cached = cachedSchools.get(key);
  if (cached) return cached;

  const definition = definitions[key];
  const existing = await findExactStructureSchool(page, app, definition.name);
  if (existing) {
    cachedSchools.set(key, existing);
    await saveSchoolCache();
    return existing;
  }

  const id = await app.createSchool(definition.name, `STR-${Date.now()}`, definition.type);

  const created = { id, name: definition.name };
  cachedSchools.set(key, created);
  await saveSchoolCache();
  return created;
}

export async function ensureStructureTestSchools(
  page: Page,
  app: Octopus,
  keys: StructureSchoolKey[],
) {
  const entries: Array<readonly [StructureSchoolKey, StructureSchool]> = [];
  for (const key of keys) {
    entries.push([key, await ensureStructureTestSchool(page, app, key)] as const);
  }
  return Object.fromEntries(entries) as Partial<Record<StructureSchoolKey, StructureSchool>>;
}
