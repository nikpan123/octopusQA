import { chromium } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const environment = process.env.OCTOPUS_ENV ?? "dev";

if (environment !== "dev" && environment !== "test") {
  throw new Error(
    `Nieobsługiwane OCTOPUS_ENV="${environment}". ` +
      "Dozwolone wartości: dev, test.",
  );
}

const environments = {
  dev: {
    name: "DEV",
    origin: "https://octopus.gwodev.pl",
  },

  test: {
    name: "TEST",
    origin: "https://octopus.gwotest.pl",
  },
};

const config = environments[environment];

const origin = config.origin;

const gitlabOrigin = "https://gitlab.gwo.pl";

const panel = `${origin}/teacher/teacher-panel`;

const octopusHost = new URL(origin).hostname;

const octopusBaseDomain = octopusHost.split(".").slice(-2).join(".");

// Każde środowisko ma własną sesję:
//
// playwright/.auth/dev/
// playwright/.auth/test/
const authDir = path.join(root, "playwright", ".auth", environment);

function credentials() {
  const envFile = path.join(root, ".env");

  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }

  const octopusUsernameVariable =
    environment === "test" ? "OCTOPUS_TEST_USERNAME" : "OCTOPUS_DEV_USERNAME";

  const octopusPasswordVariable =
    environment === "test" ? "OCTOPUS_TEST_PASSWORD" : "OCTOPUS_DEV_PASSWORD";

  const requiredVariables = [
    "GITLAB_USERNAME",
    "GITLAB_PASSWORD",
    octopusUsernameVariable,
    octopusPasswordVariable,
  ];

  const missing = requiredVariables.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(
      `Brak wymaganych danych w .env dla środowiska ${config.name}: ` +
        `${missing.join(", ")}.`,
    );
  }

  return {
    GITLAB_USERNAME: process.env.GITLAB_USERNAME,

    GITLAB_PASSWORD: process.env.GITLAB_PASSWORD,

    OCTOPUS_USERNAME: process.env[octopusUsernameVariable],

    OCTOPUS_PASSWORD: process.env[octopusPasswordVariable],
  };
}

export async function restoreSession(context, session) {
  await context.addInitScript(({ origin: sessionOrigin, values }) => {
    if (window.location.origin === sessionOrigin) {
      for (const [key, value] of Object.entries(values)) {
        window.sessionStorage.setItem(key, String(value));
      }
    }
  }, session);
}

async function ready(page, timeout = 30_000) {
  await page.waitForURL(
    (url) =>
      url.origin === origin && /^\/(teacher|school)\//.test(url.pathname),
    {
      timeout,
    },
  );

  await page
    .getByRole("button", {
      name: "Wyloguj",
      exact: true,
    })
    .waitFor({
      timeout,
    });

  await page
    .getByRole("button", {
      name: "Szukaj",
      exact: true,
    })
    .waitFor({
      timeout,
    });
}

// Dane wpisujemy wyłącznie na dwóch jawnie
// dozwolonych hostach HTTPS.
//
// Brak ponowień logowania:
// błędne hasło nie powoduje serii prób.
export async function authenticate(page, secrets) {
  await page.goto(panel);

  await page.waitForURL(
    (url) =>
      (url.origin === gitlabOrigin && url.pathname === "/users/sign_in") ||
      (url.origin === origin && url.pathname === "/login"),
    {
      timeout: 30_000,
    },
  );

  if (new URL(page.url()).origin === gitlabOrigin) {
    console.log(`Logowanie ${config.name}: formularz GitLaba.`);

    await page.locator("#user_login").fill(secrets.GITLAB_USERNAME);

    await page.locator("#user_password").fill(secrets.GITLAB_PASSWORD);

    await page
      .getByRole("button", {
        name: "Sign in",
        exact: true,
      })
      .click();

    await page.waitForURL(
      (url) => url.origin === origin && url.pathname === "/login",
      {
        timeout: 30_000,
      },
    );
  }

  if (new URL(page.url()).origin !== origin) {
    throw new Error(`Nieoczekiwany adres formularza Octopusa: ${page.url()}`);
  }

  console.log(`Logowanie ${config.name}: formularz Octopusa.`);

  await page.locator("#login").fill(secrets.OCTOPUS_USERNAME);

  await page.locator("#password").fill(secrets.OCTOPUS_PASSWORD);

  await page
    .getByRole("button", {
      name: "Zaloguj",
      exact: true,
    })
    .click();

  await ready(page);
}

