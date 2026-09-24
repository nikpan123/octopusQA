import { test, expect } from "./support/scenario";
import {
  addOrderProduct,
  deleteOrder,
  expandOrderItems,
  expectOrderItems,
  openNewOrderForm,
  openOrderEdit,
  openOrders,
  ordersPanel,
  saveNewOrder,
  saveOrderEdit,
  setOrderQuantity,
} from "./support/order";

test("ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchoolViaApi();
  // Jawny produkt z katalogu dev: brak produktu ma ujawnić zmianę danych referencyjnych.
  const code = "KMLT18";
  await s.record("productCode", code);
  await s.record("quantity", "1");
  const orders = ordersPanel(page);
  let title = "";
  let orderId = "";
  await test.step("Znajdź produkt i dodaj jedną sztukę do zamówienia", async () => {
    const form = await openNewOrderForm(page);
    title = await addOrderProduct(form, code);
    await s.record("productTitle", title);
    await setOrderQuantity(form, code, "1");
    orderId = await saveNewOrder(page, form);
    await s.record("orderId", orderId);
  });
  await test.step("Otwórz ponownie szkołę i sprawdź szczegóły tego samego zamówienia", async () => {
    await s.app.openPanel("school", schoolId);
    await openOrders(page);
    const items = await expandOrderItems(orders, orderId);
    await expectOrderItems(items, [{ code, title, quantity: "1" }]);
    await expect(orders.getByText("Adres " + s.schoolName, { exact: false })).toBeVisible();
  });
});

test("ORD-02: zamówienie szkoły z dwoma produktami zachowuje produkty i ilości po ponownym otwarciu @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchoolViaApi();

  const code1 = "KMLT18";
  const code2 = "4P-2";

  const quantity1 = "1";
  const quantity2 = "2";

  await s.record("productCode1", code1);
  await s.record("productCode2", code2);
  await s.record("quantity1", quantity1);
  await s.record("quantity2", quantity2);

  const orders = ordersPanel(page);

  let title1 = "";
  let title2 = "";
  let orderId = "";

  await test.step("Otwórz formularz dodawania zamówienia", async () => {
    await openNewOrderForm(page);
  });

  await test.step("Dodaj pierwszy produkt do zamówienia", async () => {
    const form = s.app.dialog("Dodaj zamówienie");
    title1 = await addOrderProduct(form, code1);
    await s.record("productTitle1", title1);
  });

  await test.step("Dodaj drugi produkt do zamówienia", async () => {
    const form = s.app.dialog("Dodaj zamówienie");
    title2 = await addOrderProduct(form, code2);
    await s.record("productTitle2", title2);
  });

  await test.step("Ustaw ilości obu produktów i zapisz zamówienie", async () => {
    const form = s.app.dialog("Dodaj zamówienie");
    await setOrderQuantity(form, code1, quantity1);
    await setOrderQuantity(form, code2, quantity2);
    orderId = await saveNewOrder(page, form);
    await s.record("orderId", orderId);
  });

  await test.step("Otwórz ponownie szkołę i sprawdź oba produkty", async () => {
    await s.app.openPanel("school", schoolId);
    await openOrders(page);
    const items = await expandOrderItems(orders, orderId);
    await expectOrderItems(items, [
      { code: code1, title: title1, quantity: quantity1 },
      { code: code2, title: title2, quantity: quantity2 },
    ]);
    await expect(orders.getByText("Adres " + s.schoolName, { exact: false })).toBeVisible();
  });
});

/*
 * =========================================================
 * ORD-03
 * EDYCJA ILOŚCI I USUNIĘCIE ZAMÓWIENIA
 * =========================================================
 *
 * ZMIANA (gap analysis, punkt F.27 / lista rekomendacji #18):
 * ten test wcześniej duplikował ręcznie logikę, którą support/order.ts
 * już hermetyzuje (openOrderEdit, saveOrderEdit, deleteOrder nie były
 * tu wcześniej używane, mimo że robią dokładnie to samo). Przepisano
 * go tak, by korzystał z tych samych helperów co ORD-01/02 i nowe
 * testy w zamowienia-negatywne.spec.ts - zachowując identyczny zakres
 * asercji i strukturę try/finally z rozróżnieniem błędu scenariusza
 * od błędu sprzątania.
 */

