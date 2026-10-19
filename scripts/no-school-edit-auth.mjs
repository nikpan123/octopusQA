import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { fork } from "node:child_process";
import { authenticate } from "./auth.mjs";

/** Osobna sesja w pamięci: nigdy nie nadpisuje głównego user.json/session.json. */
async function authenticateNoSchoolEdit() {
  if ((process.env.OCTOPUS_ENV ?? "dev") !== "dev")
    throw new Error("ORD-COPY-19: skonfigurowano konto bez School.EDIT wyłącznie dla DEV.");
  const envFile = fileURLToPath(new URL("../.env", import.meta.url));
  if (existsSync(envFile)) loadEnvFile(envFile);
  const username = process.env.OCTOPUS_DEV_NO_SCHOOL_EDIT_USERNAME?.trim();
  const password = process.env.OCTOPUS_DEV_NO_SCHOOL_EDIT_PASSWORD;
  if (!username || !password)
    throw new Error(
      "ORD-COPY-19: uzupełnij OCTOPUS_DEV_NO_SCHOOL_EDIT_USERNAME i OCTOPUS_DEV_NO_SCHOOL_EDIT_PASSWORD w .env. Nie używamy konta głównego jako zastępstwa.",
    );
  if (
    username.toLowerCase() ===
    (process.env.OCTOPUS_DEV_USERNAME ?? process.env.OCTOPUS_USERNAME ?? "").toLowerCase()
  )
    throw new Error("ORD-COPY-19 wymaga konta innego niż główne konto przygotowania danych.");
  if (!process.env.GITLAB_USERNAME || !process.env.GITLAB_PASSWORD)
    throw new Error("Brak danych bramki GitLab w .env.");
  // Logowanie poza kontekstem raportowanego testu: hasło nie trafia do trace.
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    const postStatuses = [];
    page.on("response", (response) => {
      if (
        response.request().method() === "POST" &&
        new URL(response.url()).origin === "https://octopus.gwodev.pl"
      )
        postStatuses.push(response.status());
    });
    try {
      await authenticate(page, {
        GITLAB_USERNAME: process.env.GITLAB_USERNAME,
        GITLAB_PASSWORD: process.env.GITLAB_PASSWORD,
        OCTOPUS_USERNAME: username,
        OCTOPUS_PASSWORD: password,
      });
    } catch {
      const url = new URL(page.url());
      throw new Error(
        `ORD-COPY-19: logowanie osobnego konta nie powiodło się na ${url.origin}${url.pathname}. Statusy POST Octopusa: ${postStatuses.join(", ") || "brak"}. Nie ponawiamy automatycznie próby ani nie wypisujemy hasła.`,
      );
    }
    const raw = await page.evaluate(() => localStorage.getItem("token"));
    let token = raw;
    try {
      token = JSON.parse(raw);
    } catch {
      /* Token bez JSON. */
    }
    if (typeof token !== "string") throw new Error("Brak tokenu osobnego konta.");
    let identity;
    try {
      identity = JSON.parse(
        Buffer.from(token.replace(/^Bearer\s+/i, "").split(".")[1], "base64url").toString("utf8"),
      );
    } catch {
      throw new Error("Nie można sprawdzić tożsamości osobnego konta.");
    }
    if (!Number.isSafeInteger(Number(identity.userId)) || Number(identity.userId) <= 0)
      throw new Error("Token nie potwierdza poprawnego ID osobnego konta.");
    const response = await context.request.get(
      `https://octopus.gwodev.pl/api/User/${Number(identity.userId)}`,
      { headers: { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}` } },
    );
    if (!response.ok())
      throw new Error(
        `Nie można potwierdzić tożsamości osobnego konta: HTTP ${response.status()}.`,
      );
    const user = await response.json();
    // Formularz Octopusa dopuszcza login LUB e-mail; JWT zawiera login.
    const identifiers = [identity.login, user.login, user.email]
      .filter((value) => typeof value === "string")
      .map((value) => value.trim().toLowerCase());
    if (
      Number(user.id) !== Number(identity.userId) ||
      !identifiers.includes(username.toLowerCase())
    )
      throw new Error(
        "Dane serwerowe konta nie odpowiadają skonfigurowanemu loginowi lub e-mailowi.",
      );
    return {
      userId: Number(identity.userId),
      storageState: await context.storageState(),
      session: {
        origin: "https://octopus.gwodev.pl",
        values: await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage))),
      },
    };
  } finally {
    await browser.close();
  }
}

// Osobny proces nie dziedziczy instrumentacji, storageState ani trace fixture
// Playwrighta. Hasło pozostaje w procesie logowania; sesja wraca tylko przez IPC.
export async function noSchoolEditSession() {
  return new Promise((resolve, reject) => {
    const worker = fork(fileURLToPath(import.meta.url), ["--restricted-worker"], {
      env: { ...process.env, PWDEBUG: "0" },
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    let settled = false;
    worker.on("message", (message) => {
      if (settled) return;
      settled = true;
      if (message.error) reject(new Error(message.error));
      else resolve(message.session);
    });
    worker.on("error", () => {
      if (!settled) {
        settled = true;
        reject(new Error("Nie można uruchomić odizolowanego logowania konta ograniczonego."));
      }
    });
    worker.on("exit", () => {
      if (!settled) {
        settled = true;
        reject(new Error("Logowanie konta ograniczonego zakończyło się bez potwierdzonej sesji."));
      }
    });
  });
}

if (process.argv.includes("--restricted-worker")) {
  try {
    process.send?.({ session: await authenticateNoSchoolEdit() });
  } catch (error) {
    process.send?.({ error: error.message });
  } finally {
    process.disconnect?.();
  }
}
