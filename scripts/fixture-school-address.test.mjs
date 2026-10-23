import test from "node:test";
import assert from "node:assert/strict";
import { fixtureSchoolNumber } from "./fixture-school-address.mjs";

test("Adres szkoły: długi identyfikator UNMARKED nie przekracza limitu gratisów", () => {
  const key = "ENT_UNMARKED_SECOND_COPY_GIFT_5bf48042d953_P0_W0";
  assert.equal(`CAT-${key}`.length, 52);
  assert.match(fixtureSchoolNumber(key), /^CAT-[a-f0-9]{12}$/);
  assert.equal(fixtureSchoolNumber(key).length, 16);
  assert.equal(fixtureSchoolNumber(key), fixtureSchoolNumber(key));
  assert.notEqual(fixtureSchoolNumber(key), fixtureSchoolNumber(key + "_OTHER"));
  assert.equal(fixtureSchoolNumber("X".repeat(200)).length, 16);
  assert.throws(() => fixtureSchoolNumber(""));
});
