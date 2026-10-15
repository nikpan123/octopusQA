import { apiStep } from "./api-step";
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { test as base, type Scenario } from "./scenario";
import { OCTOPUS_BASE_URL, OCTOPUS_ENV } from "./environment";
import { prepareOrderSchool } from "./order-scenario";
import { expandOrderItems, openOrders, orderRow, ordersPanel } from "./order";

export type ClassProduct = {
  id: number;
  businessCode: string;
  title: string;
  classes: number[] | null;
  classesNames?: string | null;
  isDel: boolean;
};
export type ClassLine = { product: ClassProduct; quantity: number };
type SavedOrder = { id: number; orderItems: Array<{ dictOrderItemId: number; quantity: number }> };

export class OrderClassApi {
  readonly owned = new Set<string>();
  constructor(
    private readonly request: APIRequestContext,
    private readonly headers: Record<string, string>,
    private readonly userId: number,
    readonly school: { id: string; name: string },
    private readonly scenario: Scenario,
    private readonly liveHeaders?: () => Promise<Record<string, string>>,
  ) {
    expect(school.name).toMatch(
      new RegExp(`^AUTO_(?:ORD_REFERENCE_|CAT_${OCTOPUS_ENV.toUpperCase()}_ENT_)`),
    );
  }

  private url(endpoint: string) {
    return `${OCTOPUS_BASE_URL}/api/${endpoint}`;
  }

  private async requestHeaders() {
    return this.liveHeaders ? this.liveHeaders() : this.headers;
  }

  async catalog(filter: Record<string, unknown>): Promise<ClassProduct[]> {
    const response = await this.request.get(this.url("Order/GetItemOrders"), {
      headers: await this.requestHeaders(),
      params: { filterModel: JSON.stringify({ page: 1, limit: 500, ...filter }) },
    });
    expect(response.ok(), "Odczyt katalogu produktów").toBe(true);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    return body.data;
  }

  async product(code: string, classes: number[]): Promise<ClassProduct> {
    const matches = (await this.catalog({ title: code })).filter(
      (product) => product.businessCode === code && !product.isDel,
    );
    expect(matches, `Jednoznaczny aktywny produkt ${code}`).toHaveLength(1);
    expect(
      [...(matches[0].classes ?? [])].sort((a, b) => a - b),
      `Klasy katalogowe produktu ${code}`,
    ).toEqual([...classes].sort((a, b) => a - b));
    return matches[0];
  }

  async classless(): Promise<ClassProduct> {
    const code = process.env.OCTOPUS_ORDER_CLASSLESS_CODE ?? "testhurtC";
    const response = await this.request.get(this.url("Order/GetItemOrdersForOrderPanel"), {
      headers: await this.requestHeaders(),
      params: { filterModel: JSON.stringify({ title: code, page: 1, limit: 500 }) },
    });
    expect(
      response.ok(),
      "Odczyt rzeczywistego przypisania klas z katalogu administracyjnego",
    ).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    const matches = (body.data as ClassProduct[]).filter(
      (product) => !product.isDel && product.businessCode === code,
    );
    expect(matches, `Jednoznaczny produkt bez klasy ${code}`).toHaveLength(1);
    const product = matches[0];
    // classes w wyszukiwaniu zamówień może zawierać domyślnie 0–8, także dla
    // produktu bez przypisanych klas. O pustej klasie świadczy classesNames
    // zwracane przez panel administracyjny, a nie długość tamtej listy.
    expect(Object.hasOwn(product, "classesNames"), "API musi jawnie zwrócić przypisanie klas").toBe(
      true,
    );
    expect(product.classesNames ?? "", `Produkt ${code} musi mieć pustą klasę w katalogu`).toBe("");
    expect(product.businessCode).not.toMatch(/^zestaw$/i);
    const orderProducts = await this.catalog({ id: product.id, limit: 1 });
    expect(orderProducts).toHaveLength(1);
    expect(orderProducts[0].id).toBe(product.id);
    expect(orderProducts[0].businessCode).toBe(code);
    expect(orderProducts[0].isDel).toBe(false);
    return product;
  }

