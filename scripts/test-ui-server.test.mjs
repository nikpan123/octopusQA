import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { SUITES, extractTestId, parseListOutput, buildRunArguments } from "./test-ui-server.mjs";

test("pakiet Szkoły zawiera oba pliki Struktury", () => {
  const result = buildRunArguments({ suite: "schools", environment: "dev", workers: 2 });
  for (const file of [
    "tests/szkola-struktura.spec.ts",
    "tests/szkola-struktura-dodawanie.spec.ts",
    "tests/szkola-kategoria.spec.ts",
    "tests/szkola-kategoria-dodawanie.spec.ts",
    "tests/szkola-nauczyciele-filtry.spec.ts",
    "tests/szkola-wyszukiwanie-filtry.spec.ts",
  ]) {
    assert.ok(SUITES.schools.files.includes(file));
    assert.ok(result.args.includes(file));
  }
});

test("parser rozpoznaje krótkie ID STR, także trzycyfrowe", () => {
  assert.equal(extractTestId("Struktura szkoły › STR-89: test @school"), "STR-89");
  assert.equal(extractTestId("Struktura › STR-106: timeout @structure"), "STR-106");
  assert.equal(extractTestId("ORD-43: zamówienie"), "ORD-43");
  assert.equal(extractTestId("Klasa w zamówieniach › ORD-CLASS-22: rozwijanie"), "ORD-CLASS-22");
  assert.equal(extractTestId("Kategoria szkoły › CAT-34: zmiana uczniów"), "CAT-34");
  assert.equal(extractTestId("Filtrowanie nauczycieli › TFL-26: przyszły rok"), "TFL-26");
  assert.equal(extractTestId("Wyszukiwarka szkół › SFLT-32: RSPO"), "SFLT-32");
});

test("pakiet Zamówienia zawiera testy kolumny Klasa", () => {
  const result = buildRunArguments({ suite: "orders", environment: "dev", workers: 2 });
  assert.ok(SUITES.orders.files.includes("tests/zamowienia-klasa.spec.ts"));
  assert.ok(result.args.includes("tests/zamowienia-klasa.spec.ts"));
});

test("listowanie rozdziela ID, nazwę i lokalizację testu struktury", () => {
  const tests = parseListOutput(
    "[chromium] › szkola-struktura-dodawanie.spec.ts:147:3 › Struktura podczas dodawania szkoły › STR-89: Zapisz strukturę @school @structure",
  );
  assert.equal(tests.length, 1);
  assert.equal(tests[0].id, "STR-89");
  assert.equal(tests[0].file, "szkola-struktura-dodawanie.spec.ts");
  assert.equal(tests[0].annual, false);
  assert.ok(tests[0].title.includes("Zapisz strukturę"));
});

test("zaznaczenie STR-10 nie uruchamia STR-100 ani STR-101", () => {
  const result = buildRunArguments({ suite: "schools", selectedTestIds: ["STR-10"], workers: 2 });
  const pattern = new RegExp(result.args[result.args.indexOf("--grep") + 1]);
  assert.ok(pattern.test("Struktura szkoły › STR-10: miejscowość @structure"));
  assert.equal(pattern.test("STR-100: duplikat @structure"), false);
  assert.equal(pattern.test("STR-101: wyszukiwanie @structure"), false);
});

test("zaznaczone nowe testy mają pierwszeństwo przed pakietem i grep", () => {
  const result = buildRunArguments({
    suite: "teachers",
    grep: "ORD-43",
    selectedTestIds: ["STR-90", "STR-106"],
    environment: "test",
    workers: 2,
  });
  const pattern = new RegExp(result.args[result.args.indexOf("--grep") + 1]);
  assert.ok(pattern.test("STR-90: nowa szkoła"));
  assert.ok(pattern.test("STR-106: timeout"));
  assert.equal(pattern.test("STR-900: inny test"), false);
  assert.equal(pattern.test("ORD-43: zamówienie"), false);
  assert.equal(result.args.includes("tests/nauczyciel-dodawanie.spec.ts"), false);
  assert.ok(result.args.includes("--config=playwright.test.config.ts"));
});

test("panel pokazuje krótkie ID i wysyła zaznaczony nowy test", async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    let submitted;
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (["/", "/styles.css", "/app.js"].includes(url.pathname)) {
        const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        return route.fulfill({
          contentType: file.endsWith("css")
            ? "text/css"
            : file.endsWith("js")
              ? "application/javascript"
              : "text/html",
          body: await readFile(new URL(`../test-ui/${file}`, import.meta.url), "utf8"),
        });
      }
      let body = {};
      if (url.pathname === "/api/tests")
        body = {
          tests: [
            {
              id: "STR-106",
              title:
                "Struktura podczas dodawania szkoły › STR-106: timeout zapisu szkoły nie zapisuje osieroconej struktury @school @structure @school-add",
              file: "szkola-struktura-dodawanie.spec.ts",
              annual: false,
            },
          ],
        };
      else if (url.pathname === "/api/history") body = { history: [] };
      else if (url.pathname === "/api/test-data") body = { teachers: [], schools: [] };
      else if (url.pathname === "/api/status" || url.pathname === "/api/run") {
        if (url.pathname === "/api/run") submitted = route.request().postDataJSON();
        body = { running: false, run: null };
      }
      if (url.pathname === "/api/events")
        return route.fulfill({ contentType: "text/event-stream", body: "" });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    await page.goto("http://runner.test/");
    await page.locator("#testSearch").fill("str-106");
    await expect(page.locator(".test-id")).toHaveText("STR-106");
    await expect(page.locator(".test-title")).toContainText("timeout zapisu szkoły");
    assert.ok(
      (await page
        .locator(".test-title")
        .evaluate((element) => element.getBoundingClientRect().width)) > 500,
    );
    await page.getByRole("button", { name: "Szkoły", exact: true }).click();
    await page.locator('[data-test-id="STR-106"]').check();
    await expect(page.locator("#selectedCount")).toHaveText("1 zaznaczonych");
    await page.locator("#startBtn").click();
    await expect
      .poll(() => submitted)
      .toMatchObject({ suite: "schools", selectedTestIds: ["STR-106"] });
    // Cała sieć jest przechwycona; test panelu nie uruchamia regresji na DEV.
  } finally {
    await browser.close();
  }
});
