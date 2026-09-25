import { expect, type Locator, type Page } from "@playwright/test";

export type ExpectedOrderItem = {
  code: string;
  title: string;
  quantity: string;
};

export type OrderFilterKey = "subject" | "level" | "classes";

export type UploadPayload = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

const filterIndexes: Record<OrderFilterKey, number> = {
  subject: 0,
  level: 1,
  classes: 2,
};

export function ordersPanel(page: Page): Locator {
  return page
    .getByRole("tabpanel", {
      name: "Zamówienia",
      exact: true,
    })
    .last();
}

export async function openOrders(page: Page): Promise<Locator> {
  /*
   * Na karcie szkoły występują dwa taby o nazwie "Zamówienia":
   *
   * 1. główna zakładka szkoły,
   * 2. wewnętrzna zakładka sekcji zamówień.
   *
   * Interesuje nas pierwszy, należący do głównego mat-tab-group.
   */
  const schoolOrdersTab = page
    .getByRole("tab", {
      name: "Zamówienia",
      exact: true,
    })
    .first();

  await expect(
    schoolOrdersTab,
    "Główna zakładka Zamówienia szkoły powinna być widoczna",
  ).toBeVisible();

  /*
   * openOrders() jest używane także w cleanupie.
   * Jeżeli zakładka jest już aktywna, nie klikamy jej ponownie.
   */
  const selected = await schoolOrdersTab.getAttribute("aria-selected");

  if (selected !== "true") {
    await schoolOrdersTab.click();
  }

  const orders = ordersPanel(page);

  await expect(orders, "Panel zamówień szkoły powinien być widoczny").toBeVisible();

  return orders;
}

export async function openNewOrderForm(page: Page): Promise<Locator> {
  const orders = await openOrders(page);

  await orders
    .getByRole("button", {
      name: "Dodaj",
      exact: true,
    })
    .click();

  const form = page.locator("mat-dialog-container").filter({
    hasText: "Dodaj zamówienie",
  });

  await expect(form).toBeVisible();

  return form;
}

