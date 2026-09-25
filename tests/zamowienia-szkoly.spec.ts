import { test, expect, type Scenario } from "./support/scenario";

import {
  addOrderProduct,
  addOrderProductsFromCurrentResults,
  attachmentByName,
  availableProductRow,
  availableProductRows,
  cancelOrderForm,
  clearOrderFilters,
  clearSelectedOrderProducts,
  deleteOrder,
  editOrderQuantity,
  expandOrderItems,
  expectOrderFilterInvalid,
  expectOrderItems,
  getOrderIds,
  makeUpload,
  moveSelectedProductsLeft,
  openNewOrderForm,
  openOrderEdit,
  openOrders,
  orderAttachmentIcon,
  orderAttachmentIndicator,
  orderFilterCombobox,
  orderQuantityInput,
  orderRow,
  ordersPanel,
  readOrderFilterOptions,
  removeOrderAttachment,
  saveNewOrder,
  saveNewOrderWithRepeatedClick,
  saveOrderEdit,
  savedOrderAttachments,
  searchOrderProducts,
  selectAvailableProduct,
  selectOrderClasses,
  selectOrderSingleFilter,
  selectSelectedProduct,
  selectedProductRow,
  selectedProductRows,
  setOrderQuantity,
  uploadOrderAttachment,
  uploadOrderAttachmentExpectRejected,
} from "./support/order";

import { ensureOrderTestSchool, type OrderTestSchool } from "./support/order-school";

import {
  ORDER_CLASS_OPTIONS,
  ORDER_LEVEL_OPTIONS,
  ORDER_PRODUCTS,
  ORDER_SUBJECT_OPTIONS,
} from "./data/order-product-data";

test.describe.configure({
  mode: "parallel",
});

type TrackOrder = (orderId: string) => Promise<void>;

type MarkOrderCleaned = (orderId: string) => Promise<void>;

async function prepareOrderSchool(
  page: Parameters<typeof ensureOrderTestSchool>[0],
  scenario: Scenario,
  key: "primary" | "secondary" = "primary",
) {
  const school = await ensureOrderTestSchool(page, scenario.app, key);

  await scenario.record(key === "primary" ? "orderSchoolId" : "orderSecondarySchoolId", school.id);

  await scenario.record(
    key === "primary" ? "orderSchoolName" : "orderSecondarySchoolName",
    school.name,
  );

  return school;
}

async function withOrderCleanup(
  page: Parameters<typeof openOrders>[0],
  scenario: Scenario,
  school: OrderTestSchool,
  body: (track: TrackOrder, markCleaned: MarkOrderCleaned) => Promise<void>,
) {
  const createdOrderIds: string[] = [];

  const track: TrackOrder = async (orderId) => {
    if (!createdOrderIds.includes(orderId)) {
      createdOrderIds.push(orderId);
    }

    await scenario.record(`orderId_${createdOrderIds.indexOf(orderId) + 1}`, orderId);
  };

  /*
   * Używamy tego, gdy zamówienie zostało
   * świadomie usunięte już podczas testu.
   *
   * Dzięki temu finally nie próbuje
   * usuwać go drugi raz.
   */
  const markCleaned: MarkOrderCleaned = async (orderId) => {
    const index = createdOrderIds.indexOf(orderId);

    if (index !== -1) {
      createdOrderIds.splice(index, 1);
    }

    await scenario.record(`orderCleanup_${orderId}`, "DELETED_IN_TEST");
  };

  let scenarioError: unknown;
  const cleanupErrors: unknown[] = [];

  try {
    await body(track, markCleaned);
  } catch (error) {
    scenarioError = error;
    throw error;
  } finally {
    for (const orderId of [...createdOrderIds].reverse()) {
      try {
        await scenario.app.openPanel("school", school.id);

        const status = await deleteOrder(page, orderId);

        await scenario.record(`orderCleanup_${orderId}`, status);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);

        await scenario.record(`orderCleanup_${orderId}`, "FAILED");

        console.error(`Cleanup zamówienia ${orderId} nie powiódł się:`, cleanupError);
      }
    }

    if (!scenarioError && cleanupErrors.length > 0) {
      throw cleanupErrors[0];
    }
  }
}

