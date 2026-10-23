import { test, expect } from "./support/fixtures";
import { ALL_GIFT_CLASSES, GiftCatalog, newGiftData } from "./support/gift-catalog";
import { readGiftCatalogDatabase } from "../scripts/gift-catalog-db.mjs";
import { OCTOPUS_ENV } from "./support/environment";

test.describe("Centrum wysyłkowe — katalog Gratisy @gift-catalog", () => {
  test("GFT-06: dodanie gratisu ze wszystkimi klasami pozostawia pustą kolumnę Klasa", async ({
    page,
  }, info) => {
    const catalog = new GiftCatalog(page, info);
    const data = { ...newGiftData(), classes: ALL_GIFT_CLASSES };
    await catalog.open();
    try {
      await test.step("Dodaj własny gratis AUTO i zaznacz wszystkie klasy od 0 do 8", () =>
        catalog.add(data));
      await test.step("Sprawdź pustą kolumnę Klasa bezpośrednio po dodaniu i po odświeżeniu", async () => {
        await expect(catalog.row(data.businessCode).locator('[col-id="classesNames"]')).toHaveText(
          "",
        );
        await catalog.open();
        await catalog.search("businessCode", data.businessCode);
        await expect(catalog.row(data.businessCode)).toHaveCount(1);
        await expect(catalog.row(data.businessCode).locator('[col-id="classesNames"]')).toHaveText(
          "",
        );
      });
      await test.step("Otwórz edycję: wszystkie klasy 0–8 pozostają zaznaczone", async () => {
        await catalog
          .row(data.businessCode)
          .locator("mat-icon")
          .filter({ hasText: /^edit$/ })
          .click();
        await catalog.checkSelectedClasses(ALL_GIFT_CLASSES);
        await page.getByRole("dialog").getByRole("button", { name: "Anuluj", exact: true }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
      });
    } finally {
      await catalog.cleanup();
    }
  });

  test("GFT-07: edycja zmienia wybrane klasy na wszystkie i z powrotem na wybrane", async ({
    page,
  }, info) => {
    const catalog = new GiftCatalog(page, info);
    const data = newGiftData();
    await catalog.open();
    try {
      await test.step("Dodaj gratis AUTO tylko dla klasy 4: w tabeli widnieje 4", async () => {
        await catalog.add(data);
        await expect(catalog.row(data.businessCode).locator('[col-id="classesNames"]')).toHaveText(
          "4",
        );
      });
      const id = await catalog.row(data.businessCode).locator('[col-id="id"]').first().innerText();
      for (const classes of [ALL_GIFT_CLASSES, ["5", "8"]]) {
        const all = classes.length === ALL_GIFT_CLASSES.length;
        await test.step(
          all
            ? "Ołówkiem zaznacz wszystkie klasy 0–8 i zapisz"
            : "Ołówkiem odznacz pozostałe klasy, pozostaw tylko 5 i 8 i zapisz",
          async () => {
            await catalog
              .row(data.businessCode)
              .locator("mat-icon")
              .filter({ hasText: /^edit$/ })
              .click();
            await catalog.setClasses(classes);
            await catalog.save();
          },
        );
        await test.step(
          all
            ? "Kolumna Klasa jest pusta po zapisie i odświeżeniu"
            : "Kolumna Klasa zawiera wyłącznie 5 i 8 po zapisie i odświeżeniu",
          async () => {
            await catalog.checkClassColumn(data.businessCode, classes);
            await catalog.open();
            await catalog.search("businessCode", data.businessCode);
            await expect(
              catalog.row(data.businessCode).locator('[col-id="id"]').first(),
            ).toHaveText(id);
            await catalog.checkClassColumn(data.businessCode, classes);
          },
        );
        await test.step("Otwórz edycję ponownie i sprawdź zapisane zaznaczenia każdej klasy", async () => {
          await catalog
            .row(data.businessCode)
            .locator("mat-icon")
            .filter({ hasText: /^edit$/ })
            .click();
          await catalog.checkSelectedClasses(classes);
          await page
            .getByRole("dialog")
            .getByRole("button", { name: "Anuluj", exact: true })
            .click();
        });
      }
    } finally {
      await catalog.cleanup();
    }
  });

  test("GFT-01: lista gratisów zawiera filtry, kolumny i przyciski", async ({ page }, info) => {
    const catalog = new GiftCatalog(page, info);
    await test.step("Otwórz Centrum wysyłkowe → Gratisy i sprawdź tabelę", () => catalog.open());
    for (const column of [
      "ID",
      "Tytuł",
      "Poziom",
      "Przedmiot",
      "Klasa",
      "Symbol promocyjny",
      "Waga",
      "Kod handlowy",
      "Usuń",
      "Edytuj",
    ])
      await expect(
        catalog.view.getByRole("columnheader", { name: column, exact: true }),
      ).toBeVisible();
    for (const field of [
      "id",
      "title",
      "subjectName",
      "levelName",
      "businessCode",
      "promotionCode",
      "classes",
    ])
      await expect(catalog.view.locator(`#${field}`)).toBeVisible();
    for (const name of ["Szukaj", "Wyczyść filtry", "Dodaj nowy gratis", "Eksportuj do Excela"])
      await expect(catalog.view.getByRole("button", { name, exact: true })).toBeEnabled();
    await expect(
      catalog.view.getByRole("button", { name: "Edycja rekordów", exact: true }),
    ).toBeDisabled();
  });

  test("GFT-02: dodanie, edycja, zgodność z bazą i usunięcie gratisu", async ({ page }, info) => {
    test.skip(OCTOPUS_ENV !== "dev", "Porównanie z bazą jest dostępne na DEV.");
    // Sprawdź połączenie przed utworzeniem danych.
    await readGiftCatalogDatabase();
    const catalog = new GiftCatalog(page, info);
    const data = newGiftData();
    await catalog.open();
    try {
      const payload =
        await test.step("Dodaj nowy gratis: Matematyka, SP, klasa 4, waga 123 g", () =>
          catalog.add(data));
      const id = await test.step("Porównaj wszystkie pola w tabeli z zapisem w bazie", () =>
        catalog.check(data, payload));
      await test.step("Odśwież stronę i wyszukaj zapisany gratis po kodzie", async () => {
        await catalog.open();
        await catalog.search("businessCode", data.businessCode);
        await catalog.check(data, payload);
      });
      const edited = {
        ...data,
        title: data.title + " E",
        weight: "250",
        promotionCode: data.promotionCode + "E",
        classes: ["4", "5"],
      };
      const editPayload =
        await test.step("Kliknij ołówek; zmień tytuł, symbol, wagę i dodaj klasę 5; zapisz", async () => {
          await catalog
            .row(data.businessCode)
            .locator("mat-icon")
            .filter({ hasText: /^edit$/ })
            .click();
          await expect(page.getByRole("dialog").locator('[data-cy="id-input"]')).toBeDisabled();
          await catalog.fill(edited);
          return catalog.save();
        });
      await test.step("Sprawdź trwałość edycji w tabeli i bazie pod tym samym ID", async () => {
        await catalog.open();
        await catalog.search("businessCode", data.businessCode);
        expect(await catalog.check(edited, editPayload)).toBe(id);
      });
      await test.step("Usuń gratis przez śmietnik i potwierdź Tak", () =>
        catalog.remove(data.businessCode));
      await test.step("Sprawdź brak wpisu po odświeżeniu oraz usunięcie w bazie", async () => {
        await catalog.open();
        await catalog.search("businessCode", data.businessCode);
        await expect(catalog.row(data.businessCode)).toHaveCount(0);
        const rows = await readGiftCatalogDatabase(id);
        expect(rows.length === 0 || rows.every((r) => r.isDel)).toBeTruthy();
      });
    } finally {
      await catalog.cleanup();
    }
  });

  test("GFT-03: anulowanie dodawania i walidacja pustego formularza", async ({ page }, info) => {
    const catalog = new GiftCatalog(page, info);
    await catalog.open();
    await page.getByRole("button", { name: "Dodaj nowy gratis", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const writes: string[] = [];
    const onRequest = (r: import("@playwright/test").Request) => {
      if (r.url().includes("/Order/AddItemOrder") && r.method() === "POST") writes.push(r.url());
    };
    page.on("request", onRequest);
    try {
      await test.step("Zapisz pusty formularz: pozostaje otwarty i wskazuje brak tytułu, przedmiotu oraz poziomu", async () => {
        await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
        await expect(dialog).toBeVisible();
        for (const text of ["Wpisz tytuł", "Wybierz przedmiot", "Wybierz poziom"])
          await expect(dialog.getByText(text, { exact: true })).toBeVisible();
        expect(writes).toHaveLength(0);
      });
      const data = newGiftData();
      await catalog.fill(data);
      await test.step("Anuluj wypełniony formularz i sprawdź, że gratis nie powstał", async () => {
        await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
        await catalog.search("businessCode", data.businessCode);
        await expect(catalog.row(data.businessCode)).toHaveCount(0);
        expect(writes).toHaveLength(0);
      });
    } finally {
      page.off("request", onRequest);
    }
  });

  test("GFT-04: filtry tekstowe, ID, słowniki i czyszczenie filtrów", async ({ page }, info) => {
    const catalog = new GiftCatalog(page, info);
    const data = newGiftData();
    await catalog.open();
    try {
      await catalog.add(data);
      const id = await catalog.row(data.businessCode).locator('[col-id="id"]').first().innerText();
      for (const [field, value] of [
        ["id", id],
        ["title", data.title],
        ["businessCode", data.businessCode],
        ["promotionCode", data.promotionCode],
      ])
        await test.step(`Wyszukaj własny gratis: ${field} = ${value}`, async () => {
          await catalog.view.getByRole("button", { name: "Wyczyść filtry", exact: true }).click();
          await catalog.search(field, value);
          await expect(catalog.row(data.businessCode)).toHaveCount(1);
          await expect(catalog.view.locator(".ag-center-cols-container .ag-row")).toHaveCount(1);
        });
      await test.step("Połącz kod z filtrami Matematyka, Szkoła Podstawowa i klasa 4", async () => {
        await catalog.select(catalog.view, "subjectName", "Matematyka");
        await catalog.select(catalog.view, "levelName", "Szkoła Podstawowa");
        await catalog.select(catalog.view, "classes", "4", true);
        await catalog.search("businessCode", data.businessCode);
        await expect(catalog.row(data.businessCode)).toHaveCount(1);
      });
      await test.step("Nieistniejący kod daje pustą listę; Wyczyść filtry przywraca pola", async () => {
        await catalog.search("businessCode", data.businessCode + "BRAK");
        await expect(catalog.view.locator(".ag-center-cols-container .ag-row")).toHaveCount(0);
        await catalog.view.getByRole("button", { name: "Wyczyść filtry", exact: true }).click();
        for (const field of ["id", "title", "businessCode", "promotionCode"])
          await expect(catalog.view.locator(`#${field}`)).toHaveValue("");
        for (const field of ["subjectName", "levelName", "classes"])
          await expect(catalog.view.locator(`#${field}`)).toHaveText("");
      });
    } finally {
      await catalog.cleanup();
    }
  });

  test("GFT-05: anulowanie edycji i usunięcia zachowuje gratis", async ({ page }, info) => {
    const catalog = new GiftCatalog(page, info);
    const data = newGiftData();
    await catalog.open();
    try {
      await catalog.add(data);
      await test.step("Zmień tytuł w edycji i kliknij Anuluj", async () => {
        await catalog
          .row(data.businessCode)
          .locator("mat-icon")
          .filter({ hasText: /^edit$/ })
          .click();
        await page.getByRole("dialog").locator('[data-cy="title-input"]').fill("AUTO Anulowany");
        await page.getByRole("dialog").getByRole("button", { name: "Anuluj", exact: true }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await catalog.open();
        await catalog.search("businessCode", data.businessCode);
        await expect(catalog.row(data.businessCode).locator('[col-id="title"]')).toHaveText(
          data.title,
        );
      });
      await test.step("Kliknij śmietnik i Anuluj: gratis nadal jest na liście", async () => {
        await catalog.remove(data.businessCode, true);
        await catalog.open();
        await catalog.search("businessCode", data.businessCode);
        await expect(catalog.row(data.businessCode)).toHaveCount(1);
      });
      await test.step("Zaznaczenie własnego wiersza udostępnia Edycję rekordów", async () => {
        await catalog.row(data.businessCode).locator(".ag-selection-checkbox").click();
        await expect(
          catalog.view.getByRole("button", { name: "Edycja rekordów", exact: true }),
        ).toBeEnabled();
        await catalog.row(data.businessCode).locator(".ag-selection-checkbox").click();
        await expect(
          catalog.view.getByRole("button", { name: "Edycja rekordów", exact: true }),
        ).toBeDisabled();
      });
    } finally {
      await catalog.cleanup();
    }
  });
});
