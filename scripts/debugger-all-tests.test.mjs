import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { GuidedApiRun } from "./guided-api.mjs";
import { extractTestId, parseListOutput, buildRunArguments, debuggerTestPattern } from "./test-ui-server.mjs";

test("Nowe prefiksy z cyframi zachowują krótkie ID i wybór jednego wariantu debuggera", () => {
  const suite = "Potwierdzenia SP i SŚ 2026 — pełna macierz Excela";
  const ids = ["POTW26-01-MINUS", "POTW26-01-MIN", "POTW26-01-PLUS"];
  const rows = parseListOutput(ids.map(id =>
    `[chromium] › potwierdzenia.spec.ts:50:1 › ${suite} › ${id} › ${id}: matematyka SP klasa 4 @gift @potw26`,
  ).join("\n"));
  assert.deepEqual(rows.map(row => row.id), ids);
  assert.equal(new Set(rows.map(row => row.debuggerTestKey)).size, 3);
  for (const row of rows) {
    const built = buildRunArguments({
      debug: true, debugger: true, guidedUi: true, genericDebugger: true,
      selectedTestIds: [row.id],
    });
    assert.equal(built.genericDebugger, true);
    const pattern = new RegExp(debuggerTestPattern(row));
    assert.deepEqual(rows.filter(candidate => pattern.test(
      `chromium potwierdzenia.spec.ts ${candidate.title.split(" › ").join(" ")}`,
    )).map(candidate => candidate.id), [row.id]);
  }
  assert.equal(extractTestId("ORD-43 › NOWY27-02: inny przypadek"), "NOWY27-02");
  assert.equal(extractTestId("Potwierdzenia SP i SŚ 2026"), null);
  assert.equal(extractTestId("Roczna medalowość › MED-YEAR-PREP: przygotuj"), "MED-YEAR-PREP");
});

test("Zwykły CAT-23 ma debugger; API zachowuje opisane punkty podglądu", () => {
  const rows = parseListOutput(
    "[chromium] › category.spec.ts:4:1 › CAT-23: Sortuj @category\n[chromium] › api.spec.ts:10:1 › ORD-SPEC-35980-08: Kopiuj @step-api",
  );
  assert.equal(rows[0].debuggerMode, "ui");
  assert.equal(rows[0].debuggerSteps, "automatic");
  assert.equal(rows[1].debuggerMode, "api");
  assert.equal(rows[1].debuggerSteps, "described");
  const built = buildRunArguments({
    debug: true,
    debugger: true,
    guidedUi: true,
    genericDebugger: true,
    selectedTestIds: ["CAT-23"],
    environment: "test",
  });
  assert.equal(built.genericDebugger, true);
  assert.equal(built.environment, "test");
  assert.ok(!built.args.includes("--debug"));
  assert.throws(() =>
    buildRunArguments({
      debug: true,
      debugger: true,
      selectedTestIds: ["ORD-DB-01"],
      environment: "test",
    }),
  );
  const annual = buildRunArguments({
    debug: true,
    debugger: true,
    guidedUi: true,
    genericDebugger: true,
    includeAnnual: true,
    selectedTestIds: ["MED-YEAR-PREP"],
  });
  assert.equal(annual.includeAnnual, true);
  const variants = parseListOutput(
    "[chromium] › add.spec.ts:5:1 › Nauczyciele › ADD-20: wariant A\n[chromium] › add.spec.ts:5:1 › Nauczyciele › ADD-20: wariant B",
  );
  assert.notEqual(variants[0].debuggerTestKey, variants[1].debuggerTestKey);
  const pattern = new RegExp(debuggerTestPattern(variants[0]));
  assert.ok(pattern.test("chromium add.spec.ts Nauczyciele ADD-20: wariant A"));
  assert.ok(!pattern.test("chromium add.spec.ts Nauczyciele ADD-20: wariant B"));
});

