import type { Locator } from "@playwright/test";
export function readOrderHistoryRows(dialog: Locator): Promise<string[][]>;
export function hasDatedOrderHistory(rows: string[][]): boolean;
