import { test, expect } from "./support/scenario";

import {
  addOrderProduct,
  attachmentByName,
  cancelOrderForm,
  getOrderIds,
  makeUpload,
  openNewOrderForm,
  openOrderEdit,
  openOrders,
  orderAttachmentIcon,
  orderAttachmentIndicator,
  orderRow,
  removeOrderAttachment,
  saveNewOrder,
  saveOrderEdit,
  savedOrderAttachments,
  searchOrderProducts,
  selectOrderSingleFilter,
  setOrderQuantity,
  uploadOrderAttachment,
  uploadOrderAttachmentExpectRejected,
} from "./support/order";

import { ORDER_PRODUCTS } from "./data/order-product-data";
import { prepareOrderSchool, withOrderCleanup, createSimpleOrder } from "./support/order-scenario";
import { documentFile } from "./support/order-documents";

test.describe.configure({
  mode: "parallel",
});

for (const file of [
  documentFile("jpg", 1, "ord-test.jpg"),
  documentFile("png", 1, "ord-test.png"),
  documentFile("pdf", 1, "ord-test.pdf"),
]) {
  const id = file.name.endsWith(".jpg")
    ? "ORD-48"
    : file.name.endsWith(".png")
      ? "ORD-49"
      : "ORD-50";

  test(`${id}: poprawny ${file.name.split(".").pop()!.toUpperCase()} można dodać jako załącznik @school @order @attachment`, async ({
    page,
    scenario: s,
  }) => {
    await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
      prepareOrderSchool(page, s));

    const form = await openNewOrderForm(page);

    await uploadOrderAttachment(page, form, file);

    await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, file.name)", async () =>
      expect(attachmentByName(form, file.name)).toBeVisible());

    await cancelOrderForm(form);
  });
}

test("ORD-51: można dodać kilka załączników do jednego zamówienia @school @order @attachment", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const first = makeUpload("ord-multi-1.jpg", "image/jpeg");

  const second = makeUpload("ord-multi-2.png", "image/png");

  await uploadOrderAttachment(page, form, first);

  await uploadOrderAttachment(page, form, second);

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, first.name)", async () =>
    expect(attachmentByName(form, first.name)).toBeVisible());

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, second.name)", async () =>
    expect(attachmentByName(form, second.name)).toBeVisible());

  await cancelOrderForm(form);
});

test("ORD-52: można usunąć jeden z kilku załączników @school @order @attachment", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const first = makeUpload("ord-remove-1.jpg", "image/jpeg");

  const second = makeUpload("ord-remove-2.png", "image/png");

  await uploadOrderAttachment(page, form, first);

  await uploadOrderAttachment(page, form, second);

  /*
   * Przed usunięciem oba pliki
   * powinny znajdować się na liście.
   */
  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, first.name)", async () =>
    expect(attachmentByName(form, first.name)).toBeVisible());

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, second.name)", async () =>
    expect(attachmentByName(form, second.name)).toBeVisible());

  /*
   * Usuwamy tylko pierwszy plik
   * i potwierdzamy operację przyciskiem Tak.
   */
  await removeOrderAttachment(page, form, first.name);

  /*
   * Pierwszy plik powinien zniknąć.
   */
  await test.step("Sprawdzenie: liczba elementów w widoku — attachmentByName(form, first.name); oczekiwane: 0", async () =>
    expect(attachmentByName(form, first.name)).toHaveCount(0));

  /*
   * Drugi plik nie może zostać usunięty
   * przy okazji.
   */
  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, second.name)", async () =>
    expect(attachmentByName(form, second.name)).toBeVisible());

  await cancelOrderForm(form);
});

