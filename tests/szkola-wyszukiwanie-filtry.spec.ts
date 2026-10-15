import { test, expect } from "./support/fixtures";
import { Octopus } from "./support/octopus";
import { GOLD_SCHOOL } from "./support/school-medal-data";
import { expectSchoolMedal } from "./support/school-medal";
import {
  schoolSearchForm,
  applySearchCriteria,
  selectSearchValues,
  submitSchoolSearch,
  searchSchools,
  searchDataset,
  expectEmptySchoolSearch,
} from "./support/school-search-filters";

test.describe("Rozszerzone filtry wyszukiwarki szkół", () => {
  test.beforeEach(async ({}, info) => {
    info.setTimeout(360000);
  });

  test("SFLT-01: formularz zawiera nowe pola i komplet opcji @school @school-search @smoke", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const form = await schoolSearchForm(app);
    for (const [field, options] of [
      ["medal-select", ["Złoto", "Srebro", "Brąz", "Brak"]],
      ["size-category-select", ["A", "B", "C", "D"]],
      ["si-select", ["TAK", "NIE"]],
    ] as const) {
      await form.locator(`[data-cy="${field}"]`).click();
      await test.step('Sprawdzenie: tekst w widoku — page.getByRole("option"); oczekiwane: [...options]', async () =>
        expect(page.getByRole("option")).toHaveText([...options]));
      if (field !== "si-select")
        await test.step('Sprawdzenie: wartość atrybutu — page.getByRole("listbox"); oczekiwane: "aria-multiselectable"', async () =>
          expect(page.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true"));
      await page.keyboard.press("Escape");
    }
    await test.step("Sprawdzenie: możliwość edycji — form.locator('[data-cy=\"rspo-input\"]')", async () =>
      expect(form.locator('[data-cy="rspo-input"]')).toBeEditable());
  });

  for (const [index, categories] of [
    ["A"],
    ["B"],
    ["C"],
    ["D"],
    ["A", "B"],
    ["A", "C"],
    ["A", "B", "C", "D"],
  ].entries()) {
    test(`SFLT-${String(index + 2).padStart(2, "0")}: kategorie ${categories.join(" lub ")} filtrują jako OR @school @school-search @category`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const data =
        await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
          searchDataset(app));
      const result =
        await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
          searchSchools(app, { name: data.prefix, categories }));
      await test.step("Sprawdzenie: liczba elementów — result.model.sizeCategory; oczekiwane: categories.length", async () => {
        expect(result.model.sizeCategory).toHaveLength(categories.length);
      });
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: data.schools .filter((school) => categories.includes(school.category)) .map((school) => school.id) .sort()", async () => {
        expect(result.ids).toEqual(
          data.schools
            .filter((school) => categories.includes(school.category))
            .map((school) => school.id)
            .sort(),
        );
      });
    });
  }

  test("SFLT-09: Medal Brak lub Złoto działa jako OR @school @school-search @medal", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    // Dwa małe zbiory zamiast założenia, że oba medale muszą wystąpić
    // na pierwszej stronie ogólnego wyszukiwania (która może zawierać same Złota).
    for (const target of [
      { ...GOLD_SCHOOL, medal: "Złoto" as const },
      { ...data.schools[0], city: "Poznań", medal: "Brak" as const },
    ]) {
      await app.openPanel("school", target.id);
      await test.step("Sprawdzenie: expectSchoolMedal", async () =>
        expectSchoolMedal(page, target.medal));
      const result =
        await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
          searchSchools(app, {
            name: target.name,
            city: target.city,
            medals: ["Brak", "Złoto"],
          }));
      await test.step("Sprawdzenie: liczba elementów — result.model.institutionIds ?? []; oczekiwane: 0", async () => {
        expect(result.model.institutionIds ?? []).toHaveLength(0);
      });
      await test.step("Sprawdzenie: liczba elementów — result.model.medal; oczekiwane: 2", async () => {
        expect(result.model.medal).toHaveLength(2);
      });
      await test.step("Sprawdzenie: obecność oczekiwanego elementu — result.ids; oczekiwane: target.id", async () => {
        expect(
          result.ids,
          `OR Brak/Złoto powinno obejmować szkołę ${target.id} z medalem ${target.medal}`,
        ).toContain(target.id);
      });
      for (const school of result.schools)
        await test.step('Sprawdzenie: obecność oczekiwanego elementu — ["Brak", "Złoto"]; oczekiwane: school.informationAboutMedalCategory?.medalCategoryName', async () => {
          expect(["Brak", "Złoto"]).toContain(
            school.informationAboutMedalCategory?.medalCategoryName,
          );
        });
    }
  });

  for (const [index, category] of ["A", "B", "C", "D"].entries()) {
    test(`SFLT-${index + 10}: Medal Brak obejmuje kategorię ${category} @school @school-search @medal @category`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const data =
        await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
          searchDataset(app));
      const result =
        await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
          searchSchools(app, {
            name: data.prefix,
            medals: ["Brak"],
            categories: [category],
          }));
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: data.schools .filter((school) => school.category === category) .map((school) => school.id) .sort()", async () => {
        expect(result.ids).toEqual(
          data.schools
            .filter((school) => school.category === category)
            .map((school) => school.id)
            .sort(),
        );
      });
      for (const school of result.schools)
        await test.step('Sprawdzenie: zgodność wartości — school.informationAboutMedalCategory?.medalCategoryName; oczekiwane: "Brak"', async () => {
          expect(school.informationAboutMedalCategory?.medalCategoryName).toBe("Brak");
        });
    });
  }

  test("SFLT-14: Medal i Kategoria i nazwa działają jako AND @school @school-search @and", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const result =
      await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
        searchSchools(app, {
          name: data.prefix,
          medals: ["Brak", "Złoto"],
          categories: ["B", "C"],
        }));
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: data.schools .filter((school) => ["B", "C"].includes(school.category)) .map((school) => school.id) .sort()', async () => {
      expect(result.ids).toEqual(
        data.schools
          .filter((school) => ["B", "C"].includes(school.category))
          .map((school) => school.id)
          .sort(),
      );
    });
  });

  test("SFLT-15: nazwa zawęża wyniki kategorii @school @school-search @and", async ({ page }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — (await searchSchools(app, { name: data.schools[1].name, categories: ["A", "B"] })).ids; oczekiwane: [data.schools[1].id]', async () => {
      expect(
        (await searchSchools(app, { name: data.schools[1].name, categories: ["A", "B"] })).ids,
      ).toEqual([data.schools[1].id]);
    });
  });

  test("SFLT-16: poziom ogranicza wyniki Medalu i Kategorii @school @school-search @and", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const form = await schoolSearchForm(app);
    // Etykieta poziomu pochodzi ze słownika formularza, a nie z numeru typu.
    await form.locator('[data-cy="school-level-select"]').click();
    // Nazwa dostępności normalizuje spacje otaczające tekst mat-option.
    const level = page.getByRole("option", { name: /^Szkoła\s+Podstawowa$/i });
    await test.step("Sprawdzenie: liczba elementów w widoku — level; oczekiwane: 1", async () =>
      expect(level).toHaveCount(1));
    await level.click();
    await applySearchCriteria(app, form, {
      name: data.prefix,
      medals: ["Brak"],
      categories: ["A", "B", "C", "D"],
    });
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — (await submitSchoolSearch(app, form)).ids; oczekiwane: data.schools .filter((school) => school.category !== "D") .map((school) => school.id) .sort()', async () => {
      expect((await submitSchoolSearch(app, form)).ids).toEqual(
        data.schools
          .filter((school) => school.category !== "D")
          .map((school) => school.id)
          .sort(),
      );
    });
  });

  test("SFLT-17: RSPO wymaga dokładnego numeru @school @school-search @rspo", async ({ page }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const target = data.schools[0];
    const result =
      await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
        searchSchools(app, { name: data.prefix, rspo: target.rspo }));
    await test.step("Sprawdzenie: zgodność wartości — String(result.model.rspoNumber); oczekiwane: target.rspo", async () => {
      expect(String(result.model.rspoNumber)).toBe(target.rspo);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: [target.id]", async () => {
      expect(result.ids).toEqual([target.id]);
    });
  });

  test("SFLT-18: fragment RSPO nie zwraca dopasowania częściowego @school @school-search @rspo @negative", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await searchSchools(app, { name: data.prefix, rspo: data.schools[0].rspo.slice(0, -1) })) .ids; oczekiwane: []", async () => {
      expect(
        (await searchSchools(app, { name: data.prefix, rspo: data.schools[0].rspo.slice(0, -1) }))
          .ids,
      ).toEqual([]);
    });
    await test.step("Sprawdzenie: expectEmptySchoolSearch", async () =>
      expectEmptySchoolSearch(app));
  });

  test("SFLT-19: dokładny RSPO ma pierwszeństwo nad niezgodną kategorią @school @school-search @rspo @priority", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const target = data.schools[0];
    await test.step('Sprawdzenie: zgodność wartości — target.category; oczekiwane: "A"', async () => {
      expect(target.category).toBe("A");
    });
    const result =
      await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
        searchSchools(app, {
          name: data.prefix,
          rspo: target.rspo,
          categories: ["D"],
        }));
    // Kategoria faktycznie trafia do API: test nie usuwa sprzecznego filtra.
    await test.step("Sprawdzenie: zgodność wartości — String(result.model.rspoNumber); oczekiwane: target.rspo", async () => {
      expect(String(result.model.rspoNumber)).toBe(target.rspo);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.model.sizeCategory; oczekiwane: [4]", async () => {
      expect(result.model.sizeCategory).toEqual([4]);
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: [target.id]", async () => {
      expect(
        result.ids,
        "Dokładny RSPO powinien zwrócić wskazaną szkołę A mimo wybranej kategorii D",
      ).toEqual([target.id]);
    });
  });

  test("SFLT-20: brak wyników zastępuje poprzednią listę komunikatem @school @school-search @empty", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    await test.step("Sprawdzenie: liczba elementów — (await searchSchools(app, { name: data.prefix })).ids; oczekiwane: 4", async () => {
      expect((await searchSchools(app, { name: data.prefix })).ids).toHaveLength(4);
    });
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — (await searchSchools(app, { name: `${data.prefix}_NIE_ISTNIEJE`, medals: ["Brak"] })).ids; oczekiwane: []', async () => {
      expect(
        (await searchSchools(app, { name: `${data.prefix}_NIE_ISTNIEJE`, medals: ["Brak"] })).ids,
      ).toEqual([]);
    });
    await test.step("Sprawdzenie: expectEmptySchoolSearch", async () =>
      expectEmptySchoolSearch(app));
  });

  for (const [index, label, field, clear, values] of [
    [21, "Kategoria", "size-category-select", "size-category-clear", ["A", "D"]],
    [22, "Medal", "medal-select", "medal-clear", ["Brak", "Złoto"]],
  ] as const) {
    test(`SFLT-${index}: wyczyszczenie pola ${label} krzyżykiem usuwa ograniczenie wyników @school @school-search @clear`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const data =
        await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
          searchDataset(app));
      const form = await schoolSearchForm(app);
      await applySearchCriteria(app, form, { name: data.prefix });
      await selectSearchValues(app, form, field, [...values]);
      const select = form.locator(`[data-cy="${field}"]`);
      for (const value of values)
        await test.step("Sprawdzenie: obecność tekstu w widoku — select; oczekiwane: value", async () =>
          expect(select).toContainText(value));
      const clearButton = form.locator(`[data-cy="${clear}"]`);
      await test.step("Sprawdzenie: widoczność elementu — clearButton", async () =>
        expect(clearButton).toBeVisible());
      await clearButton.click();
      await test.step('Sprawdzenie: tekst w widoku — select; oczekiwane: ""', async () =>
        expect(select).toHaveText(""));
      await test.step("Sprawdzenie: liczba elementów w widoku — clearButton; oczekiwane: 0", async () =>
        expect(clearButton).toHaveCount(0));
      // Sprawdzamy stan opcji po czyszczeniu, nie tylko tekst zamkniętego pola.
      await select.click();
      for (const value of values)
        await test.step('Sprawdzenie: wartość atrybutu — page.getByRole("option", { name: value, exact: true }); oczekiwane: "aria-selected"', async () =>
          expect(page.getByRole("option", { name: value, exact: true })).toHaveAttribute(
            "aria-selected",
            "false",
          ));
      await page.keyboard.press("Escape");
      const result = await submitSchoolSearch(app, form);
      await test.step('Sprawdzenie: liczba elementów — result.model[field === "medal-select" ? "medal" : "sizeCategory"] ?? []; oczekiwane: 0', async () => {
        expect(
          result.model[field === "medal-select" ? "medal" : "sizeCategory"] ?? [],
        ).toHaveLength(0);
      });
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: data.schools.map((school) => school.id).sort()", async () => {
        expect(
          result.ids,
          `Po wyczyszczeniu pola ${label} ma obowiązywać tylko nazwa zestawu, bez ograniczenia ${label}`,
        ).toEqual(data.schools.map((school) => school.id).sort());
      });
    });
  }

  test("SFLT-23: wyczyszczenie SI przywraca brak ograniczenia @school @school-search @clear", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const form = await schoolSearchForm(app);
    await applySearchCriteria(app, form, { name: data.prefix, si: true });
    await form.locator('[data-cy="si-clear"]').click();
    const result = await submitSchoolSearch(app, form);
    await test.step("Sprawdzenie: toBeNull — result.model.si ?? null", async () => {
      expect(result.model.si ?? null).toBeNull();
    });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: data.schools.map((school) => school.id).sort()", async () => {
      expect(result.ids).toEqual(data.schools.map((school) => school.id).sort());
    });
  });

  test("SFLT-24: kolejne wyszukanie zastępuje poprzednią kategorię @school @school-search @repeat", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    for (const category of ["A", "D", "B"])
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await searchSchools(app, { name: data.prefix, categories: [category] })).ids; oczekiwane: data.schools.filter((school) => school.category === category).map((school) => school.id)", async () => {
        expect(
          (await searchSchools(app, { name: data.prefix, categories: [category] })).ids,
        ).toEqual(
          data.schools.filter((school) => school.category === category).map((school) => school.id),
        );
      });
  });

  test("SFLT-25: poprawienie błędnego RSPO pozwala wyszukać szkołę @school @school-search @validation", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const form = await schoolSearchForm(app);
    const input = form.locator('[data-cy="rspo-input"]');
    await input.fill("abc");
    await input.blur();
    await input.fill(data.schools[0].rspo);
    await applySearchCriteria(app, form, { name: data.prefix });
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await submitSchoolSearch(app, form)).ids; oczekiwane: [data.schools[0].id]", async () => {
      expect((await submitSchoolSearch(app, form)).ids).toEqual([data.schools[0].id]);
    });
  });

  for (const [index, si] of [true, false].entries()) {
    test(`SFLT-${index + 26}: SI ${si ? "Tak" : "Nie"} łączy się z nazwą kategorią i medalem @school @school-search @si @and`, async ({
      page,
    }) => {
      const app = new Octopus(page);
      const data =
        await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
          searchDataset(app));
      const result =
        await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
          searchSchools(app, {
            name: data.prefix,
            medals: ["Brak"],
            categories: ["A", "D"],
            si,
          }));
      await test.step("Sprawdzenie: zgodność wartości — result.model.si; oczekiwane: si", async () => {
        expect(result.model.si).toBe(si);
      });
      // Nowe szkoły nie mają żadnego SI, zatem nie mogą wejść do wyniku Tak.
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — result.ids; oczekiwane: si ? [] : [data.schools[0].id, data.schools[3].id].sort()", async () => {
        expect(result.ids).toEqual(si ? [] : [data.schools[0].id, data.schools[3].id].sort());
      });
      if (si)
        await test.step("Sprawdzenie: expectEmptySchoolSearch", async () =>
          expectEmptySchoolSearch(app));
    });
  }

  // Istniejące, kontrolowane szkoły z realnymi SI; nie zastępujemy backendu atrapą.
  for (const [index, variable, si] of [
    [28, "OCTOPUS_SEARCH_SI_CURRENT", true],
    [29, "OCTOPUS_SEARCH_SI_PAST_ONLY", false],
    [30, "OCTOPUS_SEARCH_SI_FUTURE_ONLY", false],
  ] as const) {
    test(`SFLT-${index}: sezon SI według fixture ${variable} @school @school-search @si @season`, async ({
      page,
    }) => {
      const raw = process.env[variable];
      test.skip(
        !raw,
        `Wymagana kontrolowana szkoła: ${variable}={"id":"...","name":"..."}; patrz dokumentacja.`,
      );
      const school = JSON.parse(raw!) as { id: string; name: string };
      await test.step("Sprawdzenie: zgodność ze wzorcem — school.name; oczekiwane: /^AUTO_/", async () => {
        expect(school.name).toMatch(/^AUTO_/);
      });
      await test.step("Sprawdzenie: zgodność ze wzorcem — school.id; oczekiwane: /^\\d+$/", async () => {
        expect(school.id).toMatch(/^\d+$/);
      });
      const app = new Octopus(page);
      const baseline =
        await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
          searchSchools(app, { name: school.name }));
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — baseline.ids; oczekiwane: [school.id]", async () => {
        expect(baseline.ids).toEqual([school.id]);
      });
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await searchSchools(app, { name: school.name, si })).ids; oczekiwane: [school.id]", async () => {
        expect((await searchSchools(app, { name: school.name, si })).ids).toEqual([school.id]);
      });
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await searchSchools(app, { name: school.name, si: !si })).ids; oczekiwane: []", async () => {
        expect((await searchSchools(app, { name: school.name, si: !si })).ids).toEqual([]);
      });
      await test.step("Sprawdzenie: expectEmptySchoolSearch", async () =>
        expectEmptySchoolSearch(app));
    });
  }

  test("SFLT-31: wymagane pole Notatki jest dostępne niezależnie od Tagów @school @school-search @notes", async ({
    page,
  }) => {
    test.fail(true, "W formularzu DEV są Tagi, ale brak pola Notatki z przekazanych wymagań.");
    const form = await schoolSearchForm(new Octopus(page));
    await test.step('Sprawdzenie: widoczność elementu — form.getByText("Notatki", { exact: true })', async () =>
      expect(form.getByText("Notatki", { exact: true })).toBeVisible());
  });

  test("SFLT-32: RSPO działa samodzielnie bez nazwy i pozostałych filtrów @school @school-search @rspo", async ({
    page,
  }) => {
    const app = new Octopus(page);
    const data =
      await test.step("Przygotowanie: pobranie współdzielonego zestawu szkół do filtrowania", async () =>
        searchDataset(app));
    const result =
      await test.step("Wyszukiwanie: wykonanie filtrów i pobranie wyników do porównania", async () =>
        searchSchools(app, { rspo: data.schools[0].rspo }));
    await test.step('Sprawdzenie: zgodność wartości — result.model.nameOrFullName ?? ""; oczekiwane: ""', async () => {
      expect(result.model.nameOrFullName ?? "").toBe("");
    });
    await test.step("Sprawdzenie: liczba elementów — result.model.medal ?? []; oczekiwane: 0", async () => {
      expect(result.model.medal ?? []).toHaveLength(0);
    });
    await test.step("Sprawdzenie: liczba elementów — result.model.sizeCategory ?? []; oczekiwane: 0", async () => {
      expect(result.model.sizeCategory ?? []).toHaveLength(0);
    });
    await test.step("Sprawdzenie: toBeNull — result.model.si ?? null", async () => {
      expect(result.model.si ?? null).toBeNull();
    });
    // RSPO nie ma tu założonej unikalności w całej bazie DEV.
    await test.step("Sprawdzenie: obecność oczekiwanego elementu — result.ids; oczekiwane: data.schools[0].id", async () => {
      expect(result.ids).toContain(data.schools[0].id);
    });
    for (const other of data.schools.slice(1))
      await test.step("Sprawdzenie: negacja — obecność oczekiwanego elementu — result.ids; oczekiwane: other.id", async () => {
        expect(result.ids).not.toContain(other.id);
      });
  });
});
