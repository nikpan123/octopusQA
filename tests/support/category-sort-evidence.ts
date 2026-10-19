import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { categorySortRows, type SchoolCategory } from "./school-category";

export type ExpectedCategoryRow = { id: string; category: SchoolCategory };

export async function verifyCategorySort(
  page: Page,
  results: Locator,
  header: Locator,
  column: string,
  direction: "ascending" | "descending",
  expected: ExpectedCategoryRow[],
  info: TestInfo,
  label: string,
) {
  const before = await categorySortRows(results, column);
  const previousDirection = await header.getAttribute("aria-sort");
  let clicks = 0;
  try {
    for (; clicks < 3 && (await header.getAttribute("aria-sort")) !== direction; clicks++) {
      await header.click();
    }
    await expect(header, "Nagłówek wskazuje żądany kierunek").toHaveAttribute(
      "aria-sort",
      direction,
    );
    await expect
      .poll(
        async () =>
          (await categorySortRows(results, column)).map(({ id, category }) => ({ id, category })),
        { message: "Rzeczywista kolejność ID i kategorii odpowiada kierunkowi sortowania" },
      )
      .toEqual(expected);
  } finally {
    await info.attach(`Redmine-37203-${label}-dane`, {
      body: JSON.stringify(
        {
          issue: 37203,
          expectedDirection: direction,
          previousDirection,
          observedDirection: await header.getAttribute("aria-sort"),
          clicks,
          before,
          expected,
          actual: await categorySortRows(results, column),
          rowOrderSource:
            "AG Grid row-index; wiersze nie są sortowane po kategorii w kodzie odczytu",
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    await info.attach(`Redmine-37203-${label}-ekran`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  }
}
