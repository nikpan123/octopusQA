const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const linkedParams = new URLSearchParams(location.search);
const linkedIds = [...new Set(linkedParams.getAll("test"))];
let linkedOnly = linkedIds.length > 0;
let missingLinkedIds = [];

const state = {
  suite: "all",
  tests: [],
  scenarios: [],
  testsLoaded: false,
  scenariosLoaded: false,
  selected: new Set(),
  status: null,
  timerHandle: null,
  testData: {
    teachers: [],
    schools: [],
  },
  testDataTab: "teachers",
  selectedTeacherFiles: new Set(),
};

function formatDuration(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pl-PL");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegexForJs(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setBadge(status, running) {
  const badge = $("#runBadge");
  const value = running ? "RUNNING" : status || "IDLE";
  badge.textContent = value;
  badge.className = `badge ${value.toLowerCase()}`;
}

function updateWorkersForSuite(suite) {
  const workers = $("#workers");
  const hint = $("#workersHint");
  const option4 = workers?.querySelector('option[value="4"]');
  const ordersSelected = suite === "orders";

  workers.disabled = false;

  if (ordersSelected) {
    if (workers.value === "4") workers.value = "2";
    if (option4) option4.disabled = true;

    hint.textContent =
      "Zamówienia mogą działać na 2 workerach. Każdy worker korzysta z osobnej szkoły referencyjnej; dla ORD dostępne są 1 lub 2 workery.";
    hint.hidden = false;
    return;
  }

  if (option4) option4.disabled = false;
  hint.textContent = "";
  hint.hidden = true;
}

function updateTimer(run) {
  clearInterval(state.timerHandle);
  const render = () => {
    if (!run) return ($("#timer").textContent = "00:00");
    const end = run.endedAt ? new Date(run.endedAt).getTime() : Date.now();
    $("#timer").textContent = formatDuration(end - new Date(run.startedAt).getTime());
  };
  render();
  if (run && !run.endedAt) state.timerHandle = setInterval(render, 1000);
}

