import { test, expect } from "./support/scenario";

test("ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  // Jawny produkt z katalogu dev: brak produktu ma ujawnić zmianę danych referencyjnych.
  const code = "KMLT18";
  await s.record("productCode", code);
  await s.record("quantity", "1");
  const orders = page
    .getByRole("tabpanel", { name: "Zamówienia", exact: true })
    .last();
  let title = "";
  let orderId = "";
  await test.step("Znajdź produkt i dodaj jedną sztukę do zamówienia", async () => {
    await page.getByRole("tab", { name: "Zamówienia", exact: true }).click();
    await orders.getByRole("button", { name: "Dodaj", exact: true }).click();
    const form = s.app.dialog("Dodaj zamówienie");
    await form.getByPlaceholder("Wpisz", { exact: true }).fill(code);
    await form.getByRole("button", { name: "Szukaj", exact: true }).click();
    const available = form.getByRole("treegrid").filter({
      has: page.getByRole("columnheader", { name: "Dodaj", exact: true }),
    });
    const product = available
      .getByRole("row")
      .filter({ has: page.getByRole("gridcell", { name: code, exact: true }) });
    await expect(product).toHaveCount(1);
    title = (await product.getByRole("gridcell").nth(3).innerText()).trim();
    expect(title).not.toBe("");
    await s.record("productTitle", title);
    await product.getByRole("checkbox").check();
    await form
      .getByRole("button")
      .filter({
        has: page.locator("mat-icon").filter({ hasText: /^arrow_right$/ }),
      })
      .click();
    const selected = form.getByRole("treegrid").filter({
      has: page.getByRole("columnheader", { name: "Ilość", exact: true }),
    });
    await expect(
      selected.getByRole("row").filter({ has: page.getByRole("gridcell") }),
    ).toHaveCount(1);
    await expect(
      selected.getByRole("gridcell", { name: code, exact: true }),
    ).toBeVisible();
    // Kliknięcie uruchamia edytor AG Grid; samo fill na rendererze nie zapisuje wartości.
    await selected.getByRole("spinbutton").click();
    await selected.getByRole("spinbutton").fill("1");
    await selected.getByRole("spinbutton").press("Tab");
    await expect(selected.getByRole("spinbutton")).toHaveValue("1");
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    const saved = orders.locator("td.mat-column-id");
    await expect(saved).toHaveCount(1);
    orderId = (await saved.innerText()).trim();
    expect(orderId).toMatch(/^\d+$/);
    await s.record("orderId", orderId);
  });
  await test.step("Otwórz ponownie szkołę i sprawdź szczegóły tego samego zamówienia", async () => {
    await s.app.openPanel("school", schoolId);
    await page.getByRole("tab", { name: "Zamówienia", exact: true }).click();
    const row = orders
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: orderId, exact: true }) });
    await expect(row).toHaveCount(1);
    await row
      .locator("mat-icon")
      .filter({ hasText: "keyboard_arrow_down" })
      .click();
    const items = orders
      .getByRole("table")
      .filter({
        has: page.getByRole("columnheader", { name: "Ilość", exact: true }),
      })
      .last();
    const item = items
      .getByRole("row")
      .filter({ has: page.getByRole("cell", { name: code, exact: true }) });
    await expect(
      items.getByRole("row").filter({ has: page.getByRole("cell") }),
    ).toHaveCount(1);
    await expect(item.getByRole("cell").nth(0)).toHaveText(title);
    await expect(item.getByRole("cell").nth(4)).toHaveText("1");
    await expect(
      orders.getByText("Adres " + s.schoolName, { exact: false }),
    ).toBeVisible();
  });
});

