const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  suite: 'all',
  tests: [],
  selected: new Set(),
  status: null,
  timerHandle: null,
  testData: {
    teachers: [],
    schools: [],
  },
  testDataTab: 'teachers',
  selectedTeacherFiles: new Set(),
};

function formatDuration(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('pl-PL');
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeRegexForJs(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setBadge(status, running) {
  const badge = $('#runBadge');
  const value = running ? 'RUNNING' : status || 'IDLE';
  badge.textContent = value;
  badge.className = `badge ${value.toLowerCase()}`;
}

function updateWorkersForSuite(suite) {
  const workers = $('#workers');
  const hint = $('#workersHint');
  const option4 = workers?.querySelector('option[value="4"]');
  const ordersSelected = suite === 'orders';

  workers.disabled = false;

  if (ordersSelected) {
    if (workers.value === '4') workers.value = '2';
    if (option4) option4.disabled = true;

    hint.textContent =
      'Zamówienia mogą działać na 2 workerach. Każdy worker korzysta z osobnej szkoły referencyjnej; dla ORD dostępne są 1 lub 2 workery.';
    hint.hidden = false;
    return;
  }

  if (option4) option4.disabled = false;
  hint.textContent = '';
  hint.hidden = true;
}

function updateTimer(run) {
  clearInterval(state.timerHandle);
  const render = () => {
    if (!run) return ($('#timer').textContent = '00:00');
    const end = run.endedAt ? new Date(run.endedAt).getTime() : Date.now();
    $('#timer').textContent = formatDuration(end - new Date(run.startedAt).getTime());
  };
  render();
  if (run && !run.endedAt) state.timerHandle = setInterval(render, 1000);
}

function renderStatus(payload) {
  state.status = payload;
  const run = payload.run;
  setBadge(run?.status, payload.running);
  $('#startBtn').disabled = payload.running;
  $('#stopBtn').disabled = !payload.running;
  $('#rerunFailedBtn').disabled = payload.running || !(run?.failedTestIds?.length);
  $('#deleteSelectedTeachersBtn').disabled = payload.running || state.selectedTeacherFiles.size === 0;

  $('#passed').textContent = run?.counts?.passed ?? 0;
  $('#failed').textContent = run?.counts?.failed ?? 0;
  $('#expectedFailed').textContent = run?.counts?.expectedFailed ?? 0;
  $('#skipped').textContent = run?.counts?.skipped ?? 0;
  $('#statusDescription').textContent = run
    ? `${run.environment.toUpperCase()} · ${run.suiteLabel || run.suite} · ${run.workers} worker${run.workers === 1 ? '' : 'y'}`
    : 'Brak aktywnego przebiegu.';

  $('#reportBtn').classList.toggle('disabled', !run?.reportAvailable);
  $('#reportBtn').setAttribute('aria-disabled', String(!run?.reportAvailable));
  $('#reportBtn').setAttribute('href', run?.reportUrl || '#');
  updateTimer(run);
}

function appendLog({ line, stream }) {
  const log = $('#log');
  const prefix = stream === 'stderr' ? '[stderr] ' : '';
  log.textContent += `${prefix}${line}\n`;
  if (log.textContent.length > 200_000) log.textContent = log.textContent.slice(-160_000);
  log.scrollTop = log.scrollHeight;
}

function filteredTests() {
  const term = $('#testSearch').value.trim().toLowerCase();
  return state.tests.filter((test) => {
    if (test.annual) return false;
    if (!term) return true;
    return `${test.id} ${test.title} ${test.file}`.toLowerCase().includes(term);
  });
}

function renderTests() {
  const list = $('#testsList');
  const tests = filteredTests();
  $('#testsCount').textContent = `${state.tests.filter((t) => !t.annual).length} testów`;
  $('#selectedCount').textContent = `${state.selected.size} zaznaczonych`;

  if (!tests.length) {
    list.innerHTML = '<div class="empty">Brak pasujących testów.</div>';
    return;
  }

  list.innerHTML = tests
    .map(
      (test) => `
        <label class="test-row">
          <input type="checkbox" data-test-id="${escapeHtml(test.id)}" ${state.selected.has(test.id) ? 'checked' : ''} />
          <span class="test-id">${escapeHtml(test.id)}</span>
          <span class="test-title">${escapeHtml(test.title.replace(new RegExp(`^${escapeRegexForJs(test.id)}:?\\s*`), ''))}</span>
          <span class="test-file">${escapeHtml(test.file.split('/').pop())}</span>
        </label>`,
    )
    .join('');

  $$('[data-test-id]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      checkbox.checked ? state.selected.add(checkbox.dataset.testId) : state.selected.delete(checkbox.dataset.testId);
      $('#selectedCount').textContent = `${state.selected.size} zaznaczonych`;
    });
  });
}

