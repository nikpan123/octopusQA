import type { Page } from "@playwright/test";
import { OCTOPUS_BASE_URL } from "./environment";

/** Odczyt w chwili żądania, nie kopia tokenu z początku fixture. */
export async function liveOctopusHeaders(page: Page): Promise<{ Authorization: string }> {
  if (new URL(page.url()).origin !== OCTOPUS_BASE_URL)
    throw new Error("Bieżący token można odczytać wyłącznie z otwartego profilu Octopusa.");
  const raw = await page.evaluate(() => localStorage.getItem("token"));
  if (!raw) throw new Error("Brak tokenu w bieżącej sesji przeglądarki Octopusa.");
  let value: unknown = raw;
  try {
    value = JSON.parse(raw);
  } catch {
    /* Token może być zapisany bez JSON-a. */
  }
  if (typeof value !== "string")
    throw new Error("Nieprawidłowy format tokenu bieżącej sesji Octopusa.");
  const token = value.trim().replace(/^Bearer\s+/i, "");
  if (!token || /[\r\n]/.test(token))
    throw new Error("Nieprawidłowy token bieżącej sesji Octopusa.");
  // Wartość tokenu nie trafia do komunikatów błędów ani rejestru scenariusza.
  return { Authorization: `Bearer ${token}` };
}
