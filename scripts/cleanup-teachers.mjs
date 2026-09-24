import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { ensureSession, restoreSession } from "./auth.mjs";

const origin = "https://octopus.gwodev.pl";

const failedTestResults = new Set(["FAIL", "FAILED", "TIMEDOUT", "INTERRUPTED"]);

/*
 * =========================================================
 * WIELU NAUCZYCIELI NA JEDEN PRZEBIEG SCENARIUSZA
 * =========================================================
 *
 * Jeden plik runs/REG_*.json może teraz opisywać WIĘCEJ NIŻ JEDNEGO
 * utworzonego nauczyciela (np. część "dodawanie" i część "edycja" tego
 * samego testu kontraktowego) - są oni przechowywani jako tablica JSON
 * w polu `teachers`, każdy wpis niezależnie ze swoim ID/e-mailem/
 * nazwiskiem/statusem sprzątania.
 *
 * Starszy, płaski format (pojedyncze pola teacherId/teacherEmail/
 * teacherLastName/cleanupStatus/cleanupFinishedAt wprost w rejestrze)
 * jest nadal odczytywany dla wstecznej zgodności ze starymi rejestrami
 * i z testami, które budują ten obiekt ręcznie (np. szkola-nauczyciel.
 * spec.ts) - patrz getTeacherEntries().
 */
export function getTeacherEntries(run) {
  if (Object.hasOwn(run, "teachers")) {
    if (!run.teachers) return [];
    let parsed;
    try {
      parsed = JSON.parse(run.teachers);
    } catch {
      throw new Error("Rejestr ma niepoprawny format pola teachers (nie jest poprawnym JSON-em).");
    }
    if (!Array.isArray(parsed)) throw new Error("Pole teachers w rejestrze musi być tablicą.");
    return parsed;
  }
  if (!run.teacherId) return [];
  return [
    {
      teacherId: run.teacherId,
      teacherEmail: Object.hasOwn(run, "teacherEmail") ? run.teacherEmail : run.email,
      teacherLastName: run.teacherLastName,
      cleanupStatus: run.cleanupStatus,
      cleanupFinishedAt: run.cleanupFinishedAt,
    },
  ];
}

// Zapisuje listę z powrotem do rejestru w nowym formacie i usuwa stare
// płaskie pola, żeby nie sugerowały nieaktualnego stanu pojedynczego
// nauczyciela po migracji na wiele wpisów w jednym przebiegu.
export function setTeacherEntries(run, entries) {
  run.teachers = JSON.stringify(entries);
  delete run.teacherId;
  delete run.teacherEmail;
  delete run.teacherLastName;
  delete run.cleanupStatus;
  delete run.cleanupFinishedAt;
}

function validateTeacherEntry(entry) {
  if (
    !/^[1-9]\d*$/.test(String(entry.teacherId ?? "")) ||
    !Number.isSafeInteger(Number(entry.teacherId))
  )
    throw new Error("Niepoprawne ID nauczyciela.");
  if (typeof entry.teacherEmail !== "string")
    throw new Error("Brak oczekiwanego e-maila nauczyciela.");
  if (entry.teacherEmail === "" && !entry.teacherLastName) {
    throw new Error("Nauczyciel bez e-maila wymaga oczekiwanego nazwiska.");
  }
}

export function validateTeacherRun(run, { includeFailed = false } = {}) {
  const resultAllowed =
    run.result === "PASS" || (includeFailed && failedTestResults.has(run.result));
  if (!resultAllowed) {
    throw new Error(
      includeFailed
        ? "Sprzątanie wymaga wyniku PASS albo zakończonego nieudanego testu."
        : "Sprzątanie wymaga wyniku PASS. Dla nieudanego testu użyj --include-failed.",
    );
  }
  const runId = run.runId ?? run.id;
  if (
    !/^REG_\d+_[a-f0-9]{6}$/.test(runId ?? "") ||
    run.email !== `${runId.toLowerCase()}@example.invalid`
  ) {
    throw new Error("Brak jednoznacznych danych własnego rejestru testowego.");
  }
  const entries = getTeacherEntries(run);
  if (!entries.length) throw new Error("Rejestr nie zawiera żadnego nauczyciela do sprzątania.");
  for (const entry of entries) validateTeacherEntry(entry);
}

