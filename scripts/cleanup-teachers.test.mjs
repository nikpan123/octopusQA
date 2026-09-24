import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteTestTeacher,
  cleanupTeacherBatch,
  cleanupSuccessfulTeacher,
  validateTeacherRun,
  parseCleanupArgs,
  getTeacherEntries,
} from "./cleanup-teachers.mjs";
import { belongsToCleanupBatch } from "./cleanup-global-teardown.mjs";

// cleanupTeacherBatch() zapisuje status sprzątania w run.teachers (JSON),
// nie w płaskim run.cleanupStatus - ten helper czyta go z powrotem po ID.
function entryStatus(run, teacherId) {
  return getTeacherEntries(run).find((entry) => entry.teacherId === teacherId)?.cleanupStatus;
}

test("koniec zestawu wybiera tylko własny batch i udanych nauczycieli", () => {
  const data = { ...run(), cleanupBatchId: "current", cleanupStatus: "PENDING_SUITE_END" };
  assert.equal(belongsToCleanupBatch(data, "current"), true);
  for (const changes of [
    { cleanupBatchId: "older" },
    { result: "FAIL" },
    { result: "RUNNING" },
    { teacherId: "" },
    { cleanupStatus: "DELETED" },
    { cleanupStatus: "ALREADY_ABSENT" },
  ]) {
    assert.equal(belongsToCleanupBatch({ ...data, ...changes }, "current"), false);
  }
  assert.equal(belongsToCleanupBatch({ ...data, cleanupBatchId: "" }, ""), false);
});

test("--all domyślnie pokazuje podgląd; wykonanie wymaga --apply", () => {
  assert.deepEqual(parseCleanupArgs(["--all"]), {
    all: true,
    apply: false,
    includeFailed: false,
    includeUntested: false,
    files: [],
  });
  assert.deepEqual(parseCleanupArgs(["--all", "--apply"]), {
    all: true,
    apply: true,
    includeFailed: false,
    includeUntested: false,
    files: [],
  });
  assert.deepEqual(parseCleanupArgs([]), {
    all: false,
    apply: false,
    includeFailed: false,
    includeUntested: false,
    files: [],
  });
  assert.deepEqual(parseCleanupArgs(["--include-failed", "--apply"]), {
    all: false,
    apply: true,
    includeFailed: true,
    includeUntested: false,
    files: [],
  });
  assert.deepEqual(parseCleanupArgs(["--all", "--include-untested", "--apply"]), {
    all: true,
    apply: true,
    includeFailed: false,
    includeUntested: true,
    files: [],
  });
});
test("odrzuca niejednoznaczne lub błędne argumenty", () => {
  for (const args of [
    ["--apply"],
    ["apply"],
    ["--all", "REG_123456_abcdef.json"],
    ["--al", "--apply"],
    ["../REG_123456_abcdef.json"],
  ]) {
    assert.throws(() => parseCleanupArgs(args));
  }
  assert.deepEqual(parseCleanupArgs(["REG_123456_abcdef.json", "--apply"]), {
    all: false,
    apply: true,
    includeFailed: false,
    includeUntested: false,
    files: ["REG_123456_abcdef.json"],
  });
});

const run = () => ({
  id: "REG_123456_abcdef",
  teacherId: "123",
  email: "reg_123456_abcdef@example.invalid",
  result: "PASS",
});
const phoneOnlyRun = () => ({ ...run(), teacherEmail: "", teacherLastName: "Telefonlimit" });
function pageWith(responses, origin = "https://octopus.gwodev.pl") {
  const calls = [];
  return {
    calls,
    url: () => origin + "/teacher/teacher-panel",
    evaluate: async (_fn, args) => {
      calls.push(args);
      assert(responses.length, "Nieoczekiwane żądanie");
      return responses.shift();
    },
  };
}
test("nieudany test pozostawia dane bez żądań API", async () => {
  const data = { ...run(), result: "FAIL" };
  const page = pageWith([]);
  await cleanupSuccessfulTeacher(page, data, async () => {});
  assert.equal(data.cleanupStatus, "KEPT_FAILED_TEST");
  assert.equal(page.calls.length, 0);
});
test("odrzuca nieprawidłowe ID i obcy adres e-mail", () => {
  for (const changes of [
    { teacherId: "1&x=2" },
    { teacherId: "9007199254740993" },
    { email: "person@example.com" },
    { result: "RUNNING" },
  ]) {
    assert.throws(() => validateTeacherRun({ ...run(), ...changes }));
  }
  assert.throws(() => validateTeacherRun({ ...run(), teacherEmail: "" }));
  const failed = { ...run(), result: "FAILED" };
  assert.throws(() => validateTeacherRun(failed));
  assert.doesNotThrow(() => validateTeacherRun(failed, { includeFailed: true }));
});

