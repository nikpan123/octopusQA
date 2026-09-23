import { test, expect } from "./support/scenario";
import {
  MATH_SP_CLASSES,
  addMathSp,
  cancelClubForm,
  clubForm,
  confirmDeleteIfShown,
  confirmationDetails,
  confirmationRow,
  confirmations,
  disableTeacherEmail,
  foreignClass,
  foreignClasses,
  openClubEdit,
  openNewClubForm,
  ownClass,
  ownClasses,
  saveClubEdit,
  saveClubForm,
  selectSchool,
} from "./support/club";
import {
  addOrderProduct,
  expandOrderItems,
  expectOrderItems,
  openNewOrderForm,
  openOrders,
  ordersPanel,
  saveNewOrder,
  setOrderQuantity,
} from "./support/order";

test("ORD-01: zamówienie szkoły zachowuje produkt i ilość po ponownym otwarciu @school @order", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  // Jawny produkt z katalogu dev: brak produktu ma ujawnić zmianę danych referencyjnych.
  const code = "KMLT18";
  await s.record("productCode", code);
  await s.record("quantity", "1");
  const orders = ordersPanel(page);
  let title = "";
  let orderId = "";
  await test.step("Znajdź produkt i dodaj jedną sztukę do zamówienia", async () => {
    const form = await openNewOrderForm(page);
    title = await addOrderProduct(form, code);
    await s.record("productTitle", title);
    await setOrderQuantity(form, code, "1");
    orderId = await saveNewOrder(page, form);
    await s.record("orderId", orderId);
  });
  await test.step("Otwórz ponownie szkołę i sprawdź szczegóły tego samego zamówienia", async () => {
    await s.app.openPanel("school", schoolId);
    await openOrders(page);
    const items = await expandOrderItems(orders, orderId);
    await expectOrderItems(items, [{ code, title, quantity: "1" }]);
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

  const orders = ordersPanel(page);

  let title1 = "";
  let title2 = "";
  let orderId = "";

  await test.step("Otwórz formularz dodawania zamówienia", async () => {
    await openNewOrderForm(page);
  });

  await test.step("Dodaj pierwszy produkt do zamówienia", async () => {
    const form = s.app.dialog("Dodaj zamówienie");
    title1 = await addOrderProduct(form, code1);
    await s.record("productTitle1", title1);
  });

  await test.step("Dodaj drugi produkt do zamówienia", async () => {
    const form = s.app.dialog("Dodaj zamówienie");
    title2 = await addOrderProduct(form, code2);
    await s.record("productTitle2", title2);
  });

  await test.step("Ustaw ilości obu produktów i zapisz zamówienie", async () => {
    const form = s.app.dialog("Dodaj zamówienie");
    await setOrderQuantity(form, code1, quantity1);
    await setOrderQuantity(form, code2, quantity2);
    orderId = await saveNewOrder(page, form);
    await s.record("orderId", orderId);
  });

  await test.step("Otwórz ponownie szkołę i sprawdź oba produkty", async () => {
    await s.app.openPanel("school", schoolId);
    await openOrders(page);
    const items = await expandOrderItems(orders, orderId);
    await expectOrderItems(items, [
      { code: code1, title: title1, quantity: quantity1 },
      { code: code2, title: title2, quantity: quantity2 },
    ]);
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

test("CLUB-02: edycja klasy 4 na 5 dla Matematyka/SP jest trwała @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form, schoolYear } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);
  await s.record("schoolYear", schoolYear);
  await s.record("initialClass", "4");
  await s.record("editedClass", "5");

  await test.step("Edytuj klasę 4 na 5", async () => {
    await s.app.openPanel("teacher", teacherId);

    const editForm = await openClubEdit(page, confirmationId);

    await expect(ownClass(editForm, "4")).toBeChecked();
    await expect(ownClass(editForm, "5")).not.toBeChecked();

    await ownClass(editForm, "4").uncheck();
    await ownClass(editForm, "5").check();

    await saveClubEdit(editForm);
  });

  await test.step("Sprawdź trwałość klasy 5 po ponownym otwarciu", async () => {
    await s.app.openPanel("teacher", teacherId);

    await expect(confirmationRow(page, confirmationId)).toHaveCount(1);

    const detail = await confirmationDetails(page, confirmationId);

    await expect(
      detail.getByRole("cell", {
        name: "5",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      detail.getByRole("cell", {
        name: "4",
        exact: true,
      }),
    ).toHaveCount(0);
  });
});

test("CLUB-03: Matematyka/SP udostępnia wyłącznie klasy 4-8 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  /*
   * Klasy pojawiają się dopiero po wybraniu szkoły.
   */
  await selectSchool(form, s.schoolName);

  await expect(form.locator(".green-box")).toBeVisible();

  await test.step("Sprawdź klasy 4-8", async () => {
    for (const classNumber of MATH_SP_CLASSES) {
      await expect(ownClass(form, classNumber)).toBeVisible();
    }
  });

  await test.step("Sprawdź brak klas 0-3", async () => {
    for (const classNumber of ["0", "1", "2", "3"]) {
      await expect(ownClass(form, classNumber)).toHaveCount(0);
    }
  });

  await cancelClubForm(form);
});

test("CLUB-04: formularz klubowy zachowuje kilka klas 4,5,6 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  for (const classNumber of ["4", "5", "6"]) {
    await ownClass(form, classNumber).check();
  }

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);
  await s.record("classes", "4,5,6");

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const classNumber of ["4", "5", "6"]) {
    await expect(ownClass(editForm, classNumber)).toBeChecked();
  }

  for (const classNumber of ["7", "8"]) {
    await expect(ownClass(editForm, classNumber)).not.toBeChecked();
  }

  await cancelClubForm(editForm);
});

test("CLUB-05: zaznaczenie wszystkich klas Matematyka/SP wybiera 4-8 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  const selectAll = ownClasses(form).getByRole("checkbox", {
    name: "Zaznacz wszystkie możliwe (nasze)",
    exact: true,
  });

  await selectAll.check();

  for (const classNumber of MATH_SP_CLASSES) {
    await expect(ownClass(form, classNumber)).toBeChecked();
  }

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);
  await s.record("classes", "4,5,6,7,8");

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  for (const classNumber of MATH_SP_CLASSES) {
    await expect(ownClass(editForm, classNumber)).toBeChecked();
  }

  await cancelClubForm(editForm);
});