export async function cancelOrderForm(form: Locator): Promise<void> {
  await form
    .getByRole("button", {
      name: "Anuluj",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);
}

export function orderFilterCombobox(form: Locator, key: OrderFilterKey): Locator {
  return form.getByRole("combobox").nth(filterIndexes[key]);
}

/**
 * Otwiera dropdown przypisany do konkretnego comboboxa
 * i zwraca dokładnie jego listę opcji.
 *
 * Nie korzystamy z:
 *
 *   page.locator('[role="listbox"]:visible').last()
 *
 * ponieważ Angular Material może przez chwilę pozostawić
 * w DOM overlay poprzedniego selecta.
 */
async function orderFilterListbox(page: Page, combobox: Locator): Promise<Locator> {
  await expect(combobox, "Filtr powinien być widoczny").toBeVisible();

  await expect(combobox, "Filtr powinien być aktywny").toBeEnabled();

  const expanded = await combobox.getAttribute("aria-expanded");

  /*
   * Otwieramy tylko wtedy, gdy dropdown
   * faktycznie jest zamknięty.
   */
  if (expanded !== "true") {
    await combobox.click();
  }

  await expect(combobox, "Dropdown powinien zostać otwarty").toHaveAttribute(
    "aria-expanded",
    "true",
  );

  /*
   * Angular Material wiąże combobox
   * z jego panelem przez aria-controls
   * albo aria-owns.
   */
  await expect
    .poll(
      async () => {
        const controls = await combobox.getAttribute("aria-controls");

        if (controls) {
          return controls;
        }

        return (await combobox.getAttribute("aria-owns")) ?? "";
      },
      {
        timeout: 5_000,
        intervals: [50, 100, 250],
        message: "Combobox powinien wskazywać swój panel opcji",
      },
    )
    .not.toBe("");

  const panelId =
    (await combobox.getAttribute("aria-controls")) ?? (await combobox.getAttribute("aria-owns"));

  expect(panelId, "Nie udało się ustalić ID panelu dropdownu").toBeTruthy();

  const listbox = page.locator(`[id="${panelId}"]`);

  await expect(listbox, "Właściwa lista opcji powinna być widoczna").toBeVisible();

  return listbox;
}

/**
 * Kliknięcie opcji Angular Material przez współrzędne.
 *
 * mat-option może zostać odłączony od DOM
 * natychmiast po kliknięciu. Standardowe:
 *
 *   option.click()
 *
 * potrafi wtedy zakończyć się:
 *
 *   element was detached from the DOM
 */
async function clickOrderFilterOption(
  page: Page,
  option: Locator,
  description: string,
): Promise<void> {
  await expect(option, description).toBeVisible();

  const box = await option.boundingBox();

  expect(box, `${description} — nie udało się ustalić pozycji elementu`).not.toBeNull();

  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

export async function selectOrderSingleFilter(
  page: Page,
  form: Locator,
  key: Exclude<OrderFilterKey, "classes">,
  value: string,
): Promise<void> {
  const combobox = orderFilterCombobox(form, key);

  const listbox = await orderFilterListbox(page, combobox);

  const option = listbox.getByRole("option", {
    name: value,
    exact: true,
  });

  await clickOrderFilterOption(page, option, `Opcja "${value}" powinna być dostępna`);

  /*
   * Single-select po wyborze powinien
   * automatycznie zamknąć dropdown.
   */
  await expect(combobox, `Po wybraniu "${value}" dropdown powinien się zamknąć`).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  /*
   * Sprawdzamy efekt końcowy.
   */
  await expect(combobox, `Filtr powinien mieć ustawioną wartość "${value}"`).toContainText(value);
}

export async function selectOrderClasses(
  page: Page,
  form: Locator,
  values: readonly string[],
): Promise<void> {
  const combobox = orderFilterCombobox(form, "classes");

  await expect(combobox, "Pole Klasy powinno być widoczne").toBeVisible();

  await expect(combobox, "Pole Klasy powinno być aktywne").toBeEnabled();

  for (const value of values) {
    /*
     * Jeżeli wartość jest już zaznaczona,
     * nie zaznaczamy jej ponownie.
     */
    const currentText = (await combobox.innerText()).trim();

    const selectedValues = currentText
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (selectedValues.includes(value)) {
      continue;
    }

    /*
     * Dla każdej klasy pobieramy panel
     * przypisany bezpośrednio do comboboxa Klasy.
     *
     * Nie wykorzystujemy starego locatora panelu,
     * ponieważ Angular może przebudować overlay
     * po każdym kliknięciu.
     */
    const listbox = await orderFilterListbox(page, combobox);

    const option = listbox.getByRole("option", {
      name: value,
      exact: true,
    });

    await clickOrderFilterOption(page, option, `Klasa ${value} powinna być dostępna na liście`);

    /*
     * Nie sprawdzamy starego mat-option,
     * ponieważ mógł już zostać usunięty z DOM.
     *
     * Sprawdzamy efekt wyboru na samym comboboxie.
     */
    await expect(combobox, `Klasa ${value} powinna zostać zaznaczona`).toContainText(value);
  }

  /*
   * Multiselect Klasy może pozostać otwarty
   * po wybraniu ostatniej wartości.
   */
  const expanded = await combobox.getAttribute("aria-expanded");

  if (expanded === "true") {
    await page.keyboard.press("Escape");

    await expect(combobox, "Lista klas powinna zostać zamknięta").toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }
}

export async function readOrderFilterOptions(
  page: Page,
  form: Locator,
  key: OrderFilterKey,
): Promise<string[]> {
  const combobox = orderFilterCombobox(form, key);

  /*
   * Otwieramy dokładnie panel należący
   * do tego comboboxa.
   */
  const listbox = await orderFilterListbox(page, combobox);

  const options = listbox.getByRole("option");

  await expect(options.first(), "Lista powinna zawierać co najmniej jedną opcję").toBeVisible();

  const values = (await options.allTextContents()).map((value) => value.trim()).filter(Boolean);

  /*
   * Zamykamy dokładnie otwarty select.
   */
  await page.keyboard.press("Escape");

  await expect(combobox, "Dropdown powinien zostać zamknięty po odczytaniu opcji").toHaveAttribute(
    "aria-expanded",
    "false",
  );

  return values;
}

export function orderSearchInput(form: Locator): Locator {
  return form.getByPlaceholder("Wpisz", {
    exact: true,
  });
}

export async function clearOrderFilters(form: Locator): Promise<void> {
  await form
    .getByRole("button", {
      name: "Wyczyść filtry",
      exact: true,
    })
    .click();
}

export async function searchOrderProducts(form: Locator, query?: string): Promise<void> {
  if (query !== undefined) {
    await orderSearchInput(form).fill(query);
  }

  await form
    .getByRole("button", {
      name: "Szukaj",
      exact: true,
    })
    .click();
}

export function availableProducts(form: Locator): Locator {
  return form
    .getByRole("columnheader", {
      name: "Dodaj",
      exact: true,
    })
    .locator("xpath=ancestor::*[@role='treegrid'][1]");
}

export function selectedProducts(form: Locator): Locator {
  return form
    .getByRole("columnheader", {
      name: "Ilość",
      exact: true,
    })
    .locator("xpath=ancestor::*[@role='treegrid'][1]");
}

export function availableProductRows(form: Locator): Locator {
  return availableProducts(form).locator('[role="row"]:has([role="gridcell"])');
}

export function selectedProductRows(form: Locator): Locator {
  return selectedProducts(form).locator('[role="row"]:has([role="gridcell"])');
}

export function availableProductRow(form: Locator, code: string): Locator {
  return availableProducts(form)
    .getByRole("gridcell", {
      name: code,
      exact: true,
    })
    .locator("xpath=ancestor::*[@role='row'][1]");
}

export function selectedProductRow(form: Locator, code: string): Locator {
  return selectedProducts(form)
    .getByRole("gridcell", {
      name: code,
      exact: true,
    })
    .locator("xpath=ancestor::*[@role='row'][1]");
}

export async function selectAvailableProduct(form: Locator, code: string): Promise<string> {
  const product = availableProductRow(form, code);

  await expect(product).toHaveCount(1);

  const title = (await product.getByRole("gridcell").nth(3).innerText()).trim();

  expect(title).not.toBe("");

  const checkbox = product.getByRole("checkbox");
  await checkbox.check();

  return title;
}

export async function selectSelectedProduct(form: Locator, code: string): Promise<void> {
  const product = selectedProductRow(form, code);

  await expect(product).toHaveCount(1);

  const checkbox = product.getByRole("checkbox");
  await checkbox.check();
}

export async function moveSelectedProductsRight(form: Locator): Promise<void> {
  await form
    .locator("mat-icon")
    .filter({
      hasText: /^arrow_right$/,
    })
    .locator("xpath=ancestor::button[1]")
    .click();
}

export async function moveSelectedProductsLeft(form: Locator): Promise<void> {
  await form
    .locator("mat-icon")
    .filter({
      hasText: /^arrow_left$/,
    })
    .locator("xpath=ancestor::button[1]")
    .click();
}

export async function clearSelectedOrderProducts(form: Locator): Promise<void> {
  await form
    .locator("mat-icon")
    .filter({
      hasText: /^(delete|delete_forever)$/,
    })
    .locator("xpath=ancestor::button[1]")
    .click();

  await expect(selectedProductRows(form)).toHaveCount(0);
}

export async function addOrderProduct(form: Locator, code: string): Promise<string> {
  await searchOrderProducts(form, code);

  const title = await selectAvailableProduct(form, code);

  await moveSelectedProductsRight(form);

  await expect(selectedProductRow(form, code)).toHaveCount(1);

  return title;
}

export async function addOrderProductsFromCurrentResults(
  form: Locator,
  codes: readonly string[],
): Promise<void> {
  for (const code of codes) {
    await selectAvailableProduct(form, code);
  }

  await moveSelectedProductsRight(form);

  for (const code of codes) {
    await expect(selectedProductRow(form, code)).toHaveCount(1);
  }
}

export function orderQuantityInput(form: Locator, code: string): Locator {
  return selectedProductRow(form, code).getByRole("spinbutton");
}

export async function editOrderQuantity(
  form: Locator,
  code: string,
  quantity: string,
): Promise<Locator> {
  const input = orderQuantityInput(form, code);

  await expect(input).toBeVisible();
  await input.click();
  await input.fill(quantity);
  await input.press("Tab");

  return input;
}

export async function setOrderQuantity(
  form: Locator,
  code: string,
  quantity: string,
): Promise<void> {
  const input = await editOrderQuantity(form, code, quantity);

  await expect(input).toHaveValue(quantity);
}

export async function getOrderIds(page: Page): Promise<string[]> {
  const cells = ordersPanel(page).locator("td.mat-column-id");

  return (await cells.allTextContents())
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));
}

