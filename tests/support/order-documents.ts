import { deflateSync } from "node:zlib";
import { apiStep } from "./api-step";
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { test as base, type OrderClassApi } from "./order-class";
import type { Scenario } from "./scenario";
import { OCTOPUS_BASE_URL } from "./environment";
import { orderRow } from "./order";

export type DocumentFile = { name: string; mimeType: string; buffer: Buffer };
export type StoredDocument = {
  id: number;
  fileName: string;
  fileData: string;
  contentType: string;
};
export type DocumentOrder = {
  id: number;
  createdByName: string;
  createdAt: string;
  cmsOrderSymbol?: string;
  fileStorage: StoredDocument[];
};
export type DocumentTarget = { kind: "school" | "teacher"; id: string; teacherId?: string };

function png(seed: number) {
  const crc = (buffer: Buffer) => {
    let value = 0xffffffff;
    for (const byte of buffer) {
      value ^= byte;
      for (let i = 0; i < 8; i++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    return (value ^ 0xffffffff) >>> 0;
  };
  const chunk = (name: string, data: Buffer) => {
    const type = Buffer.from(name);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.from([0, seed % 256, 80, 160]))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function jpeg() {
  const segment = (marker: number, data: number[]) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(data.length + 2);
    return Buffer.concat([Buffer.from([255, marker]), length, Buffer.from(data)]);
  };
  const counts = [1, ...Array<number>(15).fill(0)];
  return Buffer.concat([
    Buffer.from([255, 216]),
    segment(219, [0, ...Array<number>(64).fill(1)]),
    segment(192, [8, 0, 1, 0, 1, 1, 1, 17, 0]),
    segment(196, [0, ...counts, 0, 16, ...counts, 0]),
    segment(218, [1, 1, 0, 0, 63, 0]),
    Buffer.from([63, 255, 217]),
  ]);
}

function pdf(seed: number) {
  const stream = `BT /F1 12 Tf 20 40 Td (Octopus test ${seed}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let text = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(text));
    text += `${i + 1} 0 obj\n${object}\nendobj\n`;
  }
  const start = Buffer.byteLength(text);
  text += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((value) => `${String(value).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(text);
}

export function documentFile(
  extension: "pdf" | "png" | "jpg",
  seed = 1,
  name = `test-document-${seed}.${extension}`,
): DocumentFile {
  return {
    name,
    mimeType:
      extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : "image/jpeg",
    buffer: extension === "pdf" ? pdf(seed) : extension === "png" ? png(seed) : jpeg(),
  };
}

export class OrderDocuments {
  private teacherId?: string;
  private teacherOrders = new Set<string>();
  private fileOwners = new Map<number, DocumentTarget>();
  constructor(
    readonly page: Page,
    readonly schoolOrders: OrderClassApi,
    readonly scenario: Scenario,
    private request: APIRequestContext,
    private headers: Record<string, string>,
    readonly userId: number,
  ) {}

  private url(endpoint: string) {
    return `${OCTOPUS_BASE_URL}/api/${endpoint}`;
  }
  async get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const response = await this.request.get(this.url(endpoint), { headers: this.headers, params });
    expect(response.ok(), `GET ${endpoint}`).toBe(true);
    return response.json();
  }
  private owns(target: DocumentTarget) {
    expect(
      target.kind === "school"
        ? this.schoolOrders.owned.has(target.id)
        : this.teacherOrders.has(target.id),
      "Modyfikujemy tylko zamówienie bieżącego testu",
    ).toBe(true);
    if (target.kind === "teacher") expect(target.teacherId).toBe(this.teacherId);
  }
  async schoolRecords(schoolId = this.schoolOrders.school.id) {
    const body = await this.get<{ data: DocumentOrder[] }>("SchoolOrder/GetSchoolOrders", {
      model: JSON.stringify({ institutionId: Number(schoolId), page: 1, pageSize: 500 }),
    });
    expect(Array.isArray(body.data)).toBe(true);
    return body.data;
  }
  async teacherRecords() {
    expect(this.teacherId).toBeDefined();
    const body = await this.get<{ data: DocumentOrder[] }>("TeacherOrder/GetNotDel", {
      filterModel: JSON.stringify({ teacherId: Number(this.teacherId), limit: 500, page: 1 }),
    });
    expect(Array.isArray(body.data)).toBe(true);
    return body.data;
  }
  async record(target: DocumentTarget) {
    const rows =
      target.kind === "school" ? await this.schoolRecords() : await this.teacherRecords();
    const row = rows.find((item) => String(item.id) === target.id);
    expect(row, `Zamówienie ${target.id} powinno istnieć`).toBeDefined();
    return row!;
  }
  async files(target: DocumentTarget) {
    const row = await this.record(target);
    expect(Array.isArray(row.fileStorage)).toBe(true);
    return row.fileStorage;
  }
  async attemptUpload(target: DocumentTarget, file: DocumentFile) {
    this.owns(target);
    const teacher = target.kind === "teacher";
    return this.request.post(
      this.url(`FileStorage/${teacher ? "SaveFileForTeacherOrder" : "SaveFileForSchoolOrder"}`),
      {
        headers: this.headers,
        multipart: {
          [teacher ? "teacherOrderId" : "InstitutionOrderId"]: target.id,
          [teacher ? "createdBy" : "CreatedBy"]: String(this.userId),
          [teacher ? "files" : "Files"]: {
            name: file.name,
            mimeType: file.mimeType,
            buffer: file.buffer,
          },
        },
      },
    );
  }
  async upload(target: DocumentTarget, file: DocumentFile) {
    return await apiStep("API: dodanie dokumentu i potwierdzenie zapisu pliku", async () => {
      const before = new Set((await this.files(target)).map((item) => item.id));
      const response = await this.attemptUpload(target, file);
      expect(response.ok(), "Zapis dokumentu przez API").toBe(true);
      await expect
        .poll(async () => (await this.files(target)).filter((item) => !before.has(item.id)).length)
        .toBe(1);
      const stored = (await this.files(target)).find((item) => !before.has(item.id))!;
      this.fileOwners.set(stored.id, target);
      expect(Buffer.from(stored.fileData, "base64")).toEqual(file.buffer);
      expect(stored.contentType).toBe(file.mimeType);
      await this.scenario.record(
        `document_${stored.id}`,
        JSON.stringify({ target, name: stored.fileName, original: file.name }),
      );
      return stored;
    });
  }
  async removeFile(id: number) {
    return await apiStep(
      "API: usunięcie pojedynczego dokumentu i sprawdzenie listy plików",
      async () => {
        const target = this.fileOwners.get(id);
        expect(target, "Usuwamy tylko plik przesłany przez ten test").toBeDefined();
        this.owns(target!);
        const response = await this.request.delete(
          this.url("FileStorage/DeleteFileForSchoolOrSchoolComplexOrTeacherOrder"),
          { headers: this.headers, params: { fileStorageIds: String(id) } },
        );
        expect(response.ok()).toBe(true);
        await expect
          .poll(async () => (await this.files(target!)).some((file) => file.id === id))
          .toBe(false);
        this.fileOwners.delete(id);
      },
    );
  }
  async teacher() {
    this.teacherId ??= await this.scenario.createTeacher(
      this.schoolOrders.school.id,
      this.schoolOrders.school.name,
      { openPanel: false },
    );
    return this.teacherId;
  }
  async statement(withSchool = true): Promise<DocumentTarget> {
    return await apiStep(
      "Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie",
      async () => {
        const teacherId = await this.teacher();
        const contacts = await this.get<
          Array<{ id: number; name: string; dictCategoryContactId: number; isDel: boolean }>
        >("TeacherContacts/GetTeacherContactsToOrders");
        const contact = contacts.find((item) => !item.isDel && item.name === "Gratis od promotora");
        expect(contact, "Wymagany istniejący kontakt Gratis od promotora").toBeDefined();
        const types = await this.get<Array<{ id: number; name: string }>>(
          "TeacherOrder/GetDictTeacherOrderType",
        );
        const type = types.find((item) => item.name === "Normalna");
        expect(type).toBeDefined();
        const product = await this.schoolOrders.product("F7P", [7]);
        const response = await this.request.post(this.url("TeacherOrder/AddTeacherOrder"), {
          headers: this.headers,
          data: {
            teacherId: Number(teacherId),
            cityId: 6,
            street: "",
            number: "AUTO-DOC-TEST",
            zipCode: "61-534",
            createdBy: this.userId,
            email: this.scenario.email,
            createdAt: new Date().toISOString(),
            statusChangedAt: new Date().toISOString(),
            ...(withSchool ? { schoolId: Number(this.schoolOrders.school.id) } : {}),
            typeId: type!.id,
            statusId: 1,
            contactId: contact!.id,
            dictTeacherContactCategoryId: contact!.dictCategoryContactId,
            orderItems: [
              {
                orderItemId: product.id,
                businessCode: product.businessCode,
                quantity: 1,
                reason: "Oświadczenie",
              },
            ],
          },
        });
        expect(response.ok(), "Przygotowanie zablokowanego gratisu z powodem Oświadczenie").toBe(
          true,
        );
        const id = String(await response.json());
        expect(id).toMatch(/^\d+$/);
        this.teacherOrders.add(id);
        await this.scenario.record(
          `teacherStatement_${id}`,
          JSON.stringify({ teacherId, schoolId: withSchool ? this.schoolOrders.school.id : null }),
        );
        await expect
          .poll(async () => (await this.teacherRecords()).some((order) => String(order.id) === id))
          .toBe(true);
        return { kind: "teacher", id, teacherId };
      },
    );
  }
  async removeStatement(target: DocumentTarget) {
    return await apiStep(
      "API: usunięcie oświadczenia i sprawdzenie usunięcia powiązanych danych",
      async () => {
        this.owns(target);
        expect(target.kind).toBe("teacher");
        const response = await this.request.delete(this.url("TeacherOrder/Delete"), {
          headers: this.headers,
          params: { teacherOrderId: target.id },
        });
        expect(response.ok()).toBe(true);
        await expect
          .poll(async () =>
            (await this.teacherRecords()).some((order) => String(order.id) === target.id),
          )
          .toBe(false);
        this.teacherOrders.delete(target.id);
      },
    );
  }
  async moveTeacher(school: { id: string; name: string }) {
    return await apiStep("API: zmiana powiązania nauczyciela ze szkołą", async () => {
      expect(school.name).toMatch(/^AUTO_ORD_(?:REFERENCE_|[DT]_)/);
      expect(this.teacherId).toBeDefined();
      const relation = {
        teacherId: Number(this.teacherId),
        schoolId: Number(school.id),
        reasonId: 84,
        createdBy: String(this.userId),
      };
      const add = await this.request.post(this.url("TeacherSchools/AddTeacherSchool"), {
        headers: this.headers,
        data: relation,
      });
      expect(add.ok()).toBe(true);
      const remove = await this.request.delete(this.url("TeacherSchools/RemoveTeacherSchool"), {
        headers: this.headers,
        params: { ...relation, schoolId: this.schoolOrders.school.id },
      });
      expect(remove.ok()).toBe(true);
      await expect
        .poll(async () =>
          (
            await this.get<Array<{ id: number }>>("TeacherSchools/GetTeacherSchools", {
              teacherid: this.teacherId!,
            })
          )
            .map((item) => String(item.id))
            .sort(),
        )
        .toEqual([school.id]);
      await this.scenario.record("schoolId", school.id);
      await this.scenario.record("relatedSchoolName", school.name);
    });
  }
  async finish() {
    return await apiStep(
      "Sprzątanie: usunięcie zamówień i dokumentów utworzonych przez test",
      async () => {
        const errors: unknown[] = [];
        for (const id of [...this.teacherOrders]) {
          try {
            await this.removeStatement({ kind: "teacher", id, teacherId: this.teacherId });
          } catch (error) {
            errors.push(error);
            await this.scenario.record(`statementCleanup_${id}`, "FAILED");
          }
        }
        if (errors.length) throw errors[0];
      },
    );
  }
}

export const test = base.extend<{ documents: OrderDocuments }>({
  documents: [
    async ({ page, classOrders, scenario, authSession }, use) => {
      const entries = authSession.storageState.origins.find(
        (item) => item.origin === OCTOPUS_BASE_URL,
      )!.localStorage;
      const value = (name: string) => {
        const raw = entries.find((item) => item.name === name)!.value;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      };
      const data = new OrderDocuments(
        page,
        classOrders,
        scenario,
        page.context().request,
        { Authorization: `Bearer ${value("token")}` },
        Number(value("id")),
      );
      try {
        await use(data);
      } finally {
        await data.finish();
      }
    },
    { timeout: 180000 },
  ],
});

export async function teacherDocumentsPanel(data: OrderDocuments) {
  await data.scenario.app.openPanel("teacher", await data.teacher());
  await data.page.getByRole("tab", { name: "Gratisy", exact: true }).click();
  const panel = data.page.locator("app-teacher-orders");
  await expect(panel).toBeVisible();
  return panel;
}

export async function teacherDocumentEdit(data: OrderDocuments, target: DocumentTarget) {
  const panel = await teacherDocumentsPanel(data);
  await (await teacherDocumentRow(data, panel, target.id)).click();
  await panel.getByRole("button", { name: "Edytuj", exact: true }).click();
  const form = data.page
    .locator("mat-dialog-container")
    .filter({ has: data.page.locator("app-add-files-to-order") });
  await expect(form).toHaveCount(1);
  await expect(form).toBeVisible();
  return form;
}

export function teacherDocumentRows(panel: Locator) {
  // Gratisy nie wyświetlają ID zamówienia. Kolumna subject wskazuje wiersze
  // zamówień, z pominięciem nagłówka i dodatkowych wierszy szczegółów.
  return panel.getByRole("row").filter({ has: panel.page().locator("td.mat-column-subject") });
}

export async function teacherDocumentRow(data: OrderDocuments, panel: Locator, id: string) {
  // Każdy scenariusz ma osobnego nauczyciela z jednym oświadczeniem.
  // Nie wybieramy pierwszego wiersza, jeśli założenie izolacji nie jest spełnione.
  expect(
    (await data.teacherRecords()).map((order) => String(order.id)),
    "Dedykowany nauczyciel ma wyłącznie oświadczenie przygotowane przez ten test",
  ).toEqual([id]);
  const row = teacherDocumentRows(panel);
  await expect(row, "Jedyny wiersz zamówienia dedykowanego nauczyciela").toHaveCount(1);
  await expect(row.getByRole("cell", { name: "Gratis od promotora", exact: true })).toBeVisible();
  return row;
}

export async function previewDocuments(page: Page, panel: Locator, idOrRow: string | Locator) {
  const row = typeof idOrRow === "string" ? orderRow(panel, idOrRow) : idOrRow;
  await row.locator("mat-icon").filter({ hasText: "description_outlined" }).click();
  const viewer = page.locator("app-file-preview");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("iframe")).toHaveAttribute("src", /^blob:/);
  return viewer;
}

export async function downloadDocument(
  page: Page,
  viewer: Locator,
  stored: StoredDocument,
  file: DocumentFile,
) {
  await expect(viewer.locator(".file-name")).toHaveText(stored.fileName);
  const waiting = page.waitForEvent("download");
  await viewer.locator('[data-cy="download-file-btn"]').click();
  const download = await waiting;
  // Przeglądarka zamienia separatory nazwy technicznej na podkreślenia
  // i uzupełnia brakujące rozszerzenie zgodnie z typem MIME dokumentu.
  const technicalName = stored.fileName.replace(/[\\/]/g, "_");
  const extensionsByMime: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  };
  const extensions = extensionsByMime[file.mimeType];
  expect(extensions, `Obsługiwany typ pobieranego dokumentu: ${file.mimeType}`).toBeDefined();
  const expectedNames = extensions!.some((extension) =>
    technicalName.toLowerCase().endsWith(extension),
  )
    ? [technicalName]
    : extensions!.map((extension) => `${technicalName}${extension}`);
  expect(expectedNames, "Nazwa techniczna z rozszerzeniem właściwym dla typu pliku").toContain(
    download.suggestedFilename(),
  );
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const parts: Buffer[] = [];
  for await (const part of stream!) parts.push(Buffer.from(part));
  expect(Buffer.concat(parts), "Pobieramy identyczną zawartość, nie tylko nazwę pliku").toEqual(
    file.buffer,
  );
}

export async function downloadAllDocuments(
  page: Page,
  viewer: Locator,
  expected: Array<{ stored: StoredDocument; file: DocumentFile }>,
) {
  const seen = new Set<number>();
  let previous = "";
  for (let i = 0; i < expected.length; i++) {
    if (i > 0) await expect(viewer.locator(".file-name")).not.toHaveText(previous);
    const name = (await viewer.locator(".file-name").innerText()).trim();
    const entry = expected.find((item) => item.stored.fileName === name);
    expect(entry, `Oczekiwany dokument ${name}`).toBeDefined();
    expect(seen.has(entry!.stored.id), "Karuzela nie powtarza pliku").toBe(false);
    seen.add(entry!.stored.id);
    await downloadDocument(page, viewer, entry!.stored, entry!.file);
    previous = name;
    if (i < expected.length - 1) await viewer.locator('[data-cy="next-file-btn"]').click();
  }
  await expect(viewer.locator('[data-cy="next-file-btn"]')).toBeDisabled();
}
