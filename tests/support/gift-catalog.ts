import { randomUUID } from "node:crypto";
import type { Page, Locator, TestInfo } from "@playwright/test";
import { expect, test } from "./fixtures";
import { readGiftCatalogDatabase } from "../../scripts/gift-catalog-db.mjs";

export type GiftData = {
  title: string;
  businessCode: string;
  promotionCode: string;
  weight: string;
  classes: string[];
};
export const ALL_GIFT_CLASSES = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
export function newGiftData(): GiftData {
  const key = randomUUID().slice(0, 8);
  return {
    title: `AUTO Gratis ${key}`,
    businessCode: `AUTO-${key}`,
    promotionCode: `AT-${key}`,
    weight: "123",
    classes: ["4"],
  };
}

export class GiftCatalog {
  readonly view: Locator;
  readonly owned = new Set<string>();
  constructor(
    readonly page: Page,
    readonly info: TestInfo,
  ) {
    this.view = page.locator("order-items");
  }
  async open() {
    await this.page.goto("/order/order-panel");
    await this.page.getByRole("tab", { name: "Gratisy", exact: true }).click();
    await expect(this.view.locator(".ag-row").first()).toBeVisible();
  }
  async search(field: string, value: string) {
    await this.view.locator(`#${field}`).fill(value);
    const response = this.page.waitForResponse((r) =>
      r.url().includes("/Order/GetItemOrdersForOrderPanel"),
    );
    await this.view.getByRole("button", { name: "Szukaj", exact: true }).click();
    expect((await response).ok()).toBeTruthy();
  }
  row(code: string) {
    return this.view.locator(".ag-center-cols-container .ag-row").filter({
      has: this.page.locator('[col-id="businessCode"]').getByText(code, { exact: true }),
    });
  }
  async select(dialog: Locator, id: string, option: string, multiple = false) {
    await dialog.locator(`#${id}`).click();
    await this.page.getByRole("option", { name: option, exact: true }).click();
    if (multiple) await this.page.keyboard.press("Escape");
  }
  async fill(data: GiftData) {
    const dialog = this.page.getByRole("dialog");
    await dialog.locator('[data-cy="title-input"]').fill(data.title);
    await this.select(dialog, "subject_combo", "Matematyka");
    await this.select(dialog, "level_combo", "Szkoła Podstawowa");
    await this.setClasses(data.classes);
    await dialog.locator('[data-cy="business-code-input"]').fill(data.businessCode);
    await dialog.locator('[data-cy="promotion-code-input"]').fill(data.promotionCode);
    await dialog.locator('[data-cy="weight-input"]').fill(data.weight);
  }
  async setClasses(classes: string[]) {
    await this.page.getByRole("dialog").locator("#class_combo").click();
    await expect(this.page.getByRole("option")).toHaveText(
      ALL_GIFT_CLASSES.map((value) => new RegExp(`^\\s*${value}\\s*$`)),
    );
    for (const value of ALL_GIFT_CLASSES) {
      const option = this.page.getByRole("option", { name: value, exact: true });
      const selected = classes.includes(value);
      if ((await option.getAttribute("aria-selected")) !== String(selected)) await option.click();
      await expect(option).toHaveAttribute("aria-selected", String(selected));
    }
    await this.page.keyboard.press("Escape");
  }
  async checkSelectedClasses(classes: string[]) {
    await this.page.getByRole("dialog").locator("#class_combo").click();
    await expect(this.page.getByRole("option")).toHaveCount(ALL_GIFT_CLASSES.length);
    for (const value of ALL_GIFT_CLASSES)
      await expect(this.page.getByRole("option", { name: value, exact: true })).toHaveAttribute(
        "aria-selected",
        String(classes.includes(value)),
      );
    await this.page.keyboard.press("Escape");
  }
  async checkClassColumn(code: string, classes: string[]) {
    const all =
      classes.length === ALL_GIFT_CLASSES.length &&
      ALL_GIFT_CLASSES.every((value) => classes.includes(value));
    const expected = all ? [] : [...classes].sort();
    const cell = this.row(code).locator('[col-id="classesNames"]');
    await expect
      .poll(
        async () => {
          const text = (await cell.innerText()).trim();
          return text === ""
            ? []
            : text
                .split(",")
                .map((value) => value.trim())
                .sort();
        },
        { message: "Kolumna Klasa zawiera dokładnie oczekiwane klasy, niezależnie od kolejności" },
      )
      .toEqual(expected);
  }
  async save() {
    const response = this.page.waitForResponse(
      (r) => r.url().includes("/Order/AddItemOrder") && r.request().method() === "POST",
    );
    await this.page
      .getByRole("dialog")
      .getByRole("button", { name: "Zapisz", exact: true })
      .click();
    const result = await response;
    expect(result.ok()).toBeTruthy();
    await expect(this.page.getByRole("dialog")).toHaveCount(0);
    return result.request().postDataJSON() as { subjectId: number; levelId: number };
  }
  async add(data: GiftData) {
    this.owned.add(data.businessCode);
    await this.view.getByRole("button", { name: "Dodaj nowy gratis", exact: true }).click();
    await this.fill(data);
    const payload = await this.save();
    await this.search("businessCode", data.businessCode);
    await expect(this.row(data.businessCode)).toHaveCount(1);
    return payload;
  }
  async check(data: GiftData, payload: { subjectId: number; levelId: number }) {
    const row = this.row(data.businessCode);
    await expect(row.locator('[col-id="title"]')).toHaveText(data.title);
    await expect(row.locator('[col-id="promotionCode"]')).toHaveText(data.promotionCode);
    await expect(row.locator('[col-id="weight"]')).toHaveText(`${data.weight}g`);
    await expect(row.locator('[col-id="levelSymbolName"]')).toHaveText("SP");
    await expect(row.locator('[col-id="subjectSymbol"]')).toHaveText("MAT");
    await this.checkClassColumn(data.businessCode, data.classes);
    const id = Number(await row.locator('[col-id="id"]').first().innerText());
    const records = await readGiftCatalogDatabase(id);
    await this.info.attach(`gratis-${id}-SQL`, {
      body: JSON.stringify(records, null, 2),
      contentType: "application/json",
    });
    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record).toMatchObject({
      id,
      title: data.title,
      businessCode: data.businessCode,
      promotionCode: data.promotionCode,
      weight: Number(data.weight),
      isDel: false,
    });
    expect(JSON.parse(record.subjects)).toEqual([{ subjectId: payload.subjectId }]);
    expect(
      (JSON.parse(record.classes) as { class: number; levelId: number }[]).sort(
        (a, b) => a.class - b.class || a.levelId - b.levelId,
      ),
    ).toEqual(
      data.classes
        .map((value) => ({ class: Number(value), levelId: payload.levelId }))
        .sort((a, b) => a.class - b.class || a.levelId - b.levelId),
    );
    return id;
  }
  async remove(code: string, cancel = false) {
    if (!this.owned.has(code))
      throw new Error("Usuwanie dozwolone wyłącznie dla gratisu utworzonego przez bieżący test.");
    const row = this.row(code);
    await row
      .locator("mat-icon")
      .filter({ hasText: /^delete$/ })
      .click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toContainText("Czy na pewno chcesz usunąć gratis?");
    if (cancel) {
      await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
      return;
    }
    const response = this.page.waitForResponse((r) => r.url().includes("/Order/DeleteOrderItem"));
    await dialog.getByRole("button", { name: "Tak", exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(row).toHaveCount(0);
    this.owned.delete(code);
  }
  async cleanup() {
    // Ponowne otwarcie zamyka również niezapisany formularz po nieudanym kroku.
    // Nie klikamy ponownie Anuluj, gdy poprzednie zamknięcie jeszcze się kończy.
    if (this.owned.size) await this.open();
    for (const code of this.owned)
      await test.step(`Sprzątanie: usuń własny gratis ${code} przez śmietnik`, async () => {
        await this.view.getByRole("button", { name: "Wyczyść filtry", exact: true }).click();
        await this.search("businessCode", code);
        if (await this.row(code).count()) await this.remove(code);
      });
  }
}
