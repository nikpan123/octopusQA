import { test as base, expect } from "./fixtures";
import { MEDAL_DATA, type MedalReferenceSchool } from "./school-medal-data";
import { fixtureSchools } from "./fixture-schools";

// Każda referencja jest zależnością tylko tych scenariuszy, które jej używają.
// Oczekiwanych medali, przedmiotów i historii nie wyliczamy z odpowiedzi badanego API.
export const test = base.extend<{
  GOLD_SCHOOL: MedalReferenceSchool;
  SILVER_SCHOOL: MedalReferenceSchool;
  BRONZE_SCHOOL: MedalReferenceSchool;
  NO_MEDAL_SCHOOL: MedalReferenceSchool;
}>({
  GOLD_SCHOOL: async ({ page }, use) => {
    await use({
      ...MEDAL_DATA.gold,
      ...(await (await fixtureSchools(page)).reference(MEDAL_DATA.gold)),
    });
  },
  SILVER_SCHOOL: async ({ page }, use) => {
    await use({
      ...MEDAL_DATA.silver,
      ...(await (await fixtureSchools(page)).reference(MEDAL_DATA.silver)),
    });
  },
  BRONZE_SCHOOL: async ({ page }, use) => {
    await use({
      ...MEDAL_DATA.bronze,
      ...(await (await fixtureSchools(page)).reference(MEDAL_DATA.bronze)),
    });
  },
  NO_MEDAL_SCHOOL: async ({ page }, use) => {
    await use({
      ...MEDAL_DATA.noMedal,
      ...(await (await fixtureSchools(page)).reference(MEDAL_DATA.noMedal)),
    });
  },
});

export { expect };
