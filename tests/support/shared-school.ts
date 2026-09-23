import { expect, type Browser, type Page } from "@playwright/test";
import { ensureSession, restoreSession } from "../../scripts/auth.mjs";
import { test as base } from "./scenario";
import { OCTOPUS_ENV } from "./environment";
import { Octopus, typeValue } from "./octopus";

type SharedSchool = {
  id: string;
  name: string;
};

const sharedSchoolName = `AUTOMAT TEACHER ${OCTOPUS_ENV.toUpperCase()} SP`;

async function findSchool(page: Page, app: Octopus) {
  await app.openPanel("school");

  const search = await app.openSearch("school");
  await typeValue(app.field(search, "Nazwa szkoły"), sharedSchoolName);
  await search.getByRole("button", { name: "Szukaj", exact: true }).click();

  const noResults = page.locator("mat-dialog-container").filter({
    hasText: "Brak wyników wyszukiwania",
  });
  const row = app
    .results("school")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", { name: sharedSchoolName, exact: true }),
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

async function prepareSharedSchool(browser: Browser): Promise<SharedSchool> {
  const auth = await ensureSession();
  const context = await browser.newContext({ storageState: auth.storageState });

  try {
    await restoreSession(context, auth.session);

    const page = await context.newPage();
    await page.goto(`${auth.session.origin}/teacher/teacher-panel`);
    await expect(page.getByRole("button", { name: "Wyloguj", exact: true })).toBeVisible();

    const app = new Octopus(page);
    const existingId = await findSchool(page, app);

    if (existingId) return { id: existingId, name: sharedSchoolName };

    const id = await app.createSchool(sharedSchoolName, String(Date.now()));
    await app.markTestRecord();

    return { id, name: sharedSchoolName };
  } finally {
    await context.close();
  }
}

export const test = base.extend<Record<never, never>, { school: SharedSchool }>({
  school: [
    async ({ browser }, use) => {
      await use(await prepareSharedSchool(browser));
    },
    { scope: "worker" },
  ],
});

export { expect };
