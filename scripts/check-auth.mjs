import { ensureSession } from "./auth.mjs";

try {
  await ensureSession({ force: process.argv.includes("--force") });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
