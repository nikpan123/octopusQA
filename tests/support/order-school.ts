import { expect, type Page } from "@playwright/test";

import { OCTOPUS_ENV } from "./environment";
import { Octopus, typeValue } from "./octopus";

export type OrderTestSchool = {
  id: string;
  name: string;
};

export type OrderTestSchoolKey = "primary" | "secondary";

const definitions: Record<OrderTestSchoolKey, { name: string }> = {
  primary: {
    name: `AUTO_ORD_REFERENCE_${OCTOPUS_ENV.toUpperCase()}`,
  },
  secondary: {
    name: `AUTO_ORD_REFERENCE_${OCTOPUS_ENV.toUpperCase()}_B`,
  },
};

const cachedSchools = new Map<OrderTestSchoolKey, OrderTestSchool>();

async function searchExactSchool(
  page: Page,
  app: Octopus,
  name: string,
): Promise<OrderTestSchool | null> {
  await app.openPanel("school");

  const search = await app.openSearch("school");
  await typeValue(app.field(search, "Nazwa szkoły"), name);

  await search.getByRole("button", {
    name: "Szukaj",
    exact: true,
  }).click();

  await expect(search).toHaveCount(0);

  const empty = page
    .locator("mat-dialog-container")
    .filter({ hasText: "Brak wyników wyszukiwania" });

  const exactRow = app
    .results("school")
    .getByRole("row")
    .filter({
      has: page.getByRole("gridcell", {
        name,
        exact: true,
      }),
    });

  const state = async () => {
    if (await empty.isVisible().catch(() => false)) {
      return "EMPTY";
    }

    const count = await exactRow.count();
    if (count > 0) {
      return `FOUND:${count}`;
    }

    return "WAITING";
  };

  await expect
    .poll(state, {
      timeout: 20_000,
      message: `Wyszukiwanie szkoły referencyjnej „${name}” powinno się zakończyć`,
    })
    .not.toBe("WAITING");

  if (await empty.isVisible().catch(() => false)) {
    await empty.getByRole("button", {
      name: "OK",
      exact: true,
    }).click();

    await expect(empty).toHaveCount(0);

    return null;
  }

  await expect(
    exactRow,
    `Powinna istnieć najwyżej jedna szkoła referencyjna „${name}”`,
  ).toHaveCount(1);

  await exactRow.click();

  await expect(page).toHaveURL(/\/school\/school-panel\/\d+$/);
  await expect(app.detail("name")).toHaveValue(name);

  const id = page.url().split("/").pop() ?? "";
  expect(id).toMatch(/^\d+$/);

  return {
    id,
    name,
  };
}

export async function ensureOrderTestSchool(
  page: Page,
  app: Octopus,
  key: OrderTestSchoolKey = "primary",
): Promise<OrderTestSchool> {
  const cached = cachedSchools.get(key);

  if (cached) {
    await app.openPanel("school", cached.id);
    await expect(app.detail("name")).toHaveValue(cached.name);
    await app.markTestRecord();
    return cached;
  }

  const definition = definitions[key];

  const existing = await searchExactSchool(
    page,
    app,
    definition.name,
  );

  if (existing) {
    await app.markTestRecord();
    cachedSchools.set(key, existing);
    return existing;
  }

  const id = await app.createSchool(
    definition.name,
    String(Date.now()),
    "Szkoła podstawowa",
  );

  await app.markTestRecord();

  const created: OrderTestSchool = {
    id,
    name: definition.name,
  };

  cachedSchools.set(key, created);

  return created;
}
