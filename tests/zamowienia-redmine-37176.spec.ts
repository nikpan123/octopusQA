import { test, expect } from "./support/scenario";
import {
  addOrderProduct,
  cancelOrderForm,
  getOrderIds,
  openNewOrderForm,
  openOrders,
  orderQuantityInput,
} from "./support/order";
import { prepareOrderSchool, withOrderCleanup } from "./support/order-scenario";
import { ORDER_PRODUCTS } from "./data/order-product-data";
import { waitForOctopusIdle } from "./support/octopus";
import type { Request } from "@playwright/test";

for (const sample of [
  { id: "01", quantity: "-1" },
  { id: "02", quantity: "-10" },
]) {
  test(`ORD-BUG-37176-${sample.id}: ujemna ilość ${sample.quantity} nie pozwala utworzyć zamówienia @school @order @quantity @regression @redmine-37176`, async ({
    page,
    scenario: s,
  }, info) => {
    info.annotations.push({ type: "redmine", description: "#37176" });
    await s.record("redmineIssue", "37176");
    await s.record("invalidQuantity", sample.quantity);
    const school = await test.step("Przygotowanie: dedykowana szkoła testowa", () =>
      prepareOrderSchool(page, s));
    await openOrders(page);
    await waitForOctopusIdle(page);
    const before = (await getOrderIds(page)).sort();
    const submissions: string[] = [];
    const isSave = (request: Request) =>
      request.method() !== "GET" && /\/SchoolOrder\/AddSchoolOrder(?:\?|$)/i.test(request.url());
    const observe = (request: Request) => {
      if (isSave(request)) submissions.push(request.url());
    };

    await withOrderCleanup(page, s, school, async (track) => {
      page.on("request", observe);
      try {
        const form = await openNewOrderForm(page);
        const code = ORDER_PRODUCTS.physics7.products[1].code;
        await addOrderProduct(form, code);
        const input = orderQuantityInput(form, code);
        await test.step(`Wpisanie ${sample.quantity} i zakończenie edycji pola Ilość`, async () => {
          await input.fill(sample.quantity);
          await input.press("Tab");
        });
        const value = await input.inputValue();
        await s.record("quantityAfterBlur", value);

        if (Number(value) > 0) {
          // Odrzucenie ujemnej wartości już w polu także chroni przed tym błędem.
          await s.record("validationMode", "NEGATIVE_INPUT_REJECTED_OR_NORMALIZED");
          await expect(input).not.toHaveValue(sample.quantity);
        } else {
          const save = form.getByRole("button", { name: "Zapisz", exact: true });
          if (await save.isEnabled()) {
            await test.step("Próba zapisu mimo nieprawidłowej ilości", async () => {
              // Czekamy na rzeczywistą odpowiedź, jeśli formularz wysłał zapis.
              // Brak żądania oznacza blokadę w przeglądarce, a nie sukces API.
              const response = page.waitForResponse((r) => isSave(r.request()), { timeout: 5_000 });
              const settled = response.then(
                (r) => ({ response: r, error: null }),
                (error: unknown) => ({ response: null, error }),
              );
              await save.click();
              const result = await settled;
              if (result.error && submissions.length) throw result.error;
              if (
                result.error &&
                !(result.error instanceof Error && result.error.name === "TimeoutError")
              ) {
                throw result.error;
              }
              await s.record(
                "saveHttpStatus",
                result.response ? String(result.response.status()) : "NO_REQUEST",
              );
            });
          } else {
            await s.record("validationMode", "SAVE_DISABLED");
          }
          await test.step("Nieprawidłowy formularz pozostaje otwarty", async () => {
            await expect(form).toBeVisible();
          });
        }

        await info.attach("Redmine-37176-formularz", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
        await cancelOrderForm(form);
        await s.app.openPanel("school", school.id);
        await openOrders(page);
        await waitForOctopusIdle(page);
        const after = (await getOrderIds(page)).sort();
        await info.attach("Redmine-37176-dowod", {
          body: JSON.stringify(
            {
              issue: 37176,
              quantity: sample.quantity,
              valueAfterBlur: value,
              before,
              after,
              submissions: submissions.length,
            },
            null,
            2,
          ),
          contentType: "application/json",
        });
        await test.step("Ponowny odczyt szkoły: żadne nowe zamówienie nie zostało zapisane", async () => {
          expect(after).toEqual(before);
        });
      } finally {
        page.off("request", observe);
        // Odkrywamy również zamówienie zapisane przez błąd, zanim asercja przerwała test.
        await info.attach("Redmine-37176-stan-koncowy", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
        await s.app.openPanel("school", school.id);
        await openOrders(page);
        await waitForOctopusIdle(page);
        for (const id of await getOrderIds(page)) {
          if (!before.includes(id)) await track(id);
        }
      }
    });
  });
}
