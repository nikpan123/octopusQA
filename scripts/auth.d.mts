import type { BrowserContext, Page } from "@playwright/test";
export type AuthSession = {
  storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
  session: { origin: string; values: Record<string, string> };
};
export function restoreSession(
  context: BrowserContext,
  session: AuthSession["session"],
): Promise<void>;
export function authenticate(page: Page, secrets: Record<string, string>): Promise<void>;
export function hasActiveSession(page: Page, timeout?: number): Promise<boolean>;
export function sessionHasMinimumLifetime(
  session: AuthSession,
  minimumLifetimeSeconds?: number,
  nowSeconds?: number,
): boolean;
export function ensureSession(options?: { force?: boolean }): Promise<AuthSession>;