  async orders(): Promise<SavedOrder[]> {
    const response = await this.request.get(this.url("SchoolOrder/GetSchoolOrders"), {
      headers: await this.requestHeaders(),
      params: {
        model: JSON.stringify({ institutionId: Number(this.school.id), page: 1, pageSize: 500 }),
      },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    return body.data;
  }

  async save(lines: ClassLine[], orderId?: string): Promise<string> {
    return await apiStep(
      "API: zapis zamówienia i sprawdzenie zapisanych pozycji oraz ilości",
      async () => {
        if (orderId)
          expect(
            this.owned.has(orderId),
            "Edycja tylko zamówienia utworzonego przez ten test",
          ).toBe(true);
        expect(lines.length).toBeGreaterThan(0);
        for (const { product } of lines)
          expect(
            product.businessCode.trim(),
            "Testy Klasy wymagają pojedynczego produktu, nie kolekcji Zestaw rozwijanej przy zapisie",
          ).not.toMatch(/^zestaw$/i);
        const payload = {
          institutionId: Number(this.school.id),
          createdBy: this.userId,
          createdAt: new Date().toISOString(),
          ...(orderId ? { institutionOrderId: Number(orderId) } : {}),
          orderItems: lines.map(({ product, quantity }) => ({
            dictOrderItemId: product.id,
            businessCode: product.businessCode,
            quantity,
          })),
        };
        const response = await this.request.post(
          this.url(`SchoolOrder/${orderId ? "UpdateSchoolOrder" : "AddSchoolOrder"}`),
          {
            headers: await this.requestHeaders(),
            data: payload,
          },
        );
        expect(response.ok(), "Zapis przygotowania zamówienia przez API").toBe(true);
        // UI korzysta z liczbowego ID zwracanego przez AddSchoolOrder. Bez ponawiania POST.
        const id = orderId ?? String(await response.json());
        expect(id).toMatch(/^\d+$/);
        this.owned.add(id);
        await this.scenario.record(
          `orderClass_${id}`,
          JSON.stringify({ schoolId: this.school.id, payload }),
        );
        await expect
          .poll(async () => {
            const saved = (await this.orders()).find((order) => String(order.id) === id);
            return saved?.orderItems
              .map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity }))
              .sort((a, b) => a.id - b.id);
          })
          .toEqual(
            lines
              .map(({ product, quantity }) => ({ id: product.id, quantity }))
              .sort((a, b) => a.id - b.id),
          );
        return id;
      },
    );
  }

  async remove(orderId: string) {
    return await apiStep(
      "Sprzątanie API: usunięcie własnego zamówienia i sprawdzenie braku zamówienia",
      async () => {
        expect(this.owned.has(orderId), "Usuwanie tylko zamówień bieżącego testu").toBe(true);
        const response = await this.request.delete(this.url("SchoolOrder/DeleteOrder"), {
          headers: await this.requestHeaders(),
          params: { orderId, userId: this.userId },
        });
        expect(response.ok(), `Usunięcie własnego zamówienia ${orderId}`).toBe(true);
        await expect
          .poll(async () => (await this.orders()).some((order) => String(order.id) === orderId))
          .toBe(false);
        this.owned.delete(orderId);
        await this.scenario.record(`orderClassCleanup_${orderId}`, "DELETED");
      },
    );
  }
}

export const test = base.extend<{ classOrders: OrderClassApi }>({
  classOrders: [
    async ({ page, scenario }, use) => {
      const school = await prepareOrderSchool(page, scenario);
      const state = await page.context().storageState();
      const entries = state.origins.find(
        (origin) => origin.origin === OCTOPUS_BASE_URL,
      )?.localStorage;
      expect(entries).toBeDefined();
      const value = (key: string) => {
        const raw = entries!.find((entry) => entry.name === key)?.value;
        expect(raw, `Sesja musi zawierać ${key}`).toBeDefined();
        try {
          return JSON.parse(raw!);
        } catch {
          return raw;
        }
      };
      const token = value("token");
      const userId = Number(value("id"));
      expect(typeof token).toBe("string");
      expect(Number.isSafeInteger(userId) && userId > 0).toBe(true);
      const api = new OrderClassApi(
        page.context().request,
        { Authorization: `Bearer ${token}` },
        userId,
        school,
        scenario,
      );
      try {
        await use(api);
      } finally {
        const errors: unknown[] = [];
        for (const id of [...api.owned].reverse()) {
          try {
            await api.remove(id);
          } catch (error) {
            errors.push(error);
            await scenario.record(`orderClassCleanup_${id}`, "FAILED");
          }
        }
        if (errors.length) throw errors[0];
      }
    },
    { timeout: 180000 },
  ],
});

export async function showClassOrders(page: Page, api: OrderClassApi) {
  await page.goto(`${OCTOPUS_BASE_URL}/school/school-panel/${api.school.id}`);
  await openOrders(page);
  // Tablist jest rodzeństwem wewnętrznego panelu, nie jego potomkiem.
  await page.getByRole("tab", { name: "Zamówienia", exact: true }).last().click();
  return ordersPanel(page);
}

export async function showClassPositions(page: Page) {
  await openOrders(page);
  await page.getByRole("tab", { name: "Pozycje", exact: true }).click();
  return page.getByRole("tabpanel", { name: "Pozycje", exact: true });
}

export async function expectClassCell(
  row: Locator,
  column: "class" | "classesInOrder",
  classes: number[],
) {
  const cell = row.locator(`.mat-column-${column}`);
  await expect(cell).toHaveCount(1);
  if (!classes.length) {
    await expect(cell).toHaveText("");
    return;
  }
  await expect
    .poll(async () =>
      (await cell.innerText())
        .trim()
        .split(/[,;]\s*|\s+/)
        .filter(Boolean),
    )
    .toEqual(classes.map(String));
}

export function classProductRow(table: Locator, product: ClassProduct) {
  return table
    .getByRole("cell", { name: product.title, exact: true })
    .locator("xpath=ancestor::*[@role='row'][1]");
}

export async function expectClassViews(
  page: Page,
  api: OrderClassApi,
  id: string,
  lines: Array<{ product: ClassProduct; classes: number[] }>,
) {
  const panel = await showClassOrders(page, api);
  const aggregate = [...new Set(lines.flatMap((line) => line.classes))].sort((a, b) => a - b);
  await expectClassCell(orderRow(panel, id), "classesInOrder", aggregate);
  const detail = await expandOrderItems(panel, id);
  for (const line of lines)
    await expectClassCell(classProductRow(detail, line.product), "class", line.classes);
  const positions = await showClassPositions(page);
  for (const line of lines)
    await expectClassCell(classProductRow(positions, line.product), "class", line.classes);
}