async function createSimpleOrder(
  page: Parameters<typeof openNewOrderForm>[0],
  code: string,
  quantity = "1",
) {
  /*
   * Najpierw otwieramy listę zamówień,
   * gdy NIE MA jeszcze dialogu.
   */
  await openOrders(page);

  /*
   * Czekamy aż ewentualny spinner zniknie.
   */
  await page
    .locator("#spinner.backdrop")
    .waitFor({
      state: "hidden",
      timeout: 20_000,
    })
    .catch(() => undefined);

  /*
   * To jest prawdziwy stan listy PRZED
   * utworzeniem kolejnego zamówienia.
   */
  const beforeIds = await getOrderIds(page);

  /*
   * Dopiero teraz otwieramy formularz.
   */
  const form = await openNewOrderForm(page);

  const title = await addOrderProduct(form, code);

  await setOrderQuantity(form, code, quantity);

  /*
   * Przekazujemy stan sprzed otwarcia formularza.
   */
  const orderId = await saveNewOrder(page, form, beforeIds);

  return {
    orderId,
    title,
  };
}

async function expectFilterReset(form: Awaited<ReturnType<typeof openNewOrderForm>>) {
  await expect(orderFilterCombobox(form, "subject")).toContainText("Wybierz z listy");

  await expect(orderFilterCombobox(form, "level")).toContainText("Wybierz z listy");

  await expect(orderFilterCombobox(form, "classes")).toContainText("Wybierz z listy");

  await expect(
    form.getByPlaceholder("Wpisz", {
      exact: true,
    }),
  ).toHaveValue("");
}

// =============================================================================
// ORD-01 – ORD-03: istniejący rdzeń regresji
// =============================================================================

test("ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu @school @order @smoke", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const code = ORDER_PRODUCTS.physics7.products[1].code;

    const { orderId, title } = await createSimpleOrder(page, code, "1");

    await track(orderId);

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

test("ORD-02: zamówienie z dwoma produktami zachowuje produkty i ilości @school @order @positive", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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

    await expectOrderItems(items, [
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
    ]);
  });
});

test("ORD-03: edycja ilości dwóch produktów i usunięcie zamówienia @school @order @edit", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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

    await expectOrderItems(items, [
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
    ]);

    expect(await deleteOrder(page, orderId)).toBe("DELETED");
  });
});

// =============================================================================
// ORD-04 – ORD-08: kontrakt formularza i anulowanie
// =============================================================================

