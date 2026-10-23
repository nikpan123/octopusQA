import { test as base, expect } from "../shared/browser-preview";

// This derived fixture mirrors ordinary Octopus fixtures, without authentication
// or touching DEV/TEST. It also proves that derived test.step is intercepted.
const test = base.extend<{ localForm: string }>({
  localForm: async ({ page }, use) => {
    await page.route("http://debugger-local.test/**", (route) =>
      route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: '<button onclick="document.querySelector(\'output\').textContent=1">Zwiększ</button><input aria-label="Nazwa"><output>0</output>',
      }),
    );
    await page.goto("http://debugger-local.test/");
    await use("gotowy");
  },
});

test("Zwykły test bez tagu — kroki, fixture, czynności i API", async ({
  page,
  localForm,
}, info) => {
  test.setTimeout(
    process.env.QA_DEBUGGER_GENERIC === "1" && process.env.QA_TEST_DEBUGGER === "1" ? 1 : 30000,
  ); // Manual waiting must not consume a test-specific timeout.
  if (process.env.QA_DEBUGGER_GENERIC === "1" && process.env.QA_TEST_DEBUGGER === "1")
    expect(info.timeout).toBe(0);
  expect(localForm).toBe("gotowy");
  if (process.env.QA_BROWSER_PREVIEW === "1")
    await expect(page.locator("#qa-test-preview")).toHaveCount(1);
  await test.step("Sprawdź i zmień licznik", async () => {
    await base.step("Wewnętrzne sprawdzenie", async () =>
      expect(page.locator("output")).toHaveText("0"),
    );
    await page.getByRole("button", { name: "Zwiększ" }).click();
    await expect(page.locator("output")).toHaveText("1");
    await fetch(new URL("/probe", process.env.OCTOPUS_GUIDED_URL), { method: "POST" });
  });
  await page.getByRole("textbox", { name: "Nazwa" }).fill("Wartość bez ujawniania w logu");
  const response = await page.request.post(
    new URL("/api/catalog", process.env.OCTOPUS_GUIDED_URL).href,
    { data: { password: "fixture-private-secret", quantity: 2 } },
  );
  expect(response.status()).toBe(200);
  expect((await response.json()).echo.password).toBe("fixture-private-secret");
  await Promise.all([
    test.step("Równoległy etap A", async () => expect(page.locator("output")).toHaveText("1")),
    test.step("Równoległy etap B", async () => expect(page.locator("output")).toHaveText("1")),
  ]);
});
