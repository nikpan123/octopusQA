import { expect } from "@playwright/test";
import {
  test,
  mixedFilterData,
  openFilterSchool,
  filterButton,
  chooseFilter,
  expectTeacherIds,
  expectCounters,
  appearance,
  teacherList,
  type TeacherFilter,
} from "./support/school-teacher-filters";
import { subjectLevelRow } from "./support/club";
import { TFL_CURRENT_SCHOOL_YEAR } from "./support/club-form-api";
import { openSchoolEditForm, cancelSchoolEdit } from "./support/school-edit";

test.describe("Filtrowanie nauczycieli w szkole", () => {
  // Wyłącznie przy uruchomieniu: odrębna szkoła i nauczyciele dla każdego testu.
  test.beforeEach(async ({}, testInfo) => {
    testInfo.setTimeout(600000);
  });

  test("TFL-01: nagłówki są widoczne i klikalne @school @teacher-filter @smoke", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    for (const [filter, ids] of [
      ["Nasi", s.ours],
      ["Obcy", s.foreigners],
      ["Nauczyciele", s.all],
    ] as const) {
      await expect(filterButton(d.app, filter)).toBeVisible();
      await chooseFilter(d.app, filter, [...ids]);
    }
  });

  test("TFL-02: domyślnie widać wszystkich przypisanych nauczycieli @school @teacher-filter @default", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    await expectTeacherIds(d.app, s.all);
  });

  for (const sample of [
    { id: "TFL-03", filter: "Nasi" as const, key: "ours" as const },
    { id: "TFL-04", filter: "Obcy" as const, key: "foreigners" as const },
  ]) {
    test(`${sample.id}: ${sample.filter} pokazuje dokładnie właściwych nauczycieli @school @teacher-filter @classification`, async ({
      filterData: d,
    }) => {
      const s = await mixedFilterData(d);
      await chooseFilter(d.app, sample.filter, s[sample.key]);
    });
  }

  test("TFL-05: Nauczyciele przywraca pełną listę po każdym filtrze @school @teacher-filter @switch", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    for (const [filter, ids] of [
      ["Nasi", s.ours],
      ["Obcy", s.foreigners],
    ] as const) {
      await chooseFilter(d.app, filter, [...ids]);
      await chooseFilter(d.app, "Nauczyciele", s.all);
    }
  });

  test("TFL-06: liczniki nie maleją po zastosowaniu filtra @school @teacher-filter @counters", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    for (const [filter, ids] of [
      ["Nasi", s.ours],
      ["Obcy", s.foreigners],
      ["Nauczyciele", s.all],
    ] as const) {
      await chooseFilter(d.app, filter, [...ids]);
      await expectCounters(d.app, 4, 2, 2);
    }
  });

  test("TFL-07: nauczyciel bez wpisów występuje tylko w pełnej liście @school @teacher-filter @negative", async ({
    filterData: d,
  }) => {
    const school = await d.school();
    const t = await d.teacher(school, "BEZ_WPISU");
    await openFilterSchool(d, school);
    await expectCounters(d.app, 1, 0, 0);
    await expectTeacherIds(d.app, [t.id]);
    await chooseFilter(d.app, "Nasi", []);
    await chooseFilter(d.app, "Obcy", []);
    await chooseFilter(d.app, "Nauczyciele", [t.id]);
  });

  test("TFL-08: jedna osoba może być Nasza i Obca w różnych przedmiotach @school @teacher-filter @counters", async ({
    filterData: d,
  }) => {
    const school = await d.school();
    const t = await d.teacher(school, "DWA_STATUSY", ["Matematyka", "Język polski"]);
    await d.declare(t, school, true);
    await d.declare(t, school, false, { subject: "Język polski" });
    await openFilterSchool(d, school);
    // Dwa przedmioty jednej osoby: jeden zielony i jeden niezielony.
    // Liczniki przedmiotów nie są liczbą unikalnych nauczycieli.
    await expectCounters(d.app, 1, 1, 1);
    for (const filter of ["Nasi", "Obcy", "Nauczyciele"] as const)
      await chooseFilter(d.app, filter, [t.id]);
  });

  for (const sample of [
    { id: "TFL-09", own: true, filter: "Nasi" as const },
    { id: "TFL-10", own: false, filter: "Obcy" as const },
  ]) {
    test(`${sample.id}: dwa przedmioty zwiększają licznik ${sample.filter}, ale nie duplikują nauczyciela @school @teacher-filter @duplicates @counters`, async ({
      filterData: d,
    }) => {
      const school = await d.school();
      const t = await d.teacher(school, "DWA_PRZEDMIOTY", ["Matematyka", "Język polski"]);
      await d.declare(t, school, sample.own, { classes: ["4", "5", "6"] });
      await d.declare(t, school, sample.own, { subject: "Język polski" });
      await openFilterSchool(d, school);
      // Matematyka w trzech klasach to jedna pozycja przedmiotowa, nie trzy.
      // Druga pozycja to Język polski; nauczyciel nadal ma jeden wiersz.
      await expectCounters(d.app, 1, sample.own ? 2 : 0, sample.own ? 0 : 2);
      await chooseFilter(d.app, sample.filter, [t.id]);
      await expectCounters(d.app, 1, sample.own ? 2 : 0, sample.own ? 0 : 2);
      await chooseFilter(d.app, "Nauczyciele", [t.id]);
    });
  }

  test("TFL-11: regresja dziewięć obcych przedmiotów pokazuje sześciu unikalnych nauczycieli @school @teacher-filter @regression @counters", async ({
    filterData: d,
  }) => {
    const school = await d.school();
    const ids: string[] = [];
    for (let i = 0; i < 6; i++) {
      const t = await d.teacher(
        school,
        `OBCY_${i}`,
        i < 3 ? ["Matematyka", "Język polski"] : ["Matematyka"],
      );
      ids.push(t.id);
      await d.declare(t, school, false);
      if (i < 3) await d.declare(t, school, false, { subject: "Język polski" });
    }
    await openFilterSchool(d, school);
    // 3 × 2 + 3 × 1 = 9 pozycji. Powtarzająca się Matematyka u różnych
    // nauczycieli jest liczona osobno, ale ID każdego nauczyciela tylko raz.
    await expectCounters(d.app, 6, 0, 9);
    await chooseFilter(d.app, "Obcy", ids);
    await expectCounters(d.app, 6, 0, 9);
    await chooseFilter(d.app, "Nasi", []);
    await expectCounters(d.app, 6, 0, 9);
    await chooseFilter(d.app, "Nauczyciele", ids);
  });

  test("TFL-12: szkoła bez nauczycieli ma trzy liczniki zero i puste listy @school @teacher-filter @empty", async ({
    filterData: d,
  }) => {
    const school = await d.school();
    await openFilterSchool(d, school);
    for (const filter of ["Nauczyciele", "Nasi", "Obcy"] as const) {
      await chooseFilter(d.app, filter, []);
      await expectCounters(d.app, 0, 0, 0);
    }
  });

  for (const sample of [
    { id: "TFL-13", own: true, empty: "Obcy" as const },
    { id: "TFL-14", own: false, empty: "Nasi" as const },
  ]) {
    test(`${sample.id}: grupa ${sample.empty} może być pusta przy niepustej szkole @school @teacher-filter @empty`, async ({
      filterData: d,
    }) => {
      const school = await d.school();
      const t = await d.teacher(school, "JEDNA_GRUPA");
      await d.declare(t, school, sample.own);
      await openFilterSchool(d, school);
      await chooseFilter(d.app, sample.empty, []);
      await expectCounters(d.app, 1, sample.own ? 1 : 0, sample.own ? 0 : 1);
      await chooseFilter(d.app, "Nauczyciele", [t.id]);
    });
  }

  test("TFL-15: zmiana filtrów nie przeładowuje dokumentu ani nie zmienia URL @school @teacher-filter @dynamic", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    const url = d.app.page.url();
    const marker = `TFL-${Date.now()}`;
    await d.app.page.evaluate((value) => {
      document.documentElement.dataset.tflDocument = value;
    }, marker);
    let navigations = 0;
    const listener = (frame: import("@playwright/test").Frame) => {
      if (frame === d.app.page.mainFrame()) navigations++;
    };
    d.app.page.on("framenavigated", listener);
    try {
      for (const [filter, ids] of [
        ["Nasi", s.ours],
        ["Obcy", s.foreigners],
        ["Nauczyciele", s.all],
      ] as const) {
        await chooseFilter(d.app, filter, [...ids]);
        await expect(d.app.page).toHaveURL(url);
        expect(await d.app.page.evaluate(() => document.documentElement.dataset.tflDocument)).toBe(
          marker,
        );
      }
      expect(navigations).toBe(0);
    } finally {
      d.app.page.off("framenavigated", listener);
    }
  });

  for (const [index, filter] of (["Nasi", "Obcy", "Nauczyciele"] as TeacherFilter[]).entries()) {
    test(`TFL-${16 + index}: aktywny filtr ${filter} jest wizualnie wyróżniony @school @teacher-filter @visual`, async ({
      filterData: d,
    }) => {
      const s = await mixedFilterData(d);
      const ids = (f: TeacherFilter) =>
        f === "Nasi" ? s.ours : f === "Obcy" ? s.foreigners : s.all;
      const other: TeacherFilter = filter === "Nauczyciele" ? "Nasi" : "Nauczyciele";
      await chooseFilter(d.app, other, ids(other));
      const button = filterButton(d.app, filter);
      await d.app.page.mouse.move(0, 0);
      const inactive = await appearance(button);
      await chooseFilter(d.app, filter, ids(filter));
      await button.press("Tab");
      await d.app.page.mouse.move(0, 0);
      // Usuwamy hover i focus: nie mogą udawać wyróżnienia aktywnego filtra.
      await expect.poll(() => appearance(button)).not.toEqual(inactive);
    });
  }

  test("TFL-19: filtrowanie nie zmienia podstawowych danych szkoły @school @teacher-filter @isolation", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    const before = await Promise.all(
      ["name", "address", "level"].map((field) => d.app.detail(field).inputValue()),
    );
    for (const [filter, ids] of [
      ["Nasi", s.ours],
      ["Obcy", s.foreigners],
    ] as const) {
      await chooseFilter(d.app, filter, [...ids]);
      for (const [index, field] of ["name", "address", "level"].entries())
        await expect(d.app.detail(field)).toHaveValue(before[index]);
      const form = await openSchoolEditForm(d.app.page);
      await cancelSchoolEdit(form);
      await expectTeacherIds(d.app, [...ids]);
    }
  });

  test("TFL-20: pozostałe zakładki są dostępne przy aktywnym filtrze @school @teacher-filter @tabs", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    await chooseFilter(d.app, "Obcy", s.foreigners);
    for (const tab of ["Zamówienia", "Kontakty", "Mailingi", "Historia zmian", "Struktura"]) {
      await d.app.page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(d.app.page.getByRole("tabpanel", { name: tab, exact: true })).toBeVisible();
    }
    await d.app.page.getByRole("tab", { name: "Nauczyciele", exact: true }).click();
    await expect(teacherList(d.app)).toBeVisible();
    await chooseFilter(d.app, "Nauczyciele", s.all);
  });

  test("TFL-21: klasyfikacja uwzględnia szkołę wpisu, nie status globalny @school @teacher-filter @school-context", async ({
    filterData: d,
  }) => {
    const a = await d.school("A");
    const b = await d.school("B");
    const t = await d.teacher(a, "DWIE_SZKOLY", ["Matematyka"], [b]);
    await d.declare(t, a, true);
    await d.declare(t, b, false);
    await openFilterSchool(d, a);
    await expectCounters(d.app, 1, 1, 0);
    await chooseFilter(d.app, "Nasi", [t.id]);
    await chooseFilter(d.app, "Obcy", []);
    await openFilterSchool(d, b);
    await expectCounters(d.app, 1, 0, 1);
    await chooseFilter(d.app, "Obcy", [t.id]);
    await chooseFilter(d.app, "Nasi", []);
  });

  for (const sample of [
    { id: "TFL-22", before: true, after: false, description: "GWO na inne wydawnictwo" },
    { id: "TFL-23", before: false, after: true, description: "inne wydawnictwo na GWO" },
  ]) {
    test(`${sample.id}: zmiana ${sample.description} aktualizuje listy i liczniki @school @teacher-filter @latest-entry`, async ({
      filterData: d,
    }) => {
      const school = await d.school();
      const t = await d.teacher(school, "ZMIANA");
      const entry = await d.declare(t, school, sample.before);
      await openFilterSchool(d, school);
      await expectCounters(d.app, 1, sample.before ? 1 : 0, sample.before ? 0 : 1);
      await d.change(t, entry.confirmationId, sample.after);
      await openFilterSchool(d, school);
      await expectCounters(d.app, 1, sample.after ? 1 : 0, sample.after ? 0 : 1);
      await chooseFilter(d.app, sample.after ? "Nasi" : "Obcy", [t.id]);
      await chooseFilter(d.app, sample.after ? "Obcy" : "Nasi", []);
    });
  }

  for (const sample of [
    { id: "TFL-24", own: true },
    { id: "TFL-25", own: false },
  ]) {
    test(`${sample.id}: usunięte potwierdzenie ${sample.own ? "GWO" : "obce"} nie kwalifikuje do grup @school @teacher-filter @soft-delete`, async ({
      filterData: d,
    }) => {
      const school = await d.school();
      const t = await d.teacher(school, "USUNIETY_WPIS");
      const entry = await d.declare(t, school, sample.own);
      await openFilterSchool(d, school);
      await chooseFilter(d.app, sample.own ? "Nasi" : "Obcy", [t.id]);
      await d.remove(t, entry.confirmationId);
      await openFilterSchool(d, school);
      await expectCounters(d.app, 1, 0, 0);
      await chooseFilter(d.app, "Nasi", []);
      await chooseFilter(d.app, "Obcy", []);
      await chooseFilter(d.app, "Nauczyciele", [t.id]);
    });
  }

  test("TFL-26: aktualne GWO ma pierwszeństwo przed przyszłym Obcy po GWO @school @teacher-filter @regression @school-year", async ({
    filterData: d,
  }) => {
    const years = await d.schoolYears();
    const currentYear = TFL_CURRENT_SCHOOL_YEAR;
    const start = Number(currentYear.split("/")[0]);
    expect(Number.isInteger(start)).toBe(true);
    const future = `${start + 1}/${start + 2}`;
    // Nie zapisujemy części danych, jeśli nie da się zbudować obu lat scenariusza.
    expect(
      years.some((year) => year.description === currentYear),
      `TFL-26 wymaga aktywnego roku ${currentYear} w słowniku. Ustal OCTOPUS_TFL_CURRENT_SCHOOL_YEAR zgodnie z aktywnym rokiem systemu.`,
    ).toBe(true);
    test.skip(
      !years.some((year) => year.description === future),
      `Brak przyszłego roku ${future} w słowniku formularza. Regresja będzie dostępna po jego dodaniu (około kwietnia).`,
    );
    const school = await d.school();
    const t = await d.teacher(school, "PRZYSZLY_OBCY");
    await d.declare(t, school, true, { year: currentYear });
    await d.declare(t, school, false, { year: future });
    // Przygotowanie przez API nie otwiera profilu nauczyciela.
    await d.app.openPanel("teacher", t.id);
    await expect(
      subjectLevelRow(d.app.page).getByRole("cell", { name: "Obcy po GWO", exact: true }),
    ).toBeVisible();
    await openFilterSchool(d, school);
    await expectCounters(d.app, 1, 1, 0);
    await chooseFilter(d.app, "Nasi", [t.id]);
    await chooseFilter(d.app, "Obcy", []);
    await chooseFilter(d.app, "Nauczyciele", [t.id]);
  });

  test("TFL-27: ponowne kliknięcie filtra nie zmienia wyników ani liczników @school @teacher-filter @repeat", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    for (const [filter, ids] of [
      ["Nasi", s.ours],
      ["Obcy", s.foreigners],
      ["Nauczyciele", s.all],
    ] as const) {
      for (let i = 0; i < 3; i++) await chooseFilter(d.app, filter, [...ids]);
      await expectCounters(d.app, 4, 2, 2);
    }
  });

  test("TFL-28: filtry można uruchomić klawiaturą @school @teacher-filter @keyboard", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    for (const [filter, ids] of [
      ["Nasi", s.ours],
      ["Obcy", s.foreigners],
      ["Nauczyciele", s.all],
    ] as const) {
      const button = filterButton(d.app, filter);
      await button.focus();
      await button.press("Enter");
      await expectTeacherIds(d.app, [...ids]);
    }
  });

  test("TFL-29: filtrowanie nie zmienia danych po ponownym otwarciu szkoły @school @teacher-filter @persistence", async ({
    filterData: d,
  }) => {
    const s = await mixedFilterData(d);
    await chooseFilter(d.app, "Obcy", s.foreigners);
    await openFilterSchool(d, s.school);
    await chooseFilter(d.app, "Nauczyciele", s.all);
    await expectCounters(d.app, 4, 2, 2);
  });

  test("TFL-30: nauczyciel przypisany tylko do innej szkoły nie jest pokazywany @school @teacher-filter @school-context", async ({
    filterData: d,
  }) => {
    const a = await d.school("A");
    const b = await d.school("B");
    const t = await d.teacher(b, "TYLKO_B");
    await d.declare(t, b, true);
    await openFilterSchool(d, a);
    await expectCounters(d.app, 0, 0, 0);
    for (const filter of ["Nauczyciele", "Nasi", "Obcy"] as const)
      await chooseFilter(d.app, filter, []);
  });
});
