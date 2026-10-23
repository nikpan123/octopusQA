import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRunArguments, SUITES } from "./test-ui-server.mjs";
const manifest = JSON.parse(
  readFileSync(new URL("../tests/data/regresja-przed-releasem.json", import.meta.url), "utf8"),
);
const index = readFileSync(new URL("../docs/tests/scenario-index.md", import.meta.url), "utf8");
test("release pack reuses exactly 26 existing uniquely identified Octopus tests", () => {
  assert.equal(manifest.testIds.length, 26);
  assert.equal(new Set(manifest.testIds).size, 26);
  assert.equal(new Set(manifest.tests.map((t) => t.area)).size, 7);
  for (const id of manifest.testIds)
    assert.equal(index.split("\n").filter((l) => l.startsWith("| " + id + " |")).length, 1, id);
  const catalog = JSON.parse(
    readFileSync(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(
    catalog.features.find((f) => f.id === "octopus-regresja-przed-releasem").scenarios[0].testIds,
    manifest.testIds,
  );
  const html = readFileSync(new URL("../test-ui/index.html", import.meta.url), "utf8");
  assert.ok(html.includes('data-test-ids="' + manifest.testIds.join(",") + '"'));
});
test("release runner restricts environment, selection and parallelism", () => {
  const run = buildRunArguments({ suite: "releaseSmoke", environment: "dev", workers: 4 });
  assert.equal(run.workers, 1);
  assert.deepEqual(SUITES.releaseSmoke.files, manifest.files);
  const grep = new RegExp(run.args[run.args.indexOf("--grep") + 1]);
  for (const t of manifest.tests) assert.ok(grep.test(t.title), t.id);
  for (const title of [
    "NCL-04: historical orders",
    "NCL-05: ranges",
    "ADD-01-EXTRA: unrelated",
    "SCH-EDIT-12: outside",
    "POTW26-01-MIN-EXTRA: unrelated",
    "DEB-01: seasonal",
  ])
    assert.equal(grep.test(title), false, title);
  assert.throws(() => buildRunArguments({ suite: "releaseSmoke", environment: "test" }), /DEV/);
  assert.throws(
    () => buildRunArguments({ suite: "releaseSmoke", selectedTestIds: ["NCL-05"] }),
    /26 wybranych/,
  );
  const filtered = buildRunArguments({ suite: "releaseSmoke", grep: "NCL-01|NCL-05" });
  const only = new RegExp(filtered.args[filtered.args.indexOf("--grep") + 1]);
  assert.ok(only.test("NCL-01: selected"));
  assert.equal(only.test("NCL-05: outside"), false);
});

test("gift catalog package selects only its seven tests", () => {
  const run = buildRunArguments({ suite: "giftCatalog", environment: "dev" });
  assert.ok(run.args.includes("tests/centrum-wysylkowe-gratisy.spec.ts"));
  assert.equal(SUITES.giftCatalog.testIds.length, 7);
  assert.throws(
    () => buildRunArguments({ suite: "giftCatalog", selectedTestIds: ["ADD-01"] }),
    /7 wybranych/,
  );
});
