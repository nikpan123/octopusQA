export type SchoolOrderDbRow = { id: number; schoolId: number; isDel: boolean; isCopied: boolean };
export function validateDbConfiguration(env?: Record<string, string | undefined>): void;
export function validateSqlId(value: string | number): number;
export function probeSchoolOrderDatabase(): Promise<{
  database: string;
  columns: Array<{ schema: string; name: string; type: string }>;
}>;
export function readSchoolOrder(
  orderId: string | number,
  schoolId: string | number,
): Promise<SchoolOrderDbRow | null>;
