import { expect, type Browser, type Page } from "@playwright/test";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureSession, restoreSession } from "../../scripts/auth.mjs";
import { test as base } from "./scenario";
import { OCTOPUS_ENV } from "./environment";
import { Octopus, typeValue } from "./octopus";

export type ClubSchool = {
  id: string;
  name: string;
  type: "Szkoła podstawowa" | "Liceum";
};

export type ClubSchools = {
  spA: ClubSchool;
  spB: ClubSchool;
  secondary: ClubSchool;
};

type ClubSchoolKey = keyof ClubSchools;

type ClubSchoolCache = {
  version: 1;
  environment: string;
  validatedAt: string;
  schools: ClubSchools;
};

const schoolKeys: ClubSchoolKey[] = ["spA", "spB", "secondary"];
const cacheLifetimeMs = 24 * 60 * 60 * 1_000;
const cacheFile = path.resolve("playwright", ".auth", OCTOPUS_ENV, "club-schools.json");

const schoolDefinitions = {
  spA: {
    name: `AUTOMAT CLUB ${OCTOPUS_ENV.toUpperCase()} SP A`,
    type: "Szkoła podstawowa",
  },
  spB: {
    name: `AUTOMAT CLUB ${OCTOPUS_ENV.toUpperCase()} SP B`,
    type: "Szkoła podstawowa",
  },
  secondary: {
    name: `AUTOMAT CLUB ${OCTOPUS_ENV.toUpperCase()} SŚ`,
    type: "Liceum",
  },
} as const;

function validCachedSchool(
  value: unknown,
  definition: (typeof schoolDefinitions)[ClubSchoolKey],
): value is ClubSchool {
  if (!value || typeof value !== "object") return false;
  const school = value as Partial<ClubSchool>;
  return (
    typeof school.id === "string" &&
    /^\d+$/.test(school.id) &&
    school.name === definition.name &&
    school.type === definition.type
  );
}

async function readSchoolCache(): Promise<ClubSchoolCache | null> {
  const cache = await readFile(cacheFile, "utf8")
    .then((content) => JSON.parse(content) as Partial<ClubSchoolCache>)
    .catch((error) => {
      if (error.code === "ENOENT" || error instanceof SyntaxError) return null;
      throw error;
    });

  if (
    !cache ||
    cache.version !== 1 ||
    cache.environment !== OCTOPUS_ENV ||
    typeof cache.validatedAt !== "string" ||
    !cache.schools
  ) {
    return null;
  }

  for (const key of schoolKeys) {
    if (!validCachedSchool(cache.schools[key], schoolDefinitions[key])) return null;
  }

  return cache as ClubSchoolCache;
}

async function writeSchoolCache(schools: ClubSchools) {
  await mkdir(path.dirname(cacheFile), { recursive: true });
  const temporary = `${cacheFile}.${process.pid}.tmp`;
  const cache: ClubSchoolCache = {
    version: 1,
    environment: OCTOPUS_ENV,
    validatedAt: new Date().toISOString(),
    schools,
  };

  await writeFile(temporary, JSON.stringify(cache, null, 2), { mode: 0o600 });
  await rename(temporary, cacheFile);
}

function cacheIsFresh(cache: ClubSchoolCache) {
  const validatedAt = Date.parse(cache.validatedAt);
  return Number.isFinite(validatedAt) && Date.now() - validatedAt < cacheLifetimeMs;
}

async function findSchool(page: Page, app: Octopus, name: string) {
  await app.openPanel("school");

  const search = await app.openSearch("school");
  await typeValue(app.field(search, "Nazwa szkoły"), name);
  await search.getByRole("button", { name: "Szukaj", exact: true }).click();

  const noResults = page.locator("mat-dialog-container").filter({
    hasText: "Brak wyników wyszukiwania",
  });
  const row = app
    .results("school")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", { name, exact: true }),
    });

  await expect.poll(async () => (await noResults.count()) + (await row.count())).toBeGreaterThan(0);

  if (await noResults.count()) {
    await noResults.getByRole("button", { name: "OK", exact: true }).click();
    await expect(noResults).toHaveCount(0);
    return null;
  }

  await expect(row).toHaveCount(1);
  await row.click();
  await expect(page).toHaveURL(/\/school\/school-panel\/\d+$/);

  return page.url().split("/").pop()!;
}

