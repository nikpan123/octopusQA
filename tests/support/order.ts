import { expect, type Locator, type Page } from "@playwright/test";

export type ExpectedOrderItem = {
  code: string;
  title: string;
  quantity: string;
};

export function ordersPanel(page: Page): Locator {
  return page
    .getByRole("tabpanel", { name: "Zamówienia", exact: true })
    .last();
}

export async function openOrders(page: Page): Promise<Locator> {
  await page.getByRole("tab", { name: "Zamówienia", exact: true }).click();
  return ordersPanel(page);
}

export async function openNewOrderForm(page: Page): Promise<Locator> {
  const orders = await openOrders(page);
  await orders.getByRole("button", { name: "Dodaj", exact: true }).click();

  const form = page.locator("mat-dialog-container").filter({
    hasText: "Dodaj zamówienie",
  });
  await expect(form).toBeVisible();
  return form;
}

function availableProducts(form: Locator): Locator {
  return form
    .getByRole("columnheader", { name: "Dodaj", exact: true })
    .locator("xpath=ancestor::*[@role='treegrid'][1]");
}

export function selectedProducts(form: Locator): Locator {
  return form
    .getByRole("columnheader", { name: "Ilość", exact: true })
    .locator("xpath=ancestor::*[@role='treegrid'][1]");
}

export async function addOrderProduct(
  form: Locator,
  code: string,
): Promise<string> {
  const searchInput = form.getByPlaceholder("Wpisz", { exact: true });
  await searchInput.fill(code);
  await form.getByRole("button", { name: "Szukaj", exact: true }).click();

  const product = availableProducts(form)
    .getByRole("gridcell", { name: code, exact: true })
    .locator("xpath=ancestor::*[@role='row'][1]");
  await expect(product).toHaveCount(1);

  const title = (await product.getByRole("gridcell").nth(3).innerText()).trim();
  expect(title).not.toBe("");

  await product.getByRole("checkbox").check();
  await form
    .locator("mat-icon")
    .filter({ hasText: /^arrow_right$/ })
    .locator("xpath=ancestor::button[1]")
    .click();

  return title;
}

export async function setOrderQuantity(
  form: Locator,
  code: string,
  quantity: string,
): Promise<void> {
  const product = selectedProducts(form)
    .getByRole("gridcell", { name: code, exact: true })
    .locator("xpath=ancestor::*[@role='row'][1]");
  await expect(product).toHaveCount(1);

  const input = product.getByRole("spinbutton");
  await input.click();
  await input.fill(quantity);
  await input.press("Tab");
  await expect(input).toHaveValue(quantity);
}

export async function saveNewOrder(
  page: Page,
  form: Locator,
): Promise<string> {
  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toHaveCount(0);

  const saved = ordersPanel(page).locator("td.mat-column-id");
  await expect(saved).toHaveCount(1);
  const orderId = (await saved.innerText()).trim();
  expect(orderId).toMatch(/^\d+$/);
  return orderId;
}

export function orderRow(orders: Locator, orderId: string): Locator {
  return orders
    .getByRole("cell", { name: orderId, exact: true })
    .locator("xpath=ancestor::*[@role='row'][1]");
}

export async function expandOrderItems(
  orders: Locator,
  orderId: string,
): Promise<Locator> {
  const row = orderRow(orders, orderId);
  await expect(row).toHaveCount(1);
  await row
    .locator("mat-icon")
    .filter({ hasText: "keyboard_arrow_down" })
    .click();

  return orders
    .getByRole("columnheader", { name: "Ilość", exact: true })
    .last()
    .locator("xpath=ancestor::*[@role='table'][1]");
}

export async function expectOrderItems(
  items: Locator,
  expectedItems: readonly ExpectedOrderItem[],
): Promise<void> {
  await expect(items.locator("tbody > tr")).toHaveCount(expectedItems.length);

  for (const expectedItem of expectedItems) {
    const item = items
      .getByRole("cell", { name: expectedItem.code, exact: true })
      .locator("xpath=ancestor::*[@role='row'][1]");
    await expect(item).toHaveCount(1);
    await expect(item.getByRole("cell").nth(0)).toHaveText(expectedItem.title);
    await expect(item.getByRole("cell").nth(4)).toHaveText(
      expectedItem.quantity,
    );
  }
}

export async function openOrderEdit(
  page: Page,
  orderId: string,
): Promise<Locator> {
  const orders = ordersPanel(page);
  const row = orderRow(orders, orderId);
  await expect(row).toHaveCount(1);
  await row.click();

  const editButton = orders.locator('[data-cy="manually-edit-order-btn"]');
  await expect(editButton).toBeEnabled();
  await editButton.click();

  const form = page.locator("mat-dialog-container").last();
  await expect(form).toBeVisible();
  return form;
}

export async function saveOrderEdit(form: Locator): Promise<void> {
  await form.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(form).toHaveCount(0);
}

export async function deleteOrder(
  page: Page,
  orderId: string,
): Promise<"DELETED" | "ALREADY_ABSENT"> {
  const orders = ordersPanel(page);
  const row = orderRow(orders, orderId);
  if ((await row.count()) === 0) return "ALREADY_ABSENT";

  await expect(row).toHaveCount(1);
  await row.click();

  const deleteButton = orders.getByRole("button", {
    name: "Usuń",
    exact: true,
  });
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  const confirmation = page.locator("mat-dialog-container").last();
  const dialogAppeared = await confirmation
    .waitFor({ state: "visible", timeout: 1500 })
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

  await expect(orderRow(orders, orderId)).toHaveCount(0);
  return "DELETED";
}