test("ORD-04: formularz Dodaj zamówienie zawiera komplet podstawowych kontrolek @school @order @form", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

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

  await expect(subject, "Filtr Przedmiot powinien być widoczny").toBeVisible();

  await expect(level, "Filtr Poziom powinien być widoczny").toBeVisible();

  await expect(classes, "Filtr Klasy powinien być widoczny").toBeVisible();

  /*
   * Każdy select powinien mieć stan początkowy.
   */
  await expect(subject).toContainText("Wybierz z listy");

  await expect(level).toContainText("Wybierz z listy");

  await expect(classes).toContainText("Wybierz z listy");

  /*
   * Tytuł/Kod reprezentuje pole tekstowe.
   */
  const titleOrCode = form.getByPlaceholder("Wpisz", {
    exact: true,
  });

  await expect(titleOrCode, "Pole Tytuł/Kod powinno być widoczne").toBeVisible();

  await expect(titleOrCode).toBeEnabled();
  await expect(titleOrCode).toHaveValue("");

  await expect(
    form.getByRole("button", {
      name: "Wyczyść filtry",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    form.getByRole("button", {
      name: "Szukaj",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    form.getByText("Gratisy", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    form.getByText("Zamówienie", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    form.getByText("Załączniki", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    form.getByRole("button", {
      name: "Dodaj plik",
      exact: true,
    }),
  ).toBeVisible();

  await expect(form).toContainText("Dozwolone formaty: PDF, JPG, PNG");

  await expect(form).toContainText("Maksymalny rozmiar pliku: 10 MB");

  await expect(
    form.getByRole("button", {
      name: "Anuluj",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    form.getByRole("button", {
      name: "Zapisz",
      exact: true,
    }),
  ).toBeVisible();

  await cancelOrderForm(form);
});

test("ORD-05: anulowanie pustego formularza nie tworzy zamówienia @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  await cancelOrderForm(form);

  await expect.poll(() => getOrderIds(page)).toEqual(before);
});

test("ORD-06: anulowanie po wyszukaniu nie tworzy zamówienia @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  await expect(availableProductRow(form, ORDER_PRODUCTS.physics7.products[1].code)).toHaveCount(1);

  await cancelOrderForm(form);

  await expect.poll(() => getOrderIds(page)).toEqual(before);
});

test("ORD-07: anulowanie po dodaniu produktu i ilości nie tworzy zamówienia @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  await openOrders(page);

  const before = await getOrderIds(page);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  await setOrderQuantity(form, code, "3");

  await cancelOrderForm(form);

  await expect.poll(() => getOrderIds(page)).toEqual(before);
});

test("ORD-08: ponowne otwarcie po anulowaniu zaczyna od czystego formularza @school @order @cancel", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

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
  await expect(orderFilterCombobox(first, "subject")).toContainText(
    ORDER_PRODUCTS.physics7.subject,
  );

  await expect(orderFilterCombobox(first, "level")).toContainText(ORDER_PRODUCTS.physics7.level);

  await expect(selectedProductRows(first)).toHaveCount(1);

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
  await expectFilterReset(second);

  /*
   * Nie może zostać produkt
   * z poprzedniego formularza.
   */
  await expect(selectedProductRows(second)).toHaveCount(0);

  /*
   * Nie mogą zostać załączniki.
   */
  await expect(second).toContainText("Brak załączników");

  await cancelOrderForm(second);
});

// =============================================================================
// ORD-09 – ORD-11: słowniki
// =============================================================================

test("ORD-09: lista Przedmiot zawiera oczekiwane pozycje @school @order @dictionary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const options = await readOrderFilterOptions(page, form, "subject");

  expect(options).toEqual(expect.arrayContaining([...ORDER_SUBJECT_OPTIONS]));

  await cancelOrderForm(form);
});

test("ORD-10: lista Poziom zawiera oczekiwane pozycje @school @order @dictionary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const options = await readOrderFilterOptions(page, form, "level");

  expect(options).toEqual(expect.arrayContaining([...ORDER_LEVEL_OPTIONS]));

  await cancelOrderForm(form);
});

test("ORD-11: lista Klasy zawiera 0-8 i pozwala zaznaczyć kilka klas @school @order @dictionary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const options = await readOrderFilterOptions(page, form, "classes");

  expect(options).toEqual(expect.arrayContaining([...ORDER_CLASS_OPTIONS]));

  await selectOrderClasses(page, form, ["5", "7"]);

  const classes = orderFilterCombobox(form, "classes");

  await expect(classes).toContainText("5");
  await expect(classes).toContainText("7");

  await cancelOrderForm(form);
});

// =============================================================================
// ORD-12 – ORD-24: wyszukiwanie i filtry
// =============================================================================

test("ORD-12: wyszukiwanie po dokładnym kodzie zwraca właściwy produkt @school @order @search", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const product = ORDER_PRODUCTS.physics7.products[0];

  await searchOrderProducts(form, product.code);

  const row = availableProductRow(form, product.code);

  await expect(row).toHaveCount(1);
  await expect(row).toContainText(product.title);

  await cancelOrderForm(form);
});

