import type { Page } from "@playwright/test";

import { test, expect } from "./support/fixtures";

import { GOLD_SCHOOL, NO_MEDAL_SCHOOL, SILVER_SCHOOL } from "./support/school-medal-data";
import {
  addStructureSchoolCandidate,
  dismissWarning,
  expectStructureSchoolResult,
  expectVisibleStructureAddressesContain,
  fillStructureSearch,
  openSchoolStructure,
  openSchoolStructureDialog,
  removeStructureSchoolCandidate,
  selectStructureRelationCell,
  structureRelatedSchools,
  structureRelatedSchoolRow,
  structureSearchField,
  structureSearchResults,
  structureSchoolRow,
  submitStructureSearch,
} from "./support/school-structure";
import { Octopus } from "./support/octopus";

type StructureSaveItem = {
  institutionRelationId: number | null;
  sourceInstitutionUnitId: number;
  linkedInstitutionUnitId: number;
  institutionRelationTypeId: number;
  createdBy: number;
};

async function mockStructureSave(page: Page, status = 200) {
  const payloads: StructureSaveItem[][] = [];

  await page.route("**/api/Institution/AddOrUpdateInstitutionRelations", async (route) => {
    const body = route.request().postDataJSON() as StructureSaveItem[];
    payloads.push(body);
    await route.fulfill({
      status,
      contentType: "application/json",
      body: status >= 200 && status < 300 ? "true" : JSON.stringify({ status }),
    });
  });

  return payloads;
}

async function prepareStructureRelation(
  page: Page,
  app: Octopus,
  dialog: ReturnType<Octopus["dialog"]>,
  school: typeof GOLD_SCHOOL,
  type: "Zespół szkół" | "Filia" | "Wielobudynkowość",
  hierarchy: "Nadrzędna" | "Podrzędna",
) {
  await fillStructureSearch(app, dialog, { id: school.id });
  await submitStructureSearch(dialog);
  const row = await addStructureSchoolCandidate(dialog, school);
  await selectStructureRelationCell(page, row, "type", type);
  await selectStructureRelationCell(page, row, "hierarchy", hierarchy);
  return row;
}

