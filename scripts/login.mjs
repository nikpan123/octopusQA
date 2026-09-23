import { chromium } from "@playwright/test";
import { mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const authDir = path.join(root, "playwright", ".auth");
const origin = "https://octopus.gwodev.pl";
const browser = await chromium.launch({ headless: false });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  console.log("Zaloguj się samodzielnie do GitLaba i Octopusa w otwartym oknie. Masz 10 minut.");
  console.log("Sesja zostanie zapisana lokalnie dopiero po rozpoznaniu panelu Octopusa.");
  await page.goto(`${origin}/login?returnUrl=%2Fteacher%2Fteacher-panel`);
  await page.waitForURL(
    (url) => url.origin === origin && /^\/(teacher|school)\//.test(url.pathname),
    { timeout: 600_000 },
  );
  await page
    .getByRole("button", { name: "Wyloguj", exact: true })
    .waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: "Szukaj", exact: true }).waitFor({ state: "visible" });
  await mkdir(authDir, { recursive: true });
  const state = await context.storageState({ indexedDB: true });
  // Tylko stan Octopusa; nie utrwalamy sesji samego GitLaba.
  state.cookies = state.cookies.filter(
    (c) =>
      c.domain.replace(/^\./, "") === "octopus.gwodev.pl" ||
      c.domain.replace(/^\./, "") === "gwodev.pl",
  );
  state.origins = state.origins.filter((o) => o.origin === origin);
  const sessionStorage = await page.evaluate(() =>
    Object.fromEntries(Object.entries(window.sessionStorage)),
  );
  await writeFile(
    path.join(authDir, "session.json.tmp"),
    JSON.stringify({ origin, values: sessionStorage }),
    { mode: 0o600 },
  );
  await writeFile(path.join(authDir, "user.json.tmp"), JSON.stringify(state), { mode: 0o600 });
  await rename(path.join(authDir, "session.json.tmp"), path.join(authDir, "session.json"));
  await rename(path.join(authDir, "user.json.tmp"), path.join(authDir, "user.json"));
  console.log("Sesja zapisana. Uruchom: npm.cmd run test:headed");
} catch (error) {
  console.error("Nie zapisano nowej sesji. Zaloguj się ponownie poleceniem npm.cmd run login.");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
