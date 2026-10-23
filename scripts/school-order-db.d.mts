export type SchoolOrderDbRow = { id: number; schoolId: number; isDel: boolean; isCopied: boolean };
export function validateDbConfiguration(env?: Record<string, string | undefined>): void;
export type CopyEvidence = {
  sourceId: number;
  sourceSchoolId: number;
  copyId: number;
  copySchoolId: number;
  productId?: number;
  sourceDeleted: boolean;
  sourceCanceled: boolean;
  copyDeleted: boolean;
  copyMarked: boolean;
  copyCanceled: boolean;
  sourceCmsSymbol: string;
  sourceSalesSymbol: string;
  copyCmsSymbol: string;
  copySalesSymbol: string;
  sourceCreatedAt: string;
  copyCreatedAt: string;
  typeSymbol: string;
  typeDescription: string;
  sourceStatusAuditCount: number;
};
export function readCopyEvidence(
  action: "DocumentTypes",
): Promise<Array<{ id: number; symbol: string; description: string }>>;
export function readCopyEvidence(
  action: "FindCopyHistory" | "FindCopyStates" | "ReadCopyPair",
  orderId?: number,
  schoolId?: number,
): Promise<CopyEvidence[]>;
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
