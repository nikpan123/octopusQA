import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { createScenarioEditor } from "./scenario-editor.mjs";

test(
  "Octopus: edycja z katalogu, zapis, odświeżenie, anulowanie i konflikt bez utraty tekstu",
  { timeout: 45000 },
  async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "octopus-editor-ui-")),
      file = path.join(dir, "scenarios.json");
    const fixture = {
      features: [
        {
          id: "feature",
          issue: "99999",
          title: "Lokalny zakres",
          scope: "Dane QA",
          scenarios: [
            {
              id: "CASE-1",
              title: "Tytuł przed edycją",
              testIds: ["AUTO-1"],
              automation: "automated",
              preconditions: ["Konto QA"],
              steps: ["Otwórz", "Sprawdź"],
              expected: "Prawidłowy wynik",
            },
          ],
        },
      ],
    };
    await writeFile(file, JSON.stringify(fixture));
    const editor = createScenarioEditor({ file, backupDir: path.join(dir, "backup") });
    let starts = 0,
      origin;
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://local");
        const json = (data) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data));
        };
        if (url.pathname === "/api/scenarios") return json(await editor.catalog());
        if (url.pathname === "/api/scenarios/update") {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          return json(
            await editor.update(JSON.parse(Buffer.concat(chunks)), {
              origin: req.headers.origin,
              expectedOrigin: origin,
              contentType: req.headers["content-type"],
              editToken: req.headers["x-scenario-token"],
            }),
          );
        }
        if (url.pathname === "/api/run") {
          starts++;
          throw new Error("Nie uruchamiaj testu");
        }
        if (url.pathname === "/api/tests")
          return json({ tests: [{ id: "AUTO-1", title: "Automat", file: "fixture.spec.ts" }] });
        if (url.pathname === "/api/status") return json({ running: false, run: null });
        if (url.pathname === "/api/history") return json({ history: [] });
        if (url.pathname === "/api/test-data") return json({ teachers: [], schools: [] });
        if (url.pathname === "/api/scenario-evidence") return json({ scenarios: {} });
        if (url.pathname.startsWith("/api/")) return json({});
        const names = {
            "/": "index.html",
            "/app.js": "app.js",
            "/styles.css": "styles.css",
            "/scenario-editor.js": "scenario-editor.js",
            "/scenario-editor.css": "scenario-editor.css",
          },
          name = names[url.pathname];
        if (!name) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, {
          "Content-Type": name.endsWith(".js")
            ? "application/javascript"
            : name.endsWith(".css")
              ? "text/css"
              : "text/html",
        });
        res.end(await readFile(new URL("../test-ui/" + name, import.meta.url)));
      } catch (error) {
        res.writeHead(error.status || 500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    origin = "http://127.0.0.1:" + server.address().port;
    let browser;
    try {
      browser = await chromium.launch({ channel: "msedge", headless: true });
      const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(() => {
        window.EventSource = class {
          addEventListener() {}
        };
      });
      await page.goto(origin + "/#business-scenarios");
      await page.locator('details.scenario-feature > summary').first().click();
      await page.locator('[data-scenario-key="CASE-1"] summary').click();
      await page.locator('[data-scenario-edit="CASE-1"]').click();
      await page.locator(".scenario-editor-dialog [name=title]").fill("Nowy tytuł scenariusza");
      await page.locator(".scenario-editor-dialog [name=expected]").fill("Nowy oczekiwany wynik");
      await page.locator(".scenario-editor-dialog [type=submit]").click();
      await expect(page.locator(".scenario-editor-dialog")).not.toBeVisible();
      await expect(page.locator(".scenario-title")).toContainText("Nowy tytuł scenariusza");
      await page.reload();
      await expect(page.locator(".scenario-title")).toContainText("Nowy tytuł scenariusza");
      await page.locator('details.scenario-feature > summary').first().click();
      await page.locator('[data-scenario-key="CASE-1"] summary').click();
      await page.locator('[data-scenario-edit="CASE-1"]').click();
      await page.locator(".scenario-editor-dialog [name=title]").fill("Nie nadpisuj");
      await writeFile(file, (await readFile(file, "utf8")) + "\n");
      await page.locator(".scenario-editor-dialog [type=submit]").click();
      await expect(page.locator(".scenario-editor-dialog [role=alert]")).toContainText(
        "innej karcie",
      );
      await expect(page.locator(".scenario-editor-dialog [name=title]")).toHaveValue(
        "Nie nadpisuj",
      );
      page.once("dialog", (dialog) => dialog.accept());
      await page.locator(".scenario-editor-dialog [data-editor-close]").first().click();
      for (const theme of ["light", "dark"])
        for (const width of [1400, 390]) {
          await page.locator("#qa-theme-mode").selectOption(theme);
          await page.setViewportSize({ width, height: 1000 });
          await page.locator('[data-scenario-edit="CASE-1"]').click();
          await expect(page.locator(".scenario-editor-dialog")).toBeVisible();
          assert.ok(
            await page
              .locator(".scenario-editor-dialog")
              .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          );
          await page.locator(".scenario-editor-dialog [data-editor-close]").first().click();
        }
      assert.equal(starts, 0);
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep));
      await rm(dir, { recursive: true, force: true });
    }
  },
);
