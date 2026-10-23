// The school threshold already includes the 60% coefficient.
export function minimumGiftOrder({ schoolThreshold, historical = false, missingStudents = false }) {
  if (historical) return 10;
  // Workbook A88 defines the fallback when a student count is unavailable.
  if (missingStudents) return 10;
  if (!Number.isInteger(schoolThreshold) || schoolThreshold < 1)
    throw new Error("Reguła gratisu wymaga dodatniej całkowitej wartości pola Próg.");
  // "Nie mniej niż 5 szt." includes exactly five copies.
  return Math.max(5, schoolThreshold);
}
