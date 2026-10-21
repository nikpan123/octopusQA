import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { scenarioEvidence } from "./scenario-evidence.mjs";

test("UI: scoped results, exact saved step, no run request, environment change", async () => {
  const scenarios = [
    {
      id: "SC-01",
      title: "Test kompletny",
      testIds: ["ORD-01"],
      automation: "automated",
      preconditions: ["Dane"],
      steps: ["Zapis", "Bez mapy"],
      expected: "Oczekiwanie",
      stepLinks: [{ step: 0, testId: "ORD-01", titles: ["Dokładny etap"] }],
    },
    {
      id: "SC-02",
      title: "Test częściowy",
      testIds: ["ORD-01", "ORD-02"],
      automation: "partial",
      blocker: "Brak pełnego pokrycia",
      preconditions: [],
      steps: ["Sprawdź"],
      expected: "Oczekiwanie",
    },
    {
      id: "SC-03",
      title: "Bez uruchomienia",
      testIds: ["ORD-03"],
      automation: "automated",
      preconditions: [],
      steps: ["Sprawdź"],
      expected: "Oczekiwanie",
    },
    {
      id: "SC-04",
      title: "Wspólny krok dwóch testów",
      testIds: ["ORD-01", "ORD-04"],
      automation: "automated",
      preconditions: [],
      steps: ["Oba warianty"],
      expected: "Odmowa",
      stepLinks: [
        {
          step: 0,
          checks: [
            { testId: "ORD-01", titles: ["Dokładny etap"] },
            { testId: "ORD-04", titles: ["Blokada"] },
          ],
        },
      ],
    },
  ];
  const runId = "11111111-1111-4111-8111-111111111111";
  const record = {
    id: "ORD-01",
    status: "passed",
    runId,
    date: "2026-10-20T10:00:00Z",
    environment: "dev",
    reportUrl: `/report/${runId}/`,
    steps: [{ title: "Dokładny etap" }],
  };
  const failedRecord = {
    ...record,
    id: "ORD-04",
    status: "failed",
    steps: [{ title: "Blokada", error: true }],
  };
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    let runRequests = 0;
    let previewUrl;
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
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
      let data = { running: false, run: null };
      if (pathname === "/api/scenarios")
        data = { features: [{ issue: "35980", title: "Scenariusze", scope: "Zakres", scenarios }] };
      if (pathname === "/api/tests")
        data = {
          tests: ["ORD-01", "ORD-02", "ORD-03", "ORD-04"].map((id) => ({
            id,
            title: id + ": test",
            file: "example.spec.ts",
          })),
        };
      if (pathname === "/api/history") data = { history: [] };
      if (pathname === "/api/test-data") data = { teachers: [], schools: [] };
      if (pathname === "/api/scenario-evidence")
        data = {
          scenarios: Object.fromEntries(
            scenarios.map((s) => [
              s.id,
              scenarioEvidence(
                s,
                url.searchParams.get("environment") === "dev" ? [record, failedRecord] : [],
              ),
            ]),
          ),
        };
      if (pathname === "/api/test-preview") {
        previewUrl = url;
        data = {
          preview: {
            id: url.searchParams.get("id"),
            title: "Test",
            status: "passed",
            environment: "dev",
            source: "Raport wskazanego przebiegu",
            attempt: 0,
            date: record.date,
            reportUrl: record.reportUrl,
            errors: [],
            attachments: [],
            steps: [
              { title: "Przygotowanie" },
              { title: url.searchParams.get("id") === "ORD-04" ? "Blokada" : "Dokładny etap" },
            ],
          },
        };
      }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://qa.test/#business-scenarios");
    const complete = page.locator('[data-scenario-key="SC-01"]');
    await expect(complete.locator(":scope > summary")).toContainText("PASS · 1/1 testów · DEV");
    await expect(page.locator('[data-scenario-key="SC-02"] > summary')).toContainText(
      "Niepełny przebieg · 1/2 testów",
    );
    await expect(page.locator('[data-scenario-key="SC-03"] > summary')).toContainText(
      "Brak zapisanego wykonania",
    );
    await complete.locator(":scope > summary").click();
    await expect(complete.locator(".scenario-timeline li").nth(1)).toContainText(
      "Bez powiązania kroku",
    );
    await complete.locator(".scenario-timeline [data-scenario-preview]").click();
    await expect(page.locator("#previewStepDetail h4")).toHaveText("Dokładny etap");
    assert.equal(previewUrl.searchParams.get("runId"), runId);
    assert.equal(previewUrl.searchParams.get("environment"), "dev");
    await expect(page.locator("#previewReportLink")).toHaveAttribute("href", record.reportUrl);
    await page.locator("#testPreviewDialog").evaluate((dialog) => dialog.close());
    const combined = page.locator('[data-scenario-key="SC-04"]');
    await expect(combined.locator(":scope > summary")).toContainText("FAIL · 2/2 testów");
    await combined.locator(":scope > summary").click();
    await expect(combined.locator(".scenario-timeline")).toContainText("Testy: ORD-01, ORD-04");
    await combined.locator(".scenario-linked-stages > summary").click();
    await expect(combined.locator(".scenario-linked-stage")).toHaveCount(2);
    await combined.locator('.scenario-timeline [data-scenario-preview="ORD-04"]').click();
    await expect(page.locator("#previewStepDetail h4")).toHaveText("Blokada");
    assert.equal(previewUrl.searchParams.get("id"), "ORD-04");
    assert.equal(previewUrl.searchParams.get("runId"), runId);
    await page.locator("#testPreviewDialog").evaluate((dialog) => dialog.close());
    await page.goto("http://qa.test/#run-tests");
    await page.locator("#environment").selectOption("test");
    await page.goto("http://qa.test/#business-scenarios");
    await expect(complete.locator(":scope > summary")).toContainText("Brak zapisanego wykonania");
    await expect(complete.locator(".scenario-execution-badge")).toHaveCount(0);
    assert.equal(runRequests, 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
