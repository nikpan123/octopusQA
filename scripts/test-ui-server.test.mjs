import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { SUITES, extractTestId, parseListOutput, buildRunArguments } from "./test-ui-server.mjs";

test("podgląd UI: zapisane kroki nie uruchamiają testu; debug wymaga potwierdzenia i wysyła tylko jeden test", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width:1500, height:1000 } });
    const errors=[];
    page.on("pageerror", error => errors.push(error.message));
    let submitted;
    const id="ORD-BUG-36290-03";
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (["/", "/styles.css", "/app.js"].includes(url.pathname)) {
        const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
        return route.fulfill({ body:await readFile(new URL(`../test-ui/${file}`,import.meta.url),'utf8'), contentType:file.endsWith('css')?'text/css':file.endsWith('js')?'application/javascript':'text/html' });
      }
      let body={};
      if(url.pathname==='/api/events')return route.fulfill({contentType:'text/event-stream',body:''});
      if(url.pathname==='/api/tests')body={tests:[{id,title:`${id}: API kopii`,file:'zamowienia-redmine-36290.spec.ts',annual:false}]};
      if(url.pathname==='/api/history')body={history:[]};
      if(url.pathname==='/api/scenarios')body={features:[]};
      if(url.pathname==='/api/test-data')body={teachers:[],schools:[]};
      if(url.pathname==='/api/status'||url.pathname==='/api/run')body={running:false,run:null};
      if(url.pathname==='/api/run')submitted=route.request().postDataJSON();
      if(url.pathname==='/api/test-preview') {
        assert.equal(url.searchParams.get('id'),id);
        body={preview:{id,status:'failed',date:'2026-10-19T08:00:00Z',environment:'dev',source:'Raport testowy',attempt:0,reportUrl:'/report/123/',errors:['Expected 3, Received 99'],steps:[{title:'Przygotowanie',duration:4,steps:[]},{title:'Porównanie API',duration:5,error:'Expected 3, Received 99',steps:[]}],attachments:[{name:'Stan przed i po',contentType:'application/json',body:{status:200,before:3,after:99}}]}};
      }
      return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
    });
    await page.goto('http://runner.test/#run-tests');
    await expect(page.getByRole('button',{name:'Podgląd wykonania',exact:true})).toBeVisible();
    await expect(page.locator('#debugSelectedBtn')).toBeDisabled();
    await page.getByRole('button',{name:'Podgląd wykonania',exact:true}).click();
    const dialog=page.locator('#testPreviewDialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Expected 3, Received 99');
    await expect(page.locator('#previewStepCounter')).toHaveText('2 / 2');
    await page.locator('#previewPrevious').click();
    await expect(page.locator('#previewStepDetail')).toContainText('Przygotowanie');
    await page.locator('#previewNext').click();
    await expect(page.locator('#previewStepDetail')).toContainText('Porównanie API');
    await dialog.getByText('Stan przed i po',{exact:true}).click();
    await expect(dialog.locator('.preview-attachment').filter({has:page.getByText('Stan przed i po',{exact:true})}).locator('pre')).toContainText('"after": 99');
    assert.equal(submitted,undefined,'Podgląd, nawigacja i odczyt załączników niczego nie uruchamiają');
    await page.screenshot({path:'outputs/test-preview-panel.png',fullPage:true});
    page.once('dialog', d=>d.dismiss());
    await page.locator('#previewDebugBtn').click();
    assert.equal(submitted,undefined,'Anulowanie potwierdzenia nie uruchamia debugowania');
    page.once('dialog', d=>d.accept());
    await page.locator('#previewDebugBtn').click();
    await expect.poll(()=>submitted).toMatchObject({debug:true,selectedTestIds:[id],workers:1,headed:true});
    assert.equal(submitted.grep,'');
    await expect(dialog).not.toBeVisible();
    await page.locator('.qa-sidebar nav a[href="#run-tests"]').click();
    await page.locator(`[data-test-id="${id}"]`).check();
    await expect(page.locator('#debugSelectedBtn')).toBeEnabled();
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
});

