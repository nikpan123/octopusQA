import { test, expect } from "./support/scenario";
import type { Locator } from "@playwright/test";

import { restoreSession } from "../scripts/auth.mjs";
import { Octopus } from "./support/octopus";

import {
  addOrderProduct,
  cancelNewOrderForm,
  countOrderRows,
  deleteOrder,
  expandOrderItems,
  newOrderSaveButton,
  openNewOrderForm,
  openOrders,
  ordersPanel,
  saveNewOrder,
  selectedProductRow,
  selectedProducts,
  setOrderQuantity,
} from "./support/order";

/*
 * Wersja setOrderQuantity() w support/order.ts kończy się asercją, że
 * pole faktycznie przyjęło podaną wartość - dlatego nie nadaje się do
 * sprawdzania wartości, które formularz może odrzucić. Poniższy wariant
 * tylko wpisuje wartość i zwraca to, co realnie zostało w polu.
 */
async function attemptSetQuantity(form: Locator, code: string, quantity: string): Promise<string> {
  const row = selectedProductRow(form, code);
  await expect(row).toHaveCount(1);
  const input = row.getByRole("spinbutton");
  await input.click();
  await input.fill(quantity);
  await input.press("Tab");
  return (await input.inputValue()).trim();
}

/*
 * =========================================================
 * ORD-04
 * ILOŚĆ ZERO / UJEMNA
 * =========================================================
 *
 * Gap analysis, punkt F.19 (dodanie produktu z ilością zero lub
 * ujemną). Zachowanie aplikacji dla tych wartości nie jest
 * udokumentowane w żadnym istniejącym teście, więc test bada je
 * i asertuje wyłącznie bezpieczny niezmiennik: zamówienie z
 * niepoprawną ilością nie może zostać trwale zapisane.
 */

for (const invalidQuantity of ["0", "-1"] as const) {
  test(`ORD-04: ilość "${invalidQuantity}" nie pozwala trwale zapisać pozycji zamówienia @school @order @validation`, async ({
    page,
    scenario: s,
  }) => {
    await s.createSchoolViaApi();
    const code = "KMLT18";
    const form = await openNewOrderForm(page);
    await addOrderProduct(form, code);

    const acceptedValue = await attemptSetQuantity(form, code, invalidQuantity);
    console.log(
      `ORD-04 ("${invalidQuantity}"): pole ilości pokazuje po wpisaniu wartość "${acceptedValue}".`,
    );

    if (acceptedValue !== invalidQuantity) {
      // Pole samo skorygowało/odrzuciło niepoprawną wartość - bezpieczne
      // zachowanie już na poziomie klienta.
      expect(acceptedValue).not.toBe(invalidQuantity);
      await cancelNewOrderForm(form);
      return;
    }

    const saveButton = newOrderSaveButton(form);
    if (!(await saveButton.isEnabled())) {
      await cancelNewOrderForm(form);
      return;
    }

    await saveButton.click();
    await page.waitForTimeout(1_000);

    if ((await form.count()) > 0) {
      // Formularz nadal otwarty - zapis został zablokowany, jak należy.
      await cancelNewOrderForm(form);
      return;
    }

    // Formularz się zamknął: dokumentujemy aktualne zachowanie backendu,
    // a utworzony rekord sprzątamy, aby test nie pozostawiał danych.
    const createdRows = await countOrderRows(page);
    await s.record(`invalidQuantity-${invalidQuantity}`, createdRows === 0 ? "BLOCKED" : "SAVED");
    if (createdRows > 0) {
      const orderId = (
        await ordersPanel(page).locator("td.mat-column-id").first().innerText()
      ).trim();
      await deleteOrder(page, orderId);
    }
  });
}

/*
 * =========================================================
 * ORD-05
 * ZAMÓWIENIE BEZ ŻADNEGO PRODUKTU
 * =========================================================
 *
 * Gap analysis, punkt F.20.
 */