test("ORD-02: zamówienie szkoły z dwoma produktami zachowuje produkty i ilości po ponownym otwarciu @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();

  const code1 = "KMLT18";
  const code2 = "4P-2";

  const quantity1 = "1";
  const quantity2 = "2";

  await s.record("productCode1", code1);
  await s.record("productCode2", code2);
  await s.record("quantity1", quantity1);
  await s.record("quantity2", quantity2);

  const orders = page
    .getByRole("tabpanel", { name: "Zamówienia", exact: true })
    .last();

  let title1 = "";
  let title2 = "";
  let orderId = "";

  await test.step("Otwórz formularz dodawania zamówienia", async () => {
    await page.getByRole("tab", { name: "Zamówienia", exact: true }).click();

    await orders.getByRole("button", { name: "Dodaj", exact: true }).click();
  });

  await test.step("Dodaj pierwszy produkt do zamówienia", async () => {
    const form = s.app.dialog("Dodaj zamówienie");

    const searchInput = form.getByPlaceholder("Wpisz", { exact: true });

    await searchInput.fill(code1);

    await form.getByRole("button", { name: "Szukaj", exact: true }).click();

    const available = form.getByRole("treegrid").filter({
      has: page.getByRole("columnheader", {
        name: "Dodaj",
        exact: true,
      }),
    });

    const product = available.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: code1,
        exact: true,
      }),
    });

    await expect(product).toHaveCount(1);

    title1 = (await product.getByRole("gridcell").nth(3).innerText()).trim();

    expect(title1).not.toBe("");

    await s.record("productTitle1", title1);

    await product.getByRole("checkbox").check();

    await form
      .getByRole("button")
      .filter({
        has: page.locator("mat-icon").filter({ hasText: /^arrow_right$/ }),
      })
      .click();
  });

  await test.step("Dodaj drugi produkt do zamówienia", async () => {
    const form = s.app.dialog("Dodaj zamówienie");

    const searchInput = form.getByPlaceholder("Wpisz", { exact: true });

    await searchInput.fill(code2);

    await form.getByRole("button", { name: "Szukaj", exact: true }).click();

    const available = form.getByRole("treegrid").filter({
      has: page.getByRole("columnheader", {
        name: "Dodaj",
        exact: true,
      }),
    });

    const product = available.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: code2,
        exact: true,
      }),
    });

    await expect(product).toHaveCount(1);

    title2 = (await product.getByRole("gridcell").nth(3).innerText()).trim();

    expect(title2).not.toBe("");

    await s.record("productTitle2", title2);

    await product.getByRole("checkbox").check();

    await form
      .getByRole("button")
      .filter({
        has: page.locator("mat-icon").filter({ hasText: /^arrow_right$/ }),
      })
      .click();
  });

  await test.step("Ustaw ilości obu produktów i zapisz zamówienie", async () => {
    const form = s.app.dialog("Dodaj zamówienie");

    const selected = form.getByRole("treegrid").filter({
      has: page.getByRole("columnheader", {
        name: "Ilość",
        exact: true,
      }),
    });

    const selectedRows = selected
      .getByRole("row")
      .filter({ has: page.getByRole("gridcell") });

    await expect(selectedRows).toHaveCount(2);

    const product1Row = selected.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: code1,
        exact: true,
      }),
    });

    const product2Row = selected.getByRole("row").filter({
      has: page.getByRole("gridcell", {
        name: code2,
        exact: true,
      }),
    });

    await expect(product1Row).toHaveCount(1);
    await expect(product2Row).toHaveCount(1);

    // AG Grid — kliknięcie uruchamia edytor ilości.
    const quantityInput1 = product1Row.getByRole("spinbutton");

    await quantityInput1.click();
    await quantityInput1.fill(quantity1);
    await quantityInput1.press("Tab");

    const quantityInput2 = product2Row.getByRole("spinbutton");

    await quantityInput2.click();
    await quantityInput2.fill(quantity2);
    await quantityInput2.press("Tab");

    await expect(product1Row.getByRole("spinbutton")).toHaveValue(quantity1);

    await expect(product2Row.getByRole("spinbutton")).toHaveValue(quantity2);

    await form.getByRole("button", { name: "Zapisz", exact: true }).click();

    await expect(form).toHaveCount(0);

    const saved = orders.locator("td.mat-column-id");

    await expect(saved).toHaveCount(1);

    orderId = (await saved.innerText()).trim();

    expect(orderId).toMatch(/^\d+$/);

    await s.record("orderId", orderId);
  });

  await test.step("Otwórz ponownie szkołę i sprawdź oba produkty", async () => {
    await s.app.openPanel("school", schoolId);

    await page.getByRole("tab", { name: "Zamówienia", exact: true }).click();

    const row = orders.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: orderId,
        exact: true,
      }),
    });

    await expect(row).toHaveCount(1);

    await row
      .locator("mat-icon")
      .filter({ hasText: "keyboard_arrow_down" })
      .click();

    const items = orders
      .getByRole("table")
      .filter({
        has: page.getByRole("columnheader", {
          name: "Ilość",
          exact: true,
        }),
      })
      .last();

    const product1 = items.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: code1,
        exact: true,
      }),
    });

    const product2 = items.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: code2,
        exact: true,
      }),
    });

    // Zamówienie musi zawierać dokładnie dwa produkty.
    await expect(
      items.getByRole("row").filter({ has: page.getByRole("cell") }),
    ).toHaveCount(2);

    // Produkt 1.
    await expect(product1).toHaveCount(1);
    await expect(product1.getByRole("cell").nth(0)).toHaveText(title1);
    await expect(product1.getByRole("cell").nth(4)).toHaveText(quantity1);

    // Produkt 2.
    await expect(product2).toHaveCount(1);
    await expect(product2.getByRole("cell").nth(0)).toHaveText(title2);
    await expect(product2.getByRole("cell").nth(4)).toHaveText(quantity2);

    // Zamówienie nadal należy do właściwej szkoły.
    await expect(
      orders.getByText("Adres " + s.schoolName, { exact: false }),
    ).toBeVisible();
  });
});

