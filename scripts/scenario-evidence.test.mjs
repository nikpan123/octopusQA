import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";
import {
  executionsFromHtml,
  scenarioEvidence,
  stepEvidence,
  combinedStepEvidence,
  stepChecks,
  loadScenarioEvidence,
  testPreviewForRun,
} from "./scenario-evidence.mjs";

const require = createRequire(import.meta.url);
const { yazl } = require(
  path.join(path.dirname(require.resolve("playwright-core/package.json")), "lib/utilsBundle.js"),
);
async function htmlReport(tests) {
  const zip = new yazl.ZipFile();
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    zip.outputStream.on("data", (chunk) => chunks.push(chunk));
    zip.outputStream.on("end", resolve);
    zip.outputStream.on("error", reject);
  });
  zip.addBuffer(Buffer.from(JSON.stringify({ tests })), "tests.json");
  zip.end();
  await done;
  return `<template>data:application/zip;base64,${Buffer.concat(chunks).toString("base64")}</template>`;
}
const run = {
  id: "11111111-1111-4111-8111-111111111111",
  environment: "dev",
  startedAt: "2026-10-20T10:00:00Z",
  endedAt: "2026-10-20T11:00:00Z",
};
const scenario = {
  testIds: ["ORD-01", "ORD-02"],
  steps: ["Zapis", "Weryfikacja", "Bez mapy"],
  stepLinks: [
    { step: 0, testId: "ORD-01", titles: ["Zapis"] },
    { step: 1, testId: "ORD-02", titles: ["Weryfikacja", "Porównanie"] },
  ],
};
const execution = (id, status = "passed", other = {}) => ({
  id,
  status,
  date: run.startedAt,
  runId: run.id,
  environment: "dev",
  reportUrl: `/report/${run.id}/`,
  steps: [],
  ...other,
});

test("catalog: step bindings use existing scenario IDs and unique in-range steps", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  let bindings = 0;
  for (const scenario of catalog.features.flatMap((feature) => feature.scenarios)) {
    const indices = new Set();
    for (const link of scenario.stepLinks || []) {
      assert.ok(Number.isInteger(link.step) && link.step >= 0 && link.step < scenario.steps.length);
      for (const check of stepChecks(link)) {
        assert.ok(scenario.testIds.includes(check.testId));
        assert.ok(
          check.titles.length &&
            check.titles.every((title) => typeof title === "string" && title.trim()),
        );
      }
      assert.equal(indices.has(link.step), false);
      indices.add(link.step);
      bindings++;
    }
  }
  assert.equal(bindings, 122);
});

test("catalog: mapped titles exist in the corresponding test source or copy fixture", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const files = [
    "zamowienia-kopiowanie-struktura.spec.ts",
    "zamowienia-redmine-35980.spec.ts",
    "zamowienia-redmine-36289.spec.ts",
    "zamowienia-redmine-36290.spec.ts",
    "zamowienia-kopie-uprawnienia.spec.ts",
    "support/order-copy.ts",
    "zamowienia-kopie-gratisy.spec.ts",
    "zamowienia-kopie-zmiana-struktury.spec.ts",
    "zamowienia-kopie-struktura-status.spec.ts",
    "zamowienia-kopie-integracja-stan.spec.ts",
    "zamowienia-kopie-uprawnienia-niezalezne.spec.ts",
  ];
  const patterns = new Map();
  const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      await readFile(new URL("../tests/" + file, import.meta.url), "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const titles = [];
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        (node.expression.getText(source) === "test.step" ||
          node.expression.getText(source) === "guidedApiStep")
      ) {
        const title = node.arguments[0];
        if (title && (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title)))
          titles.push(new RegExp("^" + escaped(title.text) + "$"));
        else if (title && ts.isTemplateExpression(title))
          titles.push(
            new RegExp(
              "^" +
                escaped(title.head.text) +
                title.templateSpans.map((span) => ".*" + escaped(span.literal.text)).join("") +
                "$",
            ),
          );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    patterns.set(file, titles);
  }
  for (const scenario of catalog.features.flatMap((feature) => feature.scenarios))
    for (const link of scenario.stepLinks || [])
      for (const check of stepChecks(link)) {
        const file = check.testId.startsWith("ORD-COPY-")
          ? files[0]
          : check.testId.startsWith("ORD-BUG-36289-")
            ? files[2]
            : check.testId.startsWith("ORD-BUG-36290-")
              ? files[3]
              : /^ORD-SPEC-35980-(11|12|13)$/.test(check.testId)
                ? files[4]
                : /^ORD-DB-(06|07|08|09|10)$/.test(check.testId)
                  ? files[9]
                  : /^ORD-SPEC-35980-(1[4-9]|3[0-3])$/.test(check.testId)
                    ? files[6]
                    : /^ORD-SPEC-35980-2[3-4]$/.test(check.testId)
                      ? files[8]
                      : /^ORD-SPEC-35980-2[5-9]$/.test(check.testId)
                        ? files[10]
                        : /^ORD-SPEC-35980-2[0-2]$/.test(check.testId)
                          ? files[7]
                          : files[1];
        for (const title of check.titles)
          assert.ok(
            [...patterns.get(file), ...patterns.get(files[5])].some((pattern) =>
              pattern.test(title),
            ),
            `${scenario.id}/${check.testId}: etap nie istnieje: ${title}`,
          );
      }
});

