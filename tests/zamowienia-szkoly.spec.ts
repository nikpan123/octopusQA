import { test, expect } from "./support/scenario";

import {
  addOrderProduct,
  addOrderProductsFromCurrentResults,
  availableProductRow,
  cancelOrderForm,
  deleteOrder,
  expandOrderItems,
  expectOrderItems,
  getOrderIds,
  openNewOrderForm,
  openOrderEdit,
  openOrders,
  orderFilterCombobox,
  readOrderFilterOptions,
  saveNewOrder,
  saveOrderEdit,
  searchOrderProducts,
  selectOrderClasses,
  selectOrderSingleFilter,
  selectedProductRows,
  setOrderQuantity,
} from "./support/order";

import {
  ORDER_CLASS_OPTIONS,
  ORDER_LEVEL_OPTIONS,
  ORDER_PRODUCTS,
  ORDER_SUBJECT_OPTIONS,
} from "./data/order-product-data";
import {
  prepareOrderSchool,
  withOrderCleanup,
  createSimpleOrder,
  expectFilterReset,
} from "./support/order-scenario";

test.describe.configure({
  mode: "parallel",
});

test("ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu @school @order @smoke", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    const code = ORDER_PRODUCTS.physics7.products[1].code;

    const { orderId, title } = await createSimpleOrder(page, code, "1");

    await track(orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    const items = await expandOrderItems(orders, orderId);

    await test.step("Sprawdzenie: expectOrderItems", async () =>
      expectOrderItems(items, [
        {
          code,
          title,
          quantity: "1",
        },
      ]));
  });
});

test("ORD-02: zamówienie z dwoma produktami zachowuje produkty i ilości @school @order @positive", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    const code1 = ORDER_PRODUCTS.physics7.products[1].code;
    const code2 = ORDER_PRODUCTS.polish5.products[0].code;

    const form = await openNewOrderForm(page);

    const title1 = await addOrderProduct(form, code1);

    const title2 = await addOrderProduct(form, code2);

    await setOrderQuantity(form, code1, "2");

    await setOrderQuantity(form, code2, "5");

    const orderId = await saveNewOrder(page, form);

    await track(orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    const items = await expandOrderItems(orders, orderId);

    await test.step("Sprawdzenie: expectOrderItems", async () =>
      expectOrderItems(items, [
        {
          code: code1,
          title: title1,
          quantity: "2",
        },
        {
          code: code2,
          title: title2,
          quantity: "5",
        },
      ]));
  });
});

test("ORD-03: edycja ilości dwóch produktów i usunięcie zamówienia @school @order @edit", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    const code1 = ORDER_PRODUCTS.physics7.products[1].code;
    const code2 = ORDER_PRODUCTS.polish5.products[0].code;

    const form = await openNewOrderForm(page);

    const title1 = await addOrderProduct(form, code1);

    const title2 = await addOrderProduct(form, code2);

    await setOrderQuantity(form, code1, "1");

    await setOrderQuantity(form, code2, "2");

    const orderId = await saveNewOrder(page, form);

    await track(orderId);

    const edit = await openOrderEdit(page, orderId);

    await setOrderQuantity(edit, code1, "3");

    await setOrderQuantity(edit, code2, "5");

    await saveOrderEdit(edit);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    const items = await expandOrderItems(orders, orderId);

    await test.step("Sprawdzenie: expectOrderItems", async () =>
      expectOrderItems(items, [
        {
          code: code1,
          title: title1,
          quantity: "3",
        },
        {
          code: code2,
          title: title2,
          quantity: "5",
        },
      ]));

    await test.step('Sprawdzenie: zgodność wartości — await deleteOrder(page, orderId); oczekiwane: "DELETED"', async () => {
      expect(await deleteOrder(page, orderId)).toBe("DELETED");
    });
  });
});

// =============================================================================
// ORD-04 – ORD-08: kontrakt formularza i anulowanie
// =============================================================================

