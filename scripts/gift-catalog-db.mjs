import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { validateDbConfiguration, validateSqlId } from "./school-order-db.mjs";
import { resolveOrderDatePowerShell } from "./test-order-date.mjs";

export async function readGiftCatalogDatabase(giftId) {
  const envFile = fileURLToPath(new URL("../.env", import.meta.url));
  if (existsSync(envFile)) loadEnvFile(envFile);
  validateDbConfiguration();
  const args = [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
    fileURLToPath(new URL("./read-gift-catalog.ps1", import.meta.url)),
    "-Action",
    giftId === undefined ? "Probe" : "Read",
  ];
  if (giftId !== undefined) args.push("-GiftId", String(validateSqlId(giftId)));
  let result;
  try {
    const { stdout } = await promisify(execFile)(resolveOrderDatePowerShell(), args, {
      windowsHide: true,
      timeout: 25000,
      maxBuffer: 1024 * 1024,
      encoding: "utf8",
    });
    result = JSON.parse(stdout.replace(/^\uFEFF/, "").trim());
  } catch {
    throw new Error(
      "[TEST_PRECONDITION] Nie udało się odczytać katalogu gratisów z bazy DEV. Sprawdź lokalną konfigurację SQL, VPN i uprawnienia SELECT.",
    );
  }
  if (result.database !== "GWO_CRMDEV" || !Array.isArray(result.rows))
    throw new Error("Nieprawidłowa odpowiedź odczytu bazy katalogu gratisów.");
  return result.rows;
}