test("combined step: all tests and stages required, failure dominates missing, no cross-run PASS", () => {
  const link = {
    step: 0,
    checks: [
      { testId: "ORD-01", titles: ["Zapis", "Kontrola"] },
      { testId: "ORD-02", titles: ["Odmowa"] },
    ],
  };
  const a = execution("ORD-01", "passed", { steps: [{ title: "Zapis" }, { title: "Kontrola" }] });
  const b = execution("ORD-02", "passed", { steps: [{ title: "Odmowa" }] });
  assert.equal(combinedStepEvidence(link, [a, b]).status, "passed");
  assert.equal(combinedStepEvidence(link, [a]).status, "not_run");
  const failed = { ...b, status: "failed", steps: [{ title: "Odmowa", error: true }] };
  assert.equal(combinedStepEvidence(link, [failed]).status, "failed");
  const combinedScenario = {
    testIds: ["ORD-01", "ORD-02"],
    steps: ["Oba warianty"],
    stepLinks: [link],
  };
  assert.equal(
    scenarioEvidence(combinedScenario, [a, { ...b, runId: "older", date: "2026-10-19" }]).steps[0]
      .status,
    "not_run",
  );
  const partial = { ...a, steps: [{ title: "Zapis", error: true }] };
  assert.equal(combinedStepEvidence(link, [partial]).status, "failed");
  assert.equal(combinedStepEvidence(link, [a, a, b]).status, "unknown");
});

test("evidence: only one run determines coverage, exact IDs, no blended PASS", () => {
  const evidence = scenarioEvidence(scenario, [
    execution("ORD-01"),
    execution("ORD-02", "passed", { runId: "older", date: "2026-10-19" }),
    execution("ORD-010", "failed"),
  ]);
  assert.equal(evidence.latestRun.status, "partial");
  assert.equal(evidence.latestRun.executed, 1);
  assert.deepEqual(evidence.latestRun.missingTestIds, ["ORD-02"]);
  assert.equal(evidence.steps[1].status, "not_run");
  assert.equal(evidence.steps[2].status, "unmapped");
  assert.equal(
    scenarioEvidence(scenario, [execution("ORD-01"), execution("ORD-02")]).latestRun.status,
    "passed",
  );
  assert.equal(
    scenarioEvidence(scenario, [execution("ORD-01", "failed")]).latestRun.status,
    "failed",
  );
  assert.equal(scenarioEvidence(scenario, []).latestRun, null);
});

test("evidence: exact stage, all required stages, nested error, later failure, skipped/interrupted", () => {
  const link = { testId: "ORD-01", titles: ["Zapis", "Kontrola"] };
  const steps = [{ title: "Zapis" }, { title: "Kontrola" }];
  assert.equal(stepEvidence(link, [execution("ORD-01", "failed", { steps })]).status, "passed");
  assert.equal(
    stepEvidence(link, [execution("ORD-01", "passed", { steps: [{ title: "Zapis" }] })]).status,
    "missing",
  );
  assert.equal(
    stepEvidence(link, [execution("ORD-01", "passed", { steps: [...steps, { title: "Zapis" }] })])
      .status,
    "missing",
  );
  assert.equal(
    stepEvidence(link, [
      execution("ORD-01", "failed", {
        steps: [{ title: "Zapis", steps: [{ title: "assert", error: true }] }, steps[1]],
      }),
    ]).status,
    "failed",
  );
  assert.equal(
    stepEvidence(link, [execution("ORD-01", "interrupted", { steps })]).status,
    "unknown",
  );
  assert.equal(stepEvidence(link, [execution("ORD-01", "skipped", { steps })]).status, "skipped");
});

