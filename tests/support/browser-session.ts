import type { BrowserContext, Page } from "@playwright/test";
import type { AuthSession } from "../../scripts/auth.mjs";
import { OCTOPUS_BASE_URL } from "./environment";

const initialStates = new WeakMap<BrowserContext, AuthSession["storageState"]>();

export function rememberBrowserSession(
  context: BrowserContext,
  state: AuthSession["storageState"],
) {
  initialStates.set(context, structuredClone(state));
}

/** No storageState() on the visible context: it can create temporary tabs for
 * every stored origin that has no currently open page (including GitLab). */
export async function browserSessionState(page: Page): Promise<AuthSession["storageState"]> {
  const context = page.context();
  if (page.url() === "about:blank") {
    const state = initialStates.get(context);
    if (state) return structuredClone(state);
  } else if (new URL(page.url()).origin !== OCTOPUS_BASE_URL) {
    throw new Error("Nie odczytujemy sesji przygotowania z obcej strony.");
  } else if (context.browser()?.browserType().name() === "chromium") {
    // Read current values, not a cached JWT. CDP neither navigates nor creates
    // pages and does not add Inspector evaluate() stops.
    const cdp = await context.newCDPSession(page);
    try {
      const { entries } = await cdp.send("DOMStorage.getDOMStorageItems", {
        storageId: { securityOrigin: OCTOPUS_BASE_URL, isLocalStorage: true },
      });
      return {
        cookies: await context.cookies(),
        origins: [
          {
            origin: OCTOPUS_BASE_URL,
            localStorage: entries.map(([name, value]) => ({ name, value })),
          },
        ],
      };
    } finally {
      await cdp.detach();
    }
  }
  // Compatibility for callers outside the standard fixture / non-Chromium.
  // All current Octopus projects use Chromium and register their initial state.
  return context.storageState();
}
