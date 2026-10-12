import { test, expect } from "./support/scenario";

import {
  addOrderProduct,
  cancelOrderForm,
  deleteOrder,
  editOrderQuantity,
  expandOrderItems,
  expectOrderFilterInvalid,
  expectOrderItems,
  getOrderIds,
  openNewOrderForm,
  openOrders,
  orderQuantityInput,
  orderRow,
  ordersPanel,
  saveNewOrder,
  saveNewOrderWithRepeatedClick,
  setOrderQuantity,
} from "./support/order";

import { ORDER_PRODUCTS } from "./data/order-product-data";
import { prepareOrderSchool, withOrderCleanup, createSimpleOrder } from "./support/order-scenario";

test.describe.configure({
  mode: "parallel",
});

test("ORD-33: ilość 1 jest zachowywana w edytorze @school @order @quantity", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  await setOrderQuantity(form, code, "1");

  await expect(orderQuantityInput(form, code)).toHaveValue("1");

  await cancelOrderForm(form);
});

test("ORD-34: różne produkty zachowują niezależne ilości @school @order @quantity", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code1 = ORDER_PRODUCTS.physics7.products[1].code;
  const code2 = ORDER_PRODUCTS.polish5.products[0].code;

  await addOrderProduct(form, code1);
  await addOrderProduct(form, code2);

  await setOrderQuantity(form, code1, "2");

  await setOrderQuantity(form, code2, "5");

  await expect(orderQuantityInput(form, code1)).toHaveValue("2");

  await expect(orderQuantityInput(form, code2)).toHaveValue("5");

  await cancelOrderForm(form);
});

test("ORD-35: ostatnia zmiana ilości przed zapisem jest używana @school @order @quantity", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const code = ORDER_PRODUCTS.physics7.products[1].code;

    const form = await openNewOrderForm(page);

    const title = await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    await setOrderQuantity(form, code, "3");

    const orderId = await saveNewOrder(page, form);

    await track(orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    const items = await expandOrderItems(orders, orderId);

    await expectOrderItems(items, [
      {
        code,
        title,
        quantity: "3",
      },
    ]);
  });
});

test("ORD-36: Tab kończy edycję ilości w AG Grid @school @order @quantity", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  const input = await editOrderQuantity(form, code, "4");

  await expect(input).toHaveValue("4");
  await expect(input).not.toBeFocused();

  await cancelOrderForm(form);
});

test("ORD-37: wpisanie 0 normalizuje ilość do 10 @school @order @quantity @boundary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  const input = await editOrderQuantity(form, code, "0");

  await expect(input).toHaveValue("10");

  await cancelOrderForm(form);
});

test("ORD-38: wartość ujemna nie jest akceptowana @school @order @quantity @boundary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  const input = await editOrderQuantity(form, code, "-1");

  await expect(input).not.toHaveValue("-1");

  await cancelOrderForm(form);
});

test("ORD-39: wyczyszczenie pola Ilość automatycznie przywraca wartość @school @order @quantity @boundary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  const input = orderQuantityInput(form, code);

  await expect(input).toBeVisible();

  await input.click();
  await input.fill("");

  /*
   * Dopiero opuszczenie edytora kończy edycję
   * i uruchamia automatyczne ustawienie ilości.
   */
  await input.press("Tab");

  await expect(input, "Po wyczyszczeniu ilość powinna automatycznie wrócić do 10").toHaveValue(
    "10",
  );

  await cancelOrderForm(form);
});

test("ORD-40: pusty formularz nie zapisuje zamówienia i oznacza Przedmiot jako niepoprawny @school @order @validation", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toBeVisible();

  await expectOrderFilterInvalid(form, "subject");

  await expect.poll(() => getOrderIds(page)).toEqual(before);

  await cancelOrderForm(form);
});

test("ORD-41: zamówienie można zapisać bez wybranego Przedmiotu, jeśli produkt został dodany @school @order @positive", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const form = await openNewOrderForm(page);

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    const title = await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    /*
     * Celowo NIE wybieramy filtra Przedmiot.
     *
     * Produkt został już dodany do sekcji Zamówienie,
     * więc filtr wyszukiwania nie jest wymagany
     * do utworzenia zamówienia.
     */
    const orderId = await saveNewOrder(page, form);

    await track(orderId);

    expect(orderId).toMatch(/^\d+$/);

    /*
     * Weryfikujemy, że zapisany został
     * właściwy produkt i ilość.
     */
    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    const items = await expandOrderItems(orders, orderId);

    await expectOrderItems(items, [
      {
        code,
        title,
        quantity: "1",
      },
    ]);
  });
});

// =============================================================================
// ORD-42 – ORD-47: zapis i integralność
// =============================================================================