test("ORD-03: edycja ilości dwóch produktów w zamówieniu i usunięcie zamówienia @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();

  const code1 = "KMLT18";
  const code2 = "4P-2";

  const initialQuantity1 = "1";
  const initialQuantity2 = "2";

  const editedQuantity1 = "3";
  const editedQuantity2 = "5";

  const orders = page
    .getByRole("tabpanel", {
      name: "Zamówienia",
      exact: true,
    })
    .last();

  let title1 = "";
  let title2 = "";
  let orderId = "";

  /*
   * Jeżeli główny test zakończy się błędem, zapamiętujemy go.
   * Dzięki temu ewentualny problem cleanupu nie przykryje
   * pierwotnej przyczyny FAIL-a.
   */
  let scenarioError: unknown;

  await s.record("productCode1", code1);
  await s.record("productCode2", code2);

  await s.record("initialQuantity1", initialQuantity1);

  await s.record("initialQuantity2", initialQuantity2);

  await s.record("editedQuantity1", editedQuantity1);

  await s.record("editedQuantity2", editedQuantity2);

  try {
    /*
     * =====================================================
     * 1. TWORZENIE ZAMÓWIENIA
     * =====================================================
     */

    await test.step("Utwórz zamówienie z dwoma produktami", async () => {
      await page
        .getByRole("tab", {
          name: "Zamówienia",
          exact: true,
        })
        .click();

      await orders
        .getByRole("button", {
          name: "Dodaj",
          exact: true,
        })
        .click();

      const form = s.app.dialog("Dodaj zamówienie");

      const searchInput = form.getByPlaceholder("Wpisz", { exact: true });

      const available = form.getByRole("treegrid").filter({
        has: page.getByRole("columnheader", {
          name: "Dodaj",
          exact: true,
        }),
      });

      /*
       * ---------------------------------------------
       * Produkt 1
       * ---------------------------------------------
       */

      await searchInput.fill(code1);

      await form
        .getByRole("button", {
          name: "Szukaj",
          exact: true,
        })
        .click();

      const product1 = available.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: code1,
          exact: true,
        }),
      });

      await expect(product1).toHaveCount(1);

      title1 = (await product1.getByRole("gridcell").nth(3).innerText()).trim();

      expect(title1).not.toBe("");

      await s.record("productTitle1", title1);

      await product1.getByRole("checkbox").check();

      await form
        .getByRole("button")
        .filter({
          has: page.locator("mat-icon").filter({
            hasText: /^arrow_right$/,
          }),
        })
        .click();

      /*
       * ---------------------------------------------
       * Produkt 2
       * ---------------------------------------------
       */

      await searchInput.fill(code2);

      await form
        .getByRole("button", {
          name: "Szukaj",
          exact: true,
        })
        .click();

      const product2 = available.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: code2,
          exact: true,
        }),
      });

      await expect(product2).toHaveCount(1);

      title2 = (await product2.getByRole("gridcell").nth(3).innerText()).trim();

      expect(title2).not.toBe("");

      await s.record("productTitle2", title2);

      await product2.getByRole("checkbox").check();

      await form
        .getByRole("button")
        .filter({
          has: page.locator("mat-icon").filter({
            hasText: /^arrow_right$/,
          }),
        })
        .click();

      /*
       * ---------------------------------------------
       * Wybrane produkty
       * ---------------------------------------------
       */

      const selected = form.getByRole("treegrid").filter({
        has: page.getByRole("columnheader", {
          name: "Ilość",
          exact: true,
        }),
      });

      const selectedRows = selected.getByRole("row").filter({
        has: page.getByRole("gridcell"),
      });

      await expect(selectedRows).toHaveCount(2);

      /*
       * Produkt 1
       */

      const selectedProduct1 = selected.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: code1,
          exact: true,
        }),
      });

      await expect(selectedProduct1).toHaveCount(1);

      const quantity1 = selectedProduct1.getByRole("spinbutton");

      /*
       * AG Grid:
       * najpierw click, potem fill.
       */
      await quantity1.click();

      await quantity1.fill(initialQuantity1);

      await quantity1.press("Tab");

      /*
       * Produkt 2
       */

      const selectedProduct2 = selected.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: code2,
          exact: true,
        }),
      });

      await expect(selectedProduct2).toHaveCount(1);

      const quantity2 = selectedProduct2.getByRole("spinbutton");

      await quantity2.click();

      await quantity2.fill(initialQuantity2);

      await quantity2.press("Tab");

      /*
       * Kontrola przed zapisem.
       */

      await expect(selectedProduct1.getByRole("spinbutton")).toHaveValue(
        initialQuantity1,
      );

      await expect(selectedProduct2.getByRole("spinbutton")).toHaveValue(
        initialQuantity2,
      );

      /*
       * Zapis zamówienia.
       */

      await form
        .getByRole("button", {
          name: "Zapisz",
          exact: true,
        })
        .click();

      await expect(form).toHaveCount(0);

      /*
       * Pobranie ID utworzonego zamówienia.
       */

      const saved = orders.locator("td.mat-column-id");

      await expect(saved).toHaveCount(1);

      orderId = (await saved.innerText()).trim();

      expect(orderId).toMatch(/^\d+$/);

      await s.record("orderId", orderId);
    });

    /*
     * =====================================================
     * 2. SPRAWDZENIE ZAPISANEGO ZAMÓWIENIA
     * =====================================================
     */

    await test.step("Otwórz ponownie szkołę i sprawdź początkowe ilości produktów", async () => {
      await s.app.openPanel("school", schoolId);

      await page
        .getByRole("tab", {
          name: "Zamówienia",
          exact: true,
        })
        .click();

      const orderRow = orders.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: orderId,
          exact: true,
        }),
      });

      await expect(orderRow).toHaveCount(1);

      /*
       * Rozwinięcie pozycji zamówienia.
       */

      await orderRow
        .locator("mat-icon")
        .filter({
          hasText: "keyboard_arrow_down",
        })
        .click();

      const items = orders
        .getByRole("table")
        .filter({
          has: page.getByRole("columnheader", {
            name: "Ilość",
            exact: true,
          }),
        })
        .last();

      const itemRows = items.getByRole("row").filter({
        has: page.getByRole("cell"),
      });

      await expect(itemRows).toHaveCount(2);

      const item1 = items.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: code1,
          exact: true,
        }),
      });

      const item2 = items.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: code2,
          exact: true,
        }),
      });

      await expect(item1).toHaveCount(1);

      await expect(item2).toHaveCount(1);

      /*
       * Nazwy produktów.
       */

      await expect(item1.getByRole("cell").nth(0)).toHaveText(title1);

      await expect(item2.getByRole("cell").nth(0)).toHaveText(title2);

      /*
       * Początkowe ilości.
       */

      await expect(item1.getByRole("cell").nth(4)).toHaveText(initialQuantity1);

      await expect(item2.getByRole("cell").nth(4)).toHaveText(initialQuantity2);
    });

    /*
     * =====================================================
     * 3. EDYCJA ZAMÓWIENIA
     * =====================================================
     */

    await test.step("Edytuj ilości obu produktów", async () => {
      /*
       * Ponownie otwieramy panel.
       * Dzięki temu pracujemy na świeżych danych.
       */
      await s.app.openPanel("school", schoolId);

      await page
        .getByRole("tab", {
          name: "Zamówienia",
          exact: true,
        })
        .click();

      const orderRow = orders.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: orderId,
          exact: true,
        }),
      });

      await expect(orderRow).toHaveCount(1);

      /*
       * WAŻNE:
       * najpierw klikamy konkretny wiersz.
       * Dopiero wtedy przycisk Edytuj jest aktywny.
       */
      await orderRow.click();

      /*
       * Na screenie/DOM przycisk ma stabilny data-cy:
       *
       * data-cy="manually-edit-order-btn"
       */
      const editButton = orders.locator('[data-cy="manually-edit-order-btn"]');

      await expect(editButton).toBeEnabled();

      await editButton.click();

      /*
       * Nie znamy jeszcze dokładnego nagłówka
       * dialogu edycji, dlatego pobieramy
       * aktualnie otwarty mat-dialog.
       */
      const form = page.locator("mat-dialog-container").last();

      await expect(form).toBeVisible();

      /*
       * Tabela produktów w edycji.
       */
      const selected = form.getByRole("treegrid").filter({
        has: page.getByRole("columnheader", {
          name: "Ilość",
          exact: true,
        }),
      });

      const selectedRows = selected.getByRole("row").filter({
        has: page.getByRole("gridcell"),
      });

      await expect(selectedRows).toHaveCount(2);

      /*
       * ---------------------------------------------
       * Produkt 1
       * ---------------------------------------------
       */

      const product1Row = selected.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: code1,
          exact: true,
        }),
      });

      await expect(product1Row).toHaveCount(1);

      const quantity1 = product1Row.getByRole("spinbutton");

      await quantity1.click();

      await quantity1.fill(editedQuantity1);

      await quantity1.press("Tab");

      /*
       * ---------------------------------------------
       * Produkt 2
       * ---------------------------------------------
       */

      const product2Row = selected.getByRole("row").filter({
        has: page.getByRole("gridcell", {
          name: code2,
          exact: true,
        }),
      });

      await expect(product2Row).toHaveCount(1);

      const quantity2 = product2Row.getByRole("spinbutton");

      await quantity2.click();

      await quantity2.fill(editedQuantity2);

      await quantity2.press("Tab");

      /*
       * Kontrola wartości w formularzu
       * przed zapisem.
       */

      await expect(product1Row.getByRole("spinbutton")).toHaveValue(
        editedQuantity1,
      );

      await expect(product2Row.getByRole("spinbutton")).toHaveValue(
        editedQuantity2,
      );

      /*
       * Zapis zmian.
       */

      await form
        .getByRole("button", {
          name: "Zapisz",
          exact: true,
        })
        .click();

      await expect(form).toHaveCount(0);

      await s.record("orderEdited", "true");
    });

    /*
     * =====================================================
     * 4. SPRAWDZENIE TRWAŁOŚCI EDYCJI
     * =====================================================
     */

    await test.step("Otwórz szkołę ponownie i sprawdź zmienione ilości", async () => {
      await s.app.openPanel("school", schoolId);

      await page
        .getByRole("tab", {
          name: "Zamówienia",
          exact: true,
        })
        .click();

      const orderRow = orders.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: orderId,
          exact: true,
        }),
      });

      await expect(orderRow).toHaveCount(1);

      /*
       * Rozwinięcie zamówienia.
       */

      await orderRow
        .locator("mat-icon")
        .filter({
          hasText: "keyboard_arrow_down",
        })
        .click();

      const items = orders
        .getByRole("table")
        .filter({
          has: page.getByRole("columnheader", {
            name: "Ilość",
            exact: true,
          }),
        })
        .last();

      /*
       * Nadal mają istnieć dokładnie
       * dwie pozycje.
       */

      await expect(
        items.getByRole("row").filter({
          has: page.getByRole("cell"),
        }),
      ).toHaveCount(2);

      const item1 = items.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: code1,
          exact: true,
        }),
      });

      const item2 = items.getByRole("row").filter({
        has: page.getByRole("cell", {
          name: code2,
          exact: true,
        }),
      });

      await expect(item1).toHaveCount(1);

      await expect(item2).toHaveCount(1);

      /*
       * Produkty nie powinny się zmienić.
       */

      await expect(item1.getByRole("cell").nth(0)).toHaveText(title1);

      await expect(item2.getByRole("cell").nth(0)).toHaveText(title2);

      /*
       * Najważniejsza asercja:
       * zmienione ilości są trwałe
       * po ponownym pobraniu danych.
       */

      await expect(item1.getByRole("cell").nth(4)).toHaveText(editedQuantity1);

      await expect(item2.getByRole("cell").nth(4)).toHaveText(editedQuantity2);

      /*
       * Zamówienie nadal należy
       * do właściwej szkoły.
       */

      await expect(
        orders.getByText("Adres " + s.schoolName, {
          exact: false,
        }),
      ).toBeVisible();
    });
  } catch (error) {
    /*
     * Zapamiętujemy pierwotny FAIL.
     * Cleanup wykona się w finally.
     */
    scenarioError = error;

    throw error;
  } finally {
    /*
     * =====================================================
     * 5. CLEANUP — USUNIĘCIE ZAMÓWIENIA
     * =====================================================
     *
     * Wykonujemy także po FAIL,
     * jeśli udało się wcześniej uzyskać orderId.
     */

    if (orderId) {
      try {
        await test.step("Cleanup: usuń utworzone zamówienie", async () => {
          await s.app.openPanel("school", schoolId);

          await page
            .getByRole("tab", {
              name: "Zamówienia",
              exact: true,
            })
            .click();

          const orderRow = orders.getByRole("row").filter({
            has: page.getByRole("cell", {
              name: orderId,
              exact: true,
            }),
          });

          /*
           * Jeżeli zamówienie z jakiegoś powodu
           * już nie istnieje, cleanup uznajemy
           * za zakończony.
           */
          if ((await orderRow.count()) === 0) {
            await s.record("orderCleanup", "ALREADY_ABSENT");

            return;
          }

          await expect(orderRow).toHaveCount(1);

          /*
           * WAŻNE:
           * zaznaczamy wiersz zamówienia.
           *
           * Dopiero wtedy przycisk "Usuń"
           * jest aktywny.
           */
          await orderRow.click();

          const deleteButton = orders.getByRole("button", {
            name: "Usuń",
            exact: true,
          });

          await expect(deleteButton).toBeEnabled();

          await deleteButton.click();

          /*
           * Octopus może pokazać dialog
           * potwierdzający usunięcie.
           *
           * Ponieważ nie mamy jeszcze
           * screena tego dialogu,
           * kod obsługuje kilka typowych
           * nazw przycisku potwierdzającego.
           */

          const confirmation = page.locator("mat-dialog-container").last();

          /*
           * Dajemy krótki czas na pojawienie
           * się dialogu.
           *
           * Jeżeli aplikacja usuwa bez dialogu,
           * przechodzimy dalej.
           */
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
           * Najważniejsza asercja cleanupu:
           * zamówienie o naszym ID
           * musi zniknąć z tabeli.
           */

          await expect(
            orders.getByRole("row").filter({
              has: page.getByRole("cell", {
                name: orderId,
                exact: true,
              }),
            }),
          ).toHaveCount(0);

          await s.record("orderCleanup", "DELETED");
        });
      } catch (cleanupError) {
        await s.record("orderCleanup", "FAILED");

        /*
         * Jeżeli sam scenariusz był poprawny,
         * błąd cleanupu powinien wywalić test.
         *
         * Jeżeli test już wcześniej miał FAIL,
         * nie przykrywamy pierwotnego błędu
         * błędem sprzątania.
         */
        if (!scenarioError) {
          throw cleanupError;
        }

        console.error(
          `Cleanup zamówienia ${orderId} nie powiódł się:`,
          cleanupError,
        );
      }
    }
  }
});