function renderFailures(failures = [], reportUrl = "#") {
  const container = $("#failureSummary");
  if (!failures.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = `
    <h3>Dlaczego testy się nie powiodły</h3>
    <div class="failure-list">
      ${failures
        .map(
          (failure) => `
            <article class="failure-item">
              <div class="failure-title">
                <span class="failure-category">${escapeHtml(failure.label)}</span>
                <strong>${escapeHtml(failure.id || failure.title)}</strong>
              </div>
              <p>${escapeHtml(failure.summary)}</p>
              ${failure.locator ? `<div class="failure-meta"><span>Lokator</span><code>${escapeHtml(failure.locator)}</code></div>` : ""}
              ${failure.action ? `<div class="failure-meta"><span>Akcja</span><code>${escapeHtml(failure.action)}</code></div>` : ""}
              <div class="failure-hint">${escapeHtml(failure.suggestion)}</div>
              <details>
                <summary>Szczegóły techniczne</summary>
                <pre>${escapeHtml(failure.message || "Brak dodatkowych danych.")}</pre>
              </details>
            </article>`,
        )
        .join("")}
    </div>
    ${reportUrl && reportUrl !== "#" ? `<a class="failure-report-link" href="${escapeHtml(reportUrl)}" target="_blank" rel="noopener">Otwórz pełny raport ze screenshotem i trace</a>` : ""}`;
}

function renderStatus(payload) {
  state.status = payload;
  const run = payload.run;
  setBadge(run?.status, payload.running);
  $("#startBtn").disabled = payload.running;
  $("#debugSelectedBtn").disabled = payload.running || state.selected.size !== 1;
  $("#previewDebugBtn").disabled = payload.running;
  $$("[data-debug-test]").forEach(button => { button.disabled = payload.running; });
  $("#stopBtn").disabled = !payload.running;
  $("#rerunFailedBtn").disabled = payload.running || !run?.failedTestIds?.length;
  $("#deleteSelectedTeachersBtn").disabled =
    payload.running || state.selectedTeacherFiles.size === 0;

  $("#passed").textContent = run?.counts?.passed ?? 0;
  $("#failed").textContent = run?.counts?.failed ?? 0;
  $("#expectedFailed").textContent = run?.counts?.expectedFailed ?? 0;
  $("#skipped").textContent = run?.counts?.skipped ?? 0;
  $("#statusDescription").textContent = run
    ? `${run.environment.toUpperCase()} · ${run.suiteLabel || run.suite} · ${run.workers} worker${run.workers === 1 ? "" : "y"}`
    : "Brak aktywnego przebiegu.";

  $("#reportBtn").classList.toggle("disabled", !run?.reportAvailable);
  $("#reportBtn").setAttribute("aria-disabled", String(!run?.reportAvailable));
  $("#reportBtn").setAttribute("href", run?.reportUrl || "#");
  renderFailures(run?.failures || [], run?.reportUrl);
  updateTimer(run);
  renderDashboard();
}

function renderDashboard() {
  $("#dashboardTests").textContent = state.testsLoaded ? state.tests.filter(test => !test.annual).length : "—";
  $("#dashboardScenarios").textContent = state.scenariosLoaded ? state.scenarios.reduce((count, feature) => count + feature.scenarios.length, 0) : "—";
  $("#dashboardSelected").textContent = state.selected.size;
  $("#dashboardEnvironment").textContent = `Środowisko ${$("#environment").value.toUpperCase()}`;
  const run = state.status?.run;
  $("#dashboardRun").textContent = run
    ? `${state.status.running ? "W toku" : run.status} · ${run.environment.toUpperCase()} · ${run.suiteLabel || run.suite} · passed: ${run.counts?.passed ?? 0}, failed: ${run.counts?.failed ?? 0}, skipped: ${run.counts?.skipped ?? 0}`
    : "Brak przebiegu w bieżącej sesji panelu. Wcześniejsze wyniki znajdziesz w Historii i raportach.";
  $("#runSelectionSummary").textContent = state.selected.size
    ? `Uruchomisz ${state.selected.size} zaznaczonych testów. Zaznaczenie ma pierwszeństwo przed pakietem i polem grep.`
    : "Brak zaznaczenia — uruchomienie obejmie wybrany pakiet z uwzględnieniem pola grep.";
  $("#debugSelectedBtn").disabled = Boolean(state.status?.running) || state.selected.size !== 1;
}

function appendLog({ line, stream }) {
  const log = $("#log");
  const prefix = stream === "stderr" ? "[stderr] " : "";
  log.textContent += `${prefix}${line}\n`;
  if (log.textContent.length > 200_000) log.textContent = log.textContent.slice(-160_000);
  log.scrollTop = log.scrollHeight;
}

function filteredTests() {
  const term = $("#testSearch").value.trim().toLowerCase();
  return state.tests.filter((test) => {
    if (test.annual) return false;
    if (linkedOnly && !linkedIds.includes(test.id)) return false;
    if (!term) return true;
    return `${test.id} ${test.title} ${test.file}`.toLowerCase().includes(term);
  });
}

function renderTests() {
  renderDashboard();
  const list = $("#testsList");
  const tests = filteredTests();
  $("#testsCount").textContent = `${state.tests.filter((t) => !t.annual).length} testów`;
  $("#selectedCount").textContent = `${state.selected.size} zaznaczonych`;

  if (!tests.length) {
    list.innerHTML = '<div class="empty">Brak pasujących testów.</div>';
    return;
  }

  list.innerHTML = tests
    .map(
      (test) => `
        <div class="test-row">
          <input type="checkbox" data-test-id="${escapeHtml(test.id)}" ${state.selected.has(test.id) ? "checked" : ""} />
          <label class="test-id" for="test-select-${escapeHtml(test.id)}">${escapeHtml(test.id)}</label>
          <span class="test-title" title="${escapeHtml(test.title)}">${escapeHtml(test.title.replace(new RegExp(`^${escapeRegexForJs(test.id)}:?\\s*`), ""))}</span>
          <div class="test-row-actions"><button class="ghost" data-preview-test="${escapeHtml(test.id)}">Podgląd wykonania</button><button class="ghost" data-debug-test="${escapeHtml(test.id)}" ${state.status?.running ? "disabled" : ""}>Krok po kroku</button></div>
        </div>`,
    )
    .join("");

  $$("[data-test-id]").forEach((checkbox) => {
    checkbox.id = `test-select-${checkbox.dataset.testId}`;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.selected.add(checkbox.dataset.testId);
      else state.selected.delete(checkbox.dataset.testId);
      $("#selectedCount").textContent = `${state.selected.size} zaznaczonych`;
      renderDashboard();
    });
  });
  $$("[data-preview-test]").forEach(button => button.addEventListener("click", () => showTestPreview(button.dataset.previewTest)));
  $$("[data-debug-test]").forEach(button => button.addEventListener("click", () => debugTest(button.dataset.debugTest)));
}

let previewRequest = 0;
let previewTestId = null;

