import { expect } from "@playwright/test";
import { readStructureHistory, type StructureSchool } from "./school-structure";
import type { Octopus } from "./octopus";
import { liveOctopusHeaders } from "./live-auth";

/** Capture the UI's real read endpoint before suspension; re-read it without reopening a suspended school. */
export async function captureCopyAudit(app: Octopus, school: StructureSchool) {
  expect(school.name).toMatch(/^AUTO_STR_/);
  const responsePromise = app.page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      /^\/api\/(School|SchoolComplex)History\//.test(new URL(response.url()).pathname),
  );
  const before = await readStructureHistory(app, school);
  const url = (await responsePromise).url();
  return {
    async verify(copyId: string) {
      expect(copyId).toMatch(/^[1-9]\d*$/);
      const response = await app.page
        .context()
        .request.get(url, { headers: await liveOctopusHeaders(app.page) });
      expect(response.ok()).toBe(true);
      const after = (await response.json()) as typeof before;
      const old = new Set(before.data.map((entry) => JSON.stringify(entry)));
      const id = new RegExp(`(?:^|\\D)${copyId}(?:\\D|$)`);
      const events = after.data.filter(
        (entry) =>
          !old.has(JSON.stringify(entry)) &&
          id.test(entry.value) &&
          /usun|delete/i.test(`${entry.field} ${entry.value}`) &&
          /kopi|dokument|zamów/i.test(`${entry.field} ${entry.value}`),
      );
      expect(
        events.length,
        `Nowy audyt usunięcia kopii ${copyId}, nie tylko zmiany relacji`,
      ).toBeGreaterThan(0);
      for (const entry of events) {
        expect(entry.author.trim()).not.toBe("");
        expect(Number.isFinite(Date.parse(entry.date))).toBe(true);
      }
      return events;
    },
  };
}
