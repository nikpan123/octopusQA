import { test, expect } from "@playwright/test";
import { showCopyApiPreview } from "../tests/support/copy-api-preview";
import type { CopyData } from "../tests/support/order-copy";

test("zwykła regresja API nie otwiera dodatkowych widoków", async () => {
  const previous = process.env.OCTOPUS_GUIDED_BROWSER;
  process.env.OCTOPUS_GUIDED_BROWSER = "0";
  try {
    const data = {
      panel: async () => {
        throw new Error("Nie wolno otwierać widoku w regresji API");
      },
    } as unknown as CopyData;
    await showCopyApiPreview(data, "LO", "42");
  } finally {
    if (previous === undefined) delete process.env.OCTOPUS_GUIDED_BROWSER;
    else process.env.OCTOPUS_GUIDED_BROWSER = previous;
  }
});

test("podgląd pokazuje dokument i pozycje w tej samej karcie bez dodatkowego zapisu", async ({
  page,
}) => {
  const previous = [process.env.OCTOPUS_GUIDED_API, process.env.OCTOPUS_GUIDED_BROWSER];
  process.env.OCTOPUS_GUIDED_API = "1";
  process.env.OCTOPUS_GUIDED_BROWSER = "1";
  try {
    await page.setContent(
      `<section id="orders"><div role="row"><span role="cell">42</span><mat-icon onclick="document.querySelector('#items').hidden=false">keyboard_arrow_down</mat-icon></div><div id="items" hidden><div role="table"><span role="columnheader">Ilość</span><span>F7P — 3 sztuki</span></div></div></section>`,
    );
    const opened: string[] = [];
    const data = {
      panel: async (node: string) => {
        opened.push(node);
        return page.locator("#orders");
      },
    } as unknown as CopyData;
    await showCopyApiPreview(data, "LO", "42");
    await expect(page.locator("#items")).toBeVisible();
    expect(opened).toEqual(["LO"]);
    expect(page.context().pages()).toHaveLength(1);
  } finally {
    for (const [index, key] of ["OCTOPUS_GUIDED_API", "OCTOPUS_GUIDED_BROWSER"].entries()) {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }
  }
});
