import test from "node:test";
import assert from "node:assert/strict";
import { matchingConfirmationClasses } from "./confirmation-classes.mjs";

const boxes = [
  { class: 4, className: "4", isOur: false },
  { class: 4, className: "4", isOur: true },
  { class: 4, className: "4 Między N", isOur: true },
  { class: 4, className: "4 Moim Z", isOur: true },
  { class: 5, className: "5", isOur: true },
];
const row = { classLevel: 4, series: "MN", level: "SP", scope: "" };

test("report c47bb601: MN selects 4 Między N even when generic 4 also exists", () => {
  assert.deepEqual(matchingConfirmationClasses(boxes, row, true), [boxes[2]]);
});
test("MZ selects 4 Moim Z and foreign confirmation uses the foreign class", () => {
  assert.deepEqual(matchingConfirmationClasses(boxes, { ...row, series: "MZ" }, true), [boxes[3]]);
  assert.deepEqual(matchingConfirmationClasses(boxes, row, false), [boxes[0]]);
});
test("MN keeps generic classes where the form has no named MN option", () => {
  assert.deepEqual(matchingConfirmationClasses(boxes, { ...row, classLevel: 5 }, true), [boxes[4]]);
  assert.deepEqual(matchingConfirmationClasses([boxes[3]], row, true), []);
});
test("duplicate named checkboxes remain ambiguous instead of selecting an arbitrary one", () => {
  assert.equal(matchingConfirmationClasses([...boxes, { ...boxes[2] }], row, true).length, 2);
});
test("physics series and secondary scope remain distinct", () => {
  const physics = [
    { class: 7, className: "7 F+", isOur: true },
    { class: 7, className: "7 TNŚ", isOur: true },
  ];
  assert.deepEqual(
    matchingConfirmationClasses(physics, { ...row, classLevel: 7, series: "TNS" }, true),
    [physics[1]],
  );
  assert.deepEqual(
    matchingConfirmationClasses(physics, { ...row, classLevel: 7, series: "FPLUS" }, true),
    [physics[0]],
  );
  const secondary = [
    { class: 1, className: "1 P", isOur: true },
    { class: 1, className: "1 R", isOur: true },
  ];
  assert.deepEqual(
    matchingConfirmationClasses(
      secondary,
      { ...row, classLevel: 1, series: "MAT", level: "SŚ", scope: "R" },
      true,
    ),
    [secondary[1]],
  );
});
