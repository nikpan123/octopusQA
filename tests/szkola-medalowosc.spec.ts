import { test, expect } from "./support/fixtures";
import { Octopus, typeValue } from "./support/octopus";

const GOLD_SCHOOL = {
  id: "57616",
  name: "Szkoła Podstawowa nr 5",
} as const;

const SILVER_SCHOOL = {
  id: "85263",
  name: "Szkoła Podstawowa nr 379",
  city: "Warszawa",
} as const;

const BRONZE_SCHOOL = {
  id: "66109",
  name: "Szkoła Podstawowa w Raszkowie",
  city: "Raszków",
} as const;

const NO_MEDAL_SCHOOL = {
  id: "92928",
  name: "Szkoła Podstawowa nr 403",
  city: "Warszawa",
} as const;

test.describe("Medalowość szkoły", () => {
  test("MED-01: szkoła ze złotym medalem wyświetla wartość Złoto w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", GOLD_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(GOLD_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Złoto");
  });

  test("MED-02: pole Medal w danych podstawowych szkoły jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", GOLD_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(GOLD_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Złoto");
    await expect(medalInput).toBeDisabled();
  });

  test("MED-03: najechanie na złoty medal wyświetla informację o przedmiotach składających się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", GOLD_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(GOLD_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Złoto");

    await medalInput.hover();

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toBeVisible();
  });

  test("MED-04: tooltip złotego medalu wyświetla przedmioty składające się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", GOLD_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(GOLD_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Złoto");

    await medalInput.hover();

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toBeVisible();

    await expect(tooltip).toContainText("Matematyka");
    await expect(tooltip).toContainText("Język polski");
    await expect(tooltip).toContainText("Historia");
  });

  test("MED-05: złoty medal jest widoczny w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school");

    const search = await app.openSearch("school");

    await typeValue(app.field(search, "ID szkoły"), GOLD_SCHOOL.id);

    await search.getByRole("button", { name: "Szukaj", exact: true }).click();

    await expect(search).toHaveCount(0);

    const results = app.results("school");

    const schoolRow = results.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: GOLD_SCHOOL.id,
        exact: true,
      }),
    });

    await expect(schoolRow).toHaveCount(1);
    await expect(schoolRow).toContainText(GOLD_SCHOOL.name);
    await expect(schoolRow).toContainText("Złoto");
  });

  test("MED-06: szkoła ze srebrnym medalem wyświetla wartość Srebro w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", SILVER_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(SILVER_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Srebro");
  });

  test("MED-07: pole Medal dla szkoły ze srebrnym medalem jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", SILVER_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(SILVER_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Srebro");
    await expect(medalInput).toBeDisabled();
  });

  test("MED-08: najechanie na srebrny medal wyświetla informację o przedmiotach składających się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", SILVER_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(SILVER_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Srebro");

    await medalInput.hover();

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toBeVisible();
  });

  test("MED-09: tooltip srebrnego medalu wyświetla przedmioty składające się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", SILVER_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(SILVER_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Srebro");

    await medalInput.hover();

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toBeVisible();

    await expect(tooltip).toContainText("Matematyka");
    await expect(tooltip).toContainText("Geografia");
  });

  test("MED-10: srebrny medal jest widoczny w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school");

    const search = await app.openSearch("school");

    await typeValue(app.field(search, "ID szkoły"), SILVER_SCHOOL.id);

    await search.getByRole("button", { name: "Szukaj", exact: true }).click();

    await expect(search).toHaveCount(0);

    const results = app.results("school");

    const schoolRow = results.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: SILVER_SCHOOL.id,
        exact: true,
      }),
    });

    await expect(schoolRow).toHaveCount(1);
    await expect(schoolRow).toContainText(SILVER_SCHOOL.name);
    await expect(schoolRow).toContainText("Srebro");
  });

  test("MED-11: szkoła z brązowym medalem wyświetla wartość Brąz w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", BRONZE_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(BRONZE_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brąz");
  });

  test("MED-12: pole Medal dla szkoły z brązowym medalem jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", BRONZE_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(BRONZE_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brąz");
    await expect(medalInput).toBeDisabled();
  });

  test("MED-13: najechanie na brązowy medal wyświetla informację o przedmiotach składających się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", BRONZE_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(BRONZE_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brąz");

    await medalInput.hover();

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toBeVisible();
  });

  test("MED-14: tooltip brązowego medalu wyświetla przedmiot składający się na medal", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", BRONZE_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(BRONZE_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brąz");

    await medalInput.hover();

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Matematyka");
  });

  test("MED-15: brązowy medal jest widoczny w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school");

    const search = await app.openSearch("school");

    await typeValue(app.field(search, "ID szkoły"), BRONZE_SCHOOL.id);

    await search.getByRole("button", { name: "Szukaj", exact: true }).click();

    await expect(search).toHaveCount(0);

    const results = app.results("school");

    const schoolRow = results.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: BRONZE_SCHOOL.id,
        exact: true,
      }),
    });

    await expect(schoolRow).toHaveCount(1);
    await expect(schoolRow).toContainText(BRONZE_SCHOOL.name);
    await expect(schoolRow).toContainText("Brąz");
  });

  test("MED-16: szkoła bez medalu wyświetla wartość Brak w danych podstawowych", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", NO_MEDAL_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(NO_MEDAL_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brak");
  });

  test("MED-17: pole Medal dla szkoły bez medalu jest nieedytowalne", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", NO_MEDAL_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(NO_MEDAL_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brak");
    await expect(medalInput).toBeDisabled();
  });

  test("MED-18: najechanie na wartość Brak nie wyświetla tooltipa z przedmiotami", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school", NO_MEDAL_SCHOOL.id);

    await expect(app.detail("name")).toHaveValue(NO_MEDAL_SCHOOL.name);

    const medalInput = page
      .locator(".info-row")
      .filter({
        has: page.getByText("Medal", { exact: true }),
      })
      .locator('input[type="text"]')
      .last();

    await expect(medalInput).toHaveValue("Brak");

    await medalInput.hover();

    // Dajemy czas odpowiadający normalnemu pojawieniu się tooltipa,
    // żeby asercja nie przeszła tylko dlatego, że sprawdziliśmy za wcześnie.
    await page.waitForTimeout(1000);

    const tooltip = page.locator(".mat-mdc-tooltip-surface").filter({
      hasText: "Na medal składają się",
    });

    await expect(tooltip).toHaveCount(0);
  });

  test("MED-19: wartość Brak jest widoczna w wynikach wyszukiwania szkół", async ({
    page,
  }) => {
    const app = new Octopus(page);

    await app.openPanel("school");

    const search = await app.openSearch("school");

    await typeValue(app.field(search, "ID szkoły"), NO_MEDAL_SCHOOL.id);

    await search.getByRole("button", { name: "Szukaj", exact: true }).click();

    await expect(search).toHaveCount(0);

    const results = app.results("school");

    const schoolRow = results.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: NO_MEDAL_SCHOOL.id,
        exact: true,
      }),
    });

    await expect(schoolRow).toHaveCount(1);
    await expect(schoolRow).toContainText(NO_MEDAL_SCHOOL.name);
    await expect(schoolRow).toContainText("Brak");
  });
});
