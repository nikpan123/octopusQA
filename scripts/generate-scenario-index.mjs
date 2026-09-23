import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const outputPath = resolve("docs/tests/scenario-index.md");
const checkOnly = process.argv.includes("--check");

const result = spawnSync(process.execPath, [playwrightCli, "test", "--list", "--reporter=json"], {
  cwd: process.cwd(),
  encoding: "utf8",
  // Dokumentujemy również jawnie uruchamiany workflow roczny, mimo że jest
  // wyłączony z domyślnej regresji.
  env: { ...process.env, OCTOPUS_INCLUDE_ANNUAL: "1" },
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "Playwright zakończył się błędem.\n");
  process.exit(result.status ?? 1);
}

const jsonStart = result.stdout.indexOf("{");
if (jsonStart < 0) {
  throw new Error("Playwright nie zwrócił raportu JSON z listą scenariuszy.");
}

const report = JSON.parse(result.stdout.slice(jsonStart));
const scenarios = [];

function collect(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      scenarios.push({
        file: spec.file,
        line: spec.line,
        title: spec.title,
        tags: spec.tags ?? [],
      });
    }

    collect(suite.suites);
  }
}

collect(report.suites);
scenarios.sort((left, right) => {
  return left.file.localeCompare(right.file, "pl") || left.line - right.line;
});

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

const rows = scenarios.map(({ file, line, title, tags }) => {
  const identifier = title.includes(":") ? title.slice(0, title.indexOf(":")) : "—";
  const cleanTitle = title.replace(/(?:\s+@[-\w]+)+$/u, "");
  const tagList = tags.length ? tags.map((tag) => `\`${tag}\``).join(", ") : "—";
  const source = `[${file}](../../tests/${file}#L${line})`;

  return `| ${escapeCell(identifier)} | ${escapeCell(cleanTitle)} | ${source} | ${tagList} |`;
});

const document = [
  "# Indeks scenariuszy",
  "",
  "> Plik generowany automatycznie przez `npm run docs:scenarios`. Nie edytuj tabeli ręcznie.",
  "",
  `Łącznie: **${scenarios.length} scenariuszy**.`,
  "",
  "| ID | Scenariusz | Plik | Tagi |",
  "|---|---|---|---|",
  ...rows,
  "",
].join("\n");

if (checkOnly) {
  const current = readFileSync(outputPath, "utf8").replaceAll("\r\n", "\n");
  if (current !== document) {
    console.error("Indeks scenariuszy jest nieaktualny. Uruchom: npm run docs:scenarios");
    process.exit(1);
  }

  console.log(`Indeks scenariuszy jest aktualny (${scenarios.length}).`);
} else {
  writeFileSync(outputPath, document, "utf8");
  console.log(`Zapisano ${scenarios.length} scenariuszy w docs/tests/scenario-index.md.`);
}