test("ORD-13: wyszukiwanie po fragmencie kodu zwraca oba produkty fizyki 7 @school @order @search", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  for (const product of ORDER_PRODUCTS.physics7.products) {
    await expect(availableProductRow(form, product.code)).toHaveCount(1);
  }

  await cancelOrderForm(form);
});

test("ORD-14: filtr Przedmiot ogranicza wyniki do fizyki @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await searchOrderProducts(form);

  const rows = availableProductRows(form);

  await expect(rows.first()).toBeVisible();

  for (const row of await rows.all()) {
    await expect(row.getByRole("gridcell").nth(4)).toHaveText(ORDER_PRODUCTS.physics7.subjectCode);
  }

  await cancelOrderForm(form);
});

test("ORD-15: filtr Poziom ogranicza wyniki do szkoły podstawowej @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.physics7.level);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  const rows = availableProductRows(form);

  await expect(rows.first()).toBeVisible();

  for (const row of await rows.all()) {
    await expect(row.getByRole("gridcell").nth(1)).toHaveText(ORDER_PRODUCTS.physics7.levelCode);
  }

  await cancelOrderForm(form);
});

test("ORD-16: filtr Klasa zwraca produkty klasy 7 @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderClasses(page, form, [ORDER_PRODUCTS.physics7.class]);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  const rows = availableProductRows(form);

  await expect(rows.first()).toBeVisible();

  for (const row of await rows.all()) {
    await expect(row.getByRole("gridcell").nth(2)).toContainText(ORDER_PRODUCTS.physics7.class);
  }

  await cancelOrderForm(form);
});

test("ORD-17: filtr Klasy pozwala wyszukiwać dla kilku klas jednocześnie @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderClasses(page, form, ["5", "7"]);

  await searchOrderProducts(form, "p");

  const rows = availableProductRows(form);

  await expect(rows.first()).toBeVisible();

  for (const row of await rows.all()) {
    const classText = (await row.getByRole("gridcell").nth(2).innerText()).trim();

    expect(classText.includes("5") || classText.includes("7")).toBeTruthy();
  }

  await cancelOrderForm(form);
});

test("ORD-18: Przedmiot i Poziom działają razem @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.physics7.level);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  for (const product of ORDER_PRODUCTS.physics7.products) {
    await expect(availableProductRow(form, product.code)).toHaveCount(1);
  }

  await cancelOrderForm(form);
});

test("ORD-19: Przedmiot, Poziom i Klasa działają razem @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.physics7.level);

  await selectOrderClasses(page, form, [ORDER_PRODUCTS.physics7.class]);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  for (const product of ORDER_PRODUCTS.physics7.products) {
    await expect(availableProductRow(form, product.code)).toHaveCount(1);
  }

  await cancelOrderForm(form);
});

test("ORD-20: wszystkie filtry razem zwracają oczekiwane produkty @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.polish5.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.polish5.level);

  /*
   * Po ustawieniu Przedmiotu i Poziomu
   * odczytujemy aktualnie dostępne klasy.
   *
   * Dzięki temu, jeżeli aplikacja dynamicznie
   * ogranicza słownik klas, błąd pokaże nam
   * faktyczny stan zamiast wisieć 20 sekund
   * w selectOrderClasses().
   */
  const availableClasses = await readOrderFilterOptions(page, form, "classes");

  expect(
    availableClasses,
    `Dla ${ORDER_PRODUCTS.polish5.subject} / ${ORDER_PRODUCTS.polish5.level} powinna być dostępna klasa ${ORDER_PRODUCTS.polish5.class}. Dostępne klasy: ${availableClasses.join(", ")}`,
  ).toContain(ORDER_PRODUCTS.polish5.class);

  await selectOrderClasses(page, form, [ORDER_PRODUCTS.polish5.class]);

  await searchOrderProducts(form, ORDER_PRODUCTS.polish5.search);

  for (const product of ORDER_PRODUCTS.polish5.products) {
    await expect(availableProductRow(form, product.code)).toHaveCount(1);
  }

  await cancelOrderForm(form);
});

