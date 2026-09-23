import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { authenticate, hasActiveSession, restoreSession, sessionHasMinimumLifetime } from './auth.mjs';

const octopus = 'https://octopus.gwodev.pl';
const gitlab = 'https://gitlab.gwo.pl';
const secrets = {
  GITLAB_USERNAME: 'gitlab-test-user', GITLAB_PASSWORD: 'gitlab-test-password',
  OCTOPUS_USERNAME: 'octopus-test-user', OCTOPUS_PASSWORD: 'octopus-test-password',
};

function authSessionExpiringAt(exp) {
  const token = `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;
  return {
    storageState: {
      cookies: [],
      origins: [{ origin: octopus, localStorage: [{ name: 'token', value: JSON.stringify(token) }] }],
    },
    session: { origin: octopus, values: {} },
  };
}

test('lokalna kontrola JWT wymaga bezpiecznego zapasu ważności', () => {
  assert.equal(sessionHasMinimumLifetime(authSessionExpiringAt(1300), 120, 1000), true);
  assert.equal(sessionHasMinimumLifetime(authSessionExpiringAt(1100), 120, 1000), false);
  assert.equal(sessionHasMinimumLifetime({ storageState: { origins: [] } }, 120, 1000), false);
});

for (const withGitlab of [true, false]) {
  test(`logowanie przez przechwycone formularze: GitLab=${withGitlab}`, async () => {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext();
      const submissions = [];
      let signedIn = false;
      // Cała sieć jest przechwycona: żadne fikcyjne hasło nie trafia do serwera.
      await context.route('**/*', async route => {
        const req = route.request();
        const url = new URL(req.url());
        const redirect = location => route.fulfill({ contentType: 'text/html', body: `<script>location.href=${JSON.stringify(location)}</script>` });
        const html = body => route.fulfill({ contentType: 'text/html', body });
        if (req.method() === 'POST') {
          submissions.push({ origin: url.origin, data: Object.fromEntries(new URLSearchParams(req.postData())) });
          if (url.origin === gitlab) return redirect(`${octopus}/login`);
          signedIn = true;
          return redirect(`${octopus}/teacher/teacher-panel`);
        }
        if (url.origin === gitlab) return html('<form method="post"><input id="user_login" name="login"><input id="user_password" name="password" type="password"><button>Sign in</button></form>');
        if (url.pathname === '/login') return html('<form method="post"><input id="login" name="login"><input id="password" name="password" type="password"><button>Zaloguj</button></form>');
        if (!signedIn) return redirect(withGitlab ? `${gitlab}/users/sign_in` : `${octopus}/login`);
        return html('<button>Wyloguj</button><button>Szukaj</button>');
      });
      const page = await context.newPage();
      await authenticate(page, secrets);
      assert.equal(submissions.length, withGitlab ? 2 : 1);
      if (withGitlab) assert.deepEqual(submissions[0], { origin: gitlab, data: { login: secrets.GITLAB_USERNAME, password: secrets.GITLAB_PASSWORD } });
      assert.deepEqual(submissions.at(-1), { origin: octopus, data: { login: secrets.OCTOPUS_USERNAME, password: secrets.OCTOPUS_PASSWORD } });
      assert.equal(page.url(), `${octopus}/teacher/teacher-panel`);
    } finally { await browser.close(); }
  });
}

test('sessionStorage odtwarzany tylko dla Octopusa', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<p>Test</p>' }));
    await restoreSession(context, { origin: octopus, values: { exampleToken: 'fictional' } });
    const page = await context.newPage();
    await page.goto(octopus);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('exampleToken')), 'fictional');
    await page.goto(gitlab);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('exampleToken')), null);
  } finally { await browser.close(); }
});

test('ekran logowania natychmiast oznacza zapisaną sesję jako nieaktualną', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/login') {
        return route.fulfill({ contentType: 'text/html', body: '<h1>Logowanie</h1>' });
      }
      return route.fulfill({
        contentType: 'text/html',
        body: `<script>location.href=${JSON.stringify(`${octopus}/login`)}</script>`,
      });
    });
    const page = await context.newPage();
    const startedAt = Date.now();
    assert.equal(await hasActiveSession(page, 5_000), false);
    assert.ok(Date.now() - startedAt < 2_000, 'Rozpoznanie /login nie powinno czekać na timeout panelu.');
  } finally { await browser.close(); }
});

test('widoczny panel oznacza aktywną zapisaną sesję', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => route.fulfill({
      contentType: 'text/html',
      body: '<button>Wyloguj</button><button>Szukaj</button>',
    }));
    const page = await context.newPage();
    assert.equal(await hasActiveSession(page, 5_000), true);
  } finally { await browser.close(); }
});
