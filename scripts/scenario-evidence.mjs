import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { reportFiles, previewFromHtml, validPreviewId } from "./test-preview.mjs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cache = new Map();
const flatten = (steps = []) => steps.flatMap((step) => [step, ...flatten(step.steps)]);

// Only structural evidence is retained here. Responses and session data stay out of the index.
export async function executionsFromHtml(html, run) {
  const files = await reportFiles(html);
  if (!files.length) throw new Error("Raport nie zawiera czytelnych danych Playwright.");
  const metadata = files.find((file) => file.stats);
  const compactSteps = (steps = [], depth = 0) =>
    depth > 30
      ? []
      : steps.slice(0, 3000).map((step) => ({
          title: step.title,
          error: Boolean(step.error),
          skipped: Boolean(step.skipped),
          steps: compactSteps(step.steps, depth + 1),
        }));
  return files
    .flatMap((file) => file.tests ?? [])
    .flatMap((test) => {
      const id = test.title?.split(":")[0];
      const result = test.results?.at(-1);
      if (!validPreviewId(id) || !result) return [];
      return [
        {
          id,
          status: result.status,
          date: result.startTime || metadata?.startTime || run.startedAt,
          attempt: result.retry ?? 0,
          steps: compactSteps(result.steps),
          runId: run.id,
          environment: run.environment,
          reportUrl: `/report/${run.id}/`,
        },
      ];
    });
}

export function stepEvidence(link, executions) {
  const execution = executions.find((item) => item.id === link.testId);
  if (!execution) return { status: "not_run", testId: link.testId };
  const base = { testId: link.testId, runId: execution.runId, date: execution.date };
  const steps = flatten(execution.steps);
  const matches = link.titles.map((title) => steps.filter((step) => step.title === title));
  if (matches.some((items) => items.length !== 1)) return { ...base, status: "missing" };
  const required = matches.flat();
  if (required.some((step) => flatten([step]).some((item) => item.error)))
    return {
      ...base,
      status: "failed",
      stepTitle: required.find((step) => flatten([step]).some((item) => item.error)).title,
    };
  if (
    required.some((step) => flatten([step]).some((item) => item.skipped)) ||
    execution.status === "skipped"
  )
    return { ...base, status: "skipped", stepTitle: required[0].title };
  // An interrupted action can have no recorded error and still be incomplete.
  const status = ["passed", "failed"].includes(execution.status) ? "passed" : "unknown";
  return { ...base, status, stepTitle: required[0].title };
}

export function stepChecks(link) {
  return link?.checks ?? (link ? [{ testId: link.testId, titles: link.titles }] : []);
}

export function combinedStepEvidence(link, executions) {
  const checks = stepChecks(link).map((check) => {
    if (executions.filter((item) => item.id === check.testId).length > 1)
      return { testId: check.testId, status: "unknown", stages: [] };
    const result = stepEvidence(check, executions);
    const stages = check.titles.map((title) => ({
      title,
      ...stepEvidence({ testId: check.testId, titles: [title] }, executions),
    }));
    return { ...result, stages };
  });
  const statuses = checks.flatMap((check) => [
    check.status,
    ...check.stages.map((stage) => stage.status),
  ]);
  const status =
    ["failed", "unknown", "missing", "not_run", "skipped"].find((status) =>
      statuses.includes(status),
    ) || "passed";
  // Preserve the old single-stage fields for callers, and expose every required check.
  return { ...checks[0], status, checks };
}

