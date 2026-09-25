import { test as base, expect } from "./scenario";
import { GOLD_SCHOOL, SILVER_SCHOOL } from "./school-medal-data";

type SharedSchool = {
  id: string;
  name: string;
};

// Testy edycji nie badają tworzenia szkoły. Korzystają ze stabilnej szkoły
// referencyjnej właściwej dla aktualnego środowiska, a relację nauczyciela
// tworzy API factory razem z nauczycielem.
export const test = base.extend<
  Record<never, never>,
  { school: SharedSchool; secondSchool: SharedSchool }
>({
  school: [
    async ({}, use) => {
      await use({
        id: GOLD_SCHOOL.id,
        name: GOLD_SCHOOL.name,
      });
    },
    { scope: "worker" },
  ],
  secondSchool: [
    async ({}, use) => {
      await use({
        id: SILVER_SCHOOL.id,
        name: SILVER_SCHOOL.name,
      });
    },
    { scope: "worker" },
  ],
});

export { expect };
