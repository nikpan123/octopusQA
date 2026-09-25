import http from 'node:http';
import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const uiDir = path.join(root, 'test-ui');
const runsDir = path.join(root, 'runs');
const historyFile = path.join(runsDir, 'test-ui-history.json');
const reportsDir = path.join(runsDir, 'html-reports');

const PORT = Number(process.env.OCTOPUS_TEST_UI_PORT || 4173);

const SUITES = {
  all: { label: 'Cała regresja', files: [] },
  teachers: {
    label: 'Nauczyciele',
    files: [
      'tests/nauczyciel-dodawanie.spec.ts',
      'tests/nauczyciel-edycja.spec.ts',
      'tests/nauczyciel-rozszerzenie.spec.ts',
    ],
  },
  schools: {
    label: 'Szkoły',
    files: [
      'tests/szkola-dodawanie.spec.ts',
      'tests/szkola-edycja.spec.ts',
      'tests/szkola-nauczyciel.spec.ts',
      'tests/walidacja-anulowanie.spec.ts',
    ],
  },
  orders: {
    label: 'Zamówienia',
    files: ['tests/zamowienia-szkoly.spec.ts'],
  },
  clubs: {
    label: 'Klubowiczostwo',
    files: ['tests/klubowiczostwo-nauczyciela.spec.ts'],
  },
  medals: {
    label: 'Medalowość',
    files: ['tests/szkola-medalowosc.spec.ts'],
  },
};

const state = {
  child: null,
  run: null,
  clients: new Set(),
  logLines: [],
  cachedTests: new Map(),
};

function configForEnvironment(environment) {
  return environment === 'test' ? 'playwright.test.config.ts' : 'playwright.config.ts';
}

function playwrightCliPath() {
  const candidates = [
    path.join(root, 'node_modules', '@playwright', 'test', 'cli.js'),
    path.join(root, 'node_modules', 'playwright', 'cli.js'),
  ];

  const cli = candidates.find((candidate) => existsSync(candidate));
  if (!cli) {
    throw new Error(
      'Nie znaleziono lokalnego Playwrighta w node_modules. Uruchom npm install w katalogu projektu.',
    );
  }

  return cli;
}

function spawnPlaywright(args, options = {}) {
  return spawn(process.execPath, [playwrightCliPath(), ...args], options);
}

function stripAnsi(value) {
  return value.replace(/\x1B\[[0-?]*[ -\/]*[@-~]/g, '');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }[ext] || 'application/octet-stream';
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readJsonBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('Request body too large');
  }
  return raw ? JSON.parse(raw) : {};
}

function emit(event, payload) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of state.clients) client.write(data);
}

function pushLog(text, stream = 'stdout') {
  const clean = stripAnsi(text).replace(/\r/g, '');
  const lines = clean.split('\n').filter((line) => line.length > 0);
  for (const line of lines) {
    state.logLines.push({ at: Date.now(), stream, line });
    if (state.logLines.length > 2000) state.logLines.shift();
    parseProgressLine(line);
    emit('log', { stream, line });
  }
}

