export type GiftRecalculation = {
  schoolId: string | number;
  schoolName: string;
  userId: string | number;
  teacherId: string | number;
} & ({ action: "School"; orderId: string | number } | { action: "Form"; formId: string | number });
export function validateGiftRecalculation(input: GiftRecalculation): void;
export function recalculateTestGifts(input: GiftRecalculation): Promise<{
  database: string;
  action: "School" | "Form";
  schoolId: number;
  teacherId: number;
  targetId: number;
}>;