test("CLUB-06: edycja usuwa tylko wskazaną klasę 5 z zestawu 4,5,6 @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  for (const classNumber of ["4", "5", "6"]) {
    await ownClass(form, classNumber).check();
  }

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await ownClass(editForm, "5").uncheck();

  await saveClubEdit(editForm);

  await s.app.openPanel("teacher", teacherId);

  const verifyForm = await openClubEdit(page, confirmationId);

  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(ownClass(verifyForm, "5")).not.toBeChecked();
  await expect(ownClass(verifyForm, "6")).toBeChecked();

  await cancelClubForm(verifyForm);
});

test("CLUB-07: formularz klubowy dotyczy tylko wybranej szkoły nauczyciela @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const firstSchoolId = await s.createSchool();

  const secondSchoolName = `${s.id} Druga szkoła`;

  const secondSchoolId = await s.app.createSchool(
    secondSchoolName,
    String(Date.now() + 1),
  );

  await s.record("secondSchoolId", secondSchoolId);
  await s.record("secondSchoolName", secondSchoolName);

  await s.app.markTestRecord();

  const teacherId = await s.createTeacher(firstSchoolId);

  await s.app.attachSchool(
    page.locator("body"),
    secondSchoolId,
    secondSchoolName,
  );

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  const firstSchool = form.getByRole("row").filter({
    hasText: s.schoolName,
  });

  const secondSchool = form.getByRole("row").filter({
    hasText: secondSchoolName,
  });

  await expect(firstSchool).toBeVisible();
  await expect(secondSchool).toBeVisible();

  await firstSchool.getByRole("checkbox").check();

  await expect(secondSchool.getByRole("checkbox")).not.toBeChecked();

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const detail = await confirmationDetails(page, confirmationId);

  await expect(detail).toContainText(s.schoolName);

  await expect(detail).not.toContainText(secondSchoolName);
});

