import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import { OCTOPUS_BASE_URL } from "./support/environment";

test("szkoła → nauczyciel → relacja → wyszukiwanie → nauczyciel → historia @smoke", async ({
  page,
}, testInfo) => {
  const app = new Octopus(page);

  const runId = `REG_${Date.now()}_${randomUUID().slice(0, 6)}`;

  const schoolName = `${runId} Szkoła testowa`;

  const lastName = runId;

  const normalizedLastName = "Reg" + runId.slice(3).toLowerCase();

  const email = `${runId.toLowerCase()}@example.invalid`;

  const number = String(Date.now());

  const run: Record<string, string> = {
    runId,
    schoolName,
    lastName,
    email,
    number,
    startedAt: new Date().toISOString(),
    cleanupBatchId: process.env.OCTOPUS_CLEANUP_BATCH_ID ?? "",
  };

  await mkdir("runs", {
    recursive: true,
  });

  const saveRun = () => writeFile(`runs/${runId}.json`, JSON.stringify(run, null, 2));

  await saveRun();

  try {
    await test.step("SCH-01: utwórz szkołę i znajdź ją po nazwie", async () => {
      run.schoolId = await app.createSchool(schoolName, number);

      run.schoolUrl = `${OCTOPUS_BASE_URL}/school/school-panel/${run.schoolId}`;

      await saveRun();

      await app.markTestRecord();

      await app.searchSchool(schoolName, run.schoolId);

      await app.openPanel("school", run.schoolId);

      await expect(
        page.getByRole("checkbox", {
          name: "Testowy",
          exact: true,
        }),
      ).toBeChecked();

      /*
       * Nie zakładamy konkretnego miasta
       * ani kodu pocztowego.
       *
       * Odczytujemy faktyczny adres
       * zapisany przez aplikację.
       */
      const schoolAddress = await app.detail("address").inputValue();

      expect(schoolAddress, "Szkoła powinna mieć zapisany adres").not.toBe("");

      /*
       * Numer został przekazany przez test
       * podczas tworzenia szkoły,
       * więc powinien znajdować się
       * w zapisanym adresie.
       */
      expect(schoolAddress).toContain(number);

      run.schoolAddress = schoolAddress;

      await saveRun();
    });

    await test.step("TEA-01 / REL-01: dodaj nauczyciela i powiąż ze szkołą", async () => {
      run.teacherId = await app.createTeacher(lastName, email, run.schoolId, schoolName);

      run.teacherUrl = `${OCTOPUS_BASE_URL}/teacher/teacher-panel/${run.teacherId}`;

      await saveRun();

      await app.markTestRecord();
    });

    await test.step("FIND-01: wyszukaj nauczyciela po ID", async () => {
      await app.searchTeacher(run.teacherId);

      await expect(app.detail("firstName")).toHaveValue("Testowy");

      await expect(app.detail("email")).toHaveValue(email);
    });

    await test.step("EDIT-01 / NORM-01: zapisz JaN i sprawdź Jan po ponownym otwarciu", async () => {
      await app.editFirstName("JaN");

      await app.openPanel("teacher", run.teacherId);

      await expect(app.detail("firstName")).toHaveValue("Jan");

      await expect(app.detail("lastName")).toHaveValue(normalizedLastName);

      await expect(app.detail("email")).toHaveValue(email);

      await expect(
        page.getByRole("checkbox", {
          name: "Testowy",
          exact: true,
        }),
      ).toBeChecked();

      for (const name of ["Marketing", "E-mail", "Telefon"]) {
        await expect(
          page.getByRole("checkbox", {
            name,
            exact: true,
          }),
        ).not.toBeChecked();
      }

      await expect(
        page.getByRole("row").filter({
          hasText: schoolName,
        }),
      ).toHaveCount(1);
    });

    await test.step("AUDIT-01: sprawdź wpis edycji i dodanie szkoły", async () => {
      await page
        .getByRole("tab", {
          name: "Historia zmian",
          exact: true,
        })
        .click();

      const history = page.getByRole("tabpanel", {
        name: "Historia zmian",
        exact: true,
      });

      const edit = history
        .getByRole("row")
        .filter({
          has: page.getByRole("gridcell", {
            name: "Imię",
            exact: true,
          }),
        })
        .filter({
          has: page.getByRole("gridcell", {
            name: "Jan",
            exact: true,
          }),
        })
        .filter({
          has: page.getByRole("gridcell", {
            name: "Edycja danych",
            exact: true,
          }),
        });

      await expect(edit).toHaveCount(1);

      await expect(edit).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

      await expect(edit.getByRole("gridcell").nth(2)).not.toHaveText("");

      await expect(
        history
          .getByRole("row")
          .filter({
            hasText: "Dodana Szkoła",
          })
          .filter({
            hasText: schoolName,
          }),
      ).toHaveCount(1);
    });

    await test.step("REL-01: sprawdź tego samego nauczyciela od strony szkoły", async () => {
      await app.openPanel("school", run.schoolId);

      const teachers = page.getByRole("tabpanel", {
        name: "Nauczyciele",
        exact: true,
      });

      await expect(
        teachers.getByRole("button", {
          name: "Nauczyciele: 1",
          exact: true,
        }),
      ).toBeVisible();

      const row = teachers.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: run.teacherId,
          exact: true,
        }),
      });

      await expect(row).toHaveCount(1);

      await expect(
        row.getByRole("gridcell", {
          name: "Jan",
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        row.getByRole("gridcell", {
          name: normalizedLastName,
          exact: true,
        }),
      ).toBeVisible();
    });

    run.result = "PASS";
  } catch (error) {
    run.result = "FAIL";

    throw error;
  } finally {
    run.finishedAt = new Date().toISOString();

    if (run.teacherId) {
      run.cleanupStatus = run.result === "PASS" ? "PENDING_SUITE_END" : "KEPT_FAILED_TEST";
    }

    await saveRun();

    await testInfo.attach("Dane utworzone w tym przebiegu", {
      body: JSON.stringify(run, null, 2),
      contentType: "application/json",
    });
  }
});
