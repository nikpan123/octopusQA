import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteTestTeacher,
  cleanupTeacherBatch,
  cleanupSuccessfulTeacher,
  validateTeacherRun,
  parseCleanupArgs,
} from "./cleanup-teachers.mjs";
import { belongsToCleanupBatch } from "./cleanup-global-teardown.mjs";

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
  assert.deepEqual(parseCleanupArgs(["--all"]), { all: true, apply: false, files: [] });
  assert.deepEqual(parseCleanupArgs(["--all", "--apply"]), { all: true, apply: true, files: [] });
  assert.deepEqual(parseCleanupArgs([]), { all: false, apply: false, files: [] });
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

  await cleanupTeacherBatch(page, selected, async () => {});

  const deletes = page.calls.filter((call) => call.method === "DELETE");
  assert.equal(deletes.length, 3);
  assert.equal(JSON.parse(deletes[0].params.jsonData).length, 10);
  assert.equal(JSON.parse(deletes[1].params.jsonData).length, 10);
  assert.equal(JSON.parse(deletes[2].params.jsonData).length, 6);
  assert(selected.every(({ run: item }) => item.cleanupStatus === "DELETED"));
});