test("ORD-21: nieistniejący kod daje pustą listę wyników @school @order @search @negative", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await searchOrderProducts(form, `NO_SUCH_ORDER_PRODUCT_${Date.now()}`);

  await expect(availableProductRows(form)).toHaveCount(0);

  await cancelOrderForm(form);
});

test("ORD-22: drugie wyszukanie zastępuje wyniki pierwszego @school @order @search", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  await expect(availableProductRow(form, ORDER_PRODUCTS.physics7.products[1].code)).toHaveCount(1);

  await searchOrderProducts(form, ORDER_PRODUCTS.polish5.search);

  await expect(availableProductRow(form, ORDER_PRODUCTS.polish5.products[0].code)).toHaveCount(1);

  await expect(availableProductRow(form, ORDER_PRODUCTS.physics7.products[1].code)).toHaveCount(0);

  await cancelOrderForm(form);
});

test("ORD-23: Wyczyść filtry resetuje wszystkie kryteria @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.physics7.level);

  await selectOrderClasses(page, form, [ORDER_PRODUCTS.physics7.class]);

  await form
    .getByPlaceholder("Wpisz", {
      exact: true,
    })
    .fill("f7p");

  await clearOrderFilters(form);

  await expectFilterReset(form);

  await cancelOrderForm(form);
});

test("ORD-24: wyszukiwanie działa poprawnie po wyczyszczeniu filtrów @school @order @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await form
    .getByPlaceholder("Wpisz", {
      exact: true,
    })
    .fill("nieistnieje");

  await clearOrderFilters(form);

  await searchOrderProducts(form, ORDER_PRODUCTS.polish5.search);

  await expect(availableProductRow(form, ORDER_PRODUCTS.polish5.products[0].code)).toHaveCount(1);

  await cancelOrderForm(form);
});

// =============================================================================
// ORD-25 – ORD-32: przenoszenie produktów
// =============================================================================

test("ORD-25: strzałka w prawo przenosi wybrany produkt do Zamówienia @school @order @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await searchOrderProducts(form, code);

  await addOrderProductsFromCurrentResults(form, [code]);

  await expect(selectedProductRow(form, code)).toHaveCount(1);

  await cancelOrderForm(form);
});

test("ORD-26: kilka produktów można przenieść do Zamówienia jednym ruchem @school @order @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  const codes = ORDER_PRODUCTS.physics7.products.map((product) => product.code);

  await addOrderProductsFromCurrentResults(form, codes);

  for (const code of codes) {
    await expect(selectedProductRow(form, code)).toHaveCount(1);
  }

  await cancelOrderForm(form);
});

test("ORD-27: strzałka w lewo cofa zaznaczony produkt @school @order @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  await selectSelectedProduct(form, code);

  await moveSelectedProductsLeft(form);

  await expect(selectedProductRow(form, code)).toHaveCount(0);

  await searchOrderProducts(form, code);

  await expect(availableProductRow(form, code)).toHaveCount(1);

  await cancelOrderForm(form);
});

test("ORD-28: kosz usuwa wszystkie produkty z tworzonego zamówienia @school @order @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  await addOrderProduct(form, ORDER_PRODUCTS.physics7.products[1].code);

  await addOrderProduct(form, ORDER_PRODUCTS.polish5.products[0].code);

  await expect(selectedProductRows(form)).toHaveCount(2);

  await clearSelectedOrderProducts(form);

  await expect(selectedProductRows(form)).toHaveCount(0);

  await cancelOrderForm(form);
});

test("ORD-29: produkt już dodany do Zamówienia nie pojawia się ponownie w Gratisach @school @order @duplicate", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const code = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, code);

  await searchOrderProducts(form, code);

  await expect(availableProductRow(form, code)).toHaveCount(0);

  await expect(selectedProductRow(form, code)).toHaveCount(1);

  await cancelOrderForm(form);
});