test("evidence: HTML last attempt, actual time, no list-only result, no payload data", async () => {
  const html = await htmlReport([
    {
      title: "ORD-01: test",
      results: [
        { status: "failed" },
        {
          status: "passed",
          retry: 1,
          startTime: "2026-10-18",
          steps: [{ title: "Zapis", error: { message: "secret" } }],
          attachments: [{ body: "private" }],
        },
      ],
    },
    { title: "ORD-02: collected", results: [] },
  ]);
  const records = await executionsFromHtml(html, run);
  assert.equal(records.length, 1);
  assert.equal(records[0].date, "2026-10-18");
  assert.equal(records[0].status, "passed");
  assert.equal(records[0].attempt, 1);
  assert.equal(JSON.stringify(records).includes("secret"), false);
  assert.equal(JSON.stringify(records).includes("private"), false);
});

test("evidence: environment isolation, completed run only, fixed preview, cache refresh", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "octopus-evidence-"));
  try {
    const dir = path.join(root, "runs/html-reports", run.id);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, "index.html");
    await writeFile(
      file,
      await htmlReport([
        { title: "ORD-01: test", results: [{ status: "failed", steps: [{ title: "Zapis" }] }] },
      ]),
    );
    const catalog = { features: [{ scenarios: [{ ...scenario, id: "SC-01" }] }] };
    assert.equal(
      (await loadScenarioEvidence(root, catalog, "dev", [run])).scenarios["SC-01"].latestRun.status,
      "failed",
    );
    assert.equal(
      (await loadScenarioEvidence(root, catalog, "test", [run])).scenarios["SC-01"].latestRun,
      null,
    );
    assert.equal(
      (await loadScenarioEvidence(root, catalog, "dev", [{ ...run, endedAt: null }])).scenarios[
        "SC-01"
      ].latestRun,
      null,
    );
    await assert.rejects(testPreviewForRun(root, "ORD-01", "test", [run], run.id));
    await assert.rejects(testPreviewForRun(root, "ORD-01", "dev", [run], "../.env"));
    assert.equal((await testPreviewForRun(root, "ORD-01", "dev", [run], run.id)).status, "failed");
    await writeFile(
      file,
      await htmlReport([{ title: "ORD-01: changed title", results: [{ status: "passed" }] }]),
    );
    const updated = await loadScenarioEvidence(root, catalog, "dev", [run]);
    assert.equal(updated.scenarios["SC-01"].latestRun.counts.passed, 1);
    assert.equal(updated.scenarios["SC-01"].steps[0].status, "missing");
    const oldMissing = {
      ...run,
      id: "22222222-2222-4222-8222-222222222222",
      startedAt: "2026-10-18",
      selectedTestIds: ["ORD-01"],
      reportAvailable: false,
    };
    const unrelatedMissing = {
      ...run,
      id: "33333333-3333-4333-8333-333333333333",
      startedAt: "2026-10-22",
      selectedTestIds: ["CLUB-01"],
      reportAvailable: false,
    };
    const scoped = await loadScenarioEvidence(root, catalog, "dev", [
      run,
      oldMissing,
      unrelatedMissing,
    ]);
    assert.equal(scoped.unavailableReports, 2);
    assert.deepEqual(scoped.archive, { notSaved: 2, unreadable: 0 });
    assert.deepEqual(scoped.scenarios["SC-01"].archive, {
      unavailableCount: 1,
      newerUnavailableCount: 0,
    });
    const newMissing = {
      ...oldMissing,
      id: "44444444-4444-4444-8444-444444444444",
      startedAt: "2026-10-23",
    };
    const newer = await loadScenarioEvidence(root, catalog, "dev", [run, newMissing]);
    assert.equal(newer.scenarios["SC-01"].archive.newerUnavailableCount, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
