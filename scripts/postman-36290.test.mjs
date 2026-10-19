import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const collection = JSON.parse(
  await readFile(
    new URL("../postman/redmine-36290.postman_collection.json", import.meta.url),
    "utf8",
  ),
);
const original = {
  id: 10,
  isCopied: false,
  orderItems: [
    { dictOrderItemId: 1, businessCode: "F7P", quantity: 3 },
    { dictOrderItemId: 2, businessCode: "4P-2", quantity: 2 },
  ],
};
const clone = value => JSON.parse(JSON.stringify(value));
const copied = { ...clone(original), id: 20, isCopied: true };

function harness(overrides = {}) {
  const variables = new Map(collection.variable.map((item) => [item.key, item.value]));
  for (const [key, value] of Object.entries({
    bearerToken: "dummy-offline-token",
    sourceSchoolId: "100",
    targetSchoolId: "200",
    sourceOrderId: "10",
    copyOrderId: "20",
    currentUserId: "7",
    ...overrides,
  }))
    variables.set(key, value);
  const results = [];
  let skipped = false;
  const pm = {
    variables: {
      get: (key) => variables.get(key),
      set: (key, value) => variables.set(key, value),
      unset: (key) => variables.delete(key),
    },
    info: {},
    execution: {
      skipRequest: () => {
        skipped = true;
      },
    },
    test: (name, fn) => {
      try {
        fn();
        results.push({ name, passed: true });
      } catch (error) {
        results.push({ name, passed: false, error: error.message });
      }
    },
    expect: (value) => ({
      not: { to: { equal: (expected) => assert.notEqual(value, expected) } },
      to: {
        equal: (expected) => assert.equal(value, expected),
        not: { equal: (expected) => assert.notEqual(value, expected) },
        deep: { equal: (expected) => assert.deepEqual(value, expected) },
        be: { below: (expected) => assert.ok(value < expected) },
      },
    }),
  };
  const runScript = (event) =>
    vm.runInNewContext(
      event.script.exec.join("\n"),
      { pm, console: { info() {}, error() {} }, Date, JSON, Number, String, Array },
      { timeout: 1000 },
    );
  const execute = (index, data, code = 200) => {
    skipped = false;
    const item = collection.item[index];
    pm.info.requestName = item.name;
    try {
      for (const event of [...collection.event, ...(item.event ?? [])].filter(
        (e) => e.listen === "prerequest",
      ))
        runScript(event);
      if (skipped) return { skipped: true };
      pm.response = { code, json: () => clone(data) };
      for (const event of (item.event ?? []).filter((e) => e.listen === "test")) runScript(event);
      return { skipped: false };
    } catch (error) {
      return { skipped, error: error.message };
    }
  };
  return { variables, results, execute };
}

test("kolekcja: poprawny JSON i składnia wszystkich skryptów, brak zapisanych sekretów", () => {
  assert.match(collection.info.schema, /collection\/v2\.1\.0/);
  assert.equal(collection.item.length, 5);
  assert.equal(collection.variable.find((v) => v.key === "bearerToken").value, "");
  assert.equal(collection.variable.find((v) => v.key === "allowWrite").value, "NO");
  for (const event of [...collection.event, ...collection.item.flatMap((i) => i.event ?? [])])
    new vm.Script(event.script.exec.join("\n"));
});

test("kolekcja: domyślnie nie wykonuje zapisu ani nie raportuje fikcyjnych porównań PO", () => {
  const h = harness();
  h.execute(0, { data: [original] });
  h.execute(1, { data: [copied] });
  assert.equal(h.execute(2, {}).skipped, true);
  assert.equal(h.execute(3, { data: [original] }).skipped, true);
  assert.equal(h.execute(4, { data: [copied] }).skipped, true);
  assert.equal(h.variables.get("_writeAttempted"), undefined);
});

test("kolekcja: zmiana jednej ilości zachowuje pozostałe pozycje i wykrywa niezależną edycję kopii", () => {
  const h = harness({ allowWrite: "YES" });
  h.execute(0, { data: [original] });
  h.execute(1, { data: [copied] });
  const body = JSON.parse(h.variables.get("_updateBody"));
  assert.equal(body.institutionId, 200);
  assert.equal(body.institutionOrderId, 20);
  assert.deepEqual(body.orderItems, [
    { dictOrderItemId: 1, businessCode: "F7P", quantity: 99 },
    { dictOrderItemId: 2, businessCode: "4P-2", quantity: 2 },
  ]);
  assert.equal(h.execute(2, {}).skipped, false);
  h.execute(3, { data: [original] });
  const changed = clone(copied);
  changed.orderItems[0].quantity = 99;
  h.execute(4, { data: [changed] });
  assert.equal(h.variables.get("_sourceUnchanged"), "true");
  const failures = h.results.filter((r) => !r.passed);
  assert.equal(failures.length, 1, JSON.stringify(failures));
  assert.match(failures[0].name, /Kopia nie pozwala/);
  assert.equal(h.execute(2, {}).skipped, true, "Bez automatycznego ponawiania zapisu");
});

test("kolekcja: odrzucenie edycji nie jest mylone z odtworzeniem błędu", () => {
  const h = harness({ allowWrite: "YES" });
  h.execute(0, { data: [original] });
  h.execute(1, { data: [copied] });
  h.execute(2, {}, 403);
  h.execute(3, { data: [original] });
  h.execute(4, { data: [copied] });
  assert.ok(
    h.results.every((r) => r.passed),
    JSON.stringify(h.results.filter((r) => !r.passed)),
  );
});

test("kolekcja: brak przygotowania, błędny cel, brak tokenu i próba poza DEV blokują zapis", () => {
  assert.equal(harness({ allowWrite: "YES" }).execute(2, {}).skipped, true);
  for (const override of [
    { baseUrl: "https://octopus.gwotest.pl" },
    { bearerToken: "" },
    { sourceSchoolId: "200" },
    { copyOrderId: "10" },
    { currentUserId: "x" },
  ])
    assert.equal(harness(override).execute(0, { data: [original] }).skipped, true);
  const h = harness({ allowWrite: "YES" });
  h.execute(0, { data: [original] });
  h.execute(1, { data: [{ ...copied, isCopied: false }] });
  assert.equal(h.execute(2, {}).skipped, true);
});

test("kolekcja: brak różnicy ilości oraz zmiana konfiguracji w trakcie blokują zapis", () => {
  const h = harness({ allowWrite: "YES", newQuantity: "3" });
  h.execute(0, { data: [original] });
  h.execute(1, { data: [copied] });
  assert.equal(h.execute(2, {}).skipped, true);
  const fresh = harness({ allowWrite: "YES" });
  fresh.execute(0, { data: [original] });
  fresh.execute(1, { data: [copied] });
  fresh.variables.set("copyOrderId", "21");
  assert.equal(fresh.execute(2, {}).skipped, true);
});