test("CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);
  const subjects = page.locator("app-teacher-subjects");
  const subjectRow = subjects.getByRole("row").filter({
    has: page.getByRole("cell", { name: "Matematyka", exact: true }),
  });
  const confirmations = page.getByRole("tabpanel", {
    name: "Potwierdzenia",
    exact: true,
  });
  let schoolYear = "";
  let confirmationId = "";
  await test.step("Dodaj matematykę na poziomie szkoły podstawowej", async () => {
    await subjects.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Matematyka", exact: true }).click();
    await subjects.getByRole("combobox").nth(1).click();
    await page
      .getByRole("option", { name: "Szkoła Podstawowa", exact: true })
      .click();
    await subjects.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect(
      subjectRow.getByRole("cell", { name: "SP", exact: true }),
    ).toBeVisible();
    await s.app.openPanel("teacher", teacherId);
    await expect(
      subjectRow.getByRole("cell", { name: "SP", exact: true }),
    ).toBeVisible();
  });
  await test.step("Dodaj formularz klubowy dla klasy 4 bez wysyłki e-maila", async () => {
    await confirmations
      .getByRole("button", { name: "Dodaj formularz", exact: true })
      .click();
    const form = s.app.dialog("Formularz klubowy");
    schoolYear = (
      await form
        .locator("mat-radio-button")
        .filter({ has: page.getByRole("radio", { checked: true }) })
        .innerText()
    ).trim();
    expect(schoolYear).toMatch(/^\d{4}\/\d{4}$/);
    await s.record("schoolYear", schoolYear);
    await s.record("subject", "Matematyka");
    await s.record("level", "SP");
    await s.record("class", "4");
    await expect(form.getByRole("combobox")).toHaveText("Matematyka");
    await form
      .getByRole("row")
      .filter({ hasText: s.schoolName })
      .getByRole("checkbox")
      .check();
    await form
      .locator(".green-box")
      .getByRole("checkbox", { name: "4", exact: true })
      .check();
    const email = form.getByRole("checkbox", {
      name: "Wysłać maila do nauczyciela",
      exact: true,
    });
    await email.uncheck();
    await expect(email).not.toBeChecked();
    await s.record("sendEmail", "false");
    await form.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(form).toHaveCount(0);
    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", { name: "Matematyka", exact: true }),
    });
    await expect(row).toHaveCount(1);
    confirmationId = (await row.getByRole("cell").nth(1).innerText()).trim();
    expect(confirmationId).toMatch(/^\d+$/);
    await s.record("confirmationId", confirmationId);
  });
  await test.step("Sprawdź zapisany formularz, szkołę, klasę i status Nasz", async () => {
    await s.app.openPanel("teacher", teacherId);
    await expect(
      subjectRow.getByRole("cell", { name: "Nasz", exact: true }),
    ).toBeVisible();
    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", { name: confirmationId, exact: true }),
    });
    await expect(row).toHaveCount(1);
    await expect(
      row.getByRole("cell", { name: "Matematyka", exact: true }),
    ).toBeVisible();
    await expect(
      row.getByRole("cell", { name: "SP", exact: true }),
    ).toBeVisible();
    await expect(
      row.getByRole("cell", { name: schoolYear, exact: true }),
    ).toBeVisible();
    await row
      .locator("mat-icon")
      .filter({ hasText: "keyboard_arrow_down" })
      .click();
    const details = confirmations.locator("app-form-clubs-inner-table");
    const detail = details
      .getByRole("row")
      .filter({ has: page.getByRole("cell") });
    await expect(detail).toHaveCount(1);
    await expect(detail.getByRole("cell").nth(1)).toContainText(s.schoolName);
    await expect(
      detail.getByRole("cell", { name: "SP", exact: true }),
    ).toBeVisible();
    await expect(
      detail.getByRole("cell", { name: "4", exact: true }),
    ).toBeVisible();
    await expect(
      detail.getByRole("cell").last().locator("mat-icon"),
    ).toHaveText("check_circle_outline");
  });
});

