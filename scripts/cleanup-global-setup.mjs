import { randomUUID } from "node:crypto";
import { acquireTestRunLock } from "./test-run-lock.mjs";

export default async function setup() {
  await acquireTestRunLock();
  // Nowy identyfikator dla każdego uruchomienia, także gdy proces jest ponownie użyty.
  process.env.OCTOPUS_CLEANUP_BATCH_ID = randomUUID();
}