test("ORD-03: edycja ilości dwóch produktów w zamówieniu i usunięcie zamówienia @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchoolViaApi();

  const code1 = "KMLT18";
  const code2 = "4P-2";

  const initialQuantity1 = "1";
  const initialQuantity2 = "2";

  const editedQuantity1 = "3";
  const editedQuantity2 = "5";

  const orders = ordersPanel(page);

  let title1 = "";
  let title2 = "";
  let orderId = "";

  /*
   * Jeżeli główny test zakończy się błędem, zapamiętujemy go.
   * Dzięki temu ewentualny problem cleanupu nie przykryje
   * pierwotnej przyczyny FAIL-a.
   */
  let scenarioError: unknown;
  let cleanupFailure: unknown;

  await s.record("productCode1", code1);
  await s.record("productCode2", code2);
  await s.record("initialQuantity1", initialQuantity1);
  await s.record("initialQuantity2", initialQuantity2);
  await s.record("editedQuantity1", editedQuantity1);
  await s.record("editedQuantity2", editedQuantity2);

  try {
    await test.step("Utwórz zamówienie z dwoma produktami", async () => {
      const form = await openNewOrderForm(page);
      title1 = await addOrderProduct(form, code1);
      await s.record("productTitle1", title1);
      title2 = await addOrderProduct(form, code2);
      await s.record("productTitle2", title2);
      await setOrderQuantity(form, code1, initialQuantity1);
      await setOrderQuantity(form, code2, initialQuantity2);
      orderId = await saveNewOrder(page, form);
      await s.record("orderId", orderId);
    });

    await test.step("Otwórz ponownie szkołę i sprawdź początkowe ilości produktów", async () => {
      await s.app.openPanel("school", schoolId);
      await openOrders(page);
      const items = await expandOrderItems(orders, orderId);
      await expectOrderItems(items, [
        { code: code1, title: title1, quantity: initialQuantity1 },
        { code: code2, title: title2, quantity: initialQuantity2 },
      ]);
    });

    await test.step("Edytuj ilości obu produktów", async () => {
      // Ponownie otwieramy panel, żeby pracować na świeżych danych.
      await s.app.openPanel("school", schoolId);
      await openOrders(page);
      const form = await openOrderEdit(page, orderId);
      await setOrderQuantity(form, code1, editedQuantity1);
      await setOrderQuantity(form, code2, editedQuantity2);
      await saveOrderEdit(form);
      await s.record("orderEdited", "true");
    });

    await test.step("Otwórz szkołę ponownie i sprawdź zmienione ilości", async () => {
      await s.app.openPanel("school", schoolId);
      await openOrders(page);
      const items = await expandOrderItems(orders, orderId);

      /*
       * Najważniejsza asercja: zmienione ilości są trwałe
       * po ponownym pobraniu danych, a produkty się nie zmieniły.
       */
      await expectOrderItems(items, [
        { code: code1, title: title1, quantity: editedQuantity1 },
        { code: code2, title: title2, quantity: editedQuantity2 },
      ]);

      await expect(orders.getByText("Adres " + s.schoolName, { exact: false })).toBeVisible();
    });
  } catch (error) {
    scenarioError = error;
    throw error;
  } finally {
    if (orderId) {
      try {
        await test.step("Cleanup: usuń utworzone zamówienie", async () => {
          await s.app.openPanel("school", schoolId);
          await openOrders(page);
          const result = await deleteOrder(page, orderId);
          await s.record("orderCleanup", result === "DELETED" ? "DELETED" : "ALREADY_ABSENT");
        });
      } catch (cleanupError) {
        await s.record("orderCleanup", "FAILED");

        // Jeżeli sam scenariusz był poprawny, błąd cleanupu powinien
        // wywalić test. Jeżeli test już wcześniej miał FAIL, nie
        // przykrywamy pierwotnego błędu błędem sprzątania.
        if (!scenarioError) {
          cleanupFailure = cleanupError;
        } else {
          console.error(`Cleanup zamówienia ${orderId} nie powiódł się:`, cleanupError);
        }
      }
    }
  }

  if (cleanupFailure) {
    throw cleanupFailure;
  }
});
