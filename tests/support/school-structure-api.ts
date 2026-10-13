import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";
import type { AuthSession } from "../../scripts/auth.mjs";
import type { StructureSchool } from "./school-structure";

export type StructureNode = {
  id: number;
  institutionUnitId: number;
  institutionRelationId: number;
  institutionRelationTypeId: number | null;
  name: string;
  children: StructureNode[];
};

export class StructureApi {
  private readonly headers: { Authorization: string };
  readonly userId: number;
  private readonly units = new Map<string, number>();
  private readonly knownRelations = new Set<number>();
  private readonly knownKinds = new Map<number, number>();

  constructor(
    private readonly request: APIRequestContext,
    auth: AuthSession,
  ) {
    const storage = auth.storageState.origins.find(
      (entry) => entry.origin === auth.session.origin,
    )?.localStorage;
    const value = (name: string) => {
      const raw = storage?.find((entry) => entry.name === name)?.value;
      if (!raw) throw new Error(`Brak ${name} w sesji testowej.`);
      try {
        return String(JSON.parse(raw));
      } catch {
        return raw;
      }
    };
    this.headers = { Authorization: `Bearer ${value("token").replace(/^Bearer\s+/i, "")}` };
    this.userId = Number(value("id"));
    expect(Number.isSafeInteger(this.userId) && this.userId > 0).toBe(true);
  }

  async get(path: string) {
    const response = await this.request.get(path, { headers: this.headers });
    expect(response.ok(), `GET ${path.split("?")[0]}: ${response.status()}`).toBe(true);
    return response;
  }

  async resolve(schools: StructureSchool[]) {
    for (const school of schools) {
      const filterModel = JSON.stringify({
        institutionIds: [school.id],
        saveSearchHistory: false,
        page: 1,
        userId: this.userId,
        limit: 10,
      });
      const response = await this.get(
        `/api/InstitutionBrowser/GetInstitutions?filterModel=${encodeURIComponent(filterModel)}`,
      );
      const body = (await response.json()) as {
        data: Array<{
          id: number;
          name: string;
          institutionUnitId: number;
          isDel: boolean;
          typeId: number;
          institutionTypeId: number;
        }>;
      };
      expect(body.data).toHaveLength(1);
      expect(String(body.data[0].id)).toBe(school.id);
      expect(body.data[0].name).toBe(school.name);
      expect(school.name).toMatch(/^AUTO_STR_/);
      expect(body.data[0].isDel).toBe(false);
      expect(
        Number.isSafeInteger(body.data[0].typeId) && body.data[0].typeId > 0,
        "Szkoła referencyjna musi mieć przypisany typ",
      ).toBe(true);
      this.units.set(school.id, body.data[0].institutionUnitId);
    }
  }

  unit(school: StructureSchool) {
    const unit = this.units.get(school.id);
    if (!unit) throw new Error(`Nie rozwiązano testowej szkoły ${school.id}.`);
    return unit;
  }

  registerInactive(school: StructureSchool) {
    expect(school.name).toMatch(/^AUTO_STR_.*_NIEAKTYWNA$/);
    expect(
      Number.isSafeInteger(school.institutionUnitId) && (school.institutionUnitId ?? 0) > 0,
    ).toBe(true);
    this.units.set(school.id, school.institutionUnitId!);
  }

  async tree(school: StructureSchool): Promise<StructureNode[]> {
    const response = await this.get(
      `/api/Institution/GetInstitutionRelations?institutionUnitId=${this.unit(school)}`,
    );
    return (await response.json()) as StructureNode[];
  }

  async attempt(
    parent: StructureSchool,
    child: StructureSchool,
    type: number,
    extra: Record<string, unknown> = {},
  ) {
    return this.request.post("/api/Institution/AddOrUpdateInstitutionRelations", {
      headers: this.headers,
      data: [
        {
          institutionRelationId: null,
          sourceInstitutionUnitId: this.unit(parent),
          linkedInstitutionUnitId: this.unit(child),
          institutionRelationTypeId: type,
          createdBy: this.userId,
          ...extra,
        },
      ],
    });
  }

