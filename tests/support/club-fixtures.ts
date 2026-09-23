import { expect, type Browser, type Page } from "@playwright/test";
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

async function prepareClubSchools(browser: Browser): Promise<ClubSchools> {
  const auth = await ensureSession();
  const context = await browser.newContext({ storageState: auth.storageState });

  try {
    await restoreSession(context, auth.session);

    const page = await context.newPage();
    await page.goto(`${auth.session.origin}/teacher/teacher-panel`);
    await expect(page.getByRole("button", { name: "Wyloguj", exact: true })).toBeVisible();

    const spA = await findOrCreateSchool(page, new Octopus(page), schoolDefinitions.spA);
    const spB = await findOrCreateSchool(page, new Octopus(page), schoolDefinitions.spB);
    const secondary = await findOrCreateSchool(
      page,
      new Octopus(page),
      schoolDefinitions.secondary,
    );

    return { spA, spB, secondary };
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

    await use({
      ...scenario,
      schoolName: clubSchools.spA.name,
      createSchool: async (schoolType) => {
        const school = schoolType === "Liceum" ? clubSchools.secondary : clubSchools.spA;

        await scenario.record("schoolName", school.name);
        await scenario.record("schoolId", school.id);
        await scenario.record("relatedSchoolName", school.name);

        return school.id;
      },
      createTeacher: async (schoolId, relatedSchoolName) => {
        const schoolName =
          relatedSchoolName ?? schoolById.get(schoolId)?.name ?? clubSchools.spA.name;

        return scenario.createTeacher(schoolId, schoolName);
      },
    });
  },
});

export { expect };
