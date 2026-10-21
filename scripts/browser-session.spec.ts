import { test, expect, chromium, type Page } from "@playwright/test";
import { browserSessionState, rememberBrowserSession } from "../tests/support/browser-session";
import { liveOctopusHeaders } from "../tests/support/live-auth";
import { OCTOPUS_BASE_URL } from "../tests/support/environment";

test("pusta karta korzysta z zarejestrowanej sesji, bez odczytów przeglądarki", async () => {
  const context = {
    storageState() {
      throw new Error("Nie wolno tworzyć kart odczytu sesji");
    },
  };
  const page = { url: () => "about:blank", context: () => context } as unknown as Page;
  const state = {
    cookies: [],
    origins: [{ origin: OCTOPUS_BASE_URL, localStorage: [{ name: "token", value: "initial" }] }],
  };
  rememberBrowserSession(page.context(), state);
  state.origins[0].localStorage[0].value = "external mutation";
  const result = await browserSessionState(page);
  expect(result.origins[0].localStorage[0].value).toBe("initial");
  result.origins[0].localStorage[0].value = "caller mutation";
  expect((await browserSessionState(page)).origins[0].localStorage[0].value).toBe("initial");
});

test("aktualny JWT przez CDP bez evaluate i bez kart dla obcych originów", async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: OCTOPUS_BASE_URL,
            localStorage: [
              { name: "token", value: '"first"' },
              { name: "id", value: "42" },
            ],
          },
          {
            origin: "https://other-session.test",
            localStorage: [{ name: "unused", value: "value" }],
          },
        ],
      },
    });
    const page = await context.newPage();
    await page.route("**/*", (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>Offline</h1>" }),
    );
    await page.goto(OCTOPUS_BASE_URL);
    await page.evaluate(() => localStorage.setItem("token", '"refreshed"'));
    let extraPages = 0;
    context.on("page", () => extraPages++);
    context.storageState = async () => {
      throw new Error("storageState nie może być użyte");
    };
    page.evaluate = async () => {
      throw new Error("evaluate nie może zatrzymywać Inspektora");
    };
    const state = await browserSessionState(page);
    expect(state.origins).toHaveLength(1);
    expect(state.origins[0].localStorage).toContainEqual({ name: "token", value: '"refreshed"' });
    expect(await liveOctopusHeaders(page)).toEqual({ Authorization: "Bearer refreshed" });
    expect(extraPages).toBe(0);
    expect(context.pages()).toHaveLength(1);
  } finally {
    await browser.close();
  }
});

test("obcy profil nie udostępnia tokenu przygotowania", async () => {
  const page = { url: () => "https://other-session.test", context: () => ({}) } as unknown as Page;
  await expect(browserSessionState(page)).rejects.toThrow("obcej strony");
});
