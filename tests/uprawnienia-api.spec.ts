import { expect } from "@playwright/test";
import { accessClasses, expectAccessExport } from "./support/access-regression";
import {
  test,
  ACCESS_YEAR,
  canonicalAssignments,
  expectedAssignments,
} from "./support/entitlements";

test.describe("ClassesWithLevels — rzeczywisty eksport uprawnień", () => {
  test.beforeEach(async () => {
    test.setTimeout(240000);
  });

  test("ACC-01: przyznana klasa trafia do eksportu wraz z poziomem i zakresem @teacher @entitlement @access-api", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const classes = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(record))
    ).filter((item) => item.isOur && item.class === 4);
    await test.step("Sprawdzenie: wartość powyżej granicy — classes.length; granica: 0", async () => {
      expect(classes.length).toBeGreaterThan(0);
    });
    await data.decide(record, classes);
    await test.step("Porównanie: eksport API — przedmioty, klasy, poziomy i zakresy; oczekiwane: expectedAssignments([{ record, classes }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record, classes }])));
  });

  test("ACC-02: kilka klas przedmiotu tworzy jeden teachingAssignment @teacher @entitlement @access-api", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Matematyka", ["4", "5"]));
    const classes = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(record))
    ).filter((item) => item.isOur && [4, 5].includes(item.class));
    await test.step("Sprawdzenie: zgodność wartości — new Set(classes.map((item) => item.class)).size; oczekiwane: 2", async () => {
      expect(new Set(classes.map((item) => item.class)).size).toBe(2);
    });
    await data.decide(record, classes);
    await test.step("Porównanie: eksport API — przedmioty, klasy, poziomy i zakresy; oczekiwane: expectedAssignments([{ record, classes }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record, classes }])));
  });

  test("ACC-03: eksport grupuje dwa przedmioty oddzielnie @teacher @entitlement @access-api", async ({
    access: data,
  }) => {
    const math =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const physics =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Fizyka", ["7"]));
    const mathClasses = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(math))
    ).filter((item) => item.isOur && item.class === 4);
    const physicsClasses = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(physics))
    ).filter((item) => item.isOur && item.class === 7);
    await test.step("Sprawdzenie: wartość powyżej granicy — mathClasses.length; granica: 0", async () => {
      expect(mathClasses.length).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: wartość powyżej granicy — physicsClasses.length; granica: 0", async () => {
      expect(physicsClasses.length).toBeGreaterThan(0);
    });
    await data.decide(math, mathClasses);
    await data.decide(physics, physicsClasses);
    await test.step("Porównanie: eksport API — przedmioty, klasy, poziomy i zakresy; oczekiwane: expectedAssignments([ { record: math, classes: mathClasses }, { record: physics, classes: physicsClasses }, ])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(
          expectedAssignments([
            { record: math, classes: mathClasses },
            { record: physics, classes: physicsClasses },
          ]),
        ));
  });

  test("ACC-04: odebrana decyzja nie pozostawia przyznanych klas w eksporcie @teacher @entitlement @access-api @negative", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const classes = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(record))
    ).filter((item) => item.isOur && item.class === 4);
    await test.step("Sprawdzenie: wartość powyżej granicy — classes.length; granica: 0", async () => {
      expect(classes.length).toBeGreaterThan(0);
    });
    await data.decide(record, classes);
    await test.step("Porównanie: eksport API — przedmioty, klasy, poziomy i zakresy; oczekiwane: expectedAssignments([{ record, classes }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record, classes }])));
    await data.decide(record, []);
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => data.export(); oczekiwane: []", async () =>
      expect.poll(() => data.export()).toEqual([]));
  });

  test("ACC-05: uprawnienie z 2026 nie trafia do eksportu roku 2025 @teacher @entitlement @access-api @year", async ({
    access: data,
  }) => {
    const record =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const classes = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(record))
    ).filter((item) => item.isOur && item.class === 4);
    await test.step("Sprawdzenie: wartość powyżej granicy — classes.length; granica: 0", async () => {
      expect(classes.length).toBeGreaterThan(0);
    });
    await data.decide(record, classes);
    await test.step("Porównanie: eksport API — przedmioty, klasy, poziomy i zakresy; oczekiwane: expectedAssignments([{ record, classes }])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(expectedAssignments([{ record, classes }])));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await data.export(ACCESS_YEAR - 1); oczekiwane: []", async () => {
      expect(await data.export(ACCESS_YEAR - 1)).toEqual([]);
    });
  });

  test("ACC-06: identyczne przypisania z dwóch szkół nie są duplikowane @teacher @entitlement @access-api @deduplication", async ({
    access: data,
  }) => {
    const first =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create());
    const second =
      await test.step("Przygotowanie: utworzenie potwierdzenia i odczyt uprawnień", async () =>
        data.create("Matematyka", ["4"], data.schools[1]));
    const firstClasses = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(first))
    ).filter((item) => item.isOur && item.class === 4);
    const secondClasses = (
      await test.step("API: odczyt dostępnych klas, poziomów i zakresów", async () =>
        data.checkboxes(second))
    ).filter((item) => item.isOur && item.class === 4);
    await test.step("Sprawdzenie: wartość powyżej granicy — firstClasses.length; granica: 0", async () => {
      expect(firstClasses.length).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: wartość powyżej granicy — secondClasses.length; granica: 0", async () => {
      expect(secondClasses.length).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — expectedAssignments([{ record: first, classes: firstClasses }]); oczekiwane: expectedAssignments([{ record: second, classes: secondClasses }])", async () => {
      expect(expectedAssignments([{ record: first, classes: firstClasses }])).toEqual(
        expectedAssignments([{ record: second, classes: secondClasses }]),
      );
    });
    await data.decide(first, firstClasses);
    await data.decide(second, secondClasses);
    await test.step("Porównanie: eksport API — przedmioty, klasy, poziomy i zakresy; oczekiwane: expectedAssignments([ { record: first, classes: firstClasses }, { record: second, classes: secondClasses }, ])", async () =>
      expect
        .poll(async () => canonicalAssignments(await data.export()))
        .toEqual(
          expectedAssignments([
            { record: first, classes: firstClasses },
            { record: second, classes: secondClasses },
          ]),
        ));
  });
  test("ACC-07: ta sama klasa Fizyki zachowuje dwa różne zakresy w eksporcie @teacher @entitlement @access-api @scope", async ({
    access: data,
  }) => {
    const record = await data.create("Fizyka", ["7"]);
    const first = await accessClasses(data, record, [7], 4);
    const second = await accessClasses(data, record, [7], 18);
    await data.decide(record, [...first, ...second]);
    await expectAccessExport(data, [{ record, classes: [...first, ...second] }]);
  });

  test("ACC-08: odebranie F+ nie odbiera TNŚ dla tej samej klasy @teacher @entitlement @access-api @scope @manual", async ({
    access: data,
  }) => {
    const record = await data.create("Fizyka", ["7"]);
    const first = await accessClasses(data, record, [7], 4);
    const second = await accessClasses(data, record, [7], 18);
    await data.decide(record, [...first, ...second]);
    await expectAccessExport(data, [{ record, classes: [...first, ...second] }]);
    await data.decide(record, second);
    await expectAccessExport(data, [{ record, classes: second }]);
  });

  test("ACC-09: odmowa w jednej szkole nie przesłania przyznania tej samej klasy w drugiej @teacher @entitlement @access-api @isolation", async ({
    access: data,
  }) => {
    const first = await data.create();
    const second = await data.create("Matematyka", ["4"], data.schools[1]);
    const classes = await accessClasses(data, second, [4]);
    await data.decide(first, []);
    await data.decide(second, classes);
    await expectAccessExport(data, [{ record: second, classes }]);
  });

  test("ACC-10: usunięcie jednego z dwóch źródeł nie usuwa wspólnej klasy z eksportu @teacher @entitlement @access-api @deduplication @delete", async ({
    access: data,
  }) => {
    const first = await data.create();
    const second = await data.create("Matematyka", ["4"], data.schools[1]);
    const firstClasses = await accessClasses(data, first, [4]);
    const secondClasses = await accessClasses(data, second, [4]);
    await data.decide(first, firstClasses);
    await data.decide(second, secondClasses);
    await expectAccessExport(data, [
      { record: first, classes: firstClasses },
      { record: second, classes: secondClasses },
    ]);
    await data.club.remove(data.teacherId, String(first.id));
    await expectAccessExport(data, [{ record: second, classes: secondClasses }]);
  });
});