test("CLUB-08: formularz klubowy obsługuje dwie szkoły nauczyciela @teacher @club", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE DWÓCH SZKÓŁ
   * =====================================================
   */

  const firstSchoolId = await s.createSchool();
  const firstSchoolName = s.schoolName;

  const secondSchoolName = `${s.id} Druga szkoła`;

  const secondSchoolId = await s.app.createSchool(
    secondSchoolName,
    String(Date.now() + 1),
  );

  await s.app.markTestRecord();

  await s.record("firstSchoolId", firstSchoolId);
  await s.record("firstSchoolName", firstSchoolName);
  await s.record("secondSchoolId", secondSchoolId);
  await s.record("secondSchoolName", secondSchoolName);

  /*
   * =====================================================
   * NAUCZYCIEL
   * =====================================================
   */

  const teacherId = await s.createTeacher(firstSchoolId, firstSchoolName);

  /*
   * Dodajemy drugą szkołę.
   */
  await s.app.attachSchool(
    page.locator("body"),
    secondSchoolId,
    secondSchoolName,
  );

  /*
   * =====================================================
   * MATEMATYKA / SP
   * =====================================================
   */

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * FORMULARZ KLUBOWY
   * =====================================================
   */

  const { form, schoolYear } = await openNewClubForm(page);

  await s.record("schoolYear", schoolYear);
  await s.record("subject", "Matematyka");
  await s.record("level", "SP");

  /*
   * Obie szkoły powinny być dostępne.
   */
  const firstSchoolRow = form.getByRole("row").filter({
    hasText: firstSchoolName,
  });

  const secondSchoolRow = form.getByRole("row").filter({
    hasText: secondSchoolName,
  });

  await expect(firstSchoolRow).toBeVisible();
  await expect(secondSchoolRow).toBeVisible();

  const firstSchoolCheckbox = firstSchoolRow.getByRole("checkbox");

  const secondSchoolCheckbox = secondSchoolRow.getByRole("checkbox");

  /*
   * =====================================================
   * NAJPIERW ZAZNACZAMY OBIE SZKOŁY
   * =====================================================
   *
   * Zaznaczenie kolejnej szkoły przebudowuje sekcje klas,
   * dlatego klasy ustawiamy dopiero później.
   */

  await expect(firstSchoolCheckbox).not.toBeChecked();

  await firstSchoolCheckbox.check();

  await expect(firstSchoolCheckbox).toBeChecked();

  await expect(secondSchoolCheckbox).not.toBeChecked();

  await secondSchoolCheckbox.check();

  await expect(secondSchoolCheckbox).toBeChecked();

  /*
   * Powinny istnieć dwa osobne zestawy klas.
   */
  const classBoxes = form.locator(".green-box");

  await expect(classBoxes).toHaveCount(2);

  const firstSchoolClasses = classBoxes.nth(0);
  const secondSchoolClasses = classBoxes.nth(1);

  /*
   * =====================================================
   * SPRAWDZENIE ZAKRESU KLAS
   * =====================================================
   */

  for (const classNumber of ["4", "5", "6", "7", "8"]) {
    await expect(
      firstSchoolClasses.getByRole("checkbox", {
        name: classNumber,
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      secondSchoolClasses.getByRole("checkbox", {
        name: classNumber,
        exact: true,
      }),
    ).toBeVisible();
  }

  /*
   * =====================================================
   * SZKOŁA 1 → KLASA 4
   * =====================================================
   */

  const firstSchoolClass4 = firstSchoolClasses.getByRole("checkbox", {
    name: "4",
    exact: true,
  });

  await expect(firstSchoolClass4).not.toBeChecked();

  await firstSchoolClass4.check();

  await expect(firstSchoolClass4).toBeChecked();

  /*
   * =====================================================
   * SZKOŁA 2 → KLASA 5
   * =====================================================
   */

  const secondSchoolClass5 = secondSchoolClasses.getByRole("checkbox", {
    name: "5",
    exact: true,
  });

  await expect(secondSchoolClass5).not.toBeChecked();

  await secondSchoolClass5.check();

  await expect(secondSchoolClass5).toBeChecked();

  /*
   * =====================================================
   * KONTROLA PRZED ZAPISEM
   * =====================================================
   */

  await expect(firstSchoolClass4).toBeChecked();
  await expect(secondSchoolClass5).toBeChecked();

  /*
   * Szkoła 1:
   * 4 = TAK
   * 5 = NIE
   */
  await expect(
    firstSchoolClasses.getByRole("checkbox", {
      name: "5",
      exact: true,
    }),
  ).not.toBeChecked();

  /*
   * Szkoła 2:
   * 4 = NIE
   * 5 = TAK
   */
  await expect(
    secondSchoolClasses.getByRole("checkbox", {
      name: "4",
      exact: true,
    }),
  ).not.toBeChecked();

  /*
   * Nie wysyłamy maila.
   */
  await disableTeacherEmail(form);

  /*
   * =====================================================
   * ZAPIS
   * =====================================================
   *
   * Dwie szkoły powodują utworzenie dwóch osobnych
   * potwierdzeń Matematyka.
   */

  await form
    .getByRole("button", {
      name: "Zapisz",
      exact: true,
    })
    .click();

  await expect(form).toHaveCount(0);

  /*
   * Szukamy wszystkich zapisanych potwierdzeń
   * dla Matematyki.
   */
  const confirmationRows = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  /*
   * Dwie szkoły = dwa osobne potwierdzenia.
   */
  await expect(confirmationRows).toHaveCount(2);

  const confirmationIds: string[] = [];

  for (let i = 0; i < 2; i++) {
    const confirmationId = (
      await confirmationRows.nth(i).getByRole("cell").nth(1).innerText()
    ).trim();

    expect(confirmationId).toMatch(/^\d+$/);

    confirmationIds.push(confirmationId);
  }

  expect(confirmationIds).toHaveLength(2);

  /*
   * ID muszą być różne.
   */
  expect(confirmationIds[0]).not.toBe(confirmationIds[1]);

  await s.record("confirmationIds", confirmationIds.join(","));

  await s.record("firstSchoolClass", "4");

  await s.record("secondSchoolClass", "5");

  /*
   * =====================================================
   * PONOWNE OTWARCIE NAUCZYCIELA
   * =====================================================
   */

  await s.app.openPanel("teacher", teacherId);

  /*
   * Oba potwierdzenia nadal istnieją.
   */
  for (const confirmationId of confirmationIds) {
    await expect(confirmationRow(page, confirmationId)).toHaveCount(1);
  }

  /*
   * =====================================================
   * IDENTYFIKACJA POTWIERDZEŃ PO SZKOLE
   * =====================================================
   *
   * Nie zakładamy:
   *
   * confirmationIds[0] = szkoła 1
   * confirmationIds[1] = szkoła 2
   *
   * Sprawdzamy faktyczne szczegóły.
   */

  let firstSchoolConfirmationId = "";
  let secondSchoolConfirmationId = "";

  for (const confirmationId of confirmationIds) {
    const row = confirmationRow(page, confirmationId);

    await expect(row).toHaveCount(1);

    /*
     * Główne dane potwierdzenia.
     */
    await expect(
      row.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    ).toBeVisible();

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
     * Rozwijamy szczegóły konkretnego potwierdzenia.
     */
    const details = await confirmationDetails(page, confirmationId);

    await expect(details).toHaveCount(1);

    const detailsText = await details.innerText();

    /*
     * ===================================================
     * SZKOŁA 1
     * ===================================================
     */

    if (detailsText.includes(firstSchoolName)) {
      firstSchoolConfirmationId = confirmationId;

      await expect(details).toContainText(firstSchoolName);

      await expect(
        details.getByRole("cell", {
          name: "SP",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Powinna mieć klasę 4.
       */
      await expect(
        details.getByRole("cell", {
          name: "4",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Nie powinna mieć klasy 5.
       */
      await expect(
        details.getByRole("cell", {
          name: "5",
          exact: true,
        }),
      ).toHaveCount(0);
    }

    /*
     * ===================================================
     * SZKOŁA 2
     * ===================================================
     */

    if (detailsText.includes(secondSchoolName)) {
      secondSchoolConfirmationId = confirmationId;

      await expect(details).toContainText(secondSchoolName);

      await expect(
        details.getByRole("cell", {
          name: "SP",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Powinna mieć klasę 5.
       */
      await expect(
        details.getByRole("cell", {
          name: "5",
          exact: true,
        }),
      ).toBeVisible();

      /*
       * Nie powinna mieć klasy 4.
       */
      await expect(
        details.getByRole("cell", {
          name: "4",
          exact: true,
        }),
      ).toHaveCount(0);
    }

    /*
     * Zwijamy aktualny wiersz przed sprawdzeniem kolejnego.
     */
    const arrowUp = row.locator("mat-icon").filter({
      hasText: "keyboard_arrow_up",
    });

    if (await arrowUp.count()) {
      await arrowUp.click();
    }
  }

  /*
   * =====================================================
   * KOŃCOWA WERYFIKACJA
   * =====================================================
   */

  expect(
    firstSchoolConfirmationId,
    "Nie znaleziono potwierdzenia dla pierwszej szkoły",
  ).not.toBe("");

  expect(
    secondSchoolConfirmationId,
    "Nie znaleziono potwierdzenia dla drugiej szkoły",
  ).not.toBe("");

  /*
   * Każda szkoła ma własne potwierdzenie.
   */
  expect(firstSchoolConfirmationId).not.toBe(secondSchoolConfirmationId);

  await s.record("firstSchoolConfirmationId", firstSchoolConfirmationId);

  await s.record("secondSchoolConfirmationId", secondSchoolConfirmationId);
});

test("CLUB-09: anulowanie dodawania formularza nie tworzy potwierdzenia @teacher @club @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  await cancelClubForm(form);

  await s.app.openPanel("teacher", teacherId);

  await expect(
    confirmations(page)
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", {
          name: "Matematyka",
          exact: true,
        }),
      }),
  ).toHaveCount(0);
});

test("CLUB-10: anulowanie edycji zachowuje klasę 4 @teacher @club @cancel", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  await ownClass(form, "4").check();

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await ownClass(editForm, "4").uncheck();
  await ownClass(editForm, "5").check();

  await expect(ownClass(editForm, "4")).not.toBeChecked();
  await expect(ownClass(editForm, "5")).toBeChecked();

  /*
   * Nie zapisujemy.
   */
  await cancelClubForm(editForm);

  await s.app.openPanel("teacher", teacherId);

  const verifyForm = await openClubEdit(page, confirmationId);

  await expect(ownClass(verifyForm, "4")).toBeChecked();
  await expect(ownClass(verifyForm, "5")).not.toBeChecked();

  await cancelClubForm(verifyForm);
});

test("CLUB-11: formularz klubowy można usunąć @teacher @club @delete", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE DANYCH
   * =====================================================
   */

  const schoolId = await s.createSchool();

  const teacherId = await s.createTeacher(schoolId);

  await s.record("subject", "Matematyka");
  await s.record("level", "SP");
  await s.record("class", "4");

  /*
   * Dodajemy nauczycielowi przedmioto-poziom:
   * Matematyka / SP.
   */
  await addMathSp(page);

  /*
   * Otwieramy nauczyciela ponownie,
   * żeby formularz klubowy tworzyć na świeżym widoku.
   */
  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * UTWORZENIE FORMULARZA KLUBOWEGO
   * =====================================================
   */

  const { form, schoolYear } = await openNewClubForm(page);

  await s.record("schoolYear", schoolYear);

  /*
   * Wybieramy szkołę nauczyciela.
   */
  await selectSchool(form, s.schoolName);

  /*
   * Matematyka / SP → klasa 4.
   */
  const class4 = ownClass(form, "4");

  await expect(class4).toBeVisible();

  await class4.check();

  await expect(class4).toBeChecked();

  /*
   * Nie wysyłamy maila w teście automatycznym.
   */
  await disableTeacherEmail(form);

  /*
   * Zapisujemy formularz.
   */
  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);

  /*
   * =====================================================
   * POTWIERDZENIE, ŻE FORMULARZ ISTNIEJE
   * =====================================================
   */

  await test.step("Sprawdź utworzony formularz przed usunięciem", async () => {
    await s.app.openPanel("teacher", teacherId);

    const row = confirmationRow(page, confirmationId);

    await expect(row).toHaveCount(1);

    await expect(
      row.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    ).toBeVisible();

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
  });

  /*
   * =====================================================
   * USUNIĘCIE FORMULARZA
   * =====================================================
   */

  await test.step("Usuń formularz klubowy", async () => {
    await s.app.openPanel("teacher", teacherId);

    const row = confirmationRow(page, confirmationId);

    await expect(row).toHaveCount(1);

    /*
     * Najpierw zaznaczamy konkretny wiersz.
     * Dopiero wtedy przycisk Usuń jest aktywny.
     */
    await row.click();

    const deleteButton = confirmations(page).getByRole("button", {
      name: "Usuń",
      exact: true,
    });

    await expect(deleteButton).toBeEnabled();

    await deleteButton.click();

    /*
     * Jeśli aplikacja pokaże dialog potwierdzający,
     * helper go obsłuży.
     */
    await confirmDeleteIfShown(page);

    await s.record("deleteClicked", "true");
  });

  /*
   * =====================================================
   * WERYFIKACJA PO USUNIĘCIU
   * =====================================================
   */

  await test.step("Sprawdź oznaczenie formularza jako usunięty", async () => {
    await s.app.openPanel("teacher", teacherId);

    const deletedRow = confirmationRow(page, confirmationId);

    /*
     * Formularz pozostaje w tabeli.
     */
    await expect(deletedRow).toHaveCount(1);

    /*
     * Nadal jest to ten sam formularz.
     */
    await expect(
      deletedRow.getByRole("cell", {
        name: confirmationId,
        exact: true,
      }),
    ).toBeVisible();

    /*
     * Kolumna:
     * 0 - rozwijanie
     * 1 - Potw. ID
     * 2 - Usunięte
     */
    const deletedCell = deletedRow.getByRole("cell").nth(2);

    await expect(deletedCell).toBeVisible();

    /*
     * Octopus oznacza usunięty formularz
     * ikoną Material "backspace".
     */
    const deletedIcon = deletedCell.locator("mat-icon");

    await expect(deletedIcon).toHaveCount(1);

    await expect(deletedIcon).toHaveText("backspace");

    await s.record("deletedStateIcon", "backspace");

    await s.record("clubDeleted", "true");
  });
});

test("CLUB-12A: brak szkoły blokuje utworzenie formularza klubowego @teacher @club @validation", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE
   * =====================================================
   */

  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Na początku nie może istnieć żadne potwierdzenie
   * Matematyki.
   */
  const mathConfirmations = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(mathConfirmations).toHaveCount(0);

  /*
   * =====================================================
   * OTWARCIE FORMULARZA
   * =====================================================
   */

  const { form } = await openNewClubForm(page);

  /*
   * Nie zaznaczamy szkoły.
   */

  const schoolRow = form.getByRole("row").filter({
    hasText: s.schoolName,
  });

  await expect(schoolRow).toBeVisible();

  const schoolCheckbox = schoolRow.getByRole("checkbox");

  await expect(schoolCheckbox).not.toBeChecked();

  /*
   * Przycisk Zapisz jest aktywny mimo braku szkoły.
   * To potwierdziliśmy wykonaniem testu.
   */
  const saveButton = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeEnabled();

  /*
   * =====================================================
   * PRÓBA ZAPISU
   * =====================================================
   */

  await saveButton.click();

  /*
   * Niepoprawny formularz nie powinien zostać zapisany,
   * więc główny formularz nadal powinien istnieć.
   */
  await expect(form).toBeVisible();

  await s.record("validationCase", "missing-school");

  /*
   * Nie próbujemy klikać Anuluj.
   *
   * Jeśli aplikacja wyświetla dodatkowy komunikat/modal
   * walidacyjny, mógłby blokować przycisk formularza.
   *
   * Pełne przejście do nauczyciela daje nam czysty stan.
   */
  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * WERYFIKACJA BRAKU REKORDU
   * =====================================================
   */

  const afterSaveAttempt = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(afterSaveAttempt).toHaveCount(0);

  await s.record("clubCreated", "false");
});

test("CLUB-12B: brak klasy blokuje utworzenie formularza klubowego @teacher @club @validation", async ({
  page,
  scenario: s,
}) => {
  /*
   * =====================================================
   * PRZYGOTOWANIE
   * =====================================================
   */

  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  /*
   * Przed próbą zapisu nie ma żadnego formularza
   * Matematyki.
   */
  const mathConfirmations = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(mathConfirmations).toHaveCount(0);

  /*
   * =====================================================
   * OTWARCIE FORMULARZA
   * =====================================================
   */

  const { form } = await openNewClubForm(page);

  /*
   * Wybieramy szkołę.
   */
  await selectSchool(form, s.schoolName);

  /*
   * =====================================================
   * SPRAWDZENIE KLAS
   * =====================================================
   *
   * Matematyka / SP:
   * 4, 5, 6, 7, 8.
   *
   * Żadnej nie zaznaczamy.
   */

  for (const classNumber of ["4", "5", "6", "7", "8"]) {
    const checkbox = ownClass(form, classNumber);

    await expect(checkbox).toBeVisible();

    await expect(checkbox).not.toBeChecked();
  }

  /*
   * Przycisk jest aktywny mimo braku klasy.
   */
  const saveButton = form.getByRole("button", {
    name: "Zapisz",
    exact: true,
  });

  await expect(saveButton).toBeEnabled();

  /*
   * =====================================================
   * PRÓBA ZAPISU
   * =====================================================
   */

  await saveButton.click();

  /*
   * Brak klasy powinien zablokować faktyczne zapisanie.
   */
  await expect(form).toBeVisible();

  await s.record("validationCase", "missing-class");

  /*
   * Pełne ponowne wejście zamiast Anuluj.
   * Dzięki temu test nie zależy od tego, czy aplikacja
   * pokazuje dodatkowy modal/komunikat walidacyjny.
   */
  await s.app.openPanel("teacher", teacherId);

  /*
   * =====================================================
   * WERYFIKACJA BRAKU REKORDU
   * =====================================================
   */

  const afterSaveAttempt = confirmations(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", {
        name: "Matematyka",
        exact: true,
      }),
    });

  await expect(afterSaveAttempt).toHaveCount(0);

  await s.record("clubCreated", "false");
});