async function loadTests() {
  $('#testsList').innerHTML = '<div class="empty">Pobieranie listy z Playwrighta…</div>';
  try {
    const environment = $('#environment').value;
    const { tests } = await api(`/api/tests?environment=${environment}`);
    state.tests = tests;
    state.selected.clear();
    renderTests();
  } catch (error) {
    $('#testsList').innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function startRun(extra = {}) {
  const payload = {
    environment: $('#environment').value,
    workers: Number($('#workers').value),
    headed: $('#headed').checked,
    suite: state.suite,
    grep: $('#grep').value.trim(),
    selectedTestIds: [...state.selected],
    ...extra,
  };

  if (payload.annualMode) {
    const ok = confirm(`${payload.annualMode} to ciężki, osobny workflow roczny. Uruchomić teraz na ${payload.environment.toUpperCase()}?`);
    if (!ok) return;
    payload.selectedTestIds = [];
    payload.grep = '';
    payload.workers = 1;
  }

  try {
    $('#log').textContent = '';
    const result = await api('/api/run', { method: 'POST', body: JSON.stringify(payload) });
    renderStatus(result);
  } catch (error) {
    alert(error.message);
  }
}

async function stopRun() {
  try {
    await api('/api/stop', { method: 'POST', body: '{}' });
  } catch (error) {
    alert(error.message);
  }
}

async function rerunFailed(runId) {
  try {
    $('#log').textContent = '';
    const result = await api('/api/rerun-failed', {
      method: 'POST',
      body: JSON.stringify({ runId, headed: $('#headed').checked }),
    });
    renderStatus(result);
  } catch (error) {
    alert(error.message);
  }
}

async function loadHistory() {
  const container = $('#history');
  try {
    const { history } = await api('/api/history');
    if (!history.length) {
      container.innerHTML = '<div class="empty">Brak historii.</div>';
      return;
    }
    container.innerHTML = `
      <div class="history-row history-head">
        <span>Data</span><span>Środowisko / pakiet</span><span>Wynik</span><span>Czas</span><span></span>
      </div>
      ${history
        .map(
          (run) => `
          <div class="history-row">
            <span>${escapeHtml(new Date(run.startedAt).toLocaleString('pl-PL'))}</span>
            <span>${escapeHtml(run.environment.toUpperCase())} · ${escapeHtml(run.suiteLabel || run.suite)}</span>
            <span class="history-status ${String(run.status).toLowerCase()}">${escapeHtml(run.status)} · ${run.counts?.passed ?? 0}/${(run.counts?.passed ?? 0) + (run.counts?.failed ?? 0) + (run.counts?.skipped ?? 0)}${(run.counts?.expectedFailed ?? 0) > 0 ? ` · expected fail: ${run.counts.expectedFailed}` : ''}</span>
            <span>${formatDuration(run.durationMs)}</span>
            <span class="history-actions">
              ${run.reportAvailable && run.reportUrl ? `<a class="button-link ghost" href="${escapeHtml(run.reportUrl)}" target="_blank" rel="noopener">Raport</a>` : ''}
              ${run.failedTestIds?.length ? `<button class="ghost rerun-history" data-run-id="${run.id}">Ponów failed</button>` : ''}
            </span>
          </div>`,
        )
        .join('')}`;

    $$('.rerun-history').forEach((button) => button.addEventListener('click', () => rerunFailed(button.dataset.runId)));
  } catch (error) {
    container.innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function showPerformance() {
  try {
    const result = await api('/api/performance/latest');
    $('#performanceFile').textContent = result.fileName || 'Brak pliku performance';
    $('#performanceJson').textContent = result.data ? JSON.stringify(result.data, null, 2) : 'Brak danych.';
    $('#performanceDialog').showModal();
  } catch (error) {
    alert(error.message);
  }
}

function testDataSearchTerm() {
  return $('#testDataSearch').value.trim().toLowerCase();
}

function resultBadge(value) {
  const safe = escapeHtml(value || 'BRAK');
  const css = String(value || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return `<span class="data-badge ${css}">${safe}</span>`;
}

function renderTeachers() {
  const term = testDataSearchTerm();
  const teachers = state.testData.teachers.filter((teacher) => {
    if (!term) return true;
    return `${teacher.id} ${teacher.email} ${teacher.lastName} ${teacher.title} ${teacher.runId} ${teacher.result} ${teacher.cleanupStatus}`
      .toLowerCase()
      .includes(term);
  });

  $('#testDataSummary').textContent = `${state.testData.teachers.length} nauczycieli · ${state.selectedTeacherFiles.size} zaznaczonych`;
  $('#deleteSelectedTeachersBtn').hidden = false;
  $('#deleteSelectedTeachersBtn').disabled = Boolean(state.status?.running) || state.selectedTeacherFiles.size === 0;

  if (!teachers.length) {
    $('#testDataTable').innerHTML = '<div class="empty">Brak nauczycieli pasujących do filtra.</div>';
    return;
  }

  $('#testDataTable').innerHTML = `
    <div class="data-row teacher-row data-head">
      <span></span><span>ID</span><span>Dane nauczyciela</span><span>Test / wynik</span><span>Cleanup</span><span>Akcje</span>
    </div>
    ${teachers
      .map(
        (teacher) => `
        <div class="data-row teacher-row">
          <span>
            <input
              type="checkbox"
              data-teacher-select="${escapeHtml(teacher.fileName)}"
              ${state.selectedTeacherFiles.has(teacher.fileName) ? 'checked' : ''}
              ${teacher.deletable ? '' : 'disabled'}
              title="${escapeHtml(teacher.deleteReason || '')}"
            />
          </span>
          <span class="mono strong">${escapeHtml(teacher.id)}</span>
          <span>
            <strong>${escapeHtml(teacher.lastName || '—')}</strong>
            <small>${escapeHtml(teacher.email || '—')}</small>
            <small>${escapeHtml(teacher.environment.toUpperCase())} · ${escapeHtml(formatDate(teacher.createdAt))}</small>
          </span>
          <span>
            <strong>${escapeHtml(teacher.title || teacher.runId)}</strong>
            <small>${resultBadge(teacher.result)}</small>
          </span>
          <span>
            ${resultBadge(teacher.cleanupStatus)}
            <small>${escapeHtml(teacher.deleteReason || '')}</small>
          </span>
          <span class="data-actions">
            <a class="button-link ghost" href="${escapeHtml(teacher.url)}" target="_blank" rel="noopener">Otwórz</a>
            <button
              class="danger-outline delete-teacher"
              data-teacher-file="${escapeHtml(teacher.fileName)}"
              data-teacher-id="${escapeHtml(teacher.id)}"
              ${teacher.deletable && !state.status?.running ? '' : 'disabled'}
              title="${escapeHtml(teacher.deleteReason || '')}"
            >Usuń</button>
          </span>
        </div>`,
      )
      .join('')}`;

  $$('[data-teacher-select]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      checkbox.checked
        ? state.selectedTeacherFiles.add(checkbox.dataset.teacherSelect)
        : state.selectedTeacherFiles.delete(checkbox.dataset.teacherSelect);
      renderTeachers();
    });
  });

  $$('.delete-teacher').forEach((button) => {
    button.addEventListener('click', () => deleteTeachers([button.dataset.teacherFile], [button.dataset.teacherId]));
  });
}

function renderSchools() {
  const term = testDataSearchTerm();
  const schools = state.testData.schools.filter((school) => {
    if (!term) return true;
    return `${school.id} ${school.name} ${school.title} ${school.runId} ${school.result} ${school.kind}`
      .toLowerCase()
      .includes(term);
  });

  $('#testDataSummary').textContent = `${state.testData.schools.length} szkół zapisanych w rejestrach testów`;
  $('#deleteSelectedTeachersBtn').hidden = true;

  if (!schools.length) {
    $('#testDataTable').innerHTML = '<div class="empty">Brak szkół pasujących do filtra.</div>';
    return;
  }

  $('#testDataTable').innerHTML = `
    <div class="data-row school-row data-head">
      <span>ID</span><span>Nazwa</span><span>Źródło</span><span>Test / wynik</span><span>Wystąpienia</span><span>Akcje</span>
    </div>
    ${schools
      .map(
        (school) => `
        <div class="data-row school-row">
          <span class="mono strong">${escapeHtml(school.id)}</span>
          <span>
            <strong>${escapeHtml(school.name || '—')}</strong>
            <small>${escapeHtml(school.environment.toUpperCase())} · ${escapeHtml(formatDate(school.createdAt))}</small>
          </span>
          <span>${escapeHtml(school.kind || school.source || '—')}</span>
          <span>
            <strong>${escapeHtml(school.title || school.runId)}</strong>
            <small>${resultBadge(school.result)}</small>
          </span>
          <span>${escapeHtml(school.seenIn ?? 1)}</span>
          <span class="data-actions">
            <a class="button-link ghost" href="${escapeHtml(school.url)}" target="_blank" rel="noopener">Otwórz</a>
          </span>
        </div>`,
      )
      .join('')}`;
}

function renderTestData() {
  $$('.test-data-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.testDataTab === state.testDataTab);
  });

  if (state.testDataTab === 'schools') renderSchools();
  else renderTeachers();
}

async function loadTestData() {
  $('#testDataTable').innerHTML = '<div class="empty">Odczytywanie runs/*.json…</div>';
  $('#testDataMessage').textContent = '';

  try {
    const result = await api('/api/test-data');
    state.testData = {
      teachers: result.teachers || [],
      schools: result.schools || [],
    };

    const availableFiles = new Set(state.testData.teachers.filter((item) => item.deletable).map((item) => item.fileName));
    state.selectedTeacherFiles = new Set(
      [...state.selectedTeacherFiles].filter((fileName) => availableFiles.has(fileName)),
    );

    $('#teachersTabCount').textContent = state.testData.teachers.length;
    $('#schoolsTabCount').textContent = state.testData.schools.length;
    renderTestData();
  } catch (error) {
    $('#testDataTable').innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function deleteTeachers(files, teacherIds = []) {
  const cleanFiles = [...new Set(files)].filter(Boolean);
  if (!cleanFiles.length) return;

  const ids = teacherIds.length
    ? teacherIds.join(', ')
    : state.testData.teachers
        .filter((teacher) => cleanFiles.includes(teacher.fileName))
        .map((teacher) => teacher.id)
        .join(', ');

  const confirmed = confirm(
    `Usunąć ${cleanFiles.length === 1 ? 'nauczyciela' : `${cleanFiles.length} nauczycieli`} ${ids ? `(${ids})` : ''}?\n\n` +
      'Przed DELETE cleanup ponownie sprawdzi ID, dane z rejestru i flagę Testowy. Operacja dotyczy wyłącznie DEV.',
  );
  if (!confirmed) return;

  const bulkButton = $('#deleteSelectedTeachersBtn');
  bulkButton.disabled = true;
  $('#testDataMessage').className = 'test-data-message info';
  $('#testDataMessage').textContent = 'Usuwanie nauczycieli… Operacja może potrwać kilkadziesiąt sekund.';

  try {
    const result = await api('/api/test-data/teachers/delete', {
      method: 'POST',
      body: JSON.stringify({ files: cleanFiles }),
    });

    state.testData = result.registry || state.testData;
    state.selectedTeacherFiles.clear();
    $('#teachersTabCount').textContent = state.testData.teachers?.length ?? 0;
    $('#schoolsTabCount').textContent = state.testData.schools?.length ?? 0;
    $('#testDataMessage').className = 'test-data-message success';
    $('#testDataMessage').textContent = 'Cleanup zakończony. Stan rejestrów został odświeżony.';
    renderTestData();
  } catch (error) {
    await loadTestData();
    $('#testDataMessage').className = 'test-data-message error';
    $('#testDataMessage').textContent = error.message;
  }
}

$$('.suite').forEach((button) => {
  button.addEventListener('click', () => {
    $$('.suite').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.suite = button.dataset.suite;
    updateWorkersForSuite(state.suite);
  });
});

$$('.test-data-tab').forEach((button) => {
  button.addEventListener('click', () => {
    state.testDataTab = button.dataset.testDataTab;
    renderTestData();
  });
});

$('#startBtn').addEventListener('click', () => startRun());
$('#stopBtn').addEventListener('click', stopRun);
$('#rerunFailedBtn').addEventListener('click', () => rerunFailed());
$('#refreshTestsBtn').addEventListener('click', loadTests);
$('#clearSelectionBtn').addEventListener('click', () => {
  state.selected.clear();
  renderTests();
});
$('#testSearch').addEventListener('input', renderTests);
$('#environment').addEventListener('change', loadTests);
$('#clearLogBtn').addEventListener('click', () => ($('#log').textContent = ''));
$('#refreshHistoryBtn').addEventListener('click', loadHistory);
$('#performanceBtn').addEventListener('click', showPerformance);
$('#closePerformanceBtn').addEventListener('click', () => $('#performanceDialog').close());
$('#refreshTestDataBtn').addEventListener('click', loadTestData);
$('#testDataSearch').addEventListener('input', renderTestData);
$('#deleteSelectedTeachersBtn').addEventListener('click', () => deleteTeachers([...state.selectedTeacherFiles]));
$$('[data-annual]').forEach((button) => button.addEventListener('click', () => startRun({ annualMode: button.dataset.annual })));
$('#reportBtn').addEventListener('click', (event) => {
  if ($('#reportBtn').classList.contains('disabled')) event.preventDefault();
});

const events = new EventSource('/api/events');
events.addEventListener('log', (event) => appendLog(JSON.parse(event.data)));
events.addEventListener('status', (event) => renderStatus(JSON.parse(event.data)));
events.addEventListener('finished', () => {
  loadHistory();
  loadTestData();
});

updateWorkersForSuite(state.suite);
api('/api/status').then(renderStatus).catch(() => {});
loadTests();
loadTestData();
loadHistory();
