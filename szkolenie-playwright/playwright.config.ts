import { defineConfig, devices } from '@playwright/test';

// Osobna konfiguracja: bez logowania i konfiguracji regresji Octopusa.
export default defineConfig({
  testDir: './tests',
  outputDir: './wyniki',
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { outputFolder: './raport', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:18879',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node serwer.mjs',
    url: 'http://127.0.0.1:18879',
    reuseExistingServer: false,
  },
});
