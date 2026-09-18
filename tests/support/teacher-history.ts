import { expect, type Page } from '@playwright/test';

/*
 * =========================================================
 * HISTORIA ZMIAN
 * =========================================================
 */

export function teacherHistory(page: Page) {
  return page.getByRole('tabpanel', {
    name: 'Historia zmian',
    exact: true,
  });
}

export async function openTeacherHistory(page: Page) {
  await page
    .getByRole('tab', {
      name: 'Historia zmian',
      exact: true,
    })
    .click();

  const history = teacherHistory(page);

  await expect(history).toBeVisible();

  return history;
}

export async function expectTeacherHistoryChange(page: Page, field: string, value: string) {
  const history = await openTeacherHistory(page);

  const row = history
    .getByRole('row')
    .filter({
      has: page.getByRole('gridcell', {
        name: field,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole('gridcell', {
        name: value,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole('gridcell', {
        name: 'Edycja danych',
        exact: true,
      }),
    });

  await expect(row).toHaveCount(1);

  await expect(row).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

  await expect(row.getByRole('gridcell').nth(2)).not.toHaveText('');

  return row;
}

export async function teacherHistorySnapshot(page: Page) {
  const history = await openTeacherHistory(page);

  return history.getByRole('row').allTextContents();
}

export async function expectTeacherHistorySnapshot(page: Page, expectedRows: string[]) {
  const history = await openTeacherHistory(page);

  await expect(history.getByRole('row')).toHaveText(expectedRows);
}
