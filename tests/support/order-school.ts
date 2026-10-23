import { automaticSchoolName } from "../../scripts/test-names.mjs";
import { type Page } from "@playwright/test";

import { fixtureSchools } from "./fixture-schools";
import { backgroundSchoolSetup } from "./background-school-setup";
import { OCTOPUS_ENV } from "./environment";
import { Octopus } from "./octopus";

export type OrderTestSchool = {
  id: string;
  name: string;
};

export type OrderTestSchoolKey = "primary" | "secondary" | "teacherPrimary" | "teacherSecondary";

function orderWorkerSuffix(): string {
  const parallelIndex = process.env.TEST_PARALLEL_INDEX ?? process.env.TEST_WORKER_INDEX ?? "0";

  return `W${parallelIndex}`;
}

function definitionFor(key: OrderTestSchoolKey): { name: string } {
  const worker = orderWorkerSuffix();
  const roles: Record<OrderTestSchoolKey, string> = {
    primary: "A",
    secondary: "B",
    teacherPrimary: "A",
    teacherSecondary: "B",
  };
  return {
    name: automaticSchoolName(
      key.startsWith("teacher") ? "QA" : "ORD",
      `${roles[key]}_${worker}`,
      OCTOPUS_ENV,
    ),
  };
}

const cachedSchools = new Map<OrderTestSchoolKey, OrderTestSchool>();

export async function ensureOrderTestSchool(
  page: Page,
  app: Octopus,
  key: OrderTestSchoolKey = "primary",
  openPanel = true,
): Promise<OrderTestSchool> {
  const definition = definitionFor(key);
  const api = await fixtureSchools(page);
  const [found] = await api.findMany([
    { ...definition, type: "Szkoła podstawowa", id: cachedSchools.get(key)?.id },
  ]);
  let school: OrderTestSchool;
  if (found) {
    school = { id: found.id, name: found.name };
    if (!found.tested) {
      await backgroundSchoolSetup(page, async (setup) => {
        await setup.openPanel("school", found.id);
        await setup.markTestRecord();
      });
    }
  } else {
    const id = await backgroundSchoolSetup(page, async (setup) => {
      const id = await setup.createSchool(definition.name, String(Date.now()), "Szkoła podstawowa");
      await setup.markTestRecord();
      return id;
    });
    school = { id, name: definition.name };
  }
  cachedSchools.set(key, school);
  // Nawigacja jest potrzebna tylko scenariuszom zaczynającym od profilu szkoły.
  if (openPanel) await app.openPanel("school", school.id);
  return school;
}
