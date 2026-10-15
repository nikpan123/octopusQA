import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator, Page, TestInfo } from "@playwright/test";
import type { AuthSession } from "../scripts/auth.mjs";
import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import {
  openSchoolAddForm,
  fillSchoolName,
  cancelSchoolAdd,
  prepareCompleteSchoolAdd,
  saveSchoolAdd,
} from "./support/school-add";
import { StructureApi } from "./support/school-structure-api";
import { OCTOPUS_ENV } from "./support/environment";
import {
  openSchoolStructure,
  structurePanelSchoolRow,
  removeStructureSchoolCandidate,
  type StructureSchool,
} from "./support/school-structure";
import { ensureStructureTestSchools } from "./support/school-structure-data";
import {
  addStructureSchoolCandidate,
  fillStructureSearch,
  submitStructureSearch,
  selectStructureRelationCell,
  structureRelatedSchoolRow,
  structureRelatedSchools,
  structureSearchField,
  dismissWarning,
} from "./support/school-structure";

const freshName = () =>
  `AUTO_STR_${OCTOPUS_ENV.toUpperCase()}_ADD_${Date.now()}_${randomUUID().slice(0, 6)}`;

type AnchorKey = "addBranch" | "addMain" | "addGroup";

async function withNewSchool(
  page: Page,
  auth: AuthSession,
  info: TestInfo,
  keys: AnchorKey[],
  schoolType: string,
  action: (data: {
    app: Octopus;
    api: StructureApi;
    form: Locator;
    name: string;
    schools: Record<AnchorKey, StructureSchool>;
    save: () => Promise<StructureSchool>;
  }) => Promise<void>,
) {
  const app = new Octopus(page);
  const schools =
    (await test.step("Przygotowanie: szkoły testowe do sprawdzania struktury", async () =>
      ensureStructureTestSchools(page, app, keys))) as Record<AnchorKey, StructureSchool>;
  const owned = keys.map((key) => schools[key]);
  const api = new StructureApi(page.context().request, auth);
  await test.step("Przygotowanie API: odczyt identyfikatorów szkół", async () =>
    api.resolve(owned));
  await api.cleanup(owned);
  const name = freshName();
  const form = await prepareCompleteSchoolAdd(page, app, name, `STRADD-${Date.now()}`, schoolType);
  let created: StructureSchool | undefined;
  const retainRecord = async (cleanupStatus: string) => {
    if (!created) return;
    await mkdir("runs", { recursive: true });
    await writeFile(
      path.join("runs", `${name}.json`),
      JSON.stringify(
        {
          test: info.title,
          environment: OCTOPUS_ENV,
          schoolId: created.id,
          schoolName: name,
          schoolRetentionStatus: "KEPT_NO_DELETE_ENDPOINT",
          structureCleanupStatus: cleanupStatus,
        },
        null,
        2,
      ),
    );
  };
  const save = async () => {
    const result = await saveSchoolAdd(page, form);
    created = { id: result.schoolId, name };
    await retainRecord("PENDING");
    await app.markTestRecord();
    await test.step("Przygotowanie API: odczyt identyfikatorów szkół", async () =>
      api.resolve([created!]));
    await test.step("Sprawdzenie: zgodność wartości — result.saveRequestCount; oczekiwane: 1", async () => {
      expect(result.saveRequestCount).toBe(1);
    });
    return created;
  };
  await action({ app, api, form, name, schools, save }).finally(async () => {
    if (!created && /\/school\/school-panel\/\d+$/.test(page.url())) {
      await test.step('Sprawdzenie: wartość pola w widoku — app.detail("name"); oczekiwane: name', async () =>
        expect(app.detail("name")).toHaveValue(name));
      created = { id: page.url().split("/").pop()!, name };
      await retainRecord("PENDING");
      await app.markTestRecord();
      await test.step("Przygotowanie API: odczyt identyfikatorów szkół", async () =>
        api.resolve([created!]));
    }
    await api.cleanup(created ? [...owned, created] : owned);
    await retainRecord("CLEAN");
    if (created)
      await info.attach("Szkoła testowa pozostawiona bez relacji", {
        body: JSON.stringify(created),
        contentType: "application/json",
      });
  });
}

