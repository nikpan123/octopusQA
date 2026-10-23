import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildRunArguments } from "./test-ui-server.mjs";
import { chromium, expect } from "@playwright/test";

test("35980: scenariusz zbiorczy odróżnia pokrycie automatyczne, częściowe i brak przygotowania", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const feature = catalog.features.find((item) => item.issue === "35980");
  assert.ok(feature);
  assert.equal(feature.scenarios.length, 16);
  assert.equal(new Set(feature.scenarios.map((item) => item.id)).size, 16);
  assert.equal(
    feature.verification,
    undefined,
    "Nie wpisujemy zaliczonego wyniku przed wykonaniem",
  );
  for (const scenario of feature.scenarios) {
    assert.ok(scenario.steps.length && scenario.preconditions.length && scenario.expected);
    if (scenario.automation === "blocked") {
      assert.equal(scenario.testIds.length, 0);
      assert.ok(scenario.blocker);
    } else assert.ok(scenario.testIds.length);
    if (scenario.automation === "partial") assert.ok(scenario.blocker);
  }
  for (const ending of ["10", "11"])
    assert.equal(
      feature.scenarios.find((item) => item.id.endsWith("-" + ending)).automation,
      "partial",
    );
  for (const ending of ["09", "13", "14"])
    assert.equal(
      feature.scenarios.find((item) => item.id.endsWith("-" + ending)).automation,
      "automated",
    );
});

test("35980: gratisy sprawdzają utworzenie zlecenia, bez oceny blokad", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const scenario = catalog.features
    .flatMap((feature) => feature.scenarios)
    .find((item) => item.id === "ORD-SC-35980-13");
  assert.deepEqual(
    scenario.testIds,
    ["14", "15", "16", "17", "30", "31", "32", "33"].map((id) => `ORD-SPEC-35980-${id}`),
  );
  assert.match(scenario.expected, /Zlecenie z blokadami również/);
  const source = await readFile(
    new URL("../tests/zamowienia-kopie-gratisy.spec.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /unpermittedForShipping|za mała ilość|brak zamów/i);
  assert.match(source, /createdGiftOrders\(data\)\)\.length/);
  assert.match(source, /toBeGreaterThan\(0\)/);
  assert.match(source, /expectTestFlags/);
  assert.match(source, /Testowy ma blokować samo utworzenie zlecenia/);
});

test("35980: pakiet kopiowania obejmuje przywrócone i nowe testy, nie całą regresję", () => {
  const run = buildRunArguments({ suite: "copying" });
  assert.equal(buildRunArguments({ suite: "copying", workers: 4 }).workers, 1);
  assert.equal(
    buildRunArguments({ selectedTestIds: ["ORD-SPEC-35980-04"], workers: 4 }).workers,
    1,
  );
  for (const file of [
    "zamowienia-kopiowanie-struktura",
    "zamowienia-redmine-36289",
    "zamowienia-redmine-36290",
    "zamowienia-redmine-35980",
    "zamowienia-kopie-zmiana-struktury",
  ])
    assert.ok(run.args.includes("tests/" + file + ".spec.ts"));
});

test("35980: prezentacja i struktura mają powiązane testy, niedostępna zmiana typu jest jawna", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const scenarios = catalog.features.find((feature) => feature.issue === "35980").scenarios;
  const presentation = scenarios.find((scenario) => scenario.id === "ORD-SC-35980-06");
  assert.equal(presentation.automation, "automated");
  assert.equal(presentation.stepLinks[0].checks.length, 4);
  const changes = scenarios.find((scenario) => scenario.id === "ORD-SC-35980-09");
  assert.equal(changes.automation, "automated");
  assert.deepEqual(
    changes.testIds,
    ["04", "20", "21", "22", "23", "24"].map((id) => "ORD-SPEC-35980-" + id),
  );
  assert.match(changes.expected, /ponownie ręcznie/);
  assert.ok(
    changes.preconditions.some((text) =>
      /Typ i poziom istniejącej szkoły są nieedytowalne/.test(text),
    ),
  );
});

