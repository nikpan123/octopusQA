import test from "node:test";
import assert from "node:assert/strict";
import { minimumGiftOrder } from "./gift-rules-2026.mjs";

test("gratisy sezonu 2026: wartość pola Próg bez ponownego naliczania 60%", () => {
  assert.equal(minimumGiftOrder({ schoolThreshold: 30 }), 30);
  assert.equal(minimumGiftOrder({ schoolThreshold: 1 }), 5);
  assert.equal(minimumGiftOrder({ schoolThreshold: 5 }), 5);
  assert.equal(minimumGiftOrder({ schoolThreshold: 10 }), 10);
  assert.equal(minimumGiftOrder({ schoolThreshold: 11 }), 11);
  assert.equal(minimumGiftOrder({ schoolThreshold: 56 }), 56);
});
test("gratisy poprzednich lat: 9 sztuk nie wystarcza, od 10 sztuk wysyłka", () => {
  for (const schoolThreshold of [1, 30, 56])
    assert.equal(minimumGiftOrder({ schoolThreshold, historical: true }), 10);
});
test("brak liczby uczniów zachowuje osobną regułę arkusza; błędny próg nie staje się zerem", () => {
  assert.equal(minimumGiftOrder({ missingStudents: true }), 10);
  for (const schoolThreshold of [undefined, null, 0, -1, 2.5, "30"])
    assert.throws(() => minimumGiftOrder({ schoolThreshold }));
});