test("jawna opcja pozwala usunąć poprawnie zweryfikowany rekord nieudanego testu", async () => {
  const failed = { ...run(), result: "FAILED" };
  const teacherId = failed.teacherId;
  const page = pageWith([
    { status: 200, data: { id: 123, email: failed.email } },
    { status: 200, data: true },
    { status: 200, data: {} },
    { status: 204, data: null },
  ]);

  await cleanupTeacherBatch(page, [{ name: `${failed.id}.json`, run: failed }], async () => {}, {
    includeFailed: true,
  });

  assert.equal(entryStatus(failed, teacherId), "DELETED");
  assert.equal(page.calls.filter((call) => call.method === "DELETE").length, 1);
});
test("nie wysyła żądań poza dev", async () => {
  const page = pageWith([], "https://example.com");
  await assert.rejects(deleteTestTeacher(page, run()));
  assert.equal(page.calls.length, 0);
});
test("nie usuwa rekordu z innym e-mailem ani bez flagi Testowy", async () => {
  for (const responses of [
    [{ status: 200, data: { id: 123, email: "other@example.invalid" } }],
    [
      { status: 200, data: { id: 123, email: run().email } },
      { status: 200, data: false },
    ],
  ]) {
    const page = pageWith(responses);
    await assert.rejects(deleteTestTeacher(page, run()));
    assert(!page.calls.some((c) => c.method === "DELETE"));
  }
});
test("--include-untested usuwa mimo braku flagi Testowy, ale nadal wymaga zgodności tożsamości", async () => {
  const untested = pageWith([
    { status: 200, data: { id: 123, email: run().email } },
    { status: 200, data: false },
    { status: 200, data: {} },
    { status: 204, data: null },
  ]);
  assert.equal(
    await deleteTestTeacher(untested, run(), { includeUntested: true }),
    "DELETED",
  );

  // Zgodność ID/e-maila/nazwiska pozostaje obowiązkowa nawet z --include-untested.
  const mismatch = pageWith([{ status: 200, data: { id: 123, email: "other@example.invalid" } }]);
  await assert.rejects(deleteTestTeacher(mismatch, run(), { includeUntested: true }));
  assert(!mismatch.calls.some((c) => c.method === "DELETE"));
});

test("cleanupTeacherBatch z --include-untested usuwa całą paczkę mimo braku flagi Testowy", async () => {
  const good = {
    id: "REG_800001_dddddd",
    teacherId: "801",
    email: "reg_800001_dddddd@example.invalid",
    result: "PASS",
  };
  const untested = {
    id: "REG_800002_eeeeee",
    teacherId: "802",
    email: "reg_800002_eeeeee@example.invalid",
    result: "PASS",
  };
  const selected = [good, untested].map((item) => ({ name: `${item.id}.json`, run: item }));
  const page = pageWith([
    { status: 200, data: { id: 801, email: good.email } },
    { status: 200, data: true },
    { status: 200, data: { id: 802, email: untested.email } },
    { status: 200, data: false },
    { status: 200, data: {} },
    { status: 204, data: null },
    { status: 204, data: null },
  ]);

  await cleanupTeacherBatch(page, selected, async () => {}, { includeUntested: true });

  assert.equal(entryStatus(good, "801"), "DELETED");
  assert.equal(entryStatus(untested, "802"), "DELETED");
  const deletes = page.calls.filter((call) => call.method === "DELETE");
  assert.equal(deletes.length, 1);
  assert.deepEqual(JSON.parse(deletes[0].params.jsonData), [
    { nauczycielId: 801 },
    { nauczycielId: 802 },
  ]);
});

