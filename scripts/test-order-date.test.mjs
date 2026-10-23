import test from "node:test";
import assert from "node:assert/strict";
import { validateTestOrderDate, resolveOrderDatePowerShell } from "./test-order-date.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { automaticCategorySchoolName, isPackageOrderSchool } from "./test-names.mjs";
const own = {
  orderId: "123",
  schoolId: "456",
  userId: 789,
  schoolName: "AUTO_CAT_DEV_ENT_UNMARKED_SP_400_SECOND_POTW26_abcdef123456_P0_W0",
  date: "2024-05-01",
};

test(
  "PowerShell date script parses without executing it or connecting to the database",
  { skip: process.platform !== "win32" },
  () => {
    const script = fileURLToPath(new URL("./set-test-order-date.ps1", import.meta.url));
    const literal = "'" + script.replaceAll("'", "''") + "'";
    const command = `$tokens=$null;$parseErrors=$null;[void][System.Management.Automation.Language.Parser]::ParseFile(${literal},[ref]$tokens,[ref]$parseErrors);if($parseErrors.Count){[Console]::Error.WriteLine(($parseErrors.Message -join '; '));exit 1};[Console]::Write('PARSE_OK')`;
    const output = execFileSync(
      resolveOrderDatePowerShell(),
      ["-NoProfile", "-NonInteractive", "-Command", command],
      {
        windowsHide: true,
        encoding: "utf8",
        timeout: 15000,
      },
    );
    assert.equal(output, "PARSE_OK");
  },
);

test("JavaScript and SQL-script guards accept the same old and shortened package school names", () => {
  const source = readFileSync(new URL("./set-test-order-date.ps1", import.meta.url), "utf8");
  const match = source.match(/\$SchoolName -cnotmatch '([^']+)'/);
  assert.ok(match);
  const guard = new RegExp(match[1]);
  for (const name of [
    own.schoolName,
    "AUTO_CAT_D_P26_82b4294ac316",
    "AUTO_CAT_D_P26_03b6522da1a7",
    "AUTO_CAT_T_P26_82b4294ac316",
    "AUTO_CAT_D_EU_82b4294ac316",
    "Szkoła podstawowa",
    own.schoolName + "x",
    "AUTO_CAT_D_P26_82b4294ac316_extra",
  ])
    assert.equal(guard.test(name), isPackageOrderSchool(name), name);
  assert.equal((source.match(/UPDATE dbo\.SchoolOrder SET CreatedAt/g) ?? []).length, 1);
});

test("data zamówienia: panel bez PATH znajduje Windows PowerShell po pełnej ścieżce", () => {
  const system = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
  assert.equal(
    resolveOrderDatePowerShell({ SystemRoot: "C:\\Windows", PATH: "" }, (p) => p === system),
    system,
  );
  assert.throws(
    () => resolveOrderDatePowerShell({ SystemRoot: "C:\\Windows" }, () => false),
    /Nie znaleziono PowerShella/,
  );
});

test("data zamówienia: zainstalowany PowerShell 7 ma pierwszeństwo", () => {
  const modern = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
  assert.equal(
    resolveOrderDatePowerShell(
      { ProgramFiles: "C:\\Program Files", SystemRoot: "C:\\Windows" },
      () => true,
    ),
    modern,
  );
});

test(
  "data zamówienia: rzeczywisty PowerShell uruchamia się bez PATH, bez połączenia z bazą",
  { skip: process.platform !== "win32" },
  () => {
    const executable = resolveOrderDatePowerShell();
    const result = execFileSync(
      executable,
      ["-NoProfile", "-NonInteractive", "-Command", "[Console]::Write('POWERSHELL_OK')"],
      {
        env: { ...process.env, PATH: "" },
        windowsHide: true,
        encoding: "utf8",
        timeout: 15000,
      },
    );
    assert.equal(result, "POWERSHELL_OK");
  },
);
test("data zamówienia: odrzuca obce szkoły, inne środowisko i nieprawidłowe identyfikatory", () => {
  validateTestOrderDate(own);
  const key = "ENT_UNMARKED_SP_400_SECOND_POTW26_abcdef123456_P0_W0";
  validateTestOrderDate({ ...own, schoolName: automaticCategorySchoolName(key, "dev") });
  assert.throws(() =>
    validateTestOrderDate({ ...own, schoolName: automaticCategorySchoolName(key, "test") }),
  );
  assert.throws(() =>
    validateTestOrderDate({
      ...own,
      schoolName: automaticCategorySchoolName("ENT_UNMARKED_PRIMARY_W0", "dev"),
    }),
  );
  for (const schoolName of [
    "Szkoła podstawowa",
    own.schoolName.replace("DEV", "TEST"),
    own.schoolName.replace("POTW26", "COPY"),
    own.schoolName + "x",
  ])
    assert.throws(() => validateTestOrderDate({ ...own, schoolName }));
  for (const orderId of ["0", "-1", "1; DELETE SchoolOrder", "1.5"])
    assert.throws(() => validateTestOrderDate({ ...own, orderId }));
});
test("data zamówienia: przyjmuje dni graniczne i odrzuca nieistniejące daty", () => {
  for (const date of ["2024-04-30", "2024-05-01", "2025-04-30", "2025-05-01", "2028-02-29"])
    validateTestOrderDate({ ...own, date });
  for (const date of ["2026-02-29", "2026-13-01", "2026-05-01T12:00:00Z", "today"])
    assert.throws(() => validateTestOrderDate({ ...own, date }));
});

test("NCL-04 dates accept only its own DEV namespace and require the matching purpose", () => {
  const name = automaticCategorySchoolName("ENT_UNMARKED_PROMO_NCL_04_PRIMARY_W0", "dev");
  assert.match(name, /^AUTO_CAT_D_NCL4_/);
  validateTestOrderDate({ ...own, schoolName: name, purpose: "new-client-history" });
  assert.throws(() => validateTestOrderDate({ ...own, schoolName: name }));
  assert.throws(() => validateTestOrderDate({ ...own, purpose: "new-client-history" }));
  for (const schoolName of [
    automaticCategorySchoolName("ENT_UNMARKED_PROMO_NCL_04_PRIMARY_W0", "test"),
    automaticCategorySchoolName("ENT_UNMARKED_PROMO_NCL_05_PRIMARY_W0", "dev"),
    name + "x",
  ])
    assert.throws(() =>
      validateTestOrderDate({ ...own, schoolName, purpose: "new-client-history" }),
    );
  const source = readFileSync(new URL("./set-test-order-date.ps1", import.meta.url), "utf8");
  const guards = [...source.matchAll(/\$SchoolName -cnotmatch '([^']+)'/g)].map(
    (m) => new RegExp(m[1]),
  );
  assert.equal(guards.length, 2);
  assert.equal(guards[0].test(name), false);
  assert.equal(guards[1].test(name), true);
});
