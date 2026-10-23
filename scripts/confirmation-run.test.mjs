import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { buildRunArguments } from "./test-ui-server.mjs";

const cases = JSON.parse(
  readFileSync(
    new URL("../tests/data/potwierdzenia-gratisy-2026-cases.json", import.meta.url),
    "utf8",
  ),
);
const smoke = JSON.parse(
  readFileSync(new URL("../tests/data/gratisy-szybki-test-2026.json", import.meta.url), "utf8"),
);

test("quick gift suite selects exactly its 13 existing cases", () => {
  const run = buildRunArguments({ suite: "giftSmoke2026", environment: "dev", workers: 4 });
  assert.equal(run.workers, 2);
  assert.ok(run.args.includes("tests/potwierdzenia-gratisy-2026.spec.ts"));
  const grep = new RegExp(run.args[run.args.indexOf("--grep") + 1]);
  const selected = cases.filter((c) =>
    grep.test(
      `${c.id}: ${c.title} @gift @potw26${smoke.testIds.includes(c.id) ? " @gift-smoke" : ""}`,
    ),
  );
  assert.equal(selected.length, 13);
  assert.deepEqual(selected.map((c) => c.id).sort(), [...smoke.testIds].sort());
  assert.throws(
    () => buildRunArguments({ suite: "giftSmoke2026", selectedTestIds: ["POTW26-01-PLUS"] }),
    /13 wybranych/,
  );
});

test("custom filter cannot broaden the quick gift suite", () => {
  const run = buildRunArguments({ suite: "giftSmoke2026", grep: "POTW26-01-MIN" });
  const grep = new RegExp(run.args[run.args.indexOf("--grep") + 1]);
  assert.ok(grep.test("POTW26-01-MIN: example @gift-smoke"));
  assert.equal(grep.test("POTW26-01-MIN: example @potw26"), false);
});

test("full confirmation selection includes every test, also after the first 100", () => {
  const ids = cases.map((c) => c.id);
  const run = buildRunArguments({
    selectedTestIds: ids,
    suite: "all",
    environment: "dev",
    workers: 2,
  });
  const pattern = new RegExp(run.args[run.args.indexOf("--grep") + 1]);
  assert.ok(ids.length > 100);
  for (const id of ids) assert.ok(pattern.test(`${id}: description`), id);
  assert.equal(pattern.test(`${ids[0]}-EXTRA: another test`), false);
  assert.equal(run.workers, 2);
});

test("confirmation parallelism is optional, capped at two, and disabled in single-tab mode", () => {
  for (const requested of [1, 2, 4]) {
    const run = buildRunArguments({
      suite: "confirmations2026",
      environment: "dev",
      workers: requested,
    });
    assert.equal(run.workers, Math.min(requested, 2));
    const single = buildRunArguments({
      suite: "confirmations2026",
      environment: "dev",
      workers: requested,
      singleTab: true,
    });
    assert.equal(single.workers, 1);
  }
  assert.equal(buildRunArguments({ suite: "copying", environment: "dev", workers: 2 }).workers, 1);
  assert.equal(buildRunArguments({ suite: "database", environment: "dev", workers: 2 }).workers, 1);
});

test("oversized selections produce an error instead of silently omitting tests", () => {
  assert.throws(
    () => buildRunArguments({ selectedTestIds: ["POTW26-" + "A".repeat(25000)] }),
    /za długa/,
  );
});

test("UI allows two workers for confirmations and retains single-tab restriction", () => {
  const source = readFileSync(new URL("../test-ui/app.js", import.meta.url), "utf8");
  const ast = ts.createSourceFile("app.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const declaration = ast.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === "updateWorkersForSuite",
  );
  assert.ok(declaration);
  const option4 = { disabled: false };
  const workers = { value: "2", disabled: false, querySelector: () => option4 };
  const singleTab = { checked: false };
  const hint = {};
  const context = vm.createContext({
    $: (key) => ({ "#workers": workers, "#workersHint": hint, "#singleTab": singleTab })[key],
  });
  vm.runInContext(declaration.getText(ast), context);
  vm.runInContext("updateWorkersForSuite('confirmations2026')", context);
  assert.equal(workers.value, "2");
  assert.equal(workers.disabled, false);
  assert.equal(option4.disabled, true);
  singleTab.checked = true;
  vm.runInContext("updateWorkersForSuite('confirmations2026')", context);
  assert.equal(workers.value, "1");
  assert.equal(workers.disabled, true);
});
