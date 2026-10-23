import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { isPackageOrderSchool } from "./test-names.mjs";
import { validateDbConfiguration, validateSqlId } from "./school-order-db.mjs";
import { resolveOrderDatePowerShell } from "./test-order-date.mjs";

export function validateGiftRecalculation(input) {
  if (!["School", "Form"].includes(input.action))
    throw new Error("Nieobsługiwane przeliczenie gratisów.");
  if (!isPackageOrderSchool(input.schoolName))
    throw new Error("Przeliczenie wymaga własnej szkoły pakietu POTW26.");
  for (const key of ["schoolId", "userId", "teacherId"]) validateSqlId(input[key]);
  validateSqlId(input.action === "School" ? input.orderId : input.formId);
}

export async function recalculateTestGifts(input) {
  validateGiftRecalculation(input);
  loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
  validateDbConfiguration();
  const args = [
    "-NoProfile",
    "-NonInteractive",
    "-File",
    fileURLToPath(new URL("./recalculate-test-gifts.ps1", import.meta.url)),
  ];
  for (const key of [
    "action",
    "schoolId",
    "schoolName",
    "userId",
    "teacherId",
    input.action === "School" ? "orderId" : "formId",
  ])
    args.push(`-${key}`, String(input[key]));
  let saved;
  try {
    const { stdout } = await promisify(execFile)(resolveOrderDatePowerShell(), args, {
      windowsHide: true,
      timeout: 60000,
      maxBuffer: 100000,
      encoding: "utf8",
    });
    saved = JSON.parse(stdout.replace(/^\uFEFF/, "").trim());
  } catch {
    throw new Error(
      `[TEST_PRECONDITION] Nie udało się wykonać przeliczenia ${input.action} własnych danych POTW26 w bazie DEV. Sprawdź konfigurację i uprawnienia EXECUTE; nie potwierdzono stanu gratisów.`,
    );
  }
  if (
    saved.database !== "GWO_CRMDEV" ||
    saved.action !== input.action ||
    saved.schoolId !== Number(input.schoolId) ||
    saved.teacherId !== Number(input.teacherId) ||
    saved.targetId !== Number(input.action === "School" ? input.orderId : input.formId)
  )
    throw new Error("Baza nie potwierdziła przeliczenia wskazanej szkoły lub formularza.");
  return saved;
}