test("ORD-53: po usunięciu wszystkich załączników lista jest pusta @school @order @attachment", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const first = makeUpload("ord-remove-all-1.jpg", "image/jpeg");

  const second = makeUpload("ord-remove-all-2.png", "image/png");

  await uploadOrderAttachment(page, form, first);

  await uploadOrderAttachment(page, form, second);

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, first.name)", async () =>
    expect(attachmentByName(form, first.name)).toBeVisible());

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, second.name)", async () =>
    expect(attachmentByName(form, second.name)).toBeVisible());

  /*
   * Każde usunięcie wymaga osobnego
   * potwierdzenia w dialogu.
   */
  await removeOrderAttachment(page, form, first.name);

  await removeOrderAttachment(page, form, second.name);

  await test.step("Sprawdzenie: liczba elementów w widoku — attachmentByName(form, first.name); oczekiwane: 0", async () =>
    expect(attachmentByName(form, first.name)).toHaveCount(0));

  await test.step("Sprawdzenie: liczba elementów w widoku — attachmentByName(form, second.name); oczekiwane: 0", async () =>
    expect(attachmentByName(form, second.name)).toHaveCount(0));

  await cancelOrderForm(form);
});

test("ORD-54: zmiana filtrów nie usuwa załącznika @school @order @attachment @filter", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-filter.jpg", "image/jpeg");

  await uploadOrderAttachment(page, form, file);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.physics7.level);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, file.name)", async () =>
    expect(attachmentByName(form, file.name)).toBeVisible());

  await cancelOrderForm(form);
});

test("ORD-55: dodanie produktu nie usuwa załącznika @school @order @attachment @product", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-product.jpg", "image/jpeg");

  await uploadOrderAttachment(page, form, file);

  await addOrderProduct(form, ORDER_PRODUCTS.physics7.products[1].code);

  await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, file.name)", async () =>
    expect(attachmentByName(form, file.name)).toBeVisible());

  await cancelOrderForm(form);
});

test("ORD-56: załącznik jest trwały po zapisaniu i ponownym otwarciu edycji zamówienia @school @order @attachment @persistence", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    await openOrders(page);

    const beforeIds = await getOrderIds(page);

    const form = await openNewOrderForm(page);

    const file = makeUpload("ord-persist.jpg", "image/jpeg");

    await uploadOrderAttachment(page, form, file);

    /*
     * Przed zapisem aplikacja pokazuje
     * jeszcze oryginalną nazwę pliku.
     */
    await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, file.name)", async () =>
      expect(attachmentByName(form, file.name)).toBeVisible());

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    const orderId = await saveNewOrder(page, form, beforeIds);

    await track(orderId);

    /*
     * Otwieramy zapisane zamówienie.
     */
    const edit = await openOrderEdit(page, orderId);

    /*
     * Po zapisie nazwa pliku jest zmieniana
     * przez system, dlatego nie szukamy już
     * "ord-persist.jpg".
     *
     * Sprawdzamy, czy istnieje dokładnie
     * jeden zapisany załącznik.
     */
    await test.step("Sprawdzenie: liczba elementów w widoku — savedOrderAttachments(edit); oczekiwane: 1", async () =>
      expect(
        savedOrderAttachments(edit),
        "Po ponownym otwarciu zamówienia powinien istnieć jeden zapisany załącznik",
      ).toHaveCount(1));

    await cancelOrderForm(edit);
  });
});

test("ORD-57: kilka załączników jest trwałych po zapisaniu zamówienia @school @order @attachment @persistence", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    await openOrders(page);

    const beforeIds = await getOrderIds(page);

    const form = await openNewOrderForm(page);

    const first = makeUpload("ord-persist-1.jpg", "image/jpeg");

    const second = makeUpload("ord-persist-2.png", "image/png");

    await uploadOrderAttachment(page, form, first);

    await uploadOrderAttachment(page, form, second);

    /*
     * Przed zapisem widzimy obie
     * oryginalne nazwy.
     */
    await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, first.name)", async () =>
      expect(attachmentByName(form, first.name)).toBeVisible());

    await test.step("Sprawdzenie: widoczność elementu — attachmentByName(form, second.name)", async () =>
      expect(attachmentByName(form, second.name)).toBeVisible());

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    const orderId = await saveNewOrder(page, form, beforeIds);

    await track(orderId);

    const edit = await openOrderEdit(page, orderId);

    /*
     * Po zapisie oba pliki mają już
     * systemowe nazwy.
     */
    await test.step("Sprawdzenie: liczba elementów w widoku — savedOrderAttachments(edit); oczekiwane: 2", async () =>
      expect(
        savedOrderAttachments(edit),
        "Po ponownym otwarciu zamówienia powinny istnieć dwa zapisane załączniki",
      ).toHaveCount(2));

    await cancelOrderForm(edit);
  });
});