test("ORD-04: formularz Dodaj zamówienie zawiera komplet podstawowych kontrolek @school @order @form", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  /*
   * Filtry formularza.
   *
   * Nie sprawdzamy samych tekstów "Poziom" / "Klasy",
   * ponieważ te same nazwy występują również
   * jako nagłówki kolumn tabel produktów.
   */

  const subject = orderFilterCombobox(form, "subject");

  const level = orderFilterCombobox(form, "level");

  const classes = orderFilterCombobox(form, "classes");

  await test.step("Sprawdzenie: widoczność elementu — subject", async () =>
    expect(subject, "Filtr Przedmiot powinien być widoczny").toBeVisible());

  await test.step("Sprawdzenie: widoczność elementu — level", async () =>
    expect(level, "Filtr Poziom powinien być widoczny").toBeVisible());

  await test.step("Sprawdzenie: widoczność elementu — classes", async () =>
    expect(classes, "Filtr Klasy powinien być widoczny").toBeVisible());

  /*
   * Każdy select powinien mieć stan początkowy.
   */
  await test.step('Sprawdzenie: obecność tekstu w widoku — subject; oczekiwane: "Wybierz z listy"', async () =>
    expect(subject).toContainText("Wybierz z listy"));

  await test.step('Sprawdzenie: obecność tekstu w widoku — level; oczekiwane: "Wybierz z listy"', async () =>
    expect(level).toContainText("Wybierz z listy"));

  await test.step('Sprawdzenie: obecność tekstu w widoku — classes; oczekiwane: "Wybierz z listy"', async () =>
    expect(classes).toContainText("Wybierz z listy"));

  /*
   * Tytuł/Kod reprezentuje pole tekstowe.
   */
  const titleOrCode = form.getByPlaceholder("Wpisz", {
    exact: true,
  });

  await test.step("Sprawdzenie: widoczność elementu — titleOrCode", async () =>
    expect(titleOrCode, "Pole Tytuł/Kod powinno być widoczne").toBeVisible());

  await test.step("Sprawdzenie: dostępność działania — titleOrCode", async () =>
    expect(titleOrCode).toBeEnabled());
  await test.step('Sprawdzenie: wartość pola w widoku — titleOrCode; oczekiwane: ""', async () =>
    expect(titleOrCode).toHaveValue(""));

  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("button", { name: "Wyczyść filtry", exact: true, })', async () =>
    expect(
      form.getByRole("button", {
        name: "Wyczyść filtry",
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("button", { name: "Szukaj", exact: true, })', async () =>
    expect(
      form.getByRole("button", {
        name: "Szukaj",
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: widoczność elementu — form.getByText("Gratisy", { exact: true, })', async () =>
    expect(
      form.getByText("Gratisy", {
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: widoczność elementu — form.getByText("Zamówienie", { exact: true, })', async () =>
    expect(
      form.getByText("Zamówienie", {
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: widoczność elementu — form.getByText("Załączniki", { exact: true, })', async () =>
    expect(
      form.getByText("Załączniki", {
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("button", { name: "Dodaj plik", exact: true, })', async () =>
    expect(
      form.getByRole("button", {
        name: "Dodaj plik",
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: obecność tekstu w widoku — form; oczekiwane: "Dozwolone formaty: PDF, JPG, PNG"', async () =>
    expect(form).toContainText("Dozwolone formaty: PDF, JPG, PNG"));

  await test.step('Sprawdzenie: obecność tekstu w widoku — form; oczekiwane: "Maksymalny rozmiar pliku: 10 MB"', async () =>
    expect(form).toContainText("Maksymalny rozmiar pliku: 10 MB"));

  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("button", { name: "Anuluj", exact: true, })', async () =>
    expect(
      form.getByRole("button", {
        name: "Anuluj",
        exact: true,
      }),
    ).toBeVisible());

  await test.step('Sprawdzenie: widoczność elementu — form.getByRole("button", { name: "Zapisz", exact: true, })', async () =>
    expect(
      form.getByRole("button", {
        name: "Zapisz",
        exact: true,
      }),
    ).toBeVisible());

  await cancelOrderForm(form);
});

test("ORD-05: anulowanie pustego formularza nie tworzy zamówienia @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  await cancelOrderForm(form);

  await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => getOrderIds(page); oczekiwane: before", async () =>
    expect.poll(() => getOrderIds(page)).toEqual(before));
});

test("ORD-06: anulowanie po wyszukaniu nie tworzy zamówienia @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  await test.step("Sprawdzenie: liczba elementów w widoku — availableProductRow(form, ORDER_PRODUCTS.physics7.products[1].code); oczekiwane: 1", async () =>
    expect(availableProductRow(form, ORDER_PRODUCTS.physics7.products[1].code)).toHaveCount(1));

  await cancelOrderForm(form);

  await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => getOrderIds(page); oczekiwane: before", async () =>
    expect.poll(() => getOrderIds(page)).toEqual(before));
});

test("ORD-07: anulowanie po dodaniu produktu i ilości nie tworzy zamówienia @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  await setOrderQuantity(form, code, "3");

  await cancelOrderForm(form);

  await test.step("Sprawdzenie: zgodność całej struktury i wartości — () => getOrderIds(page); oczekiwane: before", async () =>
    expect.poll(() => getOrderIds(page)).toEqual(before));
});

test("ORD-08: ponowne otwarcie po anulowaniu zaczyna od czystego formularza @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  /*
   * =====================================================
   * 1. OTWIERAMY PIERWSZY FORMULARZ
   * =====================================================
   */

  const first = await openNewOrderForm(page);

  /*
   * Ustawiamy kilka wartości, żeby formularz
   * nie był pusty.
   *
   * Nie używamy tutaj filtra Klasy,
   * ponieważ nie jest on przedmiotem ORD-08.
   */
  await selectOrderSingleFilter(page, first, "subject", ORDER_PRODUCTS.physics7.subject);

  await selectOrderSingleFilter(page, first, "level", ORDER_PRODUCTS.physics7.level);

  /*
   * Wpisujemy frazę wyszukiwania.
   */
  await searchOrderProducts(first, ORDER_PRODUCTS.physics7.search);

  /*
   * Dodajemy produkt do zamówienia,
   * żeby zmienić również prawą tabelę.
   */
  await addOrderProductsFromCurrentResults(first, [ORDER_PRODUCTS.physics7.products[1].code]);

  /*
   * Kontrola stanu przed anulowaniem.
   */
  await test.step('Sprawdzenie: obecność tekstu w widoku — orderFilterCombobox(first, "subject"); oczekiwane: ORDER_PRODUCTS.physics7.subject', async () =>
    expect(orderFilterCombobox(first, "subject")).toContainText(ORDER_PRODUCTS.physics7.subject));

  await test.step('Sprawdzenie: obecność tekstu w widoku — orderFilterCombobox(first, "level"); oczekiwane: ORDER_PRODUCTS.physics7.level', async () =>
    expect(orderFilterCombobox(first, "level")).toContainText(ORDER_PRODUCTS.physics7.level));

  await test.step("Sprawdzenie: liczba elementów w widoku — selectedProductRows(first); oczekiwane: 1", async () =>
    expect(selectedProductRows(first)).toHaveCount(1));

  /*
   * =====================================================
   * 2. ANULUJEMY FORMULARZ
   * =====================================================
   */

  await cancelOrderForm(first);

  /*
   * =====================================================
   * 3. OTWIERAMY FORMULARZ PONOWNIE
   * =====================================================
   */

  const second = await openNewOrderForm(page);

  /*
   * Wszystkie filtry powinny wrócić
   * do wartości początkowych.
   *
   * expectFilterReset sprawdza:
   * - Przedmiot
   * - Poziom
   * - Klasy
   * - Tytuł/Kod
   */
  await test.step("Sprawdzenie: expectFilterReset", async () => expectFilterReset(second));

  /*
   * Nie może zostać produkt
   * z poprzedniego formularza.
   */
  await test.step("Sprawdzenie: liczba elementów w widoku — selectedProductRows(second); oczekiwane: 0", async () =>
    expect(selectedProductRows(second)).toHaveCount(0));

  /*
   * Nie mogą zostać załączniki.
   */
  await test.step('Sprawdzenie: obecność tekstu w widoku — second; oczekiwane: "Brak załączników"', async () =>
    expect(second).toContainText("Brak załączników"));

  await cancelOrderForm(second);
});

// =============================================================================
// ORD-09 – ORD-11: słowniki
// =============================================================================

test("ORD-09: lista Przedmiot zawiera oczekiwane pozycje @school @order @dictionary", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const options = await readOrderFilterOptions(page, form, "subject");

  await test.step("Sprawdzenie: zgodność całej struktury i wartości — options; oczekiwane: expect.arrayContaining([...ORDER_SUBJECT_OPTIONS])", async () => {
    expect(options).toEqual(expect.arrayContaining([...ORDER_SUBJECT_OPTIONS]));
  });

  await cancelOrderForm(form);
});

test("ORD-10: lista Poziom zawiera oczekiwane pozycje @school @order @dictionary", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const options = await readOrderFilterOptions(page, form, "level");

  await test.step("Sprawdzenie: zgodność całej struktury i wartości — options; oczekiwane: expect.arrayContaining([...ORDER_LEVEL_OPTIONS])", async () => {
    expect(options).toEqual(expect.arrayContaining([...ORDER_LEVEL_OPTIONS]));
  });

  await cancelOrderForm(form);
});

test("ORD-11: lista Klasy zawiera 0-8 i pozwala zaznaczyć kilka klas @school @order @dictionary", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const options = await readOrderFilterOptions(page, form, "classes");

  await test.step("Sprawdzenie: zgodność całej struktury i wartości — options; oczekiwane: expect.arrayContaining([...ORDER_CLASS_OPTIONS])", async () => {
    expect(options).toEqual(expect.arrayContaining([...ORDER_CLASS_OPTIONS]));
  });

  await selectOrderClasses(page, form, ["5", "7"]);

  const classes = orderFilterCombobox(form, "classes");

  await test.step('Sprawdzenie: obecność tekstu w widoku — classes; oczekiwane: "5"', async () =>
    expect(classes).toContainText("5"));
  await test.step('Sprawdzenie: obecność tekstu w widoku — classes; oczekiwane: "7"', async () =>
    expect(classes).toContainText("7"));

  await cancelOrderForm(form);
});

// =============================================================================
// ORD-12 – ORD-24: wyszukiwanie i filtry
// =============================================================================
