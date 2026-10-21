import type { Page } from "@playwright/test";
import { readStoredSession, restoreSession, restoredSessionFor } from "../../scripts/auth.mjs";
import { OCTOPUS_BASE_URL } from "./environment";
import { Octopus } from "./octopus";
import { launchBackgroundBrowser } from "../../scripts/background-browser.mjs";
import { browserSessionState, rememberBrowserSession } from "./browser-session";

// Tylko przygotowanie danych. Nigdy nie używać do właściwych kroków/asercji UI testu.
export async function backgroundSchoolSetup<T>(source: Page, work: (app: Octopus) => Promise<T>) {
  const state = await browserSessionState(source);
  const type = source.context().browser()?.browserType();
  if (!type) throw new Error("Brak typu przeglądarki dla przygotowania szkół.");
  let session;
  const restored = restoredSessionFor(source.context());
  if (
    restored &&
    (source.url() === "about:blank" || new URL(source.url()).origin === OCTOPUS_BASE_URL)
  ) {
    // Nie odczytujemy sessionStorage przez evaluate() na widocznej karcie:
    // Inspektor zatrzymywałby się na każdym takim przygotowaniu.
    if (restored.origin !== OCTOPUS_BASE_URL) throw new Error("Obca sesja przygotowania szkół.");
    session = restored;
  } else if (new URL(source.url()).origin === OCTOPUS_BASE_URL) {
    session = {
      origin: OCTOPUS_BASE_URL,
      values: await source.evaluate(() => Object.fromEntries(Object.entries(sessionStorage))),
    };
  } else if (source.url() === "about:blank") {
    const stored = readStoredSession();
    const token = (value: typeof state) =>
      value.origins
        .find((item) => item.origin === OCTOPUS_BASE_URL)
        ?.localStorage.find((item) => item.name === "token")?.value;
    if (!token(state) || token(state) !== token(stored.storageState))
      throw new Error("Nie łączymy sesji różnych kont podczas przygotowania szkół.");
    session = stored.session;
  } else {
    throw new Error("Przygotowanie szkół wymaga sesji Octopusa, nie obcej strony.");
  }
  const setup = await launchBackgroundBrowser(type);
  try {
    const context = await setup.browser.newContext({ storageState: state });
    rememberBrowserSession(context, state);
    await restoreSession(context, session);
    return await work(new Octopus(await context.newPage()));
  } finally {
    await setup.close();
  }
}
