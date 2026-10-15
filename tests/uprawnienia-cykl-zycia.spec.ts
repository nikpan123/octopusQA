import { expect } from "@playwright/test";
import {
  test,
  GRANTED,
  hasBokSource,
  permissionRow,
  expectedAssignments,
  canonicalAssignments,
  type EntitlementData,
  type AccessRecord,
} from "./support/entitlements";
import { negativelyVerifyClubConfirmation } from "./support/club";
import {
  accessClasses,
  automaticPermission,
  currentPermission,
  expectAccessExport,
} from "./support/access-regression";

async function grant(data: EntitlementData, record: AccessRecord, classLevel = 4) {
  const classes = (
    await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
      data.checkboxes(record))
  ).filter((item) => item.isOur && item.class === classLevel);
  await test.step("Sprawdzenie: wartość powyżej granicy — classes.length; granica: 0", async () => {
    expect(classes.length).toBeGreaterThan(0);
  });
  await data.decide(record, classes);
  return classes;
}

async function expectBlocked(data: EntitlementData, record: AccessRecord) {
  await test.step("Sprawdzenie: zgodność wartości — async () => (await data.records()) .filter((item) => item.id === record.id) .some( (item) => item.accessStatus ===…; oczekiwane: false", async () =>
    expect
      .poll(
        async () =>
          (await data.records())
            .filter((item) => item.id === record.id)
            .some(
              (item) =>
                item.accessStatus === GRANTED ||
                item.details.some((detail) => detail.status === GRANTED),
            ),
        { message: "Nieaktywne potwierdzenie blokuje dostęp również po decyzji BOK" },
      )
      .toBe(false));
  const row = permissionRow(await data.open(), record);
  // Wymaganie dopuszcza brak rekordu lub rekord bez aktywnego dostępu.
  if (await row.count())
    await test.step('Sprawdzenie: negacja — tekst w widoku — row.locator(".mat-column-accessStatus"); oczekiwane: GRANTED', async () =>
      expect(row.locator(".mat-column-accessStatus")).not.toHaveText(GRANTED));
}

