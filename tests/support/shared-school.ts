import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { test as base, expect } from './scenario';
import { Octopus } from './octopus';
import { restoreSession } from '../../scripts/auth.mjs';

export const test = base.extend<{}, { school: { id: string; name: string } }>({
  school: [async ({ browser, authSession }, use) => {
    const run = `REG_SHARED_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const name = `${run} Szkoła testowa`;
    const context = await browser.newContext({ storageState: authSession.storageState, baseURL: 'https://octopus.gwodev.pl' });
    await restoreSession(context, authSession.session);
    const page = await context.newPage();
    const app = new Octopus(page);
    try {
      const id = await app.createSchool(name, String(Date.now()));
      await mkdir('runs', { recursive: true });
      await writeFile(`runs/${run}.json`, JSON.stringify({ id, name, kind: 'shared-school', createdAt: new Date().toISOString() }, null, 2));
      await app.markTestRecord();
      await use({ id, name });
    } finally { await context.close(); }
  }, { scope: 'worker', timeout: 120_000 }],
});
export { expect };