test("ORD-30: wyszukanie kolejnego produktu nie usuwa wcześniej wybranego @school @order @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const selectedCode = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, selectedCode);

  await searchOrderProducts(form, ORDER_PRODUCTS.polish5.search);

  await expect(selectedProductRow(form, selectedCode)).toHaveCount(1);

  await cancelOrderForm(form);
});

test("ORD-31: zmiana filtrów nie usuwa produktów z Zamówienia @school @order @product @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const selectedCode = ORDER_PRODUCTS.physics7.products[1].code;

  await addOrderProduct(form, selectedCode);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.polish5.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.polish5.level);

  await expect(selectedProductRow(form, selectedCode)).toHaveCount(1);

  await cancelOrderForm(form);
});

test("ORD-32: dane produktu są spójne po przeniesieniu do Zamówienia @school @order @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const product = ORDER_PRODUCTS.physics7.products[1];

  await searchOrderProducts(form, product.code);

  const source = availableProductRow(form, product.code);

  await expect(source).toHaveCount(1);

  /*
   * Kolumny tabeli Gratisy:
   *
   * 0 - akcja / checkbox
   * 1 - Poziom
   * 2 - Klasa
   * 3 - Tytuł
   * 4 - Przedmiot
   *
   * Kod produktu weryfikujemy przez locator wiersza.
   */

  const sourceCells = source.getByRole("gridcell");

  await expect(
    sourceCells.nth(1),
    "Produkt powinien mieć właściwy poziom przed przeniesieniem",
  ).toHaveText(ORDER_PRODUCTS.physics7.levelCode);

  await expect(
    sourceCells.nth(2),
    "Produkt powinien mieć właściwą klasę przed przeniesieniem",
  ).toContainText(ORDER_PRODUCTS.physics7.class);

  await expect(
    sourceCells.nth(3),
    "Produkt powinien mieć właściwy tytuł przed przeniesieniem",
  ).toHaveText(product.title);

  await expect(
    sourceCells.nth(4),
    "Produkt powinien mieć właściwy przedmiot przed przeniesieniem",
  ).toHaveText(ORDER_PRODUCTS.physics7.subjectCode);

  const title = await selectAvailableProduct(form, product.code);

  const arrow = form
    .locator("mat-icon")
    .filter({
      hasText: /^arrow_right$/,
    })
    .locator("xpath=ancestor::button[1]");

  await arrow.click();

  const target = selectedProductRow(form, product.code);

  await expect(target, "Produkt powinien znaleźć się w tabeli Zamówienie").toHaveCount(1);

  /*
   * Po przeniesieniu weryfikujemy dane,
   * które faktycznie są prezentowane
   * w tabeli Zamówienie.
   */

  await expect(target).toContainText(product.code);

  await expect(target).toContainText(title);

  await cancelOrderForm(form);
});

// =============================================================================
// ORD-33 – ORD-41: ilości i walidacja
// =============================================================================

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

test("ORD-38: wartość ujemna nie powinna być akceptowana — znany bug @school @order @quantity @bug", async ({
  page,
  scenario: s,
}) => {
  test.fail(true, "Znany bug: pole Ilość pozwala obecnie wpisać -1.");

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

for (const file of [
  makeUpload("ord-test.jpg", "image/jpeg"),
  makeUpload("ord-test.png", "image/png"),
  makeUpload("ord-test.pdf", "application/pdf"),
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
    await prepareOrderSchool(page, s);

    const form = await openNewOrderForm(page);

    await uploadOrderAttachment(page, form, file);

    await expect(attachmentByName(form, file.name)).toBeVisible();

    await cancelOrderForm(form);
  });
}

test("ORD-51: można dodać kilka załączników do jednego zamówienia @school @order @attachment", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const first = makeUpload("ord-multi-1.jpg", "image/jpeg");

  const second = makeUpload("ord-multi-2.png", "image/png");

  await uploadOrderAttachment(page, form, first);

  await uploadOrderAttachment(page, form, second);

  await expect(attachmentByName(form, first.name)).toBeVisible();

  await expect(attachmentByName(form, second.name)).toBeVisible();

  await cancelOrderForm(form);
});

