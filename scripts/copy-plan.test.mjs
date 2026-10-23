import test from "node:test";
import assert from "node:assert/strict";
import {
  COPY_KEYS,
  FULL_COPY_PLAN,
  ISOLATION_COPY_PLAN,
  STANDALONE_COPY_PLAN,
  copyPairPlan,
  validateCopyPlan,
} from "../tests/support/copy-plan.mjs";

test("pakiet kopiowania używa osobnego zestawu szkół, bez powrotu do zajętych starych rekordów", () => {
  assert.deepEqual(COPY_KEYS, {
    ZS: "specCopyGroup",
    SP: "specCopyPrimary",
    LO: "specCopySecondary",
    TECH: "specCopyTechnical",
    B: "specCopyOtherGroup",
    BSP: "specCopyOtherPrimary",
    SOLO: "specCopyStandalone",
  });
  assert.equal(new Set(Object.values(COPY_KEYS)).size, 7);
  for (const key of Object.values(COPY_KEYS)) assert.match(key, /^specCopy/);
});

test("kopiowanie proste: tylko dwie placówki i jedna relacja, niezależnie od kierunku kopii", () => {
  for (const [source, target, expected] of [
    ["SP", "LO", { nodes: ["SP", "LO"], relations: [["SP", "LO"]] }],
    ["ZS", "SP", { nodes: ["ZS", "SP"], relations: [["ZS", "SP"]] }],
    ["SP", "ZS", { nodes: ["ZS", "SP"], relations: [["ZS", "SP"]] }],
  ]) {
    const plan = copyPairPlan(source, target);
    assert.deepEqual(plan, expected);
    assert.equal(plan.nodes.length, 2);
    assert.equal(plan.relations.length, 1);
    assert.ok(plan.nodes.every((node) => COPY_KEYS[node]));
  }
});

test("minimalny plan nie skraca relacji wielopoziomowej ani nie zmienia rodzeństwa w rodzica i dziecko", () => {
  assert.deepEqual(copyPairPlan("LO", "ZS"), {
    nodes: ["ZS", "SP", "LO"],
    relations: [
      ["ZS", "SP"],
      ["SP", "LO"],
    ],
  });
  assert.deepEqual(copyPairPlan("SP", "TECH"), {
    nodes: ["ZS", "SP", "TECH"],
    relations: [
      ["ZS", "SP"],
      ["ZS", "TECH"],
    ],
  });
  assert.deepEqual(copyPairPlan("LO", "TECH"), FULL_COPY_PLAN);
});

test("pełne grafy tylko dla hierarchii i izolacji; brak struktury wymaga jednej placówki", () => {
  assert.equal(validateCopyPlan(FULL_COPY_PLAN).nodes.length, 4);
  assert.equal(FULL_COPY_PLAN.relations.length, 3);
  assert.equal(validateCopyPlan(ISOLATION_COPY_PLAN).nodes.length, 7);
  assert.equal(ISOLATION_COPY_PLAN.relations.length, 4);
  assert.deepEqual(validateCopyPlan(STANDALONE_COPY_PLAN), { nodes: ["SOLO"], relations: [] });
});

test("błędny zakres jest odrzucany przed przygotowaniem lub zmianą danych", () => {
  for (const pair of [
    ["SP", "B"],
    ["SOLO", "SP"],
    ["SP", "SP"],
    ["UNKNOWN", "SP"],
  ])
    assert.throws(() => copyPairPlan(...pair));
  for (const plan of [
    { nodes: [], relations: [] },
    { nodes: ["SP", "SP"], relations: [] },
    { nodes: ["SP"], relations: [["SP", "LO"]] },
    {
      nodes: ["SP", "LO"],
      relations: [
        ["SP", "LO"],
        ["SP", "LO"],
      ],
    },
    { nodes: ["SOLO"], relations: [["SOLO", "SOLO"]] },
  ])
    assert.throws(() => validateCopyPlan(plan));
  assert.deepEqual(FULL_COPY_PLAN, {
    nodes: ["ZS", "SP", "LO", "TECH"],
    relations: [
      ["ZS", "SP"],
      ["SP", "LO"],
      ["ZS", "TECH"],
    ],
  });
});
