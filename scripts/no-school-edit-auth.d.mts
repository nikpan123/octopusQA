import type { AuthSession } from "./auth.mjs";
export function noSchoolEditSession(): Promise<AuthSession & { userId: number }>;
