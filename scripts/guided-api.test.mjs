import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { request, chromium, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { GuidedApiRun, safeGuidedValue } from "./guided-api.mjs";
import { guidedOperation, observeGuidedRequests } from "./guided-api-client.mjs";
import { buildRunArguments, parseListOutput } from "./test-ui-server.mjs";

test("API nie uruchamia Inspektora; zwykły test UI zachowuje --debug", () => {
  const options = { debug: true, selectedTestIds: ["ORD-SPEC-35980-08"] };
  const api = buildRunArguments({ ...options, guidedApi: true });
  assert.equal(api.args.includes("--debug"), false);
  assert.equal(api.args.includes("--headed"), false);
  assert.ok(
    buildRunArguments({ ...options, guidedApi: true, headed: true }).args.includes("--headed"),
  );
  assert.ok(api.args.includes("--timeout=0"));
  assert.ok(buildRunArguments(options).args.includes("--debug"));
  assert.equal(
    parseListOutput("[chromium] › x.spec.ts:10:1 › ORD-SPEC-35980-08: przykład @step-api")[0]
      .debugMode,
    "api",
  );
});

test("bramka nie pozwala wyprzedzić kroku ani uruchomić go dwukrotnie; Stop zwalnia oczekiwanie", async () => {
  const run = new GuidedApiRun("run");
  run.event({ kind: "start", stepId: "one", title: "POST" });
  assert.throws(() => run.next("one"));
  const pending = run.wait("one");
  run.next("one");
  assert.deepEqual(await pending, { proceed: true });
  assert.throws(() => run.next("one"));
  run.event({ kind: "finish", stepId: "one", status: "passed" });
  run.event({ kind: "start", stepId: "two", title: "Sprawdzenie" });
  const stopped = run.wait("two");
  run.close();
  assert.deepEqual(await stopped, { proceed: false });
  assert.equal(run.snapshot().steps[1].status, "interrupted");
  assert.equal(JSON.stringify(run.snapshot()).includes(run.key), false);
});

test("redakcja pomija hasła, tokeny, adresy i nagłówki", () => {
  const value = safeGuidedValue({
    token: "sensitive",
    headers: { Authorization: "Bearer sensitive", cookie: "sensitive" },
    password: "sensitive",
    schoolAdressToOrder: "sensitive",
    quantity: 3,
  });
  assert.equal(JSON.stringify(value).includes("sensitive"), false);
  assert.equal(value.quantity, 3);
});

test("prawdziwy klient API: automatyczne przygotowanie, pauza przed POST, jedna wysyłka, odpowiedź i FAIL asercji", async () => {
  const run = new GuidedApiRun("offline-run");
  let writes = 0;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const reply = (value) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    };
    if (req.url.startsWith("/api/guided/")) {
      assert.equal(req.headers["x-guided-key"], run.key);
      if (req.url.endsWith("wait")) return reply(await run.wait(body.stepId));
      run.event(body);
      return reply({ accepted: true });
    }
    writes++;
    reply({ created: true, token: "sensitive", quantity: body.quantity });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const keys = [
    "OCTOPUS_GUIDED_API",
    "OCTOPUS_GUIDED_URL",
    "OCTOPUS_GUIDED_KEY",
    "OCTOPUS_UI_RUN_ID",
  ];
  const previous = keys.map((key) => process.env[key]);
  Object.assign(process.env, {
    OCTOPUS_GUIDED_API: "1",
    OCTOPUS_GUIDED_URL: origin,
    OCTOPUS_GUIDED_KEY: run.key,
    OCTOPUS_UI_RUN_ID: run.runId,
  });
  const api = await request.newContext({ baseURL: origin });
  const restore = observeGuidedRequests(api);
  try {
    assert.equal(await guidedOperation("Przygotowanie", async () => 42, true), 42);
    assert.equal(run.steps[0].status, "passed");
    const pending = guidedOperation("POST", () =>
      api.post("/api/SchoolOrder/MakeSchoolOrderCopy", {
        data: { quantity: 3, password: "sensitive" },
      }),
    );
    await expect.poll(() => run.snapshot().steps.find((step) => step.ready)?.title).toBe("POST");
    assert.equal(writes, 0);
    run.next(run.steps[1].id);
    const response = await pending;
    assert.equal(writes, 1);
    assert.equal(response.status(), 200);
    assert.equal(run.steps[1].requests[0].response.quantity, 3);
    assert.equal(JSON.stringify(run.snapshot()).includes("sensitive"), false);
    const failure = guidedOperation("Sprawdzenie", async () => {
      assert.equal((await response.json()).created, false, "Niedozwolona kopia powstała");
    });
    const caught = assert.rejects(failure, /Niedozwolona kopia powstała/);
    await expect
      .poll(() => run.snapshot().steps.find((step) => step.ready)?.title)
      .toBe("Sprawdzenie");
    run.next(run.steps[2].id);
    await caught;
    assert.equal(run.steps[2].status, "failed");
    assert.equal(writes, 1);
  } finally {
    run.close();
    restore();
    await api.dispose();
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("UI: panel API pokazuje żądanie i wynik, a kliknięcie/F10 wysyła dokładnie jeden krok", async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const submitted = [];
    const payload = {
      running: true,
      run: {
        id: "run",
        debugMode: "api",
        environment: "dev",
        workers: 1,
        counts: {},
        failedTestIds: [],
        guided: {
          steps: [
            {
              id: "step",
              title: "Próba kopiowania",
              status: "waiting",
              ready: true,
              requests: [
                {
                  method: "POST",
                  path: "/api/SchoolOrder/MakeSchoolOrderCopy",
                  status: 200,
                  response: { quantity: 3 },
                },
              ],
            },
          ],
        },
      },
    };
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (["/", "/app.js", "/styles.css"].includes(url.pathname)) {
        const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        return route.fulfill({
          contentType: file.endsWith("js")
            ? "application/javascript"
            : file.endsWith("css")
              ? "text/css"
              : "text/html",
          body: await readFile(new URL(`../test-ui/${file}`, import.meta.url), "utf8"),
        });
      }
      if (url.pathname === "/api/events")
        return route.fulfill({ contentType: "text/event-stream", body: "" });
      if (url.pathname === "/api/guided/next") submitted.push(route.request().postDataJSON());
      const body =
        url.pathname === "/api/status"
          ? payload
          : url.pathname === "/api/tests"
            ? { tests: [] }
            : url.pathname === "/api/history"
              ? { history: [] }
              : url.pathname === "/api/test-data"
                ? { teachers: [], schools: [] }
                : {};
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    await page.goto("http://runner.test/#run-status");
    await expect(page.locator("#guidedApiPanel")).toBeVisible();
    await expect(page.locator("#guidedApiSteps")).toContainText(
      "POST /api/SchoolOrder/MakeSchoolOrderCopy",
    );
    await page.keyboard.press("F10");
    await expect.poll(() => submitted.length).toBe(1);
    await page.keyboard.press("F10");
    assert.deepEqual(submitted, [{ runId: "run", stepId: "step" }]);
    await page.reload();
    await expect(page.locator("#guidedApiNext")).toBeEnabled();
    await page.locator("#guidedApiNext").click();
    await expect.poll(() => submitted.length).toBe(2);
  } finally {
    await browser.close();
  }
});
