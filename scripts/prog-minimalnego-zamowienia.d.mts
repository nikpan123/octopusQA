export const SCHOOL_KINDS: readonly ["SP", "PRZEDSZKOLE", "NPC", "SREDNIA"];
export const ORDER_FORMS: readonly ["CYFROWY", "WYSYLKA"];

export function calculatePercentageThreshold(studentCount: number): number;

export function calculateThreshold(
  schoolKind: "SP" | "PRZEDSZKOLE" | "NPC" | "SREDNIA",
  form: "CYFROWY" | "WYSYLKA",
  studentCount: number | null | undefined,
): number | null;