export async function saveNewOrder(
  page: Page,
  form: Locator,
  beforeIds?: readonly string[],
): Promise<string> {
  /*
   * Najbezpieczniej przekazać beforeIds pobrane
   * jeszcze przed otwarciem formularza.
   *
   * Parametr zostaje opcjonalny, żeby nie trzeba było
   * od razu przepisywać wszystkich istniejących testów.
   */
  const before = new Set(beforeIds ?? (await getOrderIds(page)));

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form, "Po zapisie formularz powinien zostać zamknięty").toHaveCount(0);

  /*
   * Czekamy aż zakończy się zapis / odświeżenie listy.
   */
  await page
    .locator("#spinner.backdrop")
    .waitFor({
      state: "hidden",
      timeout: 20_000,
    })
    .catch(() => undefined);

  const findNewIds = async () => {
    const current = await getOrderIds(page);

    return current.filter((id) => !before.has(id));
  };

  /*
   * Po zapisie powinno pojawić się dokładnie
   * jedno ID, którego nie było przed otwarciem
   * formularza.
   */
  await expect
    .poll(findNewIds, {
      timeout: 20_000,
      intervals: [100, 250, 500, 1_000],
      message: "Po zapisie powinno pojawić się dokładnie jedno nowe ID zamówienia",
    })
    .toHaveLength(1);

  const [orderId] = await findNewIds();

  expect(orderId).toMatch(/^\d+$/);

  return orderId;
}

