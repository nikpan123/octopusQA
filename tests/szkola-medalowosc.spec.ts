import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";

import {
  GOLD_SCHOOL,
  SILVER_SCHOOL,
  BRONZE_SCHOOL,
  NO_MEDAL_SCHOOL,
  expectSchoolMedal,
  expectMedalReadOnly,
  expectMedalTooltip,
  expectNoMedalTooltip,
  openMedalSchool,
  searchSchoolById,
  openSchoolHistory,
  medalHistoryRows,
  medalHistoryRowByValue,
  historyFieldCell,
  historyValueCell,
  historyAuthorCell,
  historySourceCell,
  historyDateCell,
  searchSchoolsByMedal,
  searchSchoolsByMedals,
  expectSchoolResultsMedals,
  getSchoolMedalApiData,
  getMedalTooltipSubjects,
  getSchoolMedalValue,
  expectMedalMatchesSubjectCount,
  expectUniqueMedalSubjects,
  schoolTeachersBySubject,
  getLatestMedalHistoryValue,
  prepareSchoolSearchByIdAndMedal,
  searchSchoolsByMedalsWithApi,
  waitForSchoolTeachersLoaded,
} from "./support/school-medal";

test.describe("Medalowość szkoły", () => {
  test("MED-01: szkoła ze złotym medalem wyświetla wartość Złoto w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    await expectSchoolMedal(page, "Złoto");
  });

  test("MED-02: pole Medal dla szkoły ze złotym medalem jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    await expectSchoolMedal(page, "Złoto");
    await expectMedalReadOnly(page);
  });

  test("MED-03: najechanie na złoty medal wyświetla informację o przedmiotach składających się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    await expectSchoolMedal(page, "Złoto");
    await expectMedalTooltip(page);
  });

  test("MED-04: tooltip złotego medalu wyświetla przedmioty składające się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    await expectSchoolMedal(page, "Złoto");

    await expectMedalTooltip(page, [
      "Matematyka",
      "Język polski",
      "Historia",
      "Fizyka",
      "Edukacja wczesnoszkolna",
    ]);
  });

  test("MED-05: złoty medal jest widoczny w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, GOLD_SCHOOL);

    await expect(schoolRow).toContainText(GOLD_SCHOOL.name);
    await expect(schoolRow).toContainText("Złoto");
  });

  test("MED-06: szkoła ze srebrnym medalem wyświetla wartość Srebro w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    await expectSchoolMedal(page, "Srebro");
  });

  test("MED-07: pole Medal dla szkoły ze srebrnym medalem jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    await expectSchoolMedal(page, "Srebro");
    await expectMedalReadOnly(page);
  });

  test("MED-08: najechanie na srebrny medal wyświetla informację o przedmiotach składających się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    await expectSchoolMedal(page, "Srebro");
    await expectMedalTooltip(page);
  });

  test("MED-09: tooltip srebrnego medalu wyświetla przedmioty składające się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, SILVER_SCHOOL);

    await expectSchoolMedal(page, "Srebro");

    await expectMedalTooltip(page, ["Matematyka", "Geografia"]);
  });

  test("MED-10: srebrny medal jest widoczny w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, SILVER_SCHOOL);

    await expect(schoolRow).toContainText(SILVER_SCHOOL.name);
    await expect(schoolRow).toContainText("Srebro");
  });

  test("MED-11: szkoła z brązowym medalem wyświetla wartość Brąz w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await expectSchoolMedal(page, "Brąz");
  });

  test("MED-12: pole Medal dla szkoły z brązowym medalem jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await expectSchoolMedal(page, "Brąz");
    await expectMedalReadOnly(page);
  });

  test("MED-13: najechanie na brązowy medal wyświetla informację o przedmiotach składających się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await expectSchoolMedal(page, "Brąz");
    await expectMedalTooltip(page);
  });

  test("MED-14: tooltip brązowego medalu wyświetla przedmiot składający się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, BRONZE_SCHOOL);

    await expectSchoolMedal(page, "Brąz");

    await expectMedalTooltip(page, ["Matematyka"]);
  });

  test("MED-15: brązowy medal jest widoczny w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, BRONZE_SCHOOL);

    await expect(schoolRow).toContainText(BRONZE_SCHOOL.name);
    await expect(schoolRow).toContainText("Brąz");
  });

  test("MED-16: szkoła bez medalu wyświetla wartość Brak w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, NO_MEDAL_SCHOOL);

    await expectSchoolMedal(page, "Brak");
  });

  test("MED-17: pole Medal dla szkoły bez medalu jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, NO_MEDAL_SCHOOL);

    await expectSchoolMedal(page, "Brak");
    await expectMedalReadOnly(page);
  });

  test("MED-18: najechanie na wartość Brak nie wyświetla tooltipa z przedmiotami", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, NO_MEDAL_SCHOOL);

    await expectSchoolMedal(page, "Brak");
    await expectNoMedalTooltip(page);
  });

  test("MED-19: wartość Brak jest widoczna w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schoolRow = await searchSchoolById(app, NO_MEDAL_SCHOOL);

    await expect(schoolRow).toContainText(NO_MEDAL_SCHOOL.name);
    await expect(schoolRow).toContainText("Brak");
  });

  test("MED-20: historia zmian szkoły zawiera wpis dotyczący złotego medalu", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRow = medalHistoryRowByValue(history, "2025/2026 Złoto");

    await expect(medalRow).toHaveCount(1);

    await expect(historyFieldCell(medalRow)).toHaveText("Medal");

    await expect(historyValueCell(medalRow)).toHaveText("2025/2026 Złoto");

    await expect(historyAuthorCell(medalRow)).toHaveText("automat");

    await expect(historySourceCell(medalRow)).toHaveText("Formularz klubowy");

    await expect(historyDateCell(medalRow)).toHaveText("2026-10-01 00:00");
  });

  test("MED-21: historia zawiera tylko jeden wpis medalowy dla danego roku szkolnego", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRowsForSeason = medalHistoryRows(history).filter({
      hasText: "2025/2026",
    });

    await expect(medalRowsForSeason).toHaveCount(1);
  });

  test("MED-22: wartość wpisu medalowego ma format RRRR/RRRR Medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRows = medalHistoryRows(history);

    await expect(medalRows.first()).toBeVisible();

    await expect(historyValueCell(medalRows.first())).toHaveText(
      /^\d{4}\/\d{4} (Złoto|Srebro|Brąz|Brak)$/,
    );
  });

  test("MED-23: wpisy medalowe w historii mają źródło Formularz klubowy", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRows = medalHistoryRows(history);

    await expect(medalRows.first()).toBeVisible();

    const count = await medalRows.count();

    for (let i = 0; i < count; i++) {
      await expect(historySourceCell(medalRows.nth(i))).toHaveText(
        "Formularz klubowy",
      );
    }
  });

  test("MED-24: wpisy medalowe w historii mają uzupełnionego autora", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRows = medalHistoryRows(history);

    await expect(medalRows.first()).toBeVisible();

    const count = await medalRows.count();

    for (let i = 0; i < count; i++) {
      await expect(historyAuthorCell(medalRows.nth(i))).not.toHaveText("");
    }
  });

  test("MED-25: wpisy medalowe w historii są zapisane z datą 1 października", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRows = medalHistoryRows(history);

    await expect(medalRows.first()).toBeVisible();

    const count = await medalRows.count();

    for (let i = 0; i < count; i++) {
      await expect(historyDateCell(medalRows.nth(i))).toHaveText(
        /^\d{4}-10-01 \d{2}:\d{2}$/,
      );
    }
  });

  test("MED-26: wpisy medalowe w historii są posortowane od najnowszego sezonu do najstarszego", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await openMedalSchool(app, GOLD_SCHOOL);

    const history = await openSchoolHistory(page);

    const medalRows = medalHistoryRows(history);

    await expect(medalRows.first()).toBeVisible();

    const count = await medalRows.count();

    expect(count).toBeGreaterThan(1);

    const seasons: number[] = [];

    for (let i = 0; i < count; i++) {
      const value = await historyValueCell(medalRows.nth(i)).innerText();

      const match = value.match(/^(\d{4})\/\d{4}/);

      expect(
        match,
        `Nie udało się odczytać roku szkolnego z wartości: "${value}"`,
      ).not.toBeNull();

      seasons.push(Number(match![1]));
    }

    const expectedOrder = [...seasons].sort((a, b) => b - a);

    expect(seasons).toEqual(expectedOrder);
  });

  test("MED-27: wyszukiwanie po Medal = Złoto zwraca tylko szkoły ze złotym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Złoto");

    await expectSchoolResultsMedals(results, ["Złoto"]);
  });

  test("MED-28: wyszukiwanie po Medal = Srebro zwraca tylko szkoły ze srebrnym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Srebro");

    await expectSchoolResultsMedals(results, ["Srebro"]);
  });

  test("MED-29: wyszukiwanie po Medal = Brąz zwraca tylko szkoły z brązowym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Brąz");

    await expectSchoolResultsMedals(results, ["Brąz"]);
  });

  test("MED-30: wyszukiwanie po Medal = Brak zwraca tylko szkoły bez medalu", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedal(app, "Brak");

    await expectSchoolResultsMedals(results, ["Brak"]);
  });

  test("MED-31: wyszukiwanie po Medal = Złoto i Srebro zwraca szkoły z oboma wybranymi medalami", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const results = await searchSchoolsByMedals(app, ["Złoto", "Srebro"]);

    await expectSchoolResultsMedals(results, ["Złoto", "Srebro"]);
  });

  test("MED-32: API zwraca złoty medal i właściwe przedmioty dla szkoły", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const medalData = await getSchoolMedalApiData(app, GOLD_SCHOOL);

    console.log(
      `MED-32: szkoła ${GOLD_SCHOOL.id} "${GOLD_SCHOOL.name}". ` +
        `API zwraca medal: ${medalData.medalCategoryName}. ` +
        `Liczba przedmiotów medalowych: ${medalData.subjectNames.length}. ` +
        `Przedmioty: ${medalData.subjectNames.join(", ")}.`,
    );

    expect(medalData.medalCategoryName).toBe("Złoto");

    expect(medalData.subjectNames).toEqual([
      "Matematyka",
      "Język polski",
      "Historia",
      "Fizyka",
      "Edukacja wczesnoszkolna",
    ]);
  });

  test("MED-33: przedmioty złotego medalu w UI są zgodne z danymi zwracanymi przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, GOLD_SCHOOL);

    const uiSubjects = await getMedalTooltipSubjects(page);

    console.log(
      `MED-33: API zwraca ${apiMedalData.subjectNames.length} przedmiotów medalowych: ` +
        `${apiMedalData.subjectNames.join(", ")}. ` +
        `Tooltip UI pokazuje ${uiSubjects.length}: ${uiSubjects.join(", ")}.`,
    );

    expect([...uiSubjects].sort()).toEqual(
      [...apiMedalData.subjectNames].sort(),
    );
  });

  test("MED-34: wartość złotego medalu w UI jest zgodna z wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, GOLD_SCHOOL);

    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-34: medal zwrócony przez API: ${apiMedalData.medalCategoryName}. ` +
        `Medal wyświetlany w UI: ${uiMedal}.`,
    );

    expect(uiMedal).toBe(apiMedalData.medalCategoryName);
  });

  test("MED-35: API zwraca srebrny medal i właściwe przedmioty dla szkoły", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const medalData = await getSchoolMedalApiData(app, SILVER_SCHOOL);

    console.log(
      `MED-35: szkoła ${SILVER_SCHOOL.id} "${SILVER_SCHOOL.name}". ` +
        `API zwraca medal: ${medalData.medalCategoryName}. ` +
        `Liczba przedmiotów medalowych: ${medalData.subjectNames.length}. ` +
        `Przedmioty: ${medalData.subjectNames.join(", ")}.`,
    );

    expect(medalData.medalCategoryName).toBe("Srebro");

    expect([...medalData.subjectNames].sort()).toEqual(
      ["Matematyka", "Geografia"].sort(),
    );
  });

  test("MED-36: przedmioty srebrnego medalu w UI są zgodne z danymi zwracanymi przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, SILVER_SCHOOL);

    const uiSubjects = await getMedalTooltipSubjects(page);

    console.log(
      `MED-36: API zwraca ${apiMedalData.subjectNames.length} przedmiotów medalowych: ` +
        `${apiMedalData.subjectNames.join(", ")}. ` +
        `Tooltip UI pokazuje ${uiSubjects.length}: ${uiSubjects.join(", ")}.`,
    );

    expect([...uiSubjects].sort()).toEqual(
      [...apiMedalData.subjectNames].sort(),
    );
  });

  test("MED-37: wartość srebrnego medalu w UI jest zgodna z wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, SILVER_SCHOOL);

    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-37: medal zwrócony przez API: ${apiMedalData.medalCategoryName}. ` +
        `Medal wyświetlany w UI: ${uiMedal}.`,
    );

    expect(uiMedal).toBe(apiMedalData.medalCategoryName);
  });

  test("MED-38: API zwraca brązowy medal i właściwe przedmioty dla szkoły", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const medalData = await getSchoolMedalApiData(app, BRONZE_SCHOOL);

    console.log(
      `MED-38: szkoła ${BRONZE_SCHOOL.id} "${BRONZE_SCHOOL.name}". ` +
        `API zwraca medal: ${medalData.medalCategoryName}. ` +
        `Liczba przedmiotów medalowych: ${medalData.subjectNames.length}. ` +
        `Przedmioty: ${medalData.subjectNames.join(", ")}.`,
    );

    expect(medalData.medalCategoryName).toBe("Brąz");

    expect([...medalData.subjectNames].sort()).toEqual(["Matematyka"].sort());
  });

  test("MED-39: przedmioty brązowego medalu w UI są zgodne z danymi zwracanymi przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, BRONZE_SCHOOL);

    const uiSubjects = await getMedalTooltipSubjects(page);

    console.log(
      `MED-39: API zwraca ${apiMedalData.subjectNames.length} przedmiot medalowy: ` +
        `${apiMedalData.subjectNames.join(", ")}. ` +
        `Tooltip UI pokazuje ${uiSubjects.length}: ${uiSubjects.join(", ")}.`,
    );

    expect([...uiSubjects].sort()).toEqual(
      [...apiMedalData.subjectNames].sort(),
    );
  });

  test("MED-40: wartość brązowego medalu w UI jest zgodna z wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, BRONZE_SCHOOL);

    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-40: medal zwrócony przez API: ${apiMedalData.medalCategoryName}. ` +
        `Medal wyświetlany w UI: ${uiMedal}.`,
    );

    expect(uiMedal).toBe(apiMedalData.medalCategoryName);
  });

  test("MED-41: API zwraca Brak i pustą listę przedmiotów dla szkoły bez medalu", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const medalData = await getSchoolMedalApiData(app, NO_MEDAL_SCHOOL);

    console.log(
      `MED-41: szkoła ${NO_MEDAL_SCHOOL.id} "${NO_MEDAL_SCHOOL.name}". ` +
        `API zwraca medal: ${medalData.medalCategoryName}. ` +
        `Liczba przedmiotów medalowych: ${medalData.subjectNames.length}.`,
    );

    expect(medalData.medalCategoryName).toBe("Brak");
    expect(medalData.subjectNames).toEqual([]);
  });

  test("MED-42: wartość Brak w UI jest zgodna z wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, NO_MEDAL_SCHOOL);

    const uiMedal = await getSchoolMedalValue(page);

    console.log(
      `MED-42: medal zwrócony przez API: ${apiMedalData.medalCategoryName}. ` +
        `Wartość wyświetlana w UI: ${uiMedal}.`,
    );

    expect(uiMedal).toBe(apiMedalData.medalCategoryName);
  });

  test("MED-43: brak przedmiotów w API jest zgodny z brakiem tooltipa w UI", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const apiMedalData = await getSchoolMedalApiData(app, NO_MEDAL_SCHOOL);

    console.log(
      `MED-43: API zwraca medal "${apiMedalData.medalCategoryName}" ` +
        `oraz ${apiMedalData.subjectNames.length} przedmiotów medalowych. ` +
        `UI nie powinno wyświetlać tooltipa.`,
    );

    expect(apiMedalData.medalCategoryName).toBe("Brak");
    expect(apiMedalData.subjectNames).toEqual([]);

    await expectNoMedalTooltip(page);
  });

  test("MED-44: medal szkoły jest zgodny z liczbą przedmiotów zwracanych przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      const medalData = await getSchoolMedalApiData(app, school);

      console.log(
        `MED-44: szkoła ${school.id} "${school.name}". ` +
          `Medal: ${medalData.medalCategoryName}. ` +
          `Liczba przedmiotów medalowych: ${medalData.subjectNames.length}. ` +
          `Przedmioty: ${
            medalData.subjectNames.length > 0
              ? medalData.subjectNames.join(", ")
              : "brak"
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
      const medalData = await getSchoolMedalApiData(app, school);

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

    const medalData = await getSchoolMedalApiData(app, BRONZE_SCHOOL);

    const mathTeachers = schoolTeachersBySubject(page, "MAT SP");

    await expect(mathTeachers.first()).toBeVisible();

    const mathTeachersCount = await mathTeachers.count();
    const medalSubjectsCount = medalData.subjectNames.length;

    console.log(
      `MED-46: pobrano ${mathTeachersCount} nauczycieli MAT SP. ` +
        `API zwraca ${medalSubjectsCount} przedmiot medalowy: ${medalData.subjectNames.join(", ")}. ` +
        `Medal szkoły: ${medalData.medalCategoryName}.`,
    );

    expect(
      mathTeachersCount,
      "Szkoła powinna mieć co najmniej dwóch nauczycieli MAT SP",
    ).toBeGreaterThanOrEqual(2);

    expect(medalData.medalCategoryName).toBe("Brąz");

    expect(medalData.subjectNames).toEqual(["Matematyka"]);
  });

  test("MED-47: medal w wynikach wyszukiwania szkoły jest zgodny z wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      const apiMedalData = await getSchoolMedalApiData(app, school);

      const schoolRow = await searchSchoolById(app, school);

      const medalCell = schoolRow.getByRole("gridcell", {
        name: apiMedalData.medalCategoryName ?? "",
        exact: true,
      });

      await expect(medalCell).toBeVisible();

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

    const medalData = await getSchoolMedalApiData(app, BRONZE_SCHOOL);

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

    expect(
      mathCount,
      "W szkole powinien istnieć co najmniej jeden nauczyciel MAT SP",
    ).toBeGreaterThan(0);

    expect(
      polishCount,
      "W szkole powinien istnieć co najmniej jeden nauczyciel JPL SP",
    ).toBeGreaterThan(0);

    expect(
      historyCount,
      "W szkole powinien istnieć co najmniej jeden nauczyciel HIS SP",
    ).toBeGreaterThan(0);

    expect(
      physicsCount,
      "W szkole powinien istnieć co najmniej jeden nauczyciel FIZ SP",
    ).toBeGreaterThan(0);

    expect(medalData.medalCategoryName, "Szkoła powinna mieć medal Brąz").toBe(
      "Brąz",
    );

    expect(
      medalData.subjectNames,
      "Do medalowości powinien być zaliczony tylko kwalifikowany przedmiot",
    ).toEqual(["Matematyka"]);
  });

  test("MED-49: najnowszy wpis historii medalu jest zgodny z aktualną wartością zwracaną przez API", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      const apiMedalData = await getSchoolMedalApiData(app, school);

      const history = await openSchoolHistory(page);

      const latestHistoryValue = await getLatestMedalHistoryValue(history);

      const historyMedal = latestHistoryValue.replace(/^\d{4}\/\d{4}\s+/, "");

      console.log(
        `MED-49: szkoła ${school.id} "${school.name}". ` +
          `Najnowszy wpis historii: "${latestHistoryValue}". ` +
          `Medal w API: ${apiMedalData.medalCategoryName}.`,
      );

      expect(
        historyMedal,
        `Historia medalowości szkoły ${school.id} powinna być zgodna z API`,
      ).toBe(apiMedalData.medalCategoryName);
    }
  });

  test("MED-50: historia medalowości zawiera maksymalnie jeden wpis dla każdego roku szkolnego", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      const rows = medalHistoryRows(history);

      await expect(rows.first()).toBeVisible();

      const count = await rows.count();

      const seasons: string[] = [];

      for (let i = 0; i < count; i++) {
        const value = (await historyValueCell(rows.nth(i)).innerText()).trim();

        const match = value.match(/^(\d{4}\/\d{4}) (Złoto|Srebro|Brąz|Brak)$/);

        expect(
          match,
          `Nieprawidłowy wpis historii medalowości: "${value}"`,
        ).not.toBeNull();

        seasons.push(match![1]);
      }

      const uniqueSeasons = new Set(seasons);

      console.log(
        `MED-50: szkoła ${school.id} "${school.name}". ` +
          `Pobrano ${seasons.length} wpisów medalowości. ` +
          `Liczba unikalnych lat szkolnych: ${uniqueSeasons.size}. ` +
          `Lata: ${seasons.join(", ")}.`,
      );

      expect(
        uniqueSeasons.size,
        `Szkoła ${school.id} posiada więcej niż jeden wpis medalowości dla tego samego roku szkolnego`,
      ).toBe(seasons.length);
    }
  });

  test("MED-51: wszystkie wpisy historii medalowości mają źródło Formularz klubowy", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);

      const rows = medalHistoryRows(history);

      await expect(rows.first()).toBeVisible();

      const count = await rows.count();

      const sources: string[] = [];

      for (let i = 0; i < count; i++) {
        const source = (
          await historySourceCell(rows.nth(i)).innerText()
        ).trim();

        sources.push(source);

        expect(
          source,
          `Nieprawidłowe źródło wpisu medalowości szkoły ${school.id}`,
        ).toBe("Formularz klubowy");
      }

      console.log(
        `MED-51: szkoła ${school.id} "${school.name}". ` +
          `Sprawdzono ${count} wpisów medalowości. ` +
          `Źródła: ${sources.join(", ")}.`,
      );
    }
  });

  test("MED-52: data wpisu medalowości przypada na 1 października roku kończącego sezon", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);
      const rows = medalHistoryRows(history);

      await expect(rows.first()).toBeVisible();

      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);

        const value = (await historyValueCell(row).innerText()).trim();

        const date = (await historyDateCell(row).innerText()).trim();

        const match = value.match(
          /^(\d{4})\/(\d{4}) (Złoto|Srebro|Brąz|Brak)$/,
        );

        expect(
          match,
          `Nieprawidłowy wpis historii medalowości: "${value}"`,
        ).not.toBeNull();

        const seasonEndYear = match![2];

        const expectedDate = `${seasonEndYear}-10-01`;

        console.log(
          `MED-52: szkoła ${school.id}. ` +
            `Sezon: ${match![1]}/${seasonEndYear}. ` +
            `Medal: ${match![3]}. ` +
            `Data wpisu: ${date}. ` +
            `Oczekiwana data: ${expectedDate}.`,
        );

        expect(
          date,
          `Wpis medalowości "${value}" powinien być zapisany 1 października ${seasonEndYear}`,
        ).toMatch(new RegExp(`^${expectedDate} \\d{2}:\\d{2}$`));
      }
    }
  });

  test("MED-53: wszystkie wpisy historii medalowości są zapisane przez automat", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const schools = [
      GOLD_SCHOOL,
      SILVER_SCHOOL,
      BRONZE_SCHOOL,
      NO_MEDAL_SCHOOL,
    ];

    for (const school of schools) {
      await openMedalSchool(app, school);

      const history = await openSchoolHistory(page);
      const rows = medalHistoryRows(history);

      await expect(rows.first()).toBeVisible();

      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);

        const value = (await historyValueCell(row).innerText()).trim();

        const author = (await historyAuthorCell(row).innerText()).trim();

        console.log(
          `MED-53: szkoła ${school.id} "${school.name}". ` +
            `Wpis: "${value}". ` +
            `Autor: "${author}".`,
        );

        expect(
          author,
          `Wpis medalowości "${value}" szkoły ${school.id} powinien zostać zapisany przez automat`,
        ).toBe("automat");
      }
    }
  });

  test("MED-54: wyszukiwanie po ID szkoły ma priorytet nad filtrem medalu", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const search = await prepareSchoolSearchByIdAndMedal(
      app,
      BRONZE_SCHOOL.id,
      "Złoto",
    );

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

    expect(
      response.ok(),
      "Wyszukiwanie szkoły powinno zakończyć się poprawną odpowiedzią API",
    ).toBeTruthy();

    const url = new URL(response.url());

    const filterModel = JSON.parse(url.searchParams.get("filterModel")!);

    const body = await response.json();

    console.log(
      `MED-54: wyszukiwanie ID=${BRONZE_SCHOOL.id} + medal Złoto. ` +
        `Do API wysłano institutionIds=${JSON.stringify(filterModel.institutionIds)}, ` +
        `medal=${JSON.stringify(filterModel.medal)}. ` +
        `API zwróciło ${body.data?.length ?? 0} rekordów.`,
    );

    expect(
      filterModel.institutionIds.map(String),
      "Do API powinno zostać wysłane ID szkoły 66109",
    ).toContain(BRONZE_SCHOOL.id);

    expect(
      filterModel.medal,
      "Do API powinien zostać wysłany również filtr Złoto",
    ).toEqual([3]);

    expect(
      body.data,
      "Pomimo niezgodnego filtra medalu wyszukiwanie po ID powinno zwrócić dokładnie jedną szkołę",
    ).toHaveLength(1);

    const returnedSchool = body.data[0];

    expect(
      String(returnedSchool.id),
      "Powinna zostać zwrócona szkoła wskazana przez ID",
    ).toBe(BRONZE_SCHOOL.id);

    expect(
      returnedSchool.informationAboutMedalCategory?.medalCategoryName,
      "Zwrócona szkoła powinna zachować swój rzeczywisty medal",
    ).toBe("Brąz");

    console.log(
      `MED-54: ID ma priorytet nad pozostałymi filtrami. ` +
        `Pomimo wybrania Złoto zwrócono szkołę ${returnedSchool.id} ` +
        `z rzeczywistym medalem ${returnedSchool.informationAboutMedalCategory?.medalCategoryName}.`,
    );
  });

  test("MED-55: filtrowanie bez ID zwraca tylko szkoły z wybranym medalem", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const { results, filterModel, schools } =
      await searchSchoolsByMedalsWithApi(app, ["Brąz"]);

    expect(
      filterModel.institutionIds ?? [],
      "Przy wyszukiwaniu wyłącznie po medalu nie powinno być filtra ID szkoły",
    ).toHaveLength(0);

    expect(
      filterModel.medal,
      "Do API powinien zostać przekazany dokładnie jeden filtr medalu",
    ).toHaveLength(1);

    expect(
      schools.length,
      "API powinno zwrócić co najmniej jedną szkołę z medalem Brąz",
    ).toBeGreaterThan(0);

    for (const school of schools) {
      const medal = school.informationAboutMedalCategory?.medalCategoryName;

      expect(
        medal,
        `Szkoła ${school.id} została zwrócona mimo innego medalu`,
      ).toBe("Brąz");
    }

    await expectSchoolResultsMedals(results, ["Brąz"]);

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
      await searchSchoolsByMedalsWithApi(app, selectedMedals);

    expect(
      filterModel.institutionIds ?? [],
      "Przy filtrowaniu wyłącznie po medalach nie powinno być filtra ID szkoły",
    ).toHaveLength(0);

    expect(
      filterModel.medal,
      "Do API powinny zostać przekazane dokładnie dwa medale",
    ).toHaveLength(2);

    expect(
      schools.length,
      "API powinno zwrócić co najmniej jedną szkołę",
    ).toBeGreaterThan(0);

    const apiMedals = new Set<SchoolMedal>();

    for (const school of schools) {
      const medal = school.informationAboutMedalCategory
        ?.medalCategoryName as SchoolMedal;

      expect(
        selectedMedals,
        `API zwróciło szkołę ${school.id} z niedozwolonym medalem "${medal}"`,
      ).toContain(medal);

      apiMedals.add(medal);
    }

    expect(
      apiMedals.has("Złoto"),
      "API powinno zwrócić co najmniej jedną szkołę ze złotym medalem",
    ).toBeTruthy();

    expect(
      apiMedals.has("Srebro"),
      "API powinno zwrócić co najmniej jedną szkołę ze srebrnym medalem",
    ).toBeTruthy();

    await expectSchoolResultsMedals(results, selectedMedals);

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

  test("MED-60: każda szkoła z medalem Brak nie ma przedmiotów medalowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    const { schools } = await searchSchoolsByMedalsWithApi(app, ["Brak"]);

    expect(
      schools.length,
      "API powinno zwrócić co najmniej jedną szkołę z medalem Brak",
    ).toBeGreaterThan(0);

    console.log(
      `MED-60: API zwróciło ${schools.length} szkół dla filtra Brak.`,
    );

    for (const school of schools) {
      const medal = school.informationAboutMedalCategory
        ?.medalCategoryName as SchoolMedal;

      const subjectNames =
        school.informationAboutMedalCategory?.subjectNames ?? [];

      console.log(
        `MED-60: szkoła ${school.id}. ` +
          `Medal: ${medal}. ` +
          `Przedmioty: ${JSON.stringify(subjectNames)}.`,
      );

      expect(medal, `Szkoła ${school.id} powinna mieć medal Brak`).toBe("Brak");

      expectMedalMatchesSubjectCount(medal, subjectNames);
    }
  });
});
