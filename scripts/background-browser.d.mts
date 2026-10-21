import type { Browser, BrowserType } from "@playwright/test";
export function launchBackgroundBrowser(type: BrowserType): Promise<{
  browser: Browser;
  close(): Promise<void>;
}>;
