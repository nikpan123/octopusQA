import { expect } from "@playwright/test";
import {
  test,
  expectClassCell,
  expectClassViews,
  classProductRow,
  showClassOrders,
  showClassPositions,
} from "./support/order-class";
import { expandOrderItems, openOrders, orderRow } from "./support/order";
import { prepareOrderSchool } from "./support/order-scenario";

test.describe("Klasa w zamówieniach szkolnych", () => {
  test.beforeEach(async ({}, info) => {
    info.setTimeout(240000);
  });

  for (const [index, view] of ["lista", "szczegóły", "pozycje"].entries()) {
    test(`ORD-CLASS-0${index + 1}: kolumna Klasa jest widoczna i zgodna z makietą - ${view} @school @order @order-class @layout`, async ({
      page,
      classOrders: api,
    }) => {
      const product =
        await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
          api.product("F7P", [7]));
      const id = await api.save([{ product, quantity: 1 }]);
      const panel =
        await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
          showClassOrders(page, api));
      const table =
        view === "szczegóły"
          ? await expandOrderItems(panel, id)
          : view === "pozycje"
            ? await test.step("Widok: otwarcie pozycji zamówień", async () =>
                showClassPositions(page))
            : panel;
      const headers = table.getByRole("columnheader");
      await test.step('Sprawdzenie: widoczność elementu — table.getByRole("columnheader", { name: "Klasa", exact: true })', async () =>
        expect(table.getByRole("columnheader", { name: "Klasa", exact: true })).toBeVisible());
      const labels = (await headers.allTextContents()).map((text) => text.trim());
      const preceding = view === "lista" ? "Symbol" : "Tytuł";
      await test.step("Sprawdzenie: wartość nie mniejsza od granicy — labels.indexOf(preceding); granica: 0", async () => {
        expect(labels.indexOf(preceding)).toBeGreaterThanOrEqual(0);
      });
      await test.step('Sprawdzenie: zgodność wartości — labels.indexOf("Klasa"); oczekiwane: labels.indexOf(preceding) + 1', async () => {
        expect(labels.indexOf("Klasa")).toBe(labels.indexOf(preceding) + 1);
      });
    });
  }

  for (const sample of [
    { id: "04", code: "P5Pv", classes: [5], kind: "podręcznik klasy 5" },
    { id: "05", code: "F7P", classes: [7], kind: "podręcznik klasy 7" },
    { id: "06", code: "m-F7P", classes: [7], kind: "multimedia klasy 7" },
    { id: "07", code: "FG2y", classes: [7, 8], kind: "produkt dla kilku klas" },
  ]) {
    test(`ORD-CLASS-${sample.id}: ${sample.kind} ma właściwą klasę w trzech widokach @school @order @order-class @positive`, async ({
      page,
      classOrders: api,
    }) => {
      const product =
        await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
          api.product(sample.code, sample.classes));
      const id = await api.save([{ product, quantity: 2 }]);
      await test.step("Sprawdzenie: expectClassViews", async () =>
        expectClassViews(page, api, id, [{ product, classes: sample.classes }]));
    });
  }

  test("ORD-CLASS-08: brak przypisanej klasy pozostawia pustą komórkę w trzech widokach @school @order @order-class @empty", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu bez przypisanej klasy", async () =>
        api.classless());
    const id = await api.save([{ product, quantity: 1 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product, classes: [] }]));
  });

  test("ORD-CLASS-09: produkt LS ma klasę w trzech widokach @school @order @order-class @ls", async ({
    page,
    classOrders: api,
  }) => {
    const code = process.env.OCTOPUS_ORDER_LS_CODE;
    const raw = process.env.OCTOPUS_ORDER_LS_CLASSES;
    test.skip(
      !code || !raw,
      "Brak produktu LS w katalogu, potwierdzony przez użytkownika. Po dodaniu produktu można wskazać OCTOPUS_ORDER_LS_CODE i OCTOPUS_ORDER_LS_CLASSES. Nie zastępujemy LS podręcznikiem.",
    );
    const classes = raw!.split(",").map((value) => Number(value.trim()));
    await test.step("Sprawdzenie: wartość powyżej granicy — classes.length; granica: 0", async () => {
      expect(classes.length).toBeGreaterThan(0);
    });
    await test.step("Sprawdzenie: zgodność wartości — classes.every((value) => Number.isInteger(value) && value >= 0); oczekiwane: true", async () => {
      expect(classes.every((value) => Number.isInteger(value) && value >= 0)).toBe(true);
    });
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product(code!, classes));
    const id = await api.save([{ product, quantity: 1 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product, classes }]));
  });

  test("ORD-CLASS-10: zamówienie klas 5 i 7 agreguje klasy, ale nie miesza pozycji @school @order @order-class @aggregate", async ({
    page,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const b = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("P5Pv", [5]));
    // Celowo odwrotna kolejność pozycji: lista klas ma być rosnąca.
    const id = await api.save([
      { product: a, quantity: 1 },
      { product: b, quantity: 1 },
    ]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [
        { product: a, classes: [7] },
        { product: b, classes: [5] },
      ]));
  });

  test("ORD-CLASS-11: dwa różne produkty klasy 7 nie duplikują klasy zamówienia @school @order @order-class @duplicates", async ({
    page,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const b = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P-1", [7]));
    const id = await api.save([
      { product: a, quantity: 1 },
      { product: b, quantity: 1 },
    ]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [
        { product: a, classes: [7] },
        { product: b, classes: [7] },
      ]));
  });

  test("ORD-CLASS-12: ilość produktu nie jest numerem klasy @school @order @order-class @quantity", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 25 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product, classes: [7] }]));
  });

  test("ORD-CLASS-13: produkt bez klasy nie dziedziczy klasy innej pozycji @school @order @order-class @empty", async ({
    page,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const b =
      await test.step("Przygotowanie: wyszukanie produktu bez przypisanej klasy", async () =>
        api.classless());
    const id = await api.save([
      { product: a, quantity: 1 },
      { product: b, quantity: 1 },
    ]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [
        { product: a, classes: [7] },
        { product: b, classes: [] },
      ]));
  });

  test("ORD-CLASS-14: ten sam produkt w dwóch zamówieniach ma jedną pozycję i poprawne powiązania @school @order @order-class @positions", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const first = await api.save([{ product, quantity: 2 }]);
    const second = await api.save([{ product, quantity: 3 }]);
    await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
      showClassOrders(page, api));
    const positions = await test.step("Widok: otwarcie pozycji zamówień", async () =>
      showClassPositions(page));
    const row = classProductRow(positions, product);
    await test.step("Sprawdzenie: liczba elementów w widoku — row; oczekiwane: 1", async () =>
      expect(row).toHaveCount(1));
    await test.step("Sprawdzenie: expectClassCell", async () => expectClassCell(row, "class", [7]));
    await row
      .locator("mat-icon")
      .filter({ hasText: /^keyboard_arrow_down$/ })
      .click();
    const details = row.locator("xpath=following-sibling::*[1]");
    for (const id of [first, second])
      await test.step('Sprawdzenie: liczba elementów w widoku — details.getByRole("cell", { name: id, exact: true }); oczekiwane: 1', async () =>
        expect(details.getByRole("cell", { name: id, exact: true })).toHaveCount(1));
    await test.step("Sprawdzenie: expectClassCell", async () => expectClassCell(row, "class", [7]));
  });

  test("ORD-CLASS-15: klasy dwóch różnych zamówień nie przenikają się @school @order @order-class @isolation", async ({
    page,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const b = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("P5Pv", [5]));
    const first = await api.save([{ product: a, quantity: 1 }]);
    const second = await api.save([{ product: b, quantity: 1 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, first, [{ product: a, classes: [7] }]));
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, second, [{ product: b, classes: [5] }]));
  });

  test("ORD-CLASS-16: klasy pozostają po przeładowaniu strony @school @order @order-class @persistence", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("P5Pv", [5]));
    const id = await api.save([{ product, quantity: 1 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product, classes: [5] }]));
    await page.reload();
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product, classes: [5] }]));
  });

  test("ORD-CLASS-17: zmiana zakładek nie zmienia klasy @school @order @order-class @tabs", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const orders =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    for (let i = 0; i < 3; i++) {
      const positions = await test.step("Widok: otwarcie pozycji zamówień", async () =>
        showClassPositions(page));
      await test.step("Sprawdzenie: expectClassCell", async () =>
        expectClassCell(classProductRow(positions, product), "class", [7]));
      await page.getByRole("tab", { name: "Zamówienia", exact: true }).last().click();
      await test.step("Sprawdzenie: expectClassCell", async () =>
        expectClassCell(orderRow(orders, id), "classesInOrder", [7]));
    }
  });

  test("ORD-CLASS-18: zamiana produktu przez API aktualizuje klasę i usuwa starą pozycję @school @order @order-class @edit", async ({
    page,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("P5Pv", [5]));
    const b = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const id = await api.save([{ product: a, quantity: 1 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product: a, classes: [5] }]));
    await api.save([{ product: b, quantity: 1 }], id);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product: b, classes: [7] }]));
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    const details = await expandOrderItems(panel, id);
    await test.step("Sprawdzenie: liczba elementów w widoku — classProductRow(details, a); oczekiwane: 0", async () =>
      expect(classProductRow(details, a)).toHaveCount(0));
  });

  test("ORD-CLASS-19: usunięcie pozycji klasy 5 aktualizuje agregację zamówienia @school @order @order-class @edit", async ({
    page,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("P5Pv", [5]));
    const b = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const id = await api.save([
      { product: a, quantity: 1 },
      { product: b, quantity: 1 },
    ]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [
        { product: a, classes: [5] },
        { product: b, classes: [7] },
      ]));
    await api.save([{ product: b, quantity: 1 }], id);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product: b, classes: [7] }]));
  });

  test("ORD-CLASS-20: usunięcie jednego zamówienia nie usuwa klasy produktu z drugiego @school @order @order-class @delete", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const first = await api.save([{ product, quantity: 1 }]);
    const second = await api.save([{ product, quantity: 2 }]);
    await api.remove(first);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, second, [{ product, classes: [7] }]));
  });

  test("ORD-CLASS-21: zamówienie i jego klasa nie pojawiają się w innej szkole @school @order @order-class @isolation", async ({
    page,
    scenario,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    await test.step("Sprawdzenie: expectClassViews", async () =>
      expectClassViews(page, api, id, [{ product, classes: [7] }]));
    const other = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
      prepareOrderSchool(page, scenario, "secondary"));
    await scenario.app.openPanel("school", other.id);
    await test.step("Sprawdzenie: liczba elementów w widoku — orderRow(await openOrders(page), id); oczekiwane: 0", async () =>
      expect(orderRow(await openOrders(page), id)).toHaveCount(0));
  });

  test("ORD-CLASS-22: zwijanie i rozwijanie zachowuje klasę pozycji @school @order @order-class @expand", async ({
    page,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    for (let i = 0; i < 3; i++) {
      const details = await expandOrderItems(panel, id);
      await test.step("Sprawdzenie: expectClassCell", async () =>
        expectClassCell(classProductRow(details, product), "class", [7]));
      await orderRow(panel, id)
        .locator("mat-icon")
        .filter({ hasText: /^keyboard_arrow_up$/ })
        .click();
      await test.step("Sprawdzenie: ukrycie elementu — details", async () =>
        expect(details).toBeHidden());
      await test.step("Sprawdzenie: expectClassCell", async () =>
        expectClassCell(orderRow(panel, id), "classesInOrder", [7]));
    }
  });
});
