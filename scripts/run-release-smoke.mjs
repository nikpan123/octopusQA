import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildRunArguments } from "./test-ui-server.mjs";

const options = process.argv.slice(2);
if (options.some((option) => !["--list", "--headed"].includes(option))) {
  throw new Error("Obsługiwane opcje: --list (tylko lista) i --headed (widoczna przeglądarka).");
}
const run = buildRunArguments({
  suite: "releaseSmoke",
  environment: "dev",
  workers: 1,
  headed: options.includes("--headed"),
});
if (options.includes("--list")) run.args.push("--list");
const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("playwright/package.json")), "cli.js");
const child = spawn(process.execPath, [cli, ...run.args], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env, OCTOPUS_ENV: run.environment },
  stdio: "inherit",
  windowsHide: true,
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
