import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const envFile = fileURLToPath(new URL("../.env", import.meta.url));
const script = fileURLToPath(new URL("./read-school-order.ps1", import.meta.url));

export function validateDbConfiguration(env = process.env) {
  if ((env.OCTOPUS_ENV ?? "dev") !== "dev" || env.OCTOPUS_DEV_DB_NAME !== "GWO_CRMDEV")
    throw new Error("Odczyt SQL testu dozwolony wyłącznie dla DEV / GWO_CRMDEV.");
  for (const key of ["OCTOPUS_DEV_DB_SERVER", "OCTOPUS_DEV_DB_USER", "OCTOPUS_DEV_DB_PASSWORD"])
    if (!env[key]) throw new Error(`Uzupełnij ${key} lokalnie w .env. Nie podawaj hasła w czacie.`);
  const port = Number(env.OCTOPUS_DEV_DB_PORT || 1433);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Niepoprawny port SQL Server.");
}

export function validateSqlId(value) {
  if (
    !/^[1-9]\d*$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  )
    throw new Error("Odczyt zamówienia wymaga dodatniego liczbowego ID dokumentu i szkoły.");
  return Number(value);
}

function sqlRead(action, ids = []) {
  if (existsSync(envFile)) loadEnvFile(envFile);
  validateDbConfiguration();
  const args = [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
    script,
    "-Action",
    action,
    ...ids,
  ];
  return new Promise((resolve, reject) =>
    execFile(
      "powershell.exe",
      args,
      {
        env: process.env,
        windowsHide: true,
        timeout: 25000,
        maxBuffer: 1024 * 1024,
        encoding: "utf8",
      },
      (error, stdout) => {
        let result;
        try {
          result = JSON.parse(stdout.replace(/^\uFEFF/, "").trim());
        } catch {
          /* Brak bezpiecznego wyniku SQL. */
        }
        if (error || result?.error || !result) {
          const kind = result?.error?.kind;
          const hints = {
            certificate:
              "Nie można zweryfikować certyfikatu SQL Server. Nie wyłączam weryfikacji automatycznie; sprawdź certyfikat z administratorem.",
            authentication:
              "SQL Server odrzucił logowanie lub dostęp do bazy. Sprawdź lokalne dane i uprawnienia SELECT.",
            database_guard: "Blokada: odczyt dozwolony wyłącznie dla GWO_CRMDEV.",
            configuration: "Niepełna lub niepoprawna konfiguracja SQL w .env.",
          };
          reject(
            new Error(
              hints[kind] ||
                "Nie udało się odczytać SQL Server. Sprawdź połączenie/VPN, port i dostęp konta do bazy. Dane logowania nie zostały wypisane.",
            ),
          );
          return;
        }
        if (result.database !== "GWO_CRMDEV") {
          reject(new Error("Odpowiedź pochodzi z niewłaściwej bazy."));
          return;
        }
        resolve(result);
      },
    ),
  );
}

export async function probeSchoolOrderDatabase() {
  const result = await sqlRead("Probe");
  if (
    !Array.isArray(result.columns) ||
    !["Id", "SchoolId", "IsDel", "IsCopied"].every((name) =>
      result.columns.some((column) => column.name === name),
    )
  )
    throw new Error(
      "Brak tabeli dbo.SchoolOrder lub wymaganych kolumn Id, SchoolId, IsDel, IsCopied (albo uprawnień do odczytu).",
    );
  return result;
}

export async function findHistoricalOrders(requireHistory = false) {
  const result = await sqlRead(requireHistory ? "FindHistoricalWithHistory" : "FindHistorical");
  if (!Array.isArray(result.rows) || result.rows.length > 10)
    throw new Error("Niepoprawna lista kandydatów historycznych.");
  return result.rows;
}

export async function findStatusAudit() {
  const result = await sqlRead("FindStatusAudit");
  if (!Array.isArray(result.rows) || result.rows.length > 10)
    throw new Error("Niepoprawny wynik audytu.");
  return result.rows;
}

export async function readHistoricalOrder(orderId, schoolId) {
  const order = validateSqlId(orderId),
    school = validateSqlId(schoolId);
  const result = await sqlRead("ReadHistorical", [
    "-OrderId",
    String(order),
    "-SchoolId",
    String(school),
  ]);
  if (!Array.isArray(result.rows) || result.rows.length !== 1)
    throw new Error("Brak wskazanego dokumentu historycznego.");
  const row = result.rows[0];
  if (
    row.id !== order ||
    row.schoolId !== school ||
    typeof row.isCanceled !== "boolean" ||
    typeof row.isDel !== "boolean"
  )
    throw new Error("Wynik SQL nie odpowiada wskazanemu dokumentowi.");
  return row;
}

export async function readSchoolOrder(orderId, schoolId) {
  const order = validateSqlId(orderId);
  const school = validateSqlId(schoolId);
  const result = await sqlRead("ReadOrder", [
    "-OrderId",
    String(order),
    "-SchoolId",
    String(school),
  ]);
  if (!Array.isArray(result.rows) || result.rows.length > 1)
    throw new Error("Niepoprawny wynik odczytu jednego zamówienia.");
  for (const row of result.rows)
    if (
      row.id !== order ||
      row.schoolId !== school ||
      typeof row.isDel !== "boolean" ||
      typeof row.isCopied !== "boolean"
    )
      throw new Error("Wynik SQL nie odpowiada wskazanemu dokumentowi i szkole.");
  return result.rows[0] ?? null;
}