function teacherMatchesEntry(teacher, entry) {
  const emailMatches =
    String(teacher?.email ?? "")
      .trim()
      .toLowerCase() === entry.teacherEmail.trim().toLowerCase();
  const lastNameMatches =
    !entry.teacherLastName ||
    String(teacher?.lastName ?? "").trim() === entry.teacherLastName.trim();
  return String(teacher?.id) === entry.teacherId && emailMatches && lastNameMatches;
}

// Diagnostyka do komunikatu błędu - pokazuje, KTÓRE pole się nie zgadza,
// zamiast tylko "nie zgadza się" (odpowiedzi API nie zawierają danych
// wrażliwych poza samym nauczycielem, więc bezpiecznie je zalogować).
function describeMismatch(teacher, entry) {
  const parts = [];
  if (String(teacher?.id) !== entry.teacherId)
    parts.push(`ID: oczekiwano ${entry.teacherId}, API zwróciło ${teacher?.id}`);
  const actualEmail = String(teacher?.email ?? "").trim();
  if (actualEmail.toLowerCase() !== entry.teacherEmail.trim().toLowerCase())
    parts.push(`e-mail: oczekiwano "${entry.teacherEmail}", w Octopusie jest "${actualEmail}"`);
  if (entry.teacherLastName) {
    const actualLastName = String(teacher?.lastName ?? "").trim();
    if (actualLastName !== entry.teacherLastName.trim())
      parts.push(
        `nazwisko: oczekiwano "${entry.teacherLastName}", w Octopusie jest "${actualLastName}"`,
      );
  }
  return parts.length ? parts.join("; ") : "nieznana niezgodność (sprawdź surową odpowiedź API)";
}

// Żądania wykonujemy w zalogowanej przeglądarce; token nie opuszcza strony.
async function api(page, pathname, method = "GET", params = {}) {
  if (new URL(page.url()).origin !== origin)
    throw new Error("Sprzątanie dostępne tylko na Octopus dev.");
  return page.evaluate(
    async ({ pathname, method, params }) => {
      if (location.origin !== "https://octopus.gwodev.pl")
        throw new Error("Nieoczekiwana zmiana środowiska.");
      const userId = localStorage.getItem("id");
      let token = localStorage.getItem("token");
      try {
        token = JSON.parse(token);
      } catch {
        /* token bywa zwykłym tekstem */
      }
      if (!token || !/^[1-9]\d*$/.test(userId ?? ""))
        throw new Error("Brak aktualnej sesji sprzątania.");
      const url = new URL(pathname, location.origin);
      if (method === "DELETE") params.userId = userId;
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        redirect: "error",
        // Zbiorcze usuwanie z zależnościami może trwać dłużej niż zwykły odczyt.
        signal: AbortSignal.timeout(method === "DELETE" ? 180_000 : 30_000),
      });
      let data = null;
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch {
          /* odrzucone poniżej */
        }
      }
      return { status: response.status, data };
    },
    { pathname, method, params },
  );
}

