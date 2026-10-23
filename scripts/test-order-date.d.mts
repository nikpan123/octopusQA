export type TestOrderDate = {
  orderId: string;
  schoolId: string;
  userId: number;
  schoolName: string;
  date: string;
  purpose?: "potw26" | "new-client-history";
};
export function validateTestOrderDate(input: TestOrderDate): void;
export function resolveOrderDatePowerShell(
  env?: Record<string, string | undefined>,
  exists?: (path: string) => boolean,
): string;
export function setTestOrderDate(
  input: TestOrderDate,
): Promise<{ orderId: number; schoolId: number; date: string }>;
