import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { expect } from "@playwright/test";
import * as names from "./test-names.mjs";

test("krótkie nazwy rozróżniają środowisko, rolę, pracownika i przebieg", () => {
  const results = new Set();
  for (const env of ["dev", "test"])
    for (const role of ["CP_ZS", "CP_SP", "CP_SPB", "CP_SOLO", "ADD_FIL"])
      for (let run = 0; run < 200; run++) {
        const name = names.automaticSchoolName("STR", role, env, `run-${run}`);
        assert.ok(name.length <= 32, name);
        assert.ok(!results.has(name), name);
        results.add(name);
      }
  for (const env of ["dev", "test"])
    for (const family of ["ORD", "QA"])
      for (const worker of [0, 1, 2, 3]) {
        const first = names.automaticSchoolName(family, `A_W${worker}`, env);
        const second = names.automaticSchoolName(family, `B_W${worker}`, env);
        assert.ok(!first.includes(second) && !second.includes(first));
      }
  assert.throws(() => names.automaticSchoolName("STR", "CP_SP", "prod"));
  assert.throws(() => names.automaticSchoolName("STR", "TOO_LONG_KEY", "dev", "scope"), /32 znaki/);
  assert.throws(() => names.automaticTeacherName(""));
});

test("szkoły uprawnień i POTW26 zachowują wąskie granice własności", () => {
  for (const env of ["dev", "test"])
    for (const key of [
      "ENT_PRIMARY_W0",
      "ENT_UNMARKED_PRIMARY_W0",
      "ENT_UNMARKED_SP_400_SECOND_POTW26_abcdef123456_P0_W0",
    ]) {
      const name = names.automaticCategorySchoolName(key, env);
      assert.ok(name.length <= 32);
      assert.ok(names.entitlementSchoolPattern(env).test(name));
      assert.equal(
        names.entitlementSchoolPattern(env, true).test(name),
        key.startsWith("ENT_UNMARKED_"),
      );
      assert.equal(names.isPackageOrderSchool(name), env === "dev" && key.includes("POTW26"));
      assert.ok(!names.entitlementSchoolPattern(env === "dev" ? "test" : "dev").test(name));
      assert.ok(!names.entitlementSchoolPattern(env).test(name + "x"));
    }
  assert.equal(names.isPackageOrderSchool("AUTO_CAT_D_EU_abcdef123456"), false);
  assert.equal(names.isPackageOrderSchool("AUTO_CAT_D_P26_abcdef123456x"), false);
  assert.equal(
    names.automaticCategorySchoolName("SORT_A", "dev"),
    names.automaticSchoolPrefix("CAT", "dev") + "SORT_A",
  );
});

test("losowanie rocznej medalowości wyklucza nowe i dawne rekordy automatyczne", () => {
  for (const name of [
    "AUTO_SP_D_abcdef123456",
    "Auto_abcdef123456",
    "AUTO_STR_DEV_COPY_SP",
    "REG_123456_abcdef Szkoła testowa",
    "AUTOMAT CLUB DEV SP A",
  ])
    assert.equal(names.isAutomaticRecordName(name), true, name);
  assert.equal(names.isAutomaticRecordName("Szkoła Podstawowa nr 5"), false);
});

function loadSupport(file, modules) {
  const code = ts.transpileModule(
    readFileSync(new URL(`../tests/support/${file}.ts`, import.meta.url), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    URL,
    process: { env: {} },
    require: (id) => {
      assert.ok(id in modules, `Nieoczekiwana zależność: ${id}`);
      return modules[id];
    },
  });
  return exports;
}

test("scenariusz używa krótkiej nazwy, ale zachowuje pełny rejestr i tożsamość cleanupu", async () => {
  let fixtures;
  const writes = new Map();
  const created = [];
  const { test: support } = loadSupport("scenario", {
    "node:crypto": { randomUUID: () => "abcdef00-0000-0000-0000-000000000000" },
    "node:fs/promises": {
      mkdir: async () => {},
      writeFile: async (file, body) => writes.set(file, JSON.parse(body)),
    },
    "./fixtures": {
      test: {
        extend: (value) => {
          fixtures = value;
          return value;
        },
      },
      expect,
    },
    "./environment": { OCTOPUS_ENV: "test", OCTOPUS_BASE_URL: "https://octopus.gwotest.pl" },
    "./octopus": {
      Octopus: class {
        async openPanel() {}
      },
    },
    "../../scripts/test-names.mjs": names,
  });
  assert.equal(support, fixtures);
  await fixtures.scenario(
    {
      page: { url: () => "about:blank" },
      apiFactory: {
        createTeacher: async (value) => {
          created.push(value);
          return "123";
        },
      },
      performanceMetrics: { measure: (_label, work) => work() },
    },
    async (s) => {
      assert.match(s.id, /^AUTO_[a-f0-9]{12}$/);
      assert.match(s.runId, /^REG_\d+_abcdef$/);
      assert.equal(s.email, `${s.runId.toLowerCase()}@example.invalid`);
      assert.match(s.schoolName, /^AUTO_SZ_T_[a-f0-9]{12}$/);
      await s.createTeacher("456", "Szkoła", { openPanel: false, testRecord: false });
      assert.equal(created[0].lastName, s.id);
      assert.equal(created[0].email, s.email);
      const saved = writes.get(`runs/${s.runId}.json`);
      assert.equal(saved.id, s.runId);
      assert.equal(saved.displayId, s.id);
      assert.equal(saved.environment, "test");
    },
    { title: "local", status: "passed", attach: async () => {} },
  );
  assert.equal([...writes.values()][0].cleanupStatus, "PENDING_SUITE_END");
});

