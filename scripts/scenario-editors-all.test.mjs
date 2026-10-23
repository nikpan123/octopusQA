import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir, homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { chromium, expect } from "@playwright/test";
const center = path.join(homedir(), "Documents/ChatGPT/Centrum-testow"),
  cms = path.join(homedir(), "Documents/ChatGPT/KsiegarniaCMS"),
  hurt = path.join(homedir(), "Testy/Hurtownia");
const temp = (prefix) => mkdtemp(path.join(tmpdir(), prefix));
async function remove(dir) {
  assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep));
  await rm(dir, { recursive: true, force: true });
}
async function listen(server, meta) {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const html = await (await fetch(base)).text();
  const token = html.match(new RegExp('name="' + meta + '" content="([^"]+)"'))[1];
  return {
    base,
    post: async (url, body, extra = {}) =>
      fetch(base + url, {
        method: "POST",
        headers: {
          Origin: base,
          "Content-Type": "application/json",
          ...extra,
          [{
            "center-token": "X-Center-Token",
            "cms-token": "X-CMS-Token",
            "ui-token": "X-UI-Token",
          }[meta]]: token,
        },
        body: JSON.stringify(body),
      }),
  };
}

test("Hurtownia i CMS: zapis przez rzeczywiste API i ponowny odczyt", async () => {
  const { createDashboardServer } = await import(
    pathToFileURL(path.join(hurt, "dashboard/server.mjs"))
  );
  const { createDashboard } = await import(pathToFileURL(path.join(cms, "dashboard/server.mjs")));
  const hurtDir = await temp("hurt-editor-"),
    cmsDir = await temp("cms-editor-");
  let browser;
  await mkdir(path.join(cmsDir, "tests"));
  await writeFile(
    path.join(cmsDir, "tests/countries.spec.ts"),
    "test('Kraje — lokalny przykład', async()=>{});",
  );
  const servers = [
    createDashboardServer({ scenarioDataDir: hurtDir }),
    await createDashboard({ projectRoot: cmsDir }),
  ];
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    for (const [index, server] of servers.entries()) {
      const { base, post } = await listen(server, index === 0 ? "ui-token" : "cms-token");
      let catalog = await (await fetch(base + "/api/scenarios")).json();
      assert.ok(catalog.editToken && catalog.features.length);
      const feature = catalog.features[0],
        scenario = feature.scenarios[0];
      const changes = {
        title: "Zmieniony opis QA",
        description: "Cel lokalny",
        data: "Dane QA",
        preconditions: ["Dostęp QA"],
        steps: ["Otwórz formularz", "Sprawdź wynik"],
        expected: "Poprawny wynik",
        blocker: "Bez zmiany kodu testu",
      };
      const response = await post(
        "/api/scenarios/update",
        { featureId: feature.id, scenarioId: scenario.id, revision: catalog.revision, changes },
        { "X-Scenario-Token": catalog.editToken },
      );
      assert.equal(response.status, 200, await response.clone().text());
      catalog = await (await fetch(base + "/api/scenarios")).json();
      assert.equal(catalog.features[0].scenarios[0].title, changes.title);
      if (index === 0)
        assert.equal(catalog.cases.find((c) => c.id === scenario.id).expected[0], "Poprawny wynik");
      else
        assert.equal(
          (await (await fetch(base + "/api/state")).json()).catalog[0].title,
          changes.title,
        );
      const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
      await page.goto(base + (index === 0 ? "" : "/#tests"));
      if (index === 0) {
        await page.locator('[data-view="scenarios"]').click();
      }
      await page.locator("[data-edit-scenario]").first().click();
      await expect(page.locator(".scenario-editor-dialog")).toBeVisible();
      await expect(page.locator(".scenario-editor-dialog [name=title]")).toHaveValue(changes.title);
      await page.locator(".scenario-editor-dialog [name=title]").fill("Zapis z formularza");
      await page.locator(".scenario-editor-dialog [data-step-add]").click();
      await page.locator(".scenario-editor-step textarea").last().fill("Krok dodany");
      await page.locator(".scenario-editor-step").last().locator('[data-step-move="-1"]').click();
      await page.locator(".scenario-editor-dialog [type=submit]").click();
      await expect(page.locator(".scenario-editor-dialog")).not.toBeVisible();
      catalog = await (await fetch(base + "/api/scenarios")).json();
      const saved = catalog.features[0].scenarios.find((s) => s.id === scenario.id);
      assert.equal(saved.title, "Zapis z formularza");
      assert.deepEqual(saved.steps, ["Otwórz formularz", "Krok dodany", "Sprawdź wynik"]);
      for (const width of [1200, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.locator("[data-edit-scenario]").first().click();
        await expect(page.locator(".scenario-editor-dialog")).toBeVisible();
        assert.ok(
          await page
            .locator(".scenario-editor-dialog")
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        );
        await page.locator(".scenario-editor-dialog [data-editor-close]").first().click();
      }
      await page.close();
    }
  } finally {
    await browser?.close();
    for (const s of servers) if (s.listening) await new Promise((r) => s.close(r));
    await remove(hurtDir);
    await remove(cmsDir);
  }
});