test("scenariusze kopiowania mają unikalne ID i powiązania z testami", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const feature = catalog.features.find((item) => item.issue === "37160");
  assert.equal(feature.scenarios.length, 19);
  assert.equal(new Set(feature.scenarios.map((item) => item.id)).size, 19);
  assert.ok(SUITES.orders.files.includes("tests/zamowienia-kopiowanie-struktura.spec.ts"));
  for (const scenario of feature.scenarios) {
    assert.deepEqual(scenario.testIds, [scenario.id]);
    assert.equal(extractTestId(scenario.id), scenario.id);
    assert.ok(scenario.preconditions.length && scenario.steps.length && scenario.expected);
  }
  assert.equal(feature.scenarios.filter((item) => item.automation === "blocked").length, 0);
});

test("scenariusze UI pokazują kroki i wybierają wyłącznie powiązany test bez automatycznego startu", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../test-ui/scenarios.json", import.meta.url), "utf8"),
  );
  const tests = catalog.features
    .flatMap((feature) => feature.scenarios)
    .map((scenario) => ({
      id: scenario.id,
      title: `${scenario.id}: ${scenario.title}`,
      file: "zamowienia-kopiowanie-struktura.spec.ts",
      annual: false,
    }));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    let submitted;
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (["/", "/styles.css", "/app.js"].includes(pathname)) {
        const file = pathname === "/" ? "index.html" : pathname.slice(1);
        return route.fulfill({
          body: await readFile(new URL(`../test-ui/${file}`, import.meta.url), "utf8"),
          contentType: file.endsWith("css")
            ? "text/css"
            : file.endsWith("js")
              ? "application/javascript"
              : "text/html",
        });
      }
      if (pathname === "/api/events")
        return route.fulfill({ contentType: "text/event-stream", body: "" });
      let body = {};
      if (pathname === "/api/scenarios") body = catalog;
      if (pathname === "/api/tests") body = { tests };
      if (pathname === "/api/history") body = { history: [] };
      if (pathname === "/api/test-data") body = { teachers: [], schools: [] };
      if (pathname === "/api/status" || pathname === "/api/run")
        body = { running: false, run: null };
      if (pathname === "/api/run") submitted = route.request().postDataJSON();
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("http://runner.test/");
    await page.locator('.qa-sidebar nav').getByRole("link", { name: "Scenariusze", exact: true }).click();
    await expect(page.locator(".scenario-item")).toHaveCount(19);
    await expect(page.locator(".scenario-verification")).toContainText("18 passed, 1 skipped, 0 failed");
    await page.locator("#scenarioSearch").fill("ORD-COPY-02");
    await expect(page.locator(".scenario-item")).toHaveCount(1);
    await page.locator(".scenario-item summary").click();
    await expect(page.locator(".scenario-item")).toContainText("Oczekiwany wynik");
    await page.getByRole("button", { name: "Wybierz powiązany test" }).click();
    await expect(page.locator("#selectedCount")).toHaveText("1 zaznaczonych");
    await expect(page.locator('[data-test-id="ORD-COPY-02"]')).toBeChecked();
    assert.equal(submitted, undefined);
    await page.locator("#startBtn").click();
    await expect.poll(() => submitted).toMatchObject({ selectedTestIds: ["ORD-COPY-02"] });
    await page.locator('.qa-sidebar nav a[href="#business-scenarios"]').click();
    await page.locator("#scenarioSearch").fill("ORD-COPY-19");
    await page.locator(".scenario-item summary").click();
    await expect(page.locator('[data-scenario-id="ORD-COPY-19"]')).toBeEnabled();
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("pakiet Szkoły zawiera oba pliki Struktury", () => {
  const result = buildRunArguments({ suite: "schools", environment: "dev", workers: 2 });
  for (const file of [
    "tests/szkola-struktura.spec.ts",
    "tests/szkola-struktura-dodawanie.spec.ts",
    "tests/szkola-kategoria.spec.ts",
    "tests/szkola-kategoria-dodawanie.spec.ts",
    "tests/szkola-nauczyciele-filtry.spec.ts",
    "tests/szkola-wyszukiwanie-filtry.spec.ts",
  ]) {
    assert.ok(SUITES.schools.files.includes(file));
    assert.ok(result.args.includes(file));
  }
});

