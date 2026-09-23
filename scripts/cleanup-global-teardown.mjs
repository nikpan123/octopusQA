import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { cleanupTeacherRecords } from "./cleanup-teachers.mjs";
import { releaseTestRunLock } from "./test-run-lock.mjs";

export function belongsToCleanupBatch(run, batchId) {
  return (
    Boolean(batchId) &&
    run.cleanupBatchId === batchId &&
    run.result === "PASS" &&
    Boolean(run.teacherId) &&
    !["DELETED", "ALREADY_ABSENT"].includes(run.cleanupStatus)
  );
}

export default async function teardown() {
  const startedAt = performance.now();
  let selectedCount = 0;
  let cleanupStatus = "passed";
  try {
    const batchId = process.env.OCTOPUS_CLEANUP_BATCH_ID;
    if (!batchId) return;
    const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../runs");
    const names = await readdir(dir).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const selected = [];
    for (const name of names.filter((n) => /^REG_\d+_[a-f0-9]{6}\.json$/.test(n))) {
      const run = JSON.parse(await readFile(path.join(dir, name), "utf8"));
      if (belongsToCleanupBatch(run, batchId)) selected.push({ name, run });
    }
    selectedCount = selected.length;
    if (selected.length)
      console.log(
        `Koniec testów — sprzątanie ${selected.length} nauczycieli z bieżącego uruchomienia.`,
      );
    await cleanupTeacherRecords(dir, selected);
  } catch (error) {
    cleanupStatus = "failed";
    throw error;
  } finally {
    const runId = process.env.OCTOPUS_AUTH_RUN_ID;
    if (runId) {
      const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../runs");
      await writeFile(
        path.join(directory, `performance-cleanup-${runId}.json`),
        JSON.stringify(
          {
            durationMs: performance.now() - startedAt,
            records: selectedCount,
            status: cleanupStatus,
          },
          null,
          2,
        ) + "\n",
        "utf8",
      );
    }
    await releaseTestRunLock();
  }
}