test("nauczyciela bez e-maila usuwa tylko po zgodności nazwiska i flagi Testowy", async () => {
  const data = phoneOnlyRun();
  const teacher = { status: 200, data: { id: 123, email: "", lastName: "Telefonlimit" } };
  const page = pageWith([
    teacher,
    { status: 200, data: true },
    { status: 200, data: {} },
    { status: 204, data: null },
  ]);
  assert.equal(await deleteTestTeacher(page, data), "DELETED");

  const mismatch = pageWith([{ status: 200, data: { id: 123, email: "", lastName: "Inny" } }]);
  await assert.rejects(deleteTestTeacher(mismatch, data));
  assert(!mismatch.calls.some((c) => c.method === "DELETE"));
});
test("brak rekordu jest idempotentny; błąd serwera nie oznacza braku", async () => {
  const page = pageWith([{ status: 204, data: null }]);
  assert.equal(await deleteTestTeacher(page, run()), "ALREADY_ABSENT");
  await assert.rejects(deleteTestTeacher(pageWith([{ status: 500, data: null }]), run()));
});
test("DELETE zawiera tylko własny ID i wymaga potwierdzenia braku rekordu", async () => {
  const responses = [
    { status: 200, data: { id: 123, email: run().email } },
    { status: 200, data: true },
    { status: 200, data: {} },
    { status: 204, data: null },
  ];
  const page = pageWith(responses);
  assert.equal(await deleteTestTeacher(page, run()), "DELETED");
  assert.deepEqual(page.calls[2], {
    pathname: "/api/DeleteRecordsDB/DeleteRecordsFromDB",
    method: "DELETE",
    params: { jsonData: '[{"nauczycielId":123}]' },
  });
});
test("HTTP 200 z istniejącym rekordem zapisuje błąd sprzątania", async () => {
  const data = run();
  const teacher = { status: 200, data: { id: 123, email: data.email } };
  const page = pageWith([teacher, { status: 200, data: true }, { status: 200, data: {} }, teacher]);
  await assert.rejects(cleanupSuccessfulTeacher(page, data, async () => {}));
  assert.equal(data.cleanupStatus, "FAILED");
});
test("dużą listę usuwa w osobno potwierdzanych paczkach po 10 nauczycieli", async () => {
  const selected = Array.from({ length: 26 }, (_, index) => {
    const id = `REG_${100000 + index}_abcdef`;
    return {
      name: `${id}.json`,
      run: {
        id,
        teacherId: String(1000 + index),
        email: `${id.toLowerCase()}@example.invalid`,
        result: "PASS",
      },
    };
  });
  const validationResponses = selected.flatMap(({ run: item }) => [
    { status: 200, data: { id: Number(item.teacherId), email: item.email } },
    { status: 200, data: true },
  ]);
  const page = pageWith([
    ...validationResponses,
    { status: 200, data: {} },
    ...Array.from({ length: 10 }, () => ({ status: 204, data: null })),
    { status: 200, data: {} },
    ...Array.from({ length: 10 }, () => ({ status: 204, data: null })),
    { status: 200, data: {} },
    ...Array.from({ length: 6 }, () => ({ status: 204, data: null })),
  ]);

  const teacherIds = selected.map(({ run: item }) => item.teacherId);
  await cleanupTeacherBatch(page, selected, async () => {});

  const deletes = page.calls.filter((call) => call.method === "DELETE");
  assert.equal(deletes.length, 3);
  assert.equal(JSON.parse(deletes[0].params.jsonData).length, 10);
  assert.equal(JSON.parse(deletes[1].params.jsonData).length, 10);
  assert.equal(JSON.parse(deletes[2].params.jsonData).length, 6);
  assert(
    selected.every(({ run: item }, index) => entryStatus(item, teacherIds[index]) === "DELETED"),
  );
});

/*
 * =========================================================
 * WIELU NAUCZYCIELI NA JEDEN PRZEBIEG (runs/REG_*.json)
 * =========================================================
 *
 * Test kontraktowy typu "dodawanie + edycja w jednym teście" (np.
 * CONTRACT-01) tworzy DWÓCH nauczycieli w jednym przebiegu scenariusza.
 * Przed wprowadzeniem pola `teachers` drugi nadpisywał w rejestrze
 * pierwszego - ten pierwszy nigdy nie trafiał do sprzątania, mimo
 * poprawnej flagi Testowy. Poniższe testy pilnują, żeby OBAJ zawsze
 * zostali posprzątani.
 */
function multiTeacherRun() {
  return {
    id: "REG_654321_fedcba",
    email: "reg_654321_fedcba@example.invalid",
    result: "PASS",
    teachers: JSON.stringify([
      { teacherId: "201", teacherEmail: "add-reg_654321_fedcba@example.invalid" },
      { teacherId: "202", teacherEmail: "reg_654321_fedcba@example.invalid" },
    ]),
  };
}

test("getTeacherEntries: czyta wiele wpisów z pola teachers, a legacy - z płaskich pól", () => {
  const multi = multiTeacherRun();
  assert.deepEqual(
    getTeacherEntries(multi).map((e) => e.teacherId),
    ["201", "202"],
  );

  const legacy = run();
  const [legacyEntry] = getTeacherEntries(legacy);
  assert.equal(legacyEntry.teacherId, "123");
  assert.equal(legacyEntry.teacherEmail, legacy.email);
  assert.equal(legacyEntry.teacherLastName, undefined);

  assert.deepEqual(getTeacherEntries({ ...legacy, teacherId: undefined }), []);
  assert.deepEqual(getTeacherEntries({ ...multi, teachers: "" }), []);
});

test("validateTeacherRun: odrzuca niepoprawny JSON i pustą listę nauczycieli", () => {
  assert.throws(() => validateTeacherRun({ ...multiTeacherRun(), teachers: "{nie json" }));
  assert.throws(() => validateTeacherRun({ ...multiTeacherRun(), teachers: '"nie tablica"' }));
  assert.throws(() => validateTeacherRun({ ...multiTeacherRun(), teachers: "[]" }));
  assert.doesNotThrow(() => validateTeacherRun(multiTeacherRun()));
});

