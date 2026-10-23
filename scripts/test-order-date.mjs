import { isPackageOrderSchool, isNewClientHistorySchool } from "./test-names.mjs";
import { execFile } from "node:child_process";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import { validateDbConfiguration, validateSqlId } from "./school-order-db.mjs";

export function resolveOrderDatePowerShell(env = process.env, exists = existsSync) {
  const candidates = [
    env.ProgramFiles && path.win32.join(env.ProgramFiles, "PowerShell", "7", "pwsh.exe"),
    (env.SystemRoot || env.WINDIR) &&
      path.win32.join(
        env.SystemRoot || env.WINDIR,
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe",
      ),
  ].filter(Boolean);
  const executable = candidates.find((candidate) => exists(candidate));
  if (!executable)
    throw new Error(
      "Nie znaleziono PowerShella do przygotowania daty zamówienia. Sprawdzono pełne ścieżki PowerShell 7 i Windows PowerShell.",
    );
  return executable;
}

export function validateTestOrderDate(input) {
  for (const key of ["orderId", "schoolId", "userId"]) validateSqlId(input[key]);
  const purpose = input.purpose ?? "potw26";
  if (
    !(purpose === "potw26"
      ? isPackageOrderSchool(input.schoolName)
      : purpose === "new-client-history" && isNewClientHistorySchool(input.schoolName))
  )
    throw new Error(
      "Zmiana daty dotyczy wyłącznie własnej szkoły właściwego pakietu POTW26 lub NCL-04.",
    );
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    new Date(input.date).toISOString().slice(0, 10) !== input.date
  )
    throw new Error("Niepoprawna data zamówienia.");
}

export async function setTestOrderDate(input) {
  validateTestOrderDate(input);
  loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
  validateDbConfiguration();
  const executable = resolveOrderDatePowerShell();
  const args = [
    "-NoProfile",
    "-NonInteractive",
    "-File",
    fileURLToPath(new URL("./set-test-order-date.ps1", import.meta.url)),
  ];
  for (const key of ["OrderId", "SchoolId", "UserId", "SchoolName", "Date"])
    args.push(`-${key}`, String(input[key[0].toLowerCase() + key.slice(1)]));
  args.push("-Purpose", input.purpose ?? "potw26");
  return new Promise((resolve, reject) =>
    execFile(
      executable,
      args,
      { windowsHide: true, env: process.env, timeout: 30000, maxBuffer: 100000, encoding: "utf8" },
      (error, stdout, stderr) => {
        if (error) {
          const diagnostic =
            stderr.match(/POTW26 stage=[a-z-]+; type=[A-Za-z]+; sqlNumber=\d*/)?.[0] ??
            String(error.code);
          return reject(
            new Error(
              "Nie udało się ustawić daty własnego zamówienia testowego w bazie DEV. " + diagnostic,
            ),
          );
        }
        try {
          const saved = JSON.parse(stdout.replace(/^\uFEFF/, "").trim());
          if (
            saved.orderId !== Number(input.orderId) ||
            saved.schoolId !== Number(input.schoolId) ||
            saved.date !== input.date
          )
            throw new Error();
          resolve(saved);
        } catch {
          reject(new Error("Baza nie potwierdziła daty i tożsamości własnego zamówienia."));
        }
      },
    ),
  );
}
