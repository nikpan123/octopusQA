import { expect, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { OCTOPUS_ENV } from "./environment";
import { Octopus, typeValue } from "./octopus";
import type { StructureSchool } from "./school-structure";
import type { StructureApi } from "./school-structure-api";

export type StructureSchoolKey =
  | "copyGroup"
  | "copyPrimary"
  | "copySecondary"
  | "copyTechnical"
  | "copyOtherGroup"
  | "copyOtherPrimary"
  | "copyStandalone"
  | "addBranch"
  | "addMain"
  | "addGroup"
  | "group"
  | "group2"
  | "inactive"
  | "primary"
  | "secondary"
  | "preschool"
  | "main"
  | "branch"
  | "nodeC"
  | "nodeD"
  | "nodeE"
  | "nodeF";

type StructureSchoolDefinition = {
  name: string;
  type: string;
};

const environment = OCTOPUS_ENV.toUpperCase();

const definitions: Record<StructureSchoolKey, StructureSchoolDefinition> = {
  copyGroup: { name: `AUTO_STR_${environment}_COPY_ZESPOL_A`, type: "Zespół szkół" },
  copyPrimary: { name: `AUTO_STR_${environment}_COPY_SP_A`, type: "Szkoła podstawowa" },
  copySecondary: { name: `AUTO_STR_${environment}_COPY_LO_A`, type: "Liceum" },
  copyTechnical: { name: `AUTO_STR_${environment}_COPY_TECH_A`, type: "Technikum" },
  copyOtherGroup: { name: `AUTO_STR_${environment}_COPY_ZESPOL_B`, type: "Zespół szkół" },
  copyOtherPrimary: { name: `AUTO_STR_${environment}_COPY_SP_B`, type: "Szkoła podstawowa" },
  copyStandalone: { name: `AUTO_STR_${environment}_COPY_SAMODZIELNA`, type: "Szkoła podstawowa" },
  addBranch: { name: `AUTO_STR_${environment}_DODAWANIE_FILIA`, type: "Szkoła podstawowa" },
  addMain: { name: `AUTO_STR_${environment}_DODAWANIE_GLOWNA`, type: "Szkoła podstawowa" },
  addGroup: { name: `AUTO_STR_${environment}_DODAWANIE_ZESPOL`, type: "Zespół szkół" },
  group: { name: `AUTO_STR_${environment}_ZESPOL`, type: "Zespół szkół" },
  group2: { name: `AUTO_STR_${environment}_ZESPOL_2`, type: "Zespół szkół" },
  inactive: { name: `AUTO_STR_${environment}_NIEAKTYWNA`, type: "Szkoła podstawowa" },
  primary: { name: `AUTO_STR_${environment}_SP`, type: "Szkoła podstawowa" },
  secondary: { name: `AUTO_STR_${environment}_LO`, type: "Liceum" },
  preschool: { name: `AUTO_STR_${environment}_PRZEDSZKOLE`, type: "Przedszkole" },
  main: { name: `AUTO_STR_${environment}_GLOWNA`, type: "Szkoła podstawowa" },
  branch: { name: `AUTO_STR_${environment}_FILIA`, type: "Szkoła podstawowa" },
  nodeC: { name: `AUTO_STR_${environment}_WEZEL_C`, type: "Szkoła podstawowa" },
  nodeD: { name: `AUTO_STR_${environment}_WEZEL_D`, type: "Szkoła podstawowa" },
  nodeE: { name: `AUTO_STR_${environment}_WEZEL_E`, type: "Szkoła podstawowa" },
  nodeF: { name: `AUTO_STR_${environment}_WEZEL_F`, type: "Szkoła podstawowa" },
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
  if (cached) {
    await app.openPanel("school", cached.id);
    await expect(app.detail("name")).toHaveValue(definitions[key].name);
    await app.markTestRecord();
    return cached;
  }

  const definition = definitions[key];
  const existing = await findExactStructureSchool(page, app, definition.name);
  if (existing) {
    await app.markTestRecord();
    cachedSchools.set(key, existing);
    await saveSchoolCache();
    return existing;
  }

  const id = await app.createSchool(definition.name, `STR-${Date.now()}`, definition.type);
  await app.markTestRecord();

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

export async function ensureInactiveStructureSchool(page: Page, app: Octopus, api: StructureApi) {
  await loadSchoolCache();
  const cached = cachedSchools.get("inactive");
  if (cached?.inactive && cached.institutionUnitId) {
    api.registerInactive(cached);
    return cached;
  }
  const school = await ensureStructureTestSchool(page, app, "inactive");
  await api.resolve([school]);
  const fixture = { ...school, institutionUnitId: api.unit(school), inactive: false };
  cachedSchools.set("inactive", fixture);
  await saveSchoolCache();
  await app.openPanel("school", fixture.id);
  await page.getByRole("button", { name: "Zawieś", exact: true }).click();
  const dialog = app.dialog("Zawieszanie szkoły");
  await expect(dialog).toBeVisible();
  const responsePromise = page.waitForResponse((response) => {
    const path = new URL(response.url()).pathname;
    return (
      response.request().method() !== "GET" &&
      (path.startsWith("/api/School/") || path.startsWith("/api/Institution/"))
    );
  });
  await dialog.getByRole("button", { name: "Tak", exact: true }).click();
  const response = await responsePromise;
  expect(response.ok(), "Zawieszenie dedykowanej szkoły testowej powinno się powieść").toBe(true);
  await expect(dialog).toHaveCount(0);
  fixture.inactive = true;
  await saveSchoolCache();
  return fixture;
}
