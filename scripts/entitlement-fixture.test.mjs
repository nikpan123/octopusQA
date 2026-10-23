import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the real fixture with local stand-ins. No browser, credentials or API.
const code = ts.transpileModule(
  readFileSync(new URL("../tests/support/entitlements.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function harness() {
  const schools = [],
    teachers = [],
    steps = [];
  const fixtureTest = (fixtures = {}) => ({
    fixtures,
    extend: (more) => fixtureTest({ ...fixtures, ...more }),
  });
  const modules = {
    "./api-step": {
      apiStep: async (title, action) => {
        steps.push(title);
        return action();
      },
    },
    "@playwright/test": {
      expect: (value) => ({
        toBe: (expected) => assert.equal(value, expected),
        toBeChecked() {},
        not: { toBeChecked() {} },
        toContain() {},
        toMatch() {},
      }),
    },
    "./scenario": { test: fixtureTest() },
    "./club-form-api": {
      TFL_CURRENT_SCHOOL_YEAR: "2026/2027",
      ClubFormApi: class {
        registerEntitlementTeacher() {}
      },
    },
    "./school-category-data": {
      ensureCategorySchool: async (_page, _app, definition) => {
        const school = { id: String(schools.length + 1), name: definition.key };
        schools.push(school);
        return school;
      },
    },
    "./octopus": { Octopus: class {} },
    "./order-class": {
      OrderClassApi: class {
        owned = new Set();
        async remove(id) {
          this.owned.delete(id);
        }
      },
    },
    "./live-auth": { liveOctopusHeaders: async () => ({}) },
    "./background-school-setup": {
      backgroundSchoolSetup: async (_page, action) =>
        action({ openPanel: async () => {}, page: { getByRole: () => ({}) } }),
    },
    "../../scripts/cleanup-teachers.mjs": {},
    "./environment": { OCTOPUS_ENV: "dev" },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      assert.ok(name in modules, `Unexpected dependency: ${name}`);
      return modules[name];
    },
    process: { env: {} },
  });
  const fixtures = exports.test.fixtures;
  return {
    schools,
    teachers,
    steps,
    fixtures,
    exports,
    async run(options = {}, action = async () => {}) {
      const defaults = Object.fromEntries(
        Object.entries(fixtures)
          .filter(([key]) => key !== "access")
          .map(([key, value]) => [key, value[0]]),
      );
      await fixtures.access[0](
        {
          ...defaults,
          ...options,
          page: {
            context: () => ({
              request: {
                get: async () => ({
                  ok: () => true,
                  json: async () => (options.accessTestFlags ?? defaults.accessTestFlags).teacher,
                }),
              },
            }),
          },
          scenario: {
            id: "offline",
            record: async () => {},
            createTeacher: async (id, _name, opts) => {
              teachers.push({ schoolId: id, ...opts });
              return "100";
            },
          },
          authSession: {
            session: { origin: "offline" },
            storageState: {
              origins: [
                {
                  origin: "offline",
                  localStorage: [
                    { name: "id", value: "1" },
                    { name: "token", value: "offline-placeholder" },
                  ],
                },
              ],
            },
          },
        },
        action,
        { status: "failed" },
      );
    },
  };
}

test("single-school fixtures create and assign only one school", async () => {
  for (const selection of ["both", "target"]) {
    const h = harness();
    await h.run({ accessTeacherSchools: selection });
    assert.equal(h.schools.length, 1);
    assert.equal(h.teachers[0].schoolId, h.schools[0].id);
    assert.equal(h.teachers[0].additionalSchoolIds.length, 0);
  }
});

test("two-school isolation and copying retain the correct teacher assignments", async () => {
  for (const selection of ["both", "target"]) {
    const h = harness();
    assert.equal(h.exports.twoSchoolTest.fixtures.accessSchoolCount, 2);
    await h.run({ accessSchoolCount: 2, accessTeacherSchools: selection });
    assert.equal(h.schools.length, 2);
    assert.equal(h.teachers[0].schoolId, h.schools[selection === "target" ? 1 : 0].id);
    assert.equal(h.teachers[0].additionalSchoolIds.length, selection === "target" ? 0 : 1);
  }
});

test("cleanup is not repeated after the test has removed its own orders", async () => {
  const h = harness();
  await h.run({}, async (data) => {
    data.orders().owned.add("123");
    await data.finish();
  });
  assert.equal(h.steps.length, 1);
});

test("empty fixture teardown does not add a cleanup step", async () => {
  const h = harness();
  await h.run();
  assert.equal(h.steps.length, 0);
});

test("failed order removal is still retried during teardown", async () => {
  const h = harness();
  let attempts = 0;
  await h.run({}, async (data) => {
    const api = data.orders();
    api.owned.add("123");
    api.remove = async (id) => {
      if (++attempts === 1) throw new Error("Offline removal failure");
      api.owned.delete(id);
    };
    await assert.rejects(data.finish(), /Offline removal failure/);
  });
  assert.equal(attempts, 2);
  assert.equal(h.steps.length, 2);
});
