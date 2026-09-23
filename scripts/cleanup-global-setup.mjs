import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { ensureSession } from "./auth.mjs";
import { acquireTestRunLock, releaseTestRunLock } from "./test-run-lock.mjs";

export default async function setup() {
  await acquireTestRunLock();
  // Nowy identyfikator dla każdego uruchomienia, także gdy proces jest ponownie użyty.
  process.env.OCTOPUS_CLEANUP_BATCH_ID = randomUUID();
  const startedAt = performance.now();
  let status = "passed";
  try {
    await ensureSession();
  } catch (error) {
    status = "failed";
    await releaseTestRunLock();
    throw error;
  } finally {
    const runId = process.env.OCTOPUS_AUTH_RUN_ID;
    if (runId) {
      const directory = path.resolve("runs");
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, `performance-setup-${runId}.json`),
        JSON.stringify({ durationMs: performance.now() - startedAt, status }, null, 2) + "\n",
        "utf8",
      );
    }
  }
}
