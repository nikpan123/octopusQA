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
    const available = form
      .getByRole("treegrid")
      .filter({
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
    const selected = form
      .getByRole("treegrid")
      .filter({
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

test("CLUB-01: przedmiotopoziom i formularz klubowy nauczyciela są trwałe @teacher @club", async ({
  page,
  scenario: s,
}) => {
  const schoolId = await s.createSchool();
  const teacherId = await s.createTeacher(schoolId);
  const subjects = page.locator("app-teacher-subjects");
  const subjectRow = subjects
    .getByRole("row")
    .filter({
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
    const row = confirmations
      .getByRole("row")
      .filter({
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
    const row = confirmations
      .getByRole("row")
      .filter({
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
