import { test, expect } from "./support/shared-school";
import { typeValue, type Octopus, waitForOctopusIdle } from "./support/octopus";
import { saveNewTeacherWithoutSubjectLevel } from "./support/teacher-add";
import { registerCreatedTeacher } from "./support/teacher-add-scenario";
import type { Locator } from "@playwright/test";

type School = { id: string; name: string };

async function openSchools(app: Octopus, form: Locator) {
  await form.getByRole("button", { name: "Dodaj szkołę", exact: true }).click();
  const dialog = app.dialog("Dodaj szkołę - szkoły nauczyciela");
  await expect(dialog.locator("ag-grid-angular")).toHaveCount(2);
  return dialog;
}
function schoolRow(grid: Locator, school: School) {
  return grid
    .getByRole("row")
    .filter({ has: grid.page().getByRole("gridcell", { name: school.id, exact: true }) });
}
async function search(app: Octopus, dialog: Locator, school: School) {
  await typeValue(app.field(dialog, "Nazwa szkoły"), school.name);
  const loaded = app.page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      new URL(r.url()).pathname === "/api/TeacherSchools/GetSchoolsToAddToTeacher",
  );
  await dialog.getByRole("button", { name: "Szukaj", exact: true }).click();
  const response = await loaded;
  expect(response.ok()).toBe(true);
  await response.finished();
  await waitForOctopusIdle(app.page);
}
async function addOnce(app: Octopus, dialog: Locator, school: School) {
  await search(app, dialog, school);
  const row = schoolRow(dialog.locator("ag-grid-angular").first(), school);
  await expect(row).toHaveCount(1);
  await expect(row.locator("mat-icon")).toHaveText(/add_circle_outline/);
  await row.getByRole("gridcell").first().click();
  await expect(schoolRow(dialog.locator("ag-grid-angular").last(), school)).toHaveCount(1);
}
async function duplicateAttempt(
  app: Octopus,
  dialog: Locator,
  school: School,
  evidence: unknown[],
) {
  await search(app, dialog, school);
  const found = schoolRow(dialog.locator("ag-grid-angular").first(), school);
  const selected = schoolRow(dialog.locator("ag-grid-angular").last(), school);
  const plus = found.locator("mat-icon").filter({ hasText: /^\s*add_circle_outline\s*$/ });
  await expect
    .soft(plus, "Po wyszukaniu już wybranej szkoły akcja Dodaj nie może znów być dostępna")
    .toBeHidden();
  const addAvailable = await plus.isVisible();
  // Próbujemy rzeczywistego dodania tylko wtedy, gdy UI udostępnia plus.
  // Nigdy nie klikamy minusa: usunięcie relacji nie jest próbą duplikacji.
  if (addAvailable) await found.getByRole("gridcell").first().click();
  await waitForOctopusIdle(app.page);
  evidence.push({ schoolId: school.id, addAvailable, selectedRows: await selected.count() });
  await expect
    .soft(selected, "Wybór może zawierać dokładnie jedną relację do tej szkoły")
    .toHaveCount(1);
}

const cases = [
  {
    id: "REL-BUG-37164-01",
    title: "dodawanie — ponowne Szukaj nie przywraca plusa",
    edit: false,
    reopen: false,
    second: false,
  },
  {
    id: "REL-BUG-37164-02",
    title: "dodawanie — ponowne otwarcie okna nie umożliwia duplikatu",
    edit: false,
    reopen: true,
    second: false,
  },
  {
    id: "REL-BUG-37164-03",
    title: "edycja — już zapisanej szkoły nie można przypiąć ponownie",
    edit: true,
    reopen: false,
    second: false,
  },
  {
    id: "REL-BUG-37164-04",
    title: "edycja — inna szkoła jest dozwolona, jej duplikat zablokowany",
    edit: true,
    reopen: false,
    second: true,
  },
];

test.describe("Redmine #37164 — unikalne szkoły nauczyciela", () => {
  for (const c of cases) {
    test(`${c.id}: ${c.title} @teacher @school @relation @regression @redmine-37164`, async ({
      page,
      scenario: s,
      school: firstSchool,
      secondSchool,
    }, info) => {
      info.annotations.push({
        type: "Redmine",
        description: "https://redmine.gwo.pl/issues/37164",
      });
      const evidence: unknown[] = [];
      let teacherId: string | undefined;
      try {
        let form: Locator;
        if (c.edit) {
          teacherId =
            await test.step("Utwórz własnego nauczyciela testowego z jedną szkołą QA", () =>
              s.createTeacher(firstSchool.id, firstSchool.name));
          form = page.locator("body");
        } else {
          form = await s.app.prepareTeacher(s.id, s.email);
        }
        let dialog = await openSchools(s.app, form);
        const target = c.second ? secondSchool : firstSchool;
        if (!c.edit || c.second)
          await test.step("Dodaj szkołę jeden raz", () => addOnce(s.app, dialog, target));
        if (c.reopen) {
          await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
          await expect(dialog).toHaveCount(0);
          dialog = await openSchools(s.app, form);
        }
        for (let attempt = 1; attempt <= 2; attempt++) {
          await test.step(`Ponowne wyszukanie i próba duplikacji ${attempt}`, () =>
            duplicateAttempt(s.app, dialog, target, evidence));
          await info.attach(`37164-proba-${attempt}.png`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
        }
        await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect.soft(form.getByRole("row").filter({ hasText: target.name })).toHaveCount(1);
        await test.step("Zapisz formularz i potwierdź pojedyncze relacje po ponownym otwarciu profilu", async () => {
          if (!c.edit) {
            teacherId = await saveNewTeacherWithoutSubjectLevel(page, form);
            await registerCreatedTeacher(s, teacherId);
          }
          expect(teacherId).toBeTruthy();
          const loaded = page.waitForResponse(
            (r) =>
              r.request().method() === "GET" &&
              new URL(r.url()).pathname === "/api/TeacherSchools/GetTeacherSchools",
          );
          await s.app.openPanel("teacher", teacherId!);
          const response = await loaded;
          expect(response.ok()).toBe(true);
          const saved = await response.json();
          expect(Array.isArray(saved), "API relacji ma zwrócić listę szkół").toBe(true);
          const schoolIds = saved.map((row: { id: number | string }) => String(row.id)).sort();
          evidence.push({ stage: "reopened-api", teacherId, schoolIds });
          expect
            .soft(schoolIds, "API ma zawierać dokładnie wybrane szkoły, bez duplikatów")
            .toEqual((c.second ? [firstSchool.id, secondSchool.id] : [firstSchool.id]).sort());
          for (const school of c.second ? [firstSchool, secondSchool] : [firstSchool]) {
            const count = await page.getByRole("row").filter({ hasText: school.name }).count();
            evidence.push({
              stage: "reopened-profile",
              teacherId,
              schoolId: school.id,
              rows: count,
            });
            await expect
              .soft(
                page.getByRole("row").filter({ hasText: school.name }),
                "Po zapisie ma istnieć dokładnie jedna relacja",
              )
              .toHaveCount(1);
          }
        });
      } finally {
        await info.attach("37164-wyniki.json", {
          body: Buffer.from(
            JSON.stringify({ issue: 37164, scenario: c.id, teacherId, evidence }, null, 2),
          ),
          contentType: "application/json",
        });
        if (!page.isClosed())
          await info.attach("37164-profil.png", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
      }
    });
  }
});