async function debugTest(id) {
  if (!id || !state.tests.some(test => test.id === id) || state.status?.running) return;
  if (!confirm(`Uruchomić ${id} krok po kroku na ${$("#environment").value.toUpperCase()}? Test ponownie tworzy lub zmienia dane. Otworzy się przeglądarka i Playwright Inspector. Przerwanie może pozostawić dane testowe.`)) return;
  $("#testPreviewDialog").close();
  await startRun({ debug: true, selectedTestIds: [id], headed: true, workers: 1, grep: "" });
}

async function showTestPreview(id) {
  const requestId = ++previewRequest;
  previewTestId = id;
  $("#testPreviewTitle").textContent = `${id} — zapisane wykonanie`;
  $("#testPreviewMeta").textContent = "Odczytywanie raportów…";
  $("#testPreviewContent").textContent = "Pobieranie kroków i załączników bez uruchamiania testu…";
  $("#previewReportLink").hidden = true;
  $("#previewDebugBtn").disabled = Boolean(state.status?.running);
  if (!$("#testPreviewDialog").open) $("#testPreviewDialog").showModal();
  try {
    const { preview } = await api(`/api/test-preview?id=${encodeURIComponent(id)}&environment=${encodeURIComponent($("#environment").value)}`);
    if (requestId !== previewRequest) return;
    if (!preview) {
      $("#testPreviewMeta").textContent = "Brak zapisanego wykonania tego testu.";
      $("#testPreviewContent").textContent = "Nie znaleziono raportu z wykonanymi krokami. Samo zebranie listy testów nie jest wykonaniem. Możesz uruchomić pojedynczy test krok po kroku.";
      return;
    }
    $("#testPreviewMeta").textContent = `${preview.status} · ${formatDate(preview.date)} · ${preview.environment === "unknown" ? "środowisko niezapisane w raporcie — sprawdź pełny raport" : preview.environment.toUpperCase()} · ${preview.source} · próba ${preview.attempt + 1}`;
    const report = $("#previewReportLink");
    // Adresy pochodzą wyłącznie ze znanych lokalnych katalogów raportów / Centrum testów.
    if (preview.reportUrl && (/^\/(?:report|latest-report)\//.test(preview.reportUrl) || /^http:\/\/127\.0\.0\.1:4180\/attachments\/[0-9a-f-]+$/i.test(preview.reportUrl))) {
      report.href = preview.reportUrl;
      report.hidden = false;
    }
    const flat = [];
    const visit = (steps, depth = 0) => steps.forEach(step => { flat.push({ ...step, depth }); visit(step.steps || [], depth + 1); });
    visit(preview.steps || []);
    $("#testPreviewContent").innerHTML = `
      ${preview.errors.map((error, index) => `<details class="preview-attachment" ${index === 0 ? "open" : ""}><summary>Błąd ${index + 1} — porównanie oczekiwania z wynikiem</summary><pre class="preview-error">${escapeHtml(error)}</pre></details>`).join("")}
      <h4>Kroki zapisanego wykonania</h4>
      ${flat.length ? `<div class="preview-navigation"><button id="previewPrevious" class="ghost">← Poprzedni zapisany krok</button><span id="previewStepCounter"></span><button id="previewNext" class="ghost">Następny zapisany krok →</button></div><div class="preview-grid"><ol class="preview-steps">${flat.map((step, index) => `<li><button class="preview-step" data-preview-step="${index}" style="padding-left:${12 + Math.min(step.depth, 5) * 10}px">${step.error ? "BŁĄD · " : step.skipped ? "POMINIĘTO · " : ""}${escapeHtml(step.title)}</button></li>`).join("")}</ol><div id="previewStepDetail"></div></div>` : '<p>Ten raport nie zawiera kroków. Dostępne dane znajdują się w błędach i załącznikach.</p>'}
      <h4>Dane i porównania — załączniki testu</h4>
      <p class="metric-note">Żądania, odpowiedzi i stany „przed / po” są widoczne, jeśli test je zapisał. Pełną sieć sprawdzisz w trace. Podgląd nie odczytuje tokenów ani nagłówków sesji z trace.</p>
      ${preview.attachments.map(attachment => `<details class="preview-attachment"><summary>${escapeHtml(attachment.name)}</summary>${attachment.image && /^\/(report|latest-report)\//.test(attachment.image) ? `<img src="${escapeHtml(attachment.image)}" alt="${escapeHtml(attachment.name)}" loading="lazy">` : ""}${attachment.body !== undefined ? `<pre>${escapeHtml(typeof attachment.body === "string" ? attachment.body : JSON.stringify(attachment.body, null, 2))}</pre>` : ""}</details>`).join("") || "<p>Brak zapisanych załączników.</p>"}`;
    if (flat.length) {
      let index = Math.max(0, flat.findIndex(step => step.error));
      const select = (next) => {
        index = Math.max(0, Math.min(flat.length - 1, next));
        const step = flat[index];
        $("#previewStepCounter").textContent = `${index + 1} / ${flat.length}`;
        $("#previewPrevious").disabled = index === 0;
        $("#previewNext").disabled = index === flat.length - 1;
        $("#previewStepDetail").innerHTML = `<h4>${escapeHtml(step.title)}</h4><p>${step.skipped ? "Pominięto" : step.error ? "Błąd" : "Zapisano wykonanie"} · ${step.duration ?? 0} ms</p>${step.error ? `<pre class="preview-error">${escapeHtml(step.error)}</pre>` : "<p>Brak błędu zapisanego dla tej akcji. Nie oznacza to zaliczenia całego testu.</p>"}`;
        $$('[data-preview-step]').forEach(button => { if (Number(button.dataset.previewStep) === index) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current"); });
      };
      $$('[data-preview-step]').forEach(button => button.addEventListener("click", () => select(Number(button.dataset.previewStep))));
      $("#previewPrevious").onclick = () => select(index - 1);
      $("#previewNext").onclick = () => select(index + 1);
      select(index);
    }
  } catch (error) {
    if (requestId !== previewRequest) return;
    $("#testPreviewMeta").textContent = "Nie udało się odczytać raportu.";
    $("#testPreviewContent").textContent = error.message;
  }
}

function renderScenarios() {
  const container = $("#scenarioList");
  const query = ($("#scenarioSearch")?.value || "").trim().toLowerCase();
  const available = new Set(state.tests.map(test => test.id));
  container.innerHTML = state.scenarios.map(feature => {
    const scenarios = feature.scenarios.filter(scenario => JSON.stringify([feature.title, feature.issue, scenario]).toLowerCase().includes(query));
    if (!scenarios.length) return "";
    const verification = feature.verification;
    const verificationText = verification ? `<p class="scenario-verification">Zapisana weryfikacja ${escapeHtml(verification.environment)} · ${escapeHtml(verification.date)}: ${escapeHtml(verification.passed)} passed, ${escapeHtml(verification.skipped)} skipped, ${escapeHtml(verification.failed)} failed.<br>${escapeHtml(verification.scope)}</p>` : "";
    const issueLinks = `<div class="actions compact">${/^\d+$/.test(feature.issue) ? `<a class="button-link secondary" href="https://redmine.gwo.pl/issues/${encodeURIComponent(feature.issue)}" target="_blank" rel="noopener">Zgłoszenie w Redmine ↗</a>` : ""}${feature.centerIssueId ? `<a class="button-link secondary" href="http://127.0.0.1:4180/#issues/${encodeURIComponent(feature.centerIssueId)}" target="_blank" rel="noopener">Powiązania w Centrum testów ↗</a>` : ""}</div>`;
    return `<article class="scenario-feature"><h3>${escapeHtml(feature.title)} · #${escapeHtml(feature.issue)}</h3><p>${escapeHtml(feature.scope)}</p>${issueLinks}${verificationText}${scenarios.map(scenario => {
      const missing = scenario.testIds.filter(id => !available.has(id));
      const blocked = scenario.automation === "blocked";
      return `<details class="scenario-item"><summary><strong>${escapeHtml(scenario.id)}</strong> ${escapeHtml(scenario.title)} <span>${blocked ? "Zablokowany" : "Test automatyczny"}</span></summary>
        <h4>Warunki wstępne</h4><ul>${scenario.preconditions.map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ul>
        <h4>Kroki</h4><ol>${scenario.steps.map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ol>
        <h4>Oczekiwany wynik</h4><p>${escapeHtml(scenario.expected)}</p>
        <p>Powiązane testy: ${scenario.testIds.map(escapeHtml).join(", ")}</p>
        ${blocked ? `<p class="error">${escapeHtml(scenario.blocker)}</p>` : ""}
        ${missing.length ? `<p>Brak w bieżącej liście: ${missing.map(escapeHtml).join(", ")}. Odśwież katalog testów.</p>` : ""}
        <button class="secondary" data-scenario-id="${escapeHtml(scenario.id)}" ${blocked || missing.length ? "disabled" : ""}>Wybierz powiązany test</button>
      </details>`;
    }).join("")}</article>`;
  }).join("") || '<p class="empty">Brak pasujących scenariuszy.</p>';
  $$('[data-scenario-id]').forEach(button => button.addEventListener("click", () => {
    const scenario = state.scenarios.flatMap(feature => feature.scenarios).find(item => item.id === button.dataset.scenarioId);
    if (!scenario || scenario.automation === "blocked" || scenario.testIds.some(id => !available.has(id))) return;
    linkedOnly = false;
    missingLinkedIds = [];
    $("#linked-selection")?.remove();
    state.selected = new Set(scenario.testIds);
    $("#testSearch").value = scenario.testIds.length === 1 ? scenario.testIds[0] : "";
    renderTests();
    $("#scenarioMessage").textContent = `Wybrano ${scenario.testIds.join(", ")}. Ustaw środowisko i użyj „Uruchom testy”.`;
    location.hash = "#test-catalog";
  }));
}

async function loadScenarios() {
  try {
    const catalog = await api("/api/scenarios");
    state.scenarios = Array.isArray(catalog.features) ? catalog.features : [];
    state.scenariosLoaded = true;
    renderDashboard();
    renderScenarios();
  } catch (error) { $("#scenarioList").textContent = `Nie udało się pobrać scenariuszy: ${error.message}`; }
}

async function loadTests() {
  $("#testsList").innerHTML = '<div class="empty">Pobieranie listy z Playwrighta…</div>';
  try {
    const environment = $("#environment").value;
    const { tests } = await api(`/api/tests?environment=${environment}`);
    state.tests = tests;
    state.testsLoaded = true;
    renderScenarios();
    state.selected.clear();
    if (linkedOnly) {
      const available = new Set(tests.filter((t) => !t.annual).map((t) => t.id));
      missingLinkedIds = linkedIds.filter((id) => !available.has(id));
      linkedIds.filter((id) => available.has(id)).forEach((id) => state.selected.add(id));
      let notice = $("#linked-selection");
      if (!notice) {
        notice = document.createElement("div");
        notice.id = "linked-selection";
        notice.className = "test-data-message info";
        notice.setAttribute("role", "status");
        $("#testSearch").before(notice);
      }
      notice.textContent =
        `Zgłoszenie #${linkedParams.get("issue") || "—"}: wybrano ${state.selected.size} testów. Testy czekają na uruchomienie.` +
        (missingLinkedIds.length
          ? ` Nie znaleziono: ${missingLinkedIds.join(", ")}. Uruchomienie jest zablokowane do wyjaśnienia powiązań.`
          : "");
      const all = document.createElement("button");
      all.className = "ghost";
      all.textContent = "Przejdź do pełnego katalogu";
      all.onclick = () => {
        linkedOnly = false;
        missingLinkedIds = [];
        notice.remove();
        renderTests();
      };
      notice.append(" ", all);
    }
    renderTests();
  } catch (error) {
    $("#testsList").innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function startRun(extra = {}) {
  if (linkedOnly && (missingLinkedIds.length || !(extra.selectedTestIds ?? [...state.selected]).length)) {
    alert("Wybierz istniejące testy przypięte do zgłoszenia. Nie uruchomiono całej regresji.");
    return;
  }
  const payload = {
    environment: $("#environment").value,
    workers: Number($("#workers").value),
    headed: $("#headed").checked,
    suite: state.suite,
    grep: $("#grep").value.trim(),
    selectedTestIds: [...state.selected],
    ...extra,
  };

  if (payload.annualMode) {
    const ok = confirm(
      `${payload.annualMode} to ciężki, osobny workflow roczny. Uruchomić teraz na ${payload.environment.toUpperCase()}?`,
    );
    if (!ok) return;
    payload.selectedTestIds = [];
    payload.grep = "";
    payload.workers = 1;
  }

  try {
    $("#log").textContent = "";
    const result = await api("/api/run", { method: "POST", body: JSON.stringify(payload) });
    renderStatus(result);
    location.hash = "#run-status";
  } catch (error) {
    alert(error.message);
  }
}

async function stopRun() {
  try {
    await api("/api/stop", { method: "POST", body: "{}" });
  } catch (error) {
    alert(error.message);
  }
}

async function rerunFailed(runId) {
  try {
    $("#log").textContent = "";
    const result = await api("/api/rerun-failed", {
      method: "POST",
      body: JSON.stringify({ runId, headed: $("#headed").checked }),
    });
    renderStatus(result);
    location.hash = "#run-status";
  } catch (error) {
    alert(error.message);
  }
}

async function loadHistory() {
  const container = $("#history");
  try {
    const { history } = await api("/api/history");
    $("#dashboardHistory").textContent = history.length
      ? `Zapisanych przebiegów: ${history.length}. Ostatni: ${formatDate(history[0].startedAt)} · ${history[0].status}.`
      : "Historia nie zawiera jeszcze zapisanych przebiegów.";
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
            <span>${escapeHtml(new Date(run.startedAt).toLocaleString("pl-PL"))}</span>
            <span>${escapeHtml(run.environment.toUpperCase())} · ${escapeHtml(run.suiteLabel || run.suite)}</span>
            <span class="history-status ${String(run.status).toLowerCase()}">
              ${escapeHtml(run.status)} · ${run.counts?.passed ?? 0}/${(run.counts?.passed ?? 0) + (run.counts?.failed ?? 0) + (run.counts?.skipped ?? 0)}${(run.counts?.expectedFailed ?? 0) > 0 ? ` · expected fail: ${run.counts.expectedFailed}` : ""}
              ${run.failures?.length ? `<small title="${escapeHtml(run.failures[0].summary)}">${escapeHtml(run.failures[0].label)} · ${escapeHtml(run.failures[0].id)}</small>` : ""}
            </span>
            <span>${formatDuration(run.durationMs)}</span>
            <span class="history-actions">
              ${run.reportAvailable && run.reportUrl ? `<a class="button-link ghost" href="${escapeHtml(run.reportUrl)}" target="_blank" rel="noopener">Raport</a>` : ""}
              ${run.failedTestIds?.length ? `<button class="ghost rerun-history" data-run-id="${run.id}">Ponów failed</button>` : ""}
            </span>
          </div>`,
        )
        .join("")}`;

    $$(".rerun-history").forEach((button) =>
      button.addEventListener("click", () => rerunFailed(button.dataset.runId)),
    );
  } catch (error) {
    container.innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function showPerformance() {
  try {
    const result = await api("/api/performance/latest");
    $("#performanceFile").textContent = result.fileName || "Brak pliku performance";
    $("#performanceJson").textContent = result.data
      ? JSON.stringify(result.data, null, 2)
      : "Brak danych.";
    $("#performanceDialog").showModal();
  } catch (error) {
    alert(error.message);
  }
}

function testDataSearchTerm() {
  return $("#testDataSearch").value.trim().toLowerCase();
}

function resultBadge(value) {
  const safe = escapeHtml(value || "BRAK");
  const css = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");
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

  $("#testDataSummary").textContent =
    `${state.testData.teachers.length} nauczycieli · ${state.selectedTeacherFiles.size} zaznaczonych`;
  $("#deleteSelectedTeachersBtn").hidden = false;
  $("#deleteSelectedTeachersBtn").disabled =
    Boolean(state.status?.running) || state.selectedTeacherFiles.size === 0;

  if (!teachers.length) {
    $("#testDataTable").innerHTML =
      '<div class="empty">Brak nauczycieli pasujących do filtra.</div>';
    return;
  }

  $("#testDataTable").innerHTML = `
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
              ${state.selectedTeacherFiles.has(teacher.fileName) ? "checked" : ""}
              ${teacher.deletable ? "" : "disabled"}
              title="${escapeHtml(teacher.deleteReason || "")}"
            />
          </span>
          <span class="mono strong">${escapeHtml(teacher.id)}</span>
          <span>
            <strong>${escapeHtml(teacher.lastName || "—")}</strong>
            <small>${escapeHtml(teacher.email || "—")}</small>
            <small>${escapeHtml(teacher.environment.toUpperCase())} · ${escapeHtml(formatDate(teacher.createdAt))}</small>
          </span>
          <span>
            <strong>${escapeHtml(teacher.title || teacher.runId)}</strong>
            <small>${resultBadge(teacher.result)}</small>
          </span>
          <span>
            ${resultBadge(teacher.cleanupStatus)}
            <small>${escapeHtml(teacher.deleteReason || "")}</small>
          </span>
          <span class="data-actions">
            <a class="button-link ghost" href="${escapeHtml(teacher.url)}" target="_blank" rel="noopener">Otwórz</a>
            <button
              class="danger-outline delete-teacher"
              data-teacher-file="${escapeHtml(teacher.fileName)}"
              data-teacher-id="${escapeHtml(teacher.id)}"
              ${teacher.deletable && !state.status?.running ? "" : "disabled"}
              title="${escapeHtml(teacher.deleteReason || "")}"
            >Usuń</button>
          </span>
        </div>`,
      )
      .join("")}`;

  $$("[data-teacher-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.selectedTeacherFiles.add(checkbox.dataset.teacherSelect);
      else state.selectedTeacherFiles.delete(checkbox.dataset.teacherSelect);
      renderTeachers();
    });
  });

  $$(".delete-teacher").forEach((button) => {
    button.addEventListener("click", () =>
      deleteTeachers([button.dataset.teacherFile], [button.dataset.teacherId]),
    );
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

  $("#testDataSummary").textContent =
    `${state.testData.schools.length} szkół zapisanych w rejestrach testów`;
  $("#deleteSelectedTeachersBtn").hidden = true;

  if (!schools.length) {
    $("#testDataTable").innerHTML = '<div class="empty">Brak szkół pasujących do filtra.</div>';
    return;
  }

  $("#testDataTable").innerHTML = `
    <div class="data-row school-row data-head">
      <span>ID</span><span>Nazwa</span><span>Źródło</span><span>Test / wynik</span><span>Wystąpienia</span><span>Akcje</span>
    </div>
    ${schools
      .map(
        (school) => `
        <div class="data-row school-row">
          <span class="mono strong">${escapeHtml(school.id)}</span>
          <span>
            <strong>${escapeHtml(school.name || "—")}</strong>
            <small>${escapeHtml(school.environment.toUpperCase())} · ${escapeHtml(formatDate(school.createdAt))}</small>
          </span>
          <span>${escapeHtml(school.kind || school.source || "—")}</span>
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
      .join("")}`;
}

function renderTestData() {
  $$(".test-data-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.testDataTab === state.testDataTab);
  });

  if (state.testDataTab === "schools") renderSchools();
  else renderTeachers();
}

async function loadTestData() {
  $("#testDataTable").innerHTML = '<div class="empty">Odczytywanie runs/*.json…</div>';
  $("#testDataMessage").textContent = "";

  try {
    const result = await api("/api/test-data");
    state.testData = {
      teachers: result.teachers || [],
      schools: result.schools || [],
    };

    const availableFiles = new Set(
      state.testData.teachers.filter((item) => item.deletable).map((item) => item.fileName),
    );
    state.selectedTeacherFiles = new Set(
      [...state.selectedTeacherFiles].filter((fileName) => availableFiles.has(fileName)),
    );

    $("#teachersTabCount").textContent = state.testData.teachers.length;
    $("#schoolsTabCount").textContent = state.testData.schools.length;
    renderTestData();
  } catch (error) {
    $("#testDataTable").innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function deleteTeachers(files, teacherIds = []) {
  const cleanFiles = [...new Set(files)].filter(Boolean);
  if (!cleanFiles.length) return;

  const ids = teacherIds.length
    ? teacherIds.join(", ")
    : state.testData.teachers
        .filter((teacher) => cleanFiles.includes(teacher.fileName))
        .map((teacher) => teacher.id)
        .join(", ");

  const confirmed = confirm(
    `Usunąć ${cleanFiles.length === 1 ? "nauczyciela" : `${cleanFiles.length} nauczycieli`} ${ids ? `(${ids})` : ""}?\n\n` +
      "Przed DELETE cleanup ponownie sprawdzi ID, dane z rejestru i flagę Testowy. Operacja dotyczy wyłącznie DEV.",
  );
  if (!confirmed) return;

  const bulkButton = $("#deleteSelectedTeachersBtn");
  bulkButton.disabled = true;
  $("#testDataMessage").className = "test-data-message info";
  $("#testDataMessage").textContent =
    "Usuwanie nauczycieli… Operacja może potrwać kilkadziesiąt sekund.";

  try {
    const result = await api("/api/test-data/teachers/delete", {
      method: "POST",
      body: JSON.stringify({ files: cleanFiles }),
    });

    state.testData = result.registry || state.testData;
    state.selectedTeacherFiles.clear();
    $("#teachersTabCount").textContent = state.testData.teachers?.length ?? 0;
    $("#schoolsTabCount").textContent = state.testData.schools?.length ?? 0;
    $("#testDataMessage").className = "test-data-message success";
    $("#testDataMessage").textContent = "Cleanup zakończony. Stan rejestrów został odświeżony.";
    renderTestData();
  } catch (error) {
    await loadTestData();
    $("#testDataMessage").className = "test-data-message error";
    $("#testDataMessage").textContent = error.message;
  }
}

$$(".suite").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".suite").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.suite = button.dataset.suite;
    updateWorkersForSuite(state.suite);
  });
});

$$(".test-data-tab").forEach((button) => {
  button.addEventListener("click", () => {
    state.testDataTab = button.dataset.testDataTab;
    renderTestData();
  });
});

$("#startBtn").addEventListener("click", () => startRun());
$("#debugSelectedBtn").addEventListener("click", () => { if (state.selected.size === 1) debugTest([...state.selected][0]); });
$("#closeTestPreviewBtn").addEventListener("click", () => $("#testPreviewDialog").close());
$("#testPreviewDialog").addEventListener("close", () => { previewRequest++; });
$("#previewDebugBtn").addEventListener("click", () => debugTest(previewTestId));
$("#stopBtn").addEventListener("click", stopRun);
$("#rerunFailedBtn").addEventListener("click", () => rerunFailed());
$("#refreshTestsBtn").addEventListener("click", loadTests);
$("#clearSelectionBtn").addEventListener("click", () => {
  state.selected.clear();
  renderTests();
});
$("#testSearch").addEventListener("input", renderTests);
$("#scenarioSearch").addEventListener("input", renderScenarios);
$("#environment").addEventListener("change", loadTests);
$("#clearLogBtn").addEventListener("click", () => ($("#log").textContent = ""));
$("#refreshHistoryBtn").addEventListener("click", loadHistory);
$("#performanceBtn").addEventListener("click", showPerformance);
$("#closePerformanceBtn").addEventListener("click", () => $("#performanceDialog").close());
$("#refreshTestDataBtn").addEventListener("click", loadTestData);
$("#testDataSearch").addEventListener("input", renderTestData);
$("#deleteSelectedTeachersBtn").addEventListener("click", () =>
  deleteTeachers([...state.selectedTeacherFiles]),
);
$$("[data-annual]").forEach((button) =>
  button.addEventListener("click", () => startRun({ annualMode: button.dataset.annual })),
);
$("#reportBtn").addEventListener("click", (event) => {
  if ($("#reportBtn").classList.contains("disabled")) event.preventDefault();
});

const events = new EventSource("/api/events");
events.addEventListener("log", (event) => appendLog(JSON.parse(event.data)));
events.addEventListener("status", (event) => renderStatus(JSON.parse(event.data)));
events.addEventListener("finished", () => {
  loadHistory();
  loadTestData();
});

updateWorkersForSuite(state.suite);
api("/api/status")
  .then(renderStatus)
  .catch(() => {});
loadTests();
loadScenarios();
loadTestData();
loadHistory();

// Zmienia się wyłącznie widoczność widoków. Stan formularzy, SSE i log pozostają wspólne.
const pages = {
  dashboard: { title: "Pulpit", description: "Podsumowanie testów i szybki dostęp do najważniejszych działań." },
  "business-scenarios": { title: "Scenariusze", description: "Wymagania, kroki i oczekiwane wyniki powiązane z testami." },
  "run-tests": { title: "Uruchom testy", description: "Wybierz środowisko, skonfiguruj przebieg i zaznacz testy z katalogu." },
  "run-status": { title: "Przebieg i logi", description: "Postęp, log na żywo, błędy oraz sterowanie uruchomieniem." },
  "run-history": { title: "Historia i raporty", description: "Wcześniejsze uruchomienia, raporty HTML i ponawianie błędów." },
  "test-data": { title: "Dane testowe", description: "Rejestr rekordów testowych i istniejący mechanizm bezpiecznego sprzątania." },
};
const pageAliases = { "test-catalog": "run-tests", "run-log": "run-status" };

function updateSectionNavigation(event) {
  const requested = location.hash.slice(1) || (linkedIds.length ? "run-tests" : "dashboard");
  const key = Object.hasOwn(pageAliases, requested) ? pageAliases[requested] : requested;
  const activePage = Object.hasOwn(pages, key) ? key : "dashboard";
  if (!Object.hasOwn(pages, key)) window.history.replaceState(null, "", `${location.pathname}${location.search}#dashboard`);
  document.querySelectorAll("main > section[data-page]").forEach(section => { section.hidden = section.dataset.page !== activePage; });
  document.body.dataset.currentPage = activePage;
  $("#pageTitle").textContent = pages[activePage].title;
  $("#pageDescription").textContent = pages[activePage].description;
  document.title = `${pages[activePage].title} · Octopus Test Runner`;
  document.querySelectorAll(".qa-sidebar nav a").forEach((link) => {
    const active = link.getAttribute("href") === `#${activePage}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (event) $("#pageTitle").focus({ preventScroll: true });
  if (Object.hasOwn(pageAliases, requested)) {
    window.requestAnimationFrame(() => document.getElementById(requested)?.scrollIntoView({ block: "start" }));
  } else window.scrollTo(0, 0);
  renderDashboard();
}
window.addEventListener("hashchange", updateSectionNavigation);
updateSectionNavigation();
