import { test, expect, chromium, type Page } from "@playwright/test";
import { backgroundSchoolSetup } from "../tests/support/background-school-setup";
import { OCTOPUS_BASE_URL } from "../tests/support/environment";
import { restoreSession } from "./auth.mjs";

function mockSource(options: { failContext?: boolean; failPage?: boolean } = {}) {
  const events: string[] = [];
  const setupPage = { identity: "hidden" };
  const state = { cookies: [], origins: [] };
  const browser = {
    async newContext(args: unknown) {
      expect(args).toEqual({ storageState: state });
      events.push("newContext");
      if (options.failContext) throw Error("context failed");
      return {
        async addInitScript() {
          events.push("restoreSession");
        },
        async newPage() {
          events.push("hiddenPage");
          if (options.failPage) throw Error("page failed");
          return setupPage;
        },
      };
    },
    async close() {
      events.push("close");
    },
  };
  const source = {
    url: () => `${OCTOPUS_BASE_URL}/school/school-panel/1`,
    async evaluate() {
      return {};
    },
    context: () => ({
      async storageState() {
        return state;
      },
      browser: () => ({
        browserType: () => ({
          name: () => "mock",
          async launch(args: unknown) {
            expect(args).toEqual({ headless: true });
            events.push("launchHeadless");
            return browser;
          },
        }),
      }),
    }),
  } as unknown as Page;
  return { source, setupPage, events };
}

test("przygotowanie nie otwiera kart w widocznej przeglądarce i zwraca wynik", async () => {
  const { source, setupPage, events } = mockSource();
  const result = await backgroundSchoolSetup(source, async (app) => {
    expect(app.page).toBe(setupPage);
    return "school-id";
  });
  expect(result).toBe("school-id");
  expect(events).toEqual(["launchHeadless", "newContext", "restoreSession", "hiddenPage", "close"]);
});

test("błąd przygotowania zamyka ukrytą przeglądarkę", async () => {
  const { source, events } = mockSource();
  await expect(
    backgroundSchoolSetup(source, async () => {
      throw Error("setup failed");
    }),
  ).rejects.toThrow("setup failed");
  expect(events.at(-1)).toBe("close");
});

for (const failure of ["failContext", "failPage"] as const) {
  test(`błąd ${failure} nie pozostawia dodatkowego procesu`, async () => {
    const { source, events } = mockSource({ [failure]: true });
    await expect(backgroundSchoolSetup(source, async () => "unused")).rejects.toThrow();
    expect(events.at(-1)).toBe("close");
  });
}

test("obca strona nie może być źródłem sesji przygotowania", async () => {
  const { source, events } = mockSource();
  source.url = () => "https://example.org/";
  await expect(backgroundSchoolSetup(source, async () => "unused")).rejects.toThrow("obcej strony");
  expect(events).toEqual([]);
});

test("przygotowanie używa sesji kontekstu bez evaluate na widocznej karcie", async () => {
  const { source, setupPage } = mockSource();
  const context = source.context();
  context.addInitScript = async () => {};
  source.context = () => context;
  source.evaluate = async () => {
    throw new Error("Widoczna karta nie może wykonać evaluate przygotowania");
  };
  await restoreSession(context, { origin: OCTOPUS_BASE_URL, values: { marker: "source-account" } });
  const result = await backgroundSchoolSetup(source, async (app) => {
    expect(app.page).toBe(setupPage);
    return "ready";
  });
  expect(result).toBe("ready");
});

test("prawdziwa ukryta przeglądarka działa lokalnie i zamyka kartę po przygotowaniu", async () => {
  // Źródło nie otwiera żadnej karty. Nie korzystamy z DEV ani prawdziwego konta.
  const source = {
    url: () => `${OCTOPUS_BASE_URL}/school/school-panel/1`,
    async evaluate() {
      return {};
    },
    context: () => ({
      async storageState() {
        return { cookies: [], origins: [] };
      },
      browser: () => ({
        browserType: () => ({ name: () => "mock", launch: chromium.launch.bind(chromium) }),
      }),
    }),
  } as unknown as Page;
  let hidden: Page | undefined;
  const result = await backgroundSchoolSetup(source, async (app) => {
    hidden = app.page;
    await app.page.goto("data:text/html,<h1>Fixture ready</h1>");
    return app.page.locator("h1").textContent();
  });
  expect(result).toBe("Fixture ready");
  expect(hidden?.isClosed()).toBe(true);
});