async function openPendingStructure(app: Octopus, schoolForm: Locator) {
  await schoolForm.getByRole("button", { name: "Dodaj powiązanie", exact: true }).click();
  const dialog = app.dialog("Dodaj powiązanie - szkoły w strukturze");
  await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
    expect(dialog).toBeVisible());
  return dialog;
}

async function choosePending(
  app: Octopus,
  dialog: Locator,
  school: { id: string; name: string },
  type = "Filia",
  hierarchy = "Podrzędna",
) {
  await fillStructureSearch(app, dialog, { id: school.id });
  await submitStructureSearch(dialog);
  const row = await addStructureSchoolCandidate(dialog, school);
  await selectStructureRelationCell(app.page, row, "type", type);
  await selectStructureRelationCell(app.page, row, "hierarchy", hierarchy);
  return row;
}

async function acceptPending(dialog: Locator, schoolForm: Locator) {
  await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
  await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
    expect(dialog).toHaveCount(0));
  await test.step("Sprawdzenie: widoczność elementu — schoolForm", async () =>
    expect(schoolForm).toBeVisible());
}

async function guardWrites(page: Page) {
  const attempts: Array<{ path: string; body: unknown }> = [];
  for (const path of ["AddNewInstitution", "AddOrUpdateInstitutionRelations"]) {
    await page.route(`**/api/Institution/${path}`, async (route) => {
      attempts.push({ path, body: route.request().postDataJSON() });
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ Message: "Kontrolowana odmowa testowa" }),
      });
    });
  }
  return attempts;
}