test("fabryka bez flagi przyjmuje krótkie nazwisko tylko z pasującą tożsamością rejestru", async () => {
  const { OctopusApiFactory } = loadSupport("api-factory", {
    "@playwright/test": { expect },
    "./api-step": { apiStep: (_label, action) => action() },
    "../../scripts/test-names.mjs": names,
  });
  const requests = [];
  const factory = new OctopusApiFactory(
    {
      post: async (url, options) => {
        requests.push({ url, data: options.data });
        return {
          ok: () => true,
          status: () => 200,
          text: async () =>
            url.endsWith("AddTeacher") ? JSON.stringify({ ...options.data, id: 123 }) : "",
        };
      },
    },
    {
      session: { origin: "https://octopus.gwotest.pl" },
      storageState: {
        origins: [
          {
            origin: "https://octopus.gwotest.pl",
            localStorage: [
              { name: "id", value: "1" },
              { name: "token", value: '"local"' },
            ],
          },
        ],
      },
    },
    { measure: (_label, action) => action(), increment() {} },
  );
  const run = "REG_123456_abcdef";
  const input = {
    testRecord: false,
    lastName: names.automaticTeacherName(run),
    email: `${run.toLowerCase()}@example.invalid`,
    schoolIds: ["456"],
    subjectLevels: [],
  };
  assert.equal(await factory.createTeacher(input), "123");
  assert.equal(requests[0].data.firstName, "Auto");
  assert.equal(
    requests.some((r) => r.url.includes("InsertIntoTestTeachers")),
    false,
  );
  const count = requests.length;
  for (const changes of [
    { lastName: "Obcy" },
    { lastName: names.automaticTeacherName("another") },
    { email: "person@example.com" },
  ])
    await assert.rejects(factory.createTeacher({ ...input, ...changes }));
  assert.equal(requests.length, count);
});

test("API zamówień przyjmuje krótkie szkoły właściwego obszaru i środowiska", () => {
  const { OrderClassApi } = loadSupport("order-class", {
    "../../scripts/test-names.mjs": names,
    "./api-step": {},
    "./browser-session": {},
    "@playwright/test": { expect },
    "./scenario": { test: { extend: () => ({}) } },
    "./environment": { OCTOPUS_ENV: "dev", OCTOPUS_BASE_URL: "https://octopus.gwodev.pl" },
    "./order-scenario": {},
    "./order": {},
  });
  const create = (name) => new OrderClassApi({}, {}, 1, { id: "123", name }, {});
  for (const name of [
    names.automaticSchoolName("ORD", "A_W0", "dev"),
    names.automaticSchoolName("ORD", "B_W1", "dev"),
    names.automaticSchoolName("STR", "CP_SP", "dev", "run-1"),
    names.automaticCategorySchoolName("ENT_UNMARKED_PRIMARY_W0", "dev"),
    names.automaticCategorySchoolName(
      "ENT_UNMARKED_SP_400_SECOND_POTW26_abcdef123456_P0_W0",
      "dev",
    ),
  ])
    assert.doesNotThrow(() => create(name));
  for (const name of [
    names.automaticSchoolName("ORD", "A_W0", "test"),
    names.automaticSchoolName("QA", "A_W0", "dev"),
    names.automaticSchoolName("STR", "OFF", "dev"),
    "Szkoła podstawowa",
  ])
    assert.throws(() => create(name));
});

test("kontrola szkół bez flagi przyjmuje aktualne nazwy i nadal odrzuca obce dane oraz flagę Testowy", async () => {
  const uiExpect = (value) =>
    typeof value === "string"
      ? expect(value)
      : {
          toHaveValue: async (expected) => assert.equal(value.value, expected),
          not: { toBeChecked: async () => assert.equal(value.checked, false) },
        };
  const { expectUnmarkedRecords } = loadSupport("access-regression", {
    "@playwright/test": { expect: uiExpect },
    "../../scripts/test-names.mjs": names,
    "./environment": { OCTOPUS_ENV: "dev" },
    "./entitlements": { test: { step: async (_title, action) => action() } },
  });
  const check = async (
    schoolName,
    { schoolFlag = false, teacherFlag = false, wrongName = false } = {},
  ) => {
    let panel;
    const data = {
      schools: [{ id: "123", name: schoolName }],
      teacherId: "456",
      scenario: {
        id: "AUTO_abcdef123456",
        app: {
          openPanel: async (kind) => {
            panel = kind;
          },
          detail: () => ({
            value: wrongName ? "Inna nazwa" : panel === "school" ? schoolName : "AUTO_abcdef123456",
          }),
        },
      },
      page: { getByRole: () => ({ checked: panel === "school" ? schoolFlag : teacherFlag }) },
    };
    await expectUnmarkedRecords(data);
  };
  for (const name of [
    names.automaticCategorySchoolName("ENT_UNMARKED_PRIMARY_PROMO_NCL_01", "dev"),
    names.automaticCategorySchoolName(
      "ENT_UNMARKED_SP_400_SECOND_POTW26_abcdef123456_P0_W0",
      "dev",
    ),
    "AUTO_CAT_DEV_ENT_UNMARKED_SP_400_PRIMARY",
  ])
    await check(name);
  for (const name of [
    names.automaticCategorySchoolName("ENT_UNMARKED_PRIMARY_PROMO_NCL_01", "test"),
    names.automaticCategorySchoolName("ENT_PRIMARY", "dev"),
    "Szkoła podstawowa",
    "AUTO_CAT_D_EU_abcdef123456x",
  ])
    await assert.rejects(check(name));
  const name = names.automaticCategorySchoolName("ENT_UNMARKED_PRIMARY_PROMO_NCL_01", "dev");
  await assert.rejects(check(name, { schoolFlag: true }));
  await assert.rejects(check(name, { teacherFlag: true }));
  await assert.rejects(check(name, { wrongName: true }));
});
