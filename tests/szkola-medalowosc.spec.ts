import { test, expect } from "./support/fixtures";

import { Octopus } from "./support/octopus";

import {
  GOLD_SCHOOL,
  SILVER_SCHOOL,
  BRONZE_SCHOOL,
  NO_MEDAL_SCHOOL,
} from "./support/school-medal-data";

import {
  expectSchoolMedal,
  expectMedalReadOnly,
  expectMedalTooltip,
  expectNoMedalTooltip,
  openMedalSchool,
  searchSchoolById,
  openSchoolHistory,
  searchSchoolsByMedal,
  searchSchoolsByMedals,
  expectSchoolResultsMedals,
  getSchoolMedalApiData,
  getMedalTooltipSubjects,
  getSchoolMedalValue,
  expectMedalMatchesSubjectCount,
  expectUniqueMedalSubjects,
  schoolTeachersBySubject,
  prepareSchoolSearchByIdAndMedal,
  searchSchoolsByMedalsWithApi,
  waitForSchoolTeachersLoaded,
  medalHistoryRows,
  type SchoolMedal,
  collectMedalHistoryEntries,
} from "./support/school-medal";

test.describe("Medalowość szkoły", () => {
  test("MED-02: pole Medal dla szkoły ze złotym medalem jest nieedytowalne", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, GOLD_SCHOOL.expectedMedal));
    await test.step("Sprawdzenie: expectMedalReadOnly", async () => expectMedalReadOnly(page));
  });

  test("MED-04: tooltip złotego medalu wyświetla przedmioty składające się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, GOLD_SCHOOL.expectedMedal));

    await test.step("Sprawdzenie: expectMedalTooltip", async () =>
      expectMedalTooltip(page, GOLD_SCHOOL.expectedSubjects));
  });

  test("MED-05: złoty medal jest widoczny w wynikach wyszukiwania szkół", async ({ page }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, GOLD_SCHOOL);

    await test.step("Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: GOLD_SCHOOL.name", async () =>
      expect(schoolRow).toContainText(GOLD_SCHOOL.name));
    await test.step('Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: "Złoto"', async () =>
      expect(schoolRow).toContainText("Złoto"));
  });

  test("MED-07: pole Medal dla szkoły ze srebrnym medalem jest nieedytowalne", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, SILVER_SCHOOL.expectedMedal));
    await test.step("Sprawdzenie: expectMedalReadOnly", async () => expectMedalReadOnly(page));
  });

  test("MED-09: tooltip srebrnego medalu wyświetla przedmioty składające się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, SILVER_SCHOOL.expectedMedal));

    await test.step("Sprawdzenie: expectMedalTooltip", async () =>
      expectMedalTooltip(page, SILVER_SCHOOL.expectedSubjects));
  });

  test("MED-10: srebrny medal jest widoczny w wynikach wyszukiwania szkół", async ({ page }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, SILVER_SCHOOL);

    await test.step("Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: SILVER_SCHOOL.name", async () =>
      expect(schoolRow).toContainText(SILVER_SCHOOL.name));
    await test.step('Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: "Srebro"', async () =>
      expect(schoolRow).toContainText("Srebro"));
  });

  test("MED-12: pole Medal dla szkoły z brązowym medalem jest nieedytowalne", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, BRONZE_SCHOOL.expectedMedal));
    await test.step("Sprawdzenie: expectMedalReadOnly", async () => expectMedalReadOnly(page));
  });

  test("MED-14: tooltip brązowego medalu wyświetla przedmiot składający się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, BRONZE_SCHOOL.expectedMedal));

    await test.step("Sprawdzenie: expectMedalTooltip", async () =>
      expectMedalTooltip(page, BRONZE_SCHOOL.expectedSubjects));
  });

  test("MED-15: brązowy medal jest widoczny w wynikach wyszukiwania szkół", async ({ page }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, BRONZE_SCHOOL);

    await test.step("Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: BRONZE_SCHOOL.name", async () =>
      expect(schoolRow).toContainText(BRONZE_SCHOOL.name));
    await test.step('Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: "Brąz"', async () =>
      expect(schoolRow).toContainText("Brąz"));
  });

  test("MED-17: pole Medal dla szkoły bez medalu jest nieedytowalne", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, NO_MEDAL_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, NO_MEDAL_SCHOOL.expectedMedal));
    await test.step("Sprawdzenie: expectMedalReadOnly", async () => expectMedalReadOnly(page));
  });

  test("MED-18: najechanie na wartość Brak nie wyświetla tooltipa z przedmiotami", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, NO_MEDAL_SCHOOL);

    await test.step("Sprawdzenie: expectSchoolMedal", async () =>
      expectSchoolMedal(page, NO_MEDAL_SCHOOL.expectedMedal));
    await test.step("Sprawdzenie: expectNoMedalTooltip", async () => expectNoMedalTooltip(page));
  });

  test("MED-19: wartość Brak jest widoczna w wynikach wyszukiwania szkół", async ({ page }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, NO_MEDAL_SCHOOL);

    await test.step("Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: NO_MEDAL_SCHOOL.name", async () =>
      expect(schoolRow).toContainText(NO_MEDAL_SCHOOL.name));
    await test.step('Sprawdzenie: obecność tekstu w widoku — schoolRow; oczekiwane: "Brak"', async () =>
      expect(schoolRow).toContainText("Brak"));
  });

  test("MED-20: historia zmian szkoły zawiera wpis dotyczący złotego medalu", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const entries = await collectMedalHistoryEntries(page, history);

    await test.step("Sprawdzenie: toBeDefined — GOLD_SCHOOL.expectedHistoryValue", async () => {
      expect(
        GOLD_SCHOOL.expectedHistoryValue,
        "Dla szkoły referencyjnej powinien być zdefiniowany oczekiwany wpis historii",
      ).toBeDefined();
    });

    await test.step("Sprawdzenie: toBeDefined — GOLD_SCHOOL.expectedHistoryDate", async () => {
      expect(
        GOLD_SCHOOL.expectedHistoryDate,
        "Dla szkoły referencyjnej powinna być zdefiniowana oczekiwana data historii",
      ).toBeDefined();
    });

    const medalEntry = entries.find((entry) => entry.value === GOLD_SCHOOL.expectedHistoryValue);

    console.log(`MED-20: znaleziono wpis "${medalEntry!.value}" ` + `z datą ${medalEntry!.date}.`);

    await test.step("Sprawdzenie: toBeDefined — medalEntry", async () => {
      expect(
        medalEntry,
        `Historia powinna zawierać wpis "${GOLD_SCHOOL.expectedHistoryValue}"`,
      ).toBeDefined();
    });

    await test.step('Sprawdzenie: zgodność wartości — medalEntry!.author; oczekiwane: "automat"', async () => {
      expect(medalEntry!.author).toBe("automat");
    });

    await test.step('Sprawdzenie: zgodność wartości — medalEntry!.source; oczekiwane: "Formularz klubowy"', async () => {
      expect(medalEntry!.source).toBe("Formularz klubowy");
    });

    await test.step("Sprawdzenie: zgodność wartości — medalEntry!.date; oczekiwane: GOLD_SCHOOL.expectedHistoryDate", async () => {
      expect(medalEntry!.date).toBe(GOLD_SCHOOL.expectedHistoryDate);
    });
  });

  test("MED-21: historia zawiera tylko jeden wpis medalowy dla danego roku szkolnego", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const entries = await collectMedalHistoryEntries(page, history);

    await test.step("Sprawdzenie: toBeDefined — GOLD_SCHOOL.expectedHistoryValue", async () => {
      expect(
        GOLD_SCHOOL.expectedHistoryValue,
        "Dla szkoły referencyjnej powinien być zdefiniowany oczekiwany wpis historii",
      ).toBeDefined();
    });

    const expectedSeason = GOLD_SCHOOL.expectedHistoryValue!.split(" ")[0];

    const entriesForSeason = entries.filter((entry) =>
      entry.value.startsWith(`${expectedSeason} `),
    );

    console.log(
      `MED-21: szkoła ${GOLD_SCHOOL.id}. ` +
        `Sezon ${expectedSeason}. ` +
        `Znaleziono ${entriesForSeason.length} wpisów medalowych: ` +
        `${entriesForSeason.map((entry) => entry.value).join(", ")}.`,
    );

    await test.step("Sprawdzenie: liczba elementów — entriesForSeason; oczekiwane: 1", async () => {
      expect(
        entriesForSeason,
        `Historia powinna zawierać dokładnie jeden wpis medalowy dla sezonu ${expectedSeason}`,
      ).toHaveLength(1);
    });
  });

  test("MED-22: wartość wpisu medalowego ma format RRRR/RRRR Medal", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const entries = await collectMedalHistoryEntries(page, history);

    await test.step("Sprawdzenie: wartość powyżej granicy — entries.length; granica: 0", async () => {
      expect(
        entries.length,
        "Historia powinna zawierać co najmniej jeden wpis medalowy",
      ).toBeGreaterThan(0);
    });

    for (const entry of entries) {
      await test.step("Sprawdzenie: zgodność ze wzorcem — entry.value; oczekiwane: /^\\d{4}\\/\\d{4} (Złoto|Srebro|Brąz|Brak)$/", async () => {
        expect(entry.value, `Nieprawidłowy format wpisu medalowego: "${entry.value}"`).toMatch(
          /^\d{4}\/\d{4} (Złoto|Srebro|Brąz|Brak)$/,
        );
      });
    }

    console.log(`MED-22: sprawdzono format ${entries.length} wpisów medalowych.`);
  });

  test("MED-23: wpisy medalowe w historii mają źródło Formularz klubowy", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const entries = await collectMedalHistoryEntries(page, history);

    await test.step("Sprawdzenie: wartość powyżej granicy — entries.length; granica: 0", async () => {
      expect(
        entries.length,
        "Historia powinna zawierać co najmniej jeden wpis medalowy",
      ).toBeGreaterThan(0);
    });

    for (const entry of entries) {
      await test.step('Sprawdzenie: zgodność wartości — entry.source; oczekiwane: "Formularz klubowy"', async () => {
        expect(entry.source, `Wpis "${entry.value}" powinien mieć źródło Formularz klubowy`).toBe(
          "Formularz klubowy",
        );
      });
    }

    console.log(`MED-23: sprawdzono źródło ${entries.length} wpisów medalowych.`);
  });

  test("MED-24: wpisy medalowe w historii mają uzupełnionego autora", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const entries = await collectMedalHistoryEntries(page, history);

    await test.step("Sprawdzenie: wartość powyżej granicy — entries.length; granica: 0", async () => {
      expect(
        entries.length,
        "Historia powinna zawierać co najmniej jeden wpis medalowy",
      ).toBeGreaterThan(0);
    });

    for (const entry of entries) {
      await test.step('Sprawdzenie: negacja — zgodność wartości — entry.author; oczekiwane: ""', async () => {
        expect(entry.author, `Wpis "${entry.value}" powinien mieć uzupełnionego autora`).not.toBe(
          "",
        );
      });
    }

    console.log(`MED-24: sprawdzono autora dla ${entries.length} wpisów medalowych.`);
  });

  test("MED-25: wpisy medalowe w historii są zapisane z datą 1 października", async ({ page }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const entries = await collectMedalHistoryEntries(page, history);

    await test.step("Sprawdzenie: wartość powyżej granicy — entries.length; granica: 0", async () => {
      expect(
        entries.length,
        "Historia powinna zawierać co najmniej jeden wpis medalowy",
      ).toBeGreaterThan(0);
    });

    for (const entry of entries) {
      await test.step("Sprawdzenie: zgodność ze wzorcem — entry.date; oczekiwane: /^\\d{4}-10-01 \\d{2}:\\d{2}$/", async () => {
        expect(
          entry.date,
          `Wpis "${entry.value}" powinien mieć datę przypadającą na 1 października`,
        ).toMatch(/^\d{4}-10-01 \d{2}:\d{2}$/);
      });
    }

    console.log(`MED-25: sprawdzono datę ${entries.length} wpisów medalowych.`);
  });

  test("MED-26: wpisy medalowe w historii są posortowane od najnowszego sezonu do najstarszego", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      const entries = await collectMedalHistoryEntries(page, history);

      await test.step("Sprawdzenie: wartość powyżej granicy — entries.length; granica: 0", async () => {
        expect(
          entries.length,
          `Historia szkoły ${school.id} powinna zawierać co najmniej jeden wpis medalowy`,
        ).toBeGreaterThan(0);
      });

      const seasons: number[] = [];

      for (const entry of entries) {
        const match = entry.value.match(/^(\d{4})\/\d{4} (Złoto|Srebro|Brąz|Brak)$/);

        await test.step("Sprawdzenie: negacja — toBeNull — match", async () => {
          expect(
            match,
            `Nie udało się odczytać roku szkolnego z wartości: "${entry.value}"`,
          ).not.toBeNull();
        });

        seasons.push(Number(match![1]));
      }

      const expectedOrder = [...seasons].sort((a, b) => b - a);

      await test.step("Sprawdzenie: zgodność całej struktury i wartości — seasons; oczekiwane: expectedOrder", async () => {
        expect(
          seasons,
          `Historia medalowości szkoły ${school.id} powinna być posortowana od najnowszego sezonu do najstarszego`,
        ).toEqual(expectedOrder);
      });

      console.log(
        `MED-26: szkoła ${school.id}. ` +
          `Sprawdzono kolejność ${entries.length} wpisów medalowych.`,
      );
    }
  });

  test("MED-27: wyszukiwanie po Medal = Złoto zwraca tylko szkoły ze złotym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Złoto");

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, ["Złoto"]));
  });

  test("MED-28: wyszukiwanie po Medal = Srebro zwraca tylko szkoły ze srebrnym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Srebro");

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, ["Srebro"]));
  });

  test("MED-29: wyszukiwanie po Medal = Brąz zwraca tylko szkoły z brązowym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Brąz");

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, ["Brąz"]));
  });

  test("MED-30: wyszukiwanie po Medal = Brak zwraca tylko szkoły bez medalu", async ({ page }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Brak");

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, ["Brak"]));
  });

  test("MED-31: wyszukiwanie po Medal = Złoto i Srebro zwraca szkoły z oboma wybranymi medalami", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedals(app, ["Złoto", "Srebro"]);

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, ["Złoto", "Srebro"]));
  });

  test("MED-33: złoty medal i jego przedmioty są zgodne między API i UI", async ({ page }) => {
    const app = new Octopus(page);

    const apiMedalData =
      await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
        getSchoolMedalApiData(app, GOLD_SCHOOL));

    const uiSubjects = await getMedalTooltipSubjects(page);
    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-33: API zwraca ${apiMedalData.subjectNames.length} przedmiotów medalowych: ` +
        `${apiMedalData.subjectNames.join(", ")}. ` +
        `Tooltip UI pokazuje ${uiSubjects.length}: ${uiSubjects.join(", ")}.`,
    );

    await test.step("Sprawdzenie: zgodność wartości — apiMedalData.medalCategoryName; oczekiwane: GOLD_SCHOOL.expectedMedal", async () => {
      expect(apiMedalData.medalCategoryName).toBe(GOLD_SCHOOL.expectedMedal);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — apiMedalData.subjectNames; oczekiwane: GOLD_SCHOOL.expectedSubjects", async () => {
      expect(apiMedalData.subjectNames).toEqual(GOLD_SCHOOL.expectedSubjects);
    });
    await test.step("Sprawdzenie: zgodność wartości — uiMedal; oczekiwane: apiMedalData.medalCategoryName", async () => {
      expect(uiMedal).toBe(apiMedalData.medalCategoryName);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — [...uiSubjects].sort(); oczekiwane: [...apiMedalData.subjectNames].sort()", async () => {
      expect([...uiSubjects].sort()).toEqual([...apiMedalData.subjectNames].sort());
    });
  });

  test("MED-36: srebrny medal i jego przedmioty są zgodne między API i UI", async ({ page }) => {
    const app = new Octopus(page);

    const apiMedalData =
      await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
        getSchoolMedalApiData(app, SILVER_SCHOOL));

    const uiSubjects = await getMedalTooltipSubjects(page);
    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-36: API zwraca ${apiMedalData.subjectNames.length} przedmiotów medalowych: ` +
        `${apiMedalData.subjectNames.join(", ")}. ` +
        `Tooltip UI pokazuje ${uiSubjects.length}: ${uiSubjects.join(", ")}.`,
    );

    await test.step("Sprawdzenie: zgodność wartości — apiMedalData.medalCategoryName; oczekiwane: SILVER_SCHOOL.expectedMedal", async () => {
      expect(apiMedalData.medalCategoryName).toBe(SILVER_SCHOOL.expectedMedal);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — apiMedalData.subjectNames; oczekiwane: SILVER_SCHOOL.expectedSubjects", async () => {
      expect(apiMedalData.subjectNames).toEqual(SILVER_SCHOOL.expectedSubjects);
    });
    await test.step("Sprawdzenie: zgodność wartości — uiMedal; oczekiwane: apiMedalData.medalCategoryName", async () => {
      expect(uiMedal).toBe(apiMedalData.medalCategoryName);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — [...uiSubjects].sort(); oczekiwane: [...apiMedalData.subjectNames].sort()", async () => {
      expect([...uiSubjects].sort()).toEqual([...apiMedalData.subjectNames].sort());
    });
  });

  test("MED-39: brązowy medal i jego przedmioty są zgodne między API i UI", async ({ page }) => {
    const app = new Octopus(page);

    const apiMedalData =
      await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
        getSchoolMedalApiData(app, BRONZE_SCHOOL));

    const uiSubjects = await getMedalTooltipSubjects(page);
    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-39: API zwraca ${apiMedalData.subjectNames.length} przedmiot medalowy: ` +
        `${apiMedalData.subjectNames.join(", ")}. ` +
        `Tooltip UI pokazuje ${uiSubjects.length}: ${uiSubjects.join(", ")}.`,
    );

    await test.step("Sprawdzenie: zgodność wartości — apiMedalData.medalCategoryName; oczekiwane: BRONZE_SCHOOL.expectedMedal", async () => {
      expect(apiMedalData.medalCategoryName).toBe(BRONZE_SCHOOL.expectedMedal);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — apiMedalData.subjectNames; oczekiwane: BRONZE_SCHOOL.expectedSubjects", async () => {
      expect(apiMedalData.subjectNames).toEqual(BRONZE_SCHOOL.expectedSubjects);
    });
    await test.step("Sprawdzenie: zgodność wartości — uiMedal; oczekiwane: apiMedalData.medalCategoryName", async () => {
      expect(uiMedal).toBe(apiMedalData.medalCategoryName);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — [...uiSubjects].sort(); oczekiwane: [...apiMedalData.subjectNames].sort()", async () => {
      expect([...uiSubjects].sort()).toEqual([...apiMedalData.subjectNames].sort());
    });
  });

  test("MED-43: brak medalu i przedmiotów jest zgodny między API i UI", async ({ page }) => {
    const app = new Octopus(page);

    const apiMedalData =
      await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
        getSchoolMedalApiData(app, NO_MEDAL_SCHOOL));
    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-43: API zwraca medal "${apiMedalData.medalCategoryName}" ` +
        `oraz ${apiMedalData.subjectNames.length} przedmiotów medalowych. ` +
        `UI nie powinno wyświetlać tooltipa.`,
    );

    await test.step('Sprawdzenie: zgodność wartości — apiMedalData.medalCategoryName; oczekiwane: "Brak"', async () => {
      expect(apiMedalData.medalCategoryName).toBe("Brak");
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — apiMedalData.subjectNames; oczekiwane: []", async () => {
      expect(apiMedalData.subjectNames).toEqual([]);
    });
    await test.step("Sprawdzenie: zgodność wartości — uiMedal; oczekiwane: apiMedalData.medalCategoryName", async () => {
      expect(uiMedal).toBe(apiMedalData.medalCategoryName);
    });

    await test.step("Sprawdzenie: expectNoMedalTooltip", async () => expectNoMedalTooltip(page));
  });

  test("MED-44: medal szkoły jest zgodny z liczbą przedmiotów zwracanych przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      const medalData =
        await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
          getSchoolMedalApiData(app, school));

      console.log(
        `MED-44: szkoła ${school.id} "${school.name}". ` +
          `Medal: ${medalData.medalCategoryName}. ` +
          `Liczba przedmiotów medalowych: ${medalData.subjectNames.length}. ` +
          `Przedmioty: ${
            medalData.subjectNames.length > 0 ? medalData.subjectNames.join(", ") : "brak"
          }.`,
      );

      expectMedalMatchesSubjectCount(
        medalData.medalCategoryName as "Złoto" | "Srebro" | "Brąz" | "Brak",
        medalData.subjectNames,
      );
    }
  });

  test("MED-45: lista przedmiotów wpływających na medal nie zawiera duplikatów", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL];

    for (const school of schools) {
      const medalData =
        await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
          getSchoolMedalApiData(app, school));

      console.log(
        `MED-45: szkoła ${school.id}. ` +
          `API zwróciło ${medalData.subjectNames.length} przedmiotów medalowych: ` +
          `${medalData.subjectNames.join(", ")}. ` +
          `Sprawdzam brak duplikatów.`,
      );

      expectUniqueMedalSubjects(medalData.subjectNames);
    }
  });

  test("MED-46: wielu nauczycieli MAT SP nie zwiększa liczby przedmiotów medalowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const medalData =
      await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
        getSchoolMedalApiData(app, BRONZE_SCHOOL));

    const mathTeachers = schoolTeachersBySubject(page, "MAT SP");

    await test.step("Sprawdzenie: widoczność elementu — mathTeachers.first()", async () =>
      expect(mathTeachers.first()).toBeVisible());

    const mathTeachersCount = await mathTeachers.count();
    const medalSubjectsCount = medalData.subjectNames.length;

    console.log(
      `MED-46: pobrano ${mathTeachersCount} nauczycieli MAT SP. ` +
        `API zwraca ${medalSubjectsCount} przedmiot medalowy: ${medalData.subjectNames.join(", ")}. ` +
        `Medal szkoły: ${medalData.medalCategoryName}.`,
    );

    await test.step("Sprawdzenie: wartość nie mniejsza od granicy — mathTeachersCount; granica: 2", async () => {
      expect(
        mathTeachersCount,
        "Szkoła powinna mieć co najmniej dwóch nauczycieli MAT SP",
      ).toBeGreaterThanOrEqual(2);
    });

    await test.step('Sprawdzenie: zgodność wartości — medalData.medalCategoryName; oczekiwane: "Brąz"', async () => {
      expect(medalData.medalCategoryName).toBe("Brąz");
    });

    await test.step("Sprawdzenie: zgodność całej struktury i wartości — medalData.subjectNames; oczekiwane: BRONZE_SCHOOL.expectedSubjects", async () => {
      expect(medalData.subjectNames).toEqual(BRONZE_SCHOOL.expectedSubjects);
    });
  });

  test("MED-47: medal w wynikach wyszukiwania szkoły jest zgodny z wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      const apiMedalData =
        await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
          getSchoolMedalApiData(app, school));

      const schoolRow = await searchSchoolById(app, school);

      const medalCell = schoolRow.getByRole("gridcell", {
        name: apiMedalData.medalCategoryName ?? "",
        exact: true,
      });

      await test.step("Sprawdzenie: widoczność elementu — medalCell", async () =>
        expect(medalCell).toBeVisible());

      console.log(
        `MED-47: szkoła ${school.id} "${school.name}". ` +
          `API zwraca medal: ${apiMedalData.medalCategoryName}. ` +
          `Wyniki wyszukiwania pokazują ten sam medal.`,
      );
    }
  });

  test("MED-48: przedmioty nauczycieli nie są automatycznie zaliczane do medalowości szkoły", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await waitForSchoolTeachersLoaded(page);

    const mathTeachers = schoolTeachersBySubject(page, "MAT SP");

    const polishTeachers = schoolTeachersBySubject(page, "JPL SP");

    const historyTeachers = schoolTeachersBySubject(page, "HIS SP");

    const physicsTeachers = schoolTeachersBySubject(page, "FIZ SP");

    const mathCount = await mathTeachers.count();
    const polishCount = await polishTeachers.count();
    const historyCount = await historyTeachers.count();
    const physicsCount = await physicsTeachers.count();

    const medalData =
      await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
        getSchoolMedalApiData(app, BRONZE_SCHOOL));

    console.log(
      `MED-48: szkoła ${BRONZE_SCHOOL.id} "${BRONZE_SCHOOL.name}". ` +
        `W tabeli nauczycieli znaleziono: ` +
        `MAT SP=${mathCount}, ` +
        `JPL SP=${polishCount}, ` +
        `HIS SP=${historyCount}, ` +
        `FIZ SP=${physicsCount}. ` +
        `API medalowości zwraca: ${medalData.subjectNames.join(", ")}. ` +
        `Medal: ${medalData.medalCategoryName}.`,
    );

    await test.step("Sprawdzenie: wartość powyżej granicy — mathCount; granica: 0", async () => {
      expect(
        mathCount,
        "W szkole powinien istnieć co najmniej jeden nauczyciel MAT SP",
      ).toBeGreaterThan(0);
    });

    await test.step("Sprawdzenie: wartość powyżej granicy — polishCount; granica: 0", async () => {
      expect(
        polishCount,
        "W szkole powinien istnieć co najmniej jeden nauczyciel JPL SP",
      ).toBeGreaterThan(0);
    });

    await test.step("Sprawdzenie: wartość powyżej granicy — historyCount; granica: 0", async () => {
      expect(
        historyCount,
        "W szkole powinien istnieć co najmniej jeden nauczyciel HIS SP",
      ).toBeGreaterThan(0);
    });

    await test.step("Sprawdzenie: wartość powyżej granicy — physicsCount; granica: 0", async () => {
      expect(
        physicsCount,
        "W szkole powinien istnieć co najmniej jeden nauczyciel FIZ SP",
      ).toBeGreaterThan(0);
    });

    await test.step('Sprawdzenie: zgodność wartości — medalData.medalCategoryName; oczekiwane: "Brąz"', async () => {
      expect(medalData.medalCategoryName, "Szkoła powinna mieć medal Brąz").toBe("Brąz");
    });

    await test.step("Sprawdzenie: zgodność całej struktury i wartości — medalData.subjectNames; oczekiwane: BRONZE_SCHOOL.expectedSubjects", async () => {
      expect(
        medalData.subjectNames,
        "Do medalowości powinien być zaliczony tylko kwalifikowany przedmiot",
      ).toEqual(BRONZE_SCHOOL.expectedSubjects);
    });
  });

  test("MED-49: najnowszy wpis historii medalu jest zgodny z aktualną wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      const apiMedalData =
        await test.step("API: odczyt medalowości szkoły do porównania z widokiem", async () =>
          getSchoolMedalApiData(app, school));

      const history = await openSchoolHistory(page);

      const entries = await collectMedalHistoryEntries(page, history);

      if (entries.length === 0) {
        console.log(
          `MED-49: szkoła ${school.id} "${school.name}". ` +
            `Brak wpisów historii medalowości. ` +
            `Aktualny medal API: ${apiMedalData.medalCategoryName}.`,
        );

        await test.step('Sprawdzenie: zgodność wartości — apiMedalData.medalCategoryName; oczekiwane: "Brak"', async () => {
          expect(
            apiMedalData.medalCategoryName,
            `Szkoła ${school.id} bez historii medalowości powinna mieć aktualnie wartość Brak`,
          ).toBe("Brak");
        });

        continue;
      }

      const parsedEntries = entries.map((entry) => {
        const match = entry.value.match(/^(\d{4})\/(\d{4}) (Złoto|Srebro|Brąz|Brak)$/);

        expect(
          match,
          `Nieprawidłowy format wpisu historii medalowości: "${entry.value}"`,
        ).not.toBeNull();

        return {
          entry,
          startYear: Number(match![1]),
        };
      });

      parsedEntries.sort((a, b) => b.startYear - a.startYear);

      const latestEntry = parsedEntries[0].entry;

      const historyMedal = latestEntry.value.replace(/^\d{4}\/\d{4}\s+/, "");

      console.log(
        `MED-49: szkoła ${school.id} "${school.name}". ` +
          `Najnowszy wpis: "${latestEntry.value}". ` +
          `Medal API: ${apiMedalData.medalCategoryName}.`,
      );

      await test.step("Sprawdzenie: zgodność wartości — historyMedal; oczekiwane: apiMedalData.medalCategoryName", async () => {
        expect(
          historyMedal,
          `Najnowszy wpis historii szkoły ${school.id} powinien być zgodny z API`,
        ).toBe(apiMedalData.medalCategoryName);
      });
    }
  });

  test("MED-50: historia medalowości zawiera maksymalnie jeden wpis dla każdego roku szkolnego", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      if (school.expectedMedal !== "Brak") {
        await test.step("Sprawdzenie: widoczność elementu — medalHistoryRows(history).first()", async () =>
          expect(
            medalHistoryRows(history).first(),
            `Historia szkoły ${school.id} powinna zawierać wpis medalowości`,
          ).toBeVisible());
      }

      const entries = await collectMedalHistoryEntries(page, history);

      if (entries.length === 0) {
        await test.step('Sprawdzenie: zgodność wartości — school.expectedMedal; oczekiwane: "Brak"', async () => {
          expect(
            school.expectedMedal,
            `Szkoła ${school.id} bez historii medalowości powinna mieć wartość Brak`,
          ).toBe("Brak");
        });

        console.log(`MED-50: szkoła ${school.id}. ` + `Brak wpisów historii medalowości.`);

        continue;
      }

      const seasons: string[] = [];

      for (const entry of entries) {
        const match = entry.value.match(/^(\d{4}\/\d{4}) (Złoto|Srebro|Brąz|Brak)$/);

        await test.step("Sprawdzenie: negacja — toBeNull — match", async () => {
          expect(match, `Nieprawidłowy wpis historii medalowości: "${entry.value}"`).not.toBeNull();
        });

        seasons.push(match![1]);
      }

      const uniqueSeasons = new Set(seasons);

      console.log(
        `MED-50: szkoła ${school.id}. ` +
          `Wpisów: ${seasons.length}, ` +
          `unikalnych sezonów: ${uniqueSeasons.size}.`,
      );

      await test.step("Sprawdzenie: zgodność wartości — uniqueSeasons.size; oczekiwane: seasons.length", async () => {
        expect(
          uniqueSeasons.size,
          `Szkoła ${school.id} posiada więcej niż jeden wpis medalowości dla tego samego roku szkolnego`,
        ).toBe(seasons.length);
      });
    }
  });

  test("MED-51: wszystkie wpisy historii medalowości mają źródło Formularz klubowy", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      const entries = await collectMedalHistoryEntries(page, history);

      if (entries.length === 0) {
        await test.step('Sprawdzenie: zgodność wartości — school.expectedMedal; oczekiwane: "Brak"', async () => {
          expect(
            school.expectedMedal,
            `Szkoła ${school.id} bez historii medalowości powinna mieć wartość Brak`,
          ).toBe("Brak");
        });

        console.log(`MED-51: szkoła ${school.id}. ` + `Brak wpisów medalowości do sprawdzenia.`);

        continue;
      }

      for (const entry of entries) {
        await test.step('Sprawdzenie: zgodność wartości — entry.source; oczekiwane: "Formularz klubowy"', async () => {
          expect(
            entry.source,
            `Wpis "${entry.value}" szkoły ${school.id} powinien mieć źródło Formularz klubowy`,
          ).toBe("Formularz klubowy");
        });
      }

      console.log(`MED-51: szkoła ${school.id}. ` + `Sprawdzono źródło ${entries.length} wpisów.`);
    }
  });

  test("MED-52: data wpisu medalowości przypada na 1 października roku kończącego sezon", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      const entries = await collectMedalHistoryEntries(page, history);

      if (entries.length === 0) {
        await test.step('Sprawdzenie: zgodność wartości — school.expectedMedal; oczekiwane: "Brak"', async () => {
          expect(
            school.expectedMedal,
            `Szkoła ${school.id} bez historii medalowości powinna mieć wartość Brak`,
          ).toBe("Brak");
        });

        console.log(`MED-52: szkoła ${school.id}. ` + `Brak wpisów medalowości do sprawdzenia.`);

        continue;
      }

      for (const entry of entries) {
        const match = entry.value.match(/^(\d{4})\/(\d{4}) (Złoto|Srebro|Brąz|Brak)$/);

        await test.step("Sprawdzenie: negacja — toBeNull — match", async () => {
          expect(match, `Nieprawidłowy wpis historii medalowości: "${entry.value}"`).not.toBeNull();
        });

        const seasonEndYear = match![2];

        const expectedDate = `${seasonEndYear}-10-01`;

        await test.step("Sprawdzenie: zgodność ze wzorcem — entry.date; oczekiwane: new RegExp(`^${expectedDate} \\\\d{2}:\\\\d{2}$`)", async () => {
          expect(
            entry.date,
            `Wpis "${entry.value}" szkoły ${school.id} powinien być zapisany 1 października ${seasonEndYear}`,
          ).toMatch(new RegExp(`^${expectedDate} \\d{2}:\\d{2}$`));
        });
      }

      console.log(`MED-52: szkoła ${school.id}. ` + `Sprawdzono datę ${entries.length} wpisów.`);
    }
  });

  test("MED-53: wszystkie wpisy historii medalowości są zapisane przez automat", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [GOLD_SCHOOL, SILVER_SCHOOL, BRONZE_SCHOOL, NO_MEDAL_SCHOOL];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      const entries = await collectMedalHistoryEntries(page, history);

      if (entries.length === 0) {
        await test.step('Sprawdzenie: zgodność wartości — school.expectedMedal; oczekiwane: "Brak"', async () => {
          expect(
            school.expectedMedal,
            `Szkoła ${school.id} bez historii medalowości powinna mieć wartość Brak`,
          ).toBe("Brak");
        });

        console.log(`MED-53: szkoła ${school.id}. ` + `Brak wpisów medalowości do sprawdzenia.`);

        continue;
      }

      for (const entry of entries) {
        await test.step('Sprawdzenie: zgodność wartości — entry.author; oczekiwane: "automat"', async () => {
          expect(
            entry.author,
            `Wpis "${entry.value}" szkoły ${school.id} powinien zostać zapisany przez automat`,
          ).toBe("automat");
        });
      }

      console.log(`MED-53: szkoła ${school.id}. ` + `Sprawdzono autora ${entries.length} wpisów.`);
    }
  });

  test("MED-54: wyszukiwanie po ID szkoły ma priorytet nad filtrem medalu", async ({ page }) => {
    const app = new Octopus(page);

    const search = await prepareSchoolSearchByIdAndMedal(app, BRONZE_SCHOOL.id, "Złoto");

    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());

      return (
        url.pathname === "/api/InstitutionBrowser/GetInstitutions" &&
        response.request().method() === "GET"
      );
    });

    await search
      .getByRole("button", {
        name: "Szukaj",
        exact: true,
      })
      .click();

    const response = await responsePromise;

    await test.step("Sprawdzenie: spełnienie warunku — response.ok()", async () => {
      expect(
        response.ok(),
        "Wyszukiwanie szkoły powinno zakończyć się poprawną odpowiedzią API",
      ).toBeTruthy();
    });

    const url = new URL(response.url());

    const filterModel = JSON.parse(url.searchParams.get("filterModel")!);

    const body = await response.json();

    console.log(
      `MED-54: wyszukiwanie ID=${BRONZE_SCHOOL.id} + medal Złoto. ` +
        `Do API wysłano institutionIds=${JSON.stringify(filterModel.institutionIds)}, ` +
        `medal=${JSON.stringify(filterModel.medal)}. ` +
        `API zwróciło ${body.data?.length ?? 0} rekordów.`,
    );

    await test.step("Sprawdzenie: obecność oczekiwanego elementu — filterModel.institutionIds.map(String); oczekiwane: BRONZE_SCHOOL.id", async () => {
      expect(
        filterModel.institutionIds.map(String),
        "Do API powinno zostać wysłane ID szkoły 66109",
      ).toContain(BRONZE_SCHOOL.id);
    });

    await test.step("Sprawdzenie: zgodność całej struktury i wartości — filterModel.medal; oczekiwane: [3]", async () => {
      expect(filterModel.medal, "Do API powinien zostać wysłany również filtr Złoto").toEqual([3]);
    });

    await test.step("Sprawdzenie: liczba elementów — body.data; oczekiwane: 1", async () => {
      expect(
        body.data,
        "Pomimo niezgodnego filtra medalu wyszukiwanie po ID powinno zwrócić dokładnie jedną szkołę",
      ).toHaveLength(1);
    });

    const returnedSchool = body.data[0];

    await test.step("Sprawdzenie: zgodność wartości — String(returnedSchool.id); oczekiwane: BRONZE_SCHOOL.id", async () => {
      expect(String(returnedSchool.id), "Powinna zostać zwrócona szkoła wskazana przez ID").toBe(
        BRONZE_SCHOOL.id,
      );
    });

    await test.step('Sprawdzenie: zgodność wartości — returnedSchool.informationAboutMedalCategory?.medalCategoryName; oczekiwane: "Brąz"', async () => {
      expect(
        returnedSchool.informationAboutMedalCategory?.medalCategoryName,
        "Zwrócona szkoła powinna zachować swój rzeczywisty medal",
      ).toBe("Brąz");
    });

    console.log(
      `MED-54: ID ma priorytet nad pozostałymi filtrami. ` +
        `Pomimo wybrania Złoto zwrócono szkołę ${returnedSchool.id} ` +
        `z rzeczywistym medalem ${returnedSchool.informationAboutMedalCategory?.medalCategoryName}.`,
    );
  });

  test("MED-55: filtrowanie bez ID zwraca tylko szkoły z wybranym medalem", async ({ page }) => {
    const app = new Octopus(page);

    const { results, filterModel, schools } =
      await test.step("API: wyszukiwanie szkół według medali", async () =>
        searchSchoolsByMedalsWithApi(app, ["Brąz"]));

    await test.step("Sprawdzenie: liczba elementów — filterModel.institutionIds ?? []; oczekiwane: 0", async () => {
      expect(
        filterModel.institutionIds ?? [],
        "Przy wyszukiwaniu wyłącznie po medalu nie powinno być filtra ID szkoły",
      ).toHaveLength(0);
    });

    await test.step("Sprawdzenie: liczba elementów — filterModel.medal; oczekiwane: 1", async () => {
      expect(
        filterModel.medal,
        "Do API powinien zostać przekazany dokładnie jeden filtr medalu",
      ).toHaveLength(1);
    });

    await test.step("Sprawdzenie: wartość powyżej granicy — schools.length; granica: 0", async () => {
      expect(
        schools.length,
        "API powinno zwrócić co najmniej jedną szkołę z medalem Brąz",
      ).toBeGreaterThan(0);
    });

    for (const school of schools) {
      const medal = school.informationAboutMedalCategory?.medalCategoryName;

      await test.step('Sprawdzenie: zgodność wartości — medal; oczekiwane: "Brąz"', async () => {
        expect(medal, `Szkoła ${school.id} została zwrócona mimo innego medalu`).toBe("Brąz");
      });
    }

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, ["Brąz"]));

    console.log(
      `MED-55: wyszukiwanie bez ID. ` +
        `Filtr medal=${JSON.stringify(filterModel.medal)}. ` +
        `API zwróciło ${schools.length} szkół. ` +
        `Wszystkie mają medal Brąz. ` +
        `institutionIds=${JSON.stringify(filterModel.institutionIds ?? [])}.`,
    );
  });

  test("MED-56: multiselect medalu jest poprawnie przekazywany do API i zwraca tylko wybrane medale", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const selectedMedals: SchoolMedal[] = ["Złoto", "Srebro"];

    const { results, filterModel, schools } =
      await test.step("API: wyszukiwanie szkół według medali", async () =>
        searchSchoolsByMedalsWithApi(app, selectedMedals));

    await test.step("Sprawdzenie: liczba elementów — filterModel.institutionIds ?? []; oczekiwane: 0", async () => {
      expect(
        filterModel.institutionIds ?? [],
        "Przy filtrowaniu wyłącznie po medalach nie powinno być filtra ID szkoły",
      ).toHaveLength(0);
    });

    await test.step("Sprawdzenie: liczba elementów — filterModel.medal; oczekiwane: 2", async () => {
      expect(
        filterModel.medal,
        "Do API powinny zostać przekazane dokładnie dwa medale",
      ).toHaveLength(2);
    });

    await test.step("Sprawdzenie: wartość powyżej granicy — schools.length; granica: 0", async () => {
      expect(schools.length, "API powinno zwrócić co najmniej jedną szkołę").toBeGreaterThan(0);
    });

    const apiMedals = new Set<SchoolMedal>();

    for (const school of schools) {
      const medal = school.informationAboutMedalCategory?.medalCategoryName as SchoolMedal;

      await test.step("Sprawdzenie: obecność oczekiwanego elementu — selectedMedals; oczekiwane: medal", async () => {
        expect(
          selectedMedals,
          `API zwróciło szkołę ${school.id} z niedozwolonym medalem "${medal}"`,
        ).toContain(medal);
      });

      apiMedals.add(medal);
    }

    await test.step('Sprawdzenie: spełnienie warunku — apiMedals.has("Złoto")', async () => {
      expect(
        apiMedals.has("Złoto"),
        "API powinno zwrócić co najmniej jedną szkołę ze złotym medalem",
      ).toBeTruthy();
    });

    await test.step('Sprawdzenie: spełnienie warunku — apiMedals.has("Srebro")', async () => {
      expect(
        apiMedals.has("Srebro"),
        "API powinno zwrócić co najmniej jedną szkołę ze srebrnym medalem",
      ).toBeTruthy();
    });

    await test.step("Sprawdzenie: expectSchoolResultsMedals", async () =>
      expectSchoolResultsMedals(results, selectedMedals));

    console.log(
      `MED-56: wybrano ${selectedMedals.join(" + ")}. ` +
        `Do API przekazano ${filterModel.medal.length} wartości medalu. ` +
        `API zwróciło ${schools.length} szkół. ` +
        `Medale obecne w odpowiedzi: ${[...apiMedals].join(", ")}.`,
    );
  });

  // TESTY DO SPRAWDZENIA W MOMECIE WYRÓWNANIA DANYCH MEDALOWYCH
  //   test("MED-57: każda szkoła z medalem Brąz ma dokładnie jeden przedmiot medalowy", async ({
  //     page,
  //   }) => {
  //     const app = new Octopus(page);

  //     const { schools } = await searchSchoolsByMedalsWithApi(app, ["Brąz"]);

  //     expect(
  //       schools.length,
  //       "API powinno zwrócić co najmniej jedną szkołę z medalem Brąz",
  //     ).toBeGreaterThan(0);

  //     console.log(
  //       `MED-57: API zwróciło ${schools.length} szkół dla filtra Brąz.`,
  //     );

  //     for (const school of schools) {
  //       const medal = school.informationAboutMedalCategory
  //         ?.medalCategoryName as SchoolMedal;

  //       const subjectNames =
  //         school.informationAboutMedalCategory?.subjectNames ?? [];

  //       console.log(
  //         `MED-57: szkoła ${school.id}. ` +
  //           `Medal: ${medal}. ` +
  //           `Przedmioty: ${JSON.stringify(subjectNames)}.`,
  //       );

  //       expect(medal, `Szkoła ${school.id} powinna mieć medal Brąz`).toBe("Brąz");

  //       expectMedalMatchesSubjectCount(medal, subjectNames);

  //       expectUniqueMedalSubjects(subjectNames);
  //     }
  //   });

  //   test("MED-58: każda szkoła z medalem Srebro ma dokładnie dwa przedmioty medalowe", async ({
  //     page,
  //   }) => {
  //     const app = new Octopus(page);

  //     const { schools } = await searchSchoolsByMedalsWithApi(app, ["Srebro"]);

  //     expect(
  //       schools.length,
  //       "API powinno zwrócić co najmniej jedną szkołę z medalem Srebro",
  //     ).toBeGreaterThan(0);

  //     console.log(
  //       `MED-58: API zwróciło ${schools.length} szkół dla filtra Srebro.`,
  //     );

  //     for (const school of schools) {
  //       const medal = school.informationAboutMedalCategory
  //         ?.medalCategoryName as SchoolMedal;

  //       const subjectNames =
  //         school.informationAboutMedalCategory?.subjectNames ?? [];

  //       console.log(
  //         `MED-58: szkoła ${school.id}. ` +
  //           `Medal: ${medal}. ` +
  //           `Przedmioty: ${JSON.stringify(subjectNames)}.`,
  //       );

  //       expect(medal, `Szkoła ${school.id} powinna mieć medal Srebro`).toBe(
  //         "Srebro",
  //       );

  //       expectMedalMatchesSubjectCount(medal, subjectNames);

  //       expectUniqueMedalSubjects(subjectNames);
  //     }
  //   });

  //   test("MED-59: każda szkoła z medalem Złoto ma co najmniej trzy przedmioty medalowe", async ({
  //     page,
  //   }) => {
  //     const app = new Octopus(page);

  //     const { schools } = await searchSchoolsByMedalsWithApi(app, ["Złoto"]);

  //     expect(
  //       schools.length,
  //       "API powinno zwrócić co najmniej jedną szkołę z medalem Złoto",
  //     ).toBeGreaterThan(0);

  //     console.log(
  //       `MED-59: API zwróciło ${schools.length} szkół dla filtra Złoto.`,
  //     );

  //     for (const school of schools) {
  //       const medal = school.informationAboutMedalCategory
  //         ?.medalCategoryName as SchoolMedal;

  //       const subjectNames =
  //         school.informationAboutMedalCategory?.subjectNames ?? [];

  //       console.log(
  //         `MED-59: szkoła ${school.id}. ` +
  //           `Medal: ${medal}. ` +
  //           `Przedmioty (${subjectNames.length}): ${JSON.stringify(subjectNames)}.`,
  //       );

  //       expect(medal, `Szkoła ${school.id} powinna mieć medal Złoto`).toBe(
  //         "Złoto",
  //       );

  //       expectMedalMatchesSubjectCount(medal, subjectNames);

  //       expectUniqueMedalSubjects(subjectNames);
  //     }
  //   });

  test("MED-60: każda szkoła z medalem Brak nie ma przedmiotów medalowych", async ({ page }) => {
    const app = new Octopus(page);

    const { filterModel, schools } =
      await test.step("API: wyszukiwanie szkół według medali", async () =>
        searchSchoolsByMedalsWithApi(app, ["Brak"]));

    await test.step("Sprawdzenie: wartość powyżej granicy — schools.length; granica: 0", async () => {
      expect(
        schools.length,
        "API powinno zwrócić co najmniej jedną szkołę z medalem Brak. " +
          `Przesłany filtr: ${JSON.stringify(filterModel.medal)}`,
      ).toBeGreaterThan(0);
    });

    console.log(`MED-60: API zwróciło ${schools.length} szkół dla filtra Brak.`);

    for (const school of schools) {
      const medal = school.informationAboutMedalCategory?.medalCategoryName as SchoolMedal;

      const subjectNames = school.informationAboutMedalCategory?.subjectNames ?? [];

      console.log(
        `MED-60: szkoła ${school.id}. ` +
          `Medal: ${medal}. ` +
          `Przedmioty: ${JSON.stringify(subjectNames)}.`,
      );

      await test.step('Sprawdzenie: zgodność wartości — medal; oczekiwane: "Brak"', async () => {
        expect(medal, `Szkoła ${school.id} powinna mieć medal Brak`).toBe("Brak");
      });

      expectMedalMatchesSubjectCount(medal, subjectNames);
    }
  });
});