// Dla rejestrów z DOKŁADNIE jednym nauczycielem (dominujący przypadek).
// Rejestry z wieloma nauczycielami idą przez cleanupTeacherBatch.
//
// `includeUntested` (domyślnie false, jak --include-failed) pozwala usunąć
// nauczyciela nawet bez potwierdzonej flagi Testowy - identyfikacja po ID +
// e-mailu (+ nazwisku, jeśli podane) pozostaje obowiązkowym warunkiem, więc
// to wciąż nie usunie niewłaściwego rekordu, tylko przestaje wymagać
// dodatkowego, czysto informacyjnego potwierdzenia flagi.
export async function deleteTestTeacher(page, run, { includeUntested = false } = {}) {
  validateTeacherRun(run);
  const entries = getTeacherEntries(run);
  if (entries.length > 1)
    throw new Error(
      "Rejestr zawiera więcej niż jednego nauczyciela; użyj cleanupTeacherBatch zamiast deleteTestTeacher.",
    );
  const [entry] = entries;
  const endpoint = `/api/Teacher/${entry.teacherId}`;
  const before = await api(page, endpoint);
  if (before.status === 204) return "ALREADY_ABSENT";
  if (before.status !== 200 || !teacherMatchesEntry(before.data, entry)) {
    const detail =
      before.status === 200 ? describeMismatch(before.data, entry) : `HTTP ${before.status}`;
    throw new Error(`Dane nauczyciela nie zgadzają się z rejestrem (${detail}); nie wykonano DELETE.`);
  }
  const tested = await api(page, "/api/Teacher/GetTeacherIsTested", "GET", {
    teacherId: entry.teacherId,
  });
  if (tested.status !== 200 || tested.data !== true) {
    if (!includeUntested) throw new Error("Nauczyciel nie ma flagi Testowy; nie wykonano DELETE.");
    console.warn(`${entry.teacherId}: brak flagi Testowy, usuwam mimo to (--include-untested).`);
  }
  const result = await api(page, "/api/DeleteRecordsDB/DeleteRecordsFromDB", "DELETE", {
    jsonData: JSON.stringify([{ nauczycielId: Number(entry.teacherId) }]),
  });
  // HTTP 200 nie dowodzi sukcesu operacji biznesowej. Potwierdzamy brak rekordu.
  if (result.status < 200 || result.status >= 300)
    throw new Error(`Usuwanie zwróciło HTTP ${result.status}; sprawdź stan rekordu.`);
  const after = await api(page, endpoint);
  if (after.status !== 204)
    throw new Error("Nie potwierdzono usunięcia nauczyciela; sprawdź stan rekordu.");
  return "DELETED";
}

export async function cleanupSuccessfulTeacher(page, run, save) {
  if (!getTeacherEntries(run).length) return;
  if (run.result !== "PASS") {
    run.cleanupStatus = "KEPT_FAILED_TEST";
    await save();
    return;
  }
  run.cleanupStatus = "RUNNING";
  await save();
  try {
    run.cleanupStatus = await deleteTestTeacher(page, run);
    run.cleanupFinishedAt = new Date().toISOString();
    await save();
  } catch (error) {
    run.cleanupStatus = "FAILED";
    await save();
    throw error;
  }
}

export function parseCleanupArgs(args) {
  const apply = args.includes("--apply");
  const all = args.includes("--all");
  const includeFailed = args.includes("--include-failed");
  const includeUntested = args.includes("--include-untested");
  const files = args.filter(
    (a) => !["--apply", "--all", "--include-failed", "--include-untested"].includes(a),
  );
  if (files.some((f) => !/^REG_\d+_[a-f0-9]{6}\.json$/.test(f)))
    throw new Error(
      "Podaj pełne nazwy plików z kolumny rejestr albo --all. Wykonanie wymaga --apply (z dwoma myślnikami).",
    );
  if (all && files.length)
    throw new Error("Wybierz --all albo konkretne nazwy rejestrów, nie oba naraz.");
  if (apply && !all && !includeFailed && !files.length) {
    throw new Error("--apply wymaga listy rejestrów, --all albo --include-failed.");
  }
  return { apply, all, includeFailed, includeUntested, files };
}