export async function saveNewOrderWithRepeatedClick(
  page: Page,
  form: Locator,
  beforeIds: readonly string[],
  secondClickDelayMs = 100,
): Promise<string[]> {
  const before = new Set(beforeIds);

  const save = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(save).toBeVisible();
  await expect(save).toBeEnabled();

  /*
   * Zapamiętujemy położenie przycisku przed zapisem.
   *
   * Drugie kliknięcie wykonujemy myszą w to samo miejsce,
   * ponieważ po pierwszym kliknięciu Octopus może pokazać
   * spinner przechwytujący kliknięcia.
   */
  const box = await save.boundingBox();

  expect(box, "Przycisk Zapisz powinien mieć pozycję na ekranie").not.toBeNull();

  const x = box!.x + box!.width / 2;

  const y = box!.y + box!.height / 2;

  /*
   * Pierwsze kliknięcie.
   */
  await page.mouse.click(x, y);

  /*
   * Krótka przerwa odpowiadająca
   * szybkiemu ponownemu kliknięciu użytkownika.
   */
  await page.waitForTimeout(secondClickDelayMs);

  const formStillVisible = await form.isVisible().catch(() => false);

  const spinnerVisible = await page
    .locator("#spinner.backdrop")
    .isVisible()
    .catch(() => false);

  /*
   * Drugie kliknięcie wykonujemy tylko wtedy,
   * gdy formularz nadal istnieje albo trwa zapis
   * i ekran blokuje spinner.
   *
   * Jeżeli formularz zdążył się już całkowicie zamknąć,
   * użytkownik nie miałby możliwości ponownie kliknąć Zapisz.
   */
  if (formStillVisible || spinnerVisible) {
    await page.mouse.click(x, y);
  }

  await expect(form, "Po zapisie formularz powinien zostać zamknięty").toHaveCount(0);

  /*
   * Zbieramy wszystkie nowe ID, jakie pojawią się
   * względem stanu sprzed otwarcia formularza.
   *
   * Ważne: nie robimy tutaj asercji, że jest jedno ID.
   * ORD-42 zrobi tę asercję dopiero po przekazaniu
   * wszystkich ID do cleanupu.
   */
  const observedIds = new Set<string>();

  const collectNewIds = async (): Promise<string[]> => {
    const current = await getOrderIds(page);

    for (const id of current) {
      if (!before.has(id)) {
        observedIds.add(id);
      }
    }

    return [...observedIds];
  };

  /*
   * Najpierw czekamy na co najmniej jedno
   * utworzone zamówienie.
   */
  await expect
    .poll(async () => (await collectNewIds()).length, {
      timeout: 20_000,
      message: "Po zapisie powinno pojawić się co najmniej jedno nowe zamówienie",
    })
    .toBeGreaterThan(0);

  /*
   * Dajemy jeszcze chwilę, aby wychwycić
   * ewentualny drugi zapis utworzony
   * przez drugie kliknięcie.
   */
  await page.waitForTimeout(1_000);

  await collectNewIds();

  return [...observedIds];
}

