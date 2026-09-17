import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authDir = path.join(root, 'playwright', '.auth');
const origin = 'https://octopus.gwodev.pl';
const gitlabOrigin = 'https://gitlab.gwo.pl';
const panel = `${origin}/teacher/teacher-panel`;

function credentials() {
  const envFile = path.join(root, '.env');
  if (existsSync(envFile)) loadEnvFile(envFile);
  const names = ['GITLAB_USERNAME', 'GITLAB_PASSWORD', 'OCTOPUS_USERNAME', 'OCTOPUS_PASSWORD'];
  const missing = names.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Uzupełnij lokalny plik .env: ${missing.join(', ')}. Alternatywnie: npm.cmd run login.`);
  return Object.fromEntries(names.map(name => [name, process.env[name]]));
}

export async function restoreSession(context, session) {
  await context.addInitScript(({ origin, values }) => {
    if (window.location.origin === origin) {
      for (const [key, value] of Object.entries(values)) window.sessionStorage.setItem(key, String(value));
    }
  }, session);
}

async function ready(page, timeout = 30_000) {
  await page.waitForURL(url => url.origin === origin && /^\/(teacher|school)\//.test(url.pathname), { timeout });
  await page.getByRole('button', { name: 'Wyloguj', exact: true }).waitFor({ timeout });
  await page.getByRole('button', { name: 'Szukaj', exact: true }).waitFor({ timeout });
}

// Dane wpisujemy wyłącznie na dwóch jawnie dozwolonych hostach HTTPS.
// Brak ponowień logowania: błędne hasło nie powoduje serii prób.
export async function authenticate(page, secrets) {
  await page.goto(panel);
  await page.waitForURL(url =>
    (url.origin === gitlabOrigin && url.pathname === '/users/sign_in') ||
    (url.origin === origin && url.pathname === '/login'), { timeout: 30_000 });
  if (new URL(page.url()).origin === gitlabOrigin) {
    console.log('Logowanie: formularz GitLaba.');
    await page.locator('#user_login').fill(secrets.GITLAB_USERNAME);
    await page.locator('#user_password').fill(secrets.GITLAB_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(url => url.origin === origin && url.pathname === '/login', { timeout: 30_000 });
  }
  if (new URL(page.url()).origin !== origin) throw new Error('Nieoczekiwany adres formularza Octopusa.');
  console.log('Logowanie: formularz Octopusa.');
  await page.locator('#login').fill(secrets.OCTOPUS_USERNAME);
  await page.locator('#password').fill(secrets.OCTOPUS_PASSWORD);
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click();
  await ready(page);
}

async function capture(context, page) {
  const storageState = await context.storageState({ indexedDB: true });
  storageState.cookies = storageState.cookies.filter(c => ['octopus.gwodev.pl', 'gwodev.pl'].includes(c.domain.replace(/^\./, '')));
  storageState.origins = storageState.origins.filter(o => o.origin === origin);
  const session = { origin, values: await page.evaluate(() => Object.fromEntries(Object.entries(window.sessionStorage))) };
  await mkdir(authDir, { recursive: true });
  for (const [name, data] of [['session.json', session], ['user.json', storageState]]) {
    await writeFile(path.join(authDir, `${name}.tmp`), JSON.stringify(data), { mode: 0o600 });
    await rename(path.join(authDir, `${name}.tmp`), path.join(authDir, name));
  }
  return { storageState, session };
}

export async function ensureSession({ force = false } = {}) {
  const runId = process.env.OCTOPUS_AUTH_RUN_ID;
  const failureFile = runId && /^[a-f0-9-]{36}$/.test(runId)
    ? path.join(authDir, `failed-${runId}.json`) : undefined;
  if (failureFile && existsSync(failureFile)) {
    throw new Error('W tym uruchomieniu logowanie już się nie powiodło. Nie ponawiam próby dla kolejnych testów. Sprawdź .env i uruchom zestaw ponownie.');
  }
  // Osobny kontekst bez trace, screenshots i video, poza raportem testowym.
  const browser = await chromium.launch();
  try {
    const userFile = path.join(authDir, 'user.json');
    const sessionFile = path.join(authDir, 'session.json');
    if (!force && existsSync(userFile) && existsSync(sessionFile)) {
      let context;
      try {
        context = await browser.newContext({ storageState: userFile });
        await restoreSession(context, JSON.parse(readFileSync(sessionFile, 'utf8')));
        const page = await context.newPage();
        await page.goto(panel);
        await ready(page, 8_000);
        const result = await capture(context, page);
        console.log('Logowanie: wykorzystano zapisaną sesję Octopusa.');
        return result;
      } catch {
        console.log('Logowanie: zapisana sesja nie daje dostępu; próba nowego logowania.');
      } finally {
        await context?.close();
      }
    }
    const secrets = credentials();
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(45_000);
    const postStatuses = [];
    page.on('response', response => {
      if (response.request().method() === 'POST' && new URL(response.url()).origin === origin) {
        postStatuses.push(response.status());
      }
    });
    try {
      await authenticate(page, secrets);
    } catch {
      // Surowy błąd Playwright fill() może zawierać wpisywaną wartość.
      if (failureFile) {
        await mkdir(authDir, { recursive: true });
        await writeFile(failureFile, '{}', { mode: 0o600 });
      }
      const url = new URL(page.url());
      const diagnostic = postStatuses.length ? ` Statusy HTTP POST Octopusa: ${postStatuses.join(', ')}.` : '';
      throw new Error(`Automatyczne logowanie nie powiodło się na ${url.origin}${url.pathname}.${diagnostic} Sprawdź dane w .env, dostęp do sieci i formularz logowania. Nie ponawiam próby. Możesz użyć npm.cmd run login.`);
    }
    const result = await capture(context, page);
    console.log('Logowanie: zalogowano automatycznie i zapisano nową sesję Octopusa.');
    return result;
  } finally {
    await browser.close();
  }
}