test("ORD-58: anulowanie formularza z załącznikiem nie przenosi pliku do kolejnego formularza @school @order @attachment @cancel", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const first = await openNewOrderForm(page);

  const file = makeUpload("ord-cancel.jpg", "image/jpeg");

  await uploadOrderAttachment(page, first, file);

  await cancelOrderForm(first);

  const second = await openNewOrderForm(page);

  await test.step("Sprawdzenie: liczba elementów w widoku — attachmentByName(second, file.name); oczekiwane: 0", async () =>
    expect(attachmentByName(second, file.name)).toHaveCount(0));

  await test.step('Sprawdzenie: obecność tekstu w widoku — second; oczekiwane: "Brak załączników"', async () =>
    expect(second).toContainText("Brak załączników"));

  await cancelOrderForm(second);
});

for (const [id, file] of [
  ["ORD-59", makeUpload("ord-invalid.webp", "image/webp")],
  ["ORD-60", makeUpload("ord-invalid.txt", "text/plain")],
] as const) {
  test(`${id}: niedozwolony typ pliku ${file.name.split(".").pop()!.toUpperCase()} jest odrzucany @school @order @attachment @validation`, async ({
    page,
    scenario: s,
  }) => {
    await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
      prepareOrderSchool(page, s));

    const form = await openNewOrderForm(page);

    await uploadOrderAttachmentExpectRejected(page, form, file);

    await cancelOrderForm(form);
  });
}

test("ORD-61: plik większy niż 10 MB jest odrzucany @school @order @attachment @validation", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-too-large.jpg", "image/jpeg", 10 * 1024 * 1024 + 1);

  await uploadOrderAttachmentExpectRejected(page, form, file);

  await cancelOrderForm(form);
});

test("ORD-62: plik o rozmiarze dokładnie 10 MB jest akceptowany @school @order @attachment @boundary", async ({
  page,
  scenario: s,
}) => {
  await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-10mb.jpg", "image/jpeg", 10 * 1024 * 1024);

  await uploadOrderAttachment(page, form, file);

  await cancelOrderForm(form);
});

test("ORD-63: zamówienie z załącznikiem pokazuje ikonę dokumentu na liście @school @order @attachment @list", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    await openOrders(page);

    const beforeIds = await getOrderIds(page);

    const form = await openNewOrderForm(page);

    const file = makeUpload("ord-icon.jpg", "image/jpeg");

    await uploadOrderAttachment(page, form, file);

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    const orderId = await saveNewOrder(page, form, beforeIds);

    await track(orderId);

    /*
     * Otwieramy ponownie szkołę,
     * żeby sprawdzić faktyczny stan listy.
     */
    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    const row = orderRow(orders, orderId);

    await test.step("Sprawdzenie: liczba elementów w widoku — row; oczekiwane: 1", async () =>
      expect(row).toHaveCount(1));

    await test.step("Sprawdzenie: widoczność elementu — orderAttachmentIcon(orders, orderId)", async () =>
      expect(
        orderAttachmentIcon(orders, orderId),
        "Zamówienie z załącznikiem powinno mieć ikonę dokumentu",
      ).toBeVisible());
  });
});

test("ORD-64: zamówienie bez załącznika nie pokazuje ikony dokumentu @school @order @attachment @list @negative", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    const created = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code, "1");

    await track(created.orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    await test.step("Sprawdzenie: liczba elementów w widoku — orderRow(orders, created.orderId); oczekiwane: 1", async () =>
      expect(orderRow(orders, created.orderId)).toHaveCount(1));

    await test.step("Sprawdzenie: liczba elementów w widoku — orderAttachmentIndicator(orders, created.orderId); oczekiwane: 0", async () =>
      expect(
        orderAttachmentIndicator(orders, created.orderId),
        "Zamówienie bez załącznika nie powinno mieć ikony dokumentu",
      ).toHaveCount(0));
  });
});