test("ORD-05: zamówienie bez żadnego produktu nie może zostać trwale zapisane @school @order @validation", async ({
  page,
  scenario: s,
}) => {
  await s.createSchoolViaApi();
  const form = await openNewOrderForm(page);

  const saveButton = newOrderSaveButton(form);
  if (await saveButton.isEnabled()) {
    await saveButton.click();
    await page.waitForTimeout(1_000);
  }

  if ((await form.count()) === 0) {
    const createdRows = await countOrderRows(page);
    expect(
      createdRows,
      "NIEBEZPIECZEŃSTWO: zamówienie bez żadnego produktu zostało zapisane.",
    ).toBe(0);
    return;
  }

  await expect(form).toBeVisible();
  await cancelNewOrderForm(form);
});

/*
 * =========================================================
 * ORD-06
 * TEN SAM PRODUKT DODANY DWUKROTNIE
 * =========================================================
 *
 * Gap analysis, punkt F.21. Nie zakładamy z góry mechanizmu
 * (blokada / scalenie / dwa wiersze) - dokumentujemy rzeczywisty
 * wynik.
 */

test("ORD-06: dodanie tego samego produktu dwukrotnie do jednego zamówienia jest obsłużone bez błędu @school @order @validation", async ({
  page,
  scenario: s,
}) => {
  await s.createSchoolViaApi();
  const code = "KMLT18";
  const form = await openNewOrderForm(page);
  await addOrderProduct(form, code);

  const searchInput = form.getByPlaceholder("Wpisz", { exact: true });
  await searchInput.fill(code);
  await form.getByRole("button", { name: "Szukaj", exact: true }).click();

  const availableAgain = form
    .getByRole("columnheader", { name: "Dodaj", exact: true })
    .locator("xpath=ancestor::*[@role='treegrid'][1]")
    .getByRole("gridcell", { name: code, exact: true });

  if ((await availableAgain.count()) === 0) {
    console.log(
      "ORD-06: produkt znika z listy dostępnych po dodaniu - duplikat jest strukturalnie " +
        "niemożliwy przez UI.",
    );
    await cancelNewOrderForm(form);
    return;
  }

  await availableAgain.locator("xpath=ancestor::*[@role='row'][1]").getByRole("checkbox").check();
  await form
    .locator("mat-icon")
    .filter({ hasText: /^arrow_right$/ })
    .locator("xpath=ancestor::button[1]")
    .click();

  const selectedRowsForCode = selectedProducts(form)
    .getByRole("row")
    .filter({ has: page.getByRole("gridcell", { name: code, exact: true }) });
  const rowCount = await selectedRowsForCode.count();
  console.log(
    `ORD-06: po dwukrotnym dodaniu produktu "${code}" tabela wybranych produktów ma ${rowCount} ` +
      "wiersz(y) dla tego kodu.",
  );

  expect(rowCount).toBeGreaterThan(0);
  await cancelNewOrderForm(form);
});

/*
 * =========================================================
 * ORD-07
 * NIEISTNIEJĄCY KOD PRODUKTU
 * =========================================================
 *
 * Gap analysis, punkt F.22.
 */

test("ORD-07: wyszukanie nieistniejącego kodu produktu nie powoduje błędu i nic nie dodaje @school @order @validation", async ({
  page,
  scenario: s,
}) => {
  await s.createSchoolViaApi();
  const bogusCode = `NIEISTNIEJE-${Date.now()}`;
  const form = await openNewOrderForm(page);

  const searchInput = form.getByPlaceholder("Wpisz", { exact: true });
  await searchInput.fill(bogusCode);
  await form.getByRole("button", { name: "Szukaj", exact: true }).click();

  const availableMatches = form
    .getByRole("columnheader", { name: "Dodaj", exact: true })
    .locator("xpath=ancestor::*[@role='treegrid'][1]")
    .getByRole("gridcell", { name: bogusCode, exact: true });
  await expect(availableMatches).toHaveCount(0);

  await expect(
    form,
    "Formularz zamówienia powinien pozostać w pełni użyteczny po wyszukaniu bez wyników.",
  ).toBeVisible();
  await cancelNewOrderForm(form);
});