test("parser rozpoznaje krótkie ID STR, także trzycyfrowe", () => {
  assert.equal(extractTestId("Struktura szkoły › STR-89: test @school"), "STR-89");
  assert.equal(extractTestId("Struktura › STR-106: timeout @structure"), "STR-106");
  assert.equal(extractTestId("ORD-43: zamówienie"), "ORD-43");
  assert.equal(extractTestId("Klasa w zamówieniach › ORD-CLASS-22: rozwijanie"), "ORD-CLASS-22");
  assert.equal(extractTestId("Dokumenty › ORD-DOC-30: edycja"), "ORD-DOC-30");
  assert.equal(extractTestId("Kategoria szkoły › CAT-34: zmiana uczniów"), "CAT-34");
  assert.equal(extractTestId("Filtrowanie nauczycieli › TFL-26: przyszły rok"), "TFL-26");
  assert.equal(extractTestId("Wyszukiwarka szkół › SFLT-32: RSPO"), "SFLT-32");
  assert.equal(extractTestId("Próg › THR-22: anulowanie"), "THR-22");
  assert.equal(extractTestId("Uprawnienia › PERM-15: dane"), "PERM-15");
  assert.equal(extractTestId("Eksport › ACC-06: duplikaty"), "ACC-06");
  assert.equal(extractTestId("Aktywność › ACL-12: zawieszenie"), "ACL-12");
  assert.equal(extractTestId("Promocja › NCL-01: nowy klient"), "NCL-01");
  assert.equal(extractTestId("Promocja › DEB-01: debiut"), "DEB-01");
});

test("pakiety obejmują progi i uprawnienia", () => {
  assert.ok(SUITES.teachers.files.includes("tests/uprawnienia-promocja-nowy-klient.spec.ts"));
  assert.ok(SUITES.teachers.files.includes("tests/uprawnienia-promocja-debiutu.spec.ts"));
  assert.ok(SUITES.schools.files.includes("tests/szkola-prog.spec.ts"));
  for (const file of [
    "tests/nauczyciel-uprawnienia.spec.ts",
    "tests/uprawnienia-api.spec.ts",
    "tests/uprawnienia-cykl-zycia.spec.ts",
  ])
    assert.ok(SUITES.teachers.files.includes(file));
});

test("pakiet Zamówienia zawiera testy kolumny Klasa", () => {
  const result = buildRunArguments({ suite: "orders", environment: "dev", workers: 2 });
  assert.ok(SUITES.orders.files.includes("tests/zamowienia-klasa.spec.ts"));
  assert.ok(result.args.includes("tests/zamowienia-klasa.spec.ts"));
  assert.ok(result.args.includes("tests/zamowienia-dokumenty.spec.ts"));
});

test("listowanie rozdziela ID, nazwę i lokalizację testu struktury", () => {
  const tests = parseListOutput(
    "[chromium] › szkola-struktura-dodawanie.spec.ts:147:3 › Struktura podczas dodawania szkoły › STR-89: Zapisz strukturę @school @structure",
  );
  assert.equal(tests.length, 1);
  assert.equal(tests[0].id, "STR-89");
  assert.equal(tests[0].file, "szkola-struktura-dodawanie.spec.ts");
  assert.equal(tests[0].annual, false);
  assert.ok(tests[0].title.includes("Zapisz strukturę"));
});

test("zaznaczenie STR-10 nie uruchamia STR-100 ani STR-101", () => {
  const result = buildRunArguments({ suite: "schools", selectedTestIds: ["STR-10"], workers: 2 });
  const pattern = new RegExp(result.args[result.args.indexOf("--grep") + 1]);
  assert.ok(pattern.test("Struktura szkoły › STR-10: miejscowość @structure"));
  assert.equal(pattern.test("STR-100: duplikat @structure"), false);
  assert.equal(pattern.test("STR-101: wyszukiwanie @structure"), false);
});

test("zaznaczone nowe testy mają pierwszeństwo przed pakietem i grep", () => {
  const result = buildRunArguments({
    suite: "teachers",
    grep: "ORD-43",
    selectedTestIds: ["STR-90", "STR-106"],
    environment: "test",
    workers: 2,
  });
  const pattern = new RegExp(result.args[result.args.indexOf("--grep") + 1]);
  assert.ok(pattern.test("STR-90: nowa szkoła"));
  assert.ok(pattern.test("STR-106: timeout"));
  assert.equal(pattern.test("STR-900: inny test"), false);
  assert.equal(pattern.test("ORD-43: zamówienie"), false);
  assert.equal(result.args.includes("tests/nauczyciel-dodawanie.spec.ts"), false);
  assert.ok(result.args.includes("--config=playwright.test.config.ts"));
});

