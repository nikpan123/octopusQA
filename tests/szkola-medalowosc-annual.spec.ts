import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import { getSchoolMedalApiData, openMedalSchool } from "./support/school-medal";

import {
  GOLD_SCHOOL,
  SILVER_SCHOOL,
  BRONZE_SCHOOL,
  NO_MEDAL_SCHOOL,
} from "./support/school-medal-data";
import {
  buildAnnualMedalSnapshot,
  getAnnualMedalTeacherRows,
  getAnnualMedalTeacherSubjects,
  getExpectedAnnualMedal,
  loadAnnualMedalSnapshot,
  buildRandomAnnualMedalSnapshot,
} from "./support/school-medal-annual";
import { mkdir, writeFile } from "node:fs/promises";

test.describe("Roczne przeliczenie medalowości @annual-medal", () => {
  test("MED-YEAR-PREP-01: sprawdź oznaczenie naszych przedmiotów w tabeli nauczycieli", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const teachers = await getAnnualMedalTeacherRows(page);

    expect(teachers.length, "Szkoła powinna mieć nauczycieli").toBeGreaterThan(
      0,
    );

    const diagnosticTeacherIds = ["342492", "222885", "495594", "457864"];

    const diagnosticTeachers = teachers.filter((teacher) =>
      diagnosticTeacherIds.includes(teacher.teacherId),
    );

    expect(
      diagnosticTeachers.length,
      "Powinniśmy znaleźć nauczycieli diagnostycznych",
    ).toBeGreaterThan(0);

    console.log(
      `MED-YEAR-PREP-01: szkoła ${GOLD_SCHOOL.id} "${GOLD_SCHOOL.name}"`,
    );

    for (const teacher of diagnosticTeachers) {
      console.log(JSON.stringify(teacher, null, 2));
    }
  });

  test("MED-YEAR-PREP-02: porównaj zielone przedmioty nauczycieli z aktualną medalowością szkoły", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const teacherSubjects = await getAnnualMedalTeacherSubjects(page);

    expect(
      teacherSubjects.length,
      "Powinny zostać odczytane przedmioty nauczycieli",
    ).toBeGreaterThan(0);

    const greenSubjects = teacherSubjects.filter((subject) => subject.isGreen);

    const supportingGreenSubjects = greenSubjects.filter(
      (subject) => subject.isSupportingTeacher,
    );

    const nonSupportingGreenSubjects = greenSubjects.filter(
      (subject) => !subject.isSupportingTeacher,
    );

    const uniqueNonSupportingSubjects = [
      ...new Set(
        nonSupportingGreenSubjects.map((subject) => subject.subjectLevel),
      ),
    ].sort();

    const medalData = await getSchoolMedalApiData(app, GOLD_SCHOOL);

    console.log(
      `MED-YEAR-PREP-02: szkoła ${GOLD_SCHOOL.id} "${GOLD_SCHOOL.name}"`,
    );

    console.log(
      "Wszystkie zielone przedmioty:",
      JSON.stringify(greenSubjects, null, 2),
    );

    console.log(
      "Zielone przedmioty nauczycieli wspomagających:",
      JSON.stringify(supportingGreenSubjects, null, 2),
    );

    console.log(
      "Unikalne zielone przedmioty po wykluczeniu wspomagających:",
      JSON.stringify(uniqueNonSupportingSubjects, null, 2),
    );

    console.log(
      "Aktualne subjectNames z API medalowości:",
      JSON.stringify(medalData.subjectNames, null, 2),
    );

    console.log(`Aktualny medal API: ${medalData.medalCategoryName}`);

    expect(
      greenSubjects.length,
      "Powinien istnieć co najmniej jeden zielony przedmiot",
    ).toBeGreaterThan(0);

    expect(
      supportingGreenSubjects.length,
      "Powinien istnieć zielony przedmiot nauczyciela wspomagającego",
    ).toBeGreaterThan(0);

    expect(
      uniqueNonSupportingSubjects.length,
      "Po wykluczeniu nauczycieli wspomagających powinny pozostać zielone przedmioty",
    ).toBeGreaterThan(0);
  });

  test("MED-YEAR-PREP-03: wylicz oczekiwany medal na podstawie aktualnego stanu nauczycieli", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const expectation = await getExpectedAnnualMedal(page);

    console.log(
      `MED-YEAR-PREP-03: szkoła ${GOLD_SCHOOL.id} "${GOLD_SCHOOL.name}"`,
    );

    console.log(
      "Przedmioto-poziomy kwalifikujące się do kolejnego przeliczenia:",
      JSON.stringify(expectation.qualifyingSubjectLevels, null, 2),
    );

    console.log(
      "Wykluczeni nauczyciele wspomagający:",
      JSON.stringify(expectation.supportingTeachersExcluded, null, 2),
    );

    console.log(
      `Oczekiwany medal po kolejnym przeliczeniu: ${expectation.expectedMedal}`,
    );

    expect(
      expectation.qualifyingSubjectLevels.length,
      "Powinien istnieć co najmniej jeden kwalifikowany przedmioto-poziom",
    ).toBeGreaterThan(0);

    expect(
      expectation.supportingTeachersExcluded,
      "Nauczyciel 342492 powinien zostać wykluczony jako nauczyciel wspomagający",
    ).toContain("342492");

    expect(
      expectation.expectedMedal,
      "Przy co najmniej 3 unikalnych przedmioto-poziomach oczekiwany jest medal Złoto",
    ).toBe("Złoto");
  });

  test("MED-YEAR-PREP-04: wylicz oczekiwany medal dla szkoły z aktualnym Srebrem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    const expectation = await getExpectedAnnualMedal(page);

    const currentMedal = await getSchoolMedalApiData(app, SILVER_SCHOOL);

    console.log(
      `MED-YEAR-PREP-04: szkoła ${SILVER_SCHOOL.id} "${SILVER_SCHOOL.name}"`,
    );

    console.log(
      "Przedmioto-poziomy kwalifikujące się do kolejnego przeliczenia:",
      JSON.stringify(expectation.qualifyingSubjectLevels, null, 2),
    );

    console.log(
      "Wykluczeni nauczyciele wspomagający:",
      JSON.stringify(expectation.supportingTeachersExcluded, null, 2),
    );

    console.log(
      `Aktualny medal przed przeliczeniem: ${currentMedal.medalCategoryName}`,
    );

    console.log(
      "Aktualne subjectNames:",
      JSON.stringify(currentMedal.subjectNames, null, 2),
    );

    console.log(
      `Oczekiwany medal po kolejnym przeliczeniu: ${expectation.expectedMedal}`,
    );

    expect(
      expectation.expectedMedal,
      "Helper powinien zwrócić poprawną kategorię medalu",
    ).toMatch(/^(Złoto|Srebro|Brąz|Brak)$/);
  });

  test("MED-YEAR-PREP-05: wylicz oczekiwany medal dla szkoły z aktualnym Brązem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    const expectation = await getExpectedAnnualMedal(page);

    const currentMedal = await getSchoolMedalApiData(app, BRONZE_SCHOOL);

    console.log(
      `MED-YEAR-PREP-05: szkoła ${BRONZE_SCHOOL.id} "${BRONZE_SCHOOL.name}"`,
    );

    console.log(
      "Przedmioto-poziomy kwalifikujące się do kolejnego przeliczenia:",
      JSON.stringify(expectation.qualifyingSubjectLevels, null, 2),
    );

    console.log(
      "Wykluczeni nauczyciele wspomagający:",
      JSON.stringify(expectation.supportingTeachersExcluded, null, 2),
    );

    console.log(
      `Aktualny medal przed przeliczeniem: ${currentMedal.medalCategoryName}`,
    );

    console.log(
      "Aktualne subjectNames:",
      JSON.stringify(currentMedal.subjectNames, null, 2),
    );

    console.log(
      `Oczekiwany medal po kolejnym przeliczeniu: ${expectation.expectedMedal}`,
    );

    expect(
      expectation.expectedMedal,
      "Helper powinien zwrócić poprawną kategorię medalu",
    ).toMatch(/^(Złoto|Srebro|Brąz|Brak)$/);
  });

  test("MED-YEAR-PREP-06: wylicz oczekiwany medal dla szkoły bez medalu", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, NO_MEDAL_SCHOOL);

    const expectation = await getExpectedAnnualMedal(page);

    const currentMedal = await getSchoolMedalApiData(app, NO_MEDAL_SCHOOL);

    console.log(
      `MED-YEAR-PREP-06: szkoła ${NO_MEDAL_SCHOOL.id} "${NO_MEDAL_SCHOOL.name}"`,
    );

    console.log(
      "Przedmioto-poziomy kwalifikujące się do kolejnego przeliczenia:",
      JSON.stringify(expectation.qualifyingSubjectLevels, null, 2),
    );

    console.log(
      "Wykluczeni nauczyciele wspomagający:",
      JSON.stringify(expectation.supportingTeachersExcluded, null, 2),
    );

    console.log(
      `Aktualny medal przed przeliczeniem: ${currentMedal.medalCategoryName}`,
    );

    console.log(
      "Aktualne subjectNames:",
      JSON.stringify(currentMedal.subjectNames, null, 2),
    );

    console.log(
      `Oczekiwany medal po kolejnym przeliczeniu: ${expectation.expectedMedal}`,
    );

    expect(
      expectation.expectedMedal,
      "Helper powinien zwrócić poprawną kategorię medalu",
    ).toMatch(/^(Złoto|Srebro|Brąz|Brak)$/);
  });

  test("MED-YEAR-PREP-07: zapisz snapshot medalowości przed rocznym przeliczeniem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    const snapshot = await buildAnnualMedalSnapshot(app, schools);

    expect(
      snapshot,
      "Snapshot powinien zawierać wszystkie szkoły referencyjne",
    ).toHaveLength(schools.length);

    console.log("MED-YEAR-PREP-07: snapshot przed rocznym przeliczeniem");

    for (const entry of snapshot) {
      console.log(
        `${entry.school.id} "${entry.school.name}": ` +
          `${entry.currentMedal} → ${entry.expectedMedal}`,
      );

      console.log(
        "  aktualne subjectNames:",
        JSON.stringify(entry.currentSubjectNames),
      );

      console.log(
        "  kwalifikowane przedmioto-poziomy:",
        JSON.stringify(entry.qualifyingSubjectLevels),
      );

      console.log(
        "  wykluczeni wspomagający:",
        JSON.stringify(entry.supportingTeachersExcluded),
      );
    }

    const output = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),

      targetProcessDate: "2026-10-01",

      schools: snapshot,
    };

    await mkdir("tests/data", {
      recursive: true,
    });

    const outputPath = "tests/data/medalowosc-annual-2026.json";

    await writeFile(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

    console.log(`Snapshot zapisany: ${outputPath}`);
  });

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
    );

    console.log("MED-YEAR-PREP-08: losuję 50 dodatkowych szkół...");

    const randomSnapshot = await buildRandomAnnualMedalSnapshot(
      app,
      50,
      referenceSchools.map((school) => school.id),
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

      targetProcessDate: "2026-10-01",

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

    const outputPath = "tests/data/medalowosc-annual-2026.json";

    await writeFile(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

    console.log(`MED-YEAR-PREP-08: snapshot zapisany: ${outputPath}`);

    console.log(
      `MED-YEAR-PREP-08: zapisano ${schools.length} szkół: ` +
        `${referenceSnapshot.length} referencyjne + ${randomSnapshot.length} losowych.`,
    );
  });
});

