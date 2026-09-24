import type { Page } from "@playwright/test";
type CleanupOptions = { includeFailed?: boolean };
export function validateTeacherRun(run: Record<string, string>, options?: CleanupOptions): void;
export function deleteTestTeacher(page: Page, run: Record<string, string>): Promise<string>;
export function cleanupSuccessfulTeacher(
  page: Page,
  run: Record<string, string>,
  save: () => Promise<void>,
): Promise<void>;
export function cleanupTeacherRecords(
  dir: string,
  selected: Array<{ name: string; run: Record<string, string> }>,
  options?: CleanupOptions,
): Promise<void>;
export function cleanupTeacherBatch(
  page: Page,
  selected: Array<{ name: string; run: Record<string, string> }>,
  save: (entry: { name: string; run: Record<string, string> }) => Promise<void>,
  options?: CleanupOptions,
): Promise<void>;