  async attemptMany(
    relations: Array<{ parent: StructureSchool; child: StructureSchool; type: number }>,
  ) {
    return this.request.post("/api/Institution/AddOrUpdateInstitutionRelations", {
      headers: this.headers,
      data: relations.map((relation) => ({
        institutionRelationId: null,
        sourceInstitutionUnitId: this.unit(relation.parent),
        linkedInstitutionUnitId: this.unit(relation.child),
        institutionRelationTypeId: relation.type,
        createdBy: this.userId,
      })),
    });
  }

  async seed(parent: StructureSchool, child: StructureSchool, type: number) {
    const response = await this.attempt(parent, child, type);
    expect(response.ok(), `Seed relacji: ${response.status()}`).toBe(true);
    expect(await response.json()).toMatchObject({ codeResult: 204 });
    const relation = this.edges(await this.tree(parent)).find(
      (edge) => edge.parent === this.unit(parent) && edge.child === this.unit(child),
    );
    expect(relation, "Zapisana relacja powinna istnieć w aktywnym drzewie").toBeDefined();
    this.knownRelations.add(relation!.id);
    this.knownKinds.set(relation!.id, type);
    return relation!.id;
  }

  edges(nodes: StructureNode[]) {
    const edges: Array<{ id: number; parent: number; child: number; type: number | null }> = [];
    const visit = (node: StructureNode) => {
      for (const child of node.children ?? []) {
        edges.push({
          id: child.institutionRelationId,
          parent: node.institutionUnitId,
          child: child.institutionUnitId,
          type: child.institutionRelationTypeId,
        });
        visit(child);
      }
    };
    for (const node of nodes) visit(node);
    return edges;
  }

  async reject(response: APIResponse) {
    const text = await response.text();
    let body: { codeResult?: number } = {};
    try {
      body = JSON.parse(text) as { codeResult?: number };
    } catch {
      /* HTTP status wystarcza dla odpowiedzi bez JSON. */
    }
    const expectedStatus = [400, 404, 409, 422].includes(response.status());
    expect(
      expectedStatus ||
        (response.status() === 200 && [400, 404, 409, 422].includes(body.codeResult ?? 0)),
      `Walidacja powinna odrzucić zapis, HTTP ${response.status()}, odpowiedź: ${text.slice(0, 300)}`,
    ).toBe(true);
  }

  private async remove(id: number) {
    expect(Number.isSafeInteger(id) && id > 0).toBe(true);
    const response = await this.request.delete(
      `/api/Institution/DeleteInstitutionsRelation?institutionRelationId=${id}&userId=${this.userId}`,
      { headers: this.headers },
    );
    expect(response.ok(), `Cleanup relacji ${id}: ${response.status()}`).toBe(true);
  }

  async deactivate(id: number) {
    expect(
      this.knownRelations.has(id),
      "Można usunąć wyłącznie relację przygotowaną przez test",
    ).toBe(true);
    await this.remove(id);
    this.knownRelations.delete(id);
    this.knownKinds.delete(id);
  }

  acknowledgeDeleted(id: number) {
    this.knownRelations.delete(id);
    this.knownKinds.delete(id);
  }

  async cleanup(schools: StructureSchool[]) {
    // Najpierw usuwamy znane krawędzie. To rozrywa także ewentualny cykl,
    // jeżeli wadliwy backend zaakceptował negatywny przypadek testowy.
    // W pierwszej kolejności rozpinamy wielobudynkowość, aby nie blokowała
    // sprzątania pozostałych relacji szkoły będącej dodatkową lokalizacją.
    const known = [...this.knownRelations].sort(
      (left, right) =>
        Number(this.knownKinds.get(right) === 3) - Number(this.knownKinds.get(left) === 3),
    );
    for (const id of known) await this.remove(id);
    this.knownRelations.clear();
    this.knownKinds.clear();
    const allowedUnits = new Set(this.units.values());
    const remaining = new Set<number>();
    for (const school of schools) {
      for (const edge of this.edges(await this.tree(school))) {
        expect(
          allowedUnits.has(edge.parent) && allowedUnits.has(edge.child),
          "Cleanup może dotyczyć wyłącznie rozwiązanych szkół AUTO_STR",
        ).toBe(true);
        if (edge.id > 0) remaining.add(edge.id);
      }
    }
    for (const id of remaining) await this.remove(id);
    for (const school of schools) expect(this.edges(await this.tree(school))).toHaveLength(0);
  }
}
