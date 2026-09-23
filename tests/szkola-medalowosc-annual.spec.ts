import { test, expect } from "./support/fixtures";

import { Octopus } from "./support/octopus";

import { getSchoolMedalApiData, openMedalSchool } from "./support/school-medal";

import { OCTOPUS_ENV } from "./support/environment";

import {
  GOLD_SCHOOL,
  SILVER_SCHOOL,
  BRONZE_SCHOOL,
  NO_MEDAL_SCHOOL,
} from "./support/school-medal-data";

import {
  ANNUAL_MEDAL_TARGET_PROCESS_DATE,
  buildAnnualMedalSnapshot,
  buildRandomAnnualMedalSnapshot,
} from "./support/school-medal-annual";

import { mkdir, readFile, writeFile } from "node:fs/promises";

const ANNUAL_MEDAL_SNAPSHOT_PATH = `tests/data/medalowosc-annual-2026-${OCTOPUS_ENV}.json`;

async function loadAnnualMedalSnapshotForCurrentEnvironment() {
  const raw = await readFile(ANNUAL_MEDAL_SNAPSHOT_PATH, "utf8");

  const snapshot = JSON.parse(raw);

  expect(
    snapshot.schemaVersion,
    `Snapshot ${ANNUAL_MEDAL_SNAPSHOT_PATH} powinien mieć schemaVersion = 1`,
  ).toBe(1);

  expect(
    snapshot.targetProcessDate,
    `Snapshot ${ANNUAL_MEDAL_SNAPSHOT_PATH} powinien mieć targetProcessDate`,
  ).toBeTruthy();

  expect(
    Array.isArray(snapshot.schools),
    `Snapshot ${ANNUAL_MEDAL_SNAPSHOT_PATH} powinien zawierać tablicę schools`,
  ).toBeTruthy();

  expect(
    snapshot.schools.length,
    `Snapshot ${ANNUAL_MEDAL_SNAPSHOT_PATH} nie może być pusty`,
  ).toBeGreaterThan(0);

  console.log(
    `Snapshot dla środowiska ${OCTOPUS_ENV.toUpperCase()}: ` +
      ANNUAL_MEDAL_SNAPSHOT_PATH,
  );

  return snapshot;
}

