import { expect, request, type Browser, type BrowserContext } from "@playwright/test";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureSession, restoreSession } from "../../scripts/auth.mjs";
import { test as base } from "./scenario";
import { fixtureSchoolsFromState } from "./fixture-schools";
import { OCTOPUS_ENV } from "./environment";
import { Octopus } from "./octopus";
import { launchBackgroundBrowser } from "../../scripts/background-browser.mjs";
import { rememberBrowserSession } from "./browser-session";

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

async function prepareClubSchools(browser: Browser): Promise<ClubSchools> {
  const cached = await readSchoolCache();
  const auth = await ensureSession();
  // Sam GET nie potrzebuje przeglądarki ani nawet pustej karty.
  const apiRequest = await request.newContext();
  let setupBrowser: Browser | undefined;
  let closeSetupBrowser: (() => Promise<void>) | undefined;
  let context: BrowserContext | undefined;
  let setupApp: Octopus | undefined;
  const appForRepair = async () => {
    if (!setupApp) {
      // Rzadkie tworzenie/oznaczanie fixture też nie powinno pokazywać dodatkowych kart.
      const background = await launchBackgroundBrowser(browser.browserType());
      setupBrowser = background.browser;
      closeSetupBrowser = background.close;
      context = await setupBrowser.newContext({ storageState: auth.storageState });
      rememberBrowserSession(context, auth.storageState);
      await restoreSession(context, auth.session);
      setupApp = new Octopus(await context.newPage());
    }
    return setupApp;
  };
  try {
    const api = fixtureSchoolsFromState(apiRequest, auth.storageState);
    const matches = await api.findMany(
      schoolKeys.map((key) => ({ ...schoolDefinitions[key], id: cached?.schools[key].id })),
    );
    const resolved = {} as ClubSchools;
    for (const [index, key] of schoolKeys.entries()) {
      const definition = schoolDefinitions[key];
      const found = matches[index];
      if (found) {
        resolved[key] = { ...definition, id: found.id };
        if (!found.tested) {
          const app = await appForRepair();
          await app.openPanel("school", found.id);
          await app.markTestRecord();
        }
      } else {
        const app = await appForRepair();
        const id = await app.createSchool(definition.name, String(Date.now()), definition.type);
        await app.markTestRecord();
        resolved[key] = { ...definition, id };
      }
    }
    await writeSchoolCache(resolved);
    console.log(
      `Szkoły CLUB ${OCTOPUS_ENV.toUpperCase()}: ID i dane zweryfikowano przez API, bez nawigacji przygotowawczej.`,
    );
    return resolved;
  } finally {
    try {
      await closeSetupBrowser?.();
    } finally {
      await apiRequest.dispose();
    }
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
