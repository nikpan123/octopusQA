export function applyConfirmationOverrides<T extends { rows: Array<{ key: string }> }>(
  matrix: T,
  overrides: {
    notes?: string[];
    rows: Record<
      string,
      { giftId?: number; giftCode?: string; orderCode?: string; orderClassLevel?: number }
    >;
  },
): Omit<T, "rows"> & {
  corrections: string[];
  rows: Array<T["rows"][number] & { orderClassLevel?: number }>;
};
