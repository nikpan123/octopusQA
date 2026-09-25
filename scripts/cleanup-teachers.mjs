import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { ensureSession, restoreSession } from "./auth.mjs";

const origin = "https://octopus.gwodev.pl";

const failedTestResults = new Set(["FAIL", "FAILED", "TIMEDOUT", "INTERRUPTED"]);

/*
 * =========================================================
 * WALIDACJA REJESTRU TESTU
 * =========================================================
 */

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

  if (!/^[1-9]\d*$/.test(run.teacherId ?? "") || !Number.isSafeInteger(Number(run.teacherId))) {
    throw new Error("Niepoprawne ID nauczyciela.");
  }

  const runId = run.runId ?? run.id;

  if (
    !/^REG_\d+_[a-f0-9]{6}$/.test(runId ?? "") ||
    run.email !== `${runId.toLowerCase()}@example.invalid`
  ) {
    throw new Error("Brak jednoznacznych danych własnego nauczyciela testowego.");
  }

  const expectedEmail = Object.hasOwn(run, "teacherEmail") ? run.teacherEmail : run.email;

  if (typeof expectedEmail !== "string") {
    throw new Error("Brak oczekiwanego e-maila nauczyciela.");
  }

  if (expectedEmail === "" && !run.teacherLastName) {
    throw new Error("Nauczyciel bez e-maila wymaga oczekiwanego nazwiska.");
  }
}

/*
 * =========================================================
 * PORÓWNANIE REKORDU OCTOPUSA Z REJESTREM TESTU
 * =========================================================
 */

function teacherMatchesRun(teacher, run) {
  const expectedEmail = Object.hasOwn(run, "teacherEmail") ? run.teacherEmail : run.email;

  const emailMatches =
    String(teacher?.email ?? "")
      .trim()
      .toLowerCase() === expectedEmail.trim().toLowerCase();

  const lastNameMatches =
    !run.teacherLastName || String(teacher?.lastName ?? "").trim() === run.teacherLastName.trim();

  return String(teacher?.id) === run.teacherId && emailMatches && lastNameMatches;
}

/*
 * =========================================================
 * API
 * =========================================================
 *
 * Żądania wykonujemy w zalogowanej przeglądarce.
 * Token nie opuszcza strony.
 */

async function api(page, pathname, method = "GET", params = {}) {
  if (new URL(page.url()).origin !== origin) {
    throw new Error("Sprzątanie dostępne tylko na Octopus dev.");
  }

  return page.evaluate(
    async ({ pathname, method, params }) => {
      if (location.origin !== "https://octopus.gwodev.pl") {
        throw new Error("Nieoczekiwana zmiana środowiska.");
      }

      const userId = localStorage.getItem("id");

      let token = localStorage.getItem("token");

      try {
        token = JSON.parse(token);
      } catch {
        /*
         * Token bywa zwykłym tekstem.
         */
      }

      if (!token || !/^[1-9]\d*$/.test(userId ?? "")) {
        throw new Error("Brak aktualnej sesji sprzątania.");
      }

      const url = new URL(pathname, location.origin);

      if (method === "DELETE") {
        params.userId = userId;
      }

      url.search = new URLSearchParams(params).toString();

      const response = await fetch(url, {
        method,

        headers: {
          Authorization: `Bearer ${token}`,
        },

        redirect: "error",

        /*
         * Zbiorcze usuwanie z zależnościami
         * może trwać dłużej niż zwykły odczyt.
         */
        signal: AbortSignal.timeout(method === "DELETE" ? 180_000 : 30_000),
      });

      let data = null;

      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch {
          /*
           * Odrzucone poniżej.
           */
        }
      }

      return {
        status: response.status,

        data,
      };
    },
    {
      pathname,
      method,
      params,
    },
  );
}