test("ORD-42: dwa szybkie kliknięcia Zapisz z krótkim odstępem tworzą tylko jedno zamówienie @school @order @duplicate", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    /*
     * Stan początkowy pobieramy PRZED
     * otwarciem formularza.
     *
     * Dzięki temu mamy kompletną listę
     * istniejących zamówień.
     */
    await openOrders(page);

    const beforeIds = await getOrderIds(page);

    const form = await openNewOrderForm(page);

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    /*
     * Funkcja zwraca WSZYSTKIE nowe ID,
     * a nie tylko jedno.
     *
     * Jeżeli aplikacja błędnie utworzy
     * dwa zamówienia, oba zostaną
     * przekazane do cleanupu.
     */
    const createdOrderIds = await saveNewOrderWithRepeatedClick(page, form, beforeIds, 100);

    /*
     * Najpierw rejestrujemy wszystkie
     * utworzone zamówienia do cleanupu.
     *
     * Dopiero później wykonujemy asercję.
     */
    for (const orderId of createdOrderIds) {
      await track(orderId);
    }

    for (const orderId of createdOrderIds) {
      expect(orderId).toMatch(/^\d+$/);
    }

    /*
     * Właściwa asercja ORD-42.
     */
    expect(
      createdOrderIds,
      "Dwa szybkie kliknięcia Zapisz powinny utworzyć dokładnie jedno zamówienie",
    ).toHaveLength(1);
  });
});

test("ORD-43: dwa kolejne zamówienia dostają różne ID @school @order @identity", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const first = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code);

    await track(first.orderId);

    const second = await createSimpleOrder(page, ORDER_PRODUCTS.polish5.products[0].code);

    await track(second.orderId);

    /*
     * Oba zamówienia powinny mieć
     * własne, numeryczne ID.
     */
    expect(first.orderId).toMatch(/^\d+$/);

    expect(second.orderId).toMatch(/^\d+$/);

    /*
     * Najważniejsza asercja ORD-43.
     */
    expect(first.orderId).not.toBe(second.orderId);

    /*
     * Niczego tutaj nie usuwamy.
     *
     * withOrderCleanup() ma zapisane oba ID
     * i usunie je w finally:
     *
     * second.orderId
     * first.orderId
     */
  });
});

test("ORD-44: usunięcie pierwszego z dwóch zamówień nie usuwa drugiego @school @order @isolation", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track, markCleaned) => {
    const first = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code);

    await track(first.orderId);

    const second = await createSimpleOrder(page, ORDER_PRODUCTS.polish5.products[0].code);

    await track(second.orderId);

    /*
     * Usuwamy pierwsze zamówienie
     * jako część właściwego scenariusza.
     */
    const deleteStatus = await deleteOrder(page, first.orderId);

    expect(deleteStatus).toBe("DELETED");

    /*
     * Informujemy wspólny cleanup,
     * że tego ID nie trzeba już usuwać.
     */
    await markCleaned(first.orderId);

    /*
     * Drugie zamówienie nadal musi istnieć.
     */
    const orders = await openOrders(page);

    await expect(
      orderRow(orders, second.orderId),
      `Usunięcie ${first.orderId} nie powinno usunąć ${second.orderId}`,
    ).toHaveCount(1);

    /*
     * second.orderId pozostaje w track(),
     * więc zostanie automatycznie usunięte
     * przez finally.
     */
  });
});

test("ORD-45: zamówienie utworzone dla szkoły A nie pojawia się w szkole B @school @order @isolation", async ({
  page,
  scenario: s,
}) => {
  const primary = await prepareOrderSchool(page, s, "primary");

  const secondary = await prepareOrderSchool(page, s, "secondary");

  await s.app.openPanel("school", primary.id);

  await withOrderCleanup(page, s, primary, async (track) => {
    const created = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code);

    await track(created.orderId);

    await s.app.openPanel("school", secondary.id);

    const secondaryOrders = await openOrders(page);

    await expect(orderRow(secondaryOrders, created.orderId)).toHaveCount(0);
  });
});

test("ORD-46: reload zachowuje ID, produkt i ilość zamówienia @school @order @persistence", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const created = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code, "6");

    await track(created.orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    await expect(orderRow(orders, created.orderId)).toHaveCount(1);

    const items = await expandOrderItems(orders, created.orderId);

    await expectOrderItems(items, [
      {
        code: ORDER_PRODUCTS.physics7.products[1].code,
        title: created.title,
        quantity: "6",
      },
    ]);
  });
});

test("ORD-47: zapisane zamówienie ma numeryczne ID i widoczny wiersz na liście @school @order @list", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const created = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code);

    await track(created.orderId);

    expect(created.orderId).toMatch(/^\d+$/);

    const orders = ordersPanel(page);

    const row = orderRow(orders, created.orderId);

    await expect(row).toHaveCount(1);

    await expect(row.getByRole("cell")).not.toHaveCount(0);
  });
});

// =============================================================================
// ORD-48 – ORD-62: załączniki
// =============================================================================