test("ORD-52: można usunąć jeden z kilku załączników @school @order @attachment", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const first = makeUpload("ord-remove-1.jpg", "image/jpeg");

  const second = makeUpload("ord-remove-2.png", "image/png");

  await uploadOrderAttachment(page, form, first);

  await uploadOrderAttachment(page, form, second);

  /*
   * Przed usunięciem oba pliki
   * powinny znajdować się na liście.
   */
  await expect(attachmentByName(form, first.name)).toBeVisible();

  await expect(attachmentByName(form, second.name)).toBeVisible();

  /*
   * Usuwamy tylko pierwszy plik
   * i potwierdzamy operację przyciskiem Tak.
   */
  await removeOrderAttachment(page, form, first.name);

  /*
   * Pierwszy plik powinien zniknąć.
   */
  await expect(attachmentByName(form, first.name)).toHaveCount(0);

  /*
   * Drugi plik nie może zostać usunięty
   * przy okazji.
   */
  await expect(attachmentByName(form, second.name)).toBeVisible();

  await cancelOrderForm(form);
});

test("ORD-53: po usunięciu wszystkich załączników lista jest pusta @school @order @attachment", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const first = makeUpload("ord-remove-all-1.jpg", "image/jpeg");

  const second = makeUpload("ord-remove-all-2.png", "image/png");

  await uploadOrderAttachment(page, form, first);

  await uploadOrderAttachment(page, form, second);

  await expect(attachmentByName(form, first.name)).toBeVisible();

  await expect(attachmentByName(form, second.name)).toBeVisible();

  /*
   * Każde usunięcie wymaga osobnego
   * potwierdzenia w dialogu.
   */
  await removeOrderAttachment(page, form, first.name);

  await removeOrderAttachment(page, form, second.name);

  await expect(attachmentByName(form, first.name)).toHaveCount(0);

  await expect(attachmentByName(form, second.name)).toHaveCount(0);

  await cancelOrderForm(form);
});

test("ORD-54: zmiana filtrów nie usuwa załącznika @school @order @attachment @filter", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-filter.jpg", "image/jpeg");

  await uploadOrderAttachment(page, form, file);

  await selectOrderSingleFilter(page, form, "subject", ORDER_PRODUCTS.physics7.subject);

  await selectOrderSingleFilter(page, form, "level", ORDER_PRODUCTS.physics7.level);

  await searchOrderProducts(form, ORDER_PRODUCTS.physics7.search);

  await expect(attachmentByName(form, file.name)).toBeVisible();

  await cancelOrderForm(form);
});

test("ORD-55: dodanie produktu nie usuwa załącznika @school @order @attachment @product", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-product.jpg", "image/jpeg");

  await uploadOrderAttachment(page, form, file);

  await addOrderProduct(form, ORDER_PRODUCTS.physics7.products[1].code);

  await expect(attachmentByName(form, file.name)).toBeVisible();

  await cancelOrderForm(form);
});

test("ORD-56: załącznik jest trwały po zapisaniu i ponownym otwarciu edycji zamówienia @school @order @attachment @persistence", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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
    await expect(attachmentByName(form, file.name)).toBeVisible();

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
    await expect(
      savedOrderAttachments(edit),
      "Po ponownym otwarciu zamówienia powinien istnieć jeden zapisany załącznik",
    ).toHaveCount(1);

    await cancelOrderForm(edit);
  });
});

