import { test } from "@playwright/test";

/** Describe shared API preparation and cleanup without changing the operation. */
export async function apiStep<T>(title: string, operation: () => Promise<T>): Promise<T> {
  let insideTest = false;
  try {
    test.info();
    insideTest = true;
  } catch {
    // Shared worker setup can run before Playwright provides a current test.
  }
  if (insideTest) return test.step(title, operation);

  console.info(`[API — przygotowanie współdzielone] START: ${title}`);
  try {
    const result = await operation();
    console.info(`[API — przygotowanie współdzielone] OK: ${title}`);
    return result;
  } catch (error) {
    console.info(`[API — przygotowanie współdzielone] BŁĄD: ${title}`);
    throw error;
  }
}