function parseProgressLine(line) {
  if (!state.run) return;
  const trimmed = line.trim();

  if (/^ok\s+\d+\s+\[/.test(trimmed) || /^✓/.test(trimmed)) {
    state.run.counts.passed += 1;
  } else if (/^x\s+\d+\s+\[/.test(trimmed) || /^✘/.test(trimmed)) {
    state.run.counts.failed += 1;
    const id = extractTestId(trimmed);
    if (id && !state.run.failedTestIds.includes(id)) state.run.failedTestIds.push(id);
  } else if (/^-\s+\d+\s+\[/.test(trimmed)) {
    state.run.counts.skipped += 1;
  }

  const summaryPassed = trimmed.match(/^(\d+) passed\b/);
  const summaryFailed = trimmed.match(/^(\d+) failed\b/);
  const summarySkipped = trimmed.match(/^(\d+) skipped\b/);
  if (summaryPassed) state.run.counts.passed = Number(summaryPassed[1]);
  if (summaryFailed) state.run.counts.failed = Number(summaryFailed[1]);
  if (summarySkipped) state.run.counts.skipped = Number(summarySkipped[1]);

  emit('status', publicStatus());
}

function extractTestId(text) {
  return text.match(/\b(?:ORD|CLUB|SCH(?:-EDIT)?|MED(?:-YEAR)?|ADD|EDIT|TEA|FIND|REL)-[A-Z0-9-]+\b/)?.[0] || null;
}

function publicStatus() {
  const run = state.run;
  return {
    running: Boolean(state.child),
    run: run
      ? {
          id: run.id,
          startedAt: run.startedAt,
          endedAt: run.endedAt || null,
          status: run.status,
          environment: run.environment,
          suite: run.suite,
          suiteLabel: run.suiteLabel,
          workers: run.workers,
          headed: run.headed,
          grep: run.grep,
          selectedTestIds: run.selectedTestIds,
          counts: run.counts,
          failedTestIds: run.failedTestIds,
          durationMs: run.endedAt ? new Date(run.endedAt) - new Date(run.startedAt) : Date.now() - new Date(run.startedAt),
          performanceFile: run.performanceFile || null,
          reportUrl: run.reportUrl || null,
          reportAvailable: existsSync(path.join(reportsDir, run.id, 'index.html')),
        }
      : null,
  };
}

async function loadHistory() {
  try {
    return JSON.parse(await readFile(historyFile, 'utf8'));
  } catch {
    return [];
  }
}

async function saveHistory(entry) {
  await mkdir(runsDir, { recursive: true });
  const history = await loadHistory();
  const filtered = history.filter((item) => item.id !== entry.id);
  filtered.unshift(entry);
  await writeFile(historyFile, JSON.stringify(filtered.slice(0, 30), null, 2), 'utf8');
}

async function newestPerformanceFile(afterTimestamp = 0) {
  if (!existsSync(runsDir)) return null;
  const names = await readdir(runsDir);
  const candidates = [];
  for (const name of names) {
    if (!/^performance-.*\.json$/i.test(name)) continue;
    const filePath = path.join(runsDir, name);
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat || fileStat.mtimeMs < afterTimestamp - 1000) continue;
    candidates.push({ name, filePath, mtimeMs: fileStat.mtimeMs });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0] || null;
}

async function readPerformance(fileName) {
  if (!fileName) return null;
  const safeName = path.basename(fileName);
  const filePath = path.join(runsDir, safeName);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildRunArguments(options) {
  const environment = options.environment === 'test' ? 'test' : 'dev';
  const config = configForEnvironment(environment);
  const args = ['test', `--config=${config}`];

  if (options.annualMode) {
    args.push('tests/szkola-medalowosc-annual.spec.ts');
    args.push('--workers=1');
    args.push('--grep', options.annualMode);
    if (options.headed) args.push('--headed');
    return { args, environment, suite: 'annual', suiteLabel: options.annualMode, workers: 1 };
  }

  const suite = SUITES[options.suite] ? options.suite : 'all';
  const suiteDef = SUITES[suite];

  if (Array.isArray(options.selectedTestIds) && options.selectedTestIds.length > 0) {
    const safeIds = options.selectedTestIds
      .map(String)
      .filter((id) => !id.startsWith('MED-YEAR-'))
      .slice(0, 100);
    if (safeIds.length) {
      args.push('--grep', `(?:${safeIds.map(escapeRegex).join('|')})`);
    }
  } else {
    if (suiteDef.files.length) args.push(...suiteDef.files);
    if (options.grep && String(options.grep).trim()) args.push('--grep', String(options.grep).trim());
  }

  const requestedWorkers = [1, 2, 4].includes(Number(options.workers))
    ? Number(options.workers)
    : 2;

  const selectedIds = Array.isArray(options.selectedTestIds)
    ? options.selectedTestIds.map(String).filter((id) => !id.startsWith('MED-YEAR-'))
    : [];
  const ordersOnlySelection = selectedIds.length > 0 && selectedIds.every((id) => id.startsWith('ORD-'));

  // ORD-y są skonfigurowane do pracy równoległej, ale dla tego pakietu
  // świadomie ograniczamy wykonanie do maksymalnie 2 workerów. Każdy worker
  // korzysta z osobnej szkoły referencyjnej (TEST_PARALLEL_INDEX), więc nie
  // powinien kolidować z zamówieniami tworzonymi przez drugi worker.
  const workers = suite === 'orders' || ordersOnlySelection
    ? Math.min(requestedWorkers, 2)
    : requestedWorkers;

  args.push(`--workers=${workers}`);
  if (options.headed) args.push('--headed');

  return { args, environment, suite, suiteLabel: suiteDef.label, workers };
}

async function startRun(options) {
  if (state.child) throw new Error('Test run is already in progress');

  const built = buildRunArguments(options);
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const reportDir = path.join(reportsDir, runId);
  await mkdir(reportDir, { recursive: true });

  state.logLines = [];
  state.run = {
    id: runId,
    startedAt,
    endedAt: null,
    status: 'RUNNING',
    environment: built.environment,
    suite: built.suite,
    suiteLabel: built.suiteLabel,
    workers: built.workers || 1,
    headed: Boolean(options.headed),
    grep: options.grep ? String(options.grep) : '',
    selectedTestIds: Array.isArray(options.selectedTestIds) ? options.selectedTestIds : [],
    counts: { passed: 0, failed: 0, skipped: 0 },
    failedTestIds: [],
    performanceFile: null,
    reportUrl: `/report/${runId}/`,
    command: `npx playwright ${built.args.join(' ')}`,
  };

  const env = {
    ...process.env,
    OCTOPUS_ENV: built.environment,
    OCTOPUS_WORKERS: String(state.run.workers),
    PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir,
    ...(options.annualMode ? { OCTOPUS_INCLUDE_ANNUAL: '1' } : {}),
  };

  const child = spawnPlaywright(built.args, {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  state.child = child;
  pushLog(`UI: ${state.run.command}`);
  emit('status', publicStatus());

  child.stdout.on('data', (data) => pushLog(data.toString('utf8'), 'stdout'));
  child.stderr.on('data', (data) => pushLog(data.toString('utf8'), 'stderr'));

  child.on('error', async (error) => {
    pushLog(`UI ERROR: ${error.message}`, 'stderr');
  });

  child.on('close', async (code, signal) => {
    const endedAt = new Date().toISOString();
    state.run.endedAt = endedAt;
    state.run.status = signal ? 'STOPPED' : code === 0 ? 'PASSED' : 'FAILED';

    const perf = await newestPerformanceFile(new Date(startedAt).getTime());
    if (perf) state.run.performanceFile = perf.name;

    const historyEntry = {
      ...state.run,
      durationMs: new Date(endedAt) - new Date(startedAt),
      reportUrl: state.run.reportUrl,
      reportAvailable: existsSync(path.join(reportDir, 'index.html')),
    };

    await saveHistory(historyEntry).catch((error) => pushLog(`UI: nie udało się zapisać historii: ${error.message}`, 'stderr'));
    state.child = null;
    emit('status', publicStatus());
    emit('finished', historyEntry);
  });

  return publicStatus();
}

async function stopRun() {
  if (!state.child) return false;
  const pid = state.child.pid;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
  } else {
    state.child.kill('SIGTERM');
  }
  return true;
}

function parseListOutput(output) {
  const tests = [];
  const seen = new Set();
  for (const raw of stripAnsi(output).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.includes('›')) continue;
    const match = line.match(/^\[[^\]]+\]\s*[›>]\s+(.+?):(\d+):(\d+)\s*[›>]\s+(.+)$/);
    if (!match) continue;
    const [, file, lineNo, columnNo, title] = match;
    const id = extractTestId(title) || title;
    const key = `${file}:${lineNo}:${title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tests.push({
      id,
      title,
      file: file.replace(/\\/g, '/'),
      line: Number(lineNo),
      column: Number(columnNo),
      annual: /\bMED-YEAR-/.test(title) || /@annual-medal\b/.test(title),
    });
  }
  return tests;
}

async function listTests(environment) {
  const env = environment === 'test' ? 'test' : 'dev';
  const cached = state.cachedTests.get(env);
  if (cached && Date.now() - cached.at < 60_000) return cached.tests;

  const args = ['test', '--list', `--config=${configForEnvironment(env)}`];
  const result = await new Promise((resolve, reject) => {
    const child = spawnPlaywright(args, {
      cwd: root,
      env: { ...process.env, OCTOPUS_ENV: env },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => (stdout += data.toString('utf8')));
    child.stderr.on('data', (data) => (stderr += data.toString('utf8')));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout || `playwright --list exited with ${code}`));
    });
  });

  const tests = parseListOutput(result);
  state.cachedTests.set(env, { at: Date.now(), tests });
  return tests;
}

async function serveFile(res, baseDir, relativePath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relativePath || 'index.html');
  if (!target.startsWith(base + path.sep) && target !== base) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  let filePath = target;
  const fileStat = await stat(filePath).catch(() => null);
  if (fileStat?.isDirectory()) filePath = path.join(filePath, 'index.html');
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const finalStat = await stat(filePath);
  res.writeHead(200, {
    'Content-Type': mimeFor(filePath),
    'Content-Length': finalStat.size,
    'Cache-Control': 'no-cache',
  });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

    if (url.pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`event: status\ndata: ${JSON.stringify(publicStatus())}\n\n`);
      for (const entry of state.logLines.slice(-300)) {
        res.write(`event: log\ndata: ${JSON.stringify(entry)}\n\n`);
      }
      state.clients.add(res);
      req.on('close', () => state.clients.delete(res));
      return;
    }

    if (url.pathname === '/api/status' && req.method === 'GET') {
      sendJson(res, 200, publicStatus());
      return;
    }

    if (url.pathname === '/api/tests' && req.method === 'GET') {
      const environment = url.searchParams.get('environment') === 'test' ? 'test' : 'dev';
      const tests = await listTests(environment);
      sendJson(res, 200, { tests });
      return;
    }

    if (url.pathname === '/api/run' && req.method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(res, 200, await startRun(body));
      return;
    }

    if (url.pathname === '/api/stop' && req.method === 'POST') {
      sendJson(res, 200, { stopped: await stopRun() });
      return;
    }

    if (url.pathname === '/api/history' && req.method === 'GET') {
      sendJson(res, 200, { history: await loadHistory() });
      return;
    }

    if (url.pathname === '/api/performance/latest' && req.method === 'GET') {
      const fileName = state.run?.performanceFile || (await newestPerformanceFile())?.name || null;
      sendJson(res, 200, { fileName, data: await readPerformance(fileName) });
      return;
    }

    if (url.pathname === '/api/rerun-failed' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const history = await loadHistory();
      const source = body.runId ? history.find((item) => item.id === body.runId) : history[0];
      if (!source?.failedTestIds?.length) {
        sendJson(res, 400, { error: 'Brak zapisanych failed testów do ponownego uruchomienia.' });
        return;
      }
      sendJson(
        res,
        200,
        await startRun({
          environment: source.environment,
          workers: source.workers,
          headed: Boolean(body.headed ?? source.headed),
          suite: source.suite || 'all',
          selectedTestIds: source.failedTestIds,
        }),
      );
      return;
    }

    if (url.pathname.startsWith('/report/')) {
      const relative = decodeURIComponent(url.pathname.replace(/^\/report\//, ''));
      const [runId, ...rest] = relative.split('/');

      if (!runId || !/^[0-9a-f-]+$/i.test(runId)) {
        res.writeHead(404);
        res.end('Brak lub niepoprawne ID przebiegu');
        return;
      }

      const runReportDir = path.join(reportsDir, runId);
      const reportFile = rest.length && rest.join('/') ? rest.join('/') : 'index.html';
      await serveFile(res, runReportDir, reportFile);
      return;
    }

    const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    await serveFile(res, uiDir, relative);
  } catch (error) {
    sendJson(res, 500, { error: error?.message || String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`Octopus Test Runner UI: ${url}`);
  if (process.env.OCTOPUS_TEST_UI_NO_OPEN !== '1') {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  }
});
