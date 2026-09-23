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
    `Nieobsługiwane OCTOPUS_ENV="${environment}". ` + "Dozwolone wartości: dev, test.",
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

export function readStoredSession() {
  return {
    storageState: JSON.parse(readFileSync(path.join(authDir, "user.json"), "utf8")),
    session: JSON.parse(readFileSync(path.join(authDir, "session.json"), "utf8")),
  };
}

// Większość testów kończy się w mniej niż minutę. Pięciominutowy zapas
// powodował przy krótkim JWT zbędne logowanie co kilka testów i serię żądań
// do formularza logowania. Odświeżamy dopiero wtedy, gdy do wygaśnięcia
// pozostało mniej niż 90 sekund.
const minimumSessionLifetimeSeconds = 90;

export function sessionHasMinimumLifetime(
  authSession,
  minimumLifetimeSeconds = minimumSessionLifetimeSeconds,
  nowSeconds = Date.now() / 1000,
) {
  const tokenEntry = authSession?.storageState?.origins
    ?.find((item) => item.origin === origin)
    ?.localStorage?.find((item) => item.name === "token");

  if (!tokenEntry?.value) return false;

  try {
    let token = tokenEntry.value;
    try {
      token = JSON.parse(token);
    } catch {
      // Token bywa zapisany bez otaczającego JSON-a.
    }
    const parts = String(token).split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return Number(payload.exp) - nowSeconds > minimumLifetimeSeconds;
  } catch {
    return false;
  }
}

function credentials() {
  const envFile = path.join(root, ".env");

  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }

  const octopusUsernameVariable =
    environment === "test" ? "OCTOPUS_TEST_USERNAME" : "OCTOPUS_DEV_USERNAME";

  const octopusPasswordVariable =
    environment === "test" ? "OCTOPUS_TEST_PASSWORD" : "OCTOPUS_DEV_PASSWORD";

  // Zachowaj zgodność z dotychczasowym .env dla DEV. Zmienne środowiskowe
  // per środowisko mają pierwszeństwo i są wymagane dla TEST.
  const octopusUsername =
    process.env[octopusUsernameVariable] ??
    (environment === "dev" ? process.env.OCTOPUS_USERNAME : undefined);
  const octopusPassword =
    process.env[octopusPasswordVariable] ??
    (environment === "dev" ? process.env.OCTOPUS_PASSWORD : undefined);

  const requiredVariables = [
    "GITLAB_USERNAME",
    "GITLAB_PASSWORD",
    ...(octopusUsername ? [] : [octopusUsernameVariable]),
    ...(octopusPassword ? [] : [octopusPasswordVariable]),
  ];

  const missing = requiredVariables.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(
      `Brak wymaganych danych w .env dla środowiska ${config.name}: ` + `${missing.join(", ")}.`,
    );
  }

  return {
    GITLAB_USERNAME: process.env.GITLAB_USERNAME,

    GITLAB_PASSWORD: process.env.GITLAB_PASSWORD,

    OCTOPUS_USERNAME: octopusUsername,

    OCTOPUS_PASSWORD: octopusPassword,
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
    (url) => url.origin === origin && /^\/(teacher|school)\//.test(url.pathname),
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

function isPanelUrl(url) {
  return url.origin === origin && /^\/(teacher|school)\//.test(url.pathname);
}

function isLoginUrl(url) {
  return (
    (url.origin === origin && url.pathname === "/login") ||
    (url.origin === gitlabOrigin && url.pathname === "/users/sign_in")
  );
}

// Przy nieaktualnej sesji aplikacja szybko przechodzi na ekran logowania.
// Traktujemy ten adres jako gotowy wynik negatywny zamiast czekać, aż
// wygaśnie timeout oczekiwania na panel.
export async function hasActiveSession(page, timeout = 8_000) {
  await page.goto(panel, { waitUntil: "domcontentloaded" });

  await page.waitForURL((url) => isPanelUrl(url) || isLoginUrl(url), {
    timeout,
  });

  if (isLoginUrl(new URL(page.url()))) {
    return false;
  }

  await Promise.all([
    page.getByRole("button", { name: "Wyloguj", exact: true }).waitFor({
      timeout,
    }),
    page.getByRole("button", { name: "Szukaj", exact: true }).waitFor({
      timeout,
    }),
  ]);

  return true;
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

    await page.waitForURL((url) => url.origin === origin && url.pathname === "/login", {
      timeout: 30_000,
    });
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

  storageState.origins = storageState.origins.filter((item) => item.origin === origin);

  const session = {
    origin,

    values: await page.evaluate(() => Object.fromEntries(Object.entries(window.sessionStorage))),
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

    // Równoległe workery mogą odświeżyć tę samą sesję w podobnym czasie.
    // Osobny plik procesu zapobiega kolizji wspólnej nazwy *.tmp.
    const temporary = `${target}.${process.pid}.tmp`;

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
  const runId = process.env.OCTOPUS_AUTH_RUN_ID;

  const failureFile =
    runId && /^[a-f0-9-]{36}$/.test(runId) ? path.join(authDir, `failed-${runId}.json`) : undefined;

  if (failureFile && existsSync(failureFile)) {
    throw new Error(
      `W tym uruchomieniu logowanie do ${config.name} już się nie powiodło. ` +
        "Nie ponawiam próby dla kolejnych testów. " +
        "Sprawdź .env i uruchom zestaw ponownie.",
    );
  }

  const userFile = path.join(authDir, "user.json");
  const sessionFile = path.join(authDir, "session.json");
  let storedSession;

  if (!force && existsSync(userFile) && existsSync(sessionFile)) {
    try {
      storedSession = {
        storageState: JSON.parse(readFileSync(userFile, "utf8")),
        session: JSON.parse(readFileSync(sessionFile, "utf8")),
      };
      if (sessionHasMinimumLifetime(storedSession)) {
        return storedSession;
      }
      console.log(
        `Logowanie ${config.name}: token wkrótce wygaśnie; odświeżam sesję przed testem.`,
      );
      storedSession = undefined;
    } catch {
      storedSession = undefined;
    }
  }

  console.log(`Logowanie: środowisko ${config.name} → ${origin}`);

  // Osobny browser bez trace/screenshots/video,
  // poza raportem właściwego testu.
  const browser = await chromium.launch();

  try {
    if (!force && storedSession) {
      let context;

      try {
        context = await browser.newContext({
          storageState: userFile,
        });

        await restoreSession(context, JSON.parse(readFileSync(sessionFile, "utf8")));

        const page = await context.newPage();

        if (!(await hasActiveSession(page))) {
          throw new Error("Zapisana sesja wygasła.");
        }

        const result = await capture(context, page);

        console.log(`Logowanie ${config.name}: wykorzystano zapisaną sesję Octopusa.`);

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
      if (response.request().method() === "POST" && new URL(response.url()).origin === origin) {
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
