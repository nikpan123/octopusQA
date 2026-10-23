import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import http from "node:http";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";
import { withReportTheme } from "./report-theme.mjs";

test("Motyw raportu jest nakładany bez zmiany danych archiwum i tylko raz", () => {
  const html =
    '<html><head></head><body>Report</body><script id="playwrightReportBase64">DATA-UNCHANGED</script></html>';
  const output = withReportTheme(html);
  assert.equal(withReportTheme(output), output);
  assert.ok(output.endsWith(html.slice(html.indexOf("<body>"))));
  assert.equal(withReportTheme("attachment without head"), "attachment without head");
});

test(
  "Prawdziwy raport w białej ramce: pełny ciemny/jasny motyw i zmiana wspólnego ustawienia",
  { timeout: 45000 },
  async () => {
    const dirs = await readdir(new URL("../runs/html-reports/", import.meta.url), {
      withFileTypes: true,
    });
    let html;
    for (const dir of dirs.filter((item) => item.isDirectory())) {
      try {
        html = await readFile(
          new URL(`../runs/html-reports/${dir.name}/index.html`, import.meta.url),
          "utf8",
        );
        break;
      } catch {
        /* Nie każdy folder zawiera ukończony raport. */
      }
    }
    assert.ok(html, "Wymagany istniejący raport do odczytu, bez wykonywania testów biznesowych");
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        req.url.startsWith("/report/")
          ? withReportTheme(html)
          : '<html><body style="background:#172131;margin:0"><iframe title="Raport" src="/report/" style="background:white;border:0;width:100%;height:95vh"></iframe></body></html>',
      );
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = "http://127.0.0.1:" + server.address().port;
    let browser;
    try {
      browser = await chromium.launch({ channel: "msedge", headless: true });
      const context = await browser.newContext({ colorScheme: "light" });
      await context.addCookies([{ name: "qa_ui_theme", value: "dark", url: origin }]);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(origin);
      const frame = page.frameLocator("iframe");
      await expect(frame.locator("html")).toHaveClass(/dark-mode/);
      await expect(frame.locator(".test-file-test").first()).toBeVisible();
      const colors = () =>
        frame
          .locator("body")
          .evaluate((el) => ({
            background: globalThis.getComputedStyle(el).backgroundColor,
            foreground: globalThis.getComputedStyle(el).color,
            html: globalThis.getComputedStyle(el.ownerDocument.documentElement).backgroundColor,
          }));
      const dark = await colors();
      assert.notEqual(dark.background, "rgba(0, 0, 0, 0)");
      assert.notEqual(dark.background, "rgb(255, 255, 255)");
      assert.equal(dark.background, dark.html);
      await page.evaluate(() => {
        globalThis.document.cookie = "qa_ui_theme=light; Path=/";
      });
      await expect(frame.locator("html")).toHaveClass(/light-mode/);
      const light = await colors();
      assert.equal(light.background, "rgb(255, 255, 255)");
      assert.notEqual(light.foreground, dark.foreground);
      await page.evaluate(() => {
        globalThis.document.cookie = "qa_ui_theme=auto; Path=/";
      });
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(frame.locator("html")).toHaveClass(/dark-mode/);
      if (process.env.QA_REPORT_SCREENSHOT)
        await page.screenshot({ path: process.env.QA_REPORT_SCREENSHOT, fullPage: true });
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    }
  },
);