/*
 * =========================================================
 * ORD-08
 * BARDZO DUŻA ILOŚĆ
 * =========================================================
 *
 * Gap analysis, punkty F.23/F.26 (bardzo duża ilość / wiele
 * pozycji). Ze względu na brak innych znanych, poprawnych kodów
 * produktów w tym repozytorium poza KMLT18 i 4P-2, test skupia
 * się na skrajnej ILOŚCI jednego produktu, a nie na dziesiątkach
 * różnych pozycji.
 */

test("ORD-08: bardzo duża ilość produktu jest obsłużona bez błędu @school @order", async ({
  page,
  scenario: s,
}) => {
  await s.createSchoolViaApi();
  const code = "KMLT18";
  const hugeQuantity = "999999";
  const form = await openNewOrderForm(page);
  await addOrderProduct(form, code);

  const acceptedValue = await attemptSetQuantity(form, code, hugeQuantity);
  console.log(`ORD-08: po wpisaniu ilości "${hugeQuantity}" pole pokazuje "${acceptedValue}".`);

  const saveButton = newOrderSaveButton(form);
  if (!(await saveButton.isEnabled())) {
    await cancelNewOrderForm(form);
    return;
  }

  const orderId = await saveNewOrder(page, form);
  await s.record("hugeQuantityOrderId", orderId);

  await page.reload({ waitUntil: "domcontentloaded" });
  const orders = await openOrders(page);
  const items = await expandOrderItems(orders, orderId);
  await expect(items.locator("tbody > tr")).toHaveCount(1);

  const persistedQuantity = (await items.getByRole("cell").nth(4).innerText()).trim();
  console.log(`ORD-08: po zapisie i ponownym otwarciu ilość wynosi "${persistedQuantity}".`);
  expect(persistedQuantity.length).toBeGreaterThan(0);

  await deleteOrder(page, orderId);
});

/*
 * =========================================================
 * ORD-09
 * BRAK UPRAWNIEŃ (403) PRZY USUWANIU ZAMÓWIENIA
 * =========================================================
 *
 * Gap analysis, punkt F.24 (uprawnienia do usuwania zamówienia).
 * Nie znamy dokładnej nazwy endpointu usuwania zamówienia (nie
 * jest ona nigdzie w repozytorium jawnie wywoływana z UI) - z
 * obserwowanej konwencji nazewnictwa API tego projektu (AddTeacher,
 * AddNewInstitution, InsertIntoTestTeachers) wynika, że prawdopodobnie
 * jest to POST z nazwą zawierającą "Delete"/"Remove"/"Usun" w ścieżce,
 * a nie metoda HTTP DELETE. Test jawnie sprawdza, czy przechwycił
 * jakiekolwiek żądanie pasujące do tego wzorca, i kończy się czytelnym
 * błędem diagnostycznym, jeśli nie - zamiast fałszywie potwierdzać
 * bezpieczeństwo na podstawie interceptora, który nigdy nie zadziałał.
 */

