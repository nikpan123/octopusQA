import type { Page, BrowserContext, APIRequestContext } from "@playwright/test";
import { FixtureSchoolsApi } from "../../scripts/fixture-schools.mjs";
import { OCTOPUS_BASE_URL } from "./environment";
import { browserSessionState } from "./browser-session";

export function fixtureSchoolsFromState(
  request: APIRequestContext,
  state: Awaited<ReturnType<BrowserContext["storageState"]>>,
): FixtureSchoolsApi {
  const storage = state.origins.find((item) => item.origin === OCTOPUS_BASE_URL)?.localStorage;
  const value = (name: string) => {
    const raw = storage?.find((item) => item.name === name)?.value;
    if (!raw) throw new Error(`Brak ${name} w sesji przygotowania danych.`);
    try {
      return JSON.parse(raw) as string;
    } catch {
      return raw;
    }
  };
  const token = value("token");
  const userId = Number(value("id"));
  if (
    typeof token !== "string" ||
    /[\r\n]/.test(token) ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  )
    throw new Error("Niepoprawna sesja przygotowania danych.");
  return new FixtureSchoolsApi(request, {
    baseURL: OCTOPUS_BASE_URL,
    headers: { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}` },
    userId,
  });
}

export async function fixtureSchools(page: Page): Promise<FixtureSchoolsApi> {
  const context = page.context();
  // Karta może być ponownie użyta z odświeżoną sesją. Nie cache'ujemy tokenu po kontekście.
  return fixtureSchoolsFromState(context.request, await browserSessionState(page));
}