test.describe("Roczne przeliczenie medalowości @annual-medal", () => {
  test("MED-YEAR-PREP-08: przygotuj snapshot 4 szkół referencyjnych i 50 losowych szkół", async ({
    page,
  }) => {
    test.setTimeout(10 * 60 * 1000);

    const app = new Octopus(page);

    const referenceSchools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    console.log("MED-YEAR-PREP-08: przygotowuję 4 szkoły referencyjne...");

    const referenceSnapshot = await buildAnnualMedalSnapshot(
      app,
      referenceSchools,
      ANNUAL_MEDAL_TARGET_PROCESS_DATE,
    );

    console.log("MED-YEAR-PREP-08: losuję 50 dodatkowych szkół...");

    const randomSnapshot = await buildRandomAnnualMedalSnapshot(
      app,
      50,
      referenceSchools.map((school) => school.id),
      ANNUAL_MEDAL_TARGET_PROCESS_DATE,
    );

    const schools = [...referenceSnapshot, ...randomSnapshot];

    expect(
      schools,
      "Snapshot powinien zawierać 4 szkoły referencyjne i 50 losowych",
    ).toHaveLength(54);

    const ids = schools.map((entry) => entry.school.id);

    expect(
      new Set(ids).size,
      "W snapshotcie nie powinno być duplikatów szkół",
    ).toBe(ids.length);

    const medalCounts = {
      Złoto: 0,
      Srebro: 0,
      Brąz: 0,
      Brak: 0,
    };

    const transitions = new Map<string, number>();

    for (const entry of schools) {
      medalCounts[entry.expectedMedal]++;

      const transition = `${entry.currentMedal} → ${entry.expectedMedal}`;

      transitions.set(transition, (transitions.get(transition) ?? 0) + 1);
    }

    console.log(
      "MED-YEAR-PREP-08: rozkład oczekiwanych medali:",
      JSON.stringify(medalCounts, null, 2),
    );

    console.log("MED-YEAR-PREP-08: wykryte przejścia:");

    for (const [transition, count] of transitions) {
      console.log(`  ${transition}: ${count}`);
    }

    console.log("MED-YEAR-PREP-08: wylosowane szkoły:");

    for (const entry of randomSnapshot) {
      console.log(
        `  ${entry.school.id} "${entry.school.name}": ` +
          `${entry.currentMedal} → ${entry.expectedMedal}; ` +
          `przedmioty=${JSON.stringify(entry.qualifyingSubjectLevels)}`,
      );
    }

    const output = {
      schemaVersion: 1,

      generatedAt: new Date().toISOString(),

      targetProcessDate: ANNUAL_MEDAL_TARGET_PROCESS_DATE,

      selection: {
        referenceSchoolCount: referenceSnapshot.length,

        randomSchoolCount: randomSnapshot.length,

        totalSchoolCount: schools.length,

        randomSelection: true,
      },

      schools,
    };

    await mkdir("tests/data", {
      recursive: true,
    });

    const outputPath = ANNUAL_MEDAL_SNAPSHOT_PATH;

    await writeFile(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

    console.log(`MED-YEAR-PREP-08: środowisko ${OCTOPUS_ENV.toUpperCase()}.`);

    console.log(`MED-YEAR-PREP-08: snapshot zapisany: ${outputPath}`);

    console.log(
      `MED-YEAR-PREP-08: zapisano ${schools.length} szkół: ` +
        `${referenceSnapshot.length} referencyjne + ` +
        `${randomSnapshot.length} losowych.`,
    );
  });
});

test("MED-YEAR-01: roczne przeliczenie ustawia oczekiwany medal na podstawie snapshotu @annual-medal", async ({
  page,
}) => {
  test.setTimeout(10 * 60 * 1000);

  const app = new Octopus(page);

  const snapshot = await loadAnnualMedalSnapshotForCurrentEnvironment();

  const today = new Date().toISOString().slice(0, 10);

  test.skip(
    today < snapshot.targetProcessDate,

    `Test można uruchomić dopiero ${snapshot.targetProcessDate} ` +
      "po wykonaniu rocznego przeliczenia medalowości",
  );

  console.log(`MED-YEAR-01: środowisko ${OCTOPUS_ENV.toUpperCase()}.`);

  console.log(`MED-YEAR-01: używany snapshot: ${ANNUAL_MEDAL_SNAPSHOT_PATH}`);

  console.log(`MED-YEAR-01: snapshot wygenerowany ${snapshot.generatedAt}`);

  console.log(`MED-YEAR-01: sprawdzam ${snapshot.schools.length} szkół`);

  let passed = 0;

  for (let i = 0; i < snapshot.schools.length; i++) {
    const entry = snapshot.schools[i];

    const medalData = await getSchoolMedalApiData(app, entry.school);

    console.log(
      `MED-YEAR-01: ${i + 1}/${snapshot.schools.length} ` +
        `${entry.school.id} "${entry.school.name}": ` +
        `${entry.currentMedal} → ` +
        `oczekiwany ${entry.expectedMedal} → ` +
        `faktyczny ${medalData.medalCategoryName}`,
    );

    expect(
      medalData.medalCategoryName,

      `Szkoła ${entry.school.id} "${entry.school.name}" ` +
        `powinna po rocznym przeliczeniu mieć medal ${entry.expectedMedal}. ` +
        `Przed przeliczeniem miała ${entry.currentMedal}.`,
    ).toBe(entry.expectedMedal);

    passed++;
  }

  console.log(
    `MED-YEAR-01: poprawnie zweryfikowano ` +
      `${passed}/${snapshot.schools.length} szkół.`,
  );
});
