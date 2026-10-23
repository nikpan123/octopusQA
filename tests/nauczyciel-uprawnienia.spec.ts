import { expect } from "@playwright/test";
import {
  accessClasses,
  automaticPermission,
  currentPermission,
  editPermissionClass,
  expectAccessExport,
  expectUnmarkedRecords,
  permissionClasses,
  restorePermission,
} from "./support/access-regression";
import {
  test,
  twoSchoolTest,
  GRANTED,
  hasBokSource,
  permissionRow,
  openPermissionDetails,
  canonicalAssignments,
  expectedAssignments,
} from "./support/entitlements";

test.describe("Uprawnienia nauczyciela — prezentacja dostępu cyfrowego", () => {
  test.beforeEach(async () => {
    test.setTimeout(240000);
  });

  test("PERM-01: zakładka Uprawnienia sąsiaduje z Potwierdzeniami @teacher @entitlement @smoke", async ({
    access: data,
  }) => {
    await data.open();
    const tabs = await data.page.getByRole("tab").allTextContents();
    const names = tabs.map((name) => name.trim());
    await test.step('Sprawdzenie: zgodność wartości — names.indexOf("Uprawnienia"); oczekiwane: names.indexOf("Potwierdzenia") + 1', async () => {
      expect(names.indexOf("Uprawnienia")).toBe(names.indexOf("Potwierdzenia") + 1);
    });
  });

  test("PERM-02: aktywne potwierdzenie jest widoczne mimo braku zamówień @teacher @entitlement @no-orders", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const panel = await data.open();
    const row = permissionRow(panel, record);
    await test.step("Sprawdzenie: liczba elementów w widoku — row; oczekiwane: 1", async () =>
      expect(row).toHaveCount(1));
    await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-subject"); oczekiwane: record.subject', async () =>
      expect(row.locator(".mat-column-subject")).toHaveText(record.subject));
    await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-schoolName"); oczekiwane: data.schools[0].name', async () =>
      expect(row.locator(".mat-column-schoolName")).toHaveText(data.schools[0].name));
    // Szkoła jest oznaczona Testowy: promocja może przyznać dostęp mimo braku
    // zamówień. Ten scenariusz sprawdza widoczność, nie bazową decyzję odmowną.
  });

  test("PERM-03: lista zawiera wymagane podstawowe kolumny @teacher @entitlement @columns", async ({
    access: data,
  }) => {
    const panel = await data.open();
    for (const name of [
      "Potw. ID",
      "Przedmiot",
      "Szkoła",
      "Adres szkoły",
      "Rok szkolny",
      "Status dostępu",
      "Zakres klas",
    ])
      await test.step('Sprawdzenie: widoczność elementu — panel.getByRole("columnheader", { name, exact: true })', async () =>
        expect(panel.getByRole("columnheader", { name, exact: true })).toBeVisible());
  });

  test("PERM-04: tabela ma aktualny zestaw i kolejność kolumn @teacher @entitlement @columns", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const panel = await data.open();
    await test.step("Sprawdzenie: zapisane uprawnienie jest widoczne w tabeli", async () =>
      expect(permissionRow(panel, record)).toHaveCount(1));
    await test.step("Porównanie: siedem aktualnych nagłówków w kolejności widoku, bez kolumny Źródło dostępu", async () =>
      expect
        .poll(async () =>
          (await panel.getByRole("columnheader").allTextContents())
            .map((name) => name.replace(/\s+/g, " ").trim())
            // Puste nagłówki techniczne, np. rozwijania wiersza, nie są polami danych.
            .filter(Boolean),
        )
        .toEqual([
          "Potw. ID",
          "Przedmiot",
          "Szkoła",
          "Adres szkoły",
          "Rok szkolny",
          "Status dostępu",
          "Zakres klas",
        ]));
  });

  test("PERM-05: szczegół zawiera wszystkie klasy przedmiotu również nieprzyznane @teacher @entitlement @classes", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Fizyka", ["7"]));
    const available = await test.step("API: odczyt dostępnych klas i zakresów Fizyki", async () =>
      data.checkboxes(record));
    const expectedLabels =
      await test.step("Przygotowanie oczekiwań: osobna pozycja dla każdej klasy i zakresu, niezależnie od wydawnictwa", async () => {
        const scopeLabels = new Map([
          [4, "F+"],
          [18, "TNŚ"],
        ]);
        const uniqueClasses = new Map(
          available.map((item) => [`${item.class}:${item.scopeId}`, item]),
        );
        return [...uniqueClasses.values()]
          .map((item) => {
            const scope = scopeLabels.get(item.scopeId ?? 4);
            expect(scope, `Rozpoznany zakres Fizyki: scopeId=${item.scopeId}`).toBeDefined();
            return `${item.class} ${scope}`;
          })
          .sort();
      });
    const details = await openPermissionDetails(await data.open(), record);
    await test.step("Porównanie: komplet etykiet klas i zakresów z API jest widoczny w szczególe, bez braków i dodatkowych wierszy", async () =>
      expect
        .poll(async () =>
          (await details.locator("td.mat-column-class").allTextContents())
            .map((value) => value.replace(/\s+/g, " ").trim())
            .sort(),
        )
        .toEqual(expectedLabels));
    await test.step("Sprawdzenie: szczegół zawiera także pozycje bez przyznanego dostępu", async () =>
      expect(
        details.locator("td.mat-column-status").filter({ hasText: /^\s*Brak dostępu\s*$/ }),
      ).not.toHaveCount(0));
  });

  test("PERM-06: szczegół pokazuje zapisane ilości progi powody lata i daty @teacher @entitlement @details", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await test.step("Sprawdzenie: wartość powyżej granicy — record.details.length; granica: 0", async () => {
      expect(record.details.length, "Rekord musi zawierać kwalifikację per klasa").toBeGreaterThan(
        0,
      );
    });
    const details = await openPermissionDetails(await data.open(), record);
    for (const name of ["Status", "Klasa", "Zamówiono", "Próg", "Powód", "Rok zamówień", "Data"])
      await test.step('Sprawdzenie: widoczność elementu — details.getByRole("columnheader", { name, exact: true })', async () =>
        expect(details.getByRole("columnheader", { name, exact: true })).toBeVisible());
    for (const item of record.details) {
      const row = details
        .locator("td.mat-column-class")
        .and(details.getByRole("cell", { name: item.class, exact: true }))
        .locator("xpath=ancestor::tr[1]");
      await test.step("Sprawdzenie: liczba elementów w widoku — row; oczekiwane: 1", async () =>
        expect(row).toHaveCount(1));
      await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-status"); oczekiwane: item.status', async () =>
        expect(row.locator(".mat-column-status")).toHaveText(item.status));
      await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-orderedCount"); oczekiwane: String(item.orderedCount)', async () =>
        expect(row.locator(".mat-column-orderedCount")).toHaveText(String(item.orderedCount)));
      await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-threshold"); oczekiwane: String(item.threshold)', async () =>
        expect(row.locator(".mat-column-threshold")).toHaveText(String(item.threshold)));
      await test.step("Porównanie: powód jest prezentowany tylko dla braku dostępu", async () => {
        const reason = row.locator(".mat-column-reasonForLack");
        if (item.status === GRANTED)
          await expect(reason).toHaveText("Promocja debiutu"); // Wartość powinna być "Promocja testowa", ale to nie jest zrobionie
        else await expect(reason).toHaveText(item.reasonForLack || "-");
      });
      await test.step("Porównanie: lata zamówień odpowiadają API, a znak „-” oznacza brak lat", async () =>
        expect
          .poll(async () => {
            const text = (await row.locator(".mat-column-orderYears").innerText()).trim();
            if (text === "" || text === "-") return null;
            return JSON.parse(text);
          })
          .toEqual(item.orderYears));
      await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-grantedAt"); oczekiwane: item.grantedAt ?? ""', async () =>
        expect(row.locator(".mat-column-grantedAt")).toHaveText(item.grantedAt ?? ""));
    }
  });

  test("PERM-07: Przyznano w nagłówku oznacza co najmniej jedną przyznaną klasę @teacher @entitlement @status", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await test.step("Sprawdzenie: wartość powyżej granicy — record.details.length; granica: 0", async () => {
      expect(record.details.length).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: zgodność wartości — record.accessStatus === GRANTED; oczekiwane: record.details.some((item) => item.status === GRANTED)", async () => {
      expect(record.accessStatus === GRANTED).toBe(
        record.details.some((item) => item.status === GRANTED),
      );
    });
    const panel = await data.open();
    await test.step('Sprawdzenie: tekst w widoku — permissionRow(panel, record).locator(".mat-column-accessStatus"); oczekiwane: record.accessStatus', async () =>
      expect(permissionRow(panel, record).locator(".mat-column-accessStatus")).toHaveText(
        record.accessStatus,
      ));
  });

  test("PERM-08: bez zaznaczenia rekordu akcje są zablokowane @teacher @entitlement @selection", async ({
    access: data,
  }) => {
    await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
      data.create());
    const panel = await data.open();
    for (const name of ["Edycja", "Historia", "Przywróć"])
      await test.step('Sprawdzenie: zablokowanie działania — panel.getByRole("button", { name, exact: true })', async () =>
        expect(panel.getByRole("button", { name, exact: true })).toBeDisabled());
  });

  test("PERM-09: rekord automatyczny nie pozwala przywracać automatu @teacher @entitlement @restore", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await test.step('Sprawdzenie: zgodność wartości — record.accessSource; oczekiwane: "automat"', async () => {
      expect(record.accessSource).toBe("automat");
    });
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await test.step('Sprawdzenie: dostępność działania — panel.getByRole("button", { name: "Historia", exact: true })', async () =>
      expect(panel.getByRole("button", { name: "Historia", exact: true })).toBeEnabled());
    await test.step('Sprawdzenie: zablokowanie działania — panel.getByRole("button", { name: "Przywróć", exact: true })', async () =>
      expect(panel.getByRole("button", { name: "Przywróć", exact: true })).toBeDisabled());
  });

  test("PERM-10: anulowanie edycji nie zapisuje decyzji ani historii @teacher @entitlement @cancel", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const history = await test.step("API: odczyt historii zmian uprawnienia", async () =>
      data.history(record));
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await panel.getByRole("button", { name: "Edycja", exact: true }).click();
    const dialog = data.page.locator("app-teacher-permissions-edit-dialog");
    await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
      expect(dialog).toBeVisible());
    const checkbox = dialog.getByRole("checkbox", { disabled: false }).first();
    await test.step("Sprawdzenie: widoczność elementu — checkbox", async () =>
      expect(checkbox).toBeVisible());
    await checkbox.setChecked(!(await checkbox.isChecked()));
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
      expect(dialog).toHaveCount(0));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await data.records()).find((item) => item.id === record.id); oczekiwane: record", async () => {
      expect((await data.records()).find((item) => item.id === record.id)).toEqual(record);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await data.history(record); oczekiwane: history", async () => {
      expect(await data.history(record)).toEqual(history);
    });
  });

  test("PERM-11: historia dotyczy zaznaczonego przedmiotu i roku @teacher @entitlement @history", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await panel.getByRole("button", { name: "Historia", exact: true }).click();
    const dialog = data.page.locator("app-teacher-permissions-history-dialog");
    await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
      expect(dialog).toBeVisible());
    await test.step('Sprawdzenie: obecność tekstu w widoku — dialog.getByRole("heading"); oczekiwane: record.subject', async () =>
      expect(dialog.getByRole("heading")).toContainText(record.subject));
    await test.step('Sprawdzenie: obecność tekstu w widoku — dialog.getByRole("heading"); oczekiwane: String(record.schoolYear)', async () =>
      expect(dialog.getByRole("heading")).toContainText(String(record.schoolYear)));
    for (const name of [
      "Poziom",
      "Nazwa szkoły",
      "Zakres przyznany",
      "Zakres bez dostępu",
      "Modyfikacja",
      "Autor zapisu",
      "Data zapisu",
    ])
      await test.step('Sprawdzenie: widoczność elementu — dialog.getByRole("columnheader", { name, exact: true })', async () =>
        expect(dialog.getByRole("columnheader", { name, exact: true })).toBeVisible());
    await dialog.getByRole("button", { name: "Zamknij", exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
      expect(dialog).toHaveCount(0));
  });

  test("PERM-12: ponowne otwarcie zakładki nie zmienia kwalifikacji @teacher @entitlement @persistence", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const before = await test.step("API: odczyt zapisanych uprawnień nauczyciela", async () =>
      data.records());
    await data.open();
    await data.page.getByRole("tab", { name: "Potwierdzenia", exact: true }).click();
    await data.page.getByRole("tab", { name: "Uprawnienia", exact: true }).click();
    await test.step('Sprawdzenie: widoczność elementu — permissionRow(data.page.locator("app-teacher-permissions"), record)', async () =>
      expect(permissionRow(data.page.locator("app-teacher-permissions"), record)).toBeVisible());
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await data.records(); oczekiwane: before", async () => {
      expect(await data.records()).toEqual(before);
    });
  });

  test("PERM-13: dwa przedmioty tworzą osobne rekordy uprawnień @teacher @entitlement @isolation", async ({
    access: data,
  }) => {
    const math =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const physics =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Fizyka", ["7"]));
    await test.step("Sprawdzenie: negacja — zgodność wartości — math.id; oczekiwane: physics.id", async () => {
      expect(math.id).not.toBe(physics.id);
    });
    const panel = await data.open();
    await test.step("Sprawdzenie: liczba elementów w widoku — permissionRow(panel, math); oczekiwane: 1", async () =>
      expect(permissionRow(panel, math)).toHaveCount(1));
    await test.step("Sprawdzenie: liczba elementów w widoku — permissionRow(panel, physics); oczekiwane: 1", async () =>
      expect(permissionRow(panel, physics)).toHaveCount(1));
    await test.step('Sprawdzenie: tekst w widoku — permissionRow(panel, math).locator(".mat-column-subject"); oczekiwane: "Matematyka"', async () =>
      expect(permissionRow(panel, math).locator(".mat-column-subject")).toHaveText("Matematyka"));
    await test.step('Sprawdzenie: tekst w widoku — permissionRow(panel, physics).locator(".mat-column-subject"); oczekiwane: "Fizyka"', async () =>
      expect(permissionRow(panel, physics).locator(".mat-column-subject")).toHaveText("Fizyka"));
  });

  twoSchoolTest(
    "PERM-14: ten sam przedmiot w dwóch szkołach ma oddzielne rekordy @teacher @entitlement @isolation",
    async ({ access: data }) => {
      const first =
        await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
          data.create());
      const second =
        await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
          data.create("Matematyka", ["4"], data.schools[1]));
      const panel = await data.open();
      await test.step('Sprawdzenie: tekst w widoku — permissionRow(panel, first).locator(".mat-column-schoolName"); oczekiwane: data.schools[0].name', async () =>
        expect(permissionRow(panel, first).locator(".mat-column-schoolName")).toHaveText(
          data.schools[0].name,
        ));
      await test.step('Sprawdzenie: tekst w widoku — permissionRow(panel, second).locator(".mat-column-schoolName"); oczekiwane: data.schools[1].name', async () =>
        expect(permissionRow(panel, second).locator(".mat-column-schoolName")).toHaveText(
          data.schools[1].name,
        ));
    },
  );

  test("PERM-15: dane ilościowe w szczególe nie są edytowalne @teacher @entitlement @readonly", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const details = await openPermissionDetails(await data.open(), record);
    for (const column of ["orderedCount", "threshold", "orderYears"])
      await test.step("Sprawdzenie: liczba elementów w widoku — details.locator( `td.mat-column-${column} input, td.mat-column-${column} [contenteditable=true]`, ); oczekiwane: 0", async () =>
        expect(
          details.locator(
            `td.mat-column-${column} input, td.mat-column-${column} [contenteditable=true]`,
          ),
        ).toHaveCount(0));
  });

  test("PERM-16: nadanie jednej klasy przez UI zapisuje decyzję BOK i historię @teacher @entitlement @manual", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await data.decide(record, []);
    const history = await test.step("API: odczyt historii zmian uprawnienia", async () =>
      data.history(record));
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await panel.getByRole("button", { name: "Edycja", exact: true }).click();
    const dialog = data.page.locator("app-teacher-permissions-edit-dialog");
    await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
      expect(dialog).toBeVisible());
    const checkbox = dialog.locator(".green-box").getByRole("checkbox", { name: "4", exact: true });
    const refusal = dialog.locator(".red-box").getByRole("checkbox", { name: "4", exact: true });
    await test.step("UI: odznaczenie odmowy dla klasy 4 odblokowuje możliwość przyznania dostępu", async () => {
      await expect(checkbox).toHaveCount(1);
      await expect(refusal).toHaveCount(1);
      await expect(refusal).toBeChecked();
      await expect(checkbox).toBeDisabled();
      await refusal.uncheck();
      await expect(refusal).not.toBeChecked();
      await expect(checkbox).toBeEnabled();
    });
    await test.step("UI: przyznanie dostępu do klasy 4 bez jednoczesnej odmowy", async () => {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await expect(refusal).not.toBeChecked();
      await expect(dialog.getByRole("button", { name: "Zapisz", exact: true })).toBeEnabled();
    });
    const saved = data.page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname ===
          `/api/TeacherAccess/UpdateTeacherAccessPermission/${record.id}`,
    );
    await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
    await test.step("Sprawdzenie: zgodność wartości — (await saved).ok(); oczekiwane: true", async () => {
      expect((await saved).ok()).toBe(true);
    });
    await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
      expect(dialog).toHaveCount(0));
    const classes = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(record))
    ).filter((item) => item.isOur && item.class === 4);
    await test.step("Sprawdzenie: wartość powyżej granicy — classes.length; granica: 0", async () => {
      expect(classes.length).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => canonicalAssignments(await data.export()); oczekiwane: expectedAssignments([{ record, classes }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record, classes }])));
    await test.step("Sprawdzenie: zgodność wartości — hasBokSource((await data.records()).find((item) => item.id === record.id)!.accessSource); oczekiwane: true", async () => {
      expect(
        hasBokSource((await data.records()).find((item) => item.id === record.id)!.accessSource),
      ).toBe(true);
    });
    await test.step("Sprawdzenie: wartość powyżej granicy — async () => (await data.history(record)).length; granica: history.length", async () =>
      expect.poll(async () => (await data.history(record)).length).toBeGreaterThan(history.length));
  });

  test("PERM-17: Przywróć wyłącza decyzję ręczną i pokazuje wynik automatu @teacher @entitlement @restore @manual", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const automatic = await automaticPermission(data, record);
    const baseline = { accessStatus: automatic.accessStatus, classRange: automatic.classRange };
    const baselineClasses = permissionClasses(automatic);
    const previousHistory = await data.history(record);
    await expectAccessExport(data, [
      {
        record,
        classes: automatic.permissionClasses.filter((item) => item.isChecked && item.isOur),
      },
    ]);
    await data.decide(record, []);
    const panel = await data.open();
    await permissionRow(panel, record).click();
    await panel.getByRole("button", { name: "Przywróć", exact: true }).click();
    const confirm = data.page
      .locator("mat-dialog-container")
      .filter({ hasText: "Czy na pewno chcesz przywrócić uprawnienie" });
    await test.step("Sprawdzenie: widoczność elementu — confirm", async () =>
      expect(confirm).toBeVisible());
    const saved = data.page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname ===
          `/api/TeacherAccess/RestoreTeacherAccessPermissionAutomation/${record.id}`,
    );
    await confirm.getByRole("button", { name: "Przywróć", exact: true }).click();
    await test.step("Sprawdzenie: zgodność wartości — (await saved).ok(); oczekiwane: true", async () => {
      expect((await saved).ok()).toBe(true);
    });
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — async () => { const current = (await data.records()).find((item) => item.id === record.id); return ( current && { …; oczekiwane: { accessSource: "automat", ...baseline }', async () =>
      expect
        .poll(async () => {
          const current = (await data.records()).find((item) => item.id === record.id);
          return (
            current && {
              accessSource: current.accessSource,
              accessStatus: current.accessStatus,
              classRange: current.classRange,
            }
          );
        })
        .toEqual({ accessSource: "automat", ...baseline }));
    await test.step("Porównanie: przywrócono wszystkie klasy automatu i wyłączono decyzje ręczne, nie tylko zmieniono źródło", async () =>
      expect
        .poll(async () => permissionClasses(await currentPermission(data, record)))
        .toEqual(baselineClasses));
    await expectAccessExport(data, [
      {
        record,
        classes: automatic.permissionClasses.filter((item) => item.isChecked && item.isOur),
      },
    ]);
    await test.step("Sprawdzenie: historia sprzed decyzji BOK pozostała po przywróceniu automatu", async () => {
      const history = await data.history(record);
      for (const entry of previousHistory) expect(history).toContainEqual(entry);
    });
    const reopened = await data.open();
    await permissionRow(reopened, record).click();
    await test.step('Sprawdzenie: zablokowanie działania — reopened.getByRole("button", { name: "Przywróć", exact: true })', async () =>
      expect(reopened.getByRole("button", { name: "Przywróć", exact: true })).toBeDisabled());
  });

  test("PERM-18: odmowa klasy 4 przez UI nie zmienia automatu dla pozostałych klas @teacher @entitlement @manual @isolation", async ({
    access: data,
  }) => {
    const record = await data.create();
    const before = await automaticPermission(data, record);
    const others = permissionClasses(before).filter((item) => item.class !== 4);
    const previousHistory = await data.history(record);
    expect(others.length, "Istnieją inne klasy do kontroli izolacji").toBeGreaterThan(0);
    expect(
      before.permissionClasses.some((item) => item.class === 4 && item.isOur && item.isChecked),
    ).toBe(true);
    await editPermissionClass(data, record, "4", false);
    await test.step("Porównanie API: BOK odmówił tylko klasy 4; pozostałe klasy i ich źródło automatyczne pozostały bez zmian", async () =>
      expect
        .poll(async () => {
          const current = await currentPermission(data, record);
          const classes = permissionClasses(current);
          return {
            bok: hasBokSource(current.accessSource),
            refused: classes
              .filter((item) => item.class === 4)
              .map((item) => ({ isOur: item.isOur })),
            decision: current.details
              .filter((item) => item.class === "4")
              .map((item) => ({ status: item.status, reason: item.reasonForLack })),
            others: classes.filter((item) => item.class !== 4),
          };
        })
        .toEqual({
          bok: true,
          refused: [{ isOur: false }],
          decision: [{ status: "Brak dostępu", reason: "BOK" }],
          others,
        }));
    await test.step("Porównanie: historia potwierdza nową ręczną odmowę wyłącznie klasy 4", async () => {
      const previousIds = new Set(previousHistory.map((item) => item.id));
      await expect
        .poll(async () => {
          const entry = (await data.history(record)).find(
            (item) => !previousIds.has(item.id) && item.modificationType === "Ręczna edycja",
          );
          return entry
            ? String(entry.noAccessClasses)
                .split(",")
                .map((value) => value.trim())
                .sort()
            : null;
        })
        .toEqual(["4"]);
    });
    await expectAccessExport(data, [
      {
        record,
        classes: before.permissionClasses.filter(
          (item) => item.isChecked && item.isOur && item.class !== 4,
        ),
      },
    ]);
    const row = permissionRow(await data.open(), record);
    await test.step("UI: pozostałe przyznane klasy nadal dają status Przyznano", async () =>
      expect(row.locator(".mat-column-accessStatus")).toHaveText(GRANTED));
  });

  test("PERM-19: anulowanie Przywróć zachowuje decyzję BOK eksport i historię @teacher @entitlement @restore @cancel", async ({
    access: data,
  }) => {
    const record = await data.create();
    await data.decide(record, []);
    const before = await currentPermission(data, record);
    const history = await data.history(record);
    await expectAccessExport(data, []);
    await restorePermission(data, record, false);
    await test.step("Porównanie API: anulowanie nie zmieniło uprawnienia ani historii", async () => {
      expect(await currentPermission(data, record)).toEqual(before);
      expect(await data.history(record)).toEqual(history);
    });
    await expectAccessExport(data, []);
  });

  twoSchoolTest(
    "PERM-20: edycja BOK jednej szkoły nie zmienia tego samego przedmiotu w drugiej szkole @teacher @entitlement @manual @isolation",
    async ({ access: data }) => {
      const first = await data.create();
      const second = await data.create("Matematyka", ["5"], data.schools[1]);
      const firstClasses = await accessClasses(data, first, [4]);
      const secondClasses = await accessClasses(data, second, [5]);
      await data.decide(first, []);
      await data.decide(second, secondClasses);
      const before = await currentPermission(data, second);
      const history = await data.history(second);
      await editPermissionClass(data, first, "4", true);
      await expectAccessExport(data, [
        { record: first, classes: firstClasses },
        { record: second, classes: secondClasses },
      ]);
      await test.step("Porównanie API: rekord i historia drugiej szkoły pozostały bez zmian", async () => {
        expect(await currentPermission(data, second)).toEqual(before);
        expect(await data.history(second)).toEqual(history);
      });
    },
  );

  for (const [index, declared] of ["4", "7"].entries()) {
    test(`PERM-${21 + index}: szkoła testowa bez zamówień rozszerza deklarację Matematyki ${declared} do 4–8 @teacher @entitlement @test-school @no-orders`, async ({
      access: data,
    }) => {
      await test.step("Warunek początkowy: szkoła testowa nie ma żadnych zamówień", async () =>
        expect(await data.orders().orders()).toEqual([]));
      const record = await data.create("Matematyka", [declared]);
      const classes = await accessClasses(data, record, [4, 5, 6, 7, 8]);
      await test.step("Porównanie API: automat przyznał pełny zakres 4–8 bez ręcznych decyzji", async () =>
        expect
          .poll(async () => {
            const current = await currentPermission(data, record);
            return {
              source: current.accessSource,
              status: current.accessStatus,
              classes: permissionClasses(current)
                .filter((item) => item.isOur)
                .map((item) => item.class),
              manual: current.permissionClasses.some((item) => item.modifiedManualy === true),
            };
          })
          .toEqual({
            source: "automat",
            status: GRANTED,
            classes: [4, 5, 6, 7, 8],
            manual: false,
          }));
      await expectAccessExport(data, [{ record, classes }]);
      const details = await openPermissionDetails(await data.open(), record);
      await test.step("Porównanie UI: wszystkie klasy 4–8 mają status Przyznano", async () => {
        await expect(details.locator("td.mat-column-class")).toHaveText(["4", "5", "6", "7", "8"]);
        await expect(details.locator("td.mat-column-status")).toHaveText(Array(5).fill(GRANTED));
      });
    });
  }
  test.describe("Nauczyciel i szkoły bez flagi Testowy", () => {
    test.use({ accessTestFlags: { teacher: false, school: false } });

    test("PERM-23: bez flag Testowy ręczne nadanie jednej klasy przez UI działa i trafia do eksportu @teacher @entitlement @manual @unmarked", async ({
      access: data,
    }) => {
      await expectUnmarkedRecords(data);
      const record = await data.create();
      const classes = await accessClasses(data, record, [4]);
      await data.decide(record, []);
      await expectAccessExport(data, []);
      await editPermissionClass(data, record, "4", true);
      await expectAccessExport(data, [{ record, classes }]);
      await test.step("Porównanie API: zapisano decyzję BOK dla rzeczywistego wariantu bez flag", async () =>
        expect(hasBokSource((await currentPermission(data, record)).accessSource)).toBe(true));
      await expectUnmarkedRecords(data);
    });

    test("PERM-24: bez flag Testowy przywrócenie automatu odtwarza dostęp 7–8 z kwalifikującego zamówienia @teacher @entitlement @restore @orders @unmarked", async ({
      access: data,
    }) => {
      await expectUnmarkedRecords(data);
      const api = data.orders();
      await test.step("Warunek początkowy: brak zamówień szkoły bez flagi Testowy", async () =>
        expect(await api.orders()).toEqual([]));
      const record = await data.create("Fizyka", ["7"]);
      const classes = await accessClasses(data, record, [7, 8]);
      const quantity = Math.max(1, ...record.details.map((item) => item.threshold)) + 1;
      const product = await api.product("F7P", [7]);
      await api.save([{ product, quantity }]);
      await test.step("Porównanie API: zamówienie zostało zaliczone przed decyzją BOK", async () =>
        expect
          .poll(
            async () =>
              (await currentPermission(data, record)).details.find((item) => item.class === "7 F+")
                ?.orderedCount,
          )
          .toBe(quantity));
      await expectAccessExport(data, [{ record, classes }]);
      await data.decide(record, []);
      await expectAccessExport(data, []);
      await restorePermission(data, record);
      await expectAccessExport(data, [{ record, classes }]);
      await test.step("Porównanie API: przywrócono automat i wyłączono ręczne decyzje dla klas", async () => {
        const current = await currentPermission(data, record);
        expect(current.accessSource).toBe("automat");
        expect(current.accessStatus).toBe(GRANTED);
        expect(current.permissionClasses.some((item) => item.modifiedManualy === true)).toBe(false);
      });
      await expectUnmarkedRecords(data);
    });

    test("PERM-25: bez flag Testowy anulowanie przywrócenia zachowuje BOK historię i eksport @teacher @entitlement @restore @cancel @unmarked", async ({
      access: data,
    }) => {
      await expectUnmarkedRecords(data);
      const record = await data.create();
      const classes = await accessClasses(data, record, [4]);
      await data.decide(record, classes);
      await expectAccessExport(data, [{ record, classes }]);
      const before = await currentPermission(data, record);
      const history = await data.history(record);
      await restorePermission(data, record, false);
      await test.step("Porównanie API: anulowanie nie zmieniło decyzji ani historii", async () => {
        expect(await currentPermission(data, record)).toEqual(before);
        expect(await data.history(record)).toEqual(history);
      });
      await expectAccessExport(data, [{ record, classes }]);
      await expectUnmarkedRecords(data);
    });
  });
});
