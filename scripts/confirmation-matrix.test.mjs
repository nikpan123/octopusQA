import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyConfirmationOverrides } from "./confirmation-matrix.mjs";

const matrix = JSON.parse(
  readFileSync(new URL("../tests/data/potwierdzenia-gratisy-2026.json", import.meta.url), "utf8"),
);
const corrections = JSON.parse(
  readFileSync(
    new URL("../tests/data/potwierdzenia-gratisy-2026-overrides.json", import.meta.url),
    "utf8",
  ),
);

test("secondary class 1 P uses the class 2 book without changing confirmation class or scope", () => {
  const corrected = applyConfirmationOverrides(matrix, corrections);
  const row = corrected.rows.find((row) => row.key === "MAT-SS-1-H");
  assert.equal(row.classLevel, 1);
  assert.equal(row.scope, "P");
  assert.equal(row.orderClassLevel, 2);
  assert.equal(row.orderCode, "MLK2N-1");
  assert.equal(row.giftCode, "MLK2N-1");
  assert.equal(row.giftId, 4024);
  assert.equal(matrix.rows.find((row) => row.key === "MAT-SS-1-H").giftCode, "MLK1N-1");
  assert.equal(corrected.sha256, matrix.sha256);
  assert.equal(corrected.rows.length, matrix.rows.length);
  for (const original of matrix.rows.filter((row) => row.key !== "MAT-SS-1-H"))
    assert.deepEqual(
      corrected.rows.find((row) => row.key === original.key),
      original,
    );
});

test("a typo in a corrected row key is rejected instead of silently ignoring the correction", () => {
  assert.throws(
    () => applyConfirmationOverrides(matrix, { rows: { UNKNOWN: { orderClassLevel: 2 } } }),
    /nieznanego wiersza/,
  );
});
