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
  type StoredDocument,
  type DocumentFile,
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
      const product =
        await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
          api.product("F7P", [7]));
      const id = await api.save([{ product, quantity: 1 }]);
      const file = documentFile(extension);
      const stored = await d.upload({ kind: "school", id }, file);
      const panel =
        await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
          showClassOrders(page, api));
      const viewer =
        await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
          previewDocuments(page, panel, id));
      await test.step("Porównanie: pobrany dokument ma oczekiwaną nazwę i identyczne bajty", async () =>
        downloadDocument(page, viewer, stored, file));
      await viewer.locator('[data-cy="close-btn"]').click();
      await test.step("Sprawdzenie: liczba elementów w widoku — viewer; oczekiwane: 0", async () =>
        expect(viewer).toHaveCount(0));
    });
  }

  test("ORD-DOC-04: podgląd i pobieranie każdego z kilku dokumentów @school @order @attachment @order-document @download", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const files = [documentFile("pdf", 1), documentFile("png", 2), documentFile("jpg", 3)];
    const stored = [];
    for (const file of files) stored.push(await d.upload({ kind: "school", id }, file));
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    const viewer = await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
      previewDocuments(page, panel, id));
    await test.step("Sprawdzenie: zablokowanie działania — viewer.locator('[data-cy=\"prev-file-btn\"]')", async () =>
      expect(viewer.locator('[data-cy="prev-file-btn"]')).toBeDisabled());
    // Kolejność repozytorium nie musi być kolejnością przesłania.
    const order = await test.step("API: odczyt dokumentów przypisanych do zamówienia", async () =>
      d.files({ kind: "school", id }));
    for (const [index, record] of order.entries()) {
      const source = stored.findIndex((item) => item.id === record.id);
      await test.step("Sprawdzenie: wartość nie mniejsza od granicy — source; granica: 0", async () => {
        expect(source).toBeGreaterThanOrEqual(0);
      });
      await test.step("Porównanie: pobrany dokument ma oczekiwaną nazwę i identyczne bajty", async () =>
        downloadDocument(page, viewer, record, files[source]));
      if (index < order.length - 1) await viewer.locator('[data-cy="next-file-btn"]').click();
    }
    await test.step("Sprawdzenie: zablokowanie działania — viewer.locator('[data-cy=\"next-file-btn\"]')", async () =>
      expect(viewer.locator('[data-cy="next-file-btn"]')).toBeDisabled());
    await viewer.locator('[data-cy="close-btn"]').click();
  });

  test("ORD-DOC-05: dodanie dokumentu podczas edycji zachowuje poprzedni @school @order @attachment @order-document @edit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = documentFile("png", 1);
    const before = await d.upload(target, original);
    await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
      showClassOrders(page, api));
    const form = await openOrderEdit(page, id);
    const added = documentFile("pdf", 2);
    await uploadOrderAttachment(page, form, added);
    await saveOrderEdit(form);
    await test.step("Sprawdzenie: zgodność wartości — async () => (await d.files(target)).length; oczekiwane: 2", async () =>
      expect.poll(async () => (await d.files(target)).length).toBe(2));
    const records = await test.step("API: odczyt dokumentów przypisanych do zamówienia", async () =>
      d.files(target));
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — Buffer.from(records.find((file) => file.id === before.id)!.fileData, "base64"); oczekiwane: original.buffer', async () => {
      expect(
        Buffer.from(records.find((file) => file.id === before.id)!.fileData, "base64"),
      ).toEqual(original.buffer);
    });
    await test.step('Sprawdzenie: zgodność wartości — records.some((file) => Buffer.from(file.fileData, "base64").equals(added.buffer)); oczekiwane: true', async () => {
      expect(
        records.some((file) => Buffer.from(file.fileData, "base64").equals(added.buffer)),
      ).toBe(true);
    });
  });

  test("ORD-DOC-06: usunięcie jednego zapisanego dokumentu nie usuwa pozostałych @school @order @attachment @order-document @edit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const a = await d.upload(target, documentFile("png", 1));
    const source = documentFile("pdf", 2);
    const b = await d.upload(target, source);
    await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
      showClassOrders(page, api));
    const form = await openOrderEdit(page, id);
    await removeOrderAttachment(page, form, a.fileName);
    await saveOrderEdit(form);
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => (await d.files(target)).map((file) => file.id); oczekiwane: [b.id]", async () =>
      expect.poll(async () => (await d.files(target)).map((file) => file.id)).toEqual([b.id]));
    await test.step('Sprawdzenie: zgodność całej struktury i wartości — Buffer.from((await d.files(target))[0].fileData, "base64"); oczekiwane: source.buffer', async () => {
      expect(Buffer.from((await d.files(target))[0].fileData, "base64")).toEqual(source.buffer);
    });
  });

  test("ORD-DOC-07: edycja ilości nie zmienia ID ani zawartości dokumentu @school @order @attachment @order-document @edit", async ({
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("pdf"));
    await api.save([{ product, quantity: 4 }], id);
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [original]", async () => {
      expect(await d.files(target)).toEqual([original]);
    });
  });

  test("ORD-DOC-08: zamiana produktu zachowuje istniejące dokumenty @school @order @attachment @order-document @edit", async ({
    documents: d,
    classOrders: api,
  }) => {
    const a = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("F7P", [7]));
    const b = await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
      api.product("P5Pv", [5]));
    const id = await api.save([{ product: a, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("png"));
    await api.save([{ product: b, quantity: 2 }], id);
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [original]", async () => {
      expect(await d.files(target)).toEqual([original]);
    });
  });

  test("ORD-DOC-09: anulowanie dodania i usunięcia dokumentów nie zmienia repozytorium @school @order @attachment @order-document @cancel", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("pdf"));
    await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
      showClassOrders(page, api));
    const form = await openOrderEdit(page, id);
    await removeOrderAttachment(page, form, original.fileName);
    await uploadOrderAttachment(page, form, documentFile("png", 2));
    await cancelOrderForm(form);
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [original]", async () => {
      expect(await d.files(target)).toEqual([original]);
    });
  });

  test("ORD-DOC-10: identyczne nazwy oryginalne nie nadpisują różnych dokumentów @school @order @attachment @order-document @filename", async ({
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const a = await d.upload(target, documentFile("png", 1, "dowod.png"));
    const b = await d.upload(target, documentFile("png", 2, "dowod.png"));
    await test.step("Sprawdzenie: negacja — zgodność wartości — a.id; oczekiwane: b.id", async () => {
      expect(a.id).not.toBe(b.id);
    });
    await test.step('Sprawdzenie: negacja — zgodność wartości — a.fileName; oczekiwane: "dowod.png"', async () => {
      expect(a.fileName).not.toBe("dowod.png");
    });
    await test.step('Sprawdzenie: negacja — zgodność wartości — b.fileName; oczekiwane: "dowod.png"', async () => {
      expect(b.fileName).not.toBe("dowod.png");
    });
    await test.step("Sprawdzenie: negacja — zgodność wartości — a.fileName; oczekiwane: b.fileName", async () => {
      expect(a.fileName).not.toBe(b.fileName);
    });
    await test.step('Sprawdzenie: zgodność ze wzorcem — a.fileName; oczekiwane: new RegExp(`^\\\\d{4}/BOK/${id}_\\\\d+(?:\\\\.[a-z]+)?$`, "i")', async () => {
      expect(a.fileName).toMatch(new RegExp(`^\\d{4}/BOK/${id}_\\d+(?:\\.[a-z]+)?$`, "i"));
    });
    await test.step('Sprawdzenie: zgodność ze wzorcem — b.fileName; oczekiwane: new RegExp(`^\\\\d{4}/BOK/${id}_\\\\d+(?:\\\\.[a-z]+)?$`, "i")', async () => {
      expect(b.fileName).toMatch(new RegExp(`^\\d{4}/BOK/${id}_\\d+(?:\\.[a-z]+)?$`, "i"));
    });
  });

  test("ORD-DOC-11: osiem dokumentów jest przechowywanych niezależnie @school @order @attachment @order-document @multiple", async ({
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    for (let i = 0; i < 8; i++) await d.upload(target, documentFile("png", i));
    const files = await test.step("API: odczyt dokumentów przypisanych do zamówienia", async () =>
      d.files(target));
    await test.step("Sprawdzenie: liczba elementów — files; oczekiwane: 8", async () => {
      expect(files).toHaveLength(8);
    });
    await test.step("Sprawdzenie: zgodność wartości — new Set(files.map((file) => file.id)).size; oczekiwane: 8", async () => {
      expect(new Set(files.map((file) => file.id)).size).toBe(8);
    });
  });

  test("ORD-DOC-12: zamówienie dokumentowe pokazuje autora i datę utworzenia @school @order @attachment @order-document @audit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const start = Date.now();
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    await d.upload(target, documentFile("pdf"));
    const record = await d.record(target);
    const user = await test.step("API: odczyt danych do weryfikacji", async () =>
      d.get<{ login: string }>(`User/${d.userId}`));
    await test.step("Sprawdzenie: zgodność wartości — record.createdByName; oczekiwane: user.login", async () => {
      expect(record.createdByName).toBe(user.login);
    });
    await test.step("Sprawdzenie: zgodność wartości — Number.isNaN(Date.parse(record.createdAt)); oczekiwane: false", async () => {
      expect(Number.isNaN(Date.parse(record.createdAt))).toBe(false);
    });
    await test.step('Sprawdzenie: wartość nie mniejsza od granicy — Date.parse(record.createdAt.endsWith("Z") ? record.createdAt : `${record.createdAt}Z`); granica: start - 2000', async () => {
      expect(
        Date.parse(record.createdAt.endsWith("Z") ? record.createdAt : `${record.createdAt}Z`),
      ).toBeGreaterThanOrEqual(start - 2000);
    });
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    const row = orderRow(panel, id);
    await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-createdByName"); oczekiwane: record.createdByName', async () =>
      expect(row.locator(".mat-column-createdByName")).toHaveText(record.createdByName));
    await test.step('Sprawdzenie: tekst w widoku — row.locator(".mat-column-createdAt"); oczekiwane: record.createdAt.slice(0, 10)', async () =>
      expect(row.locator(".mat-column-createdAt")).toHaveText(record.createdAt.slice(0, 10)));
  });

  test("ORD-DOC-13: filtr roku ukrywa i przywraca zamówienie z dokumentem @school @order @attachment @order-document @year", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    await d.upload(target, documentFile("pdf"));
    const ownYear = (await d.record(target)).createdAt.slice(0, 4);
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    const year = panel.getByRole("combobox").first();
    await year.click();
    await page.getByRole("option", { name: ownYear, exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — orderRow(panel, id); oczekiwane: 1", async () =>
      expect(orderRow(panel, id)).toHaveCount(1));
    await year.click();
    const alternatives = (await page.getByRole("option").allTextContents())
      .map((value) => value.trim())
      .filter((value) => /^\d{4}$/.test(value) && value !== ownYear);
    await test.step("Sprawdzenie: wartość powyżej granicy — alternatives.length; granica: 0", async () => {
      expect(
        alternatives.length,
        "Słownik musi zawierać inny rok do sprawdzenia filtra",
      ).toBeGreaterThan(0);
    });
    await page.getByRole("option", { name: alternatives[0], exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — orderRow(panel, id); oczekiwane: 0", async () =>
      expect(orderRow(panel, id)).toHaveCount(0));
    await year.click();
    await page.getByRole("option", { name: ownYear, exact: true }).click();
    const viewer = await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
      previewDocuments(page, panel, id));
    await test.step("Sprawdzenie: widoczność elementu — viewer", async () =>
      expect(viewer).toBeVisible());
  });

  test("ORD-DOC-14: usunięcie zamówienia usuwa widoczne powiązania dokumentów @school @order @attachment @order-document @delete", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    await d.upload({ kind: "school", id }, documentFile("png"));
    await api.remove(id);
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    await test.step("Sprawdzenie: liczba elementów w widoku — orderRow(panel, id); oczekiwane: 0", async () =>
      expect(orderRow(panel, id)).toHaveCount(0));
    await test.step("Sprawdzenie: zgodność wartości — (await d.schoolRecords()).some((record) => String(record.id) === id); oczekiwane: false", async () => {
      expect((await d.schoolRecords()).some((record) => String(record.id) === id)).toBe(false);
    });
  });

  for (const [id, kind] of [
    ["15", "format"],
    ["16", "size"],
  ] as const) {
    test(`ORD-DOC-${id}: API odrzuca błędny ${kind} dokumentu bez utraty zapisanych plików @school @order @attachment @order-document @api @negative`, async ({
      documents: d,
      classOrders: api,
    }) => {
      const product =
        await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
          api.product("F7P", [7]));
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
      const response = await test.step("API: próba dodania dokumentu do walidacji", async () =>
        d.attemptUpload(target, file));
      await test.step("Sprawdzenie: obecność oczekiwanego elementu — [400, 413, 415, 422]; oczekiwane: response.status()", async () => {
        expect([400, 413, 415, 422]).toContain(response.status());
      });
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [original]", async () => {
        expect(await d.files(target)).toEqual([original]);
      });
    });
  }

  test("ORD-DOC-17: błąd uploadu podczas edycji nie usuwa poprzedniego dokumentu @school @order @attachment @order-document @network", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const product =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const id = await api.save([{ product, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("png"));
    await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
      showClassOrders(page, api));
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
      await test.step("Sprawdzenie: zgodność wartości — (await waiting).status(); oczekiwane: 500", async () => {
        expect((await waiting).status()).toBe(500);
      });
      await test.step("Sprawdzenie: widoczność elementu — form", async () =>
        expect(form).toBeVisible());
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [original]", async () => {
        expect(await d.files(target)).toEqual([original]);
      });
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
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const expected: Array<{ stored: StoredDocument; file: DocumentFile }> = [];
    for (const [index, extension] of (["pdf", "jpg", "png"] as const).entries()) {
      const file = documentFile(extension, index);
      expected.push({
        stored: await d.upload(target, file),
        file,
      });
    }
    const teacher =
      await test.step("Widok: otwarcie zamówień nauczyciela z dokumentami", async () =>
        teacherDocumentsPanel(d));
    const teacherViewer =
      await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
        previewDocuments(page, teacher, await teacherDocumentRow(d, teacher, target.id)));
    await test.step("Porównanie: komplet pobranych dokumentów odpowiada załącznikom zamówienia", async () =>
      downloadAllDocuments(page, teacherViewer, expected));
    await teacherViewer.locator('[data-cy="close-btn"]').click();
    const schoolRecord = (
      await test.step("API: odczyt zamówień i dokumentów szkoły", async () => d.schoolRecords())
    ).find((order) => order.fileStorage.some((item) => item.id === expected[0].stored.id));
    await test.step("Sprawdzenie: toBeDefined — schoolRecord", async () => {
      expect(schoolRecord).toBeDefined();
    });
    const school =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    await test.step('Sprawdzenie: obecność tekstu w widoku — orderRow(school, String(schoolRecord!.id)); oczekiwane: "Oświadczenie"', async () =>
      expect(orderRow(school, String(schoolRecord!.id))).toContainText("Oświadczenie"));
    const viewer = await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
      previewDocuments(page, school, String(schoolRecord!.id)));
    await test.step("Porównanie: komplet pobranych dokumentów odpowiada załącznikom zamówienia", async () =>
      downloadAllDocuments(page, viewer, expected));
  });

  test("ORD-DOC-19: edycja oświadczenia pozwala dodać dokument bez utraty poprzedniego @teacher @order @order-document @statement @edit", async ({
    page,
    documents: d,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const original = await d.upload(target, documentFile("png"));
    const form = await test.step("Widok: otwarcie edycji dokumentów oświadczenia", async () =>
      teacherDocumentEdit(d, target));
    const added = documentFile("pdf", 2);
    await uploadOrderAttachment(page, form, added);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — form; oczekiwane: 0", async () =>
      expect(form).toHaveCount(0));
    await test.step("Sprawdzenie: zgodność wartości — async () => (await d.files(target)).length; oczekiwane: 2", async () =>
      expect.poll(async () => (await d.files(target)).length).toBe(2));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — (await d.files(target)).find((file) => file.id === original.id); oczekiwane: original", async () => {
      expect((await d.files(target)).find((file) => file.id === original.id)).toEqual(original);
    });
    await test.step('Sprawdzenie: zgodność wartości — (await d.files(target)).some((file) => Buffer.from(file.fileData, "base64").equals(added.buffer), ); oczekiwane: true', async () => {
      expect(
        (await d.files(target)).some((file) =>
          Buffer.from(file.fileData, "base64").equals(added.buffer),
        ),
      ).toBe(true);
    });
  });

  test("ORD-DOC-20: usunięcie pojedynczego skanu oświadczenia zachowuje drugi @teacher @order @order-document @statement @edit", async ({
    page,
    documents: d,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const a = await d.upload(target, documentFile("png"));
    const b = await d.upload(target, documentFile("pdf", 2));
    const form = await test.step("Widok: otwarcie edycji dokumentów oświadczenia", async () =>
      teacherDocumentEdit(d, target));
    await removeOrderAttachment(page, form, a.fileName);
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — form; oczekiwane: 0", async () =>
      expect(form).toHaveCount(0));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — async () => (await d.files(target)).map((file) => file.id); oczekiwane: [b.id]", async () =>
      expect.poll(async () => (await d.files(target)).map((file) => file.id)).toEqual([b.id]));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [b]", async () => {
      expect(await d.files(target)).toEqual([b]);
    });
    await test.step("Sprawdzenie: zgodność wartości — (await d.schoolRecords()) .flatMap((record) => record.fileStorage) .some((file) => file.id === a.id); oczekiwane: false", async () => {
      expect(
        (await d.schoolRecords())
          .flatMap((record) => record.fileStorage)
          .some((file) => file.id === a.id),
      ).toBe(false);
    });
  });

  test("ORD-DOC-21: oświadczenie bez szkoły nie pokazuje skanów w szkole @school @teacher @order @order-document @statement @negative", async ({
    page,
    documents: d,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement(false));
    const stored = await d.upload(target, documentFile("png"));
    const panel = await test.step("Widok: otwarcie zamówień nauczyciela z dokumentami", async () =>
      teacherDocumentsPanel(d));
    await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
      previewDocuments(page, panel, await teacherDocumentRow(d, panel, target.id)));
    await test.step("Sprawdzenie: zgodność wartości — (await d.schoolRecords()) .flatMap((record) => record.fileStorage) .some((file) => file.id === stored.id); oczekiwane: false", async () => {
      expect(
        (await d.schoolRecords())
          .flatMap((record) => record.fileStorage)
          .some((file) => file.id === stored.id),
      ).toBe(false);
    });
  });

  test("ORD-DOC-22: zmiana szkoły nauczyciela nie przenosi dokumentu oświadczenia @school @teacher @order @order-document @statement @isolation", async ({
    page,
    documents: d,
    scenario,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const stored = await d.upload(target, documentFile("pdf"));
    const original = (
      await test.step("API: odczyt zamówień i dokumentów szkoły", async () => d.schoolRecords())
    ).find((order) => order.fileStorage.some((file) => file.id === stored.id));
    await test.step("Sprawdzenie: toBeDefined — original", async () => {
      expect(original).toBeDefined();
    });
    const other = await test.step("Przygotowanie: dedykowana szkoła do zamówień", async () =>
      prepareOrderSchool(page, scenario, "secondary", false));
    await d.moveTeacher(other);
    await test.step("Sprawdzenie: zgodność wartości — (await d.schoolRecords()) .find((order) => order.id === original!.id)! .fileStorage.some((file) => file.id === sto…; oczekiwane: true", async () => {
      expect(
        (await d.schoolRecords())
          .find((order) => order.id === original!.id)!
          .fileStorage.some((file) => file.id === stored.id),
      ).toBe(true);
    });
    await test.step("Sprawdzenie: zgodność wartości — (await d.schoolRecords(other.id)) .flatMap((record) => record.fileStorage) .some((file) => file.id === stored.id); oczekiwane: false", async () => {
      expect(
        (await d.schoolRecords(other.id))
          .flatMap((record) => record.fileStorage)
          .some((file) => file.id === stored.id),
      ).toBe(false);
    });
    await test.step("Sprawdzenie: zgodność wartości — (await d.files(target)).some((file) => file.id === stored.id); oczekiwane: true", async () => {
      expect((await d.files(target)).some((file) => file.id === stored.id)).toBe(true);
    });
    const teacher =
      await test.step("Widok: otwarcie zamówień nauczyciela z dokumentami", async () =>
        teacherDocumentsPanel(d));
    await test.step("Widok: otwarcie podglądu dokumentu w przeglądarce", async () =>
      previewDocuments(page, teacher, await teacherDocumentRow(d, teacher, target.id)));
  });

  test("ORD-DOC-23: bez powodu Oświadczenie dodawanie plików nauczyciela jest niedostępne @teacher @order @order-document @statement @negative", async ({
    page,
    documents: d,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const form = await test.step("Widok: otwarcie edycji dokumentów oświadczenia", async () =>
      teacherDocumentEdit(d, target));
    const button = form.locator('[data-cy="button-add-file"]');
    await test.step("Sprawdzenie: dostępność działania — button", async () =>
      expect(button).toBeEnabled());
    const productRow = form.getByRole("row").filter({
      has: page.getByRole("gridcell", { name: "F7P", exact: true }),
    });
    await test.step("Sprawdzenie: liczba elementów w widoku — productRow; oczekiwane: 1", async () =>
      expect(productRow).toHaveCount(1));
    await test.step('Sprawdzenie: tekst w widoku — productRow.locator("mat-select"); oczekiwane: "Oświadczenie"', async () =>
      expect(productRow.locator("mat-select")).toHaveText("Oświadczenie"));
    await productRow.getByRole("checkbox", { disabled: false }).setChecked(true);
    // Edytor komórki AG Grid jest odtwarzany po kliknięciu. Używamy
    // osobnego dialogu zmiany powodu zamiast nietrwałej listy w komórce.
    await form.getByRole("button", { name: "Zablokuj zaznaczone", exact: true }).click();
    const blockadeDialog = page.locator("app-blockade-reason-dialog");
    await test.step("Sprawdzenie: widoczność elementu — blockadeDialog", async () =>
      expect(blockadeDialog).toBeVisible());
    await blockadeDialog.getByRole("radio", { name: "Brak", exact: true }).check();
    await blockadeDialog.getByRole("button", { name: "Zapisz", exact: true }).click();
    await test.step("Sprawdzenie: liczba elementów w widoku — blockadeDialog; oczekiwane: 0", async () =>
      expect(blockadeDialog).toHaveCount(0));
    await test.step('Sprawdzenie: tekst w widoku — productRow.locator("mat-select"); oczekiwane: ""', async () =>
      expect(productRow.locator("mat-select")).toHaveText(""));
    await test.step("Sprawdzenie: zablokowanie działania — button", async () =>
      expect(button).toBeDisabled());
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
      const target =
        await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
          d.statement());
      const form = await test.step("Widok: otwarcie edycji dokumentów oświadczenia", async () =>
        teacherDocumentEdit(d, target));
      const file =
        kind === "format"
          ? { name: "plik.exe", mimeType: "application/octet-stream", buffer: Buffer.from("test") }
          : { ...documentFile("png"), buffer: Buffer.alloc(10 * 1024 * 1024 + 1) };
      await uploadOrderAttachmentExpectRejected(page, form, file);
      await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: []", async () => {
        expect(await d.files(target)).toEqual([]);
      });
      await cancelOrderForm(form);
    });
  }

  test("ORD-DOC-26: oświadczenie akceptuje granicę 10 MB w formularzu @teacher @order @order-document @statement @boundary", async ({
    page,
    documents: d,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const form = await test.step("Widok: otwarcie edycji dokumentów oświadczenia", async () =>
      teacherDocumentEdit(d, target));
    const small = documentFile("png");
    await uploadOrderAttachment(page, form, {
      ...small,
      buffer: Buffer.concat([small.buffer, Buffer.alloc(10 * 1024 * 1024 - small.buffer.length)]),
    });
    await test.step("Sprawdzenie: widoczność elementu — form.getByText(small.name, { exact: true })", async () =>
      expect(form.getByText(small.name, { exact: true })).toBeVisible());
    await cancelOrderForm(form);
  });

  test("ORD-DOC-27: oświadczenie jest tylko do odczytu z poziomu zamówień szkoły @school @teacher @order @order-document @statement @readonly", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const file = await d.upload(target, documentFile("png"));
    const mapped = (
      await test.step("API: odczyt zamówień i dokumentów szkoły", async () => d.schoolRecords())
    ).find((order) => order.fileStorage.some((item) => item.id === file.id));
    await test.step("Sprawdzenie: toBeDefined — mapped", async () => {
      expect(mapped).toBeDefined();
    });
    const panel =
      await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
        showClassOrders(page, api));
    await orderRow(panel, String(mapped!.id)).click();
    await test.step("Sprawdzenie: zablokowanie działania — panel.locator('[data-cy=\"manually-edit-order-btn\"]')", async () =>
      expect(panel.locator('[data-cy="manually-edit-order-btn"]')).toBeDisabled());
    await test.step("Widok: otwarcie edycji dokumentów oświadczenia", async () =>
      teacherDocumentEdit(d, target));
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
    await test.step("Sprawdzenie: zgodność ze wzorcem — reference.schoolName; oczekiwane: /^AUTO_/", async () => {
      expect(reference.schoolName).toMatch(/^AUTO_/);
    });
    await scenario.app.openPanel("school", reference.schoolId);
    await test.step('Sprawdzenie: wartość pola w widoku — scenario.app.detail("name"); oczekiwane: reference.schoolName', async () =>
      expect(scenario.app.detail("name")).toHaveValue(reference.schoolName));
    const panel = await openOrders(page);
    await orderRow(panel, reference.id).click();
    await test.step("Sprawdzenie: zablokowanie działania — panel.locator('[data-cy=\"manually-edit-order-btn\"]')", async () =>
      expect(panel.locator('[data-cy="manually-edit-order-btn"]')).toBeDisabled());
  });

  test("ORD-DOC-29: usunięcie oświadczenia usuwa widoczne powiązania dokumentów u nauczyciela i w szkole @school @teacher @order @order-document @statement @delete", async ({
    page,
    documents: d,
  }) => {
    const target =
      await test.step("Przygotowanie: utworzenie zamówienia nauczycielskiego typu Oświadczenie", async () =>
        d.statement());
    const stored = await d.upload(target, documentFile("pdf"));
    await test.step("Sprawdzenie: zgodność wartości — (await d.schoolRecords()) .flatMap((order) => order.fileStorage) .some((file) => file.id === stored.id); oczekiwane: true", async () => {
      expect(
        (await d.schoolRecords())
          .flatMap((order) => order.fileStorage)
          .some((file) => file.id === stored.id),
      ).toBe(true);
    });
    await d.removeStatement(target);
    await test.step("Sprawdzenie: zgodność wartości — (await d.teacherRecords()).some((order) => String(order.id) === target.id); oczekiwane: false", async () => {
      expect((await d.teacherRecords()).some((order) => String(order.id) === target.id)).toBe(
        false,
      );
    });
    await test.step("Porównanie: stan zapisany w API po aktualizacji; oczekiwane: false", async () =>
      expect
        .poll(async () =>
          (await d.schoolRecords())
            .flatMap((order) => order.fileStorage)
            .some((file) => file.id === stored.id),
        )
        .toBe(false));
    const panel = await test.step("Widok: otwarcie zamówień nauczyciela z dokumentami", async () =>
      teacherDocumentsPanel(d));
    await test.step("Sprawdzenie: liczba elementów w widoku — teacherDocumentRows(panel); oczekiwane: 0", async () =>
      expect(teacherDocumentRows(panel)).toHaveCount(0));
  });

  test("ORD-DOC-30: edycja przez formularz zmienia produkt i ilość bez utraty dokumentu @school @order @order-document @edit", async ({
    page,
    documents: d,
    classOrders: api,
  }) => {
    const originalProduct =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("F7P", [7]));
    const replacement =
      await test.step("Przygotowanie: wyszukanie produktu z wymaganą klasą", async () =>
        api.product("P5Pv", [5]));
    const id = await api.save([{ product: originalProduct, quantity: 1 }]);
    const target: DocumentTarget = { kind: "school", id };
    const original = await d.upload(target, documentFile("pdf"));
    await test.step("Widok: otwarcie zamówień szkoły przygotowanych przez API", async () =>
      showClassOrders(page, api));
    const form = await openOrderEdit(page, id);
    await selectSelectedProduct(form, originalProduct.businessCode);
    await moveSelectedProductsLeft(form);
    await selectOrderSingleFilter(page, form, "subject", "Język polski");
    await selectOrderSingleFilter(page, form, "level", "Szkoła Podstawowa");
    await selectOrderClasses(page, form, ["5"]);
    await addOrderProduct(form, replacement.businessCode);
    await setOrderQuantity(form, replacement.businessCode, "3");
    await saveOrderEdit(form);
    await test.step("Porównanie: stan zapisany w API po aktualizacji; oczekiwane: [{ id: replacement.id, quantity: 3 }]", async () =>
      expect
        .poll(async () =>
          (await api.orders())
            .find((order) => String(order.id) === id)
            ?.orderItems.map((item) => ({ id: item.dictOrderItemId, quantity: item.quantity })),
        )
        .toEqual([{ id: replacement.id, quantity: 3 }]));
    await test.step("Sprawdzenie: zgodność całej struktury i wartości — await d.files(target); oczekiwane: [original]", async () => {
      expect(await d.files(target)).toEqual([original]);
    });
  });
});