export function orderRow(orders: Locator, orderId: string): Locator {
  return orders
    .getByRole("cell", {
      name: orderId,
      exact: true,
    })
    .locator("xpath=ancestor::*[@role='row'][1]");
}

export async function expandOrderItems(orders: Locator, orderId: string): Promise<Locator> {
  const row = orderRow(orders, orderId);

  await expect(row, `Zamówienie ${orderId} powinno istnieć na liście`).toHaveCount(1);

  const expandIcon = row.locator("mat-icon").filter({
    hasText: /^keyboard_arrow_down$/,
  });

  await expect(
    expandIcon,
    `Zamówienie ${orderId} powinno mieć możliwość rozwinięcia`,
  ).toBeVisible();

  await expandIcon.click();

  /*
   * Szczegóły zamówienia są renderowane w kolejnym
   * wierszu po wierszu nagłówkowym konkretnego orderId.
   *
   * Nie szukamy już globalnie ".last()", ponieważ
   * na wspólnej szkole może istnieć wiele zamówień.
   */
  const detailsRow = row.locator("xpath=following-sibling::*[1]");

  await expect(
    detailsRow,
    `Szczegóły zamówienia ${orderId} powinny pojawić się pod jego wierszem`,
  ).toBeVisible();

  const items = detailsRow
    .getByRole("columnheader", {
      name: "Ilość",
      exact: true,
    })
    .locator("xpath=ancestor::*[@role='table'][1]");

  await expect(items, `Powinna istnieć tabela pozycji zamówienia ${orderId}`).toBeVisible();

  return items;
}

export async function expectOrderItems(
  items: Locator,
  expectedItems: readonly ExpectedOrderItem[],
): Promise<void> {
  await expect(items.locator("tbody > tr")).toHaveCount(expectedItems.length);

  for (const expectedItem of expectedItems) {
    const item = items
      .getByRole("cell", {
        name: expectedItem.code,
        exact: true,
      })
      .locator("xpath=ancestor::*[@role='row'][1]");

    await expect(item).toHaveCount(1);

    await expect(item.getByRole("cell").nth(0)).toHaveText(expectedItem.title);

    await expect(item.getByRole("cell").nth(4)).toHaveText(expectedItem.quantity);
  }
}

export async function openOrderEdit(page: Page, orderId: string): Promise<Locator> {
  const orders = ordersPanel(page);

  const row = orderRow(orders, orderId);

  await expect(row).toHaveCount(1);
  await row.click();

  const editButton = orders.locator('[data-cy="manually-edit-order-btn"]');

  await expect(editButton).toBeEnabled();
  await editButton.click();

  const form = page
    .locator("mat-dialog-container")
    .filter({
      hasText: "Edytuj zamówienie",
    })
    .last();

  await expect(form).toBeVisible();

  return form;
}

export async function saveOrderEdit(form: Locator): Promise<void> {
  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);
}

