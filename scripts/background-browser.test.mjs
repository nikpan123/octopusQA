import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { launchBackgroundBrowser } from "./background-browser.mjs";

const run = promisify(execFile);

test("zwykłe przygotowanie pozostaje headless i zamyka własną przeglądarkę", async () => {
  let closed = false;
  const previous = process.env.PWDEBUG;
  process.env.PWDEBUG = "0";
  try {
    const result = await launchBackgroundBrowser({
      async launch(options) {
        assert.deepEqual(options, { headless: true });
        return {
          async close() {
            closed = true;
          },
        };
      },
    });
    await result.close();
    assert.equal(closed, true);
  } finally {
    if (previous === undefined) delete process.env.PWDEBUG;
    else process.env.PWDEBUG = previous;
  }
});

for (const failure of [false, true]) {
  test(`PWDEBUG=1: przygotowanie bez Inspektora i postojów F10, sprzątanie ${failure ? "po błędzie" : "po sukcesie"}`, async () => {
    // A separate client must load Playwright with PWDEBUG=1, just like --debug.
    // The test only opens local data URLs, without DEV or any credentials.
    const script = `
      import assert from 'node:assert/strict';
      import {chromium} from 'playwright-core';
      import {launchBackgroundBrowser} from './scripts/background-browser.mjs';
      const setup = await launchBackgroundBrowser(chromium);
      let page;
      try {
        const context = await setup.browser.newContext();
        page = await context.newPage();
        await page.goto('data:text/html,<input><button>Gotowe</button>');
        await page.locator('input').fill('przygotowanie');
        await page.locator('button').click();
        assert.equal(await page.locator('input').inputValue(), 'przygotowanie');
        const cdp = await setup.browser.newBrowserCDPSession();
        const version = await cdp.send('Browser.getVersion');
        assert.match(version.userAgent, /HeadlessChrome/);
        const targets = await cdp.send('Target.getTargets');
        assert.equal(targets.targetInfos.some(target => /playwright.*inspector|recorder/i.test(target.url)), false);
        assert.equal(context.pages().length, 1);
        if (${failure}) throw new Error('controlled failure');
      } catch(error) {
        if (!${failure} || error.message !== 'controlled failure') throw error;
      } finally { await setup.close(); }
      assert.equal(page.isClosed(), true);
      assert.equal(setup.browser.isConnected(), false);
      console.log('HIDDEN_PREPARATION_OK');
    `;
    const result = await run(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, PWDEBUG: "1" },
      windowsHide: true,
      timeout: 45000,
      maxBuffer: 128 * 1024,
    });
    assert.match(result.stdout, /HIDDEN_PREPARATION_OK/);
  });
}
