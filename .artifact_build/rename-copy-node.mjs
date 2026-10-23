import { readFile, writeFile } from "node:fs/promises";

const codeFiles = [
  "tests/support/copy-plan.mjs",
  "tests/support/copy-plan.d.mts",
  "tests/support/order-copy.ts",
  "tests/zamowienia-kopiowanie-struktura.spec.ts",
  "tests/zamowienia-redmine-36289.spec.ts",
  "tests/zamowienia-redmine-36290.spec.ts",
  "scripts/copy-plan.test.mjs",
  "docs/tests/kopiowanie-zamowien-struktura.md",
];
const rename = text => text
  .replaceAll("Zespół Szkół A", "Zespół Szkół (ZS)")
  .replaceAll("Szkoła Podstawowa A", "Szkoła Podstawowa (SP)")
  .replaceAll("Liceum A", "Liceum (LO)")
  .replaceAll("Technikum A", "Technikum (TECH)")
  .replace(/\bA\b/g, "ZS");
for (const file of codeFiles) {
  const original = await readFile(file, "utf8");
  await writeFile(file, rename(original));
}
const definitionFile = "tests/support/school-structure-data.ts";
const definitions = await readFile(definitionFile, "utf8");
await writeFile(definitionFile, definitions.replace(/(_(?:ZESPOL|SP|LO|TECH))_A\b/g, "$1_ZS"));

// Patch only the copying features, preserving all other descriptions and formatting.
const catalogFile = "test-ui/scenarios.json";
let catalog = await readFile(catalogFile, "utf8");
for (const id of ["redmine-37160", "redmine-35980"]) {
  const idAt = catalog.indexOf(`"id": "${id}"`);
  if (idAt < 0) throw new Error(`Missing feature ${id}`);
  const start = catalog.lastIndexOf("{", idAt);
  let depth = 0, quoted = false, escaped = false, end = start;
  for (; end < catalog.length; end++) {
    const ch = catalog[end];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) { end++; break; }
  }
  catalog = catalog.slice(0, start) + rename(catalog.slice(start, end)) + catalog.slice(end);
}
JSON.parse(catalog);
await writeFile(catalogFile, catalog);
console.log("Oznaczenie ZS zaktualizowane w planach, testach i opisach kopiowania.");
