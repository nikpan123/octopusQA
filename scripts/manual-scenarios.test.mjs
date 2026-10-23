import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { manualGiftScenario } from "./manual-scenario-text.mjs";
import { applyConfirmationOverrides } from "./confirmation-matrix.mjs";
import { validateScenarioChanges } from "./scenario-editor.mjs";
const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const matrix = applyConfirmationOverrides(
  json("../tests/data/potwierdzenia-gratisy-2026.json"),
  json("../tests/data/potwierdzenia-gratisy-2026-overrides.json"),
);
const cases = json("../tests/data/potwierdzenia-gratisy-2026-cases.json");
const catalog = json("../test-ui/scenarios.json");
const gift = (id) => {
  const c = cases.find((c) => c.id === id);
  return manualGiftScenario(
    matrix.rows.find((r) => r.key === c.rowKey),
    c,
    matrix,
  );
};
test("every catalog scenario has editable preparation, input data, steps and an expected result", () => {
  let count = 0;
  for (const f of catalog.features)
    for (const s of f.scenarios) {
      count++;
      assert.ok(s.preconditions.length && s.data && s.expected, s.id);
      validateScenarioChanges(
        Object.fromEntries(
          ["title", "description", "preconditions", "steps", "expected", "blocker", "data"].map(
            (k) => [k, s[k] ?? ""],
          ),
        ),
      );
      for (const link of s.stepLinks ?? [])
        assert.ok(link.step >= 0 && link.step < s.steps.length, s.id);
    }
  assert.equal(count, 644);
});
test("gift instructions explain page actions and require the database date before the confirmation", () => {
  const s = gift("POTW26-01-MIN");
  assert.match(s.steps[1], /„Zamówienia”.*„Dodaj”.*4P-3.*30 szt/);
  assert.match(s.steps[2], /2026-05-01.*ponownym odczytem/);
  assert.match(s.steps[3], /„Kluby”.*„Dodaj formularz”.*2026\/2027/);
  assert.match(s.steps[4], /„Gratisy”/);
  assert.match(s.expected, /4PN-3.*1 egzemplarz/);
  const blocked = gift("POTW26-01-MINUS");
  assert.match(blocked.expected, /Za mała ilość/);
});
test("no-order, foreign, Testowy and old-year cases retain their distinct manual conditions", () => {
  const none = gift("POTW26-01-NO-ORDER");
  assert.equal(none.steps.length, 6);
  assert.match(none.steps[1], /Nie dodawaj zamówienia/);
  assert.match(none.expected, /Brak zamówień/);
  const foreign = gift("POTW26-01-FOREIGN");
  assert.match(foreign.steps[3], /NOWA ERA/);
  assert.match(foreign.expected, /nie ma żadnego wpisu/);
  assert.match(gift("POTW26-01-TEST-TEACHER").preconditions.join(" "), /ma być zaznaczone/);
  assert.match(gift("POTW26-01-OLD-CONFIRM").steps[3], /2025\/2026/);
  assert.match(gift("POTW26-16-MIN").steps[3], /4 Między N/);
  const ss = gift("POTW26-08-MIN");
  assert.match(ss.data, /MLK2-1.*1 szt/);
  assert.match(ss.steps[3], /klasę 2, zakres podstawowy/);
});
test("all 590 gift instructions retain exact links to the matching automation stages", () => {
  const feature = catalog.features.find((f) => f.id === "potwierdzenia-gratisy-2026");
  assert.equal(feature.scenarios.length, 590);
  for (const c of cases) {
    const s = feature.scenarios.find((s) => s.id === c.id);
    assert.deepEqual(s.testIds, [c.id]);
    const keys = [
      "prepare",
      "order",
      ...(c.variant === "NO_ORDER" ? [] : ["date"]),
      "confirm",
      "view",
      "compare",
      "cleanup",
    ];
    assert.equal(s.steps.length, keys.length);
    for (const [i, key] of keys.entries())
      assert.deepEqual(s.stepLinks[i], { step: i, testId: c.id, titles: [c.stepTitles[key]] });
  }
});
