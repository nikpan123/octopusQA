import assert from "node:assert/strict";
import test from "node:test";

import { classifyFailure } from "./failure-classifier.mjs";
import FailureReporter from "./failure-reporter.mjs";

test("rozpoznaje brak elementu i zachowuje lokator", () => {
  const result = classifyFailure({
    message: `locator.click: Timeout 20000ms exceeded.\nCall log:\n  - waiting for getByRole('button', { name: 'Zapisz' })`,
  });

  assert.equal(result.category, "LOCATOR_NOT_FOUND");
  assert.match(result.locator, /getByRole/);
  assert.equal(result.action, "locator.click");
});

test("odróżnia niejednoznaczny lokator od braku elementu", () => {
  const result = classifyFailure({
    message:
      'locator.click: Error: strict mode violation: getByText("Zapisz") resolved to 2 elements',
  });

  assert.equal(result.category, "LOCATOR_AMBIGUOUS");
});

test("odróżnia niewidoczny i nieaktywny element", () => {
  assert.equal(
    classifyFailure({ message: "locator.click: waiting for element to be visible" }).category,
    "ELEMENT_NOT_VISIBLE",
  );
  assert.equal(
    classifyFailure({ message: "locator.click: waiting for element to be enabled" }).category,
    "ELEMENT_DISABLED",
  );
});

test("rozpoznaje błąd asercji", () => {
  const result = classifyFailure({
    message: 'Error: expect(received).toBe(expected)\nExpected: "A"\nReceived: "B"',
  });

  assert.equal(result.category, "ASSERTION_FAILED");
});

test("status timedOut ma bezpieczną kategorię timeout", () => {
  assert.equal(classifyFailure({ status: "timedOut" }).category, "TIMEOUT");
});

test("reporter zapisuje tylko nieoczekiwane niepowodzenie", () => {
  const reporter = new FailureReporter();
  const playwrightTest = {
    id: "fake-id",
    title: "ORD-TEST: test reportera",
    expectedStatus: "passed",
    location: { file: "tests/fake.spec.ts", line: 1, column: 1 },
    titlePath: () => ["chromium", "ORD-TEST: test reportera"],
  };

  reporter.onTestEnd(playwrightTest, {
    status: "failed",
    retry: 0,
    duration: 123,
    errors: [
      {
        message:
          'locator.click: Timeout 20000ms exceeded.\nCall log:\n - waiting for getByRole("button", { name: "Zapisz" })',
      },
    ],
  });

  assert.equal(reporter.failures.length, 1);
  assert.equal(reporter.failures[0].id, "ORD-TEST");
  assert.equal(reporter.failures[0].category, "LOCATOR_NOT_FOUND");

  reporter.onTestEnd(
    { ...playwrightTest, expectedStatus: "failed" },
    {
      status: "failed",
      retry: 0,
      duration: 10,
      errors: [],
    },
  );
  assert.equal(reporter.failures.length, 1);
});
