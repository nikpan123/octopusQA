import { createHash } from "node:crypto";

// The gift-generation address table only accepts 50 characters for a building
// number. Keep ownership in the school name, not a growing address identifier.
export function fixtureSchoolNumber(key) {
  if (typeof key !== "string" || !key.length) throw new Error("Brak klucza szkoły testowej.");
  return `CAT-${createHash("sha256").update(key).digest("hex").slice(0, 12)}`;
}