test("panel pokazuje krótkie ID i wysyła zaznaczony nowy test", async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    let submitted;
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (["/", "/styles.css", "/app.js"].includes(url.pathname)) {
        const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        return route.fulfill({
          contentType: file.endsWith("css")
            ? "text/css"
            : file.endsWith("js")
              ? "application/javascript"
              : "text/html",
          body: await readFile(new URL(`../test-ui/${file}`, import.meta.url), "utf8"),
        });
      }
      let body = {};
      if (url.pathname === "/api/tests")
        body = {
          tests: [
            {
              id: "ORD-BUG-37176-01",
              title:
                "ORD-BUG-37176-01: ujemna ilość -1 nie pozwala utworzyć zamówienia @school @order @redmine-37176",
              file: "zamowienia-redmine-37176.spec.ts",
              annual: false,
            },
            {
              id: "STR-106",
              title:
                "Struktura podczas dodawania szkoły › STR-106: timeout zapisu szkoły nie zapisuje osieroconej struktury @school @structure @school-add",
              file: "szkola-struktura-dodawanie.spec.ts",
              annual: false,
            },
          ],
        };
      else if (url.pathname === "/api/history") body = { history: [] };
      else if (url.pathname === "/api/test-data") body = { teachers: [], schools: [] };
      else if (url.pathname === "/api/status" || url.pathname === "/api/run") {
        if (url.pathname === "/api/run") submitted = route.request().postDataJSON();
        body = { running: false, run: null };
      }
      if (url.pathname === "/api/events")
        return route.fulfill({ contentType: "text/event-stream", body: "" });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    await page.goto("http://runner.test/#run-tests");
    await page.locator("#testSearch").fill("str-106");
    await expect(page.locator(".test-id")).toHaveText("STR-106");
    await expect(page.locator(".test-title")).toContainText("timeout zapisu szkoły");
    assert.ok(
      (await page
        .locator(".test-title")
        .evaluate((element) => element.getBoundingClientRect().width)) > 500,
    );
    await page.getByRole("button", { name: "Szkoły", exact: true }).click();
    await page.locator('[data-test-id="STR-106"]').check();
    await expect(page.locator("#selectedCount")).toHaveText("1 zaznaczonych");
    await page.locator("#startBtn").click();
    await expect
      .poll(() => submitted)
      .toMatchObject({ suite: "schools", selectedTestIds: ["STR-106"] });
    await page.waitForURL("**/#run-status");
    await page.locator('.qa-sidebar nav a[href="#run-tests"]').click();
    await page.locator("#testSearch").fill("@redmine-37176");
    await expect(page.locator(".test-id")).toHaveText("ORD-BUG-37176-01");
    for (const width of [1600, 900, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await page.locator(".test-row").evaluate((row) => {
        const id = row.querySelector(".test-id").getBoundingClientRect();
        const title = row.querySelector(".test-title").getBoundingClientRect();
        return {
          separated: id.right <= title.left || id.bottom <= title.top,
          fits: row.scrollWidth <= row.clientWidth,
          idFits: row.querySelector(".test-id").scrollWidth <= id.width + 1,
        };
      });
      assert.deepEqual(
        layout,
        { separated: true, fits: true, idFits: true },
        `Układ przy ${width}px`,
      );
    }
    submitted = undefined;
    await page.goto("http://runner.test/?issue=37176&test=ORD-BUG-37176-01#test-catalog");
    await expect(page.locator("#selectedCount")).toHaveText("1 zaznaczonych");
    await expect(page.locator('[data-test-id="ORD-BUG-37176-01"]')).toBeChecked();
    await expect(page.locator(".test-row")).toHaveCount(1);
    assert.equal(submitted, undefined, "Otwarcie linku nie uruchamia testów");
    await page.locator("#startBtn").click();
    await expect.poll(() => submitted).toMatchObject({ selectedTestIds: ["ORD-BUG-37176-01"] });
    submitted = undefined;
    await page.goto("http://runner.test/?issue=37176&test=NIEISTNIEJACY#test-catalog");
    await expect(page.locator("#linked-selection")).toContainText("Nie znaleziono");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#startBtn").click();
    assert.equal(submitted, undefined, "Brak testu nie uruchamia całej regresji");
    // Cała sieć jest przechwycona; test panelu nie uruchamia regresji na DEV.
  } finally {
    await browser.close();
  }
});
