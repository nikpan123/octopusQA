import { expect } from "@playwright/test";
import {
  test,
  GRANTED,
  permissionRow,
  canonicalAssignments,
  expectedAssignments,
  type EntitlementData,
  type AccessRecord,
  type AccessClass,
} from "./entitlements";

export async function currentPermission(data: EntitlementData, record: AccessRecord) {
  const found = (await data.records()).find((item) => item.id === record.id);
  expect(found, `Uprawnienie ${record.id} istnieje u właściwego nauczyciela`).toBeDefined();
  return found!;
}

export function permissionClasses(record: AccessRecord) {
  return record.permissionClasses
    .filter((item) => item.isChecked)
    .map((item) => ({
      class: item.class,
      scopeId: item.scopeId ?? 4,
      levelId: item.levelId,
      schoolId: item.schoolId,
      isOur: item.isOur,
      manual: item.modifiedManualy === true,
    }))
    .sort((a, b) => a.class - b.class || a.scopeId - b.scopeId || a.levelId - b.levelId);
}

export async function accessClasses(
  data: EntitlementData,
  record: AccessRecord,
  classLevels: number[],
  scopeId = 4,
) {
  return test.step(`Przygotowanie: klasy ${classLevels.join(", ")} i zakres ${scopeId} z rzeczywistego słownika`, async () => {
    const classes = (await data.checkboxes(record)).filter(
      (item) => item.isOur && classLevels.includes(item.class) && (item.scopeId ?? 4) === scopeId,
    );
    expect(classes.map((item) => item.class).sort((a, b) => a - b)).toEqual(
      [...classLevels].sort((a, b) => a - b),
    );
    return classes;
  });
}

export async function expectAccessExport(
  data: EntitlementData,
  records: Array<{ record: AccessRecord; classes: AccessClass[] }>,
) {
  const expected = expectedAssignments(records);
  await test.step("Porównanie: eksport zawiera dokładnie oczekiwane przedmioty, klasy, poziomy i zakresy", async () =>
    expect.poll(async () => canonicalAssignments(await data.export())).toEqual(expected));
}

export async function automaticPermission(data: EntitlementData, record: AccessRecord) {
  let current = record;
  await test.step("Warunek początkowy: automat przyznał dostęp przed ingerencją BOK", async () =>
    expect
      .poll(async () => {
        current = await currentPermission(data, record);
        return { source: current.accessSource, status: current.accessStatus };
      })
      .toEqual({ source: "automat", status: GRANTED }));
  expect(current.permissionClasses.some((item) => item.isChecked && item.isOur)).toBe(true);
  return current;
}

export async function editPermissionClass(
  data: EntitlementData,
  record: AccessRecord,
  className: string,
  granted: boolean,
) {
  await test.step(`UI: ${granted ? "nadanie" : "odmowa"} dostępu tylko dla ${className}`, async () => {
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await panel.getByRole("button", { name: "Edycja", exact: true }).click();
    const dialog = data.page.locator("app-teacher-permissions-edit-dialog");
    await expect(dialog).toBeVisible();
    const target = dialog
      .locator(granted ? ".green-box" : ".red-box")
      .getByRole("checkbox", { name: className, exact: true });
    const opposite = dialog
      .locator(granted ? ".red-box" : ".green-box")
      .getByRole("checkbox", { name: className, exact: true });
    await expect(target).toHaveCount(1);
    await expect(opposite).toHaveCount(1);
    if (await opposite.isChecked()) await opposite.uncheck();
    await expect(target).toBeEnabled();
    await target.check();
    await expect(opposite).not.toBeChecked();
    await expect(target).toBeChecked();
    const save = dialog.getByRole("button", { name: "Zapisz", exact: true });
    await expect(save).toBeEnabled();
    const response = data.page.waitForResponse(
      (item) =>
        item.request().method() === "PUT" &&
        new URL(item.url()).pathname ===
          `/api/TeacherAccess/UpdateTeacherAccessPermission/${record.id}`,
    );
    await save.click();
    expect((await response).ok(), "Zapis decyzji przez formularz UI").toBe(true);
    await expect(dialog).toHaveCount(0);
  });
}

export async function restorePermission(
  data: EntitlementData,
  record: AccessRecord,
  confirm = true,
) {
  await test.step(`UI: ${confirm ? "potwierdzenie" : "anulowanie"} przywrócenia automatu`, async () => {
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await panel.getByRole("button", { name: "Przywróć", exact: true }).click();
    const dialog = data.page
      .locator("mat-dialog-container")
      .filter({ hasText: "Czy na pewno chcesz przywrócić uprawnienie" });
    await expect(dialog).toBeVisible();
    if (!confirm) {
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    } else {
      const response = data.page.waitForResponse(
        (item) =>
          item.request().method() === "PUT" &&
          new URL(item.url()).pathname ===
            `/api/TeacherAccess/RestoreTeacherAccessPermissionAutomation/${record.id}`,
      );
      await dialog.getByRole("button", { name: "Przywróć", exact: true }).click();
      expect((await response).ok(), "Przywrócenie automatu przez UI").toBe(true);
    }
    await expect(dialog).toHaveCount(0);
  });
}

export async function expectUnmarkedRecords(data: EntitlementData) {
  await test.step("UI: nauczyciel i obie dedykowane szkoły mają niezaznaczone Testowy", async () => {
    for (const school of data.schools) {
      expect(school.name).toContain("_ENT_UNMARKED_");
      await data.scenario.app.openPanel("school", school.id);
      await expect(data.scenario.app.detail("name")).toHaveValue(school.name);
      await expect(
        data.page.getByRole("checkbox", { name: "Testowy", exact: true }),
      ).not.toBeChecked();
    }
    await data.scenario.app.openPanel("teacher", data.teacherId);
    await expect(data.scenario.app.detail("lastName")).toHaveValue(data.scenario.id);
    await expect(
      data.page.getByRole("checkbox", { name: "Testowy", exact: true }),
    ).not.toBeChecked();
  });
}