export async function deleteOrder(
  page: Page,
  orderId: string,
): Promise<"DELETED" | "ALREADY_ABSENT"> {
  const orders = await openOrders(page);

  /*
   * Po otwarciu szkoły Octopus może jeszcze
   * przez chwilę ładować dane zamówień.
   */
  await page
    .locator("#spinner.backdrop")
    .waitFor({
      state: "hidden",
      timeout: 20_000,
    })
    .catch(() => undefined);

  const row = orderRow(orders, orderId);

  /*
   * Nie robimy natychmiastowego row.count().
   *
   * Tabela może być widoczna, ale jej dane
   * mogą jeszcze nie być wyrenderowane.
   */
  const appeared = await expect
    .poll(async () => await row.count(), {
      timeout: 10_000,
      intervals: [100, 250, 500, 1_000],
      message: `Oczekiwanie na zamówienie ${orderId} przed cleanupem`,
    })
    .toBe(1)
    .then(() => true)
    .catch(() => false);

  if (!appeared) {
    return "ALREADY_ABSENT";
  }

  await expect(row, `Zamówienie ${orderId} powinno istnieć przed usunięciem`).toHaveCount(1);

  await row.click();

  const deleteButton = orders.getByRole("button", {
    name: "Usuń",
    exact: true,
  });

  await expect(
    deleteButton,
    `Przycisk Usuń powinien być aktywny dla zamówienia ${orderId}`,
  ).toBeEnabled();

  await deleteButton.click();

  const confirmation = page.locator("mat-dialog-container").last();

  const dialogAppeared = await confirmation
    .waitFor({
      state: "visible",
      timeout: 1500,
    })
    .then(() => true)
    .catch(() => false);

  if (dialogAppeared) {
    const confirmButton = confirmation.getByRole("button", {
      name: /^(Tak|Usuń|OK)$/,
    });

    await expect(confirmButton).toBeVisible();

    await confirmButton.click();

    await expect(confirmation).toHaveCount(0);
  }

  /*
   * Czekamy na faktyczne zniknięcie
   * tego konkretnego zamówienia.
   */
  await expect(
    orderRow(orders, orderId),
    `Zamówienie ${orderId} powinno zniknąć po usunięciu`,
  ).toHaveCount(0);

  return "DELETED";
}

export async function expectOrderFilterInvalid(
  form: Locator,
  key: Exclude<OrderFilterKey, "classes">,
): Promise<void> {
  const combobox = orderFilterCombobox(form, key);

  const ariaInvalid = await combobox.getAttribute("aria-invalid");

  if (ariaInvalid !== null) {
    await expect(combobox).toHaveAttribute("aria-invalid", "true");

    return;
  }

  const field = combobox.locator("xpath=ancestor::mat-form-field[1]");

  await expect(field).toHaveClass(/invalid/);
}

export function attachmentByName(form: Locator, fileName: string): Locator {
  return form.getByText(fileName, {
    exact: true,
  });
}

export async function uploadOrderAttachment(
  page: Page,
  form: Locator,
  file: UploadPayload,
): Promise<void> {
  const chooserPromise = page.waitForEvent("filechooser");

  await form
    .getByRole("button", {
      name: "Dodaj plik",
      exact: true,
    })
    .click();

  const chooser = await chooserPromise;

  await chooser.setFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: file.buffer,
  });

  const success = page.locator("mat-dialog-container").filter({
    hasText: "Dokument załączony poprawnie.",
  });

  await expect(success).toBeVisible();

  await success
    .getByRole("button", {
      name: "Zamknij",
      exact: true,
    })
    .click();

  await expect(success).toHaveCount(0);

  await expect(attachmentByName(form, file.name)).toBeVisible();
}

export async function uploadOrderAttachmentExpectRejected(
  page: Page,
  form: Locator,
  file: UploadPayload,
): Promise<void> {
  const chooserPromise = page.waitForEvent("filechooser");

  await form
    .getByRole("button", {
      name: "Dodaj plik",
      exact: true,
    })
    .click();

  const chooser = await chooserPromise;

  await chooser.setFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: file.buffer,
  });

  /*
   * Zarówno błędny format, jak i błędny rozmiar
   * pokazują ten sam typ dialogu.
   */
  const errorDialog = page
    .locator("mat-dialog-container")
    .filter({
      hasText: "Błąd podczas załączania dokumentu",
    })
    .last();

  await expect(
    errorDialog,
    `Dla pliku ${file.name} powinien pojawić się komunikat o błędzie`,
  ).toBeVisible();

  /*
   * Nie sprawdzamy całego tekstu 1:1,
   * ponieważ Octopus pokazuje różne warianty
   * komunikatu dla błędnego typu i rozmiaru.
   *
   * Sprawdzamy tylko wspólny kontrakt komunikatu.
   */

  await expect(errorDialog).toContainText(/Dozwolone formaty(?: plików)?:\s*PDF,\s*JPG,\s*PNG\./);

  await expect(errorDialog).toContainText(/Maksymalny rozmiar:\s*10 MB\./);

  await expect(errorDialog).toContainText(/Spróbuj ponownie\./);

  /*
   * Odrzucony plik nie może znaleźć się
   * na liście załączników.
   */
  await expect(
    attachmentByName(form, file.name),
    `Plik ${file.name} nie powinien zostać dodany do załączników`,
  ).toHaveCount(0);

  /*
   * Formularz zamówienia nadal istnieje.
   */
  await expect(form).toBeVisible();

  /*
   * Zamykamy dialog błędu.
   */
  const closeButton = errorDialog.getByRole("button", {
    name: "Zamknij",
    exact: true,
  });

  await expect(closeButton).toBeVisible();

  await closeButton.click();

  /*
   * Dialog może nadal istnieć w DOM,
   * ale nie może być widoczny.
   */
  await expect(errorDialog).toBeHidden();

  /*
   * Po zamknięciu błędu nadal jesteśmy
   * w formularzu dodawania zamówienia.
   */
  await expect(form).toBeVisible();

  /*
   * I nadal nie ma odrzuconego pliku.
   */
  await expect(attachmentByName(form, file.name)).toHaveCount(0);
}