test("ORD-65: po usunięciu ostatniego załącznika ikona dokumentu znika @school @order @attachment @edit @list", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    await openOrders(page);

    const beforeIds = await getOrderIds(page);

    const form = await openNewOrderForm(page);

    const file = makeUpload("ord-remove-icon.jpg", "image/jpeg");

    await uploadOrderAttachment(page, form, file);

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    const orderId = await saveNewOrder(page, form, beforeIds);

    await track(orderId);

    /*
     * Najpierw potwierdzamy,
     * że ikona faktycznie istnieje.
     */
    await s.app.openPanel("school", school.id);

    let orders = await openOrders(page);

    await test.step("Sprawdzenie: liczba elementów w widoku — orderAttachmentIndicator(orders, orderId); oczekiwane: 1", async () =>
      expect(orderAttachmentIndicator(orders, orderId)).toHaveCount(1));

    /*
     * Otwieramy edycję.
     */
    const edit = await openOrderEdit(page, orderId);

    /*
     * Po zapisie Octopus pokazuje systemową
     * nazwę załącznika.
     *
     * Pobieramy faktycznie widoczną nazwę.
     */
    const attachments = savedOrderAttachments(edit);

    await test.step("Sprawdzenie: liczba elementów w widoku — attachments; oczekiwane: 1", async () =>
      expect(attachments).toHaveCount(1));

    const savedFileName = (await attachments.first().innerText()).trim();

    await test.step('Sprawdzenie: negacja — zgodność wartości — savedFileName; oczekiwane: ""', async () => {
      expect(savedFileName).not.toBe("");
    });

    /*
     * Usuwamy ostatni istniejący załącznik.
     */
    await removeOrderAttachment(page, edit, savedFileName);

    await saveOrderEdit(edit);

    /*
     * Ponowne otwarcie listy.
     */
    await s.app.openPanel("school", school.id);

    orders = await openOrders(page);

    await test.step("Sprawdzenie: liczba elementów w widoku — orderAttachmentIndicator(orders, orderId); oczekiwane: 0", async () =>
      expect(
        orderAttachmentIndicator(orders, orderId),
        "Po usunięciu ostatniego załącznika ikona dokumentu powinna zniknąć",
      ).toHaveCount(0));
  });
});

test("ORD-66: kilka załączników daje pojedynczą ikonę dokumentu na liście @school @order @attachment @list", async ({
  page,
  scenario: s,
}) => {
  const school = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
    prepareOrderSchool(page, s));

  await withOrderCleanup(page, s, school, async (track) => {
    await openOrders(page);

    const beforeIds = await getOrderIds(page);

    const form = await openNewOrderForm(page);

    const first = makeUpload("ord-icon-multi-1.jpg", "image/jpeg");

    const second = makeUpload("ord-icon-multi-2.png", "image/png");

    await uploadOrderAttachment(page, form, first);

    await uploadOrderAttachment(page, form, second);

    const code = ORDER_PRODUCTS.physics7.products[1].code;

    await addOrderProduct(form, code);

    await setOrderQuantity(form, code, "1");

    const orderId = await saveNewOrder(page, form, beforeIds);

    await track(orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    /*
     * Niezależnie od liczby plików
     * lista pokazuje jeden wskaźnik,
     * że zamówienie posiada załączniki.
     */
    await test.step("Sprawdzenie: liczba elementów w widoku — orderAttachmentIndicator(orders, orderId); oczekiwane: 1", async () =>
      expect(
        orderAttachmentIndicator(orders, orderId),
        "Kilka załączników powinno być reprezentowane pojedynczą ikoną dokumentu",
      ).toHaveCount(1));

    await test.step("Sprawdzenie: widoczność elementu — orderAttachmentIndicator(orders, orderId)", async () =>
      expect(orderAttachmentIndicator(orders, orderId)).toBeVisible());
  });
});
