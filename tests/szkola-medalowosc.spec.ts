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

    expect(medalData.medalCategoryName).toBe("Złoto");

    expect(medalData.subjectNames).toEqual([
      "Matematyka",
      "Język polski",
      "Historia",
      "Fizyka",
      "Edukacja wczesnoszkolna",
    ]);
  });
});