export function scenarioEvidence(scenario, executions) {
  const ids = [...new Set(scenario.testIds)];
  const relevant = executions.filter((item) => ids.includes(item.id));
  const groups = new Map();
  for (const item of relevant) {
    if (!groups.has(item.runId)) groups.set(item.runId, []);
    groups.get(item.runId).push(item);
  }
  const history = [...groups.entries()]
    .map(([runId, items]) => {
      const counts = { passed: 0, failed: 0, skipped: 0, unknown: 0 };
      // Duplicate IDs (e.g. multiple projects) must all pass, not just the first occurrence.
      for (const id of ids) {
        const tests = items.filter((item) => item.id === id);
        if (!tests.length) continue;
        if (tests.some((item) => ["failed", "timedOut", "interrupted"].includes(item.status)))
          counts.failed++;
        else if (tests.some((item) => item.status === "skipped")) counts.skipped++;
        else if (tests.every((item) => item.status === "passed")) counts.passed++;
        else counts.unknown++;
      }
      const missingTestIds = ids.filter((id) => !items.some((item) => item.id === id));
      return {
        runId,
        date: items
          .map((item) => item.date || "")
          .sort()
          .at(-1),
        environment: items[0].environment,
        reportUrl: items[0].reportUrl,
        counts,
        executed: ids.length - missingTestIds.length,
        total: ids.length,
        missingTestIds,
        status: counts.failed
          ? "failed"
          : counts.skipped || counts.unknown || missingTestIds.length
            ? "partial"
            : "passed",
        tests: ids.flatMap((id) =>
          items.filter((item) => item.id === id).map((item) => ({ id, status: item.status })),
        ),
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if(scenario.descriptionUpdatedAt)for(const run of history)run.beforeDescriptionChange=Boolean(scenario.descriptionUpdatedAt&&run.date<scenario.descriptionUpdatedAt);
  const latestRun = history.find(run=>!run.beforeDescriptionChange) || null;
  // All step badges refer to the SAME run as the scenario summary, never a mixture of runs.
  const latestExecutions = relevant.filter((item) => item.runId === latestRun?.runId);
  const steps = scenario.steps.map((_, index) => {
    const link = scenario.stepLinks?.find((item) => item.step === index);
    const checks = stepChecks(link);
    if (
      !checks.length ||
      checks.some(
        (check) =>
          !ids.includes(check.testId) || !Array.isArray(check.titles) || !check.titles.length,
      )
    )
      return { status: "unmapped" };
    return combinedStepEvidence(link, latestExecutions);
  });
  return { latestRun, history: history.slice(0, 5), steps };
}

export async function loadScenarioEvidence(root, catalog, environment, history) {
  const executions = [];
  const unavailable = [];
  for (const run of history.filter(
    (item) => uuid.test(item.id) && item.environment === environment && item.endedAt,
  )) {
    const file = path.join(root, "runs/html-reports", run.id, "index.html");
    try {
      const info = await stat(file);
      if (info.size > 48 * 1024 * 1024) throw new Error("Report too large");
      const signature = `${info.size}:${info.mtimeMs}:${environment}`;
      let cached = cache.get(file);
      if (cached?.signature !== signature) {
        cached = {
          signature,
          executions: await executionsFromHtml(await readFile(file, "utf8"), run),
        };
        cache.set(file, cached);
        if (cache.size > 150) cache.delete(cache.keys().next().value);
      }
      executions.push(...cached.executions);
    } catch (error) {
      unavailable.push({
        runId: run.id,
        date: run.startedAt || "",
        testIds: (run.selectedTestIds || []).filter(validPreviewId),
        reason: error.code === "ENOENT" ? "not_saved" : "unreadable",
      });
    }
  }
  return {
    environment,
    unavailableReports: unavailable.length,
    archive: {
      notSaved: unavailable.filter((item) => item.reason === "not_saved").length,
      unreadable: unavailable.filter((item) => item.reason === "unreadable").length,
    },
    scenarios: Object.fromEntries(
      catalog.features
        .flatMap((feature) => feature.scenarios)
        .map((scenario) => {
          const evidence = scenarioEvidence(scenario, executions);
          const related = unavailable.filter((run) =>
            run.testIds.some((id) => scenario.testIds.includes(id)),
          );
          return [
            scenario.id,
            {
              ...evidence,
              archive: {
                unavailableCount: related.length,
                newerUnavailableCount: related.filter(
                  (run) => !evidence.latestRun || run.date > evidence.latestRun.date,
                ).length,
              },
            },
          ];
        }),
    ),
  };
}

export async function testPreviewForRun(root, id, environment, history, runId) {
  if (!uuid.test(runId) || !validPreviewId(id))
    throw new Error("Niepoprawny identyfikator raportu lub testu.");
  const run = history.find(
    (item) => item.id === runId && item.environment === environment && item.endedAt,
  );
  if (!run) throw new Error("Raport nie należy do wybranego środowiska lub nie został zakończony.");
  const file = path.join(root, "runs/html-reports", runId, "index.html");
  if ((await stat(file)).size > 48 * 1024 * 1024)
    throw new Error("Raport zbyt duży — otwórz pełny raport.");
  return previewFromHtml(await readFile(file, "utf8"), id, {
    environment,
    label: "Raport wskazanego przebiegu",
    reportUrl: `/report/${runId}/`,
    assetsBase: `/report/${runId}/`,
  });
}
