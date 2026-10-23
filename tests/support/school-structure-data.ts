import { automaticSchoolName, shortTestToken } from "../../scripts/test-names.mjs";
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
  | "specCopyGroup"
  | "specCopyPrimary"
  | "specCopySecondary"
  | "specCopyTechnical"
  | "specCopyOtherGroup"
  | "specCopyOtherPrimary"
  | "specCopyStandalone"
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

const definitions: Record<StructureSchoolKey, StructureSchoolDefinition> = {
  specCopyGroup: { name: automaticSchoolName("STR", "CP_ZS", OCTOPUS_ENV), type: "Zespół szkół" },
  specCopyPrimary: {
    name: automaticSchoolName("STR", "CP_SP", OCTOPUS_ENV),
    type: "Szkoła podstawowa",
  },
  specCopySecondary: { name: automaticSchoolName("STR", "CP_LO", OCTOPUS_ENV), type: "Liceum" },
  specCopyTechnical: {
    name: automaticSchoolName("STR", "CP_TECH", OCTOPUS_ENV),
    type: "Technikum",
  },
  specCopyOtherGroup: {
    name: automaticSchoolName("STR", "CP_ZSB", OCTOPUS_ENV),
    type: "Zespół szkół",
  },
  specCopyOtherPrimary: {
    name: automaticSchoolName("STR", "CP_SPB", OCTOPUS_ENV),
    type: "Szkoła podstawowa",
  },
  specCopyStandalone: {
    name: automaticSchoolName("STR", "CP_SOLO", OCTOPUS_ENV),
    type: "Szkoła podstawowa",
  },
  copyGroup: { name: automaticSchoolName("STR", "C_ZS", OCTOPUS_ENV), type: "Zespół szkół" },
  copyPrimary: { name: automaticSchoolName("STR", "C_SP", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  copySecondary: { name: automaticSchoolName("STR", "C_LO", OCTOPUS_ENV), type: "Liceum" },
  copyTechnical: { name: automaticSchoolName("STR", "C_TECH", OCTOPUS_ENV), type: "Technikum" },
  copyOtherGroup: { name: automaticSchoolName("STR", "C_ZSB", OCTOPUS_ENV), type: "Zespół szkół" },
  copyOtherPrimary: {
    name: automaticSchoolName("STR", "C_SPB", OCTOPUS_ENV),
    type: "Szkoła podstawowa",
  },
  copyStandalone: {
    name: automaticSchoolName("STR", "C_SOLO", OCTOPUS_ENV),
    type: "Szkoła podstawowa",
  },
  addBranch: {
    name: automaticSchoolName("STR", "ADD_FIL", OCTOPUS_ENV),
    type: "Szkoła podstawowa",
  },
  addMain: { name: automaticSchoolName("STR", "ADD_MAIN", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  addGroup: { name: automaticSchoolName("STR", "ADD_ZS", OCTOPUS_ENV), type: "Zespół szkół" },
  group: { name: automaticSchoolName("STR", "ZS1", OCTOPUS_ENV), type: "Zespół szkół" },
  group2: { name: automaticSchoolName("STR", "ZS2", OCTOPUS_ENV), type: "Zespół szkół" },
  inactive: { name: automaticSchoolName("STR", "OFF", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  primary: { name: automaticSchoolName("STR", "SP", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  secondary: { name: automaticSchoolName("STR", "LO", OCTOPUS_ENV), type: "Liceum" },
  preschool: { name: automaticSchoolName("STR", "PP", OCTOPUS_ENV), type: "Przedszkole" },
  main: { name: automaticSchoolName("STR", "MAIN", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  branch: { name: automaticSchoolName("STR", "FIL", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  nodeC: { name: automaticSchoolName("STR", "C", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  nodeD: { name: automaticSchoolName("STR", "D", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  nodeE: { name: automaticSchoolName("STR", "E", OCTOPUS_ENV), type: "Szkoła podstawowa" },
  nodeF: { name: automaticSchoolName("STR", "F", OCTOPUS_ENV), type: "Szkoła podstawowa" },
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
    if (school?.id && school.name === definitions[key as StructureSchoolKey]?.name) {
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
    name: definitions[key].name + (namespace ? `_${shortTestToken(namespace)}` : ""),
  });
  const api = await fixtureSchools(page);
  const found = await api.findMany(
    keys.map((key) => ({ ...definitionFor(key), id: cache.get(key)?.id })),
  );
  const entries: Array<readonly [StructureSchoolKey, StructureSchool]> = [];
  const prepare = async (setup?: Octopus) => {
    for (const [index, key] of keys.entries()) {
      const existing = found[index];
      let school: StructureSchool;
      if (existing) {
        school = { id: existing.id, name: existing.name };
        if (!existing.tested) {
          await setup!.openPanel("school", existing.id);
          await setup!.markTestRecord();
        }
      } else {
        const definition = definitionFor(key);
        const id = await setup!.createSchool(definition.name, `STR-${Date.now()}`, definition.type);
        await setup!.markTestRecord();
        school = { id, name: definition.name };
      }
      cache.set(key, school);
      entries.push([key, school]);
    }
  };
  // One isolated browser/context for this batch, rather than downloading the
  // application and restoring the session separately for every new school.
  // Keep writes sequential; already verified records need no setup browser.
  if (found.some((school) => !school || !school.tested)) {
    await backgroundSchoolSetup(page, prepare);
  } else {
    await prepare();
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
