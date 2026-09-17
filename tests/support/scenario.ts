import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { test as base, expect } from './fixtures';
import { Octopus } from './octopus';

type Scenario = {
  app: Octopus;
  id: string;
  schoolName: string;
  email: string;
  record: (key: string, value: string) => Promise<void>;
  createSchool: () => Promise<string>;
  createTeacher: (schoolId: string) => Promise<string>;
};

export const test = base.extend<{ scenario: Scenario }>({
  scenario: async ({ page }, use, testInfo) => {
    const app = new Octopus(page);
    const id = `REG_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const schoolName = `${id} Szkoła testowa`;
    const email = `${id.toLowerCase()}@example.invalid`;
    const data: Record<string, string> = { id, schoolName, email, title: testInfo.title, result: 'RUNNING' };
    await mkdir('runs', { recursive: true });
    const save = () => writeFile(`runs/${id}.json`, JSON.stringify(data, null, 2));
    const record = async (key: string, value: string) => { data[key] = value; await save(); };
    await save();
    try {
      await use({
        app, id, schoolName, email, record,
        createSchool: async () => {
          const schoolId = await app.createSchool(schoolName, String(Date.now()));
          await record('schoolId', schoolId);
          await app.markTestRecord();
          return schoolId;
        },
        createTeacher: async schoolId => {
          const teacherId = await app.createTeacher(id, email, schoolId, schoolName);
          await record('teacherId', teacherId);
          await app.markTestRecord();
          return teacherId;
        },
      });
    } finally {
      // Przy błędzie po zapisie zachowaj adres także wtedy, gdy asercja
      // przerwała helper przed zwróceniem ID.
      const current = page.url();
      if (/^https:\/\/octopus\.gwodev\.pl\/(teacher|school)\//.test(current)) data.lastUrl = current;
      data.result = testInfo.status === 'passed' ? 'PASS' : String(testInfo.status).toUpperCase();
      data.finishedAt = new Date().toISOString();
      await save();
      await testInfo.attach('Dane scenariusza', { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
    }
  },
});
export { expect };
