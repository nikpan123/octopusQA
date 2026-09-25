import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const specPath = path.join(
  root,
  "tests",
  "zamowienia-szkoly.spec.ts",
);

const source = await readFile(specPath, "utf8");

if (/test\.describe\.configure\(\s*\{\s*mode:\s*["']parallel["']/.test(source)) {
  console.log("zamowienia-szkoly.spec.ts: tryb parallel jest już włączony.");
  process.exit(0);
}

const marker = "type TrackOrder =";
const index = source.indexOf(marker);

if (index < 0) {
  throw new Error(
    "Nie znaleziono miejsca do bezpiecznego wstawienia test.describe.configure(). " +
      "Nie zmieniono pliku.",
  );
}

const block = [
  "test.describe.configure({",
  '  mode: "parallel",',
  "});",
  "",
].join("\n");

const updated = source.slice(0, index) + block + source.slice(index);
await writeFile(specPath, updated, "utf8");

console.log("zamowienia-szkoly.spec.ts: włączono mode=parallel.");
