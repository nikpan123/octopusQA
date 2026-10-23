import { test as base, expect } from "./scenario";
import { ensureOrderTestSchool } from "./order-school";

type SharedSchool = {
  id: string;
  name: string;
};

// Szkoły są odszukiwane lub przygotowywane na bieżącym środowisku.
// ID jest sprawdzane ponownie także po odświeżeniu bazy.
export const test = base.extend<{ school: SharedSchool; secondSchool: SharedSchool }>({
  school: async ({ page, scenario }, use) => {
    await use(await ensureOrderTestSchool(page, scenario.app, "teacherPrimary", false));
  },
  secondSchool: async ({ page, scenario }, use) => {
    await use(await ensureOrderTestSchool(page, scenario.app, "teacherSecondary", false));
  },
});

export { expect };
