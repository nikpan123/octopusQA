// Preserve cell boundaries: row.textContent merges quantities and dates.
export async function readOrderHistoryRows(dialog) {
  return dialog
    .getByRole("row")
    .evaluateAll((rows) =>
      rows
        .map((row) =>
          Array.from(row.querySelectorAll('td, [role="gridcell"], [role="cell"]')).map((cell) =>
            (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
          ),
        )
        .filter((cells) => cells.length > 0),
    );
}

export function hasDatedOrderHistory(rows) {
  return rows.some(
    (cells) =>
      cells.length === 3 && /^(?:\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})(?:\s|$)/.test(cells[2]),
  );
}
