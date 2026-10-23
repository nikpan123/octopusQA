import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { readOrderHistoryRows, hasDatedOrderHistory } from "./order-history-table.mjs";

test("Historia: ilości nie sklejają się z datą, pusty wiersz nie jest historią", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(
      '<div role="dialog"><table><tr><th>Ilość przed zmianą</th><th>Ilość</th><th>Data</th></tr><tr><td>45</td><td>0</td><td>2026-09-17 04:34</td></tr></table></div>',
    );
    const dialog = page.getByRole("dialog");
    assert.equal(await dialog.getByRole("row").nth(1).textContent(), "4502026-09-17 04:34");
    const rows = await readOrderHistoryRows(dialog);
    assert.deepEqual(rows, [["45", "0", "2026-09-17 04:34"]]);
    assert.equal(hasDatedOrderHistory(rows), true);
    assert.equal(hasDatedOrderHistory([["45", "0", "17.09.2026 04:34"]]), true);
    await page.setContent(
      '<div role="dialog"><table><tr><td colspan="3">Brak danych</td></tr></table></div>',
    );
    assert.equal(hasDatedOrderHistory(await readOrderHistoryRows(dialog)), false);
    assert.equal(hasDatedOrderHistory([]), false);
  } finally {
    await browser.close();
  }
});
