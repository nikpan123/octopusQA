import type { Page } from '@playwright/test';
export function validateTeacherRun(run: Record<string, string>): void;
export function deleteTestTeacher(page: Page, run: Record<string, string>): Promise<string>;
export function cleanupSuccessfulTeacher(page: Page, run: Record<string, string>, save: () => Promise<void>): Promise<void>;
