import { expect, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { fixtureSchools } from "./fixture-schools";
import { backgroundSchoolSetup } from "./background-school-setup";
import { OCTOPUS_ENV } from "./environment";
import { Octopus } from "./octopus";
import type { StructureSchool } from "./school-structure";
import type { StructureApi } from "./school-structure-api";

export type StructureSchoolKey =
<<<<<<< Updated upstream
=======
  | "specCopyGroup"
  | "specCopyPrimary"
  | "specCopySecondary"
  | "specCopyTechnical"
  | "specCopyOtherGroup"
  | "specCopyOtherPrimary"
  | "specCopyStandalone"
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  specCopyGroup: { name: `AUTO_STR_${environment}_COPY_SPEC35980_ZESPOL_A`, type: "Zespół szkół" },
  specCopyPrimary: {
    name: `AUTO_STR_${environment}_COPY_SPEC35980_SP_A`,
    type: "Szkoła podstawowa",
  },
  specCopySecondary: { name: `AUTO_STR_${environment}_COPY_SPEC35980_LO_A`, type: "Liceum" },
  specCopyTechnical: { name: `AUTO_STR_${environment}_COPY_SPEC35980_TECH_A`, type: "Technikum" },
  specCopyOtherGroup: {
    name: `AUTO_STR_${environment}_COPY_SPEC35980_ZESPOL_B`,
    type: "Zespół szkół",
  },
  specCopyOtherPrimary: {
    name: `AUTO_STR_${environment}_COPY_SPEC35980_SP_B`,
    type: "Szkoła podstawowa",
  },
  specCopyStandalone: {
    name: `AUTO_STR_${environment}_COPY_SPEC35980_SAMODZIELNA`,
    type: "Szkoła podstawowa",
  },
>>>>>>> Stashed changes
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
const scopedSchoolCaches = new Map<string, Map<StructureSchoolKey, StructureSchool>>();
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

export async function ensureStructureTestSchool(
  page: Page,
  app: Octopus,
  key: StructureSchoolKey,
): Promise<StructureSchool> {
  return (await ensureStructureTestSchools(page, app, [key]))[key]!;
}

export async function ensureStructureTestSchools(
  page: Page,
  app: Octopus,
  keys: StructureSchoolKey[],
  namespace = "",
) {
  if (namespace && !/^[A-Za-z0-9_]{1,48}$/.test(namespace))
    throw new Error("Niepoprawna przestrzeń danych szkół testowych.");
  await loadSchoolCache();
  if (namespace && !scopedSchoolCaches.has(namespace)) scopedSchoolCaches.set(namespace, new Map());
  const cache = namespace ? scopedSchoolCaches.get(namespace)! : cachedSchools;
  const definitionFor = (key: StructureSchoolKey) => ({
    ...definitions[key],
    name: definitions[key].name + (namespace ? `_RUN_${namespace}` : ""),
  });
  const api = await fixtureSchools(page);
  const found = await api.findMany(
    keys.map((key) => ({ ...definitionFor(key), id: cache.get(key)?.id })),
  );
  const entries: Array<readonly [StructureSchoolKey, StructureSchool]> = [];
  for (const [index, key] of keys.entries()) {
    const existing = found[index];
    let school: StructureSchool;
    if (existing) {
      school = { id: existing.id, name: existing.name };
      if (!existing.tested) {
        await backgroundSchoolSetup(page, async (setup) => {
          await setup.openPanel("school", existing.id);
          await setup.markTestRecord();
        });
      }
    } else {
      const definition = definitionFor(key);
      const id = await backgroundSchoolSetup(page, async (setup) => {
        const id = await setup.createSchool(definition.name, `STR-${Date.now()}`, definition.type);
        await setup.markTestRecord();
        return id;
      });
      school = { id, name: definition.name };
    }
    cache.set(key, school);
    entries.push([key, school]);
  }
  if (!namespace) await saveSchoolCache();
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
  await backgroundSchoolSetup(page, async (setup) => {
    const page = setup.page;
    await setup.openPanel("school", fixture.id);
    await page.getByRole("button", { name: "Zawieś", exact: true }).click();
    const dialog = setup.dialog("Zawieszanie szkoły");
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
  });
  fixture.inactive = true;
  await saveSchoolCache();
  return fixture;
}