test("UI: kompaktowe scenariusze otwierają osobny opis i nowe okno z dokładnie zaznaczonymi testami", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const ids = [...new Set(catalog.features.flatMap((f) => f.scenarios.flatMap((s) => s.testIds)))];
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    let runRequests = 0;
    await context.route("**/*", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/api/run") runRequests++;
      if (["/", "/app.js", "/styles.css"].includes(pathname)) {
        const file = pathname === "/" ? "index.html" : pathname.slice(1);
        return route.fulfill({
          contentType: file.endsWith("js")
            ? "application/javascript"
            : file.endsWith("css")
              ? "text/css"
              : "text/html",
          body: await readFile(new URL("../test-ui/" + file, import.meta.url), "utf8"),
        });
      }
      if (pathname === "/api/events")
        return route.fulfill({ contentType: "text/event-stream", body: "" });
      const data =
        pathname === "/api/scenarios"
          ? catalog
          : pathname === "/api/tests"
            ? {
                tests: ids.map((id) => ({ id, title: id + ": przykład", file: "example.spec.ts" })),
              }
            : pathname === "/api/history"
              ? { history: [] }
              : pathname === "/api/test-data"
                ? { teachers: [], schools: [] }
                : { running: false, run: null };
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    await page.goto("http://qa.test/#run-tests");
    await page.locator("#environment").selectOption("test");
    await page.goto("http://qa.test/#business-scenarios");
    // Wybrany kontekst środowiska źródła przechodzi do nowego okna.
    await page.goto("http://qa.test/?environment=test#business-scenarios");
    await page.locator("#scenarioSearch").fill("35980");
    const featureId = catalog.features.find((feature) => feature.issue === "35980").id;
    await page.locator(`[data-feature-key="${featureId}"] > summary`).click();
    const partial = page.locator('[data-scenario-key="ORD-SC-35980-10"]');
    await expect(partial).toContainText("Pokrycie częściowe");
    await expect(partial.locator(".scenario-body")).toBeHidden();
    assert.equal(
      await partial.locator("summary").evaluate((el) => window.getComputedStyle(el).display),
      "grid",
    );
    await partial.locator("summary").click();
    const detailOpened = context.waitForEvent("page");
    await partial.locator("[data-scenario-open]").click();
    const detail = await detailOpened;
    await expect(detail.locator(".scenario-detail")).toContainText(
      catalog.features
        .find((feature) => feature.issue === "35980")
        .scenarios.find((scenario) => scenario.id === "ORD-SC-35980-10").blocker,
    );
    await expect(detail.locator("#pageTitle")).toHaveText("ORD-SC-35980-10");
    await expect(detail.locator("#scenarioSearch")).toBeHidden();
    assert.equal(await detail.evaluate(() => window.opener), null);
    await detail.close();
    await page.locator('[data-scenario-key="ORD-SC-35980-13"] > summary').click();
    await expect(page.locator('a[data-scenario-id="ORD-SC-35980-13"]')).toBeVisible();
    await page.locator('[data-scenario-key="ORD-SC-35980-01"] > summary').click();
    const runOpened = context.waitForEvent("page");
    await page.locator('a[data-scenario-id="ORD-SC-35980-01"]').click();
    const runPage = await runOpened;
    await expect(runPage.locator("#selectedCount")).toHaveText("12 zaznaczonych");
    await expect(runPage.locator("[data-test-id]:checked")).toHaveCount(12);
    for (let i = 1; i <= 12; i++)
      await expect(
        runPage.locator(`[data-test-id="ORD-COPY-${String(i).padStart(2, "0")}"]`),
      ).toBeChecked();
    await expect(runPage.locator("#environment")).toHaveValue("test");
    await expect(runPage.locator("#linked-selection")).toContainText("ORD-SC-35980-01");
    await expect(page.locator("#scenarioSearch")).toHaveValue("35980");
    await expect(page.locator(".scenario-item")).toHaveCount(16);
    await expect(page.locator("#selectedCount")).toHaveText("0 zaznaczonych");
    const singleOpened = context.waitForEvent("page");
    await page.locator('[data-scenario-key="ORD-SC-35980-08"] > summary').click();
    await page.locator('a[data-scenario-id="ORD-SC-35980-08"]').click();
    const single = await singleOpened;
    await expect(single.locator('[data-test-id="ORD-SPEC-35980-03"]')).toBeChecked();
    await expect(single.locator("#selectedCount")).toHaveText("1 zaznaczonych");
    await single.reload();
    await expect(single.locator("#selectedCount")).toHaveText("1 zaznaczonych");
    const missing = await context.newPage();
    await missing.goto("http://qa.test/?test=ORD-NOT-FOUND&fromScenario=missing#run-tests");
    await expect(missing.locator("#linked-selection")).toContainText(
      "Nie znaleziono: ORD-NOT-FOUND",
    );
    await expect(missing.locator("#selectedCount")).toHaveText("0 zaznaczonych");
    assert.equal(runRequests, 0, "Otwarcie okien nie uruchamia testów");
  } finally {
    await browser.close();
  }
});
