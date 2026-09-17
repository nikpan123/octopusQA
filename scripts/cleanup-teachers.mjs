import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { ensureSession, restoreSession } from './auth.mjs';

const origin = 'https://octopus.gwodev.pl';

export function validateTeacherRun(run) {
  if (run.result !== 'PASS') throw new Error('Sprzątanie wymaga wyniku PASS.');
  if (!/^[1-9]\d*$/.test(run.teacherId ?? '') || !Number.isSafeInteger(Number(run.teacherId))) throw new Error('Niepoprawne ID nauczyciela.');
  const runId = run.runId ?? run.id;
  if (!/^REG_\d+_[a-f0-9]{6}$/.test(runId ?? '') || run.email !== `${runId.toLowerCase()}@example.invalid`) {
    throw new Error('Brak jednoznacznych danych własnego nauczyciela testowego.');
  }
}

// Żądania wykonujemy w zalogowanej przeglądarce; token nie opuszcza strony.
async function api(page, pathname, method = 'GET', params = {}) {
  if (new URL(page.url()).origin !== origin) throw new Error('Sprzątanie dostępne tylko na Octopus dev.');
  return page.evaluate(async ({ pathname, method, params }) => {
    if (location.origin !== 'https://octopus.gwodev.pl') throw new Error('Nieoczekiwana zmiana środowiska.');
    const userId = localStorage.getItem('id');
    let token = localStorage.getItem('token');
    try { token = JSON.parse(token); } catch { /* token bywa zwykłym tekstem */ }
    if (!token || !/^[1-9]\d*$/.test(userId ?? '')) throw new Error('Brak aktualnej sesji sprzątania.');
    const url = new URL(pathname, location.origin);
    if (method === 'DELETE') params.userId = userId;
    url.search = new URLSearchParams(params).toString();
    const response = await fetch(url, {
      method, headers: { Authorization: `Bearer ${token}` }, redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    let data = null;
    if (response.status !== 204) { try { data = await response.json(); } catch { /* odrzucone poniżej */ } }
    return { status: response.status, data };
  }, { pathname, method, params });
}

export async function deleteTestTeacher(page, run) {
  validateTeacherRun(run);
  const endpoint = `/api/Teacher/${run.teacherId}`;
  const before = await api(page, endpoint);
  if (before.status === 204) return 'ALREADY_ABSENT';
  if (before.status !== 200 || String(before.data?.id) !== run.teacherId || before.data?.email !== run.email) {
    throw new Error('Dane nauczyciela nie zgadzają się z rejestrem; nie wykonano DELETE.');
  }
  const tested = await api(page, '/api/Teacher/GetTeacherIsTested', 'GET', { teacherId: run.teacherId });
  if (tested.status !== 200 || tested.data !== true) throw new Error('Nauczyciel nie ma flagi Testowy; nie wykonano DELETE.');
  const result = await api(page, '/api/DeleteRecordsDB/DeleteRecordsFromDB', 'DELETE', {
    jsonData: JSON.stringify([{ nauczycielId: Number(run.teacherId) }]),
  });
  // HTTP 200 nie dowodzi sukcesu operacji biznesowej. Potwierdzamy brak rekordu.
  if (result.status < 200 || result.status >= 300) throw new Error(`Usuwanie zwróciło HTTP ${result.status}; sprawdź stan rekordu.`);
  const after = await api(page, endpoint);
  if (after.status !== 204) throw new Error('Nie potwierdzono usunięcia nauczyciela; sprawdź stan rekordu.');
  return 'DELETED';
}

export async function cleanupSuccessfulTeacher(page, run, save) {
  if (!run.teacherId) return;
  if (run.result !== 'PASS') { run.cleanupStatus = 'KEPT_FAILED_TEST'; await save(); return; }
  run.cleanupStatus = 'RUNNING';
  await save();
  try {
    run.cleanupStatus = await deleteTestTeacher(page, run);
    run.cleanupFinishedAt = new Date().toISOString();
    await save();
  } catch (error) {
    run.cleanupStatus = 'FAILED';
    await save();
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const files = args.filter(a => a !== '--apply');
  if (files.some(f => !/^REG_\d+_[a-f0-9]{6}\.json$/.test(f))) throw new Error('Podaj wyłącznie nazwy rejestrów REG_…json z folderu runs.');
  if (apply && !files.length) throw new Error('--apply wymaga jawnej listy rejestrów.');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = path.join(root, 'runs');
  const names = files.length ? [...new Set(files)] : (await readdir(dir)).filter(f => /^REG_\d+_[a-f0-9]{6}\.json$/.test(f));
  const selected = [];
  for (const name of names) {
    const run = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
    if (!run.teacherId || ['DELETED', 'ALREADY_ABSENT'].includes(run.cleanupStatus)) continue;
    try { validateTeacherRun(run); }
    catch (error) { if (files.length) throw error; continue; }
    selected.push({ name, run });
  }
  console.table(selected.map(({name,run}) => ({rejestr:name,teacherId:run.teacherId,wynik:run.result})));
  if (!apply) { console.log('PODGLĄD lokalny. Usunięcie: npm.cmd run cleanup:teachers -- REG_…json --apply'); return; }
  if (!selected.length) return;
  const auth = await ensureSession();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({storageState:auth.storageState});
    await restoreSession(context, auth.session);
    const page = await context.newPage();
    await page.goto(`${origin}/teacher/teacher-panel`);
    await page.getByRole('button', {name:'Wyloguj',exact:true}).waitFor();
    for (const {name,run} of selected) {
      await cleanupSuccessfulTeacher(page, run, () => writeFile(path.join(dir,name),JSON.stringify(run,null,2)));
      console.log(`${run.teacherId}: ${run.cleanupStatus}`);
    }
  } finally { await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error(error.message);process.exitCode=1;});
}