test("MED-YEAR-01: roczne przeliczenie ustawia oczekiwany medal na podstawie snapshotu @annual-medal", async ({
  page,
}) => {
  test.setTimeout(10 * 60 * 1000);

  const app = new Octopus(page);

  const snapshot = await loadAnnualMedalSnapshot();

  const today = new Date().toISOString().slice(0, 10);

  test.skip(
    today < snapshot.targetProcessDate,
    `Test można uruchomić dopiero ${snapshot.targetProcessDate} po wykonaniu rocznego przeliczenia medalowości`,
  );

  console.log(`MED-YEAR-01: snapshot wygenerowany ${snapshot.generatedAt}`);

  console.log(`MED-YEAR-01: sprawdzam ${snapshot.schools.length} szkół`);

  let passed = 0;

  for (let i = 0; i < snapshot.schools.length; i++) {
    const entry = snapshot.schools[i];

    const medalData = await getSchoolMedalApiData(app, entry.school);

    console.log(
      `MED-YEAR-01: ${i + 1}/${snapshot.schools.length} ` +
        `${entry.school.id} "${entry.school.name}": ` +
        `${entry.currentMedal} → oczekiwany ${entry.expectedMedal} → ` +
        `faktyczny ${medalData.medalCategoryName}`,
    );

    expect(
      medalData.medalCategoryName,
      `Szkoła ${entry.school.id} "${entry.school.name}" powinna po rocznym przeliczeniu mieć medal ${entry.expectedMedal}. ` +
        `Przed przeliczeniem miała ${entry.currentMedal}.`,
    ).toBe(entry.expectedMedal);

    passed++;
  }

  console.log(
    `MED-YEAR-01: poprawnie zweryfikowano ${passed}/${snapshot.schools.length} szkół.`,
  );
});
