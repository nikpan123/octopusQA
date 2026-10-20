import { expect, type Page } from "@playwright/test";

import type { Scenario } from "./scenario";
import {
  addOrderProduct,
  deleteOrder,
  getOrderIds,
  openNewOrderForm,
  openOrders,
  orderFilterCombobox,
  saveNewOrder,
  setOrderQuantity,
} from "./order";
import { waitForOctopusIdle } from "./octopus";
import { ensureOrderTestSchool, type OrderTestSchool } from "./order-school";

type TrackOrder = (orderId: string) => Promise<void>;
type MarkOrderCleaned = (orderId: string) => Promise<void>;

export async function prepareOrderSchool(
  page: Page,
  scenario: Scenario,
  key: "primary" | "secondary" = "primary",
  openPanel = true,
) {
  const school = await ensureOrderTestSchool(page, scenario.app, key, openPanel);

  await scenario.record(key === "primary" ? "orderSchoolId" : "orderSecondarySchoolId", school.id);
  await scenario.record(
    key === "primary" ? "orderSchoolName" : "orderSecondarySchoolName",
    school.name,
  );

  return school;
}

export async function withOrderCleanup(
  page: Page,
  scenario: Scenario,
  school: OrderTestSchool,
  body: (track: TrackOrder, markCleaned: MarkOrderCleaned) => Promise<void>,
) {
  const createdOrderIds: string[] = [];

  const track: TrackOrder = async (orderId) => {
    if (!createdOrderIds.includes(orderId)) createdOrderIds.push(orderId);
    await scenario.record(`orderId_${createdOrderIds.indexOf(orderId) + 1}`, orderId);
  };

  const markCleaned: MarkOrderCleaned = async (orderId) => {
    const index = createdOrderIds.indexOf(orderId);
    if (index !== -1) createdOrderIds.splice(index, 1);
    await scenario.record(`orderCleanup_${orderId}`, "DELETED_IN_TEST");
  };

  const cleanupErrors: unknown[] = [];

  try {
    await body(track, markCleaned);
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
  }

  if (cleanupErrors.length > 0) throw cleanupErrors[0];
}

export async function createSimpleOrder(page: Page, code: string, quantity = "1") {
  await openOrders(page);
  await waitForOctopusIdle(page);

  const beforeIds = await getOrderIds(page);
  const form = await openNewOrderForm(page);
  const title = await addOrderProduct(form, code);

  await setOrderQuantity(form, code, quantity);
  const orderId = await saveNewOrder(page, form, beforeIds);

  return { orderId, title };
}

export async function expectFilterReset(
  form: Awaited<ReturnType<typeof openNewOrderForm>>,
): Promise<void> {
  await expect(orderFilterCombobox(form, "subject")).toContainText("Wybierz z listy");
  await expect(orderFilterCombobox(form, "level")).toContainText("Wybierz z listy");
  await expect(orderFilterCombobox(form, "classes")).toContainText("Wybierz z listy");
  await expect(form.getByPlaceholder("Wpisz", { exact: true })).toHaveValue("");
}