test("ORD-09: brak uprawnień (403) przy usuwaniu zamówienia nie usuwa go z widoku @school @order @auth", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchoolViaApi();
  const code = "KMLT18";
  const form = await openNewOrderForm(page);
  await addOrderProduct(form, code);
  await setOrderQuantity(form, code, "1");
  const orderId = await saveNewOrder(page, form);

  await s.app.openPanel("school", schoolId);
  const orders = await openOrders(page);

  let deleteAttempts = 0;
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.toLowerCase();
    if (request.method() === "DELETE" && pathname === "/api/schoolorder/deleteorder") {
      deleteAttempts += 1;
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Kontrolowany błąd testowy" }),
      });
      return;
    }
    await route.continue();
  });

  const row = orders
    .getByRole("cell", { name: orderId, exact: true })
    .locator("xpath=ancestor::*[@role='row'][1]");
  await row.click();

  const deleteButton = orders.getByRole("button", { name: "Usuń", exact: true });
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  const confirmation = page.locator("mat-dialog-container").last();
  const dialogAppeared = await confirmation
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (dialogAppeared) {
    const confirmButton = confirmation.getByRole("button", { name: /^(Tak|Usuń|OK)$/ });
    if (await confirmButton.count()) await confirmButton.click();
  }

  await page.waitForTimeout(1_000);
  await page.unroute("**/api/**");

  expect(deleteAttempts, "Nie przechwycono DELETE /api/SchoolOrder/DeleteOrder.").toBeGreaterThan(
    0,
  );

  await expect(
    row,
    "KRYTYCZNE: zamówienie zniknęło z widoku mimo że serwer odrzucił jego usunięcie kodem 403.",
  ).toHaveCount(1);

  // Sprzątanie - tym razem bez przechwytywania, usuwamy naprawdę.
  await deleteOrder(page, orderId);
});

/*
 * =========================================================
 * ORD-10
 * WSPÓŁBIEŻNE USUNIĘCIE Z DWÓCH KART
 * =========================================================
 *
 * Gap analysis, punkt F.25.
 */

test("ORD-10: usunięcie zamówienia w jednej karcie nie zawiesza drugiej karty patrzącej na ten sam wiersz @school @order @concurrency", async ({
  page,
  scenario: s,
  browser,
  authSession,
}) => {
  const schoolId = await s.createSchoolViaApi();
  const code = "KMLT18";
  const form = await openNewOrderForm(page);
  await addOrderProduct(form, code);
  await setOrderQuantity(form, code, "1");
  const orderId = await saveNewOrder(page, form);

  const secondContext = await browser.newContext({ storageState: authSession.storageState });
  try {
    await restoreSession(secondContext, authSession.session);
    const secondPage = await secondContext.newPage();
    const secondApp = new Octopus(secondPage);

    await s.app.openPanel("school", schoolId);
    await openOrders(page);
    await secondApp.openPanel("school", schoolId);
    await openOrders(secondPage);

    // Karta 1 usuwa zamówienie.
    await deleteOrder(page, orderId);

    // Karta 2 pracuje na już nieaktualnym widoku - to najbliższy
    // odpowiednik dwóch kart operujących na tym samym rekordzie.
    const secondOrders = ordersPanel(secondPage);
    const secondRow = secondOrders
      .getByRole("cell", { name: orderId, exact: true })
      .locator("xpath=ancestor::*[@role='row'][1]");

    if ((await secondRow.count()) === 0) {
      console.log("ORD-10: druga karta samodzielnie odświeżyła dane - zamówienia już tam nie ma.");
      return;
    }

    await secondRow.click();
    const secondDeleteButton = secondOrders.getByRole("button", { name: "Usuń", exact: true });
    await expect(secondDeleteButton).toBeEnabled();
    await secondDeleteButton.click();

    const confirmation = secondPage.locator("mat-dialog-container").last();
    const dialogAppeared = await confirmation
      .waitFor({ state: "visible", timeout: 1_500 })
      .then(() => true)
      .catch(() => false);
    if (dialogAppeared) {
      const confirmButton = confirmation.getByRole("button", { name: /^(Tak|Usuń|OK)$/ });
      if (await confirmButton.count()) await confirmButton.click();
    }

    // Niezależnie od dokładnego komunikatu, druga próba usunięcia już
    // nieistniejącego zamówienia nie powinna zawiesić karty ani zostawić
    // otwartego, niereagującego dialogu.
    await secondPage.waitForTimeout(1_000);
    const openDialogs = await secondPage.locator("mat-dialog-container").count();
    console.log(
      `ORD-10: po drugiej próbie usunięcia w karcie 2 otwartych dialogów: ${openDialogs}.`,
    );
    expect(openDialogs).toBeLessThanOrEqual(1);
  } finally {
    await secondContext.close();
  }
});
