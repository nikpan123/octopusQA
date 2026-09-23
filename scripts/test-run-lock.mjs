import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function processIsRunning(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== "ESRCH";
  }
}

export async function acquireTestRunLock(environment = process.env.OCTOPUS_ENV ?? "dev") {
  const directory = path.join(root, "playwright", ".auth", environment);
  const file = path.join(directory, "test-run.lock");
  const token = randomUUID();

  await mkdir(directory, { recursive: true });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(file, "wx", 0o600);
      try {
        await handle.writeFile(
          JSON.stringify({ pid: process.pid, token, startedAt: new Date().toISOString() }),
        );
      } finally {
        await handle.close();
      }
      process.env.OCTOPUS_TEST_RUN_LOCK_FILE = file;
      process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN = token;
      return;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;

      const current = await readFile(file, "utf8")
        .then(JSON.parse)
        .catch(() => null);

      if (current && processIsRunning(Number(current.pid))) {
        throw new Error(
          `Inne testy Octopusa dla środowiska ${environment.toUpperCase()} już działają ` +
            `(PID ${current.pid}, start ${current.startedAt ?? "nieznany"}). ` +
            "Poczekaj na ich zakończenie przed uruchomieniem testu z VS Code.",
          { cause: error },
        );
      }

      await unlink(file).catch((unlinkError) => {
        if (unlinkError.code !== "ENOENT") throw unlinkError;
      });
    }
  }

  throw new Error("Nie udało się uzyskać blokady uruchomienia testów.");
}

export async function releaseTestRunLock() {
  const file = process.env.OCTOPUS_TEST_RUN_LOCK_FILE;
  const token = process.env.OCTOPUS_TEST_RUN_LOCK_TOKEN;
  if (!file || !token) return;

  const current = await readFile(file, "utf8")
    .then(JSON.parse)
    .catch(() => null);

  if (current?.token === token) {
    await unlink(file).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