test("ORD-57: kilka załączników jest trwałych po zapisaniu zamówienia @school @order @attachment @persistence", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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
    await expect(attachmentByName(form, first.name)).toBeVisible();

    await expect(attachmentByName(form, second.name)).toBeVisible();

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
    await expect(
      savedOrderAttachments(edit),
      "Po ponownym otwarciu zamówienia powinny istnieć dwa zapisane załączniki",
    ).toHaveCount(2);

    await cancelOrderForm(edit);
  });
});

test("ORD-58: anulowanie formularza z załącznikiem nie przenosi pliku do kolejnego formularza @school @order @attachment @cancel", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const first = await openNewOrderForm(page);

  const file = makeUpload("ord-cancel.jpg", "image/jpeg");

  await uploadOrderAttachment(page, first, file);

  await cancelOrderForm(first);

  const second = await openNewOrderForm(page);

  await expect(attachmentByName(second, file.name)).toHaveCount(0);

  await expect(second).toContainText("Brak załączników");

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
    await prepareOrderSchool(page, s);

    const form = await openNewOrderForm(page);

    await uploadOrderAttachmentExpectRejected(page, form, file);

    await cancelOrderForm(form);
  });
}

test("ORD-61: plik większy niż 10 MB jest odrzucany @school @order @attachment @validation", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-too-large.jpg", "image/jpeg", 10 * 1024 * 1024 + 1);

  await uploadOrderAttachmentExpectRejected(page, form, file);

  await cancelOrderForm(form);
});

test("ORD-62: plik o rozmiarze dokładnie 10 MB jest akceptowany @school @order @attachment @boundary", async ({
  page,
  scenario: s,
}) => {
  await prepareOrderSchool(page, s);

  const form = await openNewOrderForm(page);

  const file = makeUpload("ord-10mb.jpg", "image/jpeg", 10 * 1024 * 1024);

  await uploadOrderAttachment(page, form, file);

  await cancelOrderForm(form);
});

test("ORD-63: zamówienie z załącznikiem pokazuje ikonę dokumentu na liście @school @order @attachment @list", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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

    await expect(row).toHaveCount(1);

    await expect(
      orderAttachmentIcon(orders, orderId),
      "Zamówienie z załącznikiem powinno mieć ikonę dokumentu",
    ).toBeVisible();
  });
});

test("ORD-64: zamówienie bez załącznika nie pokazuje ikony dokumentu @school @order @attachment @list @negative", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

  await withOrderCleanup(page, s, school, async (track) => {
    const created = await createSimpleOrder(page, ORDER_PRODUCTS.physics7.products[1].code, "1");

    await track(created.orderId);

    await s.app.openPanel("school", school.id);

    const orders = await openOrders(page);

    await expect(orderRow(orders, created.orderId)).toHaveCount(1);

    await expect(
      orderAttachmentIndicator(orders, created.orderId),
      "Zamówienie bez załącznika nie powinno mieć ikony dokumentu",
    ).toHaveCount(0);
  });
});

test("ORD-65: po usunięciu ostatniego załącznika ikona dokumentu znika @school @order @attachment @edit @list", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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

    await expect(orderAttachmentIndicator(orders, orderId)).toHaveCount(1);

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

    await expect(attachments).toHaveCount(1);

    const savedFileName = (await attachments.first().innerText()).trim();

    expect(savedFileName).not.toBe("");

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

    await expect(
      orderAttachmentIndicator(orders, orderId),
      "Po usunięciu ostatniego załącznika ikona dokumentu powinna zniknąć",
    ).toHaveCount(0);
  });
});

test("ORD-66: kilka załączników daje pojedynczą ikonę dokumentu na liście @school @order @attachment @list", async ({
  page,
  scenario: s,
}) => {
  const school = await prepareOrderSchool(page, s);

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
    await expect(
      orderAttachmentIndicator(orders, orderId),
      "Kilka załączników powinno być reprezentowane pojedynczą ikoną dokumentu",
    ).toHaveCount(1);

    await expect(orderAttachmentIndicator(orders, orderId)).toBeVisible();
  });
});