async function capture(context, page) {
  const storageState = await context.storageState({
    indexedDB: true,
  });

  storageState.cookies = storageState.cookies.filter((cookie) => {
    const domain = cookie.domain.replace(/^\./, "");

    return domain === octopusHost || domain === octopusBaseDomain;
  });

  storageState.origins = storageState.origins.filter(
    (item) => item.origin === origin,
  );

  const session = {
    origin,

    values: await page.evaluate(() =>
      Object.fromEntries(Object.entries(window.sessionStorage)),
    ),
  };

  await mkdir(authDir, {
    recursive: true,
  });

  const files = [
    ["session.json", session],
    ["user.json", storageState],
  ];

  for (const [name, data] of files) {
    const target = path.join(authDir, name);

    const temporary = `${target}.tmp`;

    await writeFile(temporary, JSON.stringify(data), {
      mode: 0o600,
    });

    await rename(temporary, target);
  }

  return {
    storageState,
    session,
  };
}

export async function ensureSession({ force = false } = {}) {
  console.log(`Logowanie: środowisko ${config.name} → ${origin}`);

  const runId = process.env.OCTOPUS_AUTH_RUN_ID;

  const failureFile =
    runId && /^[a-f0-9-]{36}$/.test(runId)
      ? path.join(authDir, `failed-${runId}.json`)
      : undefined;

  if (failureFile && existsSync(failureFile)) {
    throw new Error(
      `W tym uruchomieniu logowanie do ${config.name} już się nie powiodło. ` +
        "Nie ponawiam próby dla kolejnych testów. " +
        "Sprawdź .env i uruchom zestaw ponownie.",
    );
  }

  // Osobny browser bez trace/screenshots/video,
  // poza raportem właściwego testu.
  const browser = await chromium.launch();

  try {
    const userFile = path.join(authDir, "user.json");

    const sessionFile = path.join(authDir, "session.json");

    if (!force && existsSync(userFile) && existsSync(sessionFile)) {
      let context;

      try {
        context = await browser.newContext({
          storageState: userFile,
        });

        await restoreSession(
          context,
          JSON.parse(readFileSync(sessionFile, "utf8")),
        );

        const page = await context.newPage();

        await page.goto(panel);

        await ready(page, 8_000);

        const result = await capture(context, page);

        console.log(
          `Logowanie ${config.name}: wykorzystano zapisaną sesję Octopusa.`,
        );

        return result;
      } catch {
        console.log(
          `Logowanie ${config.name}: zapisana sesja nie daje dostępu; próba nowego logowania.`,
        );
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

    page.on("response", (response) => {
      if (
        response.request().method() === "POST" &&
        new URL(response.url()).origin === origin
      ) {
        postStatuses.push(response.status());
      }
    });

    try {
      await authenticate(page, secrets);
    } catch {
      // Surowy błąd Playwright fill()
      // może zawierać wpisywaną wartość.
      if (failureFile) {
        await mkdir(authDir, {
          recursive: true,
        });

        await writeFile(failureFile, "{}", {
          mode: 0o600,
        });
      }

      const url = new URL(page.url());

      const diagnostic = postStatuses.length
        ? ` Statusy HTTP POST Octopusa: ${postStatuses.join(", ")}.`
        : "";

      throw new Error(
        `Automatyczne logowanie do ${config.name} nie powiodło się na ` +
          `${url.origin}${url.pathname}.${diagnostic} ` +
          "Sprawdź dane w .env, dostęp do sieci i formularz logowania. " +
          "Nie ponawiam próby.",
      );
    }

    const result = await capture(context, page);

    console.log(
      `Logowanie ${config.name}: zalogowano automatycznie i zapisano nową sesję Octopusa.`,
    );

    return result;
  } finally {
    await browser.close();
  }
}