test.describe("Struktura podczas dodawania szkoły", () => {
  test("STR-88: nowa szkoła udostępnia dialog struktury bez nadanego ID @school @structure @school-add", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const form = await openSchoolAddForm(app);
    await fillSchoolName(app, form, freshName());
    const dialog = await openPendingStructure(app, form);
    for (const label of ["ID szkoły", "Nazwa szkoły", "Kod pocztowy", "Miejscowość", "Ulica"])
      await test.step("Sprawdzenie: widoczność elementu — structureSearchField(dialog, label)", async () =>
        expect(structureSearchField(dialog, label)).toBeVisible());
    await test.step('Sprawdzenie: liczba elementów w widoku — structureRelatedSchools(dialog).getByRole("gridcell"); oczekiwane: 0', async () =>
      expect(structureRelatedSchools(dialog).getByRole("gridcell")).toHaveCount(0));
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await test.step("Sprawdzenie: widoczność elementu — form", async () =>
      expect(form).toBeVisible());
    await cancelSchoolAdd(form);
  });

  test("STR-89: Zapisz strukturę odkłada relację do zapisu nowej szkoły @school @structure @school-add @api", async ({
    page,
  }, testInfo) => {
    const app = new Octopus(page);
    const s = await test.step("Przygotowanie: szkoły testowe do sprawdzania struktury", async () =>
      ensureStructureTestSchools(page, app, ["addBranch"]));
    const form = await prepareCompleteSchoolAdd(page, app, freshName(), `STRADD-${Date.now()}`);
    const attempts = await guardWrites(page);
    const dialog = await openPendingStructure(app, form);
    await choosePending(app, dialog, s.addBranch!);
    await acceptPending(dialog, form);
    await test.step("Sprawdzenie: liczba elementów — attempts; oczekiwane: 0", async () => {
      expect(attempts).toHaveLength(0);
    });
    const reopened = await openPendingStructure(app, form);
    await test.step("Sprawdzenie: liczba elementów w widoku — structureRelatedSchoolRow(reopened, s.addBranch!.id); oczekiwane: 1", async () =>
      expect(structureRelatedSchoolRow(reopened, s.addBranch!.id)).toHaveCount(1));
    await reopened.getByRole("button", { name: "Anuluj", exact: true }).click();
    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/api/Institution/AddNewInstitution") && r.request().method() === "POST",
    );
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await response;
    await testInfo.attach("Kontrakt zapisu szkoły ze strukturą", {
      body: JSON.stringify(attempts, null, 2),
      contentType: "application/json",
    });
    await test.step("Sprawdzenie: liczba elementów — attempts; oczekiwane: 1", async () => {
      expect(attempts).toHaveLength(1);
    });
  });

  for (const relation of [
    {
      id: "STR-90",
      type: "Filia",
      apiId: 2,
      hierarchy: "Podrzędna",
      anchor: "addBranch" as const,
      schoolType: "Szkoła podstawowa",
    },
    {
      id: "STR-91",
      type: "Filia",
      apiId: 2,
      hierarchy: "Nadrzędna",
      anchor: "addMain" as const,
      schoolType: "Szkoła podstawowa",
    },
    {
      id: "STR-92",
      type: "Zespół szkół",
      apiId: 1,
      hierarchy: "Nadrzędna",
      anchor: "addGroup" as const,
      schoolType: "Szkoła podstawowa",
    },
    {
      id: "STR-93",
      type: "Zespół szkół",
      apiId: 1,
      hierarchy: "Podrzędna",
      anchor: "addBranch" as const,
      schoolType: "Zespół szkół",
    },
    {
      id: "STR-94",
      type: "Wielobudynkowość",
      apiId: 3,
      hierarchy: "Podrzędna",
      anchor: "addBranch" as const,
      schoolType: "Szkoła podstawowa",
    },
    {
      id: "STR-95",
      type: "Wielobudynkowość",
      apiId: 3,
      hierarchy: "Nadrzędna",
      anchor: "addMain" as const,
      schoolType: "Szkoła podstawowa",
    },
  ]) {
    test(`${relation.id}: nowa szkoła utrwala ${relation.type} / ${relation.hierarchy} @school @structure @school-add @persistence`, async ({
      page,
      authSession,
    }, info) => {
      await withNewSchool(
        page,
        authSession,
        info,
        [relation.anchor],
        relation.schoolType,
        async ({ app, api, form, schools, save }) => {
          const linked = schools[relation.anchor];
          const dialog = await openPendingStructure(app, form);
          await choosePending(app, dialog, linked, relation.type, relation.hierarchy);
          await acceptPending(dialog, form);
          const created = await save();
          const expected = {
            parent: api.unit(relation.hierarchy === "Nadrzędna" ? linked : created),
            child: api.unit(relation.hierarchy === "Nadrzędna" ? created : linked),
            type: relation.apiId,
          };
          const edges = api.edges(
            await test.step("API: odczyt struktury szkoły", async () => api.tree(created)),
          );
          await test.step("Sprawdzenie: liczba elementów — edges; oczekiwane: 1", async () => {
            expect(edges).toHaveLength(1);
          });
          await test.step("Sprawdzenie: toMatchObject — edges[0]; oczekiwane: expected", async () => {
            expect(edges[0]).toMatchObject(expected);
          });
          await test.step("Sprawdzenie: zgodność całej struktury i wartości — api.edges(await api.tree(linked)); oczekiwane: edges", async () => {
            expect(api.edges(await api.tree(linked))).toEqual(edges);
          });
          const panel = await openSchoolStructure(app, created);
          await test.step("Sprawdzenie: liczba elementów w widoku — structurePanelSchoolRow(panel, linked); oczekiwane: 1", async () =>
            expect(structurePanelSchoolRow(panel, linked)).toHaveCount(1));
        },
      );
    });
  }

  test("STR-96: nowa szkoła utrwala kilka powiązań z jednego formularza @school @structure @school-add @persistence", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch", "addMain"],
      "Szkoła podstawowa",
      async ({ app, api, form, schools, save }) => {
        const dialog = await openPendingStructure(app, form);
        for (const linked of [schools.addBranch, schools.addMain])
          await choosePending(app, dialog, linked);
        await acceptPending(dialog, form);
        const created = await save();
        await test.step("Sprawdzenie: zgodność całej struktury i wartości — api.edges(await api.tree(created)); oczekiwane: expect.arrayContaining([ expect.objectContaining({ parent: api.unit(created), child: api.unit(schools.addBranch), …", async () => {
          expect(api.edges(await api.tree(created))).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                parent: api.unit(created),
                child: api.unit(schools.addBranch),
                type: 2,
              }),
              expect.objectContaining({
                parent: api.unit(created),
                child: api.unit(schools.addMain),
                type: 2,
              }),
            ]),
          );
        });
        await test.step("Sprawdzenie: liczba elementów — api.edges(await api.tree(created)); oczekiwane: 2", async () => {
          expect(api.edges(await api.tree(created))).toHaveLength(2);
        });
        const panel = await openSchoolStructure(app, created);
        for (const linked of [schools.addBranch, schools.addMain])
          await test.step("Sprawdzenie: liczba elementów w widoku — structurePanelSchoolRow(panel, linked); oczekiwane: 1", async () =>
            expect(structurePanelSchoolRow(panel, linked)).toHaveCount(1));
      },
    );
  });

  test("STR-97: anulowanie dialogu struktury zachowuje szkołę i odrzuca roboczą relację @school @structure @school-add @cancel", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch"],
      "Szkoła podstawowa",
      async ({ app, form, name, schools }) => {
        const dialog = await openPendingStructure(app, form);
        await choosePending(app, dialog, schools.addBranch);
        await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
        await test.step("Sprawdzenie: widoczność elementu — form", async () =>
          expect(form).toBeVisible());
        await test.step('Sprawdzenie: wartość pola w widoku — app.field(form, "* Nazwa"); oczekiwane: name', async () =>
          expect(app.field(form, "* Nazwa")).toHaveValue(name));
        const reopened = await openPendingStructure(app, form);
        await test.step('Sprawdzenie: liczba elementów w widoku — structureRelatedSchools(reopened).getByRole("gridcell"); oczekiwane: 0', async () =>
          expect(structureRelatedSchools(reopened).getByRole("gridcell")).toHaveCount(0));
        await reopened.getByRole("button", { name: "Anuluj", exact: true }).click();
        await cancelSchoolAdd(form);
      },
    );
  });

  test("STR-98: anulowanie nowej szkoły odrzuca zaakceptowaną strukturę @school @structure @school-add @cancel", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch"],
      "Szkoła podstawowa",
      async ({ app, api, form, name, schools }) => {
        const attempts = await guardWrites(page);
        const dialog = await openPendingStructure(app, form);
        await choosePending(app, dialog, schools.addBranch);
        await acceptPending(dialog, form);
        await cancelSchoolAdd(form);
        await test.step("Sprawdzenie: liczba elementów — attempts; oczekiwane: 0", async () => {
          expect(attempts).toHaveLength(0);
        });
        await test.step("Sprawdzenie: liczba elementów — api.edges(await api.tree(schools.addBranch)); oczekiwane: 0", async () => {
          expect(api.edges(await api.tree(schools.addBranch))).toHaveLength(0);
        });
        await app.searchMissing("school", "Nazwa szkoły", name);
      },
    );
  });

  test("STR-99: zaakceptowaną pozycję można usunąć przed utworzeniem szkoły @school @structure @school-add @cancel", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch"],
      "Szkoła podstawowa",
      async ({ app, form, schools }) => {
        let dialog = await openPendingStructure(app, form);
        await choosePending(app, dialog, schools.addBranch);
        await acceptPending(dialog, form);
        dialog = await openPendingStructure(app, form);
        await removeStructureSchoolCandidate(dialog, schools.addBranch);
        await acceptPending(dialog, form);
        dialog = await openPendingStructure(app, form);
        await test.step("Sprawdzenie: liczba elementów w widoku — structureRelatedSchoolRow(dialog, schools.addBranch.id); oczekiwane: 0", async () =>
          expect(structureRelatedSchoolRow(dialog, schools.addBranch.id)).toHaveCount(0));
        await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
        await cancelSchoolAdd(form);
      },
    );
  });

  test("STR-100: nowa szkoła nie planuje dwukrotnie tej samej szkoły @school @structure @school-add @validation", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch"],
      "Szkoła podstawowa",
      async ({ app, form, schools }) => {
        const dialog = await openPendingStructure(app, form);
        await choosePending(app, dialog, schools.addBranch);
        await fillStructureSearch(app, dialog, { id: schools.addBranch.id });
        await submitStructureSearch(dialog);
        const candidate = dialog
          .getByRole("treegrid")
          .first()
          .getByRole("row")
          .filter({ has: page.getByRole("gridcell", { name: schools.addBranch.id, exact: true }) });
        if (await candidate.count()) await candidate.getByRole("gridcell").first().click();
        await test.step("Sprawdzenie: liczba elementów w widoku — structureRelatedSchoolRow(dialog, schools.addBranch.id); oczekiwane: 1", async () =>
          expect(structureRelatedSchoolRow(dialog, schools.addBranch.id)).toHaveCount(1));
        await acceptPending(dialog, form);
        const reopened = await openPendingStructure(app, form);
        await test.step("Sprawdzenie: liczba elementów w widoku — structureRelatedSchoolRow(reopened, schools.addBranch.id); oczekiwane: 1", async () =>
          expect(structureRelatedSchoolRow(reopened, schools.addBranch.id)).toHaveCount(1));
        await reopened.getByRole("button", { name: "Anuluj", exact: true }).click();
        await cancelSchoolAdd(form);
      },
    );
  });

  test("STR-101: puste wyszukiwanie nie zamyka żadnego formularza @school @structure @school-add @validation", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const form = await openSchoolAddForm(app);
    const dialog = await openPendingStructure(app, form);
    await submitStructureSearch(dialog);
    await dismissWarning(page, "Wyszukiwanie nie może być puste");
    await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
      expect(dialog).toBeVisible());
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await test.step("Sprawdzenie: widoczność elementu — form", async () =>
      expect(form).toBeVisible());
    await cancelSchoolAdd(form);
  });

  test("STR-102: zmiany roboczego typu i kierunku przechodzą do ponownie otwartego dialogu @school @structure @school-add @edit", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch"],
      "Szkoła podstawowa",
      async ({ app, form, schools }) => {
        let dialog = await openPendingStructure(app, form);
        await choosePending(app, dialog, schools.addBranch);
        await acceptPending(dialog, form);
        dialog = await openPendingStructure(app, form);
        const row = structureRelatedSchoolRow(dialog, schools.addBranch.id);
        await selectStructureRelationCell(page, row, "type", "Wielobudynkowość");
        await selectStructureRelationCell(page, row, "hierarchy", "Nadrzędna");
        await acceptPending(dialog, form);
        dialog = await openPendingStructure(app, form);
        await test.step('Sprawdzenie: obecność tekstu w widoku — structureRelatedSchoolRow(dialog, schools.addBranch.id).getByRole("gridcell").nth(5); oczekiwane: "Wielobudynkowość"', async () =>
          expect(
            structureRelatedSchoolRow(dialog, schools.addBranch.id).getByRole("gridcell").nth(5),
          ).toContainText("Wielobudynkowość"));
        await test.step('Sprawdzenie: obecność tekstu w widoku — structureRelatedSchoolRow(dialog, schools.addBranch.id).getByRole("gridcell").nth(6); oczekiwane: "Nadrzędna"', async () =>
          expect(
            structureRelatedSchoolRow(dialog, schools.addBranch.id).getByRole("gridcell").nth(6),
          ).toContainText("Nadrzędna"));
        await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
        await cancelSchoolAdd(form);
      },
    );
  });

  test("STR-103: gotowa struktura nie omija obowiązkowej nazwy nowej szkoły @school @structure @school-add @validation", async ({
    page,
    authSession,
  }, info) => {
    await withNewSchool(
      page,
      authSession,
      info,
      ["addBranch"],
      "Szkoła podstawowa",
      async ({ app, form, schools }) => {
        const attempts = await guardWrites(page);
        const dialog = await openPendingStructure(app, form);
        await choosePending(app, dialog, schools.addBranch);
        await acceptPending(dialog, form);
        await fillSchoolName(app, form, "");
        const save = form.getByRole("button", { name: "Zapisz", exact: true });
        if (await save.isEnabled()) await save.click();
        await test.step("Sprawdzenie: widoczność elementu — form", async () =>
          expect(form).toBeVisible());
        await test.step("Sprawdzenie: liczba elementów — attempts; oczekiwane: 0", async () => {
          expect(attempts).toHaveLength(0);
        });
        await cancelSchoolAdd(form);
      },
    );
  });

  for (const failure of [
    { id: "STR-104", label: "HTTP 422", status: 422 },
    { id: "STR-105", label: "HTTP 500", status: 500 },
    { id: "STR-106", label: "timeout", abort: "timedout" as const },
  ]) {
    test(`${failure.id}: ${failure.label} zapisu szkoły nie zapisuje osieroconej struktury @school @structure @school-add @negative @mock`, async ({
      page,
      authSession,
    }, info) => {
      await withNewSchool(
        page,
        authSession,
        info,
        ["addBranch"],
        "Szkoła podstawowa",
        async ({ app, api, form, schools, name }) => {
          let relationWrites = 0;
          await page.route("**/api/Institution/AddOrUpdateInstitutionRelations", async (route) => {
            relationWrites++;
            await route.fulfill({ status: 422, contentType: "application/json", body: "{}" });
          });
          await page.route("**/api/Institution/AddNewInstitution", async (route) => {
            if ("abort" in failure) await route.abort(failure.abort);
            else
              await route.fulfill({
                status: failure.status,
                contentType: "application/json",
                body: JSON.stringify({ message: "Kontrolowany błąd szkoły" }),
              });
          });
          const dialog = await openPendingStructure(app, form);
          await choosePending(app, dialog, schools.addBranch);
          await acceptPending(dialog, form);
          const finished =
            "abort" in failure
              ? page.waitForEvent("requestfailed", {
                  predicate: (request) => request.url().includes("AddNewInstitution"),
                })
              : page.waitForResponse(
                  (response) =>
                    response.url().includes("AddNewInstitution") &&
                    response.request().method() === "POST",
                );
          await form.getByRole("button", { name: "Zapisz", exact: true }).click();
          await finished;
          await test.step("Sprawdzenie: toHaveURL — page; oczekiwane: /\\/school\\/school-panel$/", async () =>
            expect(page).toHaveURL(/\/school\/school-panel$/));
          await test.step("Sprawdzenie: liczba elementów w widoku — form; oczekiwane: 0", async () =>
            expect(form).toHaveCount(0));
          await test.step("Sprawdzenie: zgodność wartości — relationWrites; oczekiwane: 0", async () => {
            expect(relationWrites).toBe(0);
          });
          await test.step("Sprawdzenie: liczba elementów — api.edges(await api.tree(schools.addBranch)); oczekiwane: 0", async () => {
            expect(api.edges(await api.tree(schools.addBranch))).toHaveLength(0);
          });
          await app.searchMissing("school", "Nazwa szkoły", name);
        },
      );
    });
  }
});