async function main() {
  const { apply, includeFailed, includeUntested, files } = parseCleanupArgs(process.argv.slice(2));
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dir = path.join(root, "runs");
  const names = files.length
    ? [...new Set(files)]
    : (await readdir(dir)).filter((f) => /^REG_\d+_[a-f0-9]{6}\.json$/.test(f));
  const selected = [];
  for (const name of names) {
    const run = JSON.parse(await readFile(path.join(dir, name), "utf8"));
    const pendingEntries = getTeacherEntries(run).filter(
      (entry) => entry.teacherId && !["DELETED", "ALREADY_ABSENT"].includes(entry.cleanupStatus),
    );
    if (!pendingEntries.length) continue;
    try {
      validateTeacherRun(run, { includeFailed });
    } catch (error) {
      if (files.length) throw error;
      continue;
    }
    selected.push({ name, run });
  }
  console.table(
    selected.flatMap(({ name, run }) =>
      getTeacherEntries(run).map((entry) => ({
        rejestr: name,
        teacherId: entry.teacherId,
        wynik: run.result,
      })),
    ),
  );
  if (!apply) {
    console.log(
      `PODGLĄD lokalny — bez usuwania. Lista obejmuje ${
        includeFailed
          ? "rejestry PASS oraz zakończone nieudane testy"
          : "wyłącznie poprawne rejestry PASS"
      }.`,
    );
    console.log(
      includeFailed
        ? "Wszystkie pokazane rejestry: npm.cmd run cleanup:teachers -- --include-failed --apply"
        : "Wszystkie pokazane rejestry: npm.cmd run cleanup:teachers -- --all --apply",
    );
    console.log(
      `Wybrane: npm.cmd run cleanup:teachers -- <pełna nazwa z kolumny rejestr>${
        includeFailed ? " --include-failed" : ""
      } --apply`,
    );
    console.log(
      "Dodaj --include-untested, żeby usunąć również nauczycieli bez potwierdzonej flagi Testowy (identyfikacja po ID + e-mailu pozostaje wymagana).",
    );
    return;
  }
  await cleanupTeacherRecords(dir, selected, { includeFailed, includeUntested });
}

export async function cleanupTeacherRecords(
  dir,
  selected,
  { includeFailed = false, includeUntested = false } = {},
) {
  if (!selected.length) return;
  const auth = await ensureSession();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ storageState: auth.storageState });
    await restoreSession(context, auth.session);
    const page = await context.newPage();
    await page.goto(`${origin}/teacher/teacher-panel`);
    await page.getByRole("button", { name: "Wyloguj", exact: true }).waitFor();
    await cleanupTeacherBatch(
      page,
      selected,
      async ({ name, run }) => {
        await writeFile(path.join(dir, name), JSON.stringify(run, null, 2));
      },
      { includeFailed, includeUntested },
    );
  } finally {
    await browser.close();
  }
}

