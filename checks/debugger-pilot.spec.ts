import { test, expect } from "../shared/browser-preview";
import { guidedUiStep } from "../tests/support/guided-ui-step";

test("Debugger UI — lokalny formularz i rzeczywiste kliknięcie", async ({ page }) => {
  await page.route("**/*", route => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: '<html lang="pl"><head><meta charset="utf-8"></head><body><h1>Formularz lokalny</h1><button onclick="document.querySelector(\'output\').textContent=1">Zwiększ licznik</button><output>0</output></body></html>',
  }));
  await guidedUiStep("Otwórz lokalny formularz", async () => {
    await page.goto("http://debugger-app.test/");
    await expect(page.locator("output")).toHaveText("0");
  });
  await guidedUiStep("Kliknij przycisk — licznik zmieni się na 1", async () => {
    await page.getByRole("button", { name: "Zwiększ licznik" }).click({ timeout: 3000 });
    await expect(page.locator("output")).toHaveText("1", { timeout: 3000 });
    await fetch(new URL("/probe", process.env.OCTOPUS_GUIDED_URL), { method: "POST" });
  });
  await guidedUiStep("Sprawdź, że licznik wynosi 1", async () => {
    await expect(page.locator("output")).toHaveText("1");
  });
});
