import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function summary(values) {
  return {
    count: values.length,
    p50Ms: Math.round(percentile(values, 50)),
    p90Ms: Math.round(percentile(values, 90)),
    p95Ms: Math.round(percentile(values, 95)),
    maxMs: Math.round(values.length ? Math.max(...values) : 0),
  };
}

export default class PerformanceReporter {
  constructor() {
    this.samples = new Map();
    this.counters = new Map();
    this.tests = [];
  }

  addSample(name, value) {
    const samples = this.samples.get(name) ?? [];
    samples.push(value);
    this.samples.set(name, samples);
  }

  onTestEnd(test, result) {
    const attachment = result.attachments.find(
      (item) => item.name === "octopus-performance" && item.body,
    );
    const snapshot = attachment ? JSON.parse(attachment.body.toString("utf8")) : undefined;
    const setupMs =
      snapshot?.events
        ?.filter(
          (event) =>
            !event.name.includes("cleanup") &&
            (event.name.startsWith("fixture.") || event.name.startsWith("setup.")),
        )
        .reduce((total, event) => total + event.durationMs, 0) ?? 0;
    const cleanupMs =
      snapshot?.events
        ?.filter((event) => event.name.includes("cleanup"))
        .reduce((total, event) => total + event.durationMs, 0) ?? 0;
    const testBodyMs = Math.max(0, result.duration - setupMs - cleanupMs);

    this.addSample("test.total", result.duration);
    this.addSample("test.body", testBodyMs);
    this.addSample("test.setup", setupMs);
    this.addSample("test.cleanup", cleanupMs);

    for (const event of snapshot?.events ?? []) this.addSample(event.name, event.durationMs);
    for (const [name, value] of Object.entries(snapshot?.counters ?? {})) {
      this.counters.set(name, (this.counters.get(name) ?? 0) + Number(value));
    }

    this.tests.push({
      id: test.id,
      title: test.titlePath().join(" › "),
      status: result.status,
      workerIndex: result.workerIndex,
      totalMs: Math.round(result.duration),
      setupMs: Math.round(setupMs),
      bodyMs: Math.round(testBodyMs),
      cleanupMs: Math.round(cleanupMs),
      counters: snapshot?.counters ?? {},
    });
  }

  async onEnd(result) {
    if (!this.tests.length) return;

    const runId = process.env.OCTOPUS_AUTH_RUN_ID;
    const setup = runId
      ? await readFile(path.resolve("runs", `performance-setup-${runId}.json`), "utf8")
          .then(JSON.parse)
          .catch(() => undefined)
      : undefined;
    const cleanup = runId
      ? await readFile(path.resolve("runs", `performance-cleanup-${runId}.json`), "utf8")
          .then(JSON.parse)
          .catch(() => undefined)
      : undefined;
    if (setup) this.addSample("suite.setup", setup.durationMs);
    if (cleanup) {
      this.addSample("suite.cleanup", cleanup.durationMs);
      this.counters.set("cleanup.records", Number(cleanup.records));
    }

    const metrics = Object.fromEntries(
      [...this.samples.entries()].map(([name, values]) => [name, summary(values)]),
    );
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      runId: runId ?? null,
      status: result.status,
      workers: Number(process.env.OCTOPUS_EFFECTIVE_WORKERS ?? 1),
      metrics,
      counters: Object.fromEntries(this.counters),
      setup: setup ?? null,
      cleanup: cleanup ?? null,
      tests: this.tests,
    };
    const directory = path.resolve("runs");
    const filename = `performance-${report.runId ?? Date.now()}.json`;

    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), JSON.stringify(report, null, 2) + "\n", "utf8");

    console.log("\nWydajność Octopus (ms):");
    console.table(
      Object.entries(metrics).map(([name, value]) => ({
        metryka: name,
        ...value,
      })),
    );
    console.log(`Raport wydajności: runs/${filename}`);
  }
}