export async function cleanupTeacherBatch(
  page,
  selected,
  save,
  { includeFailed = false, includeUntested = false } = {},
) {
  const pending = [];
  // Najpierw walidacja całej listy. Nie usuwamy części przed sprawdzeniem reszty.
  for (const { run } of selected) {
    validateTeacherRun(run, { includeFailed });
  }
  // Jeden przebieg może zawierać wielu nauczycieli (patrz getTeacherEntries) -
  // spłaszczamy do jednego wpisu na nauczyciela, scalając duplikaty tego
  // samego ID między różnymi rejestrami.
  const unique = new Map();
  for (const { run } of selected) {
    for (const entry of getTeacherEntries(run)) {
      const previous = unique.get(entry.teacherId);
      if (previous && previous.teacherEmail !== entry.teacherEmail)
        throw new Error("Sprzeczne rejestry tego samego nauczyciela.");
      if (!previous) unique.set(entry.teacherId, entry);
    }
  }
  const update = async (id, status) => {
    for (const item of selected) {
      const entries = getTeacherEntries(item.run);
      const target = entries.find((entry) => entry.teacherId === id);
      if (!target) continue;
      target.cleanupStatus = status;
      if (["DELETED", "ALREADY_ABSENT"].includes(status))
        target.cleanupFinishedAt = new Date().toISOString();
      setTeacherEntries(item.run, entries);
      await save(item);
    }
  };
  // Jeden zły/nieoflagowany rekord nie może zablokować sprzątania setek
  // pozostałych. Sprawdzenie wstępne każdego nauczyciela jest więc odporne:
  // błąd jednego jest zbierany i zgłaszany na końcu, a przetwarzanie
  // pozostałych trwa dalej.
  const precheckFailures = [];
  for (const [teacherId, entry] of unique) {
    if (["DELETED", "ALREADY_ABSENT"].includes(entry.cleanupStatus)) continue;
    try {
      const before = await api(page, `/api/Teacher/${teacherId}`);
      if (before.status === 204) {
        await update(teacherId, "ALREADY_ABSENT");
        console.log(`${teacherId}: ALREADY_ABSENT`);
        continue;
      }
      if (before.status !== 200 || !teacherMatchesEntry(before.data, entry)) {
        const detail =
          before.status === 200 ? describeMismatch(before.data, entry) : `HTTP ${before.status}`;
        throw new Error(`dane nie zgadzają się z rejestrem (${detail})`);
      }
      const tested = await api(page, "/api/Teacher/GetTeacherIsTested", "GET", { teacherId });
      if (tested.status !== 200 || tested.data !== true) {
        if (!includeUntested) throw new Error("brak flagi Testowy");
        console.warn(`${teacherId}: brak flagi Testowy, usuwam mimo to (--include-untested).`);
      }
      pending.push(teacherId);
    } catch (error) {
      await update(teacherId, "FAILED");
      precheckFailures.push(`${teacherId} (${error.message})`);
      console.warn(
        `Nauczyciel ${teacherId}: pominięto (${error.message}); nie wykonano DELETE. Pozostali nauczyciele są przetwarzani dalej.`,
      );
    }
  }
  if (!pending.length) {
    if (precheckFailures.length)
      throw new Error(
        `Nie wykonano DELETE dla żadnego nauczyciela. Pominięci: ${precheckFailures.join("; ")}.`,
      );
    return;
  }
  const failures = [];
  let uncertainFailure;
  // Endpoint usuwa rozbudowany graf zależności. Paczki po 25 rekordów kończyły
  // się 503 podczas pełnej regresji; mniejsze ograniczają szczyt obciążenia.
  const batchSize = 10;
  const batchCount = Math.ceil(pending.length / batchSize);
  for (let offset = 0; offset < pending.length; offset += batchSize) {
    const batch = pending.slice(offset, offset + batchSize);
    const batchNumber = offset / batchSize + 1;
    for (const id of batch) await update(id, "RUNNING");
    let deleteError;
    try {
      console.log(
        `Żądanie DELETE ${batchNumber}/${batchCount} dla ${batch.length} nauczycieli (limit 180 s).`,
      );
      const result = await api(page, "/api/DeleteRecordsDB/DeleteRecordsFromDB", "DELETE", {
        jsonData: JSON.stringify(batch.map((id) => ({ nauczycielId: Number(id) }))),
      });
      if (result.status < 200 || result.status >= 300)
        throw new Error(`Zbiorcze usuwanie zwróciło HTTP ${result.status}.`);
    } catch (error) {
      // Timeout przerywa oczekiwanie klienta, ale serwer może kontynuować operację.
      // Nie ponawiamy DELETE; sprawdzamy stan każdego rekordu samymi odczytami.
      deleteError = error;
      uncertainFailure = error;
      for (const id of batch) await update(id, "UNKNOWN");
      console.warn(
        "Nie otrzymano potwierdzenia DELETE. Sprawdzam stan rekordów bez ponawiania usuwania.",
      );
    }
    const batchFailures = [];
    for (const id of batch) {
      try {
        const after = await api(page, `/api/Teacher/${id}`);
        if (after.status !== 204)
          throw new Error("Rekord nadal istnieje lub odczyt się nie powiódł.");
        await update(id, "DELETED");
        console.log(`${id}: DELETED`);
      } catch {
        await update(id, deleteError ? "UNKNOWN" : "FAILED");
        failures.push(id);
        batchFailures.push(id);
      }
    }
    if (deleteError && batchFailures.length) break;
  }
  if (failures.length || precheckFailures.length) {
    const parts = [];
    if (failures.length) parts.push(`nie potwierdzono usunięcia: ${failures.join(", ")}`);
    if (precheckFailures.length) parts.push(`pominięto przed usunięciem: ${precheckFailures.join("; ")}`);
    throw new Error(
      `Sprzątanie zakończone częściowo (${parts.join("; ")}). ${uncertainFailure ? "Wynik żądania DELETE jest niepewny; serwer mógł nadal przetwarzać operację. " : ""}Nie ponawiano DELETE.`,
      { cause: uncertainFailure },
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