async function findOrCreateSchool(
  page: Page,
  app: Octopus,
  definition: (typeof schoolDefinitions)[keyof typeof schoolDefinitions],
): Promise<ClubSchool> {
  const existingId = await findSchool(page, app, definition.name);

  if (existingId) {
    return { ...definition, id: existingId };
  }

  const id = await app.createSchool(definition.name, String(Date.now()), definition.type);
  await app.markTestRecord();

  return { ...definition, id };
}

async function validateCachedSchool(
  app: Octopus,
  school: ClubSchool,
  definition: (typeof schoolDefinitions)[ClubSchoolKey],
) {
  try {
    await app.openPanel("school", school.id);
    await expect(app.detail("name")).toHaveValue(definition.name);
    return { ...definition, id: school.id };
  } catch {
    return null;
  }
}

async function prepareClubSchools(browser: Browser): Promise<ClubSchools> {
  const cached = await readSchoolCache();

  if (cached && cacheIsFresh(cached)) {
    console.log(`Szkoły CLUB ${OCTOPUS_ENV.toUpperCase()}: użyto zapamiętanych ID.`);
    return cached.schools;
  }

  const auth = await ensureSession();
  const context = await browser.newContext({ storageState: auth.storageState });

  try {
    await restoreSession(context, auth.session);

    const page = await context.newPage();
    await page.goto(`${auth.session.origin}/teacher/teacher-panel`);
    await expect(page.getByRole("button", { name: "Wyloguj", exact: true })).toBeVisible();

    const app = new Octopus(page);
    const resolved = {} as ClubSchools;

    for (const key of schoolKeys) {
      const fromCache = cached
        ? await validateCachedSchool(app, cached.schools[key], schoolDefinitions[key])
        : null;

      resolved[key] = fromCache ?? (await findOrCreateSchool(page, app, schoolDefinitions[key]));
    }

    await writeSchoolCache(resolved);
    console.log(
      `Szkoły CLUB ${OCTOPUS_ENV.toUpperCase()}: ${cached ? "odświeżono" : "utworzono"} cache ID.`,
    );
    return resolved;
  } finally {
    await context.close();
  }
}

export const test = base.extend<Record<never, never>, { clubSchools: ClubSchools }>({
  clubSchools: [
    async ({ browser }, use) => {
      await use(await prepareClubSchools(browser));
    },
    { scope: "worker" },
  ],

  scenario: async ({ scenario, clubSchools }, use) => {
    const schoolById = new Map(Object.values(clubSchools).map((school) => [school.id, school]));
    let activeSchool = clubSchools.spA;

    await use({
      ...scenario,
      get schoolName() {
        return activeSchool.name;
      },
      createSchool: async (schoolType) => {
        const school = schoolType === "Liceum" ? clubSchools.secondary : clubSchools.spA;
        activeSchool = school;

        await scenario.record("schoolName", school.name);
        await scenario.record("schoolId", school.id);
        await scenario.record("relatedSchoolName", school.name);

        return school.id;
      },
      createTeacher: async (schoolId, relatedSchoolName, options) => {
        const schoolName =
          relatedSchoolName ?? schoolById.get(schoolId)?.name ?? clubSchools.spA.name;

        const resolvedOptions = {
          ...options,
          subjectLevels: options?.subjectLevels ?? [
            { subject: "Matematyka", level: "Szkoła Podstawowa" },
          ],
        };

        return scenario.createTeacher(schoolId, schoolName, resolvedOptions);
      },
    });
  },
});

export { expect };
