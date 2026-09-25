import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { classifyFailure } from "./failure-classifier.mjs";

function testIdentifier(test) {
  const title = test.titlePath().join(" › ");
  return (
    title.match(
      /\b(?:ORD|CLUB|SCH(?:-EDIT)?|MED(?:-YEAR)?|ADD|EDIT|TEA|FIND|REL)-[A-Z0-9-]+\b/,
    )?.[0] ?? test.id
  );
}

function errorText(error) {
  if (!error) return "";
  return error.message || error.value || error.stack || String(error);
}

export default class FailureReporter {
  constructor() {
    this.failures = [];
  }

  onTestEnd(test, result) {
    if (result.status === test.expectedStatus || result.status === "skipped") return;

    const errors = result.errors?.length ? result.errors : result.error ? [result.error] : [];
    const combinedMessage =
      errors.map(errorText).filter(Boolean).join("\n\n") || `Test status: ${result.status}`;
    const classified = classifyFailure({ message: combinedMessage, status: result.status });
    const location = errors.find((error) => error?.location)?.location ?? test.location;

    this.failures.push({
      id: testIdentifier(test),
      testId: test.id,
      title: test.title,
      titlePath: test.titlePath().join(" › "),
      status: result.status,
      retry: result.retry,
      durationMs: result.duration,
      file: location?.file ? path.relative(process.cwd(), location.file).replace(/\\/g, "/") : null,
      line: location?.line ?? null,
      column: location?.column ?? null,
      ...classified,
    });
  }

  async onEnd(result) {
    const runId = process.env.OCTOPUS_UI_RUN_ID || process.env.OCTOPUS_AUTH_RUN_ID;
    if (!runId) return;

    const report = {
      schemaVersion: 1,
      runId,
      generatedAt: new Date().toISOString(),
      status: result.status,
      failures: this.failures,
    };
    const directory = path.resolve("runs");
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, `failures-${runId}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
  }
}
