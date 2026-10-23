import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateGiftRecalculation } from "./test-gift-recalculation.mjs";
import { resolveOrderDatePowerShell } from "./test-order-date.mjs";

const own = {
  schoolId: "100",
  schoolName: "AUTO_CAT_D_P26_abcdef123456",
  teacherId: "200",
  userId: 300,
};
test("przeliczenie przyjmuje wyłącznie własną szkołę POTW26 i liczbowy dokument lub formularz", () => {
  validateGiftRecalculation({ ...own, action: "School", orderId: "400" });
  validateGiftRecalculation({ ...own, action: "Form", formId: "500" });
  for (const input of [
    { ...own, action: "Other", orderId: "400" },
    { ...own, action: "School", orderId: "1; EXEC other" },
    { ...own, action: "Form", formId: 0 },
    { ...own, action: "Form", formId: "500", schoolName: "Szkoła podstawowa" },
    { ...own, action: "School", orderId: "400", teacherId: "-1" },
  ])
    assert.throws(() => validateGiftRecalculation(input));
});
test(
  "PowerShell przeliczeń jest poprawny składniowo bez wykonywania SQL",
  { skip: process.platform !== "win32" },
  () => {
    const path = fileURLToPath(new URL("./recalculate-test-gifts.ps1", import.meta.url)).replaceAll(
      "'",
      "''",
    );
    const command = `$tokens=$null;$errors=$null;[void][System.Management.Automation.Language.Parser]::ParseFile('${path}',[ref]$tokens,[ref]$errors);if($errors.Count){exit 1};[Console]::Write('OK')`;
    assert.equal(
      execFileSync(
        resolveOrderDatePowerShell(),
        ["-NoProfile", "-NonInteractive", "-Command", command],
        { encoding: "utf8", windowsHide: true },
      ),
      "OK",
    );
  },
);
