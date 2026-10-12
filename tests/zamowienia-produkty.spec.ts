import { test, expect } from "./support/scenario";

import {
  addOrderProduct,
  addOrderProductsFromCurrentResults,
  availableProductRow,
  availableProductRows,
  cancelOrderForm,
  clearOrderFilters,
  clearSelectedOrderProducts,
  moveSelectedProductsLeft,
  openNewOrderForm,
  readOrderFilterOptions,
  searchOrderProducts,
  selectAvailableProduct,
  selectOrderClasses,
  selectOrderSingleFilter,
  selectSelectedProduct,
  selectedProductRow,
  selectedProductRows,
} from "./support/order";

import { ORDER_PRODUCTS } from "./data/order-product-data";
import { prepareOrderSchool, expectFilterReset } from "./support/order-scenario";

test.describe.configure({
  mode: "parallel",
});

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