/*
 * =========================================================
 * USUNIĘCIE JEDNEGO NAUCZYCIELA
 * =========================================================
 *
 * Domyślnie nadal wymagamy flagi Testowy.
 *
 * --allow-unmarked pozwala ominąć WYŁĄCZNIE
 * brak flagi Testowy.
 *
 * Nadal bezwzględnie wymagamy zgodności:
 *
 * - teacherId,
 * - e-maila,
 * - nazwiska, jeśli jest zapisane w runie,
 * - kontrolnego REG_*,
 * - domeny example.invalid.
 */

export async function deleteTestTeacher(page, run, { allowUnmarked = false } = {}) {
  validateTeacherRun(run);

  const endpoint = `/api/Teacher/${run.teacherId}`;

  const before = await api(page, endpoint);

  if (before.status === 204) {
    return "ALREADY_ABSENT";
  }

  /*
   * Nawet z --allow-unmarked nie wolno
   * usunąć rekordu, który nie odpowiada
   * rejestrowi automatu.
   */
  if (before.status !== 200 || !teacherMatchesRun(before.data, run)) {
    throw new Error("Dane nauczyciela nie zgadzają się z rejestrem; nie wykonano DELETE.");
  }

  const tested = await api(page, "/api/Teacher/GetTeacherIsTested", "GET", {
    teacherId: run.teacherId,
  });

  /*
   * Błąd endpointu sprawdzającego flagę
   * NIE może być traktowany jak
   * zwykły brak flagi.
   */
  if (tested.status !== 200) {
    throw new Error("Nie udało się sprawdzić flagi Testowy; nie wykonano DELETE.");
  }

  if (tested.data !== true) {
    if (!allowUnmarked) {
      throw new Error(
        "Nauczyciel nie ma flagi Testowy; nie wykonano DELETE. " +
          "Jeżeli rekord pochodzi z automatu, użyj --allow-unmarked.",
      );
    }

    console.warn(
      `Nauczyciel ${run.teacherId}: brak flagi Testowy, ` +
        "ale rekord jest jednoznacznie zgodny z rejestrem automatu; " +
        "usunięcie dozwolone przez --allow-unmarked.",
    );
  }

  const result = await api(page, "/api/DeleteRecordsDB/DeleteRecordsFromDB", "DELETE", {
    jsonData: JSON.stringify([
      {
        nauczycielId: Number(run.teacherId),
      },
    ]),
  });

  /*
   * HTTP 200 nie dowodzi jeszcze
   * biznesowego sukcesu operacji.
   */
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Usuwanie zwróciło HTTP ${result.status}; sprawdź stan rekordu.`);
  }

  /*
   * Potwierdzamy faktyczny brak rekordu.
   */
  const after = await api(page, endpoint);

  if (after.status !== 204) {
    throw new Error("Nie potwierdzono usunięcia nauczyciela; sprawdź stan rekordu.");
  }

  return "DELETED";
}

/*
 * =========================================================
 * AUTOMATYCZNY CLEANUP PO POPRAWNYM TEŚCIE
 * =========================================================
 *
 * Tutaj CELOWO nie używamy allowUnmarked.
 *
 * Automatyczne sprzątanie nadal wymaga
 * flagi Testowy.
 */

export async function cleanupSuccessfulTeacher(page, run, save) {
  if (!run.teacherId) {
    return;
  }

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

/*
 * =========================================================
 * ARGUMENTY CLI
 * =========================================================
 */

export function parseCleanupArgs(args) {
  const apply = args.includes("--apply");

  const all = args.includes("--all");

  const includeFailed = args.includes("--include-failed");

  const allowUnmarked = args.includes("--allow-unmarked");

  const files = args.filter(
    (argument) => !["--apply", "--all", "--include-failed", "--allow-unmarked"].includes(argument),
  );

  if (files.some((file) => !/^REG_\d+_[a-f0-9]{6}\.json$/.test(file))) {
    throw new Error(
      "Podaj pełne nazwy plików z kolumny rejestr albo --all. " +
        "Wykonanie wymaga --apply (z dwoma myślnikami).",
    );
  }

  if (all && files.length) {
    throw new Error("Wybierz --all albo konkretne nazwy rejestrów, nie oba naraz.");
  }

  if (apply && !all && !includeFailed && !files.length) {
    throw new Error("--apply wymaga listy rejestrów, --all albo --include-failed.");
  }

  /*
   * Nie dodajemy allowUnmarked: false
   * do wyniku, żeby dotychczasowe testy
   * parseCleanupArgs nie wymagały zmian.
   */
  return {
    apply,
    all,
    includeFailed,

    ...(allowUnmarked
      ? {
          allowUnmarked: true,
        }
      : {}),

    files,
  };
}

/*
 * =========================================================
 * CLI
 * =========================================================
 */

async function main() {
  const parsed = parseCleanupArgs(process.argv.slice(2));

  const { apply, includeFailed, files } = parsed;

  const allowUnmarked = parsed.allowUnmarked === true;

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  const dir = path.join(root, "runs");

  const names = files.length
    ? [...new Set(files)]
    : (await readdir(dir)).filter((file) => /^REG_\d+_[a-f0-9]{6}\.json$/.test(file));

  const selected = [];

  for (const name of names) {
    const run = JSON.parse(await readFile(path.join(dir, name), "utf8"));

    if (!run.teacherId || ["DELETED", "ALREADY_ABSENT"].includes(run.cleanupStatus)) {
      continue;
    }

    try {
      validateTeacherRun(run, {
        includeFailed,
      });
    } catch (error) {
      /*
       * Przy podaniu konkretnego pliku
       * błąd traktujemy jako istotny.
       *
       * Przy zbiorczym wyszukiwaniu
       * pomijamy rejestry niespełniające
       * kryteriów.
       */
      if (files.length) {
        throw error;
      }

      continue;
    }

    selected.push({
      name,
      run,
    });
  }

  console.table(
    selected.map(({ name, run }) => ({
      rejestr: name,

      teacherId: run.teacherId,

      wynik: run.result,
    })),
  );

  /*
   * =======================================================
   * PREVIEW
   * =======================================================
   */

  if (!apply) {
    console.log(
      `PODGLĄD lokalny — bez usuwania. Lista obejmuje ${
        includeFailed
          ? "rejestry PASS oraz zakończone nieudane testy"
          : "wyłącznie poprawne rejestry PASS"
      }.`,
    );

    if (allowUnmarked) {
      console.warn(
        "UWAGA: podano --allow-unmarked. " +
          "Przy --apply brak flagi Testowy nie zablokuje DELETE, " +
          "jeżeli ID i dane nauczyciela dokładnie zgadzają się z rejestrem automatu.",
      );
    }

    const allowUnmarkedFlag = allowUnmarked ? " --allow-unmarked" : "";

    console.log(
      includeFailed
        ? "Wszystkie pokazane rejestry: " +
            "npm.cmd run cleanup:teachers -- --include-failed" +
            allowUnmarkedFlag +
            " --apply"
        : "Wszystkie pokazane rejestry: " +
            "npm.cmd run cleanup:teachers -- --all" +
            allowUnmarkedFlag +
            " --apply",
    );

    console.log(
      `Wybrane: npm.cmd run cleanup:teachers -- <pełna nazwa z kolumny rejestr>${
        includeFailed ? " --include-failed" : ""
      }${allowUnmarkedFlag} --apply`,
    );

    return;
  }

  /*
   * =======================================================
   * APPLY
   * =======================================================
   */

  if (allowUnmarked) {
    console.warn(
      "UWAGA: aktywne --allow-unmarked. " +
        "Rekord bez flagi Testowy może zostać usunięty WYŁĄCZNIE, " +
        "jeżeli jego ID i dane dokładnie zgadzają się z rejestrem testu.",
    );
  }

  await cleanupTeacherRecords(dir, selected, {
    includeFailed,
    allowUnmarked,
  });
}

/*
 * =========================================================
 * CLEANUP ZBIORCZY — URUCHOMIENIE PRZEGLĄDARKI
 * =========================================================
 */

export async function cleanupTeacherRecords(
  dir,
  selected,
  { includeFailed = false, allowUnmarked = false } = {},
) {
  if (!selected.length) {
    return;
  }

  const auth = await ensureSession();

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      storageState: auth.storageState,
    });

    await restoreSession(context, auth.session);

    const page = await context.newPage();

    await page.goto(`${origin}/teacher/teacher-panel`);

    await page
      .getByRole("button", {
        name: "Wyloguj",
        exact: true,
      })
      .waitFor();

    await cleanupTeacherBatch(
      page,
      selected,

      async ({ name, run }) => {
        await writeFile(path.join(dir, name), JSON.stringify(run, null, 2));
      },

      {
        includeFailed,
        allowUnmarked,
      },
    );
  } finally {
    await browser.close();
  }
}

/*
 * =========================================================
 * CLEANUP ZBIORCZY
 * =========================================================
 */

export async function cleanupTeacherBatch(
  page,
  selected,
  save,
  { includeFailed = false, allowUnmarked = false } = {},
) {
  const pending = [];

  const unique = new Map();

  /*
   * =======================================================
   * WALIDACJA CAŁEJ LISTY
   * =======================================================
   *
   * Najpierw sprawdzamy wszystkie rekordy.
   *
   * Nie usuwamy części danych,
   * zanim nie upewnimy się, że cała lista
   * jest spójna.
   */

  for (const entry of selected) {
    validateTeacherRun(entry.run, {
      includeFailed,
    });

    const previous = unique.get(entry.run.teacherId);

    if (previous && previous.run.email !== entry.run.email) {
      throw new Error("Sprzeczne rejestry tego samego nauczyciela.");
    }

    if (!previous) {
      unique.set(entry.run.teacherId, entry);
    }
  }

  /*
   * Aktualizujemy wszystkie rejestry
   * wskazujące tego samego nauczyciela.
   */

  const update = async (id, status) => {
    for (const entry of selected.filter((entry) => entry.run.teacherId === id)) {
      entry.run.cleanupStatus = status;

      if (["DELETED", "ALREADY_ABSENT"].includes(status)) {
        entry.run.cleanupFinishedAt = new Date().toISOString();
      }

      await save(entry);
    }
  };

  /*
   * =======================================================
   * PREFLIGHT
   * =======================================================
   *
   * Zanim zostanie wykonany jakikolwiek DELETE:
   *
   * 1. sprawdzamy, czy nauczyciel istnieje,
   * 2. porównujemy jego dane z runem,
   * 3. sprawdzamy flagę Testowy,
   * 4. ewentualnie świadomie dopuszczamy
   *    brak Testowy przez --allow-unmarked.
   */

  for (const { run } of unique.values()) {
    const before = await api(page, `/api/Teacher/${run.teacherId}`);

    if (before.status === 204) {
      await update(run.teacherId, "ALREADY_ABSENT");

      console.log(`${run.teacherId}: ALREADY_ABSENT`);

      continue;
    }

    /*
     * To zabezpieczenie działa ZAWSZE,
     * również z --allow-unmarked.
     */
    if (before.status !== 200 || !teacherMatchesRun(before.data, run)) {
      throw new Error(
        `Nauczyciel ${run.teacherId}: dane nie zgadzają się z rejestrem; nie wykonano DELETE.`,
      );
    }

    const tested = await api(page, "/api/Teacher/GetTeacherIsTested", "GET", {
      teacherId: run.teacherId,
    });

    /*
     * Problem z samym endpointem
     * nie jest traktowany jako brak flagi.
     */
    if (tested.status !== 200) {
      throw new Error(
        `Nauczyciel ${run.teacherId}: nie udało się sprawdzić flagi Testowy; nie wykonano DELETE.`,
      );
    }

    if (tested.data !== true) {
      if (!allowUnmarked) {
        throw new Error(
          `Nauczyciel ${run.teacherId}: brak flagi Testowy; ` +
            "nie wykonano DELETE. " +
            "Jeżeli rekord pochodzi z automatu, użyj --allow-unmarked.",
        );
      }

      console.warn(
        `Nauczyciel ${run.teacherId}: brak flagi Testowy, ` +
          "ale ID i dane nauczyciela są zgodne z rejestrem automatu; " +
          "usunięcie dozwolone przez --allow-unmarked.",
      );
    }

    pending.push(run.teacherId);
  }

  if (!pending.length) {
    return;
  }

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  const failures = [];

  let uncertainFailure;

  /*
   * Endpoint usuwa rozbudowany graf zależności.
   *
   * Paczki po 25 rekordów kończyły się 503
   * podczas pełnej regresji.
   *
   * Mniejsze paczki ograniczają
   * szczyt obciążenia.
   */
  const batchSize = 10;

  const batchCount = Math.ceil(pending.length / batchSize);

  for (let offset = 0; offset < pending.length; offset += batchSize) {
    const batch = pending.slice(offset, offset + batchSize);

    const batchNumber = offset / batchSize + 1;

    for (const id of batch) {
      await update(id, "RUNNING");
    }

    let deleteError;

    try {
      console.log(
        `Żądanie DELETE ${batchNumber}/${batchCount} ` +
          `dla ${batch.length} nauczycieli (limit 180 s).`,
      );

      const result = await api(page, "/api/DeleteRecordsDB/DeleteRecordsFromDB", "DELETE", {
        jsonData: JSON.stringify(
          batch.map((id) => ({
            nauczycielId: Number(id),
          })),
        ),
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Zbiorcze usuwanie zwróciło HTTP ${result.status}.`);
      }
    } catch (error) {
      /*
       * Timeout przerywa oczekiwanie klienta,
       * ale serwer może nadal kontynuować operację.
       *
       * Nie ponawiamy DELETE.
       *
       * Sprawdzamy stan każdego rekordu
       * samymi odczytami.
       */

      deleteError = error;

      uncertainFailure = error;

      for (const id of batch) {
        await update(id, "UNKNOWN");
      }

      console.warn(
        "Nie otrzymano potwierdzenia DELETE. " + "Sprawdzam stan rekordów bez ponawiania usuwania.",
      );
    }

    /*
     * =====================================================
     * WERYFIKACJA PO DELETE
     * =====================================================
     */

    const batchFailures = [];

    for (const id of batch) {
      try {
        const after = await api(page, `/api/Teacher/${id}`);

        if (after.status !== 204) {
          throw new Error("Rekord nadal istnieje lub odczyt się nie powiódł.");
        }

        await update(id, "DELETED");

        console.log(`${id}: DELETED`);
      } catch {
        await update(id, deleteError ? "UNKNOWN" : "FAILED");

        failures.push(id);

        batchFailures.push(id);
      }
    }

    /*
     * Jeżeli DELETE miał niepewny wynik
     * i część rekordów nadal istnieje,
     * nie przechodzimy do kolejnych paczek.
     */
    if (deleteError && batchFailures.length) {
      break;
    }
  }

  /*
   * =======================================================
   * PODSUMOWANIE BŁĘDÓW
   * =======================================================
   */

  if (failures.length) {
    throw new Error(
      `Nie potwierdzono usunięcia nauczycieli: ${failures.join(", ")}. ` +
        `${
          uncertainFailure
            ? "Wynik żądania jest niepewny; serwer mógł nadal przetwarzać operację. "
            : ""
        }` +
        "Nie ponawiano DELETE.",
      {
        cause: uncertainFailure,
      },
    );
  }
}

/*
 * =========================================================
 * URUCHOMIENIE BEZPOŚREDNIE
 * =========================================================
 */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);

    process.exitCode = 1;
  });
}
