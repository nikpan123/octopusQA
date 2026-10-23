import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { expect } from "@playwright/test";
import { validateTestOrderDate } from "./test-order-date.mjs";
const datedOrders = new Map();
const dateInputs = [];
const code = ts.transpileModule(
  readFileSync(new URL("../tests/support/promotions.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const exports = {};
let checked = 0;
vm.runInNewContext(code, {
  exports,
  process: { env: {} },
  require: (id) => {
    if (id === "../../scripts/test-order-date.mjs")
      return {
        setTestOrderDate: async (input) => {
          validateTestOrderDate(input);
          dateInputs.push(input);
          datedOrders.get(input.orderId).createdAt = input.date + "T12:00:00";
          return {
            orderId: Number(input.orderId),
            schoolId: Number(input.schoolId),
            date: input.date,
          };
        },
      };
    if (id === "@playwright/test") return { expect };
    if (id === "./entitlements")
      return { ACCESS_YEAR: 2026, test: { step: async (_title, fn) => fn() } };
    if (id === "./access-regression")
      return {
        expectUnmarkedRecords: async () => {
          checked++;
        },
      };
    throw Error("Unexpected dependency " + id);
  },
});

test("NCL-04 prepares two separate below-threshold historical orders and verifies their dates through API", async () => {
  const records = [];
  const events = [];
  const api = {
    school: { id: "456", name: "AUTO_CAT_D_NCL4_abcdef123456" },
    product: async (code) => {
      assert.equal(code, "4P-2");
      return { id: 123 };
    },
    save: async (lines) => {
      assert.equal(lines[0].quantity, 1);
      const id = String(123 + datedOrders.size);
      datedOrders.set(id, { id: Number(id), createdAt: "2099-01-01" });
      events.push("save:" + id);
      return id;
    },
    orders: async () => {
      events.push("read");
      return [...datedOrders.values()];
    },
  };
  await exports.prepareNewClientHistory({
    orders: () => api,
    userId: 789,
    scenario: { record: async (key, value) => records.push({ key, value: JSON.parse(value) }) },
  });
  assert.equal(records.length, 2);
  assert.deepEqual(
    dateInputs.map((i) => i.date),
    [`${exports.promotionCalendarYear - 2}-05-01`, `${exports.promotionCalendarYear - 1}-05-01`],
  );
  assert.ok(dateInputs.every((i) => i.purpose === "new-client-history"));
  assert.deepEqual(events, ["save:123", "read", "save:124", "read"]);
  assert.equal(records[0].value.orderId, 123);
});
test("promotion preparation stops with exact school and order details and performs no write", async () => {
  const orders = [{ id: 1022511, salesOrderSymbol: "2026/BOK/1022511", createdByName: "tester" }];
  const data = {
    schools: [{ id: "94941", name: "AUTO_CAT_D_EU_aecdd66cc1ac" }],
    orders: () => ({ orders: async () => orders }),
  };
  await assert.rejects(exports.preparePromotion(data), (error) => {
    assert.match(error.message, /\[EXISTING_TEST_DATA\]/);
    assert.match(error.message, /94941/);
    assert.match(error.message, /1022511/);
    assert.match(error.message, /tester/);
    assert.match(error.message, /nie dotarł/);
    return true;
  });
  assert.equal(orders.length, 1);
  assert.equal(checked, 1);
  await exports.preparePromotion({ ...data, orders: () => ({ orders: async () => [] }) });
  assert.equal(checked, 2);
});