test("cleanupTeacherBatch: usuwa WSZYSTKICH nauczycieli z jednego przebiegu, nie tylko pierwszego", async () => {
  const data = multiTeacherRun();
  const page = pageWith([
    { status: 200, data: { id: 201, email: "add-reg_654321_fedcba@example.invalid" } },
    { status: 200, data: true },
    { status: 200, data: { id: 202, email: "reg_654321_fedcba@example.invalid" } },
    { status: 200, data: true },
    { status: 200, data: {} },
    { status: 204, data: null },
    { status: 204, data: null },
  ]);

  await cleanupTeacherBatch(page, [{ name: `${data.id}.json`, run: data }], async () => {});

  assert.equal(entryStatus(data, "201"), "DELETED");
  assert.equal(entryStatus(data, "202"), "DELETED");
  const deletes = page.calls.filter((call) => call.method === "DELETE");
  assert.equal(deletes.length, 1);
  assert.deepEqual(JSON.parse(deletes[0].params.jsonData), [
    { nauczycielId: 201 },
    { nauczycielId: 202 },
  ]);
});

test("cleanupTeacherBatch: jeden nauczyciel bez flagi Testowy nie blokuje usunięcia pozostałych", async () => {
  const good1 = {
    id: "REG_700001_aaaaaa",
    teacherId: "701",
    email: "reg_700001_aaaaaa@example.invalid",
    result: "PASS",
  };
  const bad = {
    id: "REG_700002_bbbbbb",
    teacherId: "702",
    email: "reg_700002_bbbbbb@example.invalid",
    result: "PASS",
  };
  const good2 = {
    id: "REG_700003_cccccc",
    teacherId: "703",
    email: "reg_700003_cccccc@example.invalid",
    result: "PASS",
  };
  const selected = [good1, bad, good2].map((item) => ({ name: `${item.id}.json`, run: item }));

  const page = pageWith([
    // sprawdzenie 701 - dobry
    { status: 200, data: { id: 701, email: good1.email } },
    { status: 200, data: true },
    // sprawdzenie 702 - brak flagi Testowy
    { status: 200, data: { id: 702, email: bad.email } },
    { status: 200, data: false },
    // sprawdzenie 703 - dobry
    { status: 200, data: { id: 703, email: good2.email } },
    { status: 200, data: true },
    // jedna paczka DELETE dla 701 i 703 (702 pominięty)
    { status: 200, data: {} },
    { status: 204, data: null },
    { status: 204, data: null },
  ]);

  await assert.rejects(
    cleanupTeacherBatch(page, selected, async () => {}),
    /pominięto przed usunięciem.*702.*brak flagi Testowy/s,
  );

  assert.equal(entryStatus(good1, "701"), "DELETED");
  assert.equal(entryStatus(bad, "702"), "FAILED");
  assert.equal(entryStatus(good2, "703"), "DELETED");
  const deletes = page.calls.filter((call) => call.method === "DELETE");
  assert.equal(deletes.length, 1);
  assert.deepEqual(JSON.parse(deletes[0].params.jsonData), [
    { nauczycielId: 701 },
    { nauczycielId: 703 },
  ]);
});

test("belongsToCleanupBatch: kwalifikuje przebieg, jeśli choć jeden z wielu nauczycieli nadal czeka", () => {
  const bothPending = {
    ...multiTeacherRun(),
    cleanupBatchId: "current",
    teachers: JSON.stringify([
      { teacherId: "201", teacherEmail: "a@example.invalid", cleanupStatus: "PENDING_SUITE_END" },
      { teacherId: "202", teacherEmail: "b@example.invalid", cleanupStatus: "PENDING_SUITE_END" },
    ]),
  };
  assert.equal(belongsToCleanupBatch(bothPending, "current"), true);

  const onePending = {
    ...bothPending,
    teachers: JSON.stringify([
      { teacherId: "201", teacherEmail: "a@example.invalid", cleanupStatus: "DELETED" },
      { teacherId: "202", teacherEmail: "b@example.invalid", cleanupStatus: "PENDING_SUITE_END" },
    ]),
  };
  assert.equal(belongsToCleanupBatch(onePending, "current"), true);

  const bothDone = {
    ...bothPending,
    teachers: JSON.stringify([
      { teacherId: "201", teacherEmail: "a@example.invalid", cleanupStatus: "DELETED" },
      { teacherId: "202", teacherEmail: "b@example.invalid", cleanupStatus: "ALREADY_ABSENT" },
    ]),
  };
  assert.equal(belongsToCleanupBatch(bothDone, "current"), false);
});
