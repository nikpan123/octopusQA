import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createScenarioEditor } from "./scenario-editor.mjs";
import { scenarioEvidence } from "./scenario-evidence.mjs";
const fixture = {
  features: [
    {
      id: "feature",
      scenarios: [
        {
          id: "CASE-1",
          title: "Pierwszy opis",
          preconditions: ["Konto QA"],
          steps: ["Pierwszy krok", "Drugi krok"],
          expected: "Poprawny wynik",
          testIds: ["AUTO-1"],
          automation: "automated",
          stepLinks: [
            { step: 0, testId: "AUTO-1", titles: ["Stage A"] },
            { step: 1, testId: "AUTO-1", titles: ["Stage B"] },
          ],
        },
      ],
    },
  ],
};
const changes = {
  title: "Nowy tytuł",
  description: "Cel",
  preconditions: ["Konto QA"],
  steps: ["Drugi krok", "Nowa instrukcja", "Pierwszy krok"],
  expected: "Nowy oczekiwany wynik",
  blocker: "",
  data: "Produkt QA",
};

test("Zapis, wersja poprzednia, konflikty, walidacja i zachowane powiązania kroków", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "scenario-edit-")),
    file = path.join(dir, "catalog.json"),
    backupDir = path.join(dir, "backup");
  try {
    await writeFile(file, JSON.stringify(fixture));
    let editor = createScenarioEditor({ file, backupDir });
    const before = await editor.catalog();
    const request = {
      featureId: "feature",
      scenarioId: "CASE-1",
      revision: before.revision,
      changes,
    };
    const auth = {
      origin: "http://local",
      expectedOrigin: "http://local",
      contentType: "application/json",
      editToken: before.editToken,
    };
    await assert.rejects(editor.update(request, { ...auth, origin: "http://foreign" }), {
      status: 403,
    });
    await assert.rejects(
      editor.update({ ...request, changes: { ...changes, testIds: ["BAD"] } }, auth),
      { status: 400 },
    );
    await assert.rejects(editor.update({ ...request, changes: { ...changes, steps: [] } }, auth), {
      status: 400,
    });
    const after = await editor.update(request, auth),
      scenario = after.features[0].scenarios[0];
    assert.equal(scenario.title, "Nowy tytuł");
    assert.deepEqual(scenario.testIds, ["AUTO-1"]);
    assert.equal(scenario.automation, "automated");
    assert.deepEqual(
      scenario.stepLinks.map((link) => link.step),
      [0, 2],
    );
    assert.equal(scenario.stepLinks[0].titles[0], "Stage B");
    assert.ok(scenario.descriptionUpdatedAt);
    assert.deepEqual(
      JSON.parse(await readFile(path.join(backupDir, (await readdir(backupDir))[0]), "utf8")),
      fixture,
    );
    await assert.rejects(editor.update(request, auth), { status: 409 });
    editor = createScenarioEditor({ file, backupDir });
    assert.equal((await editor.catalog()).features[0].scenarios[0].title, "Nowy tytuł");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Nakładka opisów zachowuje katalog źródłowy oraz przyszłe nowe scenariusze", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "scenario-overlay-"));
  const original = JSON.stringify(fixture);
  try {
    const editor = createScenarioEditor({
      file: path.join(dir, "overrides.json"),
      backupDir: path.join(dir, "backup"),
      baseCatalog: async () => fixture,
    });
    const before = await editor.catalog();
    const after = await editor.update(
      { featureId: "feature", scenarioId: "CASE-1", revision: before.revision, changes },
      {
        origin: "http://local",
        expectedOrigin: "http://local",
        contentType: "application/json",
        editToken: before.editToken,
      },
    );
    assert.equal(after.features[0].scenarios[0].title, "Nowy tytuł");
    assert.equal(JSON.stringify(fixture), original);
    fixture.features[0].scenarios.push({
      id: "CASE-2",
      title: "Przyszły",
      steps: ["Krok"],
      preconditions: ["Dostęp"],
      expected: "Wynik",
      testIds: [],
    });
    assert.equal((await editor.catalog()).features[0].scenarios.length, 2);
    fixture.features[0].scenarios.pop();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Zmieniony opis nie przejmuje starego PASS, ale raport pozostaje w historii", () => {
  const scenario = {
    ...fixture.features[0].scenarios[0],
    descriptionUpdatedAt: "2026-10-21T10:00:00.000Z",
  };
  const old = {
    id: "AUTO-1",
    status: "passed",
    date: "2026-10-20T10:00:00.000Z",
    runId: "old",
    environment: "dev",
    reportUrl: "/report/old/",
    steps: [{ title: "Stage A" }, { title: "Stage B" }],
  };
  const evidence = scenarioEvidence(scenario, [old]);
  assert.equal(evidence.latestRun, null);
  assert.equal(evidence.history.length, 1);
  assert.equal(evidence.history[0].beforeDescriptionChange, true);
  const fresh = { ...old, runId: "new", date: "2026-10-22T10:00:00.000Z" };
  assert.equal(scenarioEvidence(scenario, [old, fresh]).latestRun.runId, "new");
});