test("CLUB-13: formularz klubowy zachowuje klasę obcą i wydawnictwo @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);

  await addMathSp(page);

  await s.app.openPanel("teacher", teacherId);

  const { form } = await openNewClubForm(page);

  await selectSchool(form, s.schoolName);

  /*
   * Czerwona sekcja = obce.
   */
  await foreignClass(form, "4").check();

  await expect(foreignClass(form, "4")).toBeChecked();

  await expect(ownClass(form, "4")).not.toBeChecked();

  const foreign = foreignClasses(form);

  const publisher = foreign.getByRole("combobox");

  await publisher.click();

  const option = page
    .getByRole("option")
    .filter({
      hasNotText: /^wybierz$/i,
    })
    .first();

  await expect(option).toBeVisible();

  const publisherName = (await option.innerText()).trim();

  expect(publisherName).not.toBe("");

  await option.click();

  await s.record("foreignPublisher", publisherName);

  await disableTeacherEmail(form);

  const confirmationId = await saveClubForm(page, form);

  await s.record("confirmationId", confirmationId);

  /*
   * Pełne ponowne wejście.
   */
  await s.app.openPanel("teacher", teacherId);

  const editForm = await openClubEdit(page, confirmationId);

  await expect(foreignClass(editForm, "4")).toBeChecked();

  await expect(ownClass(editForm, "4")).not.toBeChecked();

  await expect(foreignClasses(editForm).getByRole("combobox")).toContainText(
    publisherName,
  );

  await cancelClubForm(editForm);
});
