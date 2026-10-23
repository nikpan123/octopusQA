import type { APIRequestContext } from "@playwright/test";
export type FixtureDefinition = {
  id?: string;
  name: string;
  type: string;
  count?: number;
  rspo?: string;
};
export type FixtureSchool = {
  id: string;
  name: string;
  institutionUnitId: number;
  typeId: number;
  tested: boolean;
  quantityOfStudents: number | null;
};
export class FixtureSchoolsApi {
  constructor(
    request: APIRequestContext,
    config: { baseURL: string; headers: Record<string, string>; userId: number },
  );
  findMany(definitions: FixtureDefinition[]): Promise<Array<FixtureSchool | null>>;
  reference(definition: {
    name: string;
    city: string;
  }): Promise<{ id: string; name: string; city: string }>;
}