test("Centrum: edycja opisu, stare migawki i dowody, konflikt, eksport i trwałość", async () => {
  const { createCenter } = await import(pathToFileURL(path.join(center, "server.mjs")));
  const dir = await temp("center-editor-");
  let server, browser;
  try {
    server = await createCenter({ dataDir: dir });
    let { base, post } = await listen(server, "center-token");
    const manual = await (
      await post("/api/tests", {
        title: "Przed zmianą",
        project: "octopus",
        module: "QA",
        steps: "Stary krok",
        expected: "Stary wynik",
      })
    ).json();
    const issue = await (
      await post("/api/issues", {
        number: "999991",
        issueType: "bug",
        project: "octopus",
        title: "Kontrola edycji",
        steps: "Krok",
        expected: "Wynik",
        testIds: [manual.id],
      })
    ).json();
    const proof = await (
      await post("/api/checks", {
        title: "Dowód",
        project: "octopus",
        testId: manual.id,
        issueId: issue.id,
        steps: "Stary krok",
        expected: "Stary wynik",
        actual: "Stary wynik",
        environment: "DEV",
        version: "QA",
        status: "PASS",
      })
    ).json();
    await post("/api/issue-status", {
      issueId: issue.id,
      status: "verified",
      environment: "dev",
      note: "Sprawdzono",
      referenceKind: "check",
      referenceId: proof.id,
    });
    let catalog = await (await fetch(base + "/api/scenarios")).json();
    const request = {
      featureId: "octopus",
      scenarioId: manual.id,
      revision: catalog.revision,
      changes: {
        title: "Po zmianie",
        description: "Nowy opis",
        preconditions: ["Dane QA"],
        steps: ["Nowy krok"],
        expected: "Nowy wynik",
        data: "",
        blocker: "",
      },
    };
    assert.equal(
      (await post("/api/scenarios/update", request, { "X-Scenario-Token": catalog.editToken }))
        .status,
      200,
    );
    assert.equal(
      (await post("/api/scenarios/update", request, { "X-Scenario-Token": catalog.editToken }))
        .status,
      409,
    );
    let state = await (await fetch(base + "/api/state")).json();
    assert.equal(state.tests.find((t) => t.id === manual.id).title, "Po zmianie");
    assert.equal(state.checks.find((c) => c.id === proof.id).snapshot.title, "Przed zmianą");
    assert.equal(
      (
        await post("/api/issue-status", {
          issueId: issue.id,
          status: "verified",
          environment: "dev",
          note: "Stary dowód",
          referenceKind: "check",
          referenceId: proof.id,
        })
      ).status,
      400,
    );
    const exported = await (await fetch(base + "/api/export")).json();
    assert.equal(exported.scenarioRevisions.length, 1);
    assert.equal(exported.scenarioDescriptions.length, 1);
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage();
    await page.goto(base + "/#tests");
    await page.locator("#search").fill("Po zmianie");
    await page.locator('[data-edit-scenario="' + manual.id + '"]').click();
    await expect(page.locator(".scenario-editor-dialog")).toBeVisible();
    await expect(page.locator(".scenario-editor-dialog [name=title]")).toHaveValue("Po zmianie");
    await browser.close();
    browser = null;
    await new Promise((r) => server.close(r));
    server = await createCenter({ dataDir: dir });
    ({ base, post } = await listen(server, "center-token"));
    state = await (await fetch(base + "/api/state")).json();
    assert.equal(state.tests.find((t) => t.id === manual.id).title, "Po zmianie");
  } finally {
    await browser?.close();
    if (server?.listening) await new Promise((r) => server.close(r));
    await remove(dir);
  }
});
