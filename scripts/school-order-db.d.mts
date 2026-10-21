export type SchoolOrderDbRow = { id: number; schoolId: number; isDel: boolean; isCopied: boolean };
export function validateDbConfiguration(env?: Record<string, string | undefined>): void;
export function findHistoricalOrders(requireHistory?: boolean): Promise<
  Array<
    SchoolOrderDbRow & {
      isCanceled: boolean;
      historyProductId: number | null;
      createdBy: number;
      createdAt: string;
      cmsOrderSymbol: string;
      salesOrderSymbol: string;
    }
  >
>;
export type HistoricalOrder = SchoolOrderDbRow & {
  isCanceled: boolean;
  createdBy: number;
  createdAt: string;
  cmsOrderSymbol: string;
  salesOrderSymbol: string;
  actor: string;
};
export function readHistoricalOrder(
  orderId: string | number,
  schoolId: string | number,
): Promise<HistoricalOrder>;
export function findStatusAudit(): Promise<
  Array<{
    id: number;
    schoolId: number;
    field: string;
    value: string;
    changedAt: string;
    actor: string;
  }>
>;
export function validateSqlId(value: string | number): number;
export function probeSchoolOrderDatabase(): Promise<{
  database: string;
  columns: Array<{ schema: string; name: string; type: string }>;
}>;
export function readSchoolOrder(
  orderId: string | number,
  schoolId: string | number,
): Promise<SchoolOrderDbRow | null>;
