import { expect } from "@playwright/test";
import {
  test,
  documentFile,
  previewDocuments,
  downloadDocument,
  downloadAllDocuments,
  teacherDocumentsPanel,
  teacherDocumentRow,
  teacherDocumentRows,
  teacherDocumentEdit,
  type DocumentTarget,
} from "./support/order-documents";
import { showClassOrders } from "./support/order-class";
import {
  openOrderEdit,
  cancelOrderForm,
  uploadOrderAttachment,
  removeOrderAttachment,
  saveOrderEdit,
  orderRow,
  uploadOrderAttachmentExpectRejected,
  openOrders,
  selectSelectedProduct,
  moveSelectedProductsLeft,
  selectOrderSingleFilter,
  selectOrderClasses,
  addOrderProduct,
  setOrderQuantity,
} from "./support/order";
import { prepareOrderSchool } from "./support/order-scenario";

test.describe("Dokumenty zamówień ręcznych i oświadczeń", () => {
  test.beforeEach(async ({}, info) => {
    info.setTimeout(300000);
  });

  for (const [index, extension] of (["pdf", "jpg", "png"] as const).entries()) {
    test(`ORD-DOC-0${index + 1}: dokument ${extension.toUpperCase()} można podejrzeć i pobrać bez zmiany bajtów @school @order @attachment @order-document @download`, async ({
      page,
      documents: d,
      classOrders: api,
    }) => {
      const product = await api.product("F7P", [7]);
      const id = await api.save([{ product, quantity: 1 }]);
      const file = documentFile(extension);
      const stored = await d.upload({ kind: "school", id }, file);
      const panel = await showClassOrders(page, api);
      const viewer = await previewDocuments(page, panel, id);
      await downloadDocument(page, viewer, stored, file);
      await viewer.locator('[data-cy="close-btn"]').click();
      await expect(viewer).toHaveCount(0);
    });
  }

  test("ORD-DOC-04: podgląd i pobieranie każdego z kilku dokumentów @school @order @attachment @order-document @download", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const files = [documentFile("pdf", 1), documentFile("png", 2), documentFile("jpg", 3)];
    const stored = [];
    for (const file of files) stored.push(await d.upload({ kind: "school", id }, file));
    const panel = await showClassOrders(page, api);
    const viewer = await previewDocuments(page, panel, id);
    await expect(viewer.locator('[data-cy="prev-file-btn"]')).toBeDisabled();
    // Kolejność repozytorium nie musi być kolejnością przesłania.
    const order = await d.files({ kind: "school", id });
    for (const [index, record] of order.entries()) {
      const source = stored.findIndex((item) => item.id === record.id);
      expect(source).toBeGreaterThanOrEqual(0);
      await downloadDocument(page, viewer, record, files[source]);
      if (index < order.length - 1) await viewer.locator('[data-cy="next-file-btn"]').click();
    }
    await expect(viewer.locator('[data-cy="next-file-btn"]')).toBeDisabled();
    await viewer.locator('[data-cy="close-btn"]').click();
  });

  test("ORD-DOC-05: dodanie dokumentu podczas edycji zachowuje poprzedni @school @order @attachment @order-document @edit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = documentFile("png", 1);
    const before = await d.upload(target, original);
    await showClassOrders(page, api);
    const form = await openOrderEdit(page, id);
    const added = documentFile("pdf", 2);
    await uploadOrderAttachment(page, form, added);
    await saveOrderEdit(form);
    await expect.poll(async () => (await d.files(target)).length).toBe(2);
    const records = await d.files(target);
    expect(Buffer.from(records.find((file) => file.id === before.id)!.fileData, "base64")).toEqual(
      original.buffer,
    );
    expect(records.some((file) => Buffer.from(file.fileData, "base64").equals(added.buffer))).toBe(
      true,
    );
  });

  test("ORD-DOC-06: usunięcie jednego zapisanego dokumentu nie usuwa pozostałych @school @order @attachment @order-document @edit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const a = await d.upload(target, documentFile("png", 1));
    const source = documentFile("pdf", 2);
    const b = await d.upload(target, source);
    await showClassOrders(page, api);
    const form = await openOrderEdit(page, id);
    await removeOrderAttachment(page, form, a.fileName);
    await saveOrderEdit(form);
    await expect.poll(async () => (await d.files(target)).map((file) => file.id)).toEqual([b.id]);
    expect(Buffer.from((await d.files(target))[0].fileData, "base64")).toEqual(source.buffer);
  });

  test("ORD-DOC-07: edycja ilości nie zmienia ID ani zawartości dokumentu @school @order @attachment @order-document @edit", async ({
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("pdf"));
    await api.save([{ product, quantity: 4 }], id);
    expect(await d.files(target)).toEqual([original]);
  });

  test("ORD-DOC-08: zamiana produktu zachowuje istniejące dokumenty @school @order @attachment @order-document @edit", async ({
    documents: d,
    classOrders: api,
  }) => {
    const a = await api.product("F7P", [7]);
    const b = await api.product("P5Pv", [5]);
    const id = await api.save([{ product: a, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("png"));
    await api.save([{ product: b, quantity: 2 }], id);
    expect(await d.files(target)).toEqual([original]);
  });

  test("ORD-DOC-09: anulowanie dodania i usunięcia dokumentów nie zmienia repozytorium @school @order @attachment @order-document @cancel", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("pdf"));
    await showClassOrders(page, api);
    const form = await openOrderEdit(page, id);
    await removeOrderAttachment(page, form, original.fileName);
    await uploadOrderAttachment(page, form, documentFile("png", 2));
    await cancelOrderForm(form);
    expect(await d.files(target)).toEqual([original]);
  });

  test("ORD-DOC-10: identyczne nazwy oryginalne nie nadpisują różnych dokumentów @school @order @attachment @order-document @filename", async ({
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const a = await d.upload(target, documentFile("png", 1, "dowod.png"));
    const b = await d.upload(target, documentFile("png", 2, "dowod.png"));
    expect(a.id).not.toBe(b.id);
    expect(a.fileName).not.toBe("dowod.png");
    expect(b.fileName).not.toBe("dowod.png");
    expect(a.fileName).not.toBe(b.fileName);
    expect(a.fileName).toMatch(new RegExp(`^\\d{4}/BOK/${id}_\\d+(?:\\.[a-z]+)?$`, "i"));
    expect(b.fileName).toMatch(new RegExp(`^\\d{4}/BOK/${id}_\\d+(?:\\.[a-z]+)?$`, "i"));
  });

  test("ORD-DOC-11: osiem dokumentów jest przechowywanych niezależnie @school @order @attachment @order-document @multiple", async ({
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    for (let i = 0; i < 8; i++) await d.upload(target, documentFile("png", i));
    const files = await d.files(target);
    expect(files).toHaveLength(8);
    expect(new Set(files.map((file) => file.id)).size).toBe(8);
  });

  test("ORD-DOC-12: zamówienie dokumentowe pokazuje autora i datę utworzenia @school @order @attachment @order-document @audit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const start = Date.now();
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    await d.upload(target, documentFile("pdf"));
    const record = await d.record(target);
    const user = await d.get<{ login: string }>(`User/${d.userId}`);
    expect(record.createdByName).toBe(user.login);
    expect(Number.isNaN(Date.parse(record.createdAt))).toBe(false);
    expect(
      Date.parse(record.createdAt.endsWith("Z") ? record.createdAt : `${record.createdAt}Z`),
    ).toBeGreaterThanOrEqual(start - 2000);
    const panel = await showClassOrders(page, api);
    const row = orderRow(panel, id);
    await expect(row.locator(".mat-column-createdByName")).toHaveText(record.createdByName);
    await expect(row.locator(".mat-column-createdAt")).toHaveText(record.createdAt.slice(0, 10));
  });

  test("ORD-DOC-13: filtr roku ukrywa i przywraca zamówienie z dokumentem @school @order @attachment @order-document @year", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    await d.upload(target, documentFile("pdf"));
    const ownYear = (await d.record(target)).createdAt.slice(0, 4);
    const panel = await showClassOrders(page, api);
    const year = panel.getByRole("combobox").first();
    await year.click();
    await page.getByRole("option", { name: ownYear, exact: true }).click();
    await expect(orderRow(panel, id)).toHaveCount(1);
    await year.click();
    const alternatives = (await page.getByRole("option").allTextContents())
      .map((value) => value.trim())
      .filter((value) => /^\d{4}$/.test(value) && value !== ownYear);
    expect(
      alternatives.length,
      "Słownik musi zawierać inny rok do sprawdzenia filtra",
    ).toBeGreaterThan(0);
    await page.getByRole("option", { name: alternatives[0], exact: true }).click();
    await expect(orderRow(panel, id)).toHaveCount(0);
    await year.click();
    await page.getByRole("option", { name: ownYear, exact: true }).click();
    const viewer = await previewDocuments(page, panel, id);
    await expect(viewer).toBeVisible();
  });

  test("ORD-DOC-14: usunięcie zamówienia usuwa widoczne powiązania dokumentów @school @order @attachment @order-document @delete", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    await d.upload({ kind: "school", id }, documentFile("png"));
    await api.remove(id);
    const panel = await showClassOrders(page, api);
    await expect(orderRow(panel, id)).toHaveCount(0);
    expect((await d.schoolRecords()).some((record) => String(record.id) === id)).toBe(false);
  });

  for (const [id, kind] of [
    ["15", "format"],
    ["16", "size"],
  ] as const) {
    test(`ORD-DOC-${id}: API odrzuca błędny ${kind} dokumentu bez utraty zapisanych plików @school @order @attachment @order-document @api @negative`, async ({
      documents: d,
      classOrders: api,
    }) => {
      const product = await api.product("F7P", [7]);
      const orderId = await api.save([{ product, quantity: 1 }]);
      const target: DocumentTarget = { kind: "school", id: orderId };
      const original = await d.upload(target, documentFile("pdf"));
      const file =
        kind === "format"
          ? {
              name: "niedozwolony.exe",
              mimeType: "application/octet-stream",
              buffer: Buffer.from("test"),
            }
          : {
              ...documentFile("png"),
              buffer: Buffer.concat([
                documentFile("png").buffer,
                Buffer.alloc(10 * 1024 * 1024 + 1 - documentFile("png").buffer.length),
              ]),
            };
      const response = await d.attemptUpload(target, file);
      expect([400, 413, 415, 422]).toContain(response.status());
      expect(await d.files(target)).toEqual([original]);
    });
  }

  test("ORD-DOC-17: błąd uploadu podczas edycji nie usuwa poprzedniego dokumentu @school @order @attachment @order-document @network", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product = await api.product("F7P", [7]);
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("png"));
    await showClassOrders(page, api);
    const form = await openOrderEdit(page, id);
    await uploadOrderAttachment(page, form, documentFile("pdf", 2));
    const route = "**/api/FileStorage/SaveFileForSchoolOrder";
    await page.route(route, (handler) =>
      handler.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Kontrolowany błąd uploadu testowego" }),
      }),
    );
    try {
      const waiting = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/FileStorage/SaveFileForSchoolOrder" &&
          response.request().method() === "POST",
      );
      await form.getByRole("button", { name: "Zapisz", exact: true }).click();
      expect((await waiting).status()).toBe(500);
      await expect(form).toBeVisible();
      expect(await d.files(target)).toEqual([original]);
      await cancelOrderForm(form);
    } finally {
      await page.unroute(route);
    }
  });

  test("ORD-DOC-18: oświadczenie ma te same dokumenty u nauczyciela i w pierwotnej szkole @school @teacher @order @order-document @statement", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const target = await d.statement();
    const expected = [];
    for (const [index, extension] of (["pdf", "jpg", "png"] as const).entries()) {
      const file = documentFile(extension, index);
      expected.push({ stored: await d.upload(target, file), file });
    }
    const teacher = await teacherDocumentsPanel(d);
    const teacherViewer = await previewDocuments(
      page,
      teacher,
      await teacherDocumentRow(d, teacher, target.id),
    );
    await downloadAllDocuments(page, teacherViewer, expected);
    await teacherViewer.locator('[data-cy="close-btn"]').click();
    const schoolRecord = (await d.schoolRecords()).find((order) =>
      order.fileStorage.some((item) => item.id === expected[0].stored.id),
    );
    expect(schoolRecord).toBeDefined();
    const school = await showClassOrders(page, api);
    await expect(orderRow(school, String(schoolRecord!.id))).toContainText("Oświadczenie");
    const viewer = await previewDocuments(page, school, String(schoolRecord!.id));
    await downloadAllDocuments(page, viewer, expected);
  });

  test("ORD-DOC-19: edycja oświadczenia pozwala dodać dokument bez utraty poprzedniego @teacher @order @order-document @statement @edit", async ({
    page,
    documents: d,
  }) => {
    const target = await d.statement();
    const original = await d.upload(target, documentFile("png"));
    const form = await teacherDocumentEdit(d, target);
    const added = documentFile("pdf", 2);
    await uploadOrderAttachment(page, form, added);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect.poll(async () => (await d.files(target)).length).toBe(2);
    expect((await d.files(target)).find((file) => file.id === original.id)).toEqual(original);
    expect(
      (await d.files(target)).some((file) =>
        Buffer.from(file.fileData, "base64").equals(added.buffer),
      ),
    ).toBe(true);
  });

  test("ORD-DOC-20: usunięcie pojedynczego skanu oświadczenia zachowuje drugi @teacher @order @order-document @statement @edit", async ({
    page,
    documents: d,
  }) => {
    const target = await d.statement();
    const a = await d.upload(target, documentFile("png"));
    const b = await d.upload(target, documentFile("pdf", 2));
    const form = await teacherDocumentEdit(d, target);
    await removeOrderAttachment(page, form, a.fileName);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect.poll(async () => (await d.files(target)).map((file) => file.id)).toEqual([b.id]);
    expect(await d.files(target)).toEqual([b]);
    expect(
      (await d.schoolRecords())
        .flatMap((record) => record.fileStorage)
        .some((file) => file.id === a.id),
    ).toBe(false);
  });

  test("ORD-DOC-21: oświadczenie bez szkoły nie pokazuje skanów w szkole @school @teacher @order @order-document @statement @negative", async ({
    page,
    documents: d,
  }) => {
    const target = await d.statement(false);
    const stored = await d.upload(target, documentFile("png"));
    const panel = await teacherDocumentsPanel(d);
    await previewDocuments(page, panel, await teacherDocumentRow(d, panel, target.id));
    expect(
      (await d.schoolRecords())
        .flatMap((record) => record.fileStorage)
        .some((file) => file.id === stored.id),
    ).toBe(false);
  });

  test("ORD-DOC-22: zmiana szkoły nauczyciela nie przenosi dokumentu oświadczenia @school @teacher @order @order-document @statement @isolation", async ({
    page,
    documents: d,
    scenario,
  }) => {
    const target = await d.statement();
    const stored = await d.upload(target, documentFile("pdf"));
    const original = (await d.schoolRecords()).find((order) =>
      order.fileStorage.some((file) => file.id === stored.id),
    );
    expect(original).toBeDefined();
    const other = await prepareOrderSchool(page, scenario, "secondary");
    await d.moveTeacher(other);
    expect(
      (await d.schoolRecords())
        .find((order) => order.id === original!.id)!
        .fileStorage.some((file) => file.id === stored.id),
    ).toBe(true);
    expect(
      (await d.schoolRecords(other.id))
        .flatMap((record) => record.fileStorage)
        .some((file) => file.id === stored.id),
    ).toBe(false);
    expect((await d.files(target)).some((file) => file.id === stored.id)).toBe(true);
    const teacher = await teacherDocumentsPanel(d);
    await previewDocuments(page, teacher, await teacherDocumentRow(d, teacher, target.id));
  });

  test("ORD-DOC-23: bez powodu Oświadczenie dodawanie plików nauczyciela jest niedostępne @teacher @order @order-document @statement @negative", async ({
    page,
    documents: d,
  }) => {
    const target = await d.statement();
    const form = await teacherDocumentEdit(d, target);
    const button = form.locator('[data-cy="button-add-file"]');
    await expect(button).toBeEnabled();
    const reason = form.locator("mat-select").filter({ hasText: "Oświadczenie" });
    await expect(reason).toHaveCount(1);
    await reason.click();
    await page.getByRole("option", { name: "Brak", exact: true }).click();
    await expect(button).toBeDisabled();
    await cancelOrderForm(form);
  });

  for (const [id, kind] of [
    ["24", "format"],
    ["25", "size"],
  ] as const) {
    test(`ORD-DOC-${id}: oświadczenie odrzuca błędny ${kind} pliku w UI @teacher @order @order-document @statement @validation`, async ({
      page,
      documents: d,
    }) => {
      const target = await d.statement();
      const form = await teacherDocumentEdit(d, target);
      const file =
        kind === "format"
          ? { name: "plik.exe", mimeType: "application/octet-stream", buffer: Buffer.from("test") }
          : { ...documentFile("png"), buffer: Buffer.alloc(10 * 1024 * 1024 + 1) };
      await uploadOrderAttachmentExpectRejected(page, form, file);
      expect(await d.files(target)).toEqual([]);
      await cancelOrderForm(form);
    });
  }

  test("ORD-DOC-26: oświadczenie akceptuje granicę 10 MB w formularzu @teacher @order @order-document @statement @boundary", async ({
    page,
    documents: d,
  }) => {
    const target = await d.statement();
    const form = await teacherDocumentEdit(d, target);
    const small = documentFile("png");
    await uploadOrderAttachment(page, form, {
      ...small,
      buffer: Buffer.concat([small.buffer, Buffer.alloc(10 * 1024 * 1024 - small.buffer.length)]),
    });
    await expect(form.getByText(small.name, { exact: true })).toBeVisible();
    await cancelOrderForm(form);
  });

  test("ORD-DOC-27: oświadczenie jest tylko do odczytu z poziomu zamówień szkoły @school @teacher @order @order-document @statement @readonly", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const target = await d.statement();
    const file = await d.upload(target, documentFile("png"));
    const mapped = (await d.schoolRecords()).find((order) =>
      order.fileStorage.some((item) => item.id === file.id),
    );
    expect(mapped).toBeDefined();
    const panel = await showClassOrders(page, api);
    await orderRow(panel, String(mapped!.id)).click();
    await expect(panel.locator('[data-cy="manually-edit-order-btn"]')).toBeDisabled();
    await teacherDocumentEdit(d, target);
    await cancelOrderForm(
      page.locator("mat-dialog-container").filter({ has: page.locator("app-add-files-to-order") }),
    );
  });

  test("ORD-DOC-28: zamówienie z integracji nie udostępnia edycji szkolnej @school @order @order-document @integration @readonly", async ({
    page,
    scenario,
  }) => {
    const raw = process.env.OCTOPUS_ORDER_EXTERNAL_REFERENCE;
    test.skip(
      !raw,
      "Wymagane istniejące testowe zamówienie z integracji: OCTOPUS_ORDER_EXTERNAL_REFERENCE={schoolId,schoolName,id}. Nie tworzymy imitacji zamówienia z integracji.",
    );
    const reference = JSON.parse(raw!) as { schoolId: string; schoolName: string; id: string };
    expect(reference.schoolName).toMatch(/^AUTO_/);
    await scenario.app.openPanel("school", reference.schoolId);
    await expect(scenario.app.detail("name")).toHaveValue(reference.schoolName);
    const panel = await openOrders(page);
    await orderRow(panel, reference.id).click();
    await expect(panel.locator('[data-cy="manually-edit-order-btn"]')).toBeDisabled();
  });

  test("ORD-DOC-29: usunięcie oświadczenia usuwa widoczne powiązania dokumentów u nauczyciela i w szkole @school @teacher @order @order-document @statement @delete", async ({
    page,
    documents: d,
  }) => {
    const target = await d.statement();
    const stored = await d.upload(target, documentFile("pdf"));
    expect(
      (await d.schoolRecords())
        .flatMap((order) => order.fileStorage)
        .some((file) => file.id === stored.id),
    ).toBe(true);
    await d.removeStatement(target);
    expect((await d.teacherRecords()).some((order) => String(order.id) === target.id)).toBe(false);
    await expect
      .poll(async () =>
        (await d.schoolRecords())
          .flatMap((order) => order.fileStorage)
          .some((file) => file.id === stored.id),
      )
      .toBe(false);
    const panel = await teacherDocumentsPanel(d);
    await expect(teacherDocumentRows(panel)).toHaveCount(0);
  });

  test("ORD-DOC-30: edycja przez formularz zmienia produkt i ilość bez utraty dokumentu @school @order @order-document @edit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const originalProduct = await api.product("F7P", [7]);
    const replacement = await api.product("P5Pv", [5]);
    const id = await api.save([{ product: originalProduct, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("pdf"));
    await showClassOrders(page, api);
    const form = await openOrderEdit(page, id);
    await selectSelectedProduct(form, originalProduct.businessCode);
    await moveSelectedProductsLeft(form);
    await selectOrderSingleFilter(page, form, "subject", "Język polski");
    await selectOrderSingleFilter(page, form, "level", "Szkoła Podstawowa");
    await selectOrderClasses(page, form, ["5"]);
    await addOrderProduct(form, replacement.businessCode);
    await setOrderQuantity(form, replacement.businessCode, "3");
    await saveOrderEdit(form);
    await expect
      .poll(async () =>
        (await api.orders())
          .find((order) => String(order.id) === id)
          ?.orderItems.map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity })),
      )
      .toEqual([{ id: replacement.id, quantity: 3 }]);
    expect(await d.files(target)).toEqual([original]);
  });
});