test.describe("Struktura szkoły", () => {
  test("STR-01: szkoła bez relacji pokazuje pusty stan struktury @school @structure @smoke", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const panel = await openSchoolStructure(app, NO_MEDAL_SCHOOL);

    await expect(panel.getByText("Brak struktury organizacyjnej.", { exact: true })).toBeVisible();
  });

  test("STR-02: pusty stan blokuje filtrowanie struktury i pozwala dodać powiązanie @school @structure @validation", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const panel = await openSchoolStructure(app, NO_MEDAL_SCHOOL);

    await expect(
      panel.getByRole("button", { name: "Pokaż zaznaczone", exact: true }),
    ).toBeDisabled();
    await expect(
      panel.getByRole("button", { name: "Pokaż wszystkie", exact: true }),
    ).toBeDisabled();
    await expect(
      panel.getByRole("button", { name: "Dodaj powiązanie", exact: true }),
    ).toBeEnabled();
  });

  test("STR-03: dialog dodawania zawiera filtry, obie tabele i akcje @school @structure @dialog", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    for (const label of ["ID szkoły", "Nazwa szkoły", "Kod pocztowy", "Miejscowość", "Ulica"]) {
      await expect(
        structureSearchField(dialog, label),
        `Dialog powinien zawierać pole „${label}”`,
      ).toBeVisible();
    }

    const results = structureSearchResults(dialog);
    for (const header of ["Dodaj", "ID", "Poziom", "Nazwa Szkoły", "Adres Szkoły"]) {
      await expect(results.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }

    const related = structureRelatedSchools(dialog);
    for (const header of [
      "Usuń",
      "ID",
      "Poziom",
      "Nazwa szkoły",
      "Adres Szkoły",
      "Typ relacji",
      "Hierarchia",
    ]) {
      await expect(related.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }

    await expect(dialog.getByRole("button", { name: "Szukaj", exact: true })).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Anuluj", exact: true })).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeVisible();
  });

  test("STR-04: puste wyszukiwanie pokazuje walidację i pozostawia dialog otwarty @school @structure @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await submitStructureSearch(dialog);
    await dismissWarning(page, "Wyszukiwanie nie może być puste");
    await expect(dialog).toBeVisible();
  });

  test("STR-05: anulowanie pustego dialogu nie zmienia struktury @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);

    const panel = page.getByRole("tabpanel", { name: "Struktura", exact: true });
    await expect(panel.getByText("Brak struktury organizacyjnej.", { exact: true })).toBeVisible();
  });

  test("STR-06: wyszukiwanie po dokładnym ID zwraca właściwą szkołę @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, GOLD_SCHOOL);
  });

  test("STR-07: wyszukiwanie po pełnej nazwie zwraca właściwą szkołę @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { name: SILVER_SCHOOL.name });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, SILVER_SCHOOL);
  });

  test("STR-08: wyszukiwanie po fragmencie nazwy zwraca pasującą szkołę @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    const nameFragment = GOLD_SCHOOL.name.split(" ").slice(0, 3).join(" ");

    await fillStructureSearch(app, dialog, { name: nameFragment });
    await submitStructureSearch(dialog);

    const rows = structureSearchResults(dialog).getByRole("row");
    await expect.poll(() => rows.count()).toBeGreaterThan(1);

    const count = await rows.count();
    for (let index = 1; index < count; index += 1) {
      await expect(rows.nth(index).getByRole("gridcell").nth(3)).toContainText(nameFragment);
    }
  });

  test("STR-09: wyszukiwanie po kodzie pocztowym zwraca zgodne adresy @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { postalCode: "84-300" });
    await submitStructureSearch(dialog);
    await expectVisibleStructureAddressesContain(dialog, "84-300");
  });

  test("STR-10: wyszukiwanie po miejscowości zwraca zgodne adresy @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { city: "Lębork" });
    await submitStructureSearch(dialog);
    await expectVisibleStructureAddressesContain(dialog, "Lębork");
  });

  test("STR-11: wyszukiwanie po ulicy zwraca zgodne adresy @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { street: "Kościuszki" });
    await submitStructureSearch(dialog);
    await expectVisibleStructureAddressesContain(dialog, "Kościuszki");
  });

  test("STR-12: wyszukiwanie łączy ID i nazwę szkoły @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id, name: GOLD_SCHOOL.name });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, GOLD_SCHOOL);
  });

  test("STR-13: nieistniejące ID pozostawia pustą tabelę wyników @school @structure @search @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: "999999" });
    await submitStructureSearch(dialog);

    await expect(structureSearchResults(dialog).getByRole("row")).toHaveCount(1);
    await expect(structureSearchResults(dialog).getByRole("gridcell")).toHaveCount(0);
    await expect(dialog).toBeVisible();
  });

  test("STR-14: szkołę można dodać do planowanych powiązań bez zapisu @school @structure @positive", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-15: niezapisaną szkołę można usunąć z planowanych powiązań @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);
    await removeStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(0);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-16: pojedyncze poprawne powiązanie wysyła jedno żądanie zapisu @school @structure @api", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    expect(payloads[0]).toHaveLength(1);
    expect(payloads[0][0]).toMatchObject({
      institutionRelationId: null,
      institutionRelationTypeId: 1,
    });
    expect(payloads[0][0].sourceInstitutionUnitId).not.toBe(payloads[0][0].linkedInstitutionUnitId);
    await expect(dialog).toHaveCount(0);
  });

  test("STR-17: trwałość relacji po ponownym otwarciu @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda relacji i endpointu cleanup/undo");
  });

  test("STR-18: anulowanie po dodaniu szkoły nie zachowuje planowanego powiązania @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    let dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);

    const panel = page.getByRole("tabpanel", { name: "Struktura", exact: true });
    await expect(panel.getByText("Brak struktury organizacyjnej.", { exact: true })).toBeVisible();

    dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await expect(structureRelatedSchools(dialog).getByRole("row")).toHaveCount(1);
    await expect(structureRelatedSchools(dialog).getByRole("gridcell")).toHaveCount(0);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-19: kilka szkół jest wysyłanych dokładnie raz w jednym zapisie @school @structure @api", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    await prepareStructureRelation(page, app, dialog, SILVER_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    expect(payloads[0]).toHaveLength(2);
    expect(new Set(payloads[0].map((item) => item.linkedInstitutionUnitId)).size).toBe(2);
    await expect(dialog).toHaveCount(0);
  });

  test("STR-20: filtrowanie zaznaczonej gałęzi i całej struktury @school @structure @blocked", async () => {
    test.fixme(true, "brak stabilnej struktury referencyjnej");
  });

  for (const relation of [
    { id: "STR-21", label: "Zespół szkół" as const, apiId: 1 },
    { id: "STR-22", label: "Filia" as const, apiId: 2 },
    { id: "STR-23", label: "Wielobudynkowość" as const, apiId: 3 },
  ]) {
    test(`${relation.id}: typ „${relation.label}” jest dostępny i mapowany do kontraktu API @school @structure @api`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
      await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, relation.label, "Podrzędna");
      const payloads = await mockStructureSave(page);

      await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

      await expect.poll(() => payloads.length).toBe(1);
      expect(payloads[0][0].institutionRelationTypeId).toBe(relation.apiId);
      await expect(dialog).toHaveCount(0);
    });
  }

  test("STR-24: niedozwolony typ relacji dla pary jednostek @school @structure @blocked", async () => {
    test.fixme(true, "niepotwierdzone reguły dozwolonych par");
  });

  test("STR-25: duplikat aktywnej relacji @school @structure @blocked", async () => {
    test.fixme(true, "brak bezpiecznego seeda aktywnej relacji");
  });

  test("STR-26: ta sama para z innym typem @school @structure @blocked", async () => {
    test.fixme(true, "brak decyzji biznesowej dla wielu typów");
  });

  test("STR-27: bieżącej szkoły nie można dodać jako własnego powiązania @school @structure @validation @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: NO_MEDAL_SCHOOL.id });
    await submitStructureSearch(dialog);

    const currentSchool = structureSchoolRow(dialog, NO_MEDAL_SCHOOL.id);
    if ((await currentSchool.count()) === 1) {
      await currentSchool.getByRole("gridcell").first().click();

      const warning = page.getByRole("dialog").filter({ hasText: "Uwaga" }).last();
      if (await warning.isVisible().catch(() => false)) {
        await warning.getByRole("button", { name: "OK", exact: true }).click();
      }
    }

    await expect(structureRelatedSchoolRow(dialog, NO_MEDAL_SCHOOL.id)).toHaveCount(0);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("STR-28: cykl bezpośredni @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda i cleanupu grafu relacji");
  });

  test("STR-29: cykl pośredni @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda i cleanupu grafu relacji");
  });

  test("STR-30: maksymalna głębokość hierarchii @school @structure @blocked", async () => {
    test.fixme(true, "nieznany limit głębokości");
  });

  test("STR-31: przekroczenie głębokości hierarchii @school @structure @blocked", async () => {
    test.fixme(true, "nieznany limit głębokości");
  });

  test("STR-32: edycja typu relacji @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda istniejącej relacji i cleanupu");
  });

  test("STR-33: zamiana stron relacji @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda istniejącej relacji i cleanupu");
  });

  test("STR-34: soft delete relacji @school @structure @blocked", async () => {
    test.fixme(true, "brak technicznego odczytu stanu nieaktywnego");
  });

  test("STR-35: przywrócenie relacji @school @structure @blocked", async () => {
    test.fixme(true, "nieznany endpoint i położenie akcji undo");
  });

  test("STR-36: ponowne dodanie po soft delete @school @structure @blocked", async () => {
    test.fixme(true, "niepotwierdzony kontrakt reaktywacji");
  });

  test("STR-37: brak wpływu nieaktywnej relacji na biznes @school @structure @blocked", async () => {
    test.fixme(true, "brak technicznego seeda i odczytu");
  });

  test("STR-38: automatyczne nadanie ID zespołu szkół @school @structure @blocked", async () => {
    test.fixme(true, "brak factory i cleanupu zespołu szkół");
  });

  test("STR-39: unikalność ID zespołu szkół @school @structure @blocked", async () => {
    test.fixme(true, "wymaga atomowego testu backendu");
  });

  test("STR-40: brak kolizji ID z numeracją szkół @school @structure @blocked", async () => {
    test.fixme(true, "wymaga kontrolowanego seeda backendu");
  });

  test("STR-41: wyszukiwanie zespołu po trzycyfrowym ID @school @structure @blocked", async () => {
    test.fixme(true, "brak stabilnego zespołu referencyjnego");
  });

  test("STR-42: dane identyfikacyjne zespołu w integracji @school @structure @blocked", async () => {
    test.fixme(true, "nieznany endpoint integracyjny");
  });

  test("STR-43: trwałość rekordu relacji @school @structure @blocked", async () => {
    test.fixme(true, "brak technicznego endpointu odczytu rekordu");
  });

  test("STR-44: rozszerzalność słownika typów @school @structure @blocked", async () => {
    test.fixme(true, "test należy do repozytorium backendu/migracji");
  });

  test("STR-45: audyt utworzenia @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda relacji i kontraktu odczytu audytu");
  });

  test("STR-46: audyt edycji @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda relacji i kontraktu odczytu audytu");
  });

  test("STR-47: audyt soft delete @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda relacji i kontraktu odczytu audytu");
  });

  test("STR-48: audyt przywrócenia @school @structure @blocked", async () => {
    test.fixme(true, "brak seeda relacji i kontraktu odczytu audytu");
  });

  test("STR-49: odpowiedź 422 nie zamyka dialogu ani nie ponawia zapisu @school @structure @api @negative", async ({
    page,
  }) => {
    test.fixme(true, "Znany defekt DEV: po odpowiedzi 422 dialog jest zamykany.");
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page, 422);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    await expect(dialog).toBeVisible();
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
  });

  test("STR-50: odpowiedź 500 zachowuje przygotowaną relację i pozwala ponowić zapis @school @structure @api @negative", async ({
    page,
  }) => {
    test.fixme(true, "Znany defekt DEV: po odpowiedzi 500 dialog jest zamykany i traci stan.");
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await prepareStructureRelation(page, app, dialog, GOLD_SCHOOL, "Zespół szkół", "Podrzędna");
    const payloads = await mockStructureSave(page, 500);

    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect.poll(() => payloads.length).toBe(1);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeEnabled();
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
  });

  test("STR-51: konflikt równoczesnej edycji @school @structure @blocked", async () => {
    test.fixme(true, "brak wersjonowania lub kontraktu konfliktu");
  });

  test("STR-52: uprawnienia tylko do odczytu @school @structure @blocked", async () => {
    test.fixme(true, "brak konta lub tokenu read-only");
  });

  test("STR-53: wyszukiwanie złożone wyłącznie z białych znaków jest odrzucane @school @structure @validation @negative", async ({
    page,
  }) => {
    test.fixme(
      true,
      "Znany defekt DEV: kryterium złożone z samych spacji zwraca pełną listę szkół.",
    );
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { name: "   " });
    await submitStructureSearch(dialog);
    await dismissWarning(page, "Wyszukiwanie nie może być puste");

    await expect(dialog).toBeVisible();
    await expect(structureSearchResults(dialog).getByRole("gridcell")).toHaveCount(0);
  });

  test("STR-54: ponowne wyszukiwanie zastępuje poprzednie wyniki @school @structure @search", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, GOLD_SCHOOL);

    await fillStructureSearch(app, dialog, { id: SILVER_SCHOOL.id });
    await submitStructureSearch(dialog);
    await expectStructureSchoolResult(dialog, SILVER_SCHOOL);
    await expect(structureSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(0);
  });

  test("STR-55: tej samej szkoły nie można dodać dwukrotnie do planowanych powiązań @school @structure @validation", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    const resultRow = structureSchoolRow(dialog, GOLD_SCHOOL.id);
    if ((await resultRow.count()) === 1) {
      await resultRow.getByRole("gridcell").first().click();
    }

    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });

  test("STR-56: usuniętą planowaną szkołę można ponownie dodać @school @structure @positive", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);
    await removeStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });

  test("STR-57: anulowanie kilku planowanych powiązań nie zachowuje żadnego z nich @school @structure @cancel", async ({
    page,
  }) => {
    const app = new Octopus(page);
    let dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);

    await fillStructureSearch(app, dialog, { id: GOLD_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, GOLD_SCHOOL);

    await fillStructureSearch(app, dialog, { id: SILVER_SCHOOL.id });
    await submitStructureSearch(dialog);
    await addStructureSchoolCandidate(dialog, SILVER_SCHOOL);
    await expect(structureRelatedSchoolRow(dialog, GOLD_SCHOOL.id)).toHaveCount(1);
    await expect(structureRelatedSchoolRow(dialog, SILVER_SCHOOL.id)).toHaveCount(1);

    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    dialog = await openSchoolStructureDialog(app, NO_MEDAL_SCHOOL);
    await expect(structureRelatedSchools(dialog).getByRole("gridcell")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  });
});
