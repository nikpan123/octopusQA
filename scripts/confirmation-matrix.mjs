// Keep user corrections separate from the original workbook extraction.
export function applyConfirmationOverrides(matrix, overrides) {
  const keys = new Set(matrix.rows.map((row) => row.key));
  for (const key of Object.keys(overrides.rows))
    if (!keys.has(key)) throw new Error(`Korekta odnosi się do nieznanego wiersza: ${key}`);
  return {
    ...matrix,
    corrections: overrides.notes ?? [],
    rows: matrix.rows.map((row) => ({ ...row, ...overrides.rows[row.key] })),
  };
}