test("CLUB-02: edycja klasy w formularzu klubowym jest trwała @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  const subjects = page.locator("app-teacher-subjects");

  const subjectRow = subjects.getByRole("row").filter({
    has: page.getByRole("cell", {
      name: "Matematyka",
      exact: true,
    }),
  });

  const confirmations = page.getByRole("tabpanel", {
    name: "Potwierdzenia",
    exact: true,
  });

  const initialClass = "4";
  const editedClass = "5";

  let schoolYear = "";
  let confirmationId = "";

  await s.record("subject", "Matematyka");
  await s.record("level", "SP");
  await s.record("initialClass", initialClass);
  await s.record("editedClass", editedClass);

  /*
   * =====================================================
   * 1. PRZEDMIOTO-POZIOM
   * =====================================================
   */

  await test.step("Dodaj matematykę na poziomie szkoły podstawowej", async () => {
    await subjects.getByRole("combobox").nth(0).click();

    await page
      .getByRole("option", {
        name: "Matematyka",
        exact: true,
      })
      .click();

    await subjects.getByRole("combobox").nth(1).click();

    await page
      .getByRole("option", {
        name: "Szkoła Podstawowa",
        exact: true,
      })
      .click();

    await subjects
      .getByRole("button", {
        name: "Dodaj",
        exact: true,
      })
      .click();

    await expect(
      subjectRow.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Sprawdzamy trwałość po ponownym otwarciu.
     */
    await s.app.openPanel("teacher", teacherId);

    await expect(
      subjectRow.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();
  });

  /*
   * =====================================================
   * 2. UTWORZENIE FORMULARZA KLUBOWEGO
   * =====================================================
   */

  await test.step("Utwórz formularz klubowy dla klasy 4", async () => {
    await confirmations
      .getByRole("button", {
        name: "Dodaj formularz",
        exact: true,
      })
      .click();

    const form = s.app.dialog("Formularz klubowy");

    /*
     * Odczytujemy domyślnie wybrany rok szkolny.
     */
    schoolYear = (
      await form
        .locator("mat-radio-button")
        .filter({
          has: page.getByRole("radio", { checked: true }),
        })
        .innerText()
    ).trim();

    expect(schoolYear).toMatch(/^\d{4}\/\d{4}$/);

    await s.record("schoolYear", schoolYear);

    /*
     * Przedmiot powinien być już wybrany
     * na podstawie przedmioto-poziomu.
     */
    await expect(form.getByRole("combobox")).toHaveText("Matematyka");

    /*
     * Wybieramy szkołę nauczyciela.
     */
    const schoolRow = form.getByRole("row").filter({
      hasText: s.schoolName,
    });

    await expect(schoolRow).toBeVisible();

    await schoolRow.getByRole("checkbox").check();

    /*
     * Wybieramy klasę 4 w zielonej sekcji "nasze".
     */
    const ourClasses = form.locator(".green-box");

    const class4 = ourClasses.getByRole("checkbox", {
      name: initialClass,
      exact: true,
    });

    await class4.check();

    await expect(class4).toBeChecked();

    /*
     * Test nie może wysyłać maila.
     */
    const email = form.getByRole("checkbox", {
      name: "Wysłać maila do nauczyciela",
      exact: true,
    });

    await email.uncheck();

    await expect(email).not.toBeChecked();

    await s.record("sendEmail", "false");

    /*
     * Zapis.
     */
    await form
      .getByRole("button", {
        name: "Zapisz",
        exact: true,
      })
      .click();

    await expect(form).toHaveCount(0);

    /*
     * Szukamy właśnie utworzonego formularza.
     */
    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

    await expect(row).toHaveCount(1);

    confirmationId = (await row.getByRole("cell").nth(1).innerText()).trim();

    expect(confirmationId).toMatch(/^\d+$/);

    await s.record("confirmationId", confirmationId);
  });

  /*
   * =====================================================
   * 3. WERYFIKACJA PRZED EDYCJĄ
   * =====================================================
   */

  await test.step("Sprawdź formularz z klasą 4 przed edycją", async () => {
    await s.app.openPanel("teacher", teacherId);

    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    });

    await expect(row).toHaveCount(1);

    await expect(
      row.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: schoolYear,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Rozwijamy szczegóły.
     */
    await row
      .locator("mat-icon")
      .filter({
        hasText: "keyboard_arrow_down",
      })
      .click();

    const details = confirmations.locator("app-form-clubs-inner-table");

    const detail = details.getByRole("row").filter({
      has: page.getByRole("cell"),
    });

    await expect(detail).toHaveCount(1);

    await expect(detail.getByRole("cell").nth(1)).toContainText(s.schoolName);

    await expect(
      detail.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      detail.getByRole("cell", {
        name: initialClass,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Status "Nasz".
     */
    await expect(
      detail.getByRole("cell").last().locator("mat-icon"),
    ).toHaveText("check_circle_outline");
  });

  /*
   * =====================================================
   * 4. EDYCJA FORMULARZA
   * =====================================================
   */

  await test.step("Edytuj formularz klubowy i zmień klasę 4 na 5", async () => {
    /*
     * Ponownie otwieramy nauczyciela,
     * żeby edycja zaczynała się na świeżym widoku.
     */
    await s.app.openPanel("teacher", teacherId);

    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    });

    await expect(row).toHaveCount(1);

    /*
     * WAŻNE:
     * najpierw zaznaczamy konkretny wiersz.
     * Dopiero wtedy Edytuj jest aktywny.
     */
    await row.click();

    const editButton = confirmations.getByRole("button", {
      name: "Edytuj",
      exact: true,
    });

    await expect(editButton).toBeEnabled();

    await editButton.click();

    /*
     * Na screenie dialog nadal ma tytuł
     * "Formularz klubowy".
     */
    const form = s.app.dialog("Formularz klubowy");

    await expect(form).toBeVisible();

    /*
     * Szkoła nadal musi być widoczna.
     */
    const schoolRow = form.getByRole("row").filter({
      hasText: s.schoolName,
    });

    await expect(schoolRow).toBeVisible();

    /*
     * Zielona sekcja = nasze.
     */
    const ourClasses = form.locator(".green-box");

    const class4 = ourClasses.getByRole("checkbox", {
      name: initialClass,
      exact: true,
    });

    const class5 = ourClasses.getByRole("checkbox", {
      name: editedClass,
      exact: true,
    });

    /*
     * Przed zmianą klasa 4 musi być zaznaczona.
     */
    await expect(class4).toBeChecked();

    /*
     * Nowa klasa nie może być jeszcze zaznaczona.
     */
    await expect(class5).not.toBeChecked();

    /*
     * 4 → 5
     */
    await class4.uncheck();

    await class5.check();

    await expect(class4).not.toBeChecked();

    await expect(class5).toBeChecked();

    /*
     * Nie wysyłamy wiadomości podczas edycji.
     */
    const email = form.getByRole("checkbox", {
      name: "Wysłać maila do nauczyciela",
      exact: true,
    });

    if (await email.isChecked()) {
      await email.uncheck();
    }

    await expect(email).not.toBeChecked();

    /*
     * Po zmianie Save powinien być aktywny.
     */
    const save = form.getByRole("button", {
      name: "Zapisz",
      exact: true,
    });

    await expect(save).toBeEnabled();

    await save.click();

    await expect(form).toHaveCount(0);

    await s.record("clubEdited", "true");
  });

  /*
   * =====================================================
   * 5. WERYFIKACJA EDYCJI
   * =====================================================
   */

  await test.step("Otwórz nauczyciela ponownie i sprawdź klasę 5", async () => {
    await s.app.openPanel("teacher", teacherId);

    /*
     * Formularz powinien mieć ten sam ID.
     */
    const row = confirmations.getByRole("row").filter({
      has: page.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    });

    await expect(row).toHaveCount(1);

    /*
     * Dane główne nie zmieniły się.
     */
    await expect(
      row.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      row.getByRole("cell", {
        name: schoolYear,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Rozwijamy formularz.
     */
    await row
      .locator("mat-icon")
      .filter({
        hasText: "keyboard_arrow_down",
      })
      .click();

    const details = confirmations.locator("app-form-clubs-inner-table");

    const detail = details.getByRole("row").filter({
      has: page.getByRole("cell"),
    });

    await expect(detail).toHaveCount(1);

    /*
     * Ta sama szkoła.
     */
    await expect(detail.getByRole("cell").nth(1)).toContainText(s.schoolName);

    /*
     * Ten sam poziom.
     */
    await expect(
      detail.getByRole("cell", {
        name: "SP",
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Najważniejsza asercja:
     * po edycji mamy klasę 5.
     */
    await expect(
      detail.getByRole("cell", {
        name: editedClass,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Klasa 4 nie powinna już występować.
     */
    await expect(
      detail.getByRole("cell", {
        name: initialClass,
        exact: true,
      }),
    ).toHaveCount(0);

    /*
     * Status nadal "Nasz".
     */
    await expect(
      detail.getByRole("cell").last().locator("mat-icon"),
    ).toHaveText("check_circle_outline");
  });
});