export async function removeOrderAttachment(
  page: Page,
  form: Locator,
  fileName: string,
): Promise<void> {
  const name = attachmentByName(form, fileName);

  await expect(name, `Załącznik ${fileName} powinien być widoczny przed usunięciem`).toBeVisible();

  const row = name.locator("xpath=parent::*");

  /*
   * Kliknięcie czerwonego X przy pliku.
   */
  const button = row.getByRole("button").last();

  if (await button.count()) {
    await button.click();
  } else {
    const icon = row
      .locator("mat-icon")
      .filter({
        hasText: /^(close|clear|delete)$/,
      })
      .last();

    if (await icon.count()) {
      await icon.click();
    } else {
      await row
        .getByText("×", {
          exact: true,
        })
        .click();
    }
  }

  /*
   * Po kliknięciu X aplikacja pokazuje
   * osobny dialog potwierdzający usunięcie.
   */
  const confirmation = page
    .locator("mat-dialog-container")
    .filter({
      hasText: "Usuwanie dokumentu",
    })
    .last();

  await expect(
    confirmation,
    "Powinien pojawić się dialog potwierdzający usunięcie dokumentu",
  ).toBeVisible();

  await expect(confirmation).toContainText("Czy na pewno chcesz usunąć ten dokument?");

  /*
   * Potwierdzamy usunięcie.
   */
  await confirmation
    .getByRole("button", {
      name: "Tak",
      exact: true,
    })
    .click();

  /*
   * Dialog powinien się zamknąć.
   */
  await expect(confirmation).toHaveCount(0);

  /*
   * Dopiero po potwierdzeniu plik
   * powinien zniknąć z listy załączników.
   */
  await expect(
    attachmentByName(form, fileName),
    `Załącznik ${fileName} powinien zniknąć po potwierdzeniu usunięcia`,
  ).toHaveCount(0);
}

export function makeUpload(name: string, mimeType: string, size = 128): UploadPayload {
  return {
    name,
    mimeType,
    buffer: Buffer.alloc(size, 65),
  };
}

export function orderAttachmentIcon(orders: Locator, orderId: string): Locator {
  const row = orderRow(orders, orderId);

  /*
   * Na liście zamówień ikona załącznika znajduje się
   * w ostatniej kolumnie wiersza.
   */
  return row.getByRole("cell").last().locator("mat-icon, .mat-icon, svg").first();
}

export function savedOrderAttachments(form: Locator): Locator {
  /*
   * Po zapisaniu zamówienia Octopus zmienia
   * prezentowaną nazwę pliku na nazwę systemową,
   * np.:
   *
   * 2026/BOK/1020379_1
   */
  return form.getByText(/^\d{4}\/BOK\/\d+_\d+$/);
}

export function orderAttachmentIndicator(orders: Locator, orderId: string): Locator {
  const row = orderRow(orders, orderId);

  /*
   * Ikona załącznika znajduje się
   * w ostatniej kolumnie wiersza zamówienia.
   *
   * Nie szukamy wszystkich ikon w wierszu,
   * ponieważ pierwsza kolumna zawiera również
   * strzałkę rozwijającą pozycje zamówienia.
   */
  return row.getByRole("cell").last().locator("mat-icon, svg, img");
}