test.describe("Uprawnienia — aktywność potwierdzenia i kolejność danych", () => {
  test.beforeEach(async () => {
    test.setTimeout(240000);
  });

  for (const [index, action] of [
    "usunięcie",
    "zmiana wszystkich klas na obce",
    "weryfikacja negatywna",
  ].entries()) {
    test(`ACL-${String(index + 1).padStart(2, "0")}: ${action} blokuje również ręczne nadanie BOK @teacher @entitlement @access-lifecycle @manual`, async ({
      access: data,
    }) => {
      const record =
        await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
          data.create());
      const classes =
        await test.step("Przygotowanie: nadanie dostępu do wskazanej klasy", async () =>
          grant(data, record));
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => canonicalAssignments(await data.export()); oczekiwane: expectedAssignments([{ record, classes }])", async () =>
        expect
          .poll(async () => canonicalAssignments(await data.export()))
          .toEqual(expectedAssignments([{ record, classes }])));
      if (index === 0) await data.club.remove(data.teacherId, String(record.id));
      if (index === 1) await data.club.change(data.teacherId, String(record.id), false);
      if (index === 2) {
        await data.scenario.app.openPanel("teacher", data.teacherId);
        await data.page.getByRole("tab", { name: "Potwierdzenia", exact: true }).click();
        await negativelyVerifyClubConfirmation(data.page, String(record.id));
      }
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => data.export(); oczekiwane: []", async () =>
        expect.poll(() => data.export()).toEqual([]));
      await test.step("Porównanie: blokada potwierdzenia usuwa aktywny dostęp i eksport", async () =>
        expectBlocked(data, record));
    });
  }

  test("ACL-04: usunięcie Matematyki nie odbiera aktywnej Fizyki @teacher @entitlement @access-lifecycle @isolation", async ({
    access: data,
  }) => {
    const math =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const physics =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Fizyka", ["7"]));
    const mathClasses =
      await test.step("Przygotowanie: nadanie dostępu do wskazanej klasy", async () =>
        grant(data, math));
    const physicsClasses =
      await test.step("Przygotowanie: nadanie dostępu do wskazanej klasy", async () =>
        grant(data, physics, 7));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => canonicalAssignments(await data.export()); oczekiwane: expectedAssignments([ { record: math, classes: mathClasses }, { record: physics, classes: physicsClasses }, ])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(
          expectedAssignments([
            { record: math, classes: mathClasses },
            { record: physics, classes: physicsClasses },
          ]),
        ));
    const before = (
      await test.step("API: odczyt zapisanych uprawnień nauczyciela", async () => data.records())
    ).find((item) => item.id === physics.id);
    await data.club.remove(data.teacherId, String(math.id));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => canonicalAssignments(await data.export()); oczekiwane: expectedAssignments([{ record: physics, classes: physicsClasses }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record: physics, classes: physicsClasses }])));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await data.records()).find((item) => item.id === physics.id); oczekiwane: before", async () => {
      expect((await data.records()).find((item) => item.id === physics.id)).toEqual(before);
    });
    await test.step("Porównanie: blokada potwierdzenia usuwa aktywny dostęp i eksport", async () =>
      expectBlocked(data, math));
  });

  test("ACL-05: usunięcie potwierdzenia zachowuje wcześniejszą historię BOK @teacher @entitlement @access-lifecycle @history", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await test.step("Przygotowanie: nadanie dostępu do wskazanej klasy", async () =>
      grant(data, record));
    const before = await test.step("API: odczyt historii zmian uprawnienia", async () =>
      data.history(record));
    await test.step("Sprawdzenie: wartość powyżej granicy — before.length; granica: 0", async () => {
      expect(before.length, "Nadanie BOK musi mieć wpis historii").toBeGreaterThan(0);
    });
    await data.club.remove(data.teacherId, String(record.id));
    const after = await test.step("API: odczyt danych do weryfikacji", async () =>
      data.get<Array<Record<string, unknown>>>(
        `/api/TeacherAccess/GetTeacherAccessPermissionHistory/${record.id}`,
      ));
    for (const entry of before)
      await test.step("Sprawdzenie: toContainEqual — after; oczekiwane: entry", async () => {
        expect(after).toContainEqual(entry);
      });
  });

  test("ACL-06: przywrócenie potwierdzenia ponownie tworzy podstawę dostępu @teacher @entitlement @access-lifecycle @restore", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await data.club.remove(data.teacherId, String(record.id));
    await test.step("Porównanie: blokada potwierdzenia usuwa aktywny dostęp i eksport", async () =>
      expectBlocked(data, record));
    await data.club.restore(data.teacherId, String(record.id));
    await test.step("Sprawdzenie: zgodność wartości — async () => (await data.records()).filter((item) => item.id === record.id).length; oczekiwane: 1", async () =>
      expect
        .poll(async () => (await data.records()).filter((item) => item.id === record.id).length)
        .toBe(1));
    await test.step("Sprawdzenie: widoczność elementu — permissionRow(await data.open(), record)", async () =>
      expect(permissionRow(await data.open(), record)).toBeVisible());
  });

  test("ACL-07: zmiana obce na nasze ponownie aktywuje rekord uprawnień @teacher @entitlement @access-lifecycle @publisher", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    await data.club.change(data.teacherId, String(record.id), false);
    await test.step("Porównanie: blokada potwierdzenia usuwa aktywny dostęp i eksport", async () =>
      expectBlocked(data, record));
    await data.club.change(data.teacherId, String(record.id), true);
    await test.step("Sprawdzenie: zgodność wartości — async () => (await data.records()).filter((item) => item.id === record.id).length; oczekiwane: 1", async () =>
      expect
        .poll(async () => (await data.records()).filter((item) => item.id === record.id).length)
        .toBe(1));
    await test.step("Sprawdzenie: widoczność elementu — permissionRow(await data.open(), record)", async () =>
      expect(permissionRow(await data.open(), record)).toBeVisible());
  });

  for (const [index, first] of ["zamówienie", "potwierdzenie"].entries()) {
    test(`ACL-${String(8 + index).padStart(2, "0")}: najpierw ${first} — istniejące dane zamówienia są wykorzystane @teacher @entitlement @access-lifecycle @orders`, async ({
      access: data,
    }) => {
      const api = data.orders();
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — await api.orders(); oczekiwane: []", async () => {
        expect(
          await api.orders(),
          "Szkoła nie może mieć zamówień pozostałych z wcześniejszego testu",
        ).toEqual([]);
      });
      const product =
        await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
          api.product("F7P", [7]));
      let record: AccessRecord;
      if (index === 0) {
        await api.save([{ product, quantity: 31 }]);
        await test.step("Sprawdzenie: zgodność całej struktury i wartości — await data.records(); oczekiwane: []", async () => {
          expect(await data.records()).toEqual([]);
        });
        await test.step("Sprawdzenie: zgodność całej struktury i wartości — await data.export(); oczekiwane: []", async () => {
          expect(await data.export()).toEqual([]);
        });
        record =
          await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
            data.create("Fizyka", ["7"]));
      } else {
        record =
          await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
            data.create("Fizyka", ["7"]));
        await api.save([{ product, quantity: 31 }]);
      }
      await test.step("Porównanie API: klasa 7 F+ ma 31 zamówionych egzemplarzy", async () =>
        expect
          .poll(
            async () =>
              (await data.records())
                .find((item) => item.id === record.id)
                ?.details.find((item) => item.class === "7 F+")?.orderedCount,
          )
          .toBe(31));
      const current = (
        await test.step("API: odczyt zapisanych uprawnień nauczyciela", async () => data.records())
      ).find((item) => item.id === record.id)!;
      await test.step("Porównanie API: próg zamówienia dla klasy 7 F+ wynosi 30", async () => {
        expect(current.details.find((item) => item.class === "7 F+")?.threshold).toBe(30);
      });
      await test.step("Porównanie API: klasie 7 F+ przyznano dostęp", async () => {
        expect(current.details.find((item) => item.class === "7 F+")?.status).toBe(GRANTED);
      });
    });
  }

  test("ACL-10: nowe zamówienie nie nadpisuje ręcznej odmowy BOK @teacher @entitlement @access-lifecycle @manual @orders", async ({
    access: data,
  }) => {
    const api = data.orders();
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await api.orders(); oczekiwane: []", async () => {
      expect(await api.orders()).toEqual([]);
    });
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Fizyka", ["7"]));
    await data.decide(record, []);
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => data.export(); oczekiwane: []", async () =>
      expect.poll(() => data.export()).toEqual([]));
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    await api.save([{ product, quantity: 31 }]);
    await test.step("Porównanie API: klasa 7 F+ ma 31 zamówionych egzemplarzy mimo ręcznej odmowy dostępu", async () =>
      expect
        .poll(
          async () =>
            (await data.records())
              .find((item) => item.id === record.id)
              ?.details.find((item) => item.class === "7 F+")?.orderedCount,
        )
        .toBe(31));
    const updated = (
      await test.step("API: odczyt zapisanych uprawnień nauczyciela", async () => data.records())
    ).find((item) => item.id === record.id)!;
    await test.step("Sprawdzenie: zgodność wartości — hasBokSource(updated.accessSource); oczekiwane: true", async () => {
      expect(hasBokSource(updated.accessSource)).toBe(true);
    });
    await test.step("Sprawdzenie: negacja — zgodność wartości — updated.accessStatus; oczekiwane: GRANTED", async () => {
      expect(updated.accessStatus).not.toBe(GRANTED);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await data.export(); oczekiwane: []", async () => {
      expect(await data.export()).toEqual([]);
    });
  });

  test("ACL-11: usunięcie potwierdzenia nie usuwa zamówienia szkoły @teacher @entitlement @access-lifecycle @isolation @orders", async ({
    access: data,
  }) => {
    const api = data.orders();
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 31 }]);
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Fizyka", ["7"]));
    const before = (await test.step("API: odczyt zamówień szkoły", async () => api.orders())).find(
      (order) => String(order.id) === id,
    );
    await test.step("Sprawdzenie: toBeDefined — before", async () => {
      expect(before).toBeDefined();
    });
    await data.club.remove(data.teacherId, String(record.id));
    await test.step("Porównanie: blokada potwierdzenia usuwa aktywny dostęp i eksport", async () =>
      expectBlocked(data, record));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await api.orders()).find((order) => String(order.id) === id); oczekiwane: before", async () => {
      expect((await api.orders()).find((order) => String(order.id) === id)).toEqual(before);
    });
  });

  test("ACL-12: zawieszenie nauczyciela blokuje także ręcznie przyznany dostęp @teacher @entitlement @access-lifecycle @suspension @manual", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const classes = await test.step("Przygotowanie: nadanie dostępu do wskazanej klasy", async () =>
      grant(data, record));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => canonicalAssignments(await data.export()); oczekiwane: expectedAssignments([{ record, classes }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record, classes }])));
    await data.scenario.app.openPanel("teacher", data.teacherId);
    try {
      await data.page.getByRole("button", { name: "Zawieś", exact: true }).click();
      const dialog = data.page.locator("app-suspend-teacher");
      await test.step("Sprawdzenie: widoczność elementu — dialog", async () =>
        expect(dialog).toBeVisible());
      await dialog.getByRole("combobox").click();
      const reasons = data.page.getByRole("option", { disabled: false });
      await test.step("Sprawdzenie: widoczność elementu — reasons.first()", async () =>
        expect(reasons.first()).toBeVisible());
      const selectedReason = (await reasons.first().innerText()).trim();
      await test.step('Sprawdzenie: negacja — zgodność wartości — selectedReason; oczekiwane: ""', async () => {
        expect(selectedReason).not.toBe("");
      });
      await data.scenario.record("accessSuspendReason", selectedReason);
      // Dowolny dostępny powód zawiesza wyłącznie nauczyciela z tego testu.
      await reasons.first().click();
      await dialog.getByRole("button", { name: "Tak", exact: true }).click();
      await test.step("Sprawdzenie: liczba elementów w widoku — dialog; oczekiwane: 0", async () =>
        expect(dialog).toHaveCount(0));
      await test.step("Sprawdzenie: zgodność wartości — async () => (await data.get<{ isDel: boolean }>(`/api/Teacher/${data.teacherId}`)).isDel; oczekiwane: true", async () =>
        expect
          .poll(
            async () =>
              (await data.get<{ isDel: boolean }>(`/api/Teacher/${data.teacherId}`)).isDel,
          )
          .toBe(true));
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => data.export(); oczekiwane: []", async () =>
        expect.poll(() => data.export()).toEqual([]));
      await test.step("Porównanie: blokada potwierdzenia usuwa aktywny dostęp i eksport", async () =>
        expectBlocked(data, record));
    } finally {
      await data.scenario.app.openPanel("teacher", data.teacherId);
      const resume = data.page.getByRole("button", { name: "Odwieś", exact: true });
      if (await resume.isVisible()) {
        await resume.click();
        await data.page.getByRole("button", { name: "Tak", exact: true }).click();
        await test.step("Sprawdzenie: zgodność wartości — async () => (await data.get<{ isDel: boolean }>(`/api/Teacher/${data.teacherId}`)).isDel; oczekiwane: false", async () =>
          expect
            .poll(
              async () =>
                (await data.get<{ isDel: boolean }>(`/api/Teacher/${data.teacherId}`)).isDel,
            )
            .toBe(false));
      }
    }
  });
  test("ACL-13: usunięcie potwierdzenia jednej szkoły zachowuje inne klasy przedmiotu z drugiej szkoły @teacher @entitlement @access-lifecycle @isolation", async ({
    access: data,
  }) => {
    const first = await data.create();
    const second = await data.create("Matematyka", ["5"], data.schools[1]);
    const firstClasses = await accessClasses(data, first, [4]);
    const secondClasses = await accessClasses(data, second, [5]);
    await data.decide(first, firstClasses);
    await data.decide(second, secondClasses);
    await expectAccessExport(data, [
      { record: first, classes: firstClasses },
      { record: second, classes: secondClasses },
    ]);
    const before = await currentPermission(data, second);
    const history = await data.history(second);
    await data.club.remove(data.teacherId, String(first.id));
    await expectAccessExport(data, [{ record: second, classes: secondClasses }]);
    await expectBlocked(data, first);
    await test.step("Porównanie: uprawnienie i historia drugiej szkoły są nienaruszone", async () => {
      expect(await currentPermission(data, second)).toEqual(before);
      expect(await data.history(second)).toEqual(history);
    });
  });

  test("ACL-14: zmiana decyzji BOK z Matematyki nie zmienia Fizyki ani jej historii @teacher @entitlement @access-lifecycle @manual @isolation", async ({
    access: data,
  }) => {
    const math = await data.create();
    const physics = await data.create("Fizyka", ["7"]);
    const mathClasses = await accessClasses(data, math, [4]);
    const physicsClasses = await accessClasses(data, physics, [7]);
    await data.decide(math, mathClasses);
    await data.decide(physics, physicsClasses);
    await expectAccessExport(data, [
      { record: math, classes: mathClasses },
      { record: physics, classes: physicsClasses },
    ]);
    const before = await currentPermission(data, physics);
    const history = await data.history(physics);
    await data.decide(math, []);
    await expectAccessExport(data, [{ record: physics, classes: physicsClasses }]);
    await test.step("Porównanie: decyzja i historia Fizyki są niezależne od zmiany Matematyki", async () => {
      expect(await currentPermission(data, physics)).toEqual(before);
      expect(await data.history(physics)).toEqual(history);
    });
  });

  test("ACL-15: usunięcie zamówienia przelicza ilość ale zachowuje ręczne nadanie dostępu @teacher @entitlement @access-lifecycle @orders @manual", async ({
    access: data,
  }) => {
    const api = data.orders();
    await test.step("Warunek początkowy: dedykowana szkoła nie ma zamówień", async () =>
      expect(await api.orders()).toEqual([]));
    const record = await data.create("Fizyka", ["7"]);
    const classes = await accessClasses(data, record, [7]);
    await data.decide(record, classes);
    const quantity = Math.max(1, ...record.details.map((item) => item.threshold)) + 1;
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity }]);
    await test.step("Porównanie API: zamówienie jest uwzględnione w liczbie egzemplarzy 7 F+", async () =>
      expect
        .poll(
          async () =>
            (await currentPermission(data, record)).details.find((item) => item.class === "7 F+")
              ?.orderedCount,
        )
        .toBe(quantity));
    await expectAccessExport(data, [{ record, classes }]);
    await api.remove(id);
    await test.step("Porównanie API: po usunięciu ilość wynosi 0, lecz decyzja nadal pochodzi z BOK", async () =>
      expect
        .poll(async () => {
          const current = await currentPermission(data, record);
          return {
            count: current.details.find((item) => item.class === "7 F+")?.orderedCount,
            bok: hasBokSource(current.accessSource),
          };
        })
        .toEqual({ count: 0, bok: true }));
    await expectAccessExport(data, [{ record, classes }]);
  });

  test("ACL-16: korekta zamówienia poniżej progu nie nadpisuje ręcznego nadania BOK @teacher @entitlement @access-lifecycle @orders @manual", async ({
    access: data,
  }) => {
    const api = data.orders();
    await test.step("Warunek początkowy: dedykowana szkoła nie ma zamówień", async () =>
      expect(await api.orders()).toEqual([]));
    const record = await data.create("Fizyka", ["7"]);
    const classes = await accessClasses(data, record, [7]);
    await data.decide(record, classes);
    const threshold = record.details.find((item) => item.class === "7 F+")?.threshold;
    expect(
      threshold,
      "Próg musi pozwalać na korektę poniżej progu do jednej sztuki",
    ).toBeGreaterThan(1);
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: threshold! + 1 }]);
    await test.step("Porównanie API: przed korektą zapisano ilość przekraczającą próg", async () =>
      expect
        .poll(
          async () =>
            (await currentPermission(data, record)).details.find((item) => item.class === "7 F+")
              ?.orderedCount,
        )
        .toBe(threshold! + 1));
    await expectAccessExport(data, [{ record, classes }]);
    await api.save([{ product, quantity: 1 }], id);
    await test.step("Porównanie API: korekta zmniejszyła ilość do 1 bez zmiany źródła BOK", async () =>
      expect
        .poll(async () => {
          const current = await currentPermission(data, record);
          return {
            count: current.details.find((item) => item.class === "7 F+")?.orderedCount,
            bok: hasBokSource(current.accessSource),
          };
        })
        .toEqual({ count: 1, bok: true }));
    await expectAccessExport(data, [{ record, classes }]);
  });

  test("ACL-17: przywrócenie potwierdzenia wykorzystuje pozostawione zamówienie i zachowuje historię @teacher @entitlement @access-lifecycle @restore @orders", async ({
    access: data,
  }) => {
    const api = data.orders();
    await test.step("Warunek początkowy: dedykowana szkoła nie ma zamówień", async () =>
      expect(await api.orders()).toEqual([]));
    const record = await data.create("Fizyka", ["7"]);
    const quantity = Math.max(1, ...record.details.map((item) => item.threshold)) + 1;
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity }]);
    await test.step("Porównanie API: zamówienie zostało uwzględnione przed usunięciem potwierdzenia", async () =>
      expect
        .poll(
          async () =>
            (await currentPermission(data, record)).details.find((item) => item.class === "7 F+")
              ?.orderedCount,
        )
        .toBe(quantity));
    const before = await automaticPermission(data, record);
    const granted = before.permissionClasses.filter((item) => item.isChecked && item.isOur);
    const history = await data.history(record);
    await expectAccessExport(data, [{ record, classes: granted }]);
    await data.club.remove(data.teacherId, String(record.id));
    await expectBlocked(data, record);
    await expectAccessExport(data, []);
    await data.club.restore(data.teacherId, String(record.id));
    await test.step("Porównanie API: przywrócona podstawa ponownie wykorzystuje te same egzemplarze", async () =>
      expect
        .poll(async () => {
          const restored = (await data.records()).find((item) => item.id === record.id);
          return {
            count: restored?.details.find((item) => item.class === "7 F+")?.orderedCount,
            status: restored?.accessStatus,
            source: restored?.accessSource,
          };
        })
        .toEqual({ count: quantity, status: before.accessStatus, source: "automat" }));
    await expectAccessExport(data, [{ record, classes: granted }]);
    await test.step("Porównanie: zamówienie i wcześniejsza historia nie zostały usunięte", async () => {
      expect((await api.orders()).map((item) => String(item.id))).toEqual([id]);
      const after = await data.history(record);
      for (const entry of history) expect(after).toContainEqual(entry);
    });
  });
});