test(
  "Rzeczywisty zwykły test: zatrzymanie fixture, kroków, kliknięć i API bez ujawniania danych",
  { timeout: 60000 },
  async () => {
    const run = new GuidedApiRun("generic-offline");
    let probes = 0,
      requests = 0,
      frames = 0;
    const relay = http.createServer(async (req, res) => {
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
        const reply = (value) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(value));
        };
        if (req.url === "/probe") {
          probes++;
          return reply({ ok: true });
        }
        if (req.url === "/api/catalog") {
          requests++;
          return reply({ echo: body, token: "secret-response-token" });
        }
        assert.equal(req.headers["x-guided-key"], run.key);
        assert.equal(body.runId, run.runId);
        if (req.url === "/api/debugger/frame") {
          frames++;
          return reply({ accepted: true });
        }
        if (req.url.endsWith("/wait")) return reply(await run.wait(body.stepId));
        run.event(body);
        reply({ accepted: true });
      } catch (error) {
        res.writeHead(500);
        res.end(error.message);
      }
    });
    relay.listen(0, "127.0.0.1");
    await once(relay, "listening");
    const child = spawn(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.debugger.config.ts"],
      {
        cwd: new URL("..", import.meta.url),
        windowsHide: true,
        env: {
          ...process.env,
          QA_TEST_DEBUGGER: "1",
          QA_DEBUGGER_GENERIC: "1",
          QA_BROWSER_PREVIEW: "1",
          PWDEBUG: "0",
          OCTOPUS_GUIDED_API: "0",
          OCTOPUS_UI_RUN_ID: run.runId,
          OCTOPUS_GUIDED_KEY: run.key,
          OCTOPUS_GUIDED_URL: `http://127.0.0.1:${relay.address().port}`,
        },
      },
    );
    let output = "";
    child.stdout.on("data", (b) => (output += b));
    child.stderr.on("data", (b) => (output += b));
    const ended = once(child, "close");
    let exited = false;
    child.on("close", () => (exited = true));
    const until = async (predicate) => {
      const end = Date.now() + 25000;
      while (!predicate()) {
        if (exited || Date.now() > end)
          throw new Error(
            "Brak oczekiwanego kroku: " + output + " " + JSON.stringify(run.snapshot()),
          );
        await new Promise((r) => globalThis.setTimeout(r, 30));
      }
    };
    const advance = async (pattern) => {
      await until(() => run.snapshot().steps.at(-1)?.ready);
      const step = run.snapshot().steps.at(-1);
      assert.match(step.title, pattern);
      run.next(step.id);
    };
    try {
      await advance(/Rozpocznij test/);
      await advance(/Otwórz stronę/);
      await until(() => run.snapshot().steps.at(-1)?.ready);
      assert.equal(probes, 0);
      await until(() => frames > 0);
      await advance(/Sprawdź i zmień licznik/);
      await until(() => run.snapshot().steps.at(-1)?.ready);
      assert.equal(probes, 1);
      await advance(/Wypełnij pole/);
      await until(() => run.snapshot().steps.at(-1)?.ready);
      assert.equal(requests, 0);
      await advance(/API POST/);
      await advance(/Równoległy etap A/);
      await advance(/Równoległy etap B/);
      const [code] = await ended;
      assert.equal(code, 0, output);
      assert.equal(requests, 1);
      assert.ok(frames > 0);
      assert.equal(run.steps.length, 7);
      assert.ok(run.steps.every((s) => s.status === "passed"));
      const serialized = JSON.stringify(run.snapshot());
      assert.ok(!serialized.includes("fixture-private-secret"));
      assert.ok(!serialized.includes("secret-response-token"));
      assert.equal(run.steps[4].requests.length, 1);
      assert.equal(run.steps[4].requests[0].body.password, "[ukryto]");
      // Same test, debugger disabled: all actions complete without any gate/event.
      const plain = spawn(
        process.execPath,
        ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.debugger.config.ts"],
        {
          cwd: new URL("..", import.meta.url),
          windowsHide: true,
          env: {
            ...process.env,
            QA_TEST_DEBUGGER: "0",
            QA_DEBUGGER_GENERIC: "1",
            QA_BROWSER_PREVIEW: "0",
            PWDEBUG: "0",
            OCTOPUS_GUIDED_API: "0",
            OCTOPUS_GUIDED_URL: `http://127.0.0.1:${relay.address().port}`,
          },
        },
      );
      let plainOutput = "";
      plain.stdout.on("data", (b) => (plainOutput += b));
      plain.stderr.on("data", (b) => (plainOutput += b));
      const [plainCode] = await once(plain, "close");
      assert.equal(plainCode, 0, plainOutput);
      assert.equal(probes, 2);
      assert.equal(requests, 2);
      assert.equal(run.steps.length, 7);
    } finally {
      run.close();
      if (child.exitCode === null) child.kill();
      relay.closeAllConnections();
      await new Promise((r) => relay.close(r));
    }
  },
);
