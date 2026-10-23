export function shortTestToken(identity: string): string;
export function automaticTeacherName(identity: string): string;
export function automaticSchoolPrefix(family: string, environment: "dev" | "test"): string;
export function automaticSchoolName(
  family: string,
  role: string,
  environment: "dev" | "test",
  scope?: string,
): string;
export function automaticCategorySchoolName(key: string, environment: "dev" | "test"): string;
export function entitlementSchoolPattern(environment: "dev" | "test", unmarked?: boolean): RegExp;
export function isAutomaticRecordName(name: string): boolean;
export function isPackageOrderSchool(name: string): boolean;
export function isNewClientHistorySchool(name: string): boolean;
